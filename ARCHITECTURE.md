# ShareSphere System Architecture & Database Schema
> Trusted Resource Sharing & Accountability Platform

---

## 1. System Architecture Diagram

```mermaid
graph TB
    subgraph Client Layer [Frontend - React 19 + TypeScript + Vite]
        UI[Tailwind CSS v4 & Lucide UI]
        AuthCtx[AuthContext & Demo Switcher]
        APIClient[REST API Client /api]
    end

    subgraph Server Layer [Backend - FastAPI & Python 3.14]
        Router[FastAPI Application Routes]
        AuthEngine[JWT & PBKDF2 Password Hashing]
        FSM[Booking State Machine & Conflict Guard]
        AIMatcher[Explainable Capability & Safety Matcher]
        AuditLogger[Append-Only Audit Event Logger]
    end

    subgraph Data Layer [Database - SQLAlchemy ORM]
        DB[(SQLite / PostgreSQL Engine)]
        UsersTable[Users & Institutions]
        ResourcesTable[Resources & Operating Rules]
        BookingsTable[Bookings & Handover Checklists]
        AuditTable[Immutable Audit Events]
        IncidentsTable[Incidents & Dispute History]
        NotifsTable[In-App Notifications]
    end

    Client Layer -->|HTTP / JSON with JWT Bearer| Server Layer
    Router --> AuthEngine
    Router --> FSM
    Router --> AIMatcher
    FSM --> AuditLogger
    Server Layer -->|SQLAlchemy 2.0 ORM| Data Layer
```

---

## 2. Database Schema (Entity-Relationship)

```mermaid
erDiagram
    INSTITUTIONS ||--o{ USERS : "employs / enrolls"
    INSTITUTIONS ||--o{ RESOURCES : "houses"
    
    USERS ||--o{ RESOURCES : "owns / manages"
    USERS ||--o{ BOOKINGS : "requests"
    USERS ||--o{ USER_QUALIFICATIONS : "holds"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ INCIDENTS : "reports"

    QUALIFICATIONS ||--o{ USER_QUALIFICATIONS : "categorizes"
    
    RESOURCES ||--o{ BOOKINGS : "reserved for"
    RESOURCES ||--o{ INCIDENTS : "subject of"
    
    BOOKINGS ||--o| CHECK_IN_RECORDS : "initial condition"
    BOOKINGS ||--o| RETURN_RECORDS : "final condition"
    BOOKINGS ||--o{ INCIDENTS : "escalates to"
    
    AUDIT_EVENTS {
        int id PK
        string event_type
        int actor_id
        string actor_name
        string actor_role
        int resource_id
        int booking_id
        datetime timestamp
        string readable_summary
        json details
    }

    BOOKINGS {
        int id PK
        string booking_code UK
        int resource_id FK
        int borrower_id FK
        datetime start_time
        datetime end_time
        string purpose
        string status
        int queue_position
        string rejection_reason
        string cancellation_reason
    }

    CHECK_IN_RECORDS {
        int id PK
        int booking_id FK
        datetime checked_in_at
        boolean borrower_confirmed
        boolean owner_confirmed
        json condition_checklist
        string notes
        string photo_url
    }

    RETURN_RECORDS {
        int id PK
        int booking_id FK
        datetime returned_at
        boolean borrower_confirmed
        boolean owner_confirmed
        json final_condition_checklist
        string discrepancy_notes
        boolean missing_parts_flag
        string photo_url
    }
```

---

## 3. Booking Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> Draft : User creates draft
    Draft --> Pending_Approval : Submit eligible booking
    Draft --> Pending_Eligibility : Submit booking missing cert
    Draft --> Cancelled : User cancels

    Pending_Eligibility --> Pending_Approval : Qualifications verified by manager
    Pending_Eligibility --> Rejected : Qualification rejected
    Pending_Eligibility --> Cancelled

    Pending_Approval --> Approved : Owner approves
    Pending_Approval --> Waitlisted : Schedule conflict / capacity cap
    Pending_Approval --> Rejected : Owner rejects
    Pending_Approval --> Cancelled

    Waitlisted --> Approved : Prior booking cancelled & slot opened
    Waitlisted --> Cancelled

    Approved --> Checked_In : Borrower check-in & condition verified
    Approved --> Cancelled

    Checked_In --> Return_Pending : Borrower returns & records checklist
    Checked_In --> Overdue : Exceeded reservation end_time
    Checked_In --> Incident_Under_Review : Damage / unsafe use reported

    Overdue --> Return_Pending
    Overdue --> Incident_Under_Review

    Return_Pending --> Completed : Owner confirms return inspection
    Return_Pending --> Incident_Under_Review : Owner flags discrepancy / missing parts

    Incident_Under_Review --> Completed : Dispute resolved by manager
    Incident_Under_Review --> Rejected : Action dismissed / penalized

    Completed --> [*]
    Rejected --> [*]
    Cancelled --> [*]
```
