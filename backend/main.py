"""
PulseGrid V2 - Intelligent Healthcare Operations Network
FastAPI Main Application Server
"""

import os
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from backend.operations_engine import operations_engine
from backend.ml_service import ml_service
from backend.ai_service import ai_service
from backend.tinyfish_service import tinyfish_service
from backend.db_initializer import init_db, DB_PATH
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}. Initializing database automatically...")
        init_db()
    # Start live operations background task
    bg_task = asyncio.create_task(operations_engine.start_live_engine())
    yield
    operations_engine._loop_running = False
    bg_task.cancel()

app = FastAPI(
    title="PulseGrid V2 API",
    description="Intelligent Healthcare Operations Network for 40 Bengaluru PHCs",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------
# REQUEST MODELS
# -------------------------------------------------------------
class ConsumeMedicineRequest(BaseModel):
    medicine_id: str
    consumed_quantity: int
    notes: Optional[str] = ""

class BedActionRequest(BaseModel):
    count: int = 1
    ward: Optional[str] = "General Acute"

class ShortageReportRequest(BaseModel):
    medicine_id: str
    reason: Optional[str] = ""

class AIChatRequest(BaseModel):
    phc_id: Optional[str] = None
    query: str
    context: Optional[Dict[str, Any]] = None

class InvestigationRequest(BaseModel):
    phc_id: str
    medicine_name: str
    location: Optional[str] = "Bengaluru, Karnataka, India"

class ReviewApprovalRequest(BaseModel):
    decision: str  # APPROVED or REJECTED
    reviewer_name: Optional[str] = "Bengaluru Chief Medical Officer"

class LiveToggleRequest(BaseModel):
    enabled: bool

# -------------------------------------------------------------
# COMMON ENDPOINTS
# -------------------------------------------------------------
@app.get("/")
@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "system": "PulseGrid V2",
        "zones": 4,
        "phcs": 40,
        "region": "Bengaluru, Karnataka, India",
        "live_operations": operations_engine.live_operations_enabled
    }

@app.get("/api/zones")
def get_zones():
    return operations_engine.get_all_zones()

@app.get("/api/phcs")
def get_phcs(zone_id: Optional[str] = None):
    return operations_engine.get_all_phcs(zone_id)

@app.get("/api/phcs/{phc_id}")
def get_phc(phc_id: str):
    phc = operations_engine.get_phc_by_id(phc_id)
    if not phc:
        raise HTTPException(status_code=404, detail="PHC not found")
    return phc

@app.get("/api/medicines")
def get_medicines():
    return operations_engine.get_all_medicines()

@app.get("/api/events")
def get_events(phc_id: Optional[str] = None, limit: int = 30):
    return operations_engine.get_operational_events(phc_id, limit)

@app.get("/api/live-status")
def get_live_status():
    return {"live_operations_enabled": operations_engine.live_operations_enabled}

@app.post("/api/live-toggle")
def toggle_live_operations(req: LiveToggleRequest):
    new_state = operations_engine.set_live_operations_toggle(req.enabled)
    return {"live_operations_enabled": new_state}

# -------------------------------------------------------------
# PHC PORTAL ENDPOINTS
# -------------------------------------------------------------
@app.get("/api/phcs/{phc_id}/medicines")
def get_phc_medicines(phc_id: str):
    return operations_engine.get_phc_medicine_stocks(phc_id)

@app.get("/api/phcs/{phc_id}/beds")
def get_phc_beds(phc_id: str):
    bed = operations_engine.get_bed_occupancy(phc_id)
    if not bed:
        raise HTTPException(status_code=404, detail="Bed record not found")
    return bed

@app.post("/api/phcs/{phc_id}/medicines/consume")
def consume_medicine(phc_id: str, req: ConsumeMedicineRequest):
    res = operations_engine.update_medicine_consumption(phc_id, req.medicine_id, req.consumed_quantity, req.notes)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to update stock"))
    return res

@app.post("/api/phcs/{phc_id}/beds/admit")
def admit_bed(phc_id: str, req: BedActionRequest):
    res = operations_engine.record_bed_admission(phc_id, req.count, req.ward)
    return res

@app.post("/api/phcs/{phc_id}/beds/discharge")
def discharge_bed(phc_id: str, req: BedActionRequest):
    res = operations_engine.record_bed_discharge(phc_id, req.count)
    return res

@app.post("/api/phcs/{phc_id}/shortage")
def report_shortage(phc_id: str, req: ShortageReportRequest):
    res = operations_engine.report_medicine_shortage(phc_id, req.medicine_id, req.reason)
    return res

@app.get("/api/phcs/{phc_id}/nearby-medicines")
def search_nearby_medicines(
    phc_id: str,
    medicine: str = Query(..., description="Medicine name or freeform query"),
    zone_only: bool = False,
    quantity: int = 100
):
    """
    Dynamically identifies requested medicine from query and calculates
    real Haversine distances, transferable surplus, and zone sufficiency.
    """
    phc = operations_engine.get_phc_by_id(phc_id)
    if not phc:
        raise HTTPException(status_code=404, detail="Origin PHC not found")
    
    zone_filter = phc["zone_id"] if zone_only else None
    return operations_engine.search_phcs_for_medicine(
        medicine,
        origin_phc_id=phc_id,
        zone_filter=zone_filter,
        requested_quantity=quantity
    )

# -------------------------------------------------------------
# VOICE ASSISTANT (Whisper-large-v3)
# -------------------------------------------------------------
@app.post("/api/voice/transcribe")
async def transcribe_voice(file: UploadFile = File(...)):
    """Transcribes operator voice input using Groq whisper-large-v3."""
    content = await file.read()
    transcription = await ai_service.transcribe_audio(content, file.filename or "recording.wav")
    return {
        "transcription": transcription,
        "model": "whisper-large-v3",
        "audio_bytes": len(content)
    }

# -------------------------------------------------------------
# AI ASSISTANT CHAT (Groq GPT-OSS 120B)
# -------------------------------------------------------------
@app.post("/api/assistant/chat")
async def assistant_chat(req: AIChatRequest):
    """
    Provides operational analysis, situation explanation, and queries using Groq gpt-oss-120b.
    Dynamically binds to the exact medicine mentioned in the query.
    """
    phc_info = operations_engine.get_phc_by_id(req.phc_id) if req.phc_id else None
    phc_name = phc_info["name"] if phc_info else "Bengaluru Healthcare Network"

    # Identify requested medicine strictly from query or context
    detected_med = operations_engine.identify_medicine(req.query)
    if not detected_med and req.context and req.context.get("medicine"):
        detected_med = operations_engine.identify_medicine(req.context["medicine"])

    # If medicine cannot be confidently extracted, ask for the medicine name instead of silently using a default
    if not detected_med:
        return {
            "reply": "Please specify the medicine name (e.g. Paracetamol, Cefixime, Amoxicillin, or Azithromycin) to check facility stock and network availability.",
            "structured": {
                "title": "Specify Medicine Name",
                "medicine_name": None,
                "status": "INPUT_REQUIRED",
                "situation": "No monitored medicine was detected in your query. Please provide the medicine name to evaluate clinical stockout risk and intra-zone transfer options.",
                "internal_network": None,
                "same_zone_options": [],
                "cross_zone_options": [],
                "best_option": None,
                "recommendation": "Enter or speak the medicine name you require (e.g. 'Can I get Paracetamol in our zone?').",
                "why": ["A specific medicine name is required to check real-time PHC reserves and calculate transferable surplus."],
                "urgency": "LOW",
                "action_type": "CLARIFICATION_REQUIRED",
                "detailed_reasoning": "Awaiting medicine specification from user."
            },
            "detected_medicine": None,
            "model": "openai/gpt-oss-120b",
            "phc_id": req.phc_id
        }

    target_med_name = detected_med["name"]
    context = req.context or {}
    context["target_medicine"] = target_med_name

    target_medicine_stock = None
    internal_search = None
    if req.phc_id:
        context["phc"] = phc_info
        stocks = operations_engine.get_phc_medicine_stocks(req.phc_id)
        target_medicine_stock = next((s for s in stocks if s["medicine_id"] == detected_med["id"]), None)
        context["target_medicine_stock"] = target_medicine_stock

        req_qty = req.context.get("quantity", 100) if req.context else 100
        internal_search = operations_engine.search_phcs_for_medicine(detected_med["id"], origin_phc_id=req.phc_id, requested_quantity=req_qty)
        context["internal_network_availability"] = {
            "zone_transferable_surplus": internal_search.get("zone_transferable_surplus", 0),
            "is_internal_stock_sufficient": internal_search.get("is_internal_stock_sufficient", False),
            "nearby_facilities_with_surplus": [
                {"phc_name": r["phc_name"], "distance_km": r["distance_km"], "surplus": r["transferable_surplus"]}
                for r in internal_search.get("results", [])[:3]
            ]
        }
        context["bed"] = operations_engine.get_bed_occupancy(req.phc_id)

    # Simplified, clinical system prompt: SHORT and ACTIONABLE, NO raw tables, NO invented calculations
    system_prompt = (
        f"You are the PulseGrid V2 Operations AI Advisor. "
        f"You are assisting the Medical Officer of '{phc_name}' in Bengaluru, Karnataka, India. "
        f"The user is inquiring about '{target_med_name}'. Address ONLY '{target_med_name}'. "
        f"Do NOT invent calculations, formulas, or arbitrary safety-stock values (such as '3-month safety stock'). "
        f"Do NOT generate markdown tables, pipe characters, or raw URLs. "
        f"Provide a brief 2-3 sentence clinical briefing on current stock, zone surplus, and recommended action. Keep it under 60 words."
    )

    response = await ai_service.analyze_situation(system_prompt, req.query, context)

    # Deterministic calculations & Query Scope detection
    query_lower = req.query.lower()
    if any(k in query_lower for k in ["our zone", "my zone", "this zone", "same zone", "zone 1", "zone 2", "zone 3", "zone 4", "in zone", "intra-zone"]):
        search_scope = "ZONE"
        scope_title = f"Current Zone ({phc_info['zone_name'] if phc_info else 'Same Zone'})"
    elif any(k in query_lower for k in ["bengaluru", "bangalore", "anywhere", "city", "across", "network", "all 40", "all phc", "whole network"]):
        search_scope = "NETWORK"
        scope_title = "Bengaluru Healthcare Grid (All 40 PHCs)"
    else:
        search_scope = "NEARBY"
        scope_title = f"Nearby Facilities ({phc_info['zone_name'] if phc_info else 'Adjacent Zones'})"

    results_list = internal_search.get("results", []) if internal_search else []
    same_zone_list = internal_search.get("same_zone_results", []) if internal_search else []
    other_zones_list = internal_search.get("other_zones_results", []) if internal_search else []

    zone_transferable_surplus = internal_search.get("zone_transferable_surplus", 0) if internal_search else 0
    network_transferable_surplus = sum(r.get("transferable_surplus", 0) for r in results_list)
    req_qty = req.context.get("quantity", 100) if req.context else 100

    if search_scope == "ZONE":
        is_sufficient = (zone_transferable_surplus >= req_qty)
        relevant_candidates = [r for r in same_zone_list if r.get("transferable_surplus", 0) > 0]
        displayed_surplus = zone_transferable_surplus
    elif search_scope == "NETWORK":
        is_sufficient = (network_transferable_surplus >= req_qty)
        relevant_candidates = [r for r in results_list if r.get("transferable_surplus", 0) > 0]
        displayed_surplus = network_transferable_surplus
    else:
        is_sufficient = (zone_transferable_surplus >= req_qty) or (network_transferable_surplus >= req_qty)
        relevant_candidates = [r for r in results_list if r.get("transferable_surplus", 0) > 0]
        displayed_surplus = zone_transferable_surplus if zone_transferable_surplus >= req_qty else network_transferable_surplus

    best_candidate = relevant_candidates[0] if relevant_candidates else (results_list[0] if results_list else None)

    best_option_dict = None
    if best_candidate:
        best_option_dict = {
            "phc_name": best_candidate["phc_name"],
            "zone_name": best_candidate.get("zone_name", "Same Zone"),
            "distance_km": best_candidate.get("distance_km", 0.0),
            "stock": best_candidate.get("current_stock", 0),
            "surplus": best_candidate.get("transferable_surplus", 0),
            "status": "Surplus Available" if best_candidate.get("transferable_surplus", 0) > 0 else "Reserve Locked"
        }

    # Short 2-3 sentence clinical situation explanation tailored to search scope
    if target_medicine_stock:
        sit = f"Evaluating {target_med_name} across {scope_title}. Current stock at {phc_name} is {target_medicine_stock['current_stock']} units with {target_medicine_stock['predicted_days_left']} days remaining ({target_medicine_stock['stockout_risk']} risk)."
        if search_scope == "ZONE":
            if is_sufficient:
                sit += f" Proximate facilities in your zone carry {zone_transferable_surplus} transferable units above safe walk-in OPD buffers, which is sufficient for immediate transfer."
            else:
                sit += f" Intra-zone transferable surplus is {zone_transferable_surplus} units, which is insufficient for the requested {req_qty} units. Cross-zone reallocation or commercial procurement is advised."
        elif search_scope == "NETWORK":
            if is_sufficient:
                sit += f" Network-wide scan across Bengaluru confirms {network_transferable_surplus} transferable surplus units, fully satisfying the {req_qty}-unit requirement."
            else:
                sit += f" Network-wide transferable surplus across all 40 PHCs is {network_transferable_surplus} units, falling short of {req_qty} units. External commercial procurement is required."
        else:
            if is_sufficient:
                sit += f" Proximate facilities carry {displayed_surplus} transferable units above safe walk-in OPD buffers, which is sufficient for immediate transfer."
            else:
                sit += f" Nearby facilities have only {displayed_surplus} transferable units above their emergency reserves. External commercial procurement is required."
    else:
        sit = f"Evaluating operational availability for {target_med_name} across {scope_title}."

    if is_sufficient and best_option_dict:
        rec_text = f"Transfer {req_qty} units of {target_med_name} from {best_option_dict['phc_name']} ({best_option_dict['distance_km']} km away in {best_option_dict['zone_name']})."
        urgency = "LOW" if target_medicine_stock and target_medicine_stock.get("stockout_risk") == "LOW" else "MEDIUM"
        action_type = "EMERGENCY_TRANSFER"
        why_reasons = [
            f"{phc_name} requires stock replenishment of {target_med_name} for OPD dispensing.",
            f"{best_option_dict['phc_name']} has {best_option_dict['surplus']} units transferable surplus without compromising its own safe buffer.",
            f"{scope_title} inventory satisfies demand without commercial procurement lead time."
        ]
    else:
        rec_text = f"Approve external commercial procurement indent of {req_qty} units of {target_med_name} via TinyFish from verified Bengaluru distributors."
        urgency = "HIGH"
        action_type = "EXTERNAL_PROCUREMENT"
        why_reasons = [
            f"Current stock of {target_med_name} at {phc_name} will stockout in {target_medicine_stock['predicted_days_left'] if target_medicine_stock else 0} days.",
            f"Available surplus in {scope_title} ({displayed_surplus} units) is below the requested {req_qty} units.",
            "Neighboring facilities must protect their own safe clinical buffers for local walk-in patients.",
            "Verified commercial distributors in Bengaluru confirm available batch supply with 2–4 hour delivery."
        ]

    structured_data = {
        "title": f"{target_med_name} Availability & Recommendation",
        "medicine_name": target_med_name,
        "search_scope": search_scope,
        "search_scope_label": scope_title,
        "status": "SUFFICIENT_INTERNAL_STOCK" if is_sufficient else "INSUFFICIENT_INTERNAL_STOCK",
        "situation": sit,
        "internal_network": {
            "current_stock": target_medicine_stock["current_stock"] if target_medicine_stock else 0,
            "daily_burn": target_medicine_stock["daily_consumption"] if target_medicine_stock else 0,
            "days_left": target_medicine_stock["predicted_days_left"] if target_medicine_stock else 0,
            "risk": target_medicine_stock["stockout_risk"] if target_medicine_stock else "LOW",
            "requested_quantity": req_qty,
            "available_surplus": displayed_surplus,
            "zone_surplus": zone_transferable_surplus,
            "network_surplus": network_transferable_surplus,
            "suitable_phcs_count": len(relevant_candidates),
            "is_internal_stock_sufficient": is_sufficient,
            "search_scope": search_scope,
            "scope_label": scope_title
        },
        "best_option": best_option_dict,
        "same_zone_options": [
            {
                "phc_name": r["phc_name"],
                "zone_id": r.get("zone_id", "Zone").upper(),
                "available_stock": r.get("current_stock", 0),
                "transferable_surplus": r.get("transferable_surplus", 0),
                "distance_km": r.get("distance_km", 0.0),
                "action": "Transfer Available" if r.get("transferable_surplus", 0) > 0 else "Reserve Locked"
            }
            for r in same_zone_list[:4]
        ],
        "cross_zone_options": [
            {
                "phc_name": r["phc_name"],
                "zone_id": r.get("zone_id", "Zone").upper(),
                "available_stock": r.get("current_stock", 0),
                "transferable_surplus": r.get("transferable_surplus", 0),
                "distance_km": r.get("distance_km", 0.0),
                "action": "Surplus Available" if r.get("transferable_surplus", 0) > 0 else "Reserve Locked"
            }
            for r in other_zones_list[:5]
        ],
        "recommendation": rec_text,
        "why": why_reasons,
        "urgency": urgency,
        "action_type": action_type,
        "detailed_reasoning": response
    }

    return {
        "reply": response,
        "structured": structured_data,
        "detected_medicine": target_med_name,
        "model": "openai/gpt-oss-120b",
        "phc_id": req.phc_id
    }

    return {
        "reply": response,
        "structured": structured_data,
        "detected_medicine": target_med_name,
        "model": "openai/gpt-oss-120b",
        "phc_id": req.phc_id
    }

# -------------------------------------------------------------
# HEALTH ADMINISTRATOR PORTAL ENDPOINTS
# -------------------------------------------------------------
@app.get("/api/admin/overview")
def get_admin_overview():
    return operations_engine.get_network_overview()

@app.get("/api/admin/predictions")
def get_admin_predictions():
    """Returns ML prediction data across all 40 PHCs."""
    all_phcs = operations_engine.get_all_phcs()
    predictions = []
    for p in all_phcs:
        bed = operations_engine.get_bed_occupancy(p["id"])
        stocks = operations_engine.get_phc_medicine_stocks(p["id"])
        high_risk_meds = [s for s in stocks if s["stockout_risk"] in ["HIGH", "CRITICAL"]]

        predictions.append({
            "phc_id": p["id"],
            "phc_name": p["name"],
            "zone_id": p["zone_id"],
            "zone_name": p["zone_name"],
            "total_beds": bed["total_beds"] if bed else 12,
            "occupied_beds": bed["occupied_beds"] if bed else 0,
            "occupancy_rate": bed["occupancy_rate"] if bed else 0.0,
            "predicted_occupancy_7d": bed["predicted_occupancy_7d"] if bed else 50.0,
            "occupancy_trend": bed["occupancy_trend"] if bed else "STABLE",
            "high_occupancy_risk": bed["high_occupancy_risk"] if bed else "LOW",
            "at_risk_medicines_count": len(high_risk_meds),
            "critical_medicines": [{"name": m["medicine_name"], "days_left": m["predicted_days_left"], "risk": m["stockout_risk"]} for m in high_risk_meds]
        })
    return predictions

@app.post("/api/admin/ai-analysis")
async def admin_network_ai_analysis(req: BaseModel):
    """Network-level operational synthesis from Groq GPT-OSS 120B with structured data."""
    overview = operations_engine.get_network_overview()
    high_risk_list = overview.get("critical_stockouts", [])
    high_occ_list = overview.get("high_occupancy_phcs", [])

    system_prompt = (
        "You are PulseGrid V2's Chief Medical Directorate AI powered by Groq GPT-OSS 120B. "
        "Analyze the entire 40-PHC network across 4 zones in Bengaluru, Karnataka, India. "
        "Structure your briefing into: "
        "1. Network Operational Situation, 2. Critical Stockout Pressure Points, "
        "3. Inpatient Bed Capacity Findings, 4. Recommended Strategic Interventions. "
        "Format cleanly in markdown with bullet points and bold headers."
    )
    user_prompt = "Provide a high-level operational assessment of the Bengaluru healthcare grid."
    response = await ai_service.analyze_situation(system_prompt, user_prompt, overview)

    structured_data = {
        "network_situation": f"40 Primary Health Centres · 4 BBMP Zones · 720 Monitored Beds · Network Occupancy: {overview.get('network_occupancy_rate')}%",
        "critical_findings": [
            f"{overview.get('high_risk_medicine_count', 0)} medicine stocks currently below safe clinical runway buffer",
            f"{len(high_occ_list)} PHC facilities operating at or exceeding 80% inpatient capacity",
            "Zone 1 (North Bengaluru) exhibits highest antibiotic demand velocity"
        ],
        "high_risk_medicines": [
            {
                "phc_name": s["phc_name"],
                "zone_id": s["zone_id"],
                "medicine_name": s["medicine_name"],
                "current_stock": s["current_stock"],
                "predicted_days_left": s["predicted_days_left"],
                "risk": s["stockout_risk"]
            } for s in high_risk_list[:5]
        ],
        "bed_pressure_points": [
            {
                "phc_name": b["phc_name"],
                "zone_id": b["zone_id"],
                "occupied_beds": b["occupied_beds"],
                "total_beds": b["total_beds"],
                "occupancy_rate": b["occupancy_rate"],
                "trend": b["occupancy_trend"]
            } for b in high_occ_list[:5]
        ],
        "recommended_actions": [
            "Authorize inter-zone batch transfer indents for facilities with runway < 2.5 days",
            "Issue early discharge protocols for wards exceeding 90% occupancy",
            "Activate TinyFish external supplier procurement indents for antibiotics with zero intra-zone surplus"
        ],
        "evidence_sources": [
            "Live Bengaluru Grid Operational Database (40 PHCs)",
            "Scikit-Learn Random Forest Stockout & Bed Predictors",
            "TinyFish Multi-Source Commercial Distributor Evidence"
        ]
    }

    return {
        "analysis": response,
        "structured": structured_data,
        "model": "openai/gpt-oss-120b"
    }

# -------------------------------------------------------------
# TINYFISH INVESTIGATION & APPROVAL PIPELINE
# -------------------------------------------------------------
@app.post("/api/investigation/run")
async def run_tinyfish_investigation(req: InvestigationRequest):
    """
    Executes TinyFish external web investigation across Bengaluru sources for the requested medicine,
    followed by Groq GPT-OSS 120B reasoning and approval generation.
    """
    phc = operations_engine.get_phc_by_id(req.phc_id)
    phc_name = phc["name"] if phc else req.phc_id

    # Resolve canonical medicine name
    canonical_med = operations_engine.identify_medicine(req.medicine_name)
    target_medicine_name = canonical_med["name"] if canonical_med else req.medicine_name

    # 1. Check internal availability for THAT specific medicine
    search_res = operations_engine.search_phcs_for_medicine(target_medicine_name, origin_phc_id=req.phc_id)
    zone_surplus = search_res.get("zone_transferable_surplus", 0)

    # 2. Execute TinyFish External Web Investigation for THAT specific medicine
    tinyfish_result = await tinyfish_service.investigate_external_sources(
        medicine_name=target_medicine_name,
        location="Bengaluru, Karnataka, India",
        requested_quantity=150,
        internal_availability=search_res
    )

    # 3. Groq GPT-OSS 120B Synthesis
    ai_recommendation = await ai_service.generate_recommendation_and_approval(
        phc_name=phc_name,
        medicine_name=target_medicine_name,
        internal_context={
            "target_phc": phc_name,
            "nearby_available_stock": zone_surplus,
            "internal_is_sufficient": search_res.get("is_internal_stock_sufficient", False),
            "nearby_facilities_count": len(search_res.get("results", []))
        },
        external_evidence=tinyfish_result.get("evidence", [])
    )

    # 4. Create formal pending approval for Health Administrator
    approval_id = operations_engine.create_approval_request(
        phc_id=req.phc_id,
        action_type=ai_recommendation["action_type"],
        medicine_name=target_medicine_name,
        source_name=tinyfish_result["evidence"][0]["source_name"] if tinyfish_result["evidence"] else "Bengaluru Commercial Supply Line",
        quantity=ai_recommendation["quantity_recommended"],
        ai_recommendation=ai_recommendation["ai_reasoning"],
        tinyfish_evidence=tinyfish_result["evidence"]
    )

    return {
        "success": True,
        "approval_id": approval_id,
        "medicine_name": target_medicine_name,
        "investigation": tinyfish_result,
        "recommendation": ai_recommendation,
        "internal_stock_checked": search_res
    }

@app.get("/api/approvals")
def get_approvals():
    return operations_engine.get_all_approvals()

@app.post("/api/approvals/{approval_id}/review")
def review_approval(approval_id: str, req: ReviewApprovalRequest):
    res = operations_engine.review_approval(approval_id, req.decision, req.reviewer_name or "Bengaluru Health Administrator")
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to review approval"))
    return res
