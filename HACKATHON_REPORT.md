# ShareSphere — Hackathon Submission Deliverable Report
**Problem Statement:** “Unlock Underused Equipment and Spaces”  
**Project:** ShareSphere (Trusted Resource Sharing & Accountability Platform)  
**Authors:** Full-Stack Engineering Team  

---

## 1. Problem Statement & Target Users

### Problem
Universities, colleges, laboratories, makerspaces, community organizations, and small tech firms own valuable equipment and spaces that often remain dormant 70% of the working week. At the same time, students, graduate researchers, creators, and early-stage startup teams lack affordable access to high-grade infrastructure. Traditional shared calendar systems (like Google Calendar or basic room bookers) fail because:
1. They lack **safety gate enforcement**: anyone can book an industrial laser cutter or cleanroom microscope without safety certifications.
2. They offer **no condition accountability**: if a $600 lens filter is scratched or cables go missing, there is no proof of who caused the damage.
3. They allow **resource hoarding**: without fair-use limits, a few individuals monopolize scarce tools.
4. They lack **explainable discovery**: users often do not know which equipment fits their experimental requirements.

### Target Users
- **Borrowers**: Students, graduate researchers, student startup founders, and cross-departmental creators.
- **Resource Owners**: Principal investigators, lab technicians, makerspace directors, and equipment custodians.
- **Institution Managers**: Department chairs, facilities deans, safety officers, and dispute arbiters.
- **Administrators**: Campus IT and campus-wide governance officers.

---

## 2. Solution & Core Workflows

ShareSphere provides an end-to-end trusted resource-sharing lifecycle:

1. **Safety First**: Every resource listing defines required safety training credentials (e.g. `laser_safety_l2`, `cleanroom_iso6`). The backend verifies the user's institutional qualification records. Uncertified borrowers cannot book restricted tools.
2. **Explainable AI Matching**: Users describe their research goal in natural language (e.g., *"Need to debug high-frequency noise on custom FPGA PCB"*). The engine evaluates equipment capabilities, verifies safety certifications, checks live calendar availability, and returns top matches with bulleted explanations.
3. **Dedicated Handover Interface**: Check-in captures server timestamps, condition checklists, and notes. Checkout captures clean return condition, cables returned, and missing parts flags.
4. **Append-Only Immutable Audit Trail**: Every transaction is permanently committed to `audit_events`.
5. **Fair Allocation & Waiting Lists**: Automatic FIFO queue positioning with automatic notifications if prior reservations are cancelled.
6. **Dispute & Incident Arbitration**: When discrepancies occur, human managers review evidence and record decisions without arbitrary AI penalties.

---

## 3. Technology Stack & Design Decisions

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React.
  - *Rationale*: Instant responsiveness, typed safety, institutional SaaS aesthetic (deep navy typography, crisp slate canvas, restrained indigo accents).
- **Backend**: Python 3.14, FastAPI, Uvicorn, Pydantic v2.
  - *Rationale*: High performance, automatic schema validation, auto-generated OpenAPI documentation at `/docs`, asynchronous speed.
- **Database**: SQLAlchemy 2.0 with SQLite development fallback and seamless PostgreSQL deployment capability via `DATABASE_URL`.
- **Security**: PBKDF2 salted password hashing, JWT Bearer tokens, server-side role dependency injection.

---

## 4. Privacy, Security & Fairness

1. **Security**:
   - Passwords hashed using PBKDF2 with SHA-256 and unique institutional salt.
   - Roles strictly enforced on the backend via `require_roles(['owner', 'manager'])`.
   - Server-generated timestamps prevent client clock tampering.
2. **Privacy**:
   - Minimal PII collection (name, institutional email, department).
   - Audit trail redacts passwords and secrets.
3. **Fairness**:
   - Rolling 7-day quota prevents hoarding.
   - Transparent FIFO waiting list with queue position visibility.
   - No secret priority algorithms; all allocation rules are disclosed to the borrower.

---

## 5. 3-Minute Judge Presentation Script

```text
[0:00 - 0:30] THE PROBLEM & CONSOLE OVERVIEW
"Good afternoon judges. Millions of dollars of lab equipment sits idle in universities because lab directors fear uncertified users and lack condition accountability. ShareSphere solves this with verified safety gates, explainable AI discovery, and handover accountability. Notice our clean institutional SaaS interface and our 1-click persona switcher."

[0:30 - 1:00] SAFETY GATE ENFORCEMENT DEMO
"First, let's look at safety. I switch to Alex Chen—an undergraduate who only holds general safety. Alex opens our industrial Epilog CO2 Laser Cutter and tries to book it. Watch: the backend immediately blocks the reservation with a clear explanation: 'Missing mandatory verified qualification: laser_safety_l2'. No dangerous bypasses."

[1:00 - 1:45] EXPLAINABLE AI MATCHING & LEGITIMATE BOOKING
"Now, let's switch to Dr. Maya Lin, a certified researcher. She opens the 'AI Equipment Matcher' and types: 'Need to engrave precision acrylic microfluidics'. The system analyzes equipment capabilities, verifies Maya's Level 2 laser cert, checks availability, and explains with clear bullet points why this laser cutter is recommended. Maya submits the booking, and it enters our strict state machine."

[1:45 - 2:30] OWNER APPROVAL & HANDOVER CHECK-IN
"Next, I switch to Prof. Marcus Vance, the Lab Director. In 'Approvals & Bookings', he reviews Maya's request and approves it. Maya now sees the booking move to 'Approved'. At the lab bench, Maya completes the Check-In modal, confirming the cleanliness, accessories, and calibration checklists. The server captures an immutable timestamp."

[2:30 - 3:00] RETURN, INCIDENTS & IMMUTABLE AUDIT TRAIL
"Upon return, condition is inspected. In our seeded scenario, on booking BK-7805 for the Sony FX6 Cinema kit, a scratched filter thread was flagged. This immediately spawned Incident INC-0041, assigned to Facilities Dean Sarah Jenkins for arbitration. Finally, look at the 'Immutable Audit Trail': every submission, approval, handover check-in, return, and incident is logged with server timestamps. ShareSphere brings trust, safety, and accountability to shared research infrastructure."
```

---

## 6. Known Limitations & Future Development

1. **Physical Hardware Locks**: Currently relies on digital signoff and staff handovers. Future work will integrate NFC/RFID badge readers and electronic smart-lockers.
2. **Automated Calibration Telemetry**: In the future, IoT instruments can directly report runtime telemetry (e.g., laser tube hours or SEM vacuum pressure) into the return record.
3. **Third-Party LMS Integration**: Can connect to university Canvas/Blackboard LMS to automatically sync completed lab safety certifications.

---

## 7. AI Disclosure
- **AI Coding Assistance**: Google DeepMind Antigravity was used as an agentic pair-programming tool during the designated hackathon build window.
- **AI System Features**: Deterministic explainable keyword and capability matching engine built into the backend, with optional Google Generative AI enhancement for natural language query parsing.
