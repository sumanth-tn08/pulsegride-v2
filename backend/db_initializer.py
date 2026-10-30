"""
PulseGrid V2 - Database Initialization & Operational Data Engine
Initializes SQLite database and Supabase client with 40 PHCs in Bengaluru,
medicines, medicine stock, bed occupancy, and operational events.
"""

import sqlite3
import json
import os
from datetime import datetime, timezone

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "pulsegrid.db")

ZONES = [
    {"id": "zone-1", "name": "Zone 1 - North Bengaluru", "description": "Covers northern BBMP sectors including Hebbal, Yelahanka, Vidyaranyapura, RT Nagar"},
    {"id": "zone-2", "name": "Zone 2 - South Bengaluru", "description": "Covers southern BBMP sectors including Jayanagar, JP Nagar, BTM, Banashankari, HSR"},
    {"id": "zone-3", "name": "Zone 3 - East Bengaluru", "description": "Covers eastern BBMP tech corridors including Indiranagar, Whitefield, KR Puram, Marathahalli"},
    {"id": "zone-4", "name": "Zone 4 - West Bengaluru", "description": "Covers western BBMP industrial & residential sectors including Malleshwaram, Rajajinagar, Peenya"}
]

PHCS = [
    # Zone 1: North Bengaluru (10 PHCs)
    {"id": "phc-01", "name": "Hebbal Urban Primary Health Centre", "zone_id": "zone-1", "city": "Bengaluru", "state": "Karnataka", "country": "India", "address": "Near Hebbal Flyover, Bellary Road, Hebbal, Bengaluru 560024", "latitude": 13.0358, "longitude": 77.5970, "contact_phone": "+91 80 2351 0101"},
    {"id": "phc-02", "name": "Yelahanka Old Town PHC", "zone_id": "zone-1", "city": "Bengaluru", "state": "Karnataka", "country": "India", "address": "BBMP Hospital Road, Yelahanka Old Town, Bengaluru 560064", "latitude": 13.1007, "longitude": 77.5963, "contact_phone": "+91 80 2846 0202"},
    {"id": "phc-03", "name": "Vidyaranyapura Model PHC", "zone_id": "zone-1", "city": "Bengaluru", "state": "Karnataka", "country": "India", "address": "5th Main Road, Vidyaranyapura Post, Bengaluru 560097", "latitude": 13.0783, "longitude": 77.5582, "contact_phone": "+91 80 2364 0303"},
    {"id": "phc-04", "name": "RT Nagar Community PHC", "zone_id": "zone-1", "city": "Bengaluru", "state": "Karnataka", "country": "India", "address": "80 Feet Road, 1st Block, RT Nagar, Bengaluru 560032", "latitude": 13.0247, "longitude": 77.5948, "contact_phone": "+91 80 2333 0404"},
    {"id": "phc-05", "name": "Sahakar Nagar Urban PHC", "zone_id": "zone-1", "city": "Bengaluru", "state": "Karnataka", "country": "India", "address": "F Block, Sahakar Nagar, Bengaluru 560092", "latitude": 13.0622, "longitude": 77.5901, "contact_phone": "+91 80 2362 0505"},
    {"id": "phc-06", "name": "Mathikere Urban PHC", "zone_id": "zone-1", "city": "Bengaluru", "state": "Karnataka", "country": "India", "address": "1st Main Road, Pipeline Road, Mathikere, Bengaluru 560054", "latitude": 13.0334, "longitude": 77.5564, "contact_phone": "+91 80 2347 0606"},
    {"id": "phc-07", "name": "Sanjaynagar Health Centre", "zone_id": "zone-1", "city": "Bengaluru", "state": "Karnataka", "country": "India", "address": "AECS Layout, Sanjaynagar Main Rd, Bengaluru 560094", "latitude": 13.0381, "longitude": 77.5752, "contact_phone": "+91 80 2341 0707"},
    {"id": "phc-08", "name": "Jakkur Government PHC", "zone_id": "zone-1", "city": "Bengaluru", "state": "Karnataka", "country": "India", "address": "Near Jakkur Aerodrome, Jakkur, Bengaluru 560064", "latitude": 13.0789, "longitude": 77.6067, "contact_phone": "+91 80 2856 0808"},
    {"id": "phc-09", "name": "Thanisandra Urban PHC", "zone_id": "zone-1", "city": "Bengaluru", "state": "Karnataka", "country": "India", "address": "Thanisandra Main Road, Nagawara Ward, Bengaluru 560077", "latitude": 13.0543, "longitude": 77.6322, "contact_phone": "+91 80 2544 0909"},
    {"id": "phc-10", "name": "Kodigehalli PHC", "zone_id": "zone-1", "city": "Bengaluru", "state": "Karnataka", "country": "India", "address": "Railway Station Road, Kodigehalli, Bengaluru 560092", "latitude": 13.0610, "longitude": 77.5720, "contact_phone": "+91 80 2372 1010"},

    # Zone 2: South Bengaluru (10 PHCs)
    {"id": "phc-11", "name": "Jayanagar 4th Block Urban PHC", "zone_id": "zone-2", "city": "Bengaluru", "state": "Karnataka", "country": "India", "address": "11th Main Road, 4th Block Jayanagar, Bengaluru 560011", "latitude": 12.9299, "longitude": 77.5833, "contact_phone": "+91 80 2663 1111"},
    {"id": "phc-12", "name": "JP Nagar 2nd Phase Health Centre", "zone_id": "zone-2", "city": "Bengaluru", "state": "Karnataka", "country": "India", "address": "15th Cross Road, JP Nagar 2nd Phase, Bengaluru 560078", "latitude": 12.9105, "longitude": 77.5857, "contact_phone": "+91 80 2659 1212"},
    {"id": "phc-13", "name": "BTM Layout Community PHC", "zone_id": "zone-2", "city": "Bengaluru", "state": "Karnataka", "country": "India", "address": "Outer Ring Road, BTM 2nd Stage, Bengaluru 560076", "latitude": 12.9166, "longitude": 77.6101, "contact_phone": "+91 80 2668 1313"},
    {"id": "phc-14", "name": "Banashankari 2nd Stage PHC", "zone_id": "zone-2", "city": "Bengaluru", "state": "Karnataka", "country": "India", "address": "24th Cross Road, Banashankari 2nd Stage, Bengaluru 560070", "latitude": 12.9254, "longitude": 77.5647, "contact_phone": "+91 80 2671 1414"},
    {"id": "phc-15", "name": "Basavanagudi Urban PHC", "zone_id": "zone-2", "city": "Bengaluru", "state": "Karnataka", "country": "India", "address": "Gandhi Bazaar Main Road, Basavanagudi, Bengaluru 560004", "latitude": 12.9421, "longitude": 77.5755, "contact_phone": "+91 80 2660 1515"},
    {"id": "phc-16", "name": "Padmanabhanagar Urban PHC", "zone_id": "zone-2", "city": "Bengaluru", "state": "Karnataka", "country": "India", "address": "Yarab Nagar Road, Padmanabhanagar, Bengaluru 560070", "latitude": 12.9179, "longitude": 77.5574, "contact_phone": "+91 80 2639 1616"},
    {"id": "phc-17", "name": "HSR Layout Sector 2 PHC", "zone_id": "zone-2", "city": "Bengaluru", "state": "Karnataka", "country": "India", "address": "17th Cross Road, Sector 2, HSR Layout, Bengaluru 560102", "latitude": 12.9116, "longitude": 77.6389, "contact_phone": "+91 80 2572 1717"},
    {"id": "phc-18", "name": "Koramangala 6th Block PHC", "zone_id": "zone-2", "city": "Bengaluru", "state": "Karnataka", "country": "India", "address": "80 Feet Road, 6th Block Koramangala, Bengaluru 560095", "latitude": 12.9344, "longitude": 77.6192, "contact_phone": "+91 80 2553 1818"},
    {"id": "phc-19", "name": "Electronic City Phase 1 PHC", "zone_id": "zone-2", "city": "Bengaluru", "state": "Karnataka", "country": "India", "address": "Hosur Road, Electronic City Phase 1, Bengaluru 560100", "latitude": 12.8452, "longitude": 77.6602, "contact_phone": "+91 80 2852 1919"},
    {"id": "phc-20", "name": "Bommanahalli Health Centre", "zone_id": "zone-2", "city": "Bengaluru", "state": "Karnataka", "country": "India", "address": "Begur Main Road, Bommanahalli, Bengaluru 560068", "latitude": 12.9023, "longitude": 77.6241, "contact_phone": "+91 80 2573 2020"},

    # Zone 3: East Bengaluru (10 PHCs)
    {"id": "phc-21", "name": "Indiranagar 100ft Road PHC", "zone_id": "zone-3", "city": "Bengaluru", "state": "Karnataka", "country": "India", "address": "100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru 560038", "latitude": 12.9719, "longitude": 77.6412, "contact_phone": "+91 80 2521 2121"},
    {"id": "phc-22", "name": "Whitefield Community Health Centre", "zone_id": "zone-3", "city": "Bengaluru", "state": "Karnataka", "country": "India", "address": "Whitefield Main Road, Inner Circle, Bengaluru 560066", "latitude": 12.9698, "longitude": 77.7499, "contact_phone": "+91 80 2845 2222"},
    {"id": "phc-23", "name": "KR Puram General PHC", "zone_id": "zone-3", "city": "Bengaluru", "state": "Karnataka", "country": "India", "address": "Old Madras Road, KR Puram Market, Bengaluru 560036", "latitude": 13.0075, "longitude": 77.6959, "contact_phone": "+91 80 2561 2323"},
    {"id": "phc-24", "name": "Marathahalli Bridge Urban PHC", "zone_id": "zone-3", "city": "Bengaluru", "state": "Karnataka", "country": "India", "address": "Varthur Road, Marathahalli Junction, Bengaluru 560037", "latitude": 12.9591, "longitude": 77.6974, "contact_phone": "+91 80 2847 2424"},
    {"id": "phc-25", "name": "Domlur Village Urban PHC", "zone_id": "zone-3", "city": "Bengaluru", "state": "Karnataka", "country": "India", "address": "Airport Road, Domlur Village, Bengaluru 560071", "latitude": 12.9609, "longitude": 77.6387, "contact_phone": "+91 80 2535 2525"},
    {"id": "phc-26", "name": "CV Raman Nagar Urban PHC", "zone_id": "zone-3", "city": "Bengaluru", "state": "Karnataka", "country": "India", "address": "DRDO Phase 1, CV Raman Nagar, Bengaluru 560093", "latitude": 12.9854, "longitude": 77.6639, "contact_phone": "+91 80 2534 2626"},
    {"id": "phc-27", "name": "Mahadevapura Model PHC", "zone_id": "zone-3", "city": "Bengaluru", "state": "Karnataka", "country": "India", "address": "ITPL Main Road, Mahadevapura, Bengaluru 560048", "latitude": 12.9922, "longitude": 77.6890, "contact_phone": "+91 80 2851 2727"},
    {"id": "phc-28", "name": "Varthur Government PHC", "zone_id": "zone-3", "city": "Bengaluru", "state": "Karnataka", "country": "India", "address": "Gunjur-Varthur Main Road, Varthur, Bengaluru 560087", "latitude": 12.9392, "longitude": 77.7410, "contact_phone": "+91 80 2853 2828"},
    {"id": "phc-29", "name": "Ramamurthy Nagar PHC", "zone_id": "zone-3", "city": "Bengaluru", "state": "Karnataka", "country": "India", "address": "TC Palya Main Road, Ramamurthy Nagar, Bengaluru 560016", "latitude": 13.0163, "longitude": 77.6784, "contact_phone": "+91 80 2565 2929"},
    {"id": "phc-30", "name": "HAL Old Airport Road PHC", "zone_id": "zone-3", "city": "Bengaluru", "state": "Karnataka", "country": "India", "address": "HAL 3rd Stage, Old Airport Road, Bengaluru 560017", "latitude": 12.9550, "longitude": 77.6530, "contact_phone": "+91 80 2522 3030"},

    # Zone 4: West Bengaluru (10 PHCs)
    {"id": "phc-31", "name": "Malleshwaram 8th Cross PHC", "zone_id": "zone-4", "city": "Bengaluru", "state": "Karnataka", "country": "India", "address": "Margosa Road, 8th Cross Malleshwaram, Bengaluru 560003", "latitude": 12.9982, "longitude": 77.5703, "contact_phone": "+91 80 2334 3131"},
    {"id": "phc-32", "name": "Rajajinagar 1st Block Urban PHC", "zone_id": "zone-4", "city": "Bengaluru", "state": "Karnataka", "country": "India", "address": "Dr. Rajkumar Road, 1st Block Rajajinagar, Bengaluru 560010", "latitude": 12.9902, "longitude": 77.5528, "contact_phone": "+91 80 2332 3232"},
    {"id": "phc-33", "name": "Vijayanagar Club Road PHC", "zone_id": "zone-4", "city": "Bengaluru", "state": "Karnataka", "country": "India", "address": "Chord Road, Vijayanagar, Bengaluru 560040", "latitude": 12.9716, "longitude": 77.5306, "contact_phone": "+91 80 2339 3333"},
    {"id": "phc-34", "name": "Basaveshwaranagar PHC", "zone_id": "zone-4", "city": "Bengaluru", "state": "Karnataka", "country": "India", "address": "3rd Stage, 4th Block, Basaveshwaranagar, Bengaluru 560079", "latitude": 12.9877, "longitude": 77.5372, "contact_phone": "+91 80 2322 3434"},
    {"id": "phc-35", "name": "Yeshwanthpur Market PHC", "zone_id": "zone-4", "city": "Bengaluru", "state": "Karnataka", "country": "India", "address": "Subedar Chatram Road, Yeshwanthpur, Bengaluru 560022", "latitude": 13.0232, "longitude": 77.5501, "contact_phone": "+91 80 2337 3535"},
    {"id": "phc-36", "name": "Mahalakshmi Layout Urban PHC", "zone_id": "zone-4", "city": "Bengaluru", "state": "Karnataka", "country": "India", "address": "Post Office Road, Mahalakshmi Layout, Bengaluru 560086", "latitude": 13.0114, "longitude": 77.5448, "contact_phone": "+91 80 2349 3636"},
    {"id": "phc-37", "name": "Kengeri Satellite Town PHC", "zone_id": "zone-4", "city": "Bengaluru", "state": "Karnataka", "country": "India", "address": "Mysore Road, Kengeri Satellite Town, Bengaluru 560060", "latitude": 12.9177, "longitude": 77.4839, "contact_phone": "+91 80 2848 3737"},
    {"id": "phc-38", "name": "Peenya Industrial Area PHC", "zone_id": "zone-4", "city": "Bengaluru", "state": "Karnataka", "country": "India", "address": "1st Stage, Peenya Industrial Area, Bengaluru 560058", "latitude": 13.0285, "longitude": 77.5255, "contact_phone": "+91 80 2839 3838"},
    {"id": "phc-39", "name": "Nagarabhavi 2nd Stage PHC", "zone_id": "zone-4", "city": "Bengaluru", "state": "Karnataka", "country": "India", "address": "80 Feet Ring Road, Nagarabhavi 2nd Stage, Bengaluru 560072", "latitude": 12.9568, "longitude": 77.5098, "contact_phone": "+91 80 2321 3939"},
    {"id": "phc-40", "name": "Chandra Layout Community PHC", "zone_id": "zone-4", "city": "Bengaluru", "state": "Karnataka", "country": "India", "address": "8th Main Road, Chandra Layout, Bengaluru 560040", "latitude": 12.9582, "longitude": 77.5273, "contact_phone": "+91 80 2328 4040"}
]

MEDICINES = [
    {"id": "med-01", "name": "Cefixime 200mg", "category": "Antibiotic (Cephalosporin)", "unit": "tablets", "critical_threshold": 50},
    {"id": "med-02", "name": "Amoxicillin 500mg", "category": "Antibiotic (Penicillin)", "unit": "capsules", "critical_threshold": 60},
    {"id": "med-03", "name": "Paracetamol 500mg", "category": "Analgesic / Antipyretic", "unit": "tablets", "critical_threshold": 150},
    {"id": "med-04", "name": "Azithromycin 500mg", "category": "Antibiotic (Macrolide)", "unit": "tablets", "critical_threshold": 40},
    {"id": "med-05", "name": "Metformin 500mg", "category": "Antidiabetic", "unit": "tablets", "critical_threshold": 100},
    {"id": "med-06", "name": "Amlodipine 5mg", "category": "Antihypertensive", "unit": "tablets", "critical_threshold": 80},
    {"id": "med-07", "name": "ORS Sachets 21.8g", "category": "Electrolyte Rehydration", "unit": "sachets", "critical_threshold": 70},
    {"id": "med-08", "name": "Salbutamol Inhaler 100mcg", "category": "Respiratory / Bronchodilator", "unit": "inhalers", "critical_threshold": 20},
    {"id": "med-09", "name": "Cetirizine 10mg", "category": "Antihistamine / Allergy", "unit": "tablets", "critical_threshold": 90},
    {"id": "med-10", "name": "Pantoprazole 40mg", "category": "Antacid / PPI", "unit": "tablets", "critical_threshold": 80}
]

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Create tables
    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS zones (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS phcs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        zone_id TEXT,
        city TEXT NOT NULL DEFAULT 'Bengaluru',
        state TEXT NOT NULL DEFAULT 'Karnataka',
        country TEXT NOT NULL DEFAULT 'India',
        address TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        contact_phone TEXT,
        operational_hours TEXT DEFAULT '24x7 Emergency / 8am-8pm OPD',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(zone_id) REFERENCES zones(id)
    );

    CREATE TABLE IF NOT EXISTS medicines (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        unit TEXT NOT NULL DEFAULT 'tablets',
        critical_threshold INTEGER NOT NULL DEFAULT 50,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS phc_medicine_stock (
        id TEXT PRIMARY KEY,
        phc_id TEXT NOT NULL,
        medicine_id TEXT NOT NULL,
        current_stock INTEGER NOT NULL DEFAULT 0,
        daily_consumption INTEGER NOT NULL DEFAULT 0,
        incoming_quantity INTEGER NOT NULL DEFAULT 0,
        stockout_risk TEXT NOT NULL DEFAULT 'LOW',
        predicted_days_left REAL DEFAULT 14.0,
        last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(phc_id, medicine_id),
        FOREIGN KEY(phc_id) REFERENCES phcs(id),
        FOREIGN KEY(medicine_id) REFERENCES medicines(id)
    );

    CREATE TABLE IF NOT EXISTS bed_occupancy (
        id TEXT PRIMARY KEY,
        phc_id TEXT UNIQUE NOT NULL,
        total_beds INTEGER NOT NULL DEFAULT 12,
        occupied_beds INTEGER NOT NULL DEFAULT 0,
        available_beds INTEGER NOT NULL DEFAULT 12,
        occupancy_rate REAL NOT NULL DEFAULT 0.0,
        occupancy_trend TEXT NOT NULL DEFAULT 'STABLE',
        predicted_occupancy_7d REAL DEFAULT 50.0,
        high_occupancy_risk TEXT NOT NULL DEFAULT 'LOW',
        last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(phc_id) REFERENCES phcs(id)
    );

    CREATE TABLE IF NOT EXISTS operational_events (
        id TEXT PRIMARY KEY,
        phc_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        details TEXT DEFAULT '{}',
        severity TEXT DEFAULT 'INFO',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(phc_id) REFERENCES phcs(id)
    );

    CREATE TABLE IF NOT EXISTS action_approvals (
        id TEXT PRIMARY KEY,
        phc_id TEXT NOT NULL,
        action_type TEXT NOT NULL,
        medicine_name TEXT,
        source_name TEXT,
        target_name TEXT,
        quantity INTEGER,
        ai_recommendation_summary TEXT,
        tinyfish_evidence TEXT DEFAULT '[]',
        status TEXT NOT NULL DEFAULT 'PENDING',
        reviewed_by TEXT,
        reviewed_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(phc_id) REFERENCES phcs(id)
    );
    """)

    # Seed Zones
    for z in ZONES:
        cursor.execute("INSERT OR REPLACE INTO zones (id, name, description) VALUES (?, ?, ?)",
                       (z["id"], z["name"], z["description"]))

    # Seed PHCs
    for p in PHCS:
        cursor.execute("""INSERT OR REPLACE INTO phcs
            (id, name, zone_id, city, state, country, address, latitude, longitude, status, contact_phone)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (p["id"], p["name"], p["zone_id"], p["city"], p["state"], p["country"], p["address"], p["latitude"], p["longitude"], "active", p["contact_phone"]))

    # Seed Medicines
    for m in MEDICINES:
        cursor.execute("""INSERT OR REPLACE INTO medicines
            (id, name, category, unit, critical_threshold)
            VALUES (?, ?, ?, ?, ?)""",
            (m["id"], m["name"], m["category"], m["unit"], m["critical_threshold"]))

    # Seed Medicine Stocks across 40 PHCs x 10 Medicines
    now_str = datetime.now(timezone.utc).isoformat()
    for p_idx, p in enumerate(PHCS):
        phc_id = p["id"]
        zone_id = p["zone_id"]

        for m_idx, m in enumerate(MEDICINES):
            stock_id = f"stk-{phc_id}-{m['id']}"
            med_id = m["id"]

            # Highlight DEMO SCENARIO:
            # At phc-01 (Hebbal Urban PHC):
            # Cefixime stock: 72, daily consumption: 21 -> predicted stockout: 3.4 days -> risk HIGH!
            if phc_id == "phc-01" and med_id == "med-01":
                curr_stock = 72
                consumption = 21
                incoming = 0
                risk = "HIGH"
                days_left = 3.4
            elif zone_id == "zone-1" and med_id == "med-01":
                # Other Zone 1 PHCs have very low stock of Cefixime (12 to 24 units, consumption 8 to 15)
                # proving insufficient availability within Zone 1 for transfer!
                curr_stock = 14 + (p_idx % 8) * 2  # 14 to 28
                consumption = 8 + (p_idx % 5)
                incoming = 0
                risk = "HIGH" if curr_stock / consumption < 3 else "MEDIUM"
                days_left = round(curr_stock / max(consumption, 1), 1)
            elif med_id == "med-01" and p_idx in [14, 17]:
                # In other distant zones (e.g. Zone 2 Basavanagudi / Koramangala), modest stock
                curr_stock = 95 if p_idx == 17 else 240
                consumption = 12
                incoming = 0
                risk = "LOW"
                days_left = round(curr_stock / consumption, 1)
            else:
                # Deterministic realistic distribution for all other medicines & PHCs
                seed_factor = (p_idx * 7 + m_idx * 13) % 100
                consumption = 10 + (seed_factor % 18)
                curr_stock = int(consumption * (4 + (seed_factor % 12)))
                incoming = 50 if (seed_factor % 5 == 0) else 0
                days_left = round(curr_stock / max(consumption, 1), 1)
                if days_left <= 3:
                    risk = "CRITICAL"
                elif days_left <= 5:
                    risk = "HIGH"
                elif days_left <= 8:
                    risk = "MEDIUM"
                else:
                    risk = "LOW"

            cursor.execute("""INSERT OR REPLACE INTO phc_medicine_stock
                (id, phc_id, medicine_id, current_stock, daily_consumption, incoming_quantity, stockout_risk, predicted_days_left, last_updated)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (stock_id, phc_id, med_id, curr_stock, consumption, incoming, risk, days_left, now_str))

    # Seed Bed Occupancy for 40 PHCs
    for p_idx, p in enumerate(PHCS):
        phc_id = p["id"]
        bed_id = f"bed-{phc_id}"

        # Vary bed sizes: PHCs have 10, 12, 16, 20, or 24 beds
        total_beds = 12 + ((p_idx % 4) * 4)  # 12, 16, 20, 24
        
        # Specific scenario for high occupancy in a few PHCs
        if phc_id in ["phc-04", "phc-13", "phc-23"]:
            occupied_beds = int(total_beds * 0.92)  # 92% occupancy -> High risk
            trend = "RISING"
            risk = "HIGH"
        elif phc_id in ["phc-01", "phc-11", "phc-21", "phc-31"]:
            occupied_beds = int(total_beds * 0.75)  # 75% occupancy
            trend = "RISING"
            risk = "MEDIUM"
        else:
            occ_pct = 0.45 + ((p_idx * 11) % 40) / 100.0  # 45% - 85%
            occupied_beds = min(total_beds - 1, max(2, int(total_beds * occ_pct)))
            trend = "STABLE" if (p_idx % 2 == 0) else "DECLINING"
            risk = "LOW" if occupied_beds / total_beds < 0.70 else "MEDIUM"

        available_beds = total_beds - occupied_beds
        rate = round((occupied_beds / total_beds) * 100.0, 1)
        pred_7d = min(100.0, round(rate + (6.5 if trend == "RISING" else (-3.0 if trend == "DECLINING" else 0.5)), 1))

        cursor.execute("""INSERT OR REPLACE INTO bed_occupancy
            (id, phc_id, total_beds, occupied_beds, available_beds, occupancy_rate, occupancy_trend, predicted_occupancy_7d, high_occupancy_risk, last_updated)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (bed_id, phc_id, total_beds, occupied_beds, available_beds, rate, trend, pred_7d, risk, now_str))

    # Seed Initial Operational Events
    events = [
        ("evt-001", "phc-01", "shortage_detected", json.dumps({"medicine": "Cefixime 200mg", "stock": 72, "daily_consumption": 21, "days_remaining": 3.4}), "WARNING"),
        ("evt-002", "phc-04", "patient_admitted", json.dumps({"ward": "General Acute", "bed_number": "B-09", "condition": "Acute Bronchitis"}), "INFO"),
        ("evt-003", "phc-13", "emergency_spike", json.dumps({"department": "Emergency Triage", "inflow_rate": "+38% vs baseline"}), "WARNING"),
        ("evt-004", "phc-01", "medicine_consumed", json.dumps({"medicine": "Cefixime 200mg", "quantity": 14, "prescriptions_logged": 7}), "INFO"),
        ("evt-005", "phc-21", "patient_discharged", json.dumps({"ward": "Observation", "bed_freed": "B-04"}), "INFO")
    ]
    for e in events:
        cursor.execute("""INSERT OR REPLACE INTO operational_events
            (id, phc_id, event_type, details, severity, created_at)
            VALUES (?, ?, ?, ?, ?, ?)""",
            (e[0], e[1], e[2], e[3], e[4], now_str))

    conn.commit()
    conn.close()
    print(f"Database initialized successfully at: {DB_PATH}")

if __name__ == "__main__":
    init_db()
