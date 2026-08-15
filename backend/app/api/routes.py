import os
import json
from pathlib import Path
from fastapi import APIRouter
from app.schemas.fraud import TransactionInput, FraudPredictionResponse
from app.services.fraud_model_service import fraud_model_service

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"

router = APIRouter()

@router.get("/health", tags=["Health"])
def health_check():
    """
    Simple health check endpoint to verify the backend is running.
    """
    return {
        "status": fraud_model_service.status,
        "service": "FraudGuard AI",
        "version": "1.0.0",
        "models": fraud_model_service.models_loaded
    }

@router.get("/transactions", tags=["Data"])
def get_transactions():
    """
    Returns the initial seed dataset of transactions evaluated by the ML models.
    """
    data_file = DATA_DIR / "seed_transactions.json"
    if data_file.exists():
        with open(data_file, "r") as f:
            return json.load(f)
    return []

@router.get("/alerts", tags=["Data"])
def get_alerts():
    """
    Returns alerts generated from the seed transactions dataset.
    """
    data_file = DATA_DIR / "seed_transactions.json"
    if data_file.exists():
        with open(data_file, "r") as f:
            transactions = json.load(f)
            
            alerts = []
            alert_id_counter = 1000
            for tx in transactions:
                if tx.get("riskScore", 0) >= 60:
                    severity = "critical" if tx.get("riskScore", 0) >= 80 else ("high" if tx.get("riskScore", 0) >= 60 else "medium")
                    
                    # Extract the primary reason from the top explanation
                    primary_reason = "High anomaly score detected"
                    if tx.get("explanations") and len(tx["explanations"]) > 0:
                        primary_reason = f"{tx['explanations'][0]['display_name']} increases risk"
                    
                    alerts.append({
                        "id": str(alert_id_counter),
                        "transaction_id": tx["id"],
                        "transaction": {
                            "user_id": tx["user"],
                            "amount": tx["amount"],
                            "final_risk_score": tx["riskScore"],
                            "contributing_factors": [primary_reason],
                            "location": tx.get("location", "Online"),
                            "device_type": tx.get("device", "Unknown")
                        },
                        "severity": severity,
                        "status": "new",
                        "created_at": tx["timestamp"]
                    })
                    alert_id_counter += 1
            return alerts
    return []

@router.get("/metrics", tags=["Data"])
def get_metrics():
    """
    Returns actual training metrics of the ML models.
    """
    data_file = DATA_DIR / "metrics.json"
    if data_file.exists():
        with open(data_file, "r") as f:
            return json.load(f)
    return {}

@router.post("/fraud/predict", response_model=FraudPredictionResponse, tags=["ML Engine"])
def predict_fraud(transaction: TransactionInput):
    """
    Accepts a transaction, maps it to ML features, and evaluates it using the Hybrid Risk Engine.
    """
    # Let the service handle mapping, inference, and error catching
    result = fraud_model_service.predict(transaction)
    
    return FraudPredictionResponse(**result)

@router.get("/debug/env")
def get_env():
    import sys
    import sklearn
    return {"python": sys.executable, "sklearn_version": sklearn.__version__}
