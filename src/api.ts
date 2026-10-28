import {
  User, DemoAccount, Resource, Booking, Incident,
  UserQualification, Qualification, AuditEvent, NotificationItem,
  ExplainableRecommendation
} from './types';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('sharesphere_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = 'API request failed';
    try {
      const data = await res.json();
      if (Array.isArray(data.detail)) {
        errorDetail = data.detail.map((err: any) => `${err.loc?.[1] ? `${err.loc[1]}: ` : ''}${err.msg}`).join(', ');
      } else if (typeof data.detail === 'string') {
        errorDetail = data.detail;
      } else if (data.message) {
        errorDetail = data.message;
      } else {
        errorDetail = JSON.stringify(data);
      }
    } catch {
      errorDetail = await res.text();
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export const api = {
  // Demo & Auth
  getDemoAccounts: () =>
    fetch(`${API_BASE}/demo/accounts`).then(res => handleResponse<DemoAccount[]>(res)),

  login: (email: string, password: string) =>
    fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(res => handleResponse<{ access_token: string; user: User }>(res)),

  register: (data: { email: string; password: string; full_name: string; role: string; department?: string }) =>
    fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(res => handleResponse<{ access_token: string; user: User }>(res)),

  getMe: () =>
    fetch(`${API_BASE}/auth/me`, { headers: getAuthHeaders() }).then(res => handleResponse<User>(res)),

  // Resources
  getResources: (params?: { category?: string; search?: string; status_filter?: string }) => {
    const url = new URL(`${window.location.origin}${API_BASE}/resources`);
    if (params?.category) url.searchParams.append('category', params.category);
    if (params?.search) url.searchParams.append('search', params.search);
    if (params?.status_filter) url.searchParams.append('status_filter', params.status_filter);
    return fetch(url.toString(), { headers: getAuthHeaders() }).then(res => handleResponse<Resource[]>(res));
  },

  getResource: (id: number) =>
    fetch(`${API_BASE}/resources/${id}`, { headers: getAuthHeaders() }).then(res => handleResponse<Resource>(res)),

  getResourceAvailability: (id: number) =>
    fetch(`${API_BASE}/resources/${id}/availability`, { headers: getAuthHeaders() }).then(res => handleResponse<{
      resource_id: number;
      title: string;
      operating_hours: any;
      min_duration_hours: number;
      max_duration_hours: number;
      booked_slots: Array<{ booking_code: string; start_time: string; end_time: string; status: string }>;
    }>(res)),

  createResource: (data: Partial<Resource>) =>
    fetch(`${API_BASE}/resources`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(res => handleResponse<Resource>(res)),

  updateResource: (id: number, data: Partial<Resource>) =>
    fetch(`${API_BASE}/resources/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(res => handleResponse<Resource>(res)),

  archiveResource: (id: number) =>
    fetch(`${API_BASE}/resources/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }).then(res => handleResponse<{ message: string }>(res)),

  // Bookings
  createBooking: (data: { resource_id: number; start_time: string; end_time: string; purpose: string }) =>
    fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(res => handleResponse<Booking>(res)),

  getMyBookings: () =>
    fetch(`${API_BASE}/bookings/my`, { headers: getAuthHeaders() }).then(res => handleResponse<Booking[]>(res)),

  getManageBookings: () =>
    fetch(`${API_BASE}/bookings/manage`, { headers: getAuthHeaders() }).then(res => handleResponse<Booking[]>(res)),

  getBooking: (id: number) =>
    fetch(`${API_BASE}/bookings/${id}`, { headers: getAuthHeaders() }).then(res => handleResponse<Booking>(res)),

  reviewBooking: (id: number, action: 'approve' | 'reject' | 'waitlist', reason?: string) =>
    fetch(`${API_BASE}/bookings/${id}/review`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action, reason }),
    }).then(res => handleResponse<Booking>(res)),

  cancelBooking: (id: number, reason?: string) =>
    fetch(`${API_BASE}/bookings/${id}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    }).then(res => handleResponse<Booking>(res)),

  // Handover Check-In
  submitCheckIn: (id: number, data: { condition_checklist: Record<string, boolean>; notes?: string; photo_url?: string }) =>
    fetch(`${API_BASE}/bookings/${id}/check-in`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(res => handleResponse<Booking>(res)),

  confirmCheckIn: (id: number, owner_notes?: string) =>
    fetch(`${API_BASE}/bookings/${id}/check-in-confirm`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ owner_confirmed: true, owner_notes }),
    }).then(res => handleResponse<{ message: string }>(res)),

  // Handover Return
  submitReturn: (id: number, data: { final_condition_checklist: Record<string, boolean>; discrepancy_notes?: string; missing_parts_flag: boolean; photo_url?: string }) =>
    fetch(`${API_BASE}/bookings/${id}/return`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(res => handleResponse<Booking>(res)),

  confirmReturn: (id: number, data: { discrepancy_flag: boolean; owner_notes?: string }) =>
    fetch(`${API_BASE}/bookings/${id}/return-confirm`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(res => handleResponse<Booking>(res)),

  // Incidents
  getIncidents: (status_filter?: string) => {
    const url = new URL(`${window.location.origin}${API_BASE}/incidents`);
    if (status_filter) url.searchParams.append('status_filter', status_filter);
    return fetch(url.toString(), { headers: getAuthHeaders() }).then(res => handleResponse<Incident[]>(res));
  },

  createIncident: (data: { resource_id: number; booking_id?: number; incident_type: string; severity: string; title: string; description: string }) =>
    fetch(`${API_BASE}/incidents`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(res => handleResponse<Incident>(res)),

  updateIncident: (id: number, data: { status?: string; resolution_notes?: string; severity?: string }) =>
    fetch(`${API_BASE}/incidents/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(res => handleResponse<Incident>(res)),

  // Qualifications
  getQualifications: () =>
    fetch(`${API_BASE}/qualifications`, { headers: getAuthHeaders() }).then(res => handleResponse<Qualification[]>(res)),

  getMyQualifications: () =>
    fetch(`${API_BASE}/qualifications/my`, { headers: getAuthHeaders() }).then(res => handleResponse<UserQualification[]>(res)),

  requestQualification: (qualification_code: string, document_ref?: string) =>
    fetch(`${API_BASE}/qualifications/request`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ qualification_code, document_ref }),
    }).then(res => handleResponse<UserQualification>(res)),

  verifyQualification: (id: number, action: 'approve' | 'reject', notes?: string) =>
    fetch(`${API_BASE}/qualifications/${id}/verify?action=${action}${notes ? `&notes=${encodeURIComponent(notes)}` : ''}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    }).then(res => handleResponse<{ status: string; message: string }>(res)),

  // Notifications
  getNotifications: () =>
    fetch(`${API_BASE}/notifications`, { headers: getAuthHeaders() }).then(res => handleResponse<NotificationItem[]>(res)),

  markNotificationRead: (id: number) =>
    fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'POST',
      headers: getAuthHeaders(),
    }).then(res => handleResponse<{ status: string }>(res)),

  markAllNotificationsRead: () =>
    fetch(`${API_BASE}/notifications/read-all`, {
      method: 'POST',
      headers: getAuthHeaders(),
    }).then(res => handleResponse<{ status: string }>(res)),

  // Audit Events
  getAuditEvents: (params?: { resource_id?: number; booking_id?: number; limit?: number }) => {
    const url = new URL(`${window.location.origin}${API_BASE}/audit-events`);
    if (params?.resource_id) url.searchParams.append('resource_id', params.resource_id.toString());
    if (params?.booking_id) url.searchParams.append('booking_id', params.booking_id.toString());
    if (params?.limit) url.searchParams.append('limit', params.limit.toString());
    return fetch(url.toString(), { headers: getAuthHeaders() }).then(res => handleResponse<AuditEvent[]>(res));
  },

  // Dashboard Stats
  getDashboardStats: () =>
    fetch(`${API_BASE}/dashboard/stats`, { headers: getAuthHeaders() }).then(res => handleResponse<any>(res)),

  // AI Explainable Matcher
  getAiRecommendations: (purpose: string, needed_hours?: number, category?: string, location_preference?: string) =>
    fetch(`${API_BASE}/ai/match`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ purpose, needed_hours, category, location_preference }),
    }).then(res => handleResponse<{ query_summary: string; recommendations: ExplainableRecommendation[] }>(res)),

  parseNaturalSearch: (query: string) =>
    fetch(`${API_BASE}/ai/parse-search`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ query }),
    }).then(res => handleResponse<{ raw_query: string; suggested_category?: string; keywords: string[] }>(res)),
};
