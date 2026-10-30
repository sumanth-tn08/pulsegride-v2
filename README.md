# PulseGrid V2 — Intelligent Healthcare Operations Network

**PulseGrid V2** connects **40 Primary Health Centres (PHCs) across Bengaluru, Karnataka, India** into a single live operational network.

The system continuously monitors:
1. **Medicine Availability & Consumption**
2. **Bed Occupancy**

It implements the core intelligent operations loop:
$$\text{Observe} \longrightarrow \text{Analyze} \longrightarrow \text{Predict} \longrightarrow \text{Investigate} \longrightarrow \text{Recommend} \longrightarrow \text{Act}$$

---

## 1. Network Structure (Bengaluru, Karnataka, India)

PulseGrid monitors 40 real-world Primary Health Centres across 4 organizational zones in Bengaluru:

* **Zone 1 — North Bengaluru (10 PHCs)**: Hebbal Urban PHC, Yelahanka Old Town PHC, Vidyaranyapura Model PHC, RT Nagar Community PHC, Sahakar Nagar Urban PHC, Mathikere Urban PHC, Sanjaynagar Health Centre, Jakkur Government PHC, Thanisandra Urban PHC, Kodigehalli PHC.
* **Zone 2 — South Bengaluru (10 PHCs)**: Jayanagar 4th Block Urban PHC, JP Nagar 2nd Phase Health Centre, BTM Layout Community PHC, Banashankari 2nd Stage PHC, Basavanagudi Urban PHC, Padmanabhanagar Urban PHC, HSR Layout Sector 2 PHC, Koramangala 6th Block PHC, Electronic City Phase 1 PHC, Bommanahalli Health Centre.
* **Zone 3 — East Bengaluru (10 PHCs)**: Indiranagar 100ft Road PHC, Whitefield Community Health Centre, KR Puram General PHC, Marathahalli Bridge Urban PHC, Domlur Village Urban PHC, CV Raman Nagar Urban PHC, Mahadevapura Model PHC, Varthur Government PHC, Ramamurthy Nagar PHC, HAL Old Airport Road PHC.
* **Zone 4 — West Bengaluru (10 PHCs)**: Malleshwaram 8th Cross PHC, Rajajinagar 1st Block Urban PHC, Vijayanagar Club Road PHC, Basaveshwaranagar PHC, Yeshwanthpur Market PHC, Mahalakshmi Layout Urban PHC, Kengeri Satellite Town PHC, Peenya Industrial Area PHC, Nagarabhavi 2nd Stage PHC, Chandra Layout Community PHC.

Total: **4 Zones × 10 PHCs = 40 PHCs**

Every PHC record contains structured geographic coordinates (`latitude`, `longitude`, `city`, `state`, `country`, `address`).

---

## 2. Portals (Two Portals Only)

### 🏥 1. PHC Portal (`/phc`)
* **Role**: PHC Operator / Facility Medical Administrator
* **Routes**:
  * `/phc/dashboard`: Facility overview, critical medicine alerts, bed occupancy meter, quick action buttons, live events feed.
  * `/phc/medicines`: Complete 10-medicine inventory, consumption tracking, ML stockout runway, consumption logging modal.
  * `/phc/beds`: Ward floorplan with physical bed slots, 7-day predicted trend projection (Recharts), patient admission/discharge actions.
  * `/phc/assistant`: Integrated voice assistant (Whisper-large-v3) & text assistant, GPS Haversine distance search across nearby Bengaluru PHCs, Groq GPT-OSS 120B reasoning, and one-click TinyFish external web investigation trigger.

### 🛡️ 2. Health Administrator Portal (`/admin`)
* **Role**: Health Administrator / Directorate Decision-Maker (Final Authority)
* **Routes**:
  * `/admin/dashboard`: Network overview across all 40 PHCs, critical alert summaries, zone statistics, Groq GPT-OSS 120B network analysis.
  * `/admin/phcs`: Complete directory of all 40 PHCs with zone filtering, search, and 1-click drilldown into any facility's local portal.
  * `/admin/analytics`: Aggregated cross-zone charts for bed occupancy and medicine risk distribution.
  * `/admin/predictions`: Machine learning prediction dashboard displaying Scikit-learn forecast metrics for all 40 PHCs.
  * `/admin/investigation`: TinyFish External Investigation Hub with verified commercial distributor evidence dossiers.
  * `/admin/approvals`: Decision support queue. The human administrator reviews AI recommendations, inspects TinyFish evidence, and executes **Approve** or **Reject** actions with a full chronological audit log.

---

## 3. Technology Stack

* **Machine Learning**: Scikit-learn, Pandas, NumPy (`RandomForestRegressor` and `RandomForestClassifier` for medicine stockout runway and bed occupancy trajectory).
* **AI Reasoning**: Groq API with `openai/gpt-oss-120b` (Deep operational situation analysis, decision support, and recommendation synthesis).
* **Voice Input**: Groq API with `whisper-large-v3` (Audio transcription for operator queries).
* **External Web Investigation**: TinyFish MCP (`https://agent.tinyfish.ai/mcp`) & multi-source Bengaluru web investigation engine.
* **Database**: Supabase / PostgreSQL schema (`supabase/schema.sql`, `supabase/seed.sql`) + local operational database.
* **Backend**: Python 3.13 FastAPI, Uvicorn, Async HTTPX.
* **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts.

---

## 4. Primary Hackathon Demonstration Scenario

1. **Shortage Warning**:
   At **Hebbal Urban PHC (`phc-01`)**, Cefixime 200mg stock is down to **72 tablets** with daily consumption accelerating to **21/day**. Scikit-learn predicts a stockout in **3.4 days** (Risk: **HIGH**).
2. **Voice Query**:
   The operator uses the microphone:
   > *"I need Cefixime. Tell me nearby PHCs in our zone that can provide it."*
3. **Whisper Transcription**:
   Groq `whisper-large-v3` converts the audio to text.
4. **Internal GPS Search**:
   The system calculates Haversine distances to nearby PHCs in Zone 1 (RT Nagar 1.26 km, Sanjaynagar 2.38 km, Sahakar Nagar 3.03 km). All nearby facilities report low reserves (<25 units) to protect their own local populations. Internal zone availability is insufficient.
5. **TinyFish Web Investigation**:
   Triggered automatically. TinyFish investigates commercial medical suppliers across Bengaluru, discovering:
   * **KAPL Regional Depot (Peenya)**: 650 units buffer, 2–4 hr lead time.
   * **Micro Labs Hub (Race Course Rd)**: 420 units bulk stock, 3–5 hr lead time.
   * **Apollo Central Regional Depot (Marathahalli)**: 280 units, 4–6 hr lead time.
   * **MedPlus Logistics Centre (Tumkur Rd)**: 350 units, 2–3 hr lead time.
6. **Groq GPT-OSS 120B Recommendation**:
   Synthesizes internal inventory with TinyFish web evidence and dispatches an emergency procurement recommendation to the Health Administrator.
7. **Human Decision**:
   The Health Administrator reviews the dossier in `/admin/approvals`, inspects the evidence, clicks **Approve**, and the operational state and audit logs are updated.

---

## 5. Quickstart Guide

### Prerequisites
* Python 3.10+
* Node.js 18+

### Setup & Run
```bash
# 1. Initialize the operational database
python backend/db_initializer.py

# 2. Run the end-to-end demo test
$env:PYTHONPATH="."
python backend/test_e2e_demo.py

# 3. Start Backend server (Port 8000)
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload

# 4. In a separate terminal, start Frontend (Port 5173)
cd frontend
npm run dev
```

Open **`http://localhost:5173`** in your browser to begin.

