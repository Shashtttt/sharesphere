export type UserRole = 'borrower' | 'owner' | 'manager' | 'admin';

export interface User {
  id: int;
  email: string;
  full_name: string;
  role: UserRole;
  department?: string;
  phone?: string;
  institution_id?: number;
  is_active: boolean;
  created_at: string;
}

export type int = number;

export interface DemoAccount {
  email: string;
  password: string;
  role: UserRole;
  name: string;
  title: string;
  badges: string[];
  scenario: string;
}

export interface Qualification {
  id: number;
  code: string;
  name: string;
  description?: string;
  issuing_body?: string;
  validity_days: number;
}

export interface UserQualification {
  id: number;
  user_id: number;
  qualification_id: number;
  status: 'verified' | 'pending_verification' | 'rejected' | 'expired';
  document_ref?: string;
  verification_notes?: string;
  issued_at: string;
  expires_at?: string;
  qualification: Qualification;
}

export interface Resource {
  id: number;
  title: string;
  description: string;
  category: string;
  resource_type: string;
  owner_id: number;
  institution_id?: number;
  building: string;
  room_location: string;
  image_url?: string;
  availability_schedule?: {
    days?: string[];
    hours?: string;
  };
  min_duration_hours: number;
  max_duration_hours: number;
  max_booking_frequency_per_week: number;
  usage_rules?: string;
  required_qualifications: string[];
  membership_required: boolean;
  supervision_required: boolean;
  security_deposit: number;
  cancellation_policy?: string;
  condition_status: 'excellent' | 'good' | 'fair' | 'maintenance';
  approval_required: boolean;
  is_published: boolean;
  is_archived: boolean;
  created_at: string;
  owner?: User;
}

export type BookingStatus =
  | 'draft'
  | 'pending_eligibility'
  | 'pending_approval'
  | 'approved'
  | 'waitlisted'
  | 'rejected'
  | 'cancelled'
  | 'checked_in'
  | 'return_pending'
  | 'completed'
  | 'overdue'
  | 'incident_under_review';

export interface CheckInRecord {
  id: number;
  booking_id: number;
  checked_in_at: string;
  borrower_confirmed: boolean;
  owner_confirmed: boolean;
  condition_checklist: Record<string, boolean>;
  notes?: string;
  photo_url?: string;
}

export interface ReturnRecord {
  id: number;
  booking_id: number;
  returned_at: string;
  borrower_confirmed: boolean;
  owner_confirmed: boolean;
  final_condition_checklist: Record<string, boolean>;
  discrepancy_notes?: string;
  missing_parts_flag: boolean;
  photo_url?: string;
}

export interface Booking {
  id: number;
  booking_code: string;
  resource_id: number;
  borrower_id: number;
  start_time: string;
  end_time: string;
  purpose: string;
  status: BookingStatus;
  queue_position?: number;
  rejection_reason?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  resource?: Resource;
  borrower?: User;
  check_in_record?: CheckInRecord;
  return_record?: ReturnRecord;
}

export interface Incident {
  id: number;
  incident_number: string;
  booking_id?: number;
  resource_id: number;
  reporter_id: number;
  assigned_to_id?: number;
  incident_type: 'damage' | 'missing_item' | 'late_return' | 'unsafe_use' | 'access_issue' | 'scheduling_conflict';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'under_review' | 'awaiting_information' | 'resolved' | 'dismissed';
  title: string;
  description: string;
  resolution_notes?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  resource?: Resource;
  reporter?: User;
}

export interface AuditEvent {
  id: number;
  event_type: string;
  actor_id?: number;
  actor_name?: string;
  actor_role?: string;
  resource_id?: number;
  booking_id?: number;
  incident_id?: number;
  timestamp: string;
  readable_summary: string;
  details: Record<string, any>;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  resource_id?: number;
  booking_id?: number;
  incident_id?: number;
  is_read: boolean;
  created_at: string;
}

export interface ExplainableRecommendation {
  resource: Resource;
  match_score: number;
  why_recommended: string[];
  eligibility_status: 'eligible' | 'missing_qualification' | 'verification_pending';
  eligibility_details: string[];
  availability_status: 'available_now' | 'requires_approval' | 'busy';
}
