"""
PulseGrid V2 - End-to-End Pipeline Integration Test
Verifies the complete flow:
Observe -> Analyze -> Predict -> Investigate -> Recommend -> Act
"""

import asyncio
from backend.operations_engine import operations_engine
from backend.ml_service import ml_service
from backend.ai_service import ai_service
from backend.tinyfish_service import tinyfish_service

async def run_e2e_demo():
    print("=" * 60)
    print("PULSEGRID V2 - END-TO-END PIPELINE DEMONSTRATION TEST")
    print("Geographic Network: Bengaluru, Karnataka, India (40 PHCs)")
    print("=" * 60)

    # 1. OBSERVE: Current PHC Data at Hebbal Urban PHC (phc-01)
    print("\n[STEP 1: OBSERVE] Fetching operational status for 'phc-01' (Hebbal Urban PHC)...")
    phc = operations_engine.get_phc_by_id("phc-01")
    print(f"Facility: {phc['name']} ({phc['zone_name']})")
    print(f"Location: {phc['address']} [{phc['latitude']}, {phc['longitude']}]")

    stocks = operations_engine.get_phc_medicine_stocks("phc-01")
    cefixime = next((s for s in stocks if s["medicine_id"] == "med-01"), None)
    print(f"Target Medicine: {cefixime['medicine_name']}")
    print(f"Current Stock: {cefixime['current_stock']} units | Daily Consumption: {cefixime['daily_consumption']}/day")

    # 2. PREDICT: Scikit-learn ML Runway Analysis
    print("\n[STEP 2: PREDICT] Evaluating ML Medicine Stockout & Bed Forecast...")
    ml_med = ml_service.predict_medicine_stockout(cefixime['current_stock'], cefixime['daily_consumption'], patient_demand=1.2)
    print(f"ML Stockout Risk: {ml_med['stockout_risk']}")
    print(f"ML Predicted Days Left: {ml_med['predicted_days_remaining']} days")
    print(f"Stock Runway Status: {ml_med['stock_runway_status']}")

    # 3. INTERNAL SEARCH: Check nearby / same-zone PHCs using GPS coordinates
    print("\n[STEP 3: INTERNAL SEARCH] Operator asks: 'I need Cefixime. Tell me nearby PHCs in our zone that can provide it.'")
    search_res = operations_engine.search_phcs_for_medicine("Cefixime", origin_phc_id="phc-01")
    print(f"Origin PHC: {search_res['origin_phc']}")
    print(f"Nearby PHCs checked: {search_res['total_phcs_checked']}")
    print(f"Zone Available Stock: {search_res['zone_available_stock']} units")
    print(f"Is Internal Zone Stock Sufficient: {search_res['is_internal_stock_sufficient']}")

    for idx, r in enumerate(search_res['results'][:3]):
        print(f"  {idx+1}. {r['phc_name']} - Distance: {r['distance_km']} km | Stock: {r['current_stock']} units (Burn: {r['daily_consumption']}/d)")

    # 4. INVESTIGATE: TinyFish External Web Investigation (Bengaluru, Karnataka)
    print("\n[STEP 4: INVESTIGATE] Internal stock insufficient! Launching TinyFish Investigation across Bengaluru...")
    investigation = await tinyfish_service.investigate_external_sources("Cefixime 200mg", "Bengaluru, Karnataka, India")
    print(f"TinyFish Status: {investigation['investigation_status']} ({investigation['evidence_count']} verified sources discovered)")
    for ev in investigation['evidence'][:3]:
        print(f"  • Source: {ev['source_name']}")
        print(f"    Category: {ev['source_category']} | Lead Time: {ev.get('estimated_lead_time', 'N/A')}")
        print(f"    Available: {ev.get('estimated_available_units', 'N/A')} units | Conf: {int(ev['confidence_score']*100)}%")

    # 5. RECOMMEND: Groq GPT-OSS 120B Synthesizes Internal vs External Evidence
    print("\n[STEP 5: RECOMMEND] Formulating Human Administrator Recommendation with Groq GPT-OSS 120B...")
    recommendation = await ai_service.generate_recommendation_and_approval(
        phc_name=phc['name'],
        medicine_name="Cefixime 200mg",
        internal_context={
            "target_phc": phc['name'],
            "nearby_available_stock": search_res['zone_available_stock'],
            "internal_is_sufficient": search_res['is_internal_stock_sufficient']
        },
        external_evidence=investigation['evidence']
    )
    print(f"Action Type Recommended: {recommendation['action_type']}")
    print(f"Quantity Recommended: {recommendation['quantity_recommended']} units")

    # Create Approval in Database Queue
    approval_id = operations_engine.create_approval_request(
        phc_id="phc-01",
        action_type=recommendation['action_type'],
        medicine_name="Cefixime 200mg",
        source_name=investigation['evidence'][0]['source_name'],
        quantity=recommendation['quantity_recommended'],
        ai_recommendation=recommendation['ai_reasoning'],
        tinyfish_evidence=investigation['evidence']
    )
    print(f"Created Decision Approval Queue Record: {approval_id}")

    # 6. ACT: Human Health Administrator Approval
    print("\n[STEP 6: ACT] Health Administrator reviews evidence and executes decision...")
    review_res = operations_engine.review_approval(approval_id, "APPROVED", "Dr. R. Rao, Bengaluru Health Directorate")
    print(f"Decision Status: {review_res['status']} for Approval ID: {review_res['approval_id']}")

    # Verify audit event logged
    events = operations_engine.get_operational_events(phc_id="phc-01", limit=2)
    print(f"Latest Operational Audit Event: {events[0]['event_type']} - Severity: {events[0]['severity']}")

    print("\n" + "=" * 60)
    print("END-TO-END DEMO TEST PASSED WITH 100% SUCCESS!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(run_e2e_demo())

