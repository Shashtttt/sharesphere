import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Float, JSON
)
from sqlalchemy.orm import relationship
from backend.database import Base

class Institution(Base):
    __tablename__ = "institutions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    address = Column(String(300), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    users = relationship("User", back_populates="institution")
    resources = relationship("Resource", back_populates="institution")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    role = Column(String(50), default="borrower", nullable=False)  # borrower, owner, manager, admin
    department = Column(String(150), nullable=True)
    phone = Column(String(50), nullable=True)
    institution_id = Column(Integer, ForeignKey("institutions.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    institution = relationship("Institution", back_populates="users")
    qualifications = relationship("UserQualification", foreign_keys="[UserQualification.user_id]", back_populates="user", cascade="all, delete-orphan")
    owned_resources = relationship("Resource", back_populates="owner")
    bookings = relationship("Booking", back_populates="borrower")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class Qualification(Base):
    __tablename__ = "qualifications"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(100), unique=True, index=True, nullable=False)  # e.g., 'laser_safety_l2', 'cleanroom_iso6'
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    issuing_body = Column(String(150), nullable=True)
    validity_days = Column(Integer, default=365)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user_qualifications = relationship("UserQualification", back_populates="qualification")


class UserQualification(Base):
    __tablename__ = "user_qualifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    qualification_id = Column(Integer, ForeignKey("qualifications.id"), nullable=False, index=True)
    status = Column(String(50), default="pending_verification")  # verified, pending_verification, rejected, expired
    document_ref = Column(String(255), nullable=True)  # certificate filename / reference id
    verification_notes = Column(Text, nullable=True)
    issued_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    verified_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    user = relationship("User", back_populates="qualifications", foreign_keys=[user_id])
    qualification = relationship("Qualification", back_populates="user_qualifications")


class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False, index=True)
    # categories: 'Laboratories', 'Computers & Workstations', 'Cameras & AV Equipment',
    # 'Fabrication Tools', 'Electronics & Testing Instruments', 'Meeting Rooms & Classrooms', 'Innovation & Makerspace'
    resource_type = Column(String(100), default="equipment")  # equipment, space, bench
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id"), nullable=True)
    building = Column(String(150), nullable=False)
    room_location = Column(String(150), nullable=False)
    image_url = Column(Text, nullable=True)
    
    # Scheduling & booking limits
    availability_schedule = Column(JSON, default=dict)  # e.g., {"days": ["Mon", "Tue", "Wed", "Thu", "Fri"], "hours": "08:00 - 20:00"}
    min_duration_hours = Column(Float, default=1.0)
    max_duration_hours = Column(Float, default=8.0)
    max_booking_frequency_per_week = Column(Integer, default=3)
    
    # Rules & requirements
    usage_rules = Column(Text, nullable=True)
    required_qualifications = Column(JSON, default=list)  # list of qualification codes e.g. ["laser_safety_l2"]
    membership_required = Column(Boolean, default=False)
    supervision_required = Column(Boolean, default=False)
    security_deposit = Column(Float, default=0.0)
    cancellation_policy = Column(String(255), default="Cancel up to 24 hours prior without penalty")
    
    # Status
    condition_status = Column(String(50), default="excellent")  # excellent, good, fair, maintenance
    approval_required = Column(Boolean, default=True)
    is_published = Column(Boolean, default=True)
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="owned_resources")
    institution = relationship("Institution", back_populates="resources")
    bookings = relationship("Booking", back_populates="resource")
    incidents = relationship("Incident", back_populates="resource")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_code = Column(String(50), unique=True, index=True, nullable=False)
    resource_id = Column(Integer, ForeignKey("resources.id"), nullable=False, index=True)
    borrower_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    purpose = Column(Text, nullable=False)
    
    # State Machine Status:
    # 'draft', 'pending_eligibility', 'pending_approval', 'approved',
    # 'waitlisted', 'rejected', 'cancelled', 'checked_in', 'return_pending',
    # 'completed', 'overdue', 'incident_under_review'
    status = Column(String(50), default="pending_approval", nullable=False, index=True)
    queue_position = Column(Integer, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    resource = relationship("Resource", back_populates="bookings")
    borrower = relationship("User", back_populates="bookings")
    check_in_record = relationship("CheckInRecord", uselist=False, back_populates="booking", cascade="all, delete-orphan")
    return_record = relationship("ReturnRecord", uselist=False, back_populates="booking", cascade="all, delete-orphan")
    incidents = relationship("Incident", back_populates="booking")


class CheckInRecord(Base):
    __tablename__ = "check_in_records"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), unique=True, nullable=False)
    checked_in_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    borrower_confirmed = Column(Boolean, default=True)
    owner_confirmed = Column(Boolean, default=False)
    condition_checklist = Column(JSON, default=dict)  # {"cleanliness": True, "accessories_intact": True, "no_visible_damage": True, "power_test_passed": True}
    notes = Column(Text, nullable=True)
    photo_url = Column(Text, nullable=True)

    booking = relationship("Booking", back_populates="check_in_record")


class ReturnRecord(Base):
    __tablename__ = "return_records"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), unique=True, nullable=False)
    returned_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    borrower_confirmed = Column(Boolean, default=True)
    owner_confirmed = Column(Boolean, default=False)
    final_condition_checklist = Column(JSON, default=dict)
    discrepancy_notes = Column(Text, nullable=True)
    missing_parts_flag = Column(Boolean, default=False)
    photo_url = Column(Text, nullable=True)

    booking = relationship("Booking", back_populates="return_record")


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_number = Column(String(50), unique=True, index=True, nullable=False)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=True, index=True)
    resource_id = Column(Integer, ForeignKey("resources.id"), nullable=False, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Types: damage, missing_item, late_return, unsafe_use, access_issue, scheduling_conflict
    incident_type = Column(String(100), nullable=False)
    severity = Column(String(50), default="medium")  # low, medium, high, critical
    status = Column(String(50), default="open")  # open, under_review, awaiting_information, resolved, dismissed
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    resolution_notes = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    booking = relationship("Booking", back_populates="incidents")
    resource = relationship("Resource", back_populates="incidents")
    reporter = relationship("User", foreign_keys=[reporter_id])
    assigned_to = relationship("User", foreign_keys=[assigned_to_id])


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(100), nullable=False, index=True)  # e.g., 'RESOURCE_CREATED', 'BOOKING_SUBMITTED', 'CHECK_IN_CONFIRMED'
    actor_id = Column(Integer, nullable=True)
    actor_name = Column(String(150), nullable=True)
    actor_role = Column(String(50), nullable=True)
    resource_id = Column(Integer, nullable=True, index=True)
    booking_id = Column(Integer, nullable=True, index=True)
    incident_id = Column(Integer, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    readable_summary = Column(Text, nullable=False)
    details = Column(JSON, default=dict)  # State payload, diffs, IP/client info


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="info")  # info, success, warning, alert
    resource_id = Column(Integer, nullable=True)
    booking_id = Column(Integer, nullable=True)
    incident_id = Column(Integer, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="notifications")
