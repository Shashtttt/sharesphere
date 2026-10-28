import datetime
from sqlalchemy.orm import Session
from backend.database import SessionLocal, Base, engine
from backend.models import (
    Institution, User, Qualification, UserQualification,
    Resource, Booking, CheckInRecord, ReturnRecord, Incident,
    AuditEvent, Notification
)
from backend.auth import hash_password

def seed_database():
    # Ensure all tables exist
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).count() > 0:
            print("[INFO] Database already seeded. Skipping initial seeding.")
            return

        print("[SEED] Seeding ShareSphere institutional demo dataset...")

        # 1. Institutions
        inst = Institution(
            name="Apex Institute of Technology & Research",
            slug="apex-tech",
            address="400 Innovation Boulevard, Tech District, Cambridge, MA"
        )
        db.add(inst)
        db.flush()

        # 2. Qualifications
        q_laser = Qualification(
            code="laser_safety_l2",
            name="Laser Safety Level 2 Certification",
            description="Authorizes operation of Class 3B and Class 4 industrial laser cutting and engraving systems.",
            issuing_body="Department of Environmental Health & Safety (EHS)",
            validity_days=365
        )
        q_cleanroom = Qualification(
            code="cleanroom_iso6",
            name="ISO Class 6 Cleanroom & Vacuum Protocols",
            description="Mandatory gowning, particle control, and vacuum pump operations in nanotech cleanrooms.",
            issuing_body="Nanotechnology Center",
            validity_days=730
        )
        q_general_safety = Qualification(
            code="general_lab_safety",
            name="General Laboratory Safety & Chemical Hygiene",
            description="Foundational safety training covering hazardous waste, PPE, and emergency evacuation.",
            issuing_body="Campus Safety Board",
            validity_days=365
        )
        db.add_all([q_laser, q_cleanroom, q_general_safety])
        db.flush()

        # 3. Users (Password for all demo users is: demo1234)
        pw_hash = hash_password("demo1234")

        # Borrower 1: Certified Researcher
        u_borrower1 = User(
            email="borrower1@sharesphere.edu",
            hashed_password=pw_hash,
            full_name="Dr. Maya Lin",
            role="borrower",
            department="Precision Engineering & Applied Physics",
            phone="+1 (555) 234-5671",
            institution_id=inst.id
        )
        # Borrower 2: Undergraduate Student (missing Laser cert)
        u_borrower2 = User(
            email="borrower2@sharesphere.edu",
            hashed_password=pw_hash,
            full_name="Alex Chen",
            role="borrower",
            department="Computer Science & Electrical Engineering",
            phone="+1 (555) 345-6782",
            institution_id=inst.id
        )
        # Resource Owner: Lab Director
        u_owner = User(
            email="owner1@sharesphere.edu",
            hashed_password=pw_hash,
            full_name="Prof. Marcus Vance",
            role="owner",
            department="Robotics, Microelectronics & Fabrication Lab",
            phone="+1 (555) 456-7893",
            institution_id=inst.id
        )
        # Institution Manager: Facilities Dean
        u_manager = User(
            email="manager1@sharesphere.edu",
            hashed_password=pw_hash,
            full_name="Dr. Sarah Jenkins",
            role="manager",
            department="Office of Vice Provost for Research Infrastructure",
            phone="+1 (555) 567-8904",
            institution_id=inst.id
        )
        # System Admin
        u_admin = User(
            email="admin1@sharesphere.edu",
            hashed_password=pw_hash,
            full_name="System Administrator",
            role="admin",
            department="Institutional Operations & IT",
            phone="+1 (555) 678-9015",
            institution_id=inst.id
        )
        db.add_all([u_borrower1, u_borrower2, u_owner, u_manager, u_admin])
        db.flush()

        # 4. Assign User Qualifications
        # Dr. Maya Lin has verified laser safety and cleanroom protocols
        uq1 = UserQualification(
            user_id=u_borrower1.id,
            qualification_id=q_laser.id,
            status="verified",
            document_ref="CERT-EHS-2026-9921.pdf",
            verification_notes="Verified via EHS Central Registry by safety officer.",
            expires_at=datetime.datetime.utcnow() + datetime.timedelta(days=280)
        )
        uq2 = UserQualification(
            user_id=u_borrower1.id,
            qualification_id=q_cleanroom.id,
            status="verified",
            document_ref="CERT-NANO-2025-4410.pdf",
            verification_notes="Passed cleanroom gowning practical examination.",
            expires_at=datetime.datetime.utcnow() + datetime.timedelta(days=400)
        )
        # Alex Chen has general safety, but NO laser safety cert (for testing restriction check!)
        uq3 = UserQualification(
            user_id=u_borrower2.id,
            qualification_id=q_general_safety.id,
            status="verified",
            document_ref="CERT-GLS-2026-1029.pdf",
            verification_notes="Completed online module and quiz.",
            expires_at=datetime.datetime.utcnow() + datetime.timedelta(days=180)
        )
        db.add_all([uq1, uq2, uq3])
        db.flush()

        # 5. Resources
        r_scope = Resource(
            title="Rigol 4-Channel 500MHz Digital Oscilloscope & Logic Analyzer",
            description="Ultra-low noise 4-channel mixed-signal oscilloscope with 8 GSa/s real-time sample rate, protocol decoding (I2C, SPI, CAN), and arbitrary waveform generation. Ideal for PCB hardware debugging.",
            category="Electronics & Testing Instruments",
            resource_type="equipment",
            owner_id=u_owner.id,
            institution_id=inst.id,
            building="Maxwell Hall of Electronics",
            room_location="Lab 204 - Hardware Bench 3",
            image_url="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
            availability_schedule={"days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], "hours": "08:00 - 22:00"},
            min_duration_hours=1.0,
            max_duration_hours=8.0,
            max_booking_frequency_per_week=4,
            usage_rules="Calibrate probes prior to high-voltage measurements. Ground yourself using ESD wrist strap provided.",
            required_qualifications=[],
            membership_required=False,
            supervision_required=False,
            security_deposit=0.0,
            condition_status="excellent",
            approval_required=True,
            is_published=True
        )

        r_laser = Resource(
            title="Epilog Fusion Pro 48 Industrial CO2 Laser Cutter & Engraver (120W)",
            description="High-speed dual-head CO2 laser cutting system with IRIS camera positioning and 48x36 inch motorized cutting bed. Suitable for acrylics, wood, Delrin, and anodized metals. Mandatory Level 2 safety training required.",
            category="Fabrication Tools",
            resource_type="equipment",
            owner_id=u_owner.id,
            institution_id=inst.id,
            building="Makerspace Foundry",
            room_location="Bay 12 - Thermal Fab",
            image_url="https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80",
            availability_schedule={"days": ["Mon", "Tue", "Wed", "Thu", "Fri"], "hours": "09:00 - 19:00"},
            min_duration_hours=0.5,
            max_duration_hours=4.0,
            max_booking_frequency_per_week=3,
            usage_rules="Never operate unattended. Fume extraction must be turned on at all times. Check material SDS sheet.",
            required_qualifications=["laser_safety_l2"],
            membership_required=True,
            supervision_required=False,
            security_deposit=100.0,
            condition_status="excellent",
            approval_required=True,
            is_published=True
        )

        r_sem = Resource(
            title="ThermoFisher Phenom XL Desktop Scanning Electron Microscope (SEM)",
            description="High-throughput automated SEM capable of 100,000x magnification with integrated Energy Dispersive Spectroscopy (EDS) for elemental chemical composition mapping.",
            category="Laboratories",
            resource_type="bench",
            owner_id=u_owner.id,
            institution_id=inst.id,
            building="Materials Science Tower",
            room_location="Cleanroom Suite B - Sub-bay 4",
            image_url="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80",
            availability_schedule={"days": ["Mon", "Tue", "Wed", "Thu"], "hours": "10:00 - 18:00"},
            min_duration_hours=2.0,
            max_duration_hours=6.0,
            max_booking_frequency_per_week=2,
            usage_rules="Samples must be completely dry and vacuum-stable. Gold sputter coating required for non-conductive specimens.",
            required_qualifications=["cleanroom_iso6"],
            membership_required=True,
            supervision_required=True,
            security_deposit=250.0,
            condition_status="good",
            approval_required=True,
            is_published=True
        )

        r_camera = Resource(
            title="Sony FX6 4K Full-Frame Cinema Camera Kit & G-Master Cinema Lenses",
            description="Complete documentary field package: Sony FX6 Cinema Line body, 24-70mm f/2.8 GM II, 70-200mm f/2.8 GM II, dual wireless lavalier microphones, matte box, and carbon fiber tripod.",
            category="Cameras & AV Equipment",
            resource_type="equipment",
            owner_id=u_owner.id,
            institution_id=inst.id,
            building="Digital Media Arts Pavilion",
            room_location="Gear Vault - Locker 14",
            image_url="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
            availability_schedule={"days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], "hours": "07:00 - 21:00"},
            min_duration_hours=2.0,
            max_duration_hours=24.0,
            max_booking_frequency_per_week=2,
            usage_rules="Return all lens caps immediately. Do not expose camera body to precipitation.",
            required_qualifications=[],
            membership_required=False,
            supervision_required=False,
            security_deposit=150.0,
            condition_status="good",
            approval_required=True,
            is_published=True
        )

        r_workstation = Resource(
            title="Deep Learning Compute Workstation (4x NVIDIA RTX 4090 24GB, 128GB DDR5)",
            description="Dedicated local machine learning training rig with liquid cooling, dual 2TB NVMe scratch disks, PyTorch, CUDA 12.8, and Docker pre-configured. Direct local or SSH console access.",
            category="Computers & Workstations",
            resource_type="equipment",
            owner_id=u_owner.id,
            institution_id=inst.id,
            building="Turing Computing Complex",
            room_location="Room 310 - Cluster Rack 2",
            image_url="https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80",
            availability_schedule={"days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], "hours": "00:00 - 23:59"},
            min_duration_hours=2.0,
            max_duration_hours=48.0,
            max_booking_frequency_per_week=3,
            usage_rules="Clean /tmp scratch directory upon session completion. Do not store sensitive unencrypted datasets.",
            required_qualifications=[],
            membership_required=False,
            supervision_required=False,
            security_deposit=0.0,
            condition_status="excellent",
            approval_required=False,
            is_published=True
        )

        r_studio = Resource(
            title="Innovation Studio & Interactive Collaborative Presentation Arena",
            description="A 45-seat reconfigurable acoustic workspace with dual 85-inch 4K interactive displays, wireless presentation systems, surround microphones, and mobile whiteboards.",
            category="Meeting Rooms & Classrooms",
            resource_type="space",
            owner_id=u_owner.id,
            institution_id=inst.id,
            building="Center for Collaborative Innovation",
            room_location="Room 402 - Level 4 West",
            image_url="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
            availability_schedule={"days": ["Mon", "Tue", "Wed", "Thu", "Fri"], "hours": "08:00 - 20:00"},
            min_duration_hours=1.0,
            max_duration_hours=6.0,
            max_booking_frequency_per_week=2,
            usage_rules="Reset furniture layout to classroom standard. Erase all whiteboards before leaving.",
            required_qualifications=[],
            membership_required=False,
            supervision_required=False,
            security_deposit=0.0,
            condition_status="excellent",
            approval_required=True,
            is_published=True
        )

        r_3dprint = Resource(
            title="Prusa XL Multi-Toolhead 3D Printer Farm (5 Independent Extruders)",
            description="Large-format 360x360x360mm build volume 3D printer with 5 toolheads for multi-material, soluble support, and multi-color technical prints (PLA, PETG, ASA, TPU, PVA).",
            category="Innovation & Makerspace",
            resource_type="equipment",
            owner_id=u_owner.id,
            institution_id=inst.id,
            building="Makerspace Foundry",
            room_location="Rapid Prototyping Bench 1",
            image_url="https://images.unsplash.com/photo-1631556097152-c39479cbfeab?auto=format&fit=crop&w=800&q=80",
            availability_schedule={"days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], "hours": "08:00 - 22:00"},
            min_duration_hours=1.0,
            max_duration_hours=12.0,
            max_booking_frequency_per_week=5,
            usage_rules="Use approved filament brands only. Clean textured PEI sheet with isopropyl alcohol after each job.",
            required_qualifications=[],
            membership_required=False,
            supervision_required=False,
            security_deposit=0.0,
            condition_status="excellent",
            approval_required=False,
            is_published=True
        )

        db.add_all([r_scope, r_laser, r_sem, r_camera, r_workstation, r_studio, r_3dprint])
        db.flush()

        now = datetime.datetime.utcnow()

        # 6. Seed Realistic Bookings across multiple lifecycle states
        # Booking 1: Approved and Ready to Check In
        b1_start = now + datetime.timedelta(hours=1)
        b1_end = b1_start + datetime.timedelta(hours=3)
        b1 = Booking(
            booking_code="BK-2026-7801",
            resource_id=r_laser.id,
            borrower_id=u_borrower1.id,
            start_time=b1_start,
            end_time=b1_end,
            purpose="Precision micro-fluidic channel engraving on acrylic sheets for bio-chip prototyping.",
            status="approved"
        )

        # Booking 2: Currently Checked In (Active use)
        b2_start = now - datetime.timedelta(hours=1)
        b2_end = now + datetime.timedelta(hours=2)
        b2 = Booking(
            booking_code="BK-2026-7802",
            resource_id=r_scope.id,
            borrower_id=u_borrower1.id,
            start_time=b2_start,
            end_time=b2_end,
            purpose="High-frequency signal integrity analysis on custom RISC-V microcontroller bus.",
            status="checked_in"
        )
        db.add_all([b1, b2])
        db.flush()

        # Check-in record for B2
        c2 = CheckInRecord(
            booking_id=b2.id,
            checked_in_at=b2_start,
            borrower_confirmed=True,
            owner_confirmed=True,
            condition_checklist={
                "cleanliness_verified": True,
                "accessories_intact": True,
                "no_visible_damage": True,
                "operational_test_passed": True
            },
            notes="Probes and logic analyzer harness verified present and fully calibrated."
        )
        db.add(c2)

        # Booking 3: Completed with both CheckIn and Return records
        b3_start = now - datetime.timedelta(days=2, hours=4)
        b3_end = now - datetime.timedelta(days=2, hours=1)
        b3 = Booking(
            booking_code="BK-2026-7803",
            resource_id=r_studio.id,
            borrower_id=u_borrower1.id,
            start_time=b3_start,
            end_time=b3_end,
            purpose="Inter-departmental quarterly grant proposal rehearsal and deck review.",
            status="completed"
        )
        db.add(b3)
        db.flush()

        c3 = CheckInRecord(
            booking_id=b3.id,
            checked_in_at=b3_start,
            borrower_confirmed=True,
            owner_confirmed=True,
            condition_checklist={"cleanliness_verified": True, "accessories_intact": True, "no_visible_damage": True, "operational_test_passed": True},
            notes="Microphones and dual displays functional."
        )
        r3 = ReturnRecord(
            booking_id=b3.id,
            returned_at=b3_end,
            borrower_confirmed=True,
            owner_confirmed=True,
            final_condition_checklist={"item_cleaned": True, "all_cables_returned": True, "no_new_damage": True, "properly_shutdown": True},
            discrepancy_notes="Room left in pristine condition. Displays turned off.",
            missing_parts_flag=False
        )
        db.add_all([c3, r3])

        # Booking 4: Waitlisted (Waitlist queue demonstration!)
        b4 = Booking(
            booking_code="BK-2026-7804",
            resource_id=r_camera.id,
            borrower_id=u_borrower2.id,
            start_time=now + datetime.timedelta(days=1, hours=2),
            end_time=now + datetime.timedelta(days=1, hours=6),
            purpose="Student engineering club autonomous robotics vehicle field trial video documentation.",
            status="waitlisted",
            queue_position=1
        )

        # Booking 5: Overdue Return with Incident under review
        b5_start = now - datetime.timedelta(hours=14)
        b5_end = now - datetime.timedelta(hours=6)
        b5 = Booking(
            booking_code="BK-2026-7805",
            resource_id=r_camera.id,
            borrower_id=u_borrower1.id,
            start_time=b5_start,
            end_time=b5_end,
            purpose="Laboratory safety induction instructional video filming.",
            status="incident_under_review"
        )
        db.add_all([b4, b5])
        db.flush()

        # CheckIn and Return records for B5 flagging discrepancy
        c5 = CheckInRecord(
            booking_id=b5.id,
            checked_in_at=b5_start,
            borrower_confirmed=True,
            owner_confirmed=True,
            condition_checklist={"cleanliness_verified": True, "accessories_intact": True, "no_visible_damage": True, "operational_test_passed": True},
            notes="Checked out full camera package in good working order."
        )
        r5 = ReturnRecord(
            booking_id=b5.id,
            returned_at=now - datetime.timedelta(hours=2),
            borrower_confirmed=True,
            owner_confirmed=False,
            final_condition_checklist={"item_cleaned": True, "all_cables_returned": False, "no_new_damage": False, "properly_shutdown": True},
            discrepancy_notes="Owner inspection found hairline scratch on 24-70mm front lens filter thread and missing USB-C tether cable.",
            missing_parts_flag=True
        )
        db.add_all([c5, r5])
        db.flush()

        # Incident report tied to B5
        inc1 = Incident(
            incident_number="INC-2026-0041",
            booking_id=b5.id,
            resource_id=r_camera.id,
            reporter_id=u_owner.id,
            assigned_to_id=u_manager.id,
            incident_type="damage",
            severity="medium",
            status="under_review",
            title="Filter thread scratch & missing tether cable on Sony FX6 kit",
            description="During equipment check-in inspection following booking BK-2026-7805, the lab director noticed a minor impact mark on the outer filter ring of the 24-70mm lens and one missing 5-meter USB-C tethering cable. Borrower was notified for explanation.",
            resolution_notes="Manager Jenkins reviewing lab security footage and replacement parts receipt."
        )
        db.add(inc1)
        db.flush()

        # 7. Seed In-App Notifications
        n1 = Notification(
            user_id=u_borrower1.id,
            title="Booking BK-2026-7801 Approved",
            message="Your booking for the Epilog CO2 Laser Cutter has been approved by Prof. Vance. You can check in when your reservation starts.",
            type="success",
            resource_id=r_laser.id,
            booking_id=b1.id
        )
        n2 = Notification(
            user_id=u_borrower2.id,
            title="Waitlist Position Confirmed",
            message="You are currently at Queue Position #1 for the Sony FX6 Cinema Kit. You will receive an instant notification if a slot opens.",
            type="info",
            resource_id=r_camera.id,
            booking_id=b4.id
        )
        n3 = Notification(
            user_id=u_owner.id,
            title="Check-In Confirmed for BK-2026-7802",
            message="Dr. Maya Lin has verified hardware bench equipment condition and checked in to the Digital Oscilloscope.",
            type="info",
            resource_id=r_scope.id,
            booking_id=b2.id
        )
        n4 = Notification(
            user_id=u_manager.id,
            title="Incident INC-2026-0041 Assigned For Review",
            message="New condition discrepancy report filed on Sony FX6 Camera Kit requires institutional manager review.",
            type="warning",
            resource_id=r_camera.id,
            incident_id=inc1.id
        )
        db.add_all([n1, n2, n3, n4])

        # 8. Seed Audit Trail Events (Append-only)
        events = [
            AuditEvent(
                event_type="SYSTEM_INITIALIZATION",
                actor_id=u_admin.id,
                actor_name=u_admin.full_name,
                actor_role=u_admin.role,
                timestamp=now - datetime.timedelta(days=7),
                readable_summary="System initialization and institutional domain verified for Apex Institute of Technology.",
                details={"institution": inst.name, "env": "production-demo"}
            ),
            AuditEvent(
                event_type="RESOURCE_CREATED",
                actor_id=u_owner.id,
                actor_name=u_owner.full_name,
                actor_role=u_owner.role,
                resource_id=r_laser.id,
                timestamp=now - datetime.timedelta(days=5),
                readable_summary=f"Resource '{r_laser.title}' created and safety requirements set to [laser_safety_l2].",
                details={"category": r_laser.category, "approval_required": True}
            ),
            AuditEvent(
                event_type="BOOKING_APPROVED",
                actor_id=u_owner.id,
                actor_name=u_owner.full_name,
                actor_role=u_owner.role,
                resource_id=r_laser.id,
                booking_id=b1.id,
                timestamp=now - datetime.timedelta(hours=2),
                readable_summary=f"Booking #{b1.booking_code} approved for Dr. Maya Lin by Lab Director Marcus Vance.",
                details={"qualifications_verified": ["laser_safety_l2"]}
            ),
            AuditEvent(
                event_type="CHECK_IN_CONFIRMED",
                actor_id=u_borrower1.id,
                actor_name=u_borrower1.full_name,
                actor_role=u_borrower1.role,
                resource_id=r_scope.id,
                booking_id=b2.id,
                timestamp=b2_start,
                readable_summary=f"Handover completed: Borrower confirmed initial operational checklist for #{b2.booking_code}.",
                details={"cleanliness": True, "calibration": True}
            ),
            AuditEvent(
                event_type="INCIDENT_REPORTED",
                actor_id=u_owner.id,
                actor_name=u_owner.full_name,
                actor_role=u_owner.role,
                resource_id=r_camera.id,
                booking_id=b5.id,
                incident_id=inc1.id,
                timestamp=now - datetime.timedelta(hours=2),
                readable_summary=f"Discrepancy flagged: Incident #{inc1.incident_number} filed for inspection discrepancy.",
                details={"severity": "medium", "missing_tether": True}
            )
        ]
        db.add_all(events)

        db.commit()
        print("[SUCCESS] ShareSphere demo scenario seeded successfully!")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Seeding failed: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
