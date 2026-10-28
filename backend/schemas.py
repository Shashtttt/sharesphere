import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field

# ----------------- Auth & Users -----------------
class UserRegister(BaseModel):
    email: str = Field(..., min_length=5)
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2)
    role: str = "borrower"  # Note: manager or admin cannot self-register without invitation
    department: Optional[str] = None
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    department: Optional[str] = None
    phone: Optional[str] = None
    institution_id: Optional[int] = None
    is_active: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

# ----------------- Qualifications -----------------
class QualificationOut(BaseModel):
    id: int
    code: str
    name: str
    description: Optional[str] = None
    issuing_body: Optional[str] = None
    validity_days: int

    class Config:
        from_attributes = True

class UserQualificationCreate(BaseModel):
    qualification_code: str
    document_ref: Optional[str] = None

class UserQualificationOut(BaseModel):
    id: int
    user_id: int
    qualification_id: int
    status: str
    document_ref: Optional[str] = None
    verification_notes: Optional[str] = None
    issued_at: datetime.datetime
    expires_at: Optional[datetime.datetime] = None
    qualification: QualificationOut

    class Config:
        from_attributes = True

# ----------------- Resources -----------------
class ResourceCreate(BaseModel):
    title: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    category: str
    resource_type: str = "equipment"
    building: str
    room_location: str
    image_url: Optional[str] = None
    availability_schedule: Optional[Dict[str, Any]] = None
    min_duration_hours: float = 1.0
    max_duration_hours: float = 8.0
    max_booking_frequency_per_week: int = 3
    usage_rules: Optional[str] = None
    required_qualifications: List[str] = []
    membership_required: bool = False
    supervision_required: bool = False
    security_deposit: float = 0.0
    cancellation_policy: Optional[str] = "Cancel up to 24 hours prior"
    condition_status: str = "excellent"
    approval_required: bool = True

class ResourceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    resource_type: Optional[str] = None
    building: Optional[str] = None
    room_location: Optional[str] = None
    image_url: Optional[str] = None
    availability_schedule: Optional[Dict[str, Any]] = None
    min_duration_hours: Optional[float] = None
    max_duration_hours: Optional[float] = None
    max_booking_frequency_per_week: Optional[int] = None
    usage_rules: Optional[str] = None
    required_qualifications: Optional[List[str]] = None
    membership_required: Optional[bool] = None
    supervision_required: Optional[bool] = None
    security_deposit: Optional[float] = None
    cancellation_policy: Optional[str] = None
    condition_status: Optional[str] = None
    approval_required: Optional[bool] = None
    is_published: Optional[bool] = None
    is_archived: Optional[bool] = None

class ResourceOut(BaseModel):
    id: int
    title: str
    description: str
    category: str
    resource_type: str
    owner_id: int
    institution_id: Optional[int] = None
    building: str
    room_location: str
    image_url: Optional[str] = None
    availability_schedule: Optional[Dict[str, Any]] = None
    min_duration_hours: float
    max_duration_hours: float
    max_booking_frequency_per_week: int
    usage_rules: Optional[str] = None
    required_qualifications: List[str]
    membership_required: bool
    supervision_required: bool
    security_deposit: float
    cancellation_policy: Optional[str] = None
    condition_status: str
    approval_required: bool
    is_published: bool
    is_archived: bool
    created_at: datetime.datetime
    owner: Optional[UserOut] = None

    class Config:
        from_attributes = True

# ----------------- CheckIn & Return -----------------
class CheckInCreate(BaseModel):
    condition_checklist: Dict[str, bool] = {
        "cleanliness_verified": True,
        "accessories_intact": True,
        "no_visible_damage": True,
        "operational_test_passed": True
    }
    notes: Optional[str] = None
    photo_url: Optional[str] = None

class CheckInConfirm(BaseModel):
    owner_confirmed: bool = True
    owner_notes: Optional[str] = None

class CheckInOut(BaseModel):
    id: int
    booking_id: int
    checked_in_at: datetime.datetime
    borrower_confirmed: bool
    owner_confirmed: bool
    condition_checklist: Dict[str, Any]
    notes: Optional[str] = None
    photo_url: Optional[str] = None

    class Config:
        from_attributes = True

class ReturnCreate(BaseModel):
    final_condition_checklist: Dict[str, bool] = {
        "item_cleaned": True,
        "all_cables_returned": True,
        "no_new_damage": True,
        "properly_shutdown": True
    }
    discrepancy_notes: Optional[str] = None
    missing_parts_flag: bool = False
    photo_url: Optional[str] = None

class ReturnConfirm(BaseModel):
    owner_confirmed: bool = True
    discrepancy_flag: bool = False
    owner_notes: Optional[str] = None

class ReturnOut(BaseModel):
    id: int
    booking_id: int
    returned_at: datetime.datetime
    borrower_confirmed: bool
    owner_confirmed: bool
    final_condition_checklist: Dict[str, Any]
    discrepancy_notes: Optional[str] = None
    missing_parts_flag: bool
    photo_url: Optional[str] = None

    class Config:
        from_attributes = True

# ----------------- Bookings -----------------
class BookingCreate(BaseModel):
    resource_id: int
    start_time: datetime.datetime
    end_time: datetime.datetime
    purpose: str = Field(..., min_length=5)

class BookingReviewAction(BaseModel):
    action: str = Field(..., description="'approve', 'reject', 'waitlist'")
    reason: Optional[str] = None

class BookingCancelRequest(BaseModel):
    reason: Optional[str] = None

class BookingOut(BaseModel):
    id: int
    booking_code: str
    resource_id: int
    borrower_id: int
    start_time: datetime.datetime
    end_time: datetime.datetime
    purpose: str
    status: str
    queue_position: Optional[int] = None
    rejection_reason: Optional[str] = None
    cancellation_reason: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
    resource: Optional[ResourceOut] = None
    borrower: Optional[UserOut] = None
    check_in_record: Optional[CheckInOut] = None
    return_record: Optional[ReturnOut] = None

    class Config:
        from_attributes = True

# ----------------- Incidents -----------------
class IncidentCreate(BaseModel):
    resource_id: int
    booking_id: Optional[int] = None
    incident_type: str = Field(..., description="damage, missing_item, late_return, unsafe_use, access_issue, scheduling_conflict")
    severity: str = "medium"
    title: str = Field(..., min_length=5)
    description: str = Field(..., min_length=10)

class IncidentUpdate(BaseModel):
    status: Optional[str] = None  # open, under_review, awaiting_information, resolved, dismissed
    severity: Optional[str] = None
    resolution_notes: Optional[str] = None
    assigned_to_id: Optional[int] = None

class IncidentOut(BaseModel):
    id: int
    incident_number: str
    booking_id: Optional[int] = None
    resource_id: int
    reporter_id: int
    assigned_to_id: Optional[int] = None
    incident_type: str
    severity: str
    status: str
    title: str
    description: str
    resolution_notes: Optional[str] = None
    resolved_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
    resource: Optional[ResourceOut] = None
    reporter: Optional[UserOut] = None

    class Config:
        from_attributes = True

# ----------------- Audit Events -----------------
class AuditEventOut(BaseModel):
    id: int
    event_type: str
    actor_id: Optional[int] = None
    actor_name: Optional[str] = None
    actor_role: Optional[str] = None
    resource_id: Optional[int] = None
    booking_id: Optional[int] = None
    incident_id: Optional[int] = None
    timestamp: datetime.datetime
    readable_summary: str
    details: Dict[str, Any]

    class Config:
        from_attributes = True

# ----------------- Notifications -----------------
class NotificationOut(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    resource_id: Optional[int] = None
    booking_id: Optional[int] = None
    incident_id: Optional[int] = None
    is_read: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# ----------------- AI Recommendation -----------------
class ExplainableMatchRequest(BaseModel):
    purpose: str
    category: Optional[str] = None
    location_preference: Optional[str] = None
    needed_hours: Optional[float] = 2.0

class ExplainableRecommendationItem(BaseModel):
    resource: ResourceOut
    match_score: int  # 0 to 100
    why_recommended: List[str]
    eligibility_status: str  # 'eligible', 'missing_qualification', 'verification_pending'
    eligibility_details: List[str]
    availability_status: str  # 'available_now', 'requires_approval', 'busy'

class ExplainableMatchResponse(BaseModel):
    query_summary: str
    recommendations: List[ExplainableRecommendationItem]
