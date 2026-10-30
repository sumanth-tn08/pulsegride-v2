"""
PulseGrid V2 - Machine Learning Service
Simple, reliable ML prediction pipeline using Scikit-learn, Pandas, and NumPy.

Model 1: Medicine Stockout Prediction
- Features: current_stock, daily_consumption, consumption_velocity, patient_demand_index, incoming_quantity
- Targets: estimated_days_remaining (Continuous Regressor), risk_level (Classifier: LOW, MEDIUM, HIGH, CRITICAL)

Model 2: Bed Occupancy Prediction
- Features: total_beds, occupied_beds, current_occupancy_rate, 3d_admission_rate, 3d_discharge_rate, emergency_demand_spike
- Targets: predicted_occupancy_7d (Continuous Regressor), occupancy_trend (Classifier: RISING, STABLE, DECLINING)
"""

import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.model_selection import train_test_split

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "models")
HISTORICAL_DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "historical_operational_data.csv")

class MLService:
    def __init__(self):
        os.makedirs(MODEL_DIR, exist_ok=True)
        self.stockout_reg_path = os.path.join(MODEL_DIR, "stockout_regressor.joblib")
        self.stockout_clf_path = os.path.join(MODEL_DIR, "stockout_classifier.joblib")
        self.bed_reg_path = os.path.join(MODEL_DIR, "bed_regressor.joblib")
        self.bed_clf_path = os.path.join(MODEL_DIR, "bed_classifier.joblib")

        self.stockout_reg = None
        self.stockout_clf = None
        self.bed_reg = None
        self.bed_clf = None

        self._load_or_train()

    def generate_correlated_historical_dataset(self, n_samples: int = 1500) -> pd.DataFrame:
        """
        Generates realistic correlated operational data following:
        patient demand ↑ → medicine consumption ↑ → medicine stock ↓ → stockout risk ↑
        patient demand ↑ → admissions ↑ → occupied beds ↑ → occupancy risk ↑
        """
        np.random.seed(42)

        # Baseline patient demand factor [0.8 to 2.2]
        patient_demand = np.random.uniform(0.8, 2.2, n_samples)
        
        # Medicine domain
        base_consumption = np.random.uniform(8.0, 25.0, n_samples)
        daily_consumption = np.round(base_consumption * patient_demand, 1)
        consumption_velocity = np.round(np.random.normal(1.2, 0.8, n_samples) * (patient_demand - 1.0), 2)
        
        # Current stock inversely correlated with prolonged high demand
        days_stock_held = np.random.uniform(1.0, 18.0, n_samples)
        current_stock = np.maximum(5, np.round(daily_consumption * days_stock_held)).astype(int)
        incoming_quantity = np.where(np.random.rand(n_samples) > 0.75, np.random.choice([50, 100, 150], n_samples), 0)

        # Target: Days left
        effective_stock = current_stock + (incoming_quantity * 0.7)
        effective_burn = np.maximum(1.0, daily_consumption + consumption_velocity)
        days_remaining = np.round(effective_stock / effective_burn, 1)

        # Target: Risk level
        risk_labels = []
        for d in days_remaining:
            if d <= 3.0:
                risk_labels.append("CRITICAL")
            elif d <= 5.0:
                risk_labels.append("HIGH")
            elif d <= 8.0:
                risk_labels.append("MEDIUM")
            else:
                risk_labels.append("LOW")

        # Bed domain
        total_beds = np.random.choice([10, 12, 16, 20, 24], n_samples)
        base_occupancy = np.random.uniform(0.40, 0.85, n_samples)
        # Demand increases occupancy
        effective_occupancy = np.clip(base_occupancy * (0.8 + 0.3 * patient_demand), 0.2, 0.98)
        occupied_beds = np.round(total_beds * effective_occupancy).astype(int)
        current_occ_rate = np.round((occupied_beds / total_beds) * 100.0, 1)

        admission_rate = np.round(np.random.uniform(1.0, 4.5, n_samples) * patient_demand, 1)
        discharge_rate = np.round(np.random.uniform(1.0, 3.8, n_samples), 1)
        emergency_spike = np.where(patient_demand > 1.6, 1, 0)

        net_flow_7d = (admission_rate - discharge_rate) * 7.0
        predicted_occ_7d = np.clip(current_occ_rate + (net_flow_7d / total_beds * 100.0), 10.0, 100.0)
        predicted_occ_7d = np.round(predicted_occ_7d, 1)

        bed_trends = []
        for c, p in zip(current_occ_rate, predicted_occ_7d):
            diff = p - c
            if diff > 4.0:
                bed_trends.append("RISING")
            elif diff < -4.0:
                bed_trends.append("DECLINING")
            else:
                bed_trends.append("STABLE")

        df = pd.DataFrame({
            "patient_demand": np.round(patient_demand, 2),
            "current_stock": current_stock,
            "daily_consumption": daily_consumption,
            "consumption_velocity": consumption_velocity,
            "incoming_quantity": incoming_quantity,
            "days_remaining": days_remaining,
            "stockout_risk": risk_labels,
            "total_beds": total_beds,
            "occupied_beds": occupied_beds,
            "current_occ_rate": current_occ_rate,
            "admission_rate": admission_rate,
            "discharge_rate": discharge_rate,
            "emergency_spike": emergency_spike,
            "predicted_occ_7d": predicted_occ_7d,
            "occupancy_trend": bed_trends
        })

        df.to_csv(HISTORICAL_DATA_PATH, index=False)
        print(f"Generated historical operational training dataset: {HISTORICAL_DATA_PATH} ({len(df)} records)")
        return df

    def train_models(self, data_path: str = None):
        """Train or retrain both Scikit-learn prediction models"""
        if data_path and os.path.exists(data_path):
            df = pd.read_csv(data_path)
            print(f"Loaded supplied historical dataset from: {data_path}")
        elif os.path.exists(HISTORICAL_DATA_PATH):
            df = pd.read_csv(HISTORICAL_DATA_PATH)
        else:
            df = self.generate_correlated_historical_dataset()

        # 1. Train Medicine Stockout Models
        X_med = df[["current_stock", "daily_consumption", "consumption_velocity", "incoming_quantity", "patient_demand"]]
        y_med_days = df["days_remaining"]
        y_med_risk = df["stockout_risk"]

        self.stockout_reg = RandomForestRegressor(n_estimators=50, max_depth=8, random_state=42)
        self.stockout_reg.fit(X_med, y_med_days)

        self.stockout_clf = RandomForestClassifier(n_estimators=50, max_depth=8, random_state=42)
        self.stockout_clf.fit(X_med, y_med_risk)

        joblib.dump(self.stockout_reg, self.stockout_reg_path)
        joblib.dump(self.stockout_clf, self.stockout_clf_path)

        # 2. Train Bed Occupancy Models
        X_bed = df[["total_beds", "occupied_beds", "current_occ_rate", "admission_rate", "discharge_rate", "emergency_spike"]]
        y_bed_occ = df["predicted_occ_7d"]
        y_bed_trend = df["occupancy_trend"]

        self.bed_reg = RandomForestRegressor(n_estimators=50, max_depth=8, random_state=42)
        self.bed_reg.fit(X_bed, y_bed_occ)

        self.bed_clf = RandomForestClassifier(n_estimators=50, max_depth=8, random_state=42)
        self.bed_clf.fit(X_bed, y_bed_trend)

        joblib.dump(self.bed_reg, self.bed_reg_path)
        joblib.dump(self.bed_clf, self.bed_clf_path)

        print("ML Models successfully trained and serialized.")

    def _load_or_train(self):
        try:
            if (os.path.exists(self.stockout_reg_path) and 
                os.path.exists(self.stockout_clf_path) and 
                os.path.exists(self.bed_reg_path) and 
                os.path.exists(self.bed_clf_path)):
                self.stockout_reg = joblib.load(self.stockout_reg_path)
                self.stockout_clf = joblib.load(self.stockout_clf_path)
                self.bed_reg = joblib.load(self.bed_reg_path)
                self.bed_clf = joblib.load(self.bed_clf_path)
            else:
                self.train_models()
        except Exception as e:
            print(f"Error loading models, retraining: {e}")
            self.train_models()

    def predict_medicine_stockout(self, current_stock: int, daily_consumption: int, incoming_qty: int = 0, patient_demand: float = 1.0) -> dict:
        """
        Predict days until stockout and risk level using trained Scikit-learn models.
        """
        consumption_velocity = max(0.0, (patient_demand - 1.0) * 1.5)
        features = pd.DataFrame([{
            "current_stock": current_stock,
            "daily_consumption": daily_consumption,
            "consumption_velocity": consumption_velocity,
            "incoming_quantity": incoming_qty,
            "patient_demand": patient_demand
        }])

        pred_days = float(self.stockout_reg.predict(features)[0])
        pred_risk = str(self.stockout_clf.predict(features)[0])
        pred_days = max(0.5, round(pred_days, 1))

        # Heuristic guardrails for absolute reliability
        effective_days = round(current_stock / max(1.0, float(daily_consumption)), 1)
        if effective_days <= 3.0:
            pred_risk = "HIGH" if effective_days > 1.5 else "CRITICAL"
        elif effective_days <= 5.0 and pred_risk == "LOW":
            pred_risk = "HIGH"

        return {
            "predicted_days_remaining": min(pred_days, effective_days),
            "stockout_risk": pred_risk,
            "daily_burn_rate": round(daily_consumption + consumption_velocity, 1),
            "stock_runway_status": f"{min(pred_days, effective_days)} days runway remaining"
        }

    def predict_bed_occupancy(self, total_beds: int, occupied_beds: int, admission_rate: float = 2.0, discharge_rate: float = 1.5, emergency_spike: int = 0) -> dict:
        """
        Predict 7-day occupancy % and occupancy trend using trained Scikit-learn models.
        """
        current_occ = round((occupied_beds / max(total_beds, 1)) * 100.0, 1)
        features = pd.DataFrame([{
            "total_beds": total_beds,
            "occupied_beds": occupied_beds,
            "current_occ_rate": current_occ,
            "admission_rate": admission_rate,
            "discharge_rate": discharge_rate,
            "emergency_spike": emergency_spike
        }])

        pred_occ_7d = float(self.bed_reg.predict(features)[0])
        pred_trend = str(self.bed_clf.predict(features)[0])
        pred_occ_7d = min(100.0, max(0.0, round(pred_occ_7d, 1)))

        if current_occ >= 85.0:
            high_risk = "CRITICAL"
        elif pred_occ_7d >= 85.0 or current_occ >= 75.0:
            high_risk = "HIGH"
        elif pred_occ_7d >= 70.0:
            high_risk = "MEDIUM"
        else:
            high_risk = "LOW"

        return {
            "current_occupancy_rate": current_occ,
            "predicted_occupancy_7d": pred_occ_7d,
            "occupancy_trend": pred_trend,
            "high_occupancy_risk": high_risk
        }

# Singleton instance
ml_service = MLService()

if __name__ == "__main__":
    ml = MLService()
    print("Testing ML Service on Demo Scenario:")
    res_med = ml.predict_medicine_stockout(current_stock=72, daily_consumption=21, incoming_qty=0, patient_demand=1.2)
    print("Medicine Stockout Prediction:", res_med)
    res_bed = ml.predict_bed_occupancy(total_beds=16, occupied_beds=14, admission_rate=3.5, discharge_rate=1.0, emergency_spike=1)
    print("Bed Occupancy Prediction:", res_bed)
