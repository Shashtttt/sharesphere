import re
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.models import Resource, User
from backend.state_machine import check_user_eligibility, check_booking_conflicts
import datetime

# Keyword dictionary mapping purpose terms to resource attributes & capabilities
CAPABILITY_KEYWORDS = {
    "electronics": ["oscilloscope", "spectrum analyzer", "soldering", "pcb", "voltage", "current", "signal", "rf", "multimeter", "testing", "circuit"],
    "fabrication": ["laser", "cut", "engrave", "acrylic", "wood", "co2", "sheet", "metal", "cutter", "cnc", "mill"],
    "microscopy": ["sem", "microscope", "electron", "nanoscale", "sample", "magnification", "materials", "characterization", "imaging"],
    "audiovisual": ["camera", "video", "4k", "recording", "lens", "audio", "mic", "microphone", "cinema", "documentary", "shoot", "film"],
    "computing": ["gpu", "deep learning", "ai", "model", "training", "cuda", "workstation", "pytorch", "simulation", "compute", "render"],
    "meeting": ["meeting", "presentation", "conference", "workshop", "studio", "team", "whiteboard", "arena", "seats", "projector", "screen"],
    "3d_printing": ["3d print", "prototype", "additive", "pla", "petg", "extruder", "prusa", "fdm", "sla", "resin"]
}

def analyze_and_match_resources(
    db: Session,
    purpose: str,
    user: Optional[User],
    category_preference: Optional[str] = None,
    location_preference: Optional[str] = None,
    needed_hours: float = 2.0
) -> List[Dict[str, Any]]:
    """
    Explainable Matching Engine:
    Evaluates:
    1. Capability & semantic keyword fit with user's project purpose
    2. Category & location filters
    3. Mandatory qualification eligibility
    4. Current operational status and availability
    Produces transparent 'why_recommended' rationale bullet points.
    """
    purpose_lower = purpose.lower()
    resources = db.query(Resource).filter(
        Resource.is_published == True,
        Resource.is_archived == False
    ).all()

    scored_items = []
    now = datetime.datetime.utcnow()
    demo_start = now + datetime.timedelta(hours=2)
    demo_end = demo_start + datetime.timedelta(hours=needed_hours)

    for res in resources:
        score = 20  # Base score for published operational resource
        why_reasons: List[str] = []
        eligibility_details: List[str] = []

        # 1. Category Alignment
        if category_preference and category_preference.lower() in res.category.lower():
            score += 25
            why_reasons.append(f"Direct match for requested category: {res.category}")
        elif not category_preference:
            # Detect implicit category match
            for cat_key, words in CAPABILITY_KEYWORDS.items():
                matched_words = [w for w in words if w in purpose_lower]
                if matched_words and any(w in res.title.lower() or w in res.description.lower() for w in matched_words):
                    score += 20
                    why_reasons.append(f"Matched your keywords ({', '.join(matched_words[:3])}) to equipment capability")
                    break

        # 2. Text Keyword Frequency & Specificity
        title_words = [w for w in re.findall(r'\w+', res.title.lower()) if len(w) > 3]
        matched_title_terms = [w for w in title_words if w in purpose_lower]
        if matched_title_terms:
            score += min(30, len(matched_title_terms) * 15)
            why_reasons.append(f"Directly addresses your task involving: {', '.join(matched_title_terms)}")

        # 3. Location Preference
        if location_preference:
            if location_preference.lower() in res.building.lower() or location_preference.lower() in res.room_location.lower():
                score += 15
                why_reasons.append(f"Located near requested area: {res.building} ({res.room_location})")

        # 4. Duration Limits Fit
        if res.min_duration_hours <= needed_hours <= res.max_duration_hours:
            score += 10
            why_reasons.append(f"Permits your requested duration ({needed_hours}h) within {res.min_duration_hours}h-{res.max_duration_hours}h window")
        else:
            score -= 10

        # 5. Eligibility Check
        eligibility_status = "eligible"
        if user:
            is_eligible, missing, pending = check_user_eligibility(db, user, res)
            if is_eligible:
                score += 15
                if res.required_qualifications:
                    eligibility_details.append(f"✓ All {len(res.required_qualifications)} required qualifications verified in your profile")
                else:
                    eligibility_details.append("✓ Open access - No special safety qualification required")
            else:
                if missing:
                    score -= 40
                    eligibility_status = "missing_qualification"
                    eligibility_details.append(f"⚠ Missing mandatory certification: {', '.join(missing)}")
                elif pending:
                    score -= 15
                    eligibility_status = "verification_pending"
                    eligibility_details.append(f"⌛ Qualification pending review: {', '.join(pending)}")
        else:
            eligibility_details.append("Sign in to verify your institution qualifications")

        # 6. Availability Check
        is_busy = check_booking_conflicts(db, res.id, demo_start, demo_end)
        if res.condition_status == "maintenance":
            availability_status = "busy"
            why_reasons.append("Currently marked for scheduled routine maintenance")
            score -= 50
        elif is_busy:
            availability_status = "busy"
            why_reasons.append("Currently occupied during peak hours; waitlist queue is open")
            score -= 10
        elif res.approval_required:
            availability_status = "requires_approval"
            why_reasons.append("Available for reservation subject to owner/manager approval")
        else:
            availability_status = "available_now"
            why_reasons.append("Immediately available for instant booking")

        # Normalize score between 10 and 99
        final_score = max(15, min(99, score))

        if len(why_reasons) == 0:
            why_reasons.append("General match in research facilities inventory")

        scored_items.append({
            "resource": res,
            "match_score": final_score,
            "why_recommended": why_reasons,
            "eligibility_status": eligibility_status,
            "eligibility_details": eligibility_details,
            "availability_status": availability_status
        })

    # Sort descending by match score
    scored_items.sort(key=lambda x: x["match_score"], reverse=True)
    return scored_items

def parse_natural_language_search(query: str) -> Dict[str, Any]:
    """
    Extracts structured search filters from natural language queries.
    """
    q = query.lower()
    category = None
    if any(k in q for k in ["oscilloscope", "circuit", "soldering", "pcb", "electronics"]):
        category = "Electronics & Testing Instruments"
    elif any(k in q for k in ["laser", "cnc", "cutting", "acrylic"]):
        category = "Fabrication Tools"
    elif any(k in q for k in ["microscope", "sem", "electron", "cleanroom"]):
        category = "Laboratories"
    elif any(k in q for k in ["camera", "video", "lens", "audio", "film"]):
        category = "Cameras & AV Equipment"
    elif any(k in q for k in ["gpu", "deep learning", "workstation", "cuda"]):
        category = "Computers & Workstations"
    elif any(k in q for k in ["meeting", "room", "classroom", "arena"]):
        category = "Meeting Rooms & Classrooms"
    elif any(k in q for k in ["3d", "printer", "makerspace", "prototype"]):
        category = "Innovation & Makerspace"

    return {
        "raw_query": query,
        "suggested_category": category,
        "keywords": [w for w in re.findall(r'\w+', q) if len(w) > 3]
    }
