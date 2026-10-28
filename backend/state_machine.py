import datetime
from typing import Optional, Tuple, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from fastapi import HTTPException, status
from backend.models import (
    Booking, Resource, User, UserQualification, Qualification,
    AuditEvent, Notification
)

# Valid transitions map
VALID_TRANSITIONS: Dict[str, List[str]] = {
    "draft": ["pending_eligibility", "pending_approval", "cancelled"],
    "pending_eligibility": ["pending_approval", "rejected", "cancelled"],
    "pending_approval": ["approved", "waitlisted", "rejected", "cancelled"],
    "waitlisted": ["pending_approval", "approved", "cancelled"],
    "approved": ["checked_in", "cancelled"],
    "checked_in": ["return_pending", "completed", "overdue", "incident_under_review"],
    "return_pending": ["completed", "incident_under_review"],
    "overdue": ["return_pending", "completed", "incident_under_review"],
    "incident_under_review": ["completed", "rejected"],
    "completed": [],
    "cancelled": [],
    "rejected": []
}

def record_audit_event(
    db: Session,
    event_type: str,
    actor: Optional[User],
    resource_id: Optional[int] = None,
    booking_id: Optional[int] = None,
    incident_id: Optional[int] = None,
    summary: str = "",
    details: Optional[Dict[str, Any]] = None
) -> AuditEvent:
    event = AuditEvent(
        event_type=event_type,
        actor_id=actor.id if actor else None,
        actor_name=actor.full_name if actor else "System",
        actor_role=actor.role if actor else "system",
        resource_id=resource_id,
        booking_id=booking_id,
        incident_id=incident_id,
        timestamp=datetime.datetime.utcnow(),
        readable_summary=summary,
        details=details or {}
    )
    db.add(event)
    db.flush()
    return event

def send_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    type: str = "info",
    resource_id: Optional[int] = None,
    booking_id: Optional[int] = None,
    incident_id: Optional[int] = None
) -> Notification:
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=type,
        resource_id=resource_id,
        booking_id=booking_id,
        incident_id=incident_id,
        created_at=datetime.datetime.utcnow()
    )
    db.add(notif)
    db.flush()
    return notif

def check_user_eligibility(db: Session, user: User, resource: Resource) -> Tuple[bool, List[str], List[str]]:
    """
    Checks if a user satisfies all required qualifications for a resource.
    Returns: (is_eligible, missing_quals, pending_quals)
    """
    if not resource.required_qualifications or len(resource.required_qualifications) == 0:
        return True, [], []
    
    # Fetch user verified qualifications
    user_quals = (
        db.query(UserQualification, Qualification.code)
        .join(Qualification, UserQualification.qualification_id == Qualification.id)
        .filter(UserQualification.user_id == user.id)
        .all()
    )
    
    verified_codes = set()
    pending_codes = set()
    now = datetime.datetime.utcnow()

    for uq, code in user_quals:
        if uq.status == "verified":
            if uq.expires_at is None or uq.expires_at > now:
                verified_codes.add(code)
        elif uq.status == "pending_verification":
            pending_codes.add(code)

    missing = []
    pending = []

    for req_code in resource.required_qualifications:
        if req_code in verified_codes:
            continue
        elif req_code in pending_codes:
            pending.append(req_code)
        else:
            missing.append(req_code)

    is_eligible = (len(missing) == 0 and len(pending) == 0)
    return is_eligible, missing, pending

def check_booking_conflicts(
    db: Session,
    resource_id: int,
    start_time: datetime.datetime,
    end_time: datetime.datetime,
    exclude_booking_id: Optional[int] = None
) -> bool:
    """
    Returns True if there is an overlapping active/approved booking.
    """
    query = db.query(Booking).filter(
        Booking.resource_id == resource_id,
        Booking.status.in_(["approved", "checked_in", "return_pending"]),
        or_(
            and_(Booking.start_time <= start_time, Booking.end_time > start_time),
            and_(Booking.start_time < end_time, Booking.end_time >= end_time),
            and_(Booking.start_time >= start_time, Booking.end_time <= end_time)
        )
    )
    if exclude_booking_id:
        query = query.filter(Booking.id != exclude_booking_id)
    
    return query.first() is not None

def check_user_fair_allocation(
    db: Session,
    user_id: int,
    resource: Resource
) -> Tuple[bool, str]:
    """
    Enforces rolling period limit:
    1. Maximum 3 total active/pending bookings across the system at once.
    2. Respects resource.max_booking_frequency_per_week.
    """
    # 1. Total active/pending limit
    active_count = db.query(Booking).filter(
        Booking.borrower_id == user_id,
        Booking.status.in_(["pending_approval", "approved", "checked_in", "return_pending"])
    ).count()
    if active_count >= 5:
        return False, "You have reached the maximum allowed concurrent active reservations (5). Complete existing reservations first."

    # 2. Rolling week limit for this specific resource
    one_week_ago = datetime.datetime.utcnow() - datetime.timedelta(days=7)
    recent_count = db.query(Booking).filter(
        Booking.borrower_id == user_id,
        Booking.resource_id == resource.id,
        Booking.created_at >= one_week_ago,
        Booking.status.in_(["approved", "checked_in", "completed"])
    ).count()

    if recent_count >= resource.max_booking_frequency_per_week:
        return False, f"Fair allocation policy: Maximum {resource.max_booking_frequency_per_week} bookings allowed per rolling 7 days for this specific resource."

    return True, ""

def transition_booking_state(
    db: Session,
    booking: Booking,
    new_status: str,
    actor: User,
    reason: Optional[str] = None
) -> Booking:
    current_status = booking.status
    allowed = VALID_TRANSITIONS.get(current_status, [])
    if new_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid booking transition from '{current_status}' to '{new_status}'. Allowed: {allowed}"
        )
    
    # State specific hooks
    old_status = booking.status
    booking.status = new_status
    booking.updated_at = datetime.datetime.utcnow()

    if new_status == "rejected" and reason:
        booking.rejection_reason = reason
    elif new_status == "cancelled" and reason:
        booking.cancellation_reason = reason

    # Audit event
    record_audit_event(
        db=db,
        event_type=f"BOOKING_{new_status.upper()}",
        actor=actor,
        resource_id=booking.resource_id,
        booking_id=booking.id,
        summary=f"Booking #{booking.booking_code} transitioned from '{old_status}' to '{new_status}' by {actor.full_name} ({actor.role}).",
        details={
            "from_status": old_status,
            "to_status": new_status,
            "reason": reason
        }
    )

    # In-app notification to borrower if acted upon by someone else
    if actor.id != booking.borrower_id:
        send_notification(
            db=db,
            user_id=booking.borrower_id,
            title=f"Booking #{booking.booking_code} Update",
            message=f"Your booking for '{booking.resource.title}' has been moved to {new_status}." + (f" Note: {reason}" if reason else ""),
            type="success" if new_status in ["approved", "completed"] else "warning" if new_status in ["rejected", "cancelled"] else "info",
            resource_id=booking.resource_id,
            booking_id=booking.id
        )

    # Check if a cancellation opened a slot for waitlisted users
    if new_status == "cancelled":
        promote_waitlist_if_applicable(db, booking.resource_id)

    db.commit()
    db.refresh(booking)
    return booking

def promote_waitlist_if_applicable(db: Session, resource_id: int):
    """
    If an existing booking was cancelled, check the next waitlisted user and notify them.
    """
    next_waitlist = (
        db.query(Booking)
        .filter(Booking.resource_id == resource_id, Booking.status == "waitlisted")
        .order_by(Booking.queue_position.asc(), Booking.created_at.asc())
        .first()
    )
    if next_waitlist:
        send_notification(
            db=db,
            user_id=next_waitlist.borrower_id,
            title="Resource Available: Your Waitlist Queue Advanced!",
            message=f"A prior reservation for '{next_waitlist.resource.title}' was cancelled. Your booking #{next_waitlist.booking_code} is now ready for owner review.",
            type="info",
            resource_id=resource_id,
            booking_id=next_waitlist.id
        )
