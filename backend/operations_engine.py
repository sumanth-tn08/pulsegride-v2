"""
PulseGrid V2 - Operations Engine & Data Layer
Handles all internal database interactions, distance calculations,
shared mutation logic, and the background Live Operations Engine.
"""

import sqlite3
import math
import os
import json
import random
import asyncio
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "pulsegrid.db")

def get_db_connection():
    if not os.path.exists(DB_PATH):
        from backend.db_initializer import init_db
        init_db()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in kilometers between two GPS coordinates using Haversine formula."""
    R = 6371.0  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 2)

class OperationsEngine:
    def __init__(self):
        self.live_operations_enabled = True
        self._background_task = None
        self._loop_running = False

    # -------------------------------------------------------------
    # MEDICINE IDENTIFICATION HELPER
    # -------------------------------------------------------------
    def identify_medicine(self, query_or_name: str) -> Optional[Dict[str, Any]]:
        """
        Extracts and resolves the requested medicine from freeform user queries or medicine names.
        Matches exact IDs, full names, or keyword stems for the 10 monitored medicines.
        """
        if not query_or_name:
            return None
        
        q = str(query_or_name).lower().strip()

        # Keyword stems for the 10 PulseGrid tracked medicines
        medicine_aliases = {
            "med-01": ["cefixime", "cefix", "taxim"],
            "med-02": ["amoxicillin", "amox", "mox", "amoxycillin"],
            "med-03": ["paracetamol", "pcm", "crocin", "dolo", "calpol", "acetaminophen"],
            "med-04": ["azithromycin", "azithro", "zithromax", "azi"],
            "med-05": ["metformin", "glycomet", "glucophage"],
            "med-06": ["amlodipine", "amlo", "stamlo", "norvasc"],
            "med-07": ["ors", "oral rehydration", "electral", "sachet"],
            "med-08": ["salbutamol", "albuterol", "inhaler", "asthalin", "ventolin"],
            "med-09": ["cetirizine", "cetzine", "citrizine", "zyrtec"],
            "med-10": ["pantoprazole", "panto", "pan-40", "pantocid"]
        }

        with get_db_connection() as conn:
            all_meds = [dict(m) for m in conn.execute("SELECT * FROM medicines").fetchall()]

            # 1. Exact ID match
            for m in all_meds:
                if m["id"].lower() == q:
                    return m

            # 2. Direct match on root word (e.g. "paracetamol" in query)
            for m in all_meds:
                name_root = m["name"].split()[0].lower()
                if name_root in q or q in m["name"].lower():
                    return m

            # 3. Alias / common brand match
            for med_id, aliases in medicine_aliases.items():
                for alias in aliases:
                    # check word boundary / substring
                    if alias in q:
                        matched = next((m for m in all_meds if m["id"] == med_id), None)
                        if matched:
                            return matched

            return None

    # -------------------------------------------------------------
    # READ QUERIES
    # -------------------------------------------------------------
    def get_all_zones(self) -> List[Dict[str, Any]]:
        with get_db_connection() as conn:
            rows = conn.execute("SELECT * FROM zones ORDER BY id ASC").fetchall()
            return [dict(r) for r in rows]

    def get_all_phcs(self, zone_id: Optional[str] = None) -> List[Dict[str, Any]]:
        with get_db_connection() as conn:
            query = """
            SELECT p.*, z.name as zone_name, b.total_beds, b.occupied_beds, b.available_beds,
                   b.occupancy_rate, b.occupancy_trend, b.high_occupancy_risk
            FROM phcs p
            LEFT JOIN zones z ON p.zone_id = z.id
            LEFT JOIN bed_occupancy b ON p.id = b.phc_id
            """
            params = []
            if zone_id:
                query += " WHERE p.zone_id = ?"
                params.append(zone_id)
            query += " ORDER BY p.id ASC"
            rows = conn.execute(query, params).fetchall()
            return [dict(r) for r in rows]

    def get_phc_by_id(self, phc_id: str) -> Optional[Dict[str, Any]]:
        with get_db_connection() as conn:
            row = conn.execute("""
            SELECT p.*, z.name as zone_name, b.total_beds, b.occupied_beds, b.available_beds,
                   b.occupancy_rate, b.occupancy_trend, b.high_occupancy_risk, b.predicted_occupancy_7d
            FROM phcs p
            LEFT JOIN zones z ON p.zone_id = z.id
            LEFT JOIN bed_occupancy b ON p.id = b.phc_id
            WHERE p.id = ?
            """, (phc_id,)).fetchone()
            return dict(row) if row else None

    def get_all_medicines(self) -> List[Dict[str, Any]]:
        with get_db_connection() as conn:
            rows = conn.execute("SELECT * FROM medicines ORDER BY id ASC").fetchall()
            return [dict(r) for r in rows]

    def get_phc_medicine_stocks(self, phc_id: str) -> List[Dict[str, Any]]:
        with get_db_connection() as conn:
            rows = conn.execute("""
            SELECT s.*, m.name as medicine_name, m.category, m.unit, m.critical_threshold
            FROM phc_medicine_stock s
            JOIN medicines m ON s.medicine_id = m.id
            WHERE s.phc_id = ?
            ORDER BY s.predicted_days_left ASC, s.current_stock ASC
            """, (phc_id,)).fetchall()
            return [dict(r) for r in rows]

    def get_bed_occupancy(self, phc_id: str) -> Optional[Dict[str, Any]]:
        with get_db_connection() as conn:
            row = conn.execute("SELECT * FROM bed_occupancy WHERE phc_id = ?", (phc_id,)).fetchone()
            return dict(row) if row else None

    def get_operational_events(self, phc_id: Optional[str] = None, limit: int = 30) -> List[Dict[str, Any]]:
        """Returns recent operational events with clean human-readable formatting."""
        with get_db_connection() as conn:
            query = """
            SELECT e.*, p.name as phc_name, p.zone_id
            FROM operational_events e
            JOIN phcs p ON e.phc_id = p.id
            """
            params = []
            if phc_id:
                query += " WHERE e.phc_id = ?"
                params.append(phc_id)
            query += " ORDER BY e.created_at DESC LIMIT ?"
            params.append(limit)
            rows = conn.execute(query, params).fetchall()
            results = []
            now = datetime.now(timezone.utc)

            for r in rows:
                item = dict(r)
                details = {}
                if isinstance(item.get("details"), str):
                    try:
                        details = json.loads(item["details"])
                        item["details"] = details
                    except Exception:
                        pass
                elif isinstance(item.get("details"), dict):
                    details = item["details"]

                # Calculate relative time string
                rel_time = "Just now"
                try:
                    if item.get("created_at"):
                        # Parse ISO or SQLite string
                        ts_str = item["created_at"].replace("Z", "+00:00")
                        dt = datetime.fromisoformat(ts_str)
                        diff_sec = max(0, int((now - dt).total_seconds()))
                        if diff_sec < 60:
                            rel_time = f"{diff_sec}s ago"
                        elif diff_sec < 3600:
                            rel_time = f"{diff_sec // 60}m ago"
                        elif diff_sec < 86400:
                            rel_time = f"{diff_sec // 3600}h ago"
                        else:
                            rel_time = f"{diff_sec // 86400}d ago"
                except Exception:
                    rel_time = "Recent"

                # Generate professional human-readable title & summary
                etype = item.get("event_type", "operational_event")
                phc_display = f"{item.get('phc_name', 'Facility')} ({str(item.get('zone_id', '')).upper()})"
                
                title = etype.replace("_", " ").title()
                summary = ""

                if etype == "medicine_consumed":
                    med_name = details.get("medicine_name") or details.get("medicine_id", "Medicine")
                    consumed = details.get("consumed", 0)
                    rem = details.get("remaining_stock", 0)
                    title = "Medicine Dispensed"
                    summary = f"{consumed} units consumed · Remaining stock: {rem} units"
                elif etype == "patient_admitted":
                    cnt = details.get("count", 1)
                    ward = details.get("ward", "General Acute")
                    occ = details.get("occupancy_rate", "")
                    title = "Inpatient Bed Admission"
                    summary = f"{cnt} patient(s) admitted to {ward} · Bed Occupancy: {occ}%"
                elif etype == "patient_discharged":
                    cnt = details.get("count", 1)
                    title = "Inpatient Bed Discharge"
                    summary = f"{cnt} patient(s) discharged · Beds sanitized & available"
                elif etype == "shortage_detected":
                    title = "Critical Shortage Alert"
                    notes = details.get("notes") or details.get("reason") or "Buffer depleted"
                    summary = f"Impending stockout flagged: {notes}"
                elif etype == "medicine_received":
                    qty = details.get("quantity") or 150
                    src = details.get("source") or "Bengaluru Supply Line"
                    title = "Stock Consignment Received"
                    summary = f"{qty} units received from {src}"
                elif etype == "emergency_spike":
                    title = "Emergency Demand Surge"
                    summary = f"OPD demand surge (+{details.get('percentage', 15)}%)"
                else:
                    summary = f"Operational action logged for {phc_display}"

                item["formatted_title"] = title
                item["formatted_summary"] = summary
                item["formatted_time"] = rel_time
                item["facility_label"] = phc_display
                results.append(item)

            return results

    def get_network_overview(self) -> Dict[str, Any]:
        """Calculates aggregated metrics for Health Administrator portal."""
        with get_db_connection() as conn:
            total_phcs = conn.execute("SELECT COUNT(*) FROM phcs").fetchone()[0]
            
            # Stockout risks
            high_risk_meds = conn.execute("""
                SELECT COUNT(*) FROM phc_medicine_stock
                WHERE stockout_risk IN ('HIGH', 'CRITICAL')
            """).fetchone()[0]

            critical_stockouts = conn.execute("""
                SELECT s.*, p.name as phc_name, p.zone_id, m.name as medicine_name
                FROM phc_medicine_stock s
                JOIN phcs p ON s.phc_id = p.id
                JOIN medicines m ON s.medicine_id = m.id
                WHERE s.stockout_risk IN ('HIGH', 'CRITICAL')
                ORDER BY s.predicted_days_left ASC
                LIMIT 8
            """).fetchall()

            # Bed occupancy aggregations
            bed_stats = conn.execute("""
                SELECT SUM(total_beds) as total_beds, SUM(occupied_beds) as occupied_beds,
                       SUM(available_beds) as available_beds,
                       AVG(occupancy_rate) as avg_rate
                FROM bed_occupancy
            """).fetchone()

            high_occupancy_phcs = conn.execute("""
                SELECT b.*, p.name as phc_name, p.zone_id
                FROM bed_occupancy b
                JOIN phcs p ON b.phc_id = p.id
                WHERE b.occupancy_rate >= 80.0 OR b.high_occupancy_risk IN ('HIGH', 'CRITICAL')
                ORDER BY b.occupancy_rate DESC
                LIMIT 8
            """).fetchall()

            # Pending Approvals count
            pending_approvals = conn.execute("""
                SELECT COUNT(*) FROM action_approvals WHERE status = 'PENDING'
            """).fetchone()[0]

            return {
                "total_phcs": total_phcs,
                "zones_count": 4,
                "total_beds": bed_stats["total_beds"] or 0,
                "occupied_beds": bed_stats["occupied_beds"] or 0,
                "available_beds": bed_stats["available_beds"] or 0,
                "network_occupancy_rate": round(bed_stats["avg_rate"] or 0.0, 1),
                "high_risk_medicine_count": high_risk_meds,
                "critical_stockouts": [dict(r) for r in critical_stockouts],
                "high_occupancy_phcs": [dict(r) for r in high_occupancy_phcs],
                "pending_approvals_count": pending_approvals,
                "live_operations_status": self.live_operations_enabled
            }

    # -------------------------------------------------------------
    # INTERNAL PHC SEARCH (LATITUDE / LONGITUDE & DYNAMIC SURPLUS)
    # -------------------------------------------------------------
    def search_phcs_for_medicine(self, medicine_name_or_query: str, origin_phc_id: Optional[str] = None, zone_filter: Optional[str] = None, requested_quantity: int = 100) -> Dict[str, Any]:
        """
        Searches internal PHCs for the EXACT requested medicine.
        Calculates transferable surplus above safe local clinical reserve (buffer).
        Evaluates dynamic sufficiency against requested quantity.
        Sorts results by: 1. sufficient surplus, 2. distance, 3. risk safety, 4. stock.
        """
        origin_phc = self.get_phc_by_id(origin_phc_id) if origin_phc_id else None
        med = self.identify_medicine(medicine_name_or_query)

        with get_db_connection() as conn:
            if not med:
                # If query doesn't specify medicine, pick origin PHC's highest-risk medicine or first medicine
                if origin_phc:
                    highest_risk_row = conn.execute("""
                        SELECT m.* FROM phc_medicine_stock s
                        JOIN medicines m ON s.medicine_id = m.id
                        WHERE s.phc_id = ?
                        ORDER BY s.predicted_days_left ASC LIMIT 1
                    """, (origin_phc["id"],)).fetchone()
                    if highest_risk_row:
                        med = dict(highest_risk_row)

                if not med:
                    first_m = conn.execute("SELECT * FROM medicines LIMIT 1").fetchone()
                    med = dict(first_m) if first_m else {"id": "med-03", "name": "Paracetamol 500mg"}

            med_id = med["id"]
            med_name = med["name"]

            # Query origin PHC's own current stock of this medicine
            origin_stock_item = None
            if origin_phc:
                stk_row = conn.execute("""
                    SELECT s.*, m.name as medicine_name, m.critical_threshold, m.unit
                    FROM phc_medicine_stock s
                    JOIN medicines m ON s.medicine_id = m.id
                    WHERE s.phc_id = ? AND s.medicine_id = ?
                """, (origin_phc["id"], med_id)).fetchone()
                if stk_row:
                    origin_stock_item = dict(stk_row)

            query = """
                SELECT p.id as phc_id, p.name as phc_name, p.zone_id, z.name as zone_name,
                       p.address, p.latitude, p.longitude, p.contact_phone,
                       s.current_stock, s.daily_consumption, s.stockout_risk, s.predicted_days_left,
                       m.critical_threshold, m.unit
                FROM phc_medicine_stock s
                JOIN phcs p ON s.phc_id = p.id
                JOIN zones z ON p.zone_id = z.id
                JOIN medicines m ON s.medicine_id = m.id
                WHERE s.medicine_id = ?
            """
            params = [med_id]
            if zone_filter:
                query += " AND p.zone_id = ?"
                params.append(zone_filter)

            rows = conn.execute(query, params).fetchall()
            results = []

            for r in rows:
                item = dict(r)
                if origin_phc and item["phc_id"] == origin_phc["id"]:
                    continue  # Skip origin facility from candidate transfer sources

                # GPS Distance
                if origin_phc:
                    dist = haversine_distance(
                        origin_phc["latitude"], origin_phc["longitude"],
                        item["latitude"], item["longitude"]
                    )
                    item["distance_km"] = dist
                else:
                    item["distance_km"] = 0.0

                # Safe Local Reserve Buffer: facility must protect its own population (at least 4-5 days of daily burn)
                burn = max(1, item["daily_consumption"])
                safe_buffer = max(item.get("critical_threshold", 40), burn * 5)
                item["safe_local_buffer"] = safe_buffer

                # Transferable surplus that can safely be moved without jeopardizing local facility
                transferable_surplus = max(0, item["current_stock"] - safe_buffer)
                item["transferable_surplus"] = transferable_surplus
                item["has_sufficient_surplus"] = (transferable_surplus >= 20)

                item["city"] = "Bengaluru"
                item["state"] = "Karnataka"
                item["country"] = "India"
                results.append(item)

            # Sort results by priority:
            # 1. Has transferable surplus (True first)
            # 2. Shortest distance (km ascending)
            # 3. Higher days remaining (safest runway first)
            # 4. Total current stock descending
            results.sort(key=lambda x: (
                0 if x["has_sufficient_surplus"] else 1,
                x["distance_km"],
                -x["predicted_days_left"],
                -x["current_stock"]
            ))

            # Calculate total zone transferable surplus (only count other facilities in same zone with real surplus)
            zone_phcs = [r for r in results if (origin_phc and r["zone_id"] == origin_phc["zone_id"])]
            other_zone_phcs = [r for r in results if (origin_phc and r["zone_id"] != origin_phc["zone_id"])]
            total_zone_stock = sum(r["current_stock"] for r in zone_phcs)
            total_zone_surplus = sum(r["transferable_surplus"] for r in zone_phcs)
            total_network_surplus = sum(r["transferable_surplus"] for r in results)

            is_sufficient = (total_zone_surplus >= requested_quantity)

            return {
                "medicine_id": med_id,
                "medicine_name": med_name,
                "origin_phc_id": origin_phc["id"] if origin_phc else None,
                "origin_phc": origin_phc["name"] if origin_phc else "All Bengaluru PHCs",
                "origin_zone": origin_phc["zone_name"] if origin_phc else None,
                "origin_stock": origin_stock_item,
                "requested_quantity": requested_quantity,
                "total_phcs_checked": len(results),
                "zone_available_stock": total_zone_stock,
                "zone_transferable_surplus": total_zone_surplus,
                "network_transferable_surplus": total_network_surplus,
                "transferable_surplus": total_zone_surplus,
                "is_internal_stock_sufficient": is_sufficient,
                "sufficiency_summary": f"Available zone surplus ({total_zone_surplus} units) {'meets' if is_sufficient else 'is insufficient for'} requested requirement ({requested_quantity} units)",
                "same_zone_results": zone_phcs,
                "other_zones_results": other_zone_phcs,
                "results": results
            }

    # -------------------------------------------------------------
    # SHARED OPERATIONAL MUTATIONS (Manual actions & Event Engine)
    # -------------------------------------------------------------
    def update_medicine_consumption(self, phc_id: str, medicine_id: str, consumed_qty: int, notes: str = "") -> Dict[str, Any]:
        """Updates stock, runs ML prediction, logs operational event."""
        from backend.ml_service import ml_service
        now_str = datetime.now(timezone.utc).isoformat()

        with get_db_connection() as conn:
            stock = conn.execute("""
                SELECT s.*, m.name as medicine_name FROM phc_medicine_stock s
                JOIN medicines m ON s.medicine_id = m.id
                WHERE s.phc_id = ? AND s.medicine_id = ?
            """, (phc_id, medicine_id)).fetchone()

            if not stock:
                return {"success": False, "error": "Stock record not found"}

            new_stock = max(0, stock["current_stock"] - consumed_qty)
            # Update daily consumption rolling average slightly
            new_consumption = max(1, int((stock["daily_consumption"] * 0.8) + (consumed_qty * 0.2)))

            # ML Prediction
            pred = ml_service.predict_medicine_stockout(new_stock, new_consumption, stock["incoming_quantity"], patient_demand=1.1)

            conn.execute("""
                UPDATE phc_medicine_stock
                SET current_stock = ?, daily_consumption = ?, stockout_risk = ?, predicted_days_left = ?, last_updated = ?
                WHERE phc_id = ? AND medicine_id = ?
            """, (new_stock, new_consumption, pred["stockout_risk"], pred["predicted_days_remaining"], now_str, phc_id, medicine_id))

            # Record event
            event_id = f"evt-{int(datetime.now().timestamp() * 1000)}"
            severity = "CRITICAL" if pred["stockout_risk"] in ["HIGH", "CRITICAL"] else "INFO"
            conn.execute("""
                INSERT INTO operational_events (id, phc_id, event_type, details, severity, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (event_id, phc_id, "medicine_consumed", json.dumps({
                "medicine_id": medicine_id,
                "medicine_name": stock["medicine_name"],
                "consumed": consumed_qty,
                "remaining_stock": new_stock,
                "predicted_days_left": pred["predicted_days_remaining"],
                "stockout_risk": pred["stockout_risk"],
                "notes": notes
            }), severity, now_str))

            conn.commit()

            return {
                "success": True,
                "new_stock": new_stock,
                "daily_consumption": new_consumption,
                "stockout_risk": pred["stockout_risk"],
                "predicted_days_remaining": pred["predicted_days_remaining"]
            }

    def record_bed_admission(self, phc_id: str, count: int = 1, ward: str = "General Acute") -> Dict[str, Any]:
        """Records bed admission, updates occupancy rate and runs ML prediction."""
        from backend.ml_service import ml_service
        now_str = datetime.now(timezone.utc).isoformat()

        with get_db_connection() as conn:
            bed = conn.execute("SELECT * FROM bed_occupancy WHERE phc_id = ?", (phc_id,)).fetchone()
            if not bed:
                return {"success": False, "error": "Bed record not found"}

            total = bed["total_beds"]
            new_occupied = min(total, bed["occupied_beds"] + count)
            new_available = total - new_occupied
            new_rate = round((new_occupied / total) * 100.0, 1)

            pred = ml_service.predict_bed_occupancy(total, new_occupied, admission_rate=3.0, discharge_rate=1.0)

            conn.execute("""
                UPDATE bed_occupancy
                SET occupied_beds = ?, available_beds = ?, occupancy_rate = ?,
                    occupancy_trend = ?, predicted_occupancy_7d = ?, high_occupancy_risk = ?, last_updated = ?
                WHERE phc_id = ?
            """, (new_occupied, new_available, new_rate, pred["occupancy_trend"], pred["predicted_occupancy_7d"], pred["high_occupancy_risk"], now_str, phc_id))

            event_id = f"evt-{int(datetime.now().timestamp() * 1000)}"
            severity = "WARNING" if new_rate >= 85.0 else "INFO"
            conn.execute("""
                INSERT INTO operational_events (id, phc_id, event_type, details, severity, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (event_id, phc_id, "patient_admitted", json.dumps({
                "count": count,
                "ward": ward,
                "occupied_beds": new_occupied,
                "total_beds": total,
                "occupancy_rate": new_rate
            }), severity, now_str))

            conn.commit()
            return {"success": True, "occupied_beds": new_occupied, "available_beds": new_available, "occupancy_rate": new_rate}

    def record_bed_discharge(self, phc_id: str, count: int = 1) -> Dict[str, Any]:
        """Records bed discharge and updates occupancy."""
        from backend.ml_service import ml_service
        now_str = datetime.now(timezone.utc).isoformat()

        with get_db_connection() as conn:
            bed = conn.execute("SELECT * FROM bed_occupancy WHERE phc_id = ?", (phc_id,)).fetchone()
            if not bed:
                return {"success": False, "error": "Bed record not found"}

            total = bed["total_beds"]
            new_occupied = max(0, bed["occupied_beds"] - count)
            new_available = total - new_occupied
            new_rate = round((new_occupied / total) * 100.0, 1)

            pred = ml_service.predict_bed_occupancy(total, new_occupied, admission_rate=1.5, discharge_rate=2.5)

            conn.execute("""
                UPDATE bed_occupancy
                SET occupied_beds = ?, available_beds = ?, occupancy_rate = ?,
                    occupancy_trend = ?, predicted_occupancy_7d = ?, high_occupancy_risk = ?, last_updated = ?
                WHERE phc_id = ?
            """, (new_occupied, new_available, new_rate, pred["occupancy_trend"], pred["predicted_occupancy_7d"], pred["high_occupancy_risk"], now_str, phc_id))

            event_id = f"evt-{int(datetime.now().timestamp() * 1000)}"
            conn.execute("""
                INSERT INTO operational_events (id, phc_id, event_type, details, severity, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (event_id, phc_id, "patient_discharged", json.dumps({
                "count": count,
                "freed_beds": count,
                "occupied_beds": new_occupied,
                "available_beds": new_available,
                "occupancy_rate": new_rate
            }), "INFO", now_str))

            conn.commit()
            return {"success": True, "occupied_beds": new_occupied, "available_beds": new_available, "occupancy_rate": new_rate}

    def report_medicine_shortage(self, phc_id: str, medicine_id: str, reason: str = "") -> Dict[str, Any]:
        """Manual shortage report from PHC Operator."""
        now_str = datetime.now(timezone.utc).isoformat()
        with get_db_connection() as conn:
            stock = conn.execute("SELECT * FROM phc_medicine_stock WHERE phc_id = ? AND medicine_id = ?", (phc_id, medicine_id)).fetchone()
            med = conn.execute("SELECT * FROM medicines WHERE id = ?", (medicine_id,)).fetchone()

            event_id = f"evt-{int(datetime.now().timestamp() * 1000)}"
            conn.execute("""
                INSERT INTO operational_events (id, phc_id, event_type, details, severity, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (event_id, phc_id, "shortage_detected", json.dumps({
                "medicine_id": medicine_id,
                "medicine_name": med["name"] if med else medicine_id,
                "current_stock": stock["current_stock"] if stock else 0,
                "predicted_days_left": stock["predicted_days_left"] if stock else 0.0,
                "reason": reason or "Accelerated demand spike"
            }), "CRITICAL", now_str))

            # Bump risk flag
            conn.execute("""
                UPDATE phc_medicine_stock
                SET stockout_risk = 'CRITICAL', last_updated = ?
                WHERE phc_id = ? AND medicine_id = ?
            """, (now_str, phc_id, medicine_id))

            conn.commit()
            return {"success": True, "message": "Shortage alert broadcasted to Bengaluru Health Directorate"}

    # -------------------------------------------------------------
    # ACTION APPROVALS & HUMAN DECISION LOG
    # -------------------------------------------------------------
    def create_approval_request(self, phc_id: str, action_type: str, medicine_name: str,
                                source_name: str, quantity: int, ai_recommendation: str,
                                tinyfish_evidence: list) -> str:
        now_str = datetime.now(timezone.utc).isoformat()
        approval_id = f"appr-{int(datetime.now().timestamp() * 1000)}"
        with get_db_connection() as conn:
            conn.execute("""
                INSERT INTO action_approvals
                (id, phc_id, action_type, medicine_name, source_name, target_name, quantity,
                 ai_recommendation_summary, tinyfish_evidence, status, created_at)
                VALUES (?, ?, ?, ?, ?, (SELECT name FROM phcs WHERE id = ?), ?, ?, ?, 'PENDING', ?)
            """, (approval_id, phc_id, action_type, medicine_name, source_name, phc_id, quantity,
                  ai_recommendation, json.dumps(tinyfish_evidence), now_str))
            conn.commit()
        return approval_id

    def get_all_approvals(self) -> List[Dict[str, Any]]:
        with get_db_connection() as conn:
            rows = conn.execute("""
                SELECT a.*, p.name as phc_name, p.zone_id
                FROM action_approvals a
                JOIN phcs p ON a.phc_id = p.id
                ORDER BY a.created_at DESC
            """).fetchall()
            results = []
            for r in rows:
                item = dict(r)
                if isinstance(item.get("tinyfish_evidence"), str):
                    try:
                        item["tinyfish_evidence"] = json.loads(item["tinyfish_evidence"])
                    except Exception:
                        pass
                results.append(item)
            return results

    def review_approval(self, approval_id: str, decision: str, reviewer: str = "Bengaluru Chief Medical Officer") -> Dict[str, Any]:
        """Administrator Approves or Rejects the recommendation."""
        now_str = datetime.now(timezone.utc).isoformat()
        with get_db_connection() as conn:
            appr = conn.execute("SELECT * FROM action_approvals WHERE id = ?", (approval_id,)).fetchone()
            if not appr:
                return {"success": False, "error": "Approval record not found"}

            conn.execute("""
                UPDATE action_approvals
                SET status = ?, reviewed_by = ?, reviewed_at = ?
                WHERE id = ?
            """, (decision.upper(), reviewer, now_str, approval_id))

            # If approved, log confirmation event and update incoming quantity
            if decision.upper() == "APPROVED":
                event_id = f"evt-{int(datetime.now().timestamp() * 1000)}"
                conn.execute("""
                    INSERT INTO operational_events (id, phc_id, event_type, details, severity, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (event_id, appr["phc_id"], "medicine_received", json.dumps({
                    "action": "APPROVED_PROCUREMENT_DISPATCH",
                    "medicine": appr["medicine_name"],
                    "medicine_name": appr["medicine_name"],
                    "source": appr["source_name"],
                    "quantity": appr["quantity"],
                    "reviewed_by": reviewer
                }), "INFO", now_str))

                # Update incoming stock on medicine
                conn.execute("""
                    UPDATE phc_medicine_stock
                    SET incoming_quantity = incoming_quantity + ?
                    WHERE phc_id = ? AND medicine_id = (SELECT id FROM medicines WHERE name = ? OR name LIKE ? LIMIT 1)
                """, (appr["quantity"], appr["phc_id"], appr["medicine_name"], f"%{appr['medicine_name']}%"))

            conn.commit()
            return {"success": True, "status": decision.upper(), "approval_id": approval_id}

    # -------------------------------------------------------------
    # LIVE OPERATIONS ENGINE (BACKGROUND GENERATOR)
    # -------------------------------------------------------------
    def set_live_operations_toggle(self, enabled: bool) -> bool:
        self.live_operations_enabled = enabled
        return self.live_operations_enabled

    async def start_live_engine(self):
        """Continuous background generator producing realistic operational events."""
        self._loop_running = True
        print("[PulseGrid Live Engine] Live operational background worker started.")

        all_phc_ids = [f"phc-{i:02d}" for i in range(1, 41)]
        all_med_ids = [f"med-{i:02d}" for i in range(1, 11)]

        while self._loop_running:
            try:
                await asyncio.sleep(15)  # Controlled interval
                if not self.live_operations_enabled:
                    continue

                event_dice = random.random()
                chosen_phc = random.choice(all_phc_ids)

                if event_dice < 0.45:
                    # 1. Medicine consumption event
                    chosen_med = random.choice(all_med_ids)
                    consumed = random.randint(2, 8)
                    self.update_medicine_consumption(chosen_phc, chosen_med, consumed, "Routine outpatient prescription")

                elif event_dice < 0.75:
                    # 2. Bed admission or discharge
                    if random.random() < 0.6:
                        self.record_bed_admission(chosen_phc, 1, random.choice(["General Acute", "Emergency Observation"]))
                    else:
                        self.record_bed_discharge(chosen_phc, 1)

                elif event_dice < 0.88:
                    # 3. Patient demand surge
                    event_id = f"evt-{int(datetime.now().timestamp() * 1000)}"
                    now_str = datetime.now(timezone.utc).isoformat()
                    with get_db_connection() as conn:
                        conn.execute("""
                            INSERT INTO operational_events (id, phc_id, event_type, details, severity, created_at)
                            VALUES (?, ?, ?, ?, ?, ?)
                        """, (event_id, chosen_phc, "emergency_spike", json.dumps({
                            "percentage": random.randint(12, 28),
                            "reason": "Seasonal viral fever & acute OPD inflow spike"
                        }), "WARNING", now_str))
                        conn.commit()

            except Exception as e:
                print(f"[PulseGrid Live Engine Error]: {e}")
                await asyncio.sleep(5)

operations_engine = OperationsEngine()
