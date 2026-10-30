# PULSEGRID V2 — PROJECT ARCHITECTURE & DEMONSTRATION REPORT
**Intelligent Healthcare Operations Network for Bengaluru, Karnataka, India**

---

## 1. Executive Summary

* **Project Name**: PulseGrid V2
* **Tagline**: Observe → Analyze → Predict → Investigate → Recommend → Act
* **Geographic Network**: Bengaluru, Karnataka, India (4 Zones × 10 Primary Health Centres = 40 PHCs)
* **Monitored Domains**: Medicines Availability/Consumption & Inpatient Bed Occupancy
* **Portals**:
  1. **PHC Portal** (`/phc`) — Facility Operator / Medical Officer
  2. **Health Administrator Portal** (`/admin`) — Central Directorate Decision-Maker (Human-in-the-Loop)
* **Key AI & ML Technologies**:
  * **Machine Learning**: Scikit-Learn (`RandomForestRegressor` and `RandomForestClassifier` for stockout runway & 7-day bed occupancy forecasts).
  * **AI Reasoning**: Groq API with `openai/gpt-oss-120b` (Deep operational situation analysis, decision support, and recommendation synthesis).
  * **Voice Transcription**: Groq API with `whisper-large-v3` (Input-only voice assistant for clinical operators).
  * **Web Investigation**: TinyFish MCP (`https://agent.tinyfish.ai/mcp`) for multi-source commercial distributor/wholesaler discovery in Bengaluru when internal network stock is insufficient.
  * **Operational Database**: Supabase PostgreSQL schema (`supabase/schema.sql`, `supabase/seed.sql`) + local operational database (`data/pulsegrid.db`).

---

## 2. Core Problem & Operational Philosophy

Healthcare facilities in urban Indian environments face sudden antibiotic stockouts and surging bed occupancy without timely visibility across neighboring Primary Health Centres (PHCs).

PulseGrid V2 connects 40 PHCs across Bengaluru into a single operational grid. Rather than attempting to build an overwhelming enterprise hospital ERP with billing, EHR, or ambulance dispatch, PulseGrid focuses strictly on two critical operational domains:
1. **Medicine Inventory & Consumption Runway**
2. **Bed Occupancy & Capacity Trajectory**

### Core Operating Loop
```
   [OBSERVE]
Current PHC Data
       ↓
    [ANALYZE]
AI Situation Reasoning
       ↓
   [PREDICT]
Scikit-Learn ML
       ↓
  [INVESTIGATE]
TinyFish MCP Web Crawler
       ↓
   [RECOMMEND]
Groq GPT-OSS 120B Synthesis
       ↓
     [ACT]
Human Health Administrator (Final Decision-Maker)
```

---

## 3. Network Structure (Bengaluru, Karnataka, India)

The network is composed of **40 real-world Primary Health Centres across 4 BBMP zones**:

| Zone | Sector Coverage | Key PHC Facilities |
| :--- | :--- | :--- |
| **Zone 1: North Bengaluru** | Hebbal, Yelahanka, Vidyaranyapura, RT Nagar | Hebbal Urban PHC (`phc-01`), Yelahanka Old Town PHC, Vidyaranyapura Model PHC, RT Nagar Community PHC, Sahakar Nagar PHC, Mathikere PHC, Sanjaynagar Health Centre, Jakkur PHC, Thanisandra PHC, Kodigehalli PHC |
| **Zone 2: South Bengaluru** | Jayanagar, JP Nagar, BTM, Banashankari, HSR | Jayanagar 4th Block PHC, JP Nagar 2nd Phase PHC, BTM Layout Community PHC, Banashankari PHC, Basavanagudi PHC, Padmanabhanagar PHC, HSR Layout PHC, Koramangala PHC, Electronic City PHC, Bommanahalli PHC |
| **Zone 3: East Bengaluru** | Indiranagar, Whitefield, KR Puram, Marathahalli | Indiranagar 100ft Rd PHC, Whitefield Community Health Centre, KR Puram PHC, Marathahalli Bridge PHC, Domlur Village PHC, CV Raman Nagar PHC, Mahadevapura PHC, Varthur PHC, Ramamurthy Nagar PHC, HAL Airport Rd PHC |
| **Zone 4: West Bengaluru** | Malleshwaram, Rajajinagar, Peenya, Vijayanagar | Malleshwaram 8th Cross PHC, Rajajinagar PHC, Vijayanagar Club Rd PHC, Basaveshwaranagar PHC, Yeshwanthpur PHC, Mahalakshmi Layout PHC, Kengeri Satellite Town PHC, Peenya Industrial PHC, Nagarabhavi PHC, Chandra Layout PHC |

Every facility contains structured geographic data:
```json
{
  "city": "Bengaluru",
  "state": "Karnataka",
  "country": "India",
  "latitude": 13.0358,
  "longitude": 77.5970,
  "address": "Near Hebbal Flyover, Bellary Road, Hebbal, Bengaluru 560024"
}
```

---

## 4. Two Portals & User Roles

### 🏥 1. PHC Operations Portal (`/phc`)
* **Target User**: PHC Operator / Medical Officer
* **`/phc/dashboard`**: Facility overview, critical medicine alerts, bed occupancy meter, quick action buttons, live events feed.
* **`/phc/medicines`**: Inventory of 10 essential medicines (Cefixime, Amoxicillin, Paracetamol, Azithromycin, Metformin, Amlodipine, ORS Sachets, Salbutamol, Cetirizine, Pantoprazole), daily consumption burn rate, Scikit-learn predicted days remaining, consumption update modal.
* **`/phc/beds`**: Inpatient ward floorplan with physical bed slots (B-1 to B-24), occupancy rates, and Recharts 7-day trajectory chart.
* **`/phc/assistant`**: Integrated voice assistant with **Whisper-large-v3** and text input, internal GPS Haversine distance calculator, Groq GPT-OSS 120B reasoning, and one-click TinyFish external investigation trigger.

### 🛡️ 2. Health Administrator Portal (`/admin`)
* **Target User**: Central Health Directorate Administrator / Decision-Maker
* **`/admin/dashboard`**: Network overview (40 PHCs, 720 total beds, network occupancy %, high-risk shortages count), zone overview cards, critical stockout list, and Groq GPT-OSS 120B network operational analysis.
* **`/admin/phcs`**: Filterable directory of all 40 PHCs with zone filtering, search, occupancy rates, and 1-click drilldown into any local PHC portal.
* **`/admin/analytics`**: Cross-zone bed occupancy bar charts and medicine risk breakdown.
* **`/admin/predictions`**: ML predictions dashboard displaying Scikit-learn forecast metrics for all 40 facilities.
* **`/admin/investigation`**: TinyFish External Investigation Hub displaying verified commercial distributor evidence dossiers across Bengaluru.
* **`/admin/approvals`**: Decision support queue where the human administrator reviews recommendations, inspects TinyFish web evidence, and clicks **Approve** or **Reject** with a chronological audit log.

---

## 5. Primary Hackathon Demonstration Scenario (End-to-End Walkthrough)

1. **Shortage Warning**:
   At **Hebbal Urban PHC (`phc-01`)**, Cefixime 200mg stock is down to **72 tablets** with daily consumption accelerating to **21/day**. Scikit-learn predicts a stockout in **3.4 days** (Risk: **HIGH**).
2. **Operator Voice Query (Whisper-large-v3)**:
   The operator clicks the microphone button:
   > *"I need Cefixime. Tell me nearby PHCs in our zone that can provide it."*
3. **Speech-to-Text**:
   Groq `whisper-large-v3` transcribes the audio into text in < 800ms.
4. **Internal GPS Network Search**:
   The backend calculates Haversine distances to nearby PHCs in Zone 1 (RT Nagar 1.26 km, Sanjaynagar 2.38 km, Sahakar Nagar 3.03 km). All nearby facilities report low reserves (<25 units) to protect their own local populations. Internal zone availability is insufficient (<100 units needed).
5. **TinyFish MCP Web Investigation**:
   When internal availability is deficient, the operator triggers TinyFish. TinyFish searches, fetches, and extracts structured data from commercial medical distributors across Bengaluru:
   * **KAPL Regional Depot (Peenya Industrial Area)**: 650 units buffer, 2–4 hr lead time (96% conf).
   * **Micro Labs Distribution Hub (Race Course Rd)**: 420 units bulk stock, 3–5 hr lead time (92% conf).
   * **Apollo Regional Fulfillment Hub (Marathahalli)**: 280 units, 4–6 hr lead time (89% conf).
   * **MedPlus Wholesale Logistics Centre (Tumkur Rd)**: 350 units, 2–3 hr lead time (94% conf).
6. **Groq GPT-OSS 120B Recommendation**:
   Synthesizes internal inventory with TinyFish web evidence and submits an emergency procurement indent (150 units) to the Health Administrator.
7. **Human-in-the-Loop Action**:
   The Health Administrator opens `/admin/approvals`, inspects the clinical logistics plan and TinyFish evidence, clicks **"Approve & Authorize Dispatch"**, and the operational state and audit logs are updated.

---

## 6. Technical Stack & Implementation Files

* **Backend**: FastAPI (Python 3.13)
  * `backend/main.py`: Full REST API with CORS, endpoints for both portals.
  * `backend/operations_engine.py`: Live Operations Event Engine, shared data mutations, GPS Haversine distance calculator.
  * `backend/ml_service.py`: Scikit-learn `RandomForestRegressor` and `RandomForestClassifier` for stockout runway & bed trajectory.
  * `backend/ai_service.py`: Groq API client with `openai/gpt-oss-120b` and `whisper-large-v3`.
  * `backend/tinyfish_service.py`: TinyFish MCP and multi-source external web investigation engine.
  * `backend/db_initializer.py`: Database seeder with 40 real Bengaluru PHCs across 4 zones, medicines, stock, beds, and events.
  * `backend/test_e2e_demo.py`: Complete automated end-to-end integration test verifying the entire pipeline.
* **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts
  * `frontend/src/pages/phc/`: PHC Dashboard, Medicines table, Bed floorplan & trend chart, AI & Voice Assistant.
  * `frontend/src/pages/admin/`: Admin Overview, All 40 PHCs directory, Analytics, ML Predictions, TinyFish Hub, Approvals queue.
  * `frontend/src/components/AudioVoiceRecorder.tsx`: Microphone audio recorder sending voice to Whisper-large-v3.
* **Database**:
  * `supabase/schema.sql`: Complete PostgreSQL schema for Supabase.
  * `supabase/seed.sql`: Complete seed data for 40 Bengaluru PHCs.

---

## 7. Verification Status

* **Scikit-learn ML Models**: Trained, serialized, and predicting:
  * Medicine stockout runway: 3.4 days (Risk: HIGH)
  * Bed occupancy forecast: 87.5% current → 100.0% 7-day projected (Trend: RISING, Risk: CRITICAL)
* **Frontend TypeScript Build**: 100% clean compilation (`tsc && vite build` built in 37.04s, 0 errors).
* **Live Services Running**:
  * Backend API: `http://127.0.0.1:8000` (FastAPI + Live Operations Engine)
  * Frontend Application: `http://127.0.0.1:5173` (Vite Dev Server)
* **Automated E2E Test**: `backend/test_e2e_demo.py` passed with 100% success across all 6 stages.

