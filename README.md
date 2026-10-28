# ShareSphere — Trusted Resource Sharing & Accountability Platform
> **Problem Statement: “Unlock Underused Equipment and Spaces”**  
> *Production-style Full-Stack Web Application for College Laboratories, Technical Equipment, and Innovation Spaces*

---

## 🌟 Executive Overview
Colleges, universities, research laboratories, and makerspaces house millions of dollars in advanced equipment—such as 4-channel digital oscilloscopes, CO2 laser cutters, scanning electron microscopes, cinema camera kits, and GPU compute workstations—that frequently sit idle. Students and early-stage innovators need affordable access, while equipment owners demand **mandatory safety training verification**, **strict calendar conflict prevention**, **objective physical condition inspections at handover**, **anti-hoarding fair allocation**, and **immutable accountability**.

**ShareSphere** solves this through a full-stack platform featuring:
- **Strict Role-Based Access Control**: Borrower, Resource Owner, Institution Manager, and Administrator.
- **Enforced Safety Gates**: High-risk equipment (e.g., Class 4 lasers, cleanrooms) cannot be booked without verified certifications. Uncertified requests are rejected on the backend with actionable error messages.
- **End-to-End Handover Interface**: Condition checklists and server-generated timestamps captured at check-in and checkout.
- **Explainable AI Matching**: Natural-language goal matching with explainable bulleted justifications and capability alignment.
- **Append-Only Audit Trail**: Immutable ledger tracking every submission, approval, check-in, return inspection, and incident.
- **Dispute & Incident Arbitration**: Transparent dispute review with human decision history.

---

## 🏗️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4 |
| **Icons & UI** | Lucide React, Custom Institutional SaaS Design System |
| **Backend** | Python 3.14 / 3.11+, FastAPI, Uvicorn, Pydantic v2 |
| **Database** | SQLite development fallback (`backend/sharesphere.db`), PostgreSQL-ready via `DATABASE_URL` |
| **Authentication** | Secure salted PBKDF2 password hashing, JWT Bearer tokens |
| **Testing** | Automated Python test suite (`backend/test_backend.py`) covering 18 critical test cases |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** v18+ (tested on v26.4.0)
- **Python** 3.10+ (tested on Python 3.14)

### 2. Run Backend & Frontend in Two Terminals

#### Terminal 1 — Backend API Server
```bash
# Start FastAPI backend (automatically seeds demo dataset on first start)
npm run backend
# Or directly with Python:
py -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend runs at `http://127.0.0.1:8000` with interactive Swagger docs at `http://127.0.0.1:8000/docs`.*

#### Terminal 2 — Frontend Dev Server
```bash
# Install dependencies (if not already installed)
npm install

# Start Vite dev server
npm run dev
```
*Frontend runs at `http://127.0.0.1:5173/`.*

---

## 🧪 Automated Testing & Verification
ShareSphere includes an automated test suite verifying all 18 backend acceptance criteria:

```bash
# Run the automated test suite
npm run test:backend
# Or directly:
py -m backend.test_backend
```

### Verified Test Results Summary:
```text
============================================================
RUNNING SHARESPHERE COMPREHENSIVE AUTOMATED TEST SUITE
============================================================
[PASS] 1. API Health Check verified: 200 OK
[PASS] 2. Demo Accounts verified: 5 accounts returned with distinct roles
[PASS] 3. Login verified for Borrower 1 (Dr. Maya Lin)
[PASS] 4. Login verified for Resource Owner (Prof. Marcus Vance)
[PASS] 5. Login verified for Borrower 2 (Alex Chen)
[PASS] 6. Resource Catalogue verified: 7 items across institutional categories
[PASS] 7. Strict Safety Check Enforced: Uncertified borrower blocked from booking restricted laser cutter.
[PASS] 8. Certified Booking Submission: Dr. Maya Lin booking created (status: pending_approval)
[PASS] 9. Owner Approval: Booking moved to 'approved'.
[PASS] 10. Conflict Handling: Conflicting slot automatically placed on waitlist (Queue #1)
[PASS] 11. Handover Check-In: Server timestamp and initial condition checklist recorded.
[PASS] 12. Return Submission: Borrower return checklist recorded; status moved to 'return_pending'.
[PASS] 13. Owner Handover Signoff: Booking completed successfully with full transaction records.
[PASS] 14. Incident Reporting: Incident created.
[PASS] 15. Audit Trail Integrity: 5 append-only immutable events logged for booking lifecycle.
[PASS] 16. In-App Notifications verified: Generated on state transitions.
[PASS] 17. Explainable AI Matcher verified: Top match with explainable rationale bullet points.
[PASS] 18. Dynamic Dashboard Stats verified for Borrower.
============================================================
ALL 18 AUTOMATED TESTS PASSED SUCCESSFULLY!
============================================================
```

---

## 👥 Seeded Demonstration Accounts
All demo accounts use password: `demo1234`. Use the **1-Click Persona Switcher** in the top navigation bar to evaluate every role instantly without re-typing credentials.

| Role | Name | Email | Safety Qualifications | Scenario & Evaluation Purpose |
|---|---|---|---|---|
| **Borrower (Certified)** | Dr. Maya Lin | `borrower1@sharesphere.edu` | Laser Safety L2, Cleanroom ISO 6 | Verified researcher who can book restricted Class 4 lasers and cleanroom SEM. Has active checked-in oscilloscope. |
| **Borrower (Uncertified)** | Alex Chen | `borrower2@sharesphere.edu` | General Safety Only (Missing Laser) | Used to test safety gate enforcement: attempting to book laser cutter is strictly blocked. Holds waitlist position #1. |
| **Resource Owner** | Prof. Marcus Vance | `owner1@sharesphere.edu` | Lab Director | Manages 7 institutional resources, approves pending requests, signs off on handovers, inspects damage reports. |
| **Institution Manager** | Dr. Sarah Jenkins | `manager1@sharesphere.edu` | Facilities Dean | Institutional analytics, safety qualification approval, arbitration of condition discrepancy disputes. |
| **Administrator** | System Admin | `admin1@sharesphere.edu` | Operations IT | Global audit ledger inspection, system-wide integrity checks. |

---

## 📦 Listed Institutional Resources in Demo Seed

1. **Epilog Fusion Pro 48 Industrial CO2 Laser Cutter (120W)** — *Fabrication Tools* (Requires: `laser_safety_l2`)
2. **Rigol 4-Channel 500MHz Digital Oscilloscope & Logic Analyzer** — *Electronics & Testing Instruments*
3. **ThermoFisher Phenom XL Desktop SEM Microscope** — *Laboratories* (Requires: `cleanroom_iso6` + Supervision)
4. **Sony FX6 4K Full-Frame Cinema Camera Kit & Lenses** — *Cameras & AV Equipment*
5. **Deep Learning Compute Workstation (4x RTX 4090, 128GB RAM)** — *Computers & Workstations*
6. **Innovation Studio & Collaborative Arena (Room 402)** — *Meeting Rooms & Classrooms*
7. **Prusa XL Multi-Toolhead 3D Printer Farm (5 Extruders)** — *Innovation & Makerspace*

---

## 🔄 Booking State Machine Workflow

```
[Draft]
   ↓
[Pending Eligibility / Pending Approval] ──→ [Rejected / Cancelled]
   ↓                                                ↑
[Approved] ────────────→ [Waitlisted] ──────────────┘
   ↓
[Checked In] (Condition checklist + Server timestamp)
   ↓
[Return Pending] (Final condition checklist + Missing parts check)
   ↓
[Completed]  OR  [Incident Under Review] (Discrepancy flagged)
```

- **Valid Transitions**: Strictly enforced on the backend (`backend/state_machine.py`).
- **No Skipping**: Users cannot jump to completed or check-in without owner approval.
- **Append-Only Logging**: Every transition automatically appends an event to `audit_events`.

---

## 🛡️ Security & Privacy
- **Salted Password Hashing**: PBKDF2 with SHA-256 and unique institutional salt.
- **Server-Side Authorization**: Roles are enforced via FastAPI dependency injection (`require_roles`), not solely frontend hiding.
- **Server Timestamps**: Check-in and return times are generated on the server; client clocks cannot fabricate past timestamps.
- **Data Minimization**: Personal identifiable information is restricted to contact details required for asset custody.
