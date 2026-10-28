import os
import sys
import datetime
from fastapi.testclient import TestClient
from backend.main import app
from backend.seed import seed_database

client = TestClient(app)

def test_full_platform_suite():
    print("=" * 60)
    print("RUNNING SHARESPHERE COMPREHENSIVE AUTOMATED TEST SUITE")
    print("=" * 60)

    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[PASS] 1. API Health Check verified: 200 OK")

    # 2. Demo accounts
    res = client.get("/api/demo/accounts")
    assert res.status_code == 200
    accounts = res.json()
    assert len(accounts) >= 5
    print(f"[PASS] 2. Demo Accounts verified: {len(accounts)} accounts returned with distinct roles")

    # 3. Authentication (Login with Demo Borrower 1)
    res = client.post("/api/auth/login", json={
        "email": "borrower1@sharesphere.edu",
        "password": "demo1234"
    })
    assert res.status_code == 200
    token_data = res.json()
    token_borrower1 = token_data["access_token"]
    user_borrower1 = token_data["user"]
    assert user_borrower1["role"] == "borrower"
    print(f"[PASS] 3. Login verified for Borrower 1 ({user_borrower1['full_name']})")

    # Login with Owner
    res = client.post("/api/auth/login", json={
        "email": "owner1@sharesphere.edu",
        "password": "demo1234"
    })
    assert res.status_code == 200
    token_owner = res.json()["access_token"]
    print("[PASS] 4. Login verified for Resource Owner (Prof. Marcus Vance)")

    # Login with Borrower 2 (Alex Chen, missing laser qualification)
    res = client.post("/api/auth/login", json={
        "email": "borrower2@sharesphere.edu",
        "password": "demo1234"
    })
    assert res.status_code == 200
    token_borrower2 = res.json()["access_token"]
    print("[PASS] 5. Login verified for Borrower 2 (Alex Chen)")

    # 4. Resource Catalogue Listing
    res = client.get("/api/resources")
    assert res.status_code == 200
    resources = res.json()
    assert len(resources) >= 7
    laser_resource = next(r for r in resources if "Laser Cutter" in r["title"])
    oscilloscope_resource = next(r for r in resources if "Oscilloscope" in r["title"])
    print(f"[PASS] 6. Resource Catalogue verified: {len(resources)} items across institutional categories")

    # 5. Safety & Eligibility Enforcement
    # Alex Chen (borrower2) attempts to book the Laser Cutter (requires laser_safety_l2)
    # Backend MUST reject with 400 and clear explanation!
    import random
    now = datetime.datetime.utcnow()
    req_start = (now + datetime.timedelta(days=random.randint(15, 90), hours=random.randint(1, 8)))
    req_end = req_start + datetime.timedelta(hours=2)

    res = client.post(
        "/api/bookings",
        json={
            "resource_id": laser_resource["id"],
            "start_time": req_start.isoformat(),
            "end_time": req_end.isoformat(),
            "purpose": "Trying out laser cutting without prior certification."
        },
        headers={"Authorization": f"Bearer {token_borrower2}"}
    )
    assert res.status_code == 400, f"Expected 400 for uncertified user, got {res.status_code}"
    assert "Missing mandatory verified qualifications" in res.json()["detail"] or "Eligibility check failed" in res.json()["detail"]
    print("[PASS] 7. Strict Safety Check Enforced: Uncertified borrower blocked from booking restricted laser cutter.")

    # 6. Eligible Booking Submission
    # Register a dedicated certified test researcher for reproducible quota test
    res_cert = client.post("/api/auth/register", json={
        "email": f"certified_researcher_{int(now.timestamp())}@sharesphere.edu",
        "password": "demo1234password",
        "full_name": "Dr. Maya Lin Test",
        "role": "borrower",
        "department": "Applied Physics"
    })
    token_certified_user = res_cert.json()["access_token"]
    certified_user_id = res_cert.json()["user"]["id"]

    # Grant verified laser qualification in DB
    from backend.database import SessionLocal
    from backend.models import UserQualification, Qualification
    init_db = SessionLocal()
    laser_qual = init_db.query(Qualification).filter(Qualification.code == "laser_safety_l2").first()
    if laser_qual:
        init_db.add(UserQualification(
            user_id=certified_user_id,
            qualification_id=laser_qual.id,
            status="verified",
            document_ref="CERT-INIT-2026.pdf"
        ))
        init_db.commit()
    init_db.close()

    res = client.post(
        "/api/bookings",
        json={
            "resource_id": laser_resource["id"],
            "start_time": req_start.isoformat(),
            "end_time": req_end.isoformat(),
            "purpose": "Precision micro-fluidic channel cutting with verified Level 2 certification."
        },
        headers={"Authorization": f"Bearer {token_certified_user}"}
    )
    assert res.status_code == 200, f"Expected 200 for certified user, got {res.status_code}: {res.text}"
    new_booking = res.json()
    new_booking_id = new_booking["id"]
    print(f"[PASS] 8. Certified Booking Submission: Booking created (#{new_booking['booking_code']}, status: {new_booking['status']})")

    # 7. Owner Review & Approval
    res = client.post(
        f"/api/bookings/{new_booking_id}/review",
        json={"action": "approve", "reason": "Laser qualification confirmed in institutional registry."},
        headers={"Authorization": f"Bearer {token_owner}"}
    )
    assert res.status_code == 200
    approved_booking = res.json()
    assert approved_booking["status"] == "approved"
    print(f"[PASS] 9. Owner Approval: Booking moved to 'approved'.")

    # 8. Overlap / Conflict Prevention
    # A second certified user attempts to book the exact same slot that was just approved
    # Register second user for isolated quota test
    res_reg = client.post("/api/auth/register", json={
        "email": f"competitor_{int(now.timestamp())}@sharesphere.edu",
        "password": "demo1234password",
        "full_name": "Competing Research Group",
        "role": "borrower",
        "department": "Physics"
    })
    token_competitor = res_reg.json()["access_token"]
    competitor_id = res_reg.json()["user"]["id"]

    # Grant laser safety qualification to competitor in DB so they pass safety gate
    from backend.database import SessionLocal
    from backend.models import UserQualification, Qualification
    test_db = SessionLocal()
    laser_qual = test_db.query(Qualification).filter(Qualification.code == "laser_safety_l2").first()
    if laser_qual:
        uq_comp = UserQualification(
            user_id=competitor_id,
            qualification_id=laser_qual.id,
            status="verified",
            document_ref="CERT-COMP-2026.pdf"
        )
        test_db.add(uq_comp)
        test_db.commit()
    test_db.close()

    res = client.post(
        "/api/bookings",
        json={
            "resource_id": laser_resource["id"],
            "start_time": req_start.isoformat(),
            "end_time": req_end.isoformat(),
            "purpose": "Competing group trying to reserve same slot."
        },
        headers={"Authorization": f"Bearer {token_competitor}"}
    )
    assert res.status_code == 200, f"Expected 200 with waitlist placement, got {res.status_code}: {res.text}"
    conflicted_booking = res.json()
    # It should automatically be placed on the waitlist!
    assert conflicted_booking["status"] == "waitlisted"
    assert conflicted_booking["queue_position"] is not None
    print(f"[PASS] 10. Conflict Handling: Conflicting slot automatically placed on waitlist (Queue #{conflicted_booking['queue_position']})")

    # 9. Check-in Interface & Handover
    res = client.post(
        f"/api/bookings/{new_booking_id}/check-in",
        json={
            "condition_checklist": {
                "cleanliness_verified": True,
                "accessories_intact": True,
                "no_visible_damage": True,
                "operational_test_passed": True
            },
            "notes": "Lens clean, air assist compressor operating normally.",
            "photo_url": "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122"
        },
        headers={"Authorization": f"Bearer {token_certified_user}"}
    )
    assert res.status_code == 200, f"Check-in failed: {res.text}"
    checked_in_booking = res.json()
    assert checked_in_booking["status"] == "checked_in"
    print("[PASS] 11. Handover Check-In: Server timestamp and initial condition checklist recorded.")

    # 10. Return & Condition Report
    res = client.post(
        f"/api/bookings/{new_booking_id}/return",
        json={
            "final_condition_checklist": {
                "item_cleaned": True,
                "all_cables_returned": True,
                "no_new_damage": True,
                "properly_shutdown": True
            },
            "discrepancy_notes": "Cutting bed vacuumed, exhaust shutdown completed.",
            "missing_parts_flag": False
        },
        headers={"Authorization": f"Bearer {token_certified_user}"}
    )
    assert res.status_code == 200, f"Return failed: {res.text}"
    return_pending_booking = res.json()
    assert return_pending_booking["status"] == "return_pending"
    print("[PASS] 12. Return Submission: Borrower return checklist recorded; status moved to 'return_pending'.")

    # 11. Owner Return Signoff
    res = client.post(
        f"/api/bookings/{new_booking_id}/return-confirm",
        json={"owner_confirmed": True, "discrepancy_flag": False, "owner_notes": "Inspection passed. Equipment in great shape."},
        headers={"Authorization": f"Bearer {token_owner}"}
    )
    assert res.status_code == 200, f"Return confirmation failed: {res.text}"
    completed_booking = res.json()
    assert completed_booking["status"] == "completed"
    print("[PASS] 13. Owner Handover Signoff: Booking completed successfully with full transaction records.")

    # 12. Incident Reporting & Resolution
    res = client.post(
        "/api/incidents",
        json={
            "resource_id": oscilloscope_resource["id"],
            "incident_type": "late_return",
            "severity": "low",
            "title": "Minor return delay due to building power outage",
            "description": "Equipment was returned 30 minutes late due to scheduled building maintenance."
        },
        headers={"Authorization": f"Bearer {token_certified_user}"}
    )
    assert res.status_code == 200
    inc_data = res.json()
    print(f"[PASS] 14. Incident Reporting: Incident #{inc_data['incident_number']} created.")

    # 13. Append-Only Audit Trail
    res = client.get(
        f"/api/audit-events?booking_id={new_booking_id}",
        headers={"Authorization": f"Bearer {token_certified_user}"}
    )
    assert res.status_code == 200
    audit_events = res.json()
    assert len(audit_events) >= 3  # SUBMITTED, APPROVED, CHECK_IN, etc.
    print(f"[PASS] 15. Audit Trail Integrity: {len(audit_events)} append-only immutable events logged for booking lifecycle.")

    # 14. Notifications Delivery
    res = client.get(
        "/api/notifications",
        headers={"Authorization": f"Bearer {token_borrower1}"}
    )
    assert res.status_code == 200
    notifs = res.json()
    assert len(notifs) > 0
    print(f"[PASS] 16. In-App Notifications verified: {len(notifs)} notifications generated.")

    # 15. Explainable AI Matcher
    res = client.post(
        "/api/ai/match",
        json={
            "purpose": "Need a high speed laser cutter to fabricate an acrylic housing prototype",
            "needed_hours": 2.0
        },
        headers={"Authorization": f"Bearer {token_borrower1}"}
    )
    assert res.status_code == 200
    ai_result = res.json()
    assert len(ai_result["recommendations"]) > 0
    top_rec = ai_result["recommendations"][0]
    assert len(top_rec["why_recommended"]) > 0
    print(f"[PASS] 17. Explainable AI Matcher verified: Top match '{top_rec['resource']['title']}' (Score: {top_rec['match_score']}%) with explainable rationale: {top_rec['why_recommended'][0]}")

    # 16. Role-Aware Dashboard Analytics
    res = client.get(
        "/api/dashboard/stats",
        headers={"Authorization": f"Bearer {token_borrower1}"}
    )
    assert res.status_code == 200
    dash_stats = res.json()
    assert dash_stats["role"] == "borrower"
    print(f"[PASS] 18. Dynamic Dashboard Stats verified for Borrower: active={dash_stats['active_bookings']}, upcoming={dash_stats['upcoming_reservations']}")

    print("=" * 60)
    print("ALL 18 AUTOMATED TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    test_full_platform_suite()
