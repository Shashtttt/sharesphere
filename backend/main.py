import os
import datetime
import random
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc

from backend.database import get_db, Base, engine
from backend.models import (
    User, Institution, Qualification, UserQualification,
    Resource, Booking, CheckInRecord, ReturnRecord, Incident,
    AuditEvent, Notification
)
from backend.auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, get_optional_current_user, require_roles
)
from backend.schemas import (
    UserRegister, UserLogin, UserOut, TokenOut,
    QualificationOut, UserQualificationOut, UserQualificationCreate,
    ResourceCreate, ResourceUpdate, ResourceOut,
    BookingCreate, BookingReviewAction, BookingCancelRequest, BookingOut,
    CheckInCreate, CheckInConfirm, CheckInOut,
    ReturnCreate, ReturnConfirm, ReturnOut,
    IncidentCreate, IncidentUpdate, IncidentOut,
    AuditEventOut, NotificationOut,
    ExplainableMatchRequest, ExplainableMatchResponse,
    ExplainableRecommendationItem
)
from backend.state_machine import (
    record_audit_event, send_notification, check_user_eligibility,
    check_booking_conflicts, check_user_fair_allocation,
    transition_booking_state, promote_waitlist_if_applicable
)
from backend.ai_matcher import analyze_and_match_resources, parse_natural_language_search
from backend.seed import seed_database

# Initialize database tables and seed if empty
Base.metadata.create_all(bind=engine)
try:
    seed_database()
except Exception as e:
    print(f"[WARN] Startup seed check: {e}")

app = FastAPI(
    title="ShareSphere API",
    description="Trusted Resource Sharing & Accountability Platform for Labs, Equipment & Spaces",
    version="1.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- Health & Demo Accounts -----------------

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ShareSphere API",
        "version": "1.0.0",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

@app.get("/api/demo/accounts")
def get_demo_accounts(db: Session = Depends(get_db)):
    """
    Returns clearly labelled demo accounts for 1-click login and judge demonstration.
    """
    demo_users = [
        {
            "email": "borrower1@sharesphere.edu",
            "password": "demo1234",
            "role": "borrower",
            "name": "Dr. Maya Lin",
            "title": "Certified Senior Researcher",
            "badges": ["Laser Safety L2 Verified", "Cleanroom ISO 6 Verified"],
            "scenario": "Can book laser cutters and high-spec lab instruments immediately. Has active checked-in oscilloscope."
        },
        {
            "email": "borrower2@sharesphere.edu",
            "password": "demo1234",
            "role": "borrower",
            "name": "Alex Chen",
            "title": "Undergraduate Student",
            "badges": ["General Safety Only", "Missing Laser L2"],
            "scenario": "Test restriction checks: Cannot book restricted laser without certification. Holds waitlist position #1."
        },
        {
            "email": "owner1@sharesphere.edu",
            "password": "demo1234",
            "role": "owner",
            "name": "Prof. Marcus Vance",
            "title": "Lab Director & Equipment Owner",
            "badges": ["Resource Owner", "7 Listed Assets"],
            "scenario": "Manage inventory, review pending reservations, sign off on handovers, and review damage discrepancy reports."
        },
        {
            "email": "manager1@sharesphere.edu",
            "password": "demo1234",
            "role": "manager",
            "name": "Dr. Sarah Jenkins",
            "title": "Dean of Research Facilities",
            "badges": ["Institutional Manager", "Dispute Arbiter"],
            "scenario": "Institutional overview, fair-use analytics, resolve escalated incidents, and audit compliance logs."
        },
        {
            "email": "admin1@sharesphere.edu",
            "password": "demo1234",
            "role": "admin",
            "name": "System Administrator",
            "title": "Platform Administrator",
            "badges": ["Full System Audit", "Admin Access"],
            "scenario": "Global audit trail inspection, user management, and system-wide setting configurations."
        }
    ]
    return demo_users

# ----------------- Authentication -----------------

@app.post("/api/auth/register", response_model=TokenOut)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists"
        )
    
    # Enforce safe role assignment: Manager and admin cannot be chosen via public registration
    assigned_role = "borrower"
    if user_in.role in ["borrower", "owner"]:
        assigned_role = user_in.role
    
    default_inst = db.query(Institution).first()
    inst_id = default_inst.id if default_inst else None

    new_user = User(
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
        role=assigned_role,
        department=user_in.department,
        phone=user_in.phone,
        institution_id=inst_id,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    record_audit_event(
        db=db,
        event_type="USER_REGISTERED",
        actor=new_user,
        summary=f"New user registered: {new_user.full_name} ({new_user.email}) as role '{new_user.role}'.",
        details={"role": new_user.role, "department": new_user.department}
    )
    db.commit()

    token = create_access_token({"sub": str(new_user.id), "role": new_user.role})
    return {"access_token": token, "token_type": "bearer", "user": new_user}

@app.post("/api/auth/login", response_model=TokenOut)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password credentials"
        )
    
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user}

@app.get("/api/auth/me", response_model=UserOut)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user

# ----------------- Qualifications & Safety -----------------

@app.get("/api/qualifications", response_model=List[QualificationOut])
def list_qualifications(db: Session = Depends(get_db)):
    return db.query(Qualification).all()

@app.get("/api/qualifications/my", response_model=List[UserQualificationOut])
def get_my_qualifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return (
        db.query(UserQualification)
        .filter(UserQualification.user_id == current_user.id)
        .all()
    )

@app.post("/api/qualifications/request", response_model=UserQualificationOut)
def request_qualification_verification(
    data: UserQualificationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    qual = db.query(Qualification).filter(Qualification.code == data.qualification_code).first()
    if not qual:
        raise HTTPException(status_code=404, detail="Qualification code not found")
    
    # Check if already exists
    existing = db.query(UserQualification).filter(
        UserQualification.user_id == current_user.id,
        UserQualification.qualification_id == qual.id
    ).first()
    if existing:
        return existing

    user_qual = UserQualification(
        user_id=current_user.id,
        qualification_id=qual.id,
        status="pending_verification",
        document_ref=data.document_ref or f"DOC-REQ-{random.randint(1000, 9999)}.pdf",
        verification_notes="Submitted by user for institutional review.",
        issued_at=datetime.datetime.utcnow()
    )
    db.add(user_qual)

    record_audit_event(
        db=db,
        event_type="QUALIFICATION_SUBMITTED",
        actor=current_user,
        summary=f"User {current_user.full_name} submitted verification request for '{qual.name}'.",
        details={"qualification_code": qual.code}
    )
    db.commit()
    db.refresh(user_qual)
    return user_qual

@app.post("/api/qualifications/{id}/verify")
def verify_qualification(
    id: int,
    action: str = Query("approve", enum=["approve", "reject"]),
    notes: Optional[str] = None,
    current_user: User = Depends(require_roles(["manager", "admin"])),
    db: Session = Depends(get_db)
):
    uq = db.query(UserQualification).filter(UserQualification.id == id).first()
    if not uq:
        raise HTTPException(status_code=404, detail="User qualification record not found")
    
    now = datetime.datetime.utcnow()
    if action == "approve":
        uq.status = "verified"
        uq.verified_by_id = current_user.id
        uq.verification_notes = notes or f"Verified by {current_user.full_name}."
        uq.expires_at = now + datetime.timedelta(days=uq.qualification.validity_days)
    else:
        uq.status = "rejected"
        uq.verification_notes = notes or "Verification document insufficient or unverified."

    record_audit_event(
        db=db,
        event_type="QUALIFICATION_VERIFIED",
        actor=current_user,
        summary=f"Qualification '{uq.qualification.name}' {action}d for user ID {uq.user_id} by {current_user.full_name}.",
        details={"status": uq.status, "notes": notes}
    )

    send_notification(
        db=db,
        user_id=uq.user_id,
        title=f"Qualification Status: {uq.status.capitalize()}",
        message=f"Your qualification '{uq.qualification.name}' is now {uq.status}.",
        type="success" if action == "approve" else "warning"
    )

    db.commit()
    return {"status": uq.status, "message": f"Qualification updated to {uq.status}"}

# ----------------- Resources -----------------

@app.get("/api/resources", response_model=List[ResourceOut])
def list_resources(
    category: Optional[str] = None,
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Resource).filter(
        Resource.is_published == True,
        Resource.is_archived == False
    )

    if category and category != "All":
        query = query.filter(Resource.category == category)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Resource.title.ilike(search_term),
                Resource.description.ilike(search_term),
                Resource.building.ilike(search_term),
                Resource.room_location.ilike(search_term)
            )
        )
    
    if status_filter:
        query = query.filter(Resource.condition_status == status_filter)

    return query.order_by(Resource.id.asc()).all()

@app.get("/api/resources/{id}", response_model=ResourceOut)
def get_resource_details(id: int, db: Session = Depends(get_db)):
    res = db.query(Resource).filter(Resource.id == id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found")
    return res

@app.get("/api/resources/{id}/availability")
def get_resource_availability(id: int, db: Session = Depends(get_db)):
    res = db.query(Resource).filter(Resource.id == id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    # Return all approved / active bookings for the resource
    active_bookings = (
        db.query(Booking)
        .filter(
            Booking.resource_id == id,
            Booking.status.in_(["approved", "checked_in", "return_pending"])
        )
        .all()
    )
    
    return {
        "resource_id": res.id,
        "title": res.title,
        "operating_hours": res.availability_schedule,
        "min_duration_hours": res.min_duration_hours,
        "max_duration_hours": res.max_duration_hours,
        "booked_slots": [
            {
                "booking_code": b.booking_code,
                "start_time": b.start_time.isoformat(),
                "end_time": b.end_time.isoformat(),
                "status": b.status
            }
            for b in active_bookings
        ]
    }

@app.post("/api/resources", response_model=ResourceOut)
def create_resource(
    res_in: ResourceCreate,
    current_user: User = Depends(require_roles(["owner", "manager", "admin", "borrower"])),
    db: Session = Depends(get_db)
):
    resource = Resource(
        title=res_in.title,
        description=res_in.description,
        category=res_in.category,
        resource_type=res_in.resource_type,
        owner_id=current_user.id,
        institution_id=current_user.institution_id,
        building=res_in.building,
        room_location=res_in.room_location,
        image_url=res_in.image_url or "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
        availability_schedule=res_in.availability_schedule or {"days": ["Mon", "Tue", "Wed", "Thu", "Fri"], "hours": "08:00 - 20:00"},
        min_duration_hours=res_in.min_duration_hours,
        max_duration_hours=res_in.max_duration_hours,
        max_booking_frequency_per_week=res_in.max_booking_frequency_per_week,
        usage_rules=res_in.usage_rules,
        required_qualifications=res_in.required_qualifications,
        membership_required=res_in.membership_required,
        supervision_required=res_in.supervision_required,
        security_deposit=res_in.security_deposit,
        cancellation_policy=res_in.cancellation_policy,
        condition_status=res_in.condition_status,
        approval_required=res_in.approval_required,
        is_published=True
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)

    record_audit_event(
        db=db,
        event_type="RESOURCE_CREATED",
        actor=current_user,
        resource_id=resource.id,
        summary=f"Resource '{resource.title}' ({resource.category}) listed by {current_user.full_name}.",
        details={"category": resource.category, "required_qualifications": resource.required_qualifications}
    )
    db.commit()
    return resource

@app.put("/api/resources/{id}", response_model=ResourceOut)
def update_resource(
    id: int,
    res_in: ResourceUpdate,
    current_user: User = Depends(require_roles(["owner", "manager", "admin"])),
    db: Session = Depends(get_db)
):
    res = db.query(Resource).filter(Resource.id == id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    # Check ownership unless manager or admin
    if current_user.role == "owner" and res.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit resources you own")
    
    update_data = res_in.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(res, field, val)
    
    res.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(res)

    record_audit_event(
        db=db,
        event_type="RESOURCE_UPDATED",
        actor=current_user,
        resource_id=res.id,
        summary=f"Resource '{res.title}' updated by {current_user.full_name}.",
        details=update_data
    )
    db.commit()
    return res

@app.delete("/api/resources/{id}")
def archive_resource(
    id: int,
    current_user: User = Depends(require_roles(["owner", "manager", "admin"])),
    db: Session = Depends(get_db)
):
    res = db.query(Resource).filter(Resource.id == id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    if current_user.role == "owner" and res.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only archive your own resources")

    res.is_archived = True
    res.is_published = False
    
    record_audit_event(
        db=db,
        event_type="RESOURCE_ARCHIVED",
        actor=current_user,
        resource_id=res.id,
        summary=f"Resource '{res.title}' archived by {current_user.full_name}."
    )
    db.commit()
    return {"message": f"Resource '{res.title}' successfully archived"}

# ----------------- Bookings & Workflow State Machine -----------------

@app.post("/api/bookings", response_model=BookingOut)
def create_booking(
    booking_in: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    res = db.query(Resource).filter(Resource.id == booking_in.resource_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    if not res.is_published or res.is_archived:
        raise HTTPException(status_code=400, detail="Resource is not available for booking")

    if res.condition_status == "maintenance":
        raise HTTPException(status_code=400, detail="Resource is currently under maintenance")

    # Time validation
    if booking_in.start_time >= booking_in.end_time:
        raise HTTPException(status_code=400, detail="Booking start time must be before end time")
    
    duration_hours = (booking_in.end_time - booking_in.start_time).total_seconds() / 3600.0
    if duration_hours < res.min_duration_hours:
        raise HTTPException(status_code=400, detail=f"Booking duration must be at least {res.min_duration_hours} hour(s)")
    if duration_hours > res.max_duration_hours:
        raise HTTPException(status_code=400, detail=f"Booking duration exceeds maximum allowed {res.max_duration_hours} hour(s)")

    # Fair Allocation Rule: Check rolling week limit & active bookings limit
    allowed, limit_msg = check_user_fair_allocation(db, current_user.id, res)
    if not allowed:
        raise HTTPException(status_code=400, detail=limit_msg)

    # 1. Eligibility Check
    is_eligible, missing_quals, pending_quals = check_user_eligibility(db, current_user, res)
    initial_status = "pending_approval"
    queue_pos = None

    if not is_eligible:
        if missing_quals:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Eligibility check failed: You are missing mandatory verified qualifications: {', '.join(missing_quals)}. Please request qualification verification first."
            )
        elif pending_quals:
            initial_status = "pending_eligibility"

    # 2. Schedule Conflict Check
    has_conflict = check_booking_conflicts(db, res.id, booking_in.start_time, booking_in.end_time)
    if has_conflict:
        # Transparent waiting list placement
        initial_status = "waitlisted"
        existing_waitlist_count = db.query(Booking).filter(
            Booking.resource_id == res.id,
            Booking.status == "waitlisted"
        ).count()
        queue_pos = existing_waitlist_count + 1

    # If resource requires no manual approval and has no conflict
    if not res.approval_required and initial_status == "pending_approval":
        initial_status = "approved"

    # Generate unique booking code
    code = f"BK-{datetime.datetime.utcnow().strftime('%Y')}-{random.randint(1000, 9999)}"

    new_booking = Booking(
        booking_code=code,
        resource_id=res.id,
        borrower_id=current_user.id,
        start_time=booking_in.start_time,
        end_time=booking_in.end_time,
        purpose=booking_in.purpose,
        status=initial_status,
        queue_position=queue_pos
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)

    # Record Audit Event
    record_audit_event(
        db=db,
        event_type="BOOKING_SUBMITTED",
        actor=current_user,
        resource_id=res.id,
        booking_id=new_booking.id,
        summary=f"Booking #{new_booking.booking_code} submitted for '{res.title}' with initial status '{initial_status}'.",
        details={
            "status": initial_status,
            "duration_hours": duration_hours,
            "queue_position": queue_pos
        }
    )

    # Send Notification to Owner
    send_notification(
        db=db,
        user_id=res.owner_id,
        title=f"New Booking Request #{new_booking.booking_code}",
        message=f"{current_user.full_name} submitted a booking request for '{res.title}' ({initial_status}).",
        type="info",
        resource_id=res.id,
        booking_id=new_booking.id
    )

    db.commit()
    return new_booking

@app.get("/api/bookings/my", response_model=List[BookingOut])
def get_my_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return (
        db.query(Booking)
        .filter(Booking.borrower_id == current_user.id)
        .order_by(Booking.created_at.desc())
        .all()
    )

@app.get("/api/bookings/manage", response_model=List[BookingOut])
def get_manageable_bookings(
    current_user: User = Depends(require_roles(["owner", "manager", "admin"])),
    db: Session = Depends(get_db)
):
    if current_user.role in ["manager", "admin"]:
        # Manager/admin sees all institutional bookings
        return db.query(Booking).order_by(Booking.created_at.desc()).all()
    else:
        # Owner sees bookings on their owned resources
        return (
            db.query(Booking)
            .join(Resource, Booking.resource_id == Resource.id)
            .filter(Resource.owner_id == current_user.id)
            .order_by(Booking.created_at.desc())
            .all()
        )

@app.get("/api/bookings/{id}", response_model=BookingOut)
def get_booking_details(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Permission check: borrower, resource owner, manager, or admin
    if (booking.borrower_id != current_user.id and 
        booking.resource.owner_id != current_user.id and 
        current_user.role not in ["manager", "admin"]):
        raise HTTPException(status_code=403, detail="Not authorized to view this booking")
    
    return booking

@app.post("/api/bookings/{id}/review", response_model=BookingOut)
def review_booking(
    id: int,
    review: BookingReviewAction,
    current_user: User = Depends(require_roles(["owner", "manager", "admin"])),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if current_user.role == "owner" and booking.resource.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only review bookings for your own resources")

    action_map = {
        "approve": "approved",
        "reject": "rejected",
        "waitlist": "waitlisted"
    }
    target_status = action_map.get(review.action.lower())
    if not target_status:
        raise HTTPException(status_code=400, detail="Invalid review action. Choose approve, reject, or waitlist")

    # If approving, double-check that no overlapping booking was approved in the meantime
    if target_status == "approved":
        conflict = check_booking_conflicts(db, booking.resource_id, booking.start_time, booking.end_time, exclude_booking_id=booking.id)
        if conflict:
            raise HTTPException(status_code=400, detail="Cannot approve: An overlapping booking is already confirmed for this time slot.")

    updated_booking = transition_booking_state(
        db=db,
        booking=booking,
        new_status=target_status,
        actor=current_user,
        reason=review.reason
    )
    return updated_booking

@app.post("/api/bookings/{id}/cancel", response_model=BookingOut)
def cancel_booking(
    id: int,
    cancel_in: BookingCancelRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.borrower_id != current_user.id and current_user.role not in ["owner", "manager", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this booking")

    updated = transition_booking_state(
        db=db,
        booking=booking,
        new_status="cancelled",
        actor=current_user,
        reason=cancel_in.reason or "Cancelled by user"
    )
    return updated

# ----------------- Check-In & Handover Interface -----------------

@app.post("/api/bookings/{id}/check-in", response_model=BookingOut)
def submit_check_in(
    id: int,
    check_in_data: CheckInCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.borrower_id != current_user.id and current_user.role not in ["owner", "manager", "admin"]:
        raise HTTPException(status_code=403, detail="Only borrower or authorized staff can submit check-in")

    if booking.status != "approved":
        raise HTTPException(status_code=400, detail=f"Booking must be in 'approved' status to check in (current status: {booking.status})")

    # Capture server-generated timestamp
    server_now = datetime.datetime.utcnow()

    # Create CheckInRecord
    check_in = CheckInRecord(
        booking_id=booking.id,
        checked_in_at=server_now,
        borrower_confirmed=True,
        owner_confirmed=(current_user.id == booking.resource.owner_id),
        condition_checklist=check_in_data.condition_checklist,
        notes=check_in_data.notes,
        photo_url=check_in_data.photo_url
    )
    db.add(check_in)

    # Transition booking state
    booking.status = "checked_in"
    booking.updated_at = server_now

    record_audit_event(
        db=db,
        event_type="CHECK_IN_CONFIRMED",
        actor=current_user,
        resource_id=booking.resource_id,
        booking_id=booking.id,
        summary=f"Check-in verified for booking #{booking.booking_code}. Initial operational checklist confirmed.",
        details={"checklist": check_in_data.condition_checklist, "notes": check_in_data.notes}
    )

    send_notification(
        db=db,
        user_id=booking.resource.owner_id,
        title=f"Check-In Completed #{booking.booking_code}",
        message=f"{current_user.full_name} has checked in to '{booking.resource.title}'.",
        type="info",
        resource_id=booking.resource_id,
        booking_id=booking.id
    )

    db.commit()
    db.refresh(booking)
    return booking

@app.post("/api/bookings/{id}/check-in-confirm")
def confirm_check_in(
    id: int,
    confirm_data: CheckInConfirm,
    current_user: User = Depends(require_roles(["owner", "manager", "admin"])),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == id).first()
    if not booking or not booking.check_in_record:
        raise HTTPException(status_code=404, detail="Booking or check-in record not found")

    booking.check_in_record.owner_confirmed = True
    if confirm_data.owner_notes:
        booking.check_in_record.notes = (booking.check_in_record.notes or "") + f" [Owner notes: {confirm_data.owner_notes}]"

    record_audit_event(
        db=db,
        event_type="CHECK_IN_OWNER_CONFIRMED",
        actor=current_user,
        resource_id=booking.resource_id,
        booking_id=booking.id,
        summary=f"Owner {current_user.full_name} verified check-in for #{booking.booking_code}."
    )
    db.commit()
    return {"message": "Check-in owner confirmation recorded"}

# ----------------- Return & Condition Report Interface -----------------

@app.post("/api/bookings/{id}/return", response_model=BookingOut)
def submit_return(
    id: int,
    return_data: ReturnCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.borrower_id != current_user.id and current_user.role not in ["owner", "manager", "admin"]:
        raise HTTPException(status_code=403, detail="Only borrower or authorized staff can submit return")

    if booking.status not in ["checked_in", "overdue"]:
        raise HTTPException(status_code=400, detail=f"Booking must be in 'checked_in' or 'overdue' status to initiate return (current: {booking.status})")

    server_now = datetime.datetime.utcnow()

    # Create ReturnRecord
    ret_record = ReturnRecord(
        booking_id=booking.id,
        returned_at=server_now,
        borrower_confirmed=True,
        owner_confirmed=(current_user.id == booking.resource.owner_id),
        final_condition_checklist=return_data.final_condition_checklist,
        discrepancy_notes=return_data.discrepancy_notes,
        missing_parts_flag=return_data.missing_parts_flag,
        photo_url=return_data.photo_url
    )
    db.add(ret_record)

    # Determine status: if return is initiated by borrower, moves to return_pending for owner signoff
    # If signed off directly by owner without discrepancy, moves to completed
    if current_user.id == booking.resource.owner_id and not return_data.missing_parts_flag:
        booking.status = "completed"
    else:
        booking.status = "return_pending"

    booking.updated_at = server_now

    record_audit_event(
        db=db,
        event_type="RETURN_SUBMITTED",
        actor=current_user,
        resource_id=booking.resource_id,
        booking_id=booking.id,
        summary=f"Return condition report filed for #{booking.booking_code}. Discrepancies: {return_data.discrepancy_notes or 'None'}.",
        details={
            "checklist": return_data.final_condition_checklist,
            "missing_parts": return_data.missing_parts_flag
        }
    )

    send_notification(
        db=db,
        user_id=booking.resource.owner_id,
        title=f"Return Pending Review #{booking.booking_code}",
        message=f"Borrower submitted return condition report for '{booking.resource.title}'. Please inspect and confirm handover.",
        type="info",
        resource_id=booking.resource_id,
        booking_id=booking.id
    )

    db.commit()
    db.refresh(booking)
    return booking

@app.post("/api/bookings/{id}/return-confirm", response_model=BookingOut)
def confirm_return(
    id: int,
    confirm_data: ReturnConfirm,
    current_user: User = Depends(require_roles(["owner", "manager", "admin"])),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == id).first()
    if not booking or not booking.return_record:
        raise HTTPException(status_code=404, detail="Booking or return record not found")

    if current_user.role == "owner" and booking.resource.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the resource owner or manager can sign off on returns")

    booking.return_record.owner_confirmed = True
    
    if confirm_data.discrepancy_flag:
        # Move to incident under review
        booking.status = "incident_under_review"
        # Auto-create incident report
        inc_code = f"INC-{datetime.datetime.utcnow().strftime('%Y')}-{random.randint(1000, 9999)}"
        inc = Incident(
            incident_number=inc_code,
            booking_id=booking.id,
            resource_id=booking.resource_id,
            reporter_id=current_user.id,
            incident_type="damage",
            severity="medium",
            status="open",
            title=f"Return inspection discrepancy on {booking.resource.title}",
            description=confirm_data.owner_notes or "Owner flagged condition discrepancies or missing accessories during return inspection."
        )
        db.add(inc)

        record_audit_event(
            db=db,
            event_type="RETURN_DISCREPANCY_FLAGGED",
            actor=current_user,
            resource_id=booking.resource_id,
            booking_id=booking.id,
            incident_id=inc.id,
            summary=f"Owner flagged discrepancy for booking #{booking.booking_code}. Incident #{inc.incident_number} created.",
            details={"notes": confirm_data.owner_notes}
        )

        send_notification(
            db=db,
            user_id=booking.borrower_id,
            title="Return Discrepancy Flagged",
            message=f"An incident report #{inc.incident_number} has been created regarding condition upon return of '{booking.resource.title}'.",
            type="warning",
            resource_id=booking.resource_id,
            booking_id=booking.id,
            incident_id=inc.id
        )
    else:
        booking.status = "completed"
        record_audit_event(
            db=db,
            event_type="BOOKING_COMPLETED",
            actor=current_user,
            resource_id=booking.resource_id,
            booking_id=booking.id,
            summary=f"Booking #{booking.booking_code} completed. Final handover signoff confirmed by {current_user.full_name}."
        )

        send_notification(
            db=db,
            user_id=booking.borrower_id,
            title="Booking Completed Successfully",
            message=f"Handover signoff completed for '{booking.resource.title}'. Thank you for your responsible usage!",
            type="success",
            resource_id=booking.resource_id,
            booking_id=booking.id
        )

    db.commit()
    db.refresh(booking)
    return booking

# ----------------- Incident Management -----------------

@app.get("/api/incidents", response_model=List[IncidentOut])
def list_incidents(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Incident)
    if current_user.role == "borrower":
        # Borrower sees incidents they reported or related to their bookings
        query = query.filter(
            or_(
                Incident.reporter_id == current_user.id,
                Incident.booking.has(Booking.borrower_id == current_user.id)
            )
        )
    elif current_user.role == "owner":
        # Owner sees incidents on their resources
        query = query.filter(
            or_(
                Incident.reporter_id == current_user.id,
                Incident.resource.has(Resource.owner_id == current_user.id)
            )
        )
    # Manager & admin see all incidents

    if status_filter:
        query = query.filter(Incident.status == status_filter)

    return query.order_by(Incident.created_at.desc()).all()

@app.post("/api/incidents", response_model=IncidentOut)
def create_incident(
    inc_in: IncidentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    res = db.query(Resource).filter(Resource.id == inc_in.resource_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found")

    inc_code = f"INC-{datetime.datetime.utcnow().strftime('%Y')}-{random.randint(1000, 9999)}"
    
    # Auto-assign to facility manager if available
    manager = db.query(User).filter(User.role == "manager").first()

    inc = Incident(
        incident_number=inc_code,
        booking_id=inc_in.booking_id,
        resource_id=inc_in.resource_id,
        reporter_id=current_user.id,
        assigned_to_id=manager.id if manager else None,
        incident_type=inc_in.incident_type,
        severity=inc_in.severity,
        status="open",
        title=inc_in.title,
        description=inc_in.description
    )
    db.add(inc)
    db.commit()
    db.refresh(inc)

    record_audit_event(
        db=db,
        event_type="INCIDENT_REPORTED",
        actor=current_user,
        resource_id=inc.resource_id,
        booking_id=inc.booking_id,
        incident_id=inc.id,
        summary=f"Incident #{inc.incident_number} ({inc.incident_type}, severity: {inc.severity}) reported by {current_user.full_name}.",
        details={"title": inc.title, "description": inc.description}
    )

    if manager:
        send_notification(
            db=db,
            user_id=manager.id,
            title=f"New Incident Assigned: {inc.incident_number}",
            message=f"{inc.title} on '{res.title}' requires review.",
            type="warning",
            resource_id=res.id,
            incident_id=inc.id
        )

    db.commit()
    return inc

@app.put("/api/incidents/{id}", response_model=IncidentOut)
def update_incident(
    id: int,
    inc_in: IncidentUpdate,
    current_user: User = Depends(require_roles(["owner", "manager", "admin"])),
    db: Session = Depends(get_db)
):
    inc = db.query(Incident).filter(Incident.id == id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    if inc_in.status:
        inc.status = inc_in.status
        if inc_in.status in ["resolved", "dismissed"]:
            inc.resolved_at = datetime.datetime.utcnow()
    if inc_in.severity:
        inc.severity = inc_in.severity
    if inc_in.resolution_notes:
        inc.resolution_notes = inc_in.resolution_notes
    if inc_in.assigned_to_id:
        inc.assigned_to_id = inc_in.assigned_to_id

    inc.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(inc)

    record_audit_event(
        db=db,
        event_type="INCIDENT_UPDATED",
        actor=current_user,
        resource_id=inc.resource_id,
        booking_id=inc.booking_id,
        incident_id=inc.id,
        summary=f"Incident #{inc.incident_number} updated to status '{inc.status}' by {current_user.full_name}.",
        details={"status": inc.status, "resolution": inc.resolution_notes}
    )

    send_notification(
        db=db,
        user_id=inc.reporter_id,
        title=f"Incident #{inc.incident_number} Update",
        message=f"Status changed to {inc.status}. {inc.resolution_notes or ''}",
        type="info",
        resource_id=inc.resource_id,
        incident_id=inc.id
    )

    db.commit()
    return inc

# ----------------- Notifications -----------------

@app.get("/api/notifications", response_model=List[NotificationOut])
def get_my_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(30)
        .all()
    )

@app.post("/api/notifications/{id}/read")
def mark_notification_read(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(Notification.id == id, Notification.user_id == current_user.id).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"status": "ok"}

@app.post("/api/notifications/read-all")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(Notification).filter(Notification.user_id == current_user.id).update({"is_read": True})
    db.commit()
    return {"status": "ok"}

# ----------------- Append-Only Audit Trail -----------------

@app.get("/api/audit-events", response_model=List[AuditEventOut])
def get_audit_trail(
    resource_id: Optional[int] = None,
    booking_id: Optional[int] = None,
    limit: int = Query(50, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(AuditEvent)
    if resource_id:
        query = query.filter(AuditEvent.resource_id == resource_id)
    if booking_id:
        query = query.filter(AuditEvent.booking_id == booking_id)

    # Borrowers see events related to their bookings or public events
    if current_user.role == "borrower":
        user_booking_ids = [b.id for b in db.query(Booking.id).filter(Booking.borrower_id == current_user.id).all()]
        query = query.filter(
            or_(
                AuditEvent.actor_id == current_user.id,
                AuditEvent.booking_id.in_(user_booking_ids)
            )
        )

    return query.order_by(AuditEvent.timestamp.desc()).limit(limit).all()

# ----------------- Role-Aware Dashboard Analytics -----------------

@app.get("/api/dashboard/stats")
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    role = current_user.role
    total_resources = db.query(Resource).filter(Resource.is_archived == False).count()
    total_open_incidents = db.query(Incident).filter(Incident.status.in_(["open", "under_review"])).count()

    if role == "borrower":
        my_bookings = db.query(Booking).filter(Booking.borrower_id == current_user.id).all()
        active = sum(1 for b in my_bookings if b.status == "checked_in")
        upcoming = sum(1 for b in my_bookings if b.status == "approved")
        pending = sum(1 for b in my_bookings if b.status in ["pending_approval", "pending_eligibility"])
        waitlisted = sum(1 for b in my_bookings if b.status == "waitlisted")
        overdue = sum(1 for b in my_bookings if b.status == "overdue")

        my_quals = db.query(UserQualification).filter(UserQualification.user_id == current_user.id).all()
        verified_quals = sum(1 for q in my_quals if q.status == "verified")

        return {
            "role": "borrower",
            "total_resources": total_resources,
            "total_open_incidents": total_open_incidents,
            "active_bookings": active,
            "upcoming_reservations": upcoming,
            "pending_approvals": pending,
            "waitlisted_count": waitlisted,
            "overdue_count": overdue,
            "verified_qualifications": verified_quals,
            "recent_bookings": [
                {
                    "id": b.id,
                    "code": b.booking_code,
                    "resource_title": b.resource.title if b.resource else "Resource",
                    "status": b.status,
                    "start_time": b.start_time.isoformat(),
                    "end_time": b.end_time.isoformat()
                }
                for b in my_bookings[:5]
            ]
        }

    elif role == "owner":
        my_resources = db.query(Resource).filter(Resource.owner_id == current_user.id, Resource.is_archived == False).all()
        res_ids = [r.id for r in my_resources]
        
        total_listed = len(my_resources)
        res_bookings = db.query(Booking).filter(Booking.resource_id.in_(res_ids)).all() if res_ids else []

        active_borrowed = sum(1 for b in res_bookings if b.status == "checked_in")
        pending_review = sum(1 for b in res_bookings if b.status in ["pending_approval", "return_pending"])
        overdue_returns = sum(1 for b in res_bookings if b.status == "overdue")

        open_incidents = db.query(Incident).filter(
            Incident.resource_id.in_(res_ids),
            Incident.status.in_(["open", "under_review"])
        ).count() if res_ids else 0

        return {
            "role": "owner",
            "total_resources": total_resources,
            "total_open_incidents": total_open_incidents,
            "resources_listed": total_listed,
            "currently_borrowed": active_borrowed,
            "pending_requests": pending_review,
            "overdue_returns": overdue_returns,
            "open_incidents": open_incidents,
            "recent_requests": [
                {
                    "id": b.id,
                    "code": b.booking_code,
                    "resource_title": b.resource.title if b.resource else "Resource",
                    "borrower_name": b.borrower.full_name if b.borrower else "Borrower",
                    "status": b.status,
                    "start_time": b.start_time.isoformat(),
                    "purpose": b.purpose
                }
                for b in res_bookings[:5]
            ]
        }

    else:  # manager or admin
        total_users = db.query(User).count()
        all_bookings = db.query(Booking).all()
        
        active_in_use = sum(1 for b in all_bookings if b.status == "checked_in")
        pending_approvals = sum(1 for b in all_bookings if b.status in ["pending_approval", "pending_eligibility"])
        total_completed = sum(1 for b in all_bookings if b.status == "completed")
        open_incidents = db.query(Incident).filter(Incident.status.in_(["open", "under_review"])).count()

        # Category utilization stats
        category_counts = {}
        for r in db.query(Resource).filter(Resource.is_archived == False).all():
            category_counts[r.category] = category_counts.get(r.category, 0) + 1

        return {
            "role": role,
            "total_resources": total_resources,
            "total_users": total_users,
            "active_in_use": active_in_use,
            "pending_approvals": pending_approvals,
            "total_completed": total_completed,
            "unresolved_incidents": open_incidents,
            "category_distribution": [
                {"name": cat, "count": count} for cat, count in category_counts.items()
            ],
            "recent_audit_count": db.query(AuditEvent).count()
        }

# ----------------- Explainable AI Matcher & Recommendation -----------------

@app.post("/api/ai/match", response_model=ExplainableMatchResponse)
def get_explainable_recommendations(
    req: ExplainableMatchRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    recommendations = analyze_and_match_resources(
        db=db,
        purpose=req.purpose,
        user=current_user,
        category_preference=req.category,
        location_preference=req.location_preference,
        needed_hours=req.needed_hours or 2.0
    )

    items = []
    for r in recommendations[:6]:
        items.append(
            ExplainableRecommendationItem(
                resource=r["resource"],
                match_score=r["match_score"],
                why_recommended=r["why_recommended"],
                eligibility_status=r["eligibility_status"],
                eligibility_details=r["eligibility_details"],
                availability_status=r["availability_status"]
            )
        )

    return ExplainableMatchResponse(
        query_summary=f"Evaluated against {len(recommendations)} institutional assets for: '{req.purpose}'",
        recommendations=items
    )

@app.post("/api/ai/parse-search")
def parse_search_query(payload: dict):
    query = payload.get("query", "")
    return parse_natural_language_search(query)

# ----------------- Production Static Frontend SPA Serving -----------------
dist_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dist")
if os.path.exists(dist_dir):
    assets_dir = os.path.join(dist_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend_spa(full_path: str):
        # Allow API routes and Swagger docs to be handled directly by FastAPI
        if (
            full_path.startswith("api/")
            or full_path == "api"
            or full_path.startswith("docs")
            or full_path == "docs"
            or full_path.startswith("redoc")
            or full_path.startswith("openapi.json")
        ):
            raise HTTPException(status_code=404, detail="API route not found")

        # Direct file in dist (e.g., vite.svg, favicon, etc.)
        target_file = os.path.join(dist_dir, full_path)
        if full_path and os.path.isfile(target_file):
            return FileResponse(target_file)

        # Fallback to index.html for Single-Page Application (SPA) client routing
        index_file = os.path.join(dist_dir, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Frontend build index.html not found")

