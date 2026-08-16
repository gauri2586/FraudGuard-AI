import os
import json
import logging
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from app.schemas.fraud import TransactionInput, FraudPredictionResponse
from app.services.fraud_model_service import fraud_model_service

logger = logging.getLogger(__name__)

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
def get_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(5, ge=1, le=100),
    search: Optional[str] = None,
    risk: Optional[str] = "all",
    status: Optional[str] = "all",
    type: Optional[str] = "all"
):
    """
    Returns a paginated and filtered list of transactions.
    """
    data_file = DATA_DIR / "seed_transactions.json"
    if not data_file.exists():
        return {"data": [], "total": 0}
        
    with open(data_file, "r") as f:
        transactions = json.load(f)
        
    # Apply filtering
    filtered = []
    for tx in transactions:
        # Search
        if search:
            s = search.lower()
            if s not in str(tx.get("id", "")).lower() and \
               s not in str(tx.get("user", "")).lower() and \
               s not in str(tx.get("merchant", "")).lower():
                continue
                
        # Status
        if status and status != "all":
            if tx.get("status") != status:
                continue
                
        # Type
        if type and type != "all":
            if tx.get("type") != type:
                continue
                
        # Risk
        if risk and risk != "all":
            score = tx.get("riskScore", 0)
            tx_risk_level = "low" if score <= 30 else "medium" if score <= 60 else "high" if score <= 80 else "critical"
            if tx_risk_level != risk:
                continue
                
        filtered.append(tx)
        
    total = len(filtered)
    
    # Sort by timestamp descending
    filtered.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    
    # Paginate
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    paginated = filtered[start_idx:end_idx]
    
    return {
        "data": paginated,
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": max(1, (total + limit - 1) // limit)
    }

@router.get("/alerts", tags=["Data"])
def get_alerts():
    """
    Returns alerts generated from the seed transactions dataset for high-risk transactions.
    """
    data_file = DATA_DIR / "seed_transactions.json"
    if not data_file.exists():
        return []
        
    with open(data_file, "r") as f:
        transactions = json.load(f)
        
    alerts = []
    alert_id_counter = 1000
    for tx in transactions:
        risk_score = tx.get("riskScore", 0)
        if risk_score >= 60:
            severity = "critical" if risk_score >= 80 else "high"
            
            # Extract the primary reason from the top explanation safely
            explanations = tx.get("explanations", [])
            primary_reason = "Elevated anomaly signals detected"
            
            if explanations and len(explanations) > 0:
                top_exp = explanations[0]
                feature_name = top_exp.get("display_name") or top_exp.get("feature", "Unknown feature")
                direction = top_exp.get("direction", "increases_risk")
                action = "increases risk" if direction == "increases_risk" else "anomaly"
                primary_reason = f"Feature '{feature_name}' strongly {action}."
            
            fraud_prob = tx.get("aiConfidence", risk_score)
            
            alerts.append({
                "alert_id": str(alert_id_counter),
                "transaction_id": str(tx.get("id", "Unknown")),
                "severity": severity,
                "risk_score": risk_score,
                "fraud_probability": fraud_prob,
                "reason": primary_reason,
                "timestamp": tx.get("timestamp", ""),
                "status": "new",
                # Additional fields required by UI for deep-linking
                "user": str(tx.get("user", "Unknown")),
                "amount": float(tx.get("amount", 0.0)),
                "location": str(tx.get("location", "Online")),
                "device": str(tx.get("device", "Unknown"))
            })
            alert_id_counter += 1
            
    return alerts

@router.get("/models/metrics", tags=["Data"])
def get_model_metrics():
    """
    Returns actual training metrics from ML artifacts.
    """
    artifacts_dir = BASE_DIR / "ml" / "artifacts"
    
    metrics = {
        "dataset": {},
        "xgboost": {},
        "isolation_forest": {},
        "autoencoder": {}
    }
    
    # Load XGBoost Metadata
    xgb_file = artifacts_dir / "xgboost_metadata.json"
    if xgb_file.exists():
        with open(xgb_file, "r") as f:
            xgb_meta = json.load(f)
            
            metrics["dataset"]["total_transactions"] = xgb_meta.get("training_rows", 0) + xgb_meta.get("validation_rows", 0)
            # Assuming ~3.5% fraud based on standard IEEE-CIS if not provided explicitly,
            # but we can deduce from confusion matrix for test set, or just use approximate percentages
            # We will use the confusion matrix test set numbers to approximate if exact training numbers aren't separated
            metrics["dataset"]["feature_count"] = xgb_meta.get("feature_count", 0)
            
            xgb_metrics = xgb_meta.get("metrics", {})
            cm = xgb_metrics.get("confusion_matrix", {})
            total_test = cm.get("tp", 0) + cm.get("fp", 0) + cm.get("tn", 0) + cm.get("fn", 0)
            
            if total_test > 0:
                metrics["dataset"]["legitimate_cases"] = int(metrics["dataset"]["total_transactions"] * ((cm.get("tn", 0) + cm.get("fp", 0)) / total_test))
                metrics["dataset"]["fraud_cases"] = int(metrics["dataset"]["total_transactions"] * ((cm.get("tp", 0) + cm.get("fn", 0)) / total_test))
                metrics["dataset"]["fraud_percentage"] = round((metrics["dataset"]["fraud_cases"] / metrics["dataset"]["total_transactions"]) * 100, 2)
            
            metrics["dataset"]["training_samples"] = xgb_meta.get("training_rows", 0)
            metrics["dataset"]["validation_samples"] = xgb_meta.get("validation_rows", 0)
            metrics["dataset"]["training_date"] = xgb_meta.get("training_date", "")

            metrics["xgboost"] = {
                "accuracy": round(xgb_metrics.get("accuracy", 0) * 100, 1),
                "precision": round(xgb_metrics.get("precision", 0) * 100, 1),
                "recall": round(xgb_metrics.get("recall", 0) * 100, 1),
                "f1_score": round(xgb_metrics.get("f1", 0) * 100, 1),
                "roc_auc": round(xgb_metrics.get("roc_auc", 0), 3),
                "pr_auc": round(xgb_metrics.get("pr_auc", 0), 3),
                "confusion_matrix": cm
            }
            
    # Load Isolation Forest Metadata
    iforest_file = artifacts_dir / "iforest_metadata.json"
    if iforest_file.exists():
        with open(iforest_file, "r") as f:
            iforest_meta = json.load(f)
            if_metrics = iforest_meta.get("metrics", {})
            metrics["isolation_forest"] = {
                "methodology": "Unsupervised Tree-based Anomaly Scoring",
                "avg_legit_score": round(if_metrics.get("avg_anomaly_score_legit", 0), 2),
                "avg_fraud_score": round(if_metrics.get("avg_anomaly_score_fraud", 0), 2)
            }
            
    # Load Autoencoder Metadata
    autoenc_file = artifacts_dir / "autoencoder_metadata.json"
    if autoenc_file.exists():
        with open(autoenc_file, "r") as f:
            autoenc_meta = json.load(f)
            ae_metrics = autoenc_meta.get("metrics", {})
            metrics["autoencoder"] = {
                "methodology": "Neural Network MSE Reconstruction Error",
                "avg_legit_error": round(ae_metrics.get("avg_anomaly_score_legit", 0), 4),
                "avg_fraud_error": round(ae_metrics.get("avg_anomaly_score_fraud", 0), 4)
            }
            
    return metrics

@router.get("/dashboard/stats", tags=["Data"])
def get_dashboard_stats():
    """
    Returns aggregated dashboard statistics based on the seed data.
    Currently aggregates from seed_transactions.json as the persistent datastore is not yet wired for live traffic.
    """
    data_file = DATA_DIR / "seed_transactions.json"
    if not data_file.exists():
        return {}
        
    with open(data_file, "r") as f:
        transactions = json.load(f)
        
    total_transactions = len(transactions)
    fraud_detected = sum(1 for t in transactions if t.get("riskScore", 0) >= 80)
    suspicious = sum(1 for t in transactions if 60 <= t.get("riskScore", 0) < 80)
    money_at_risk = sum(t.get("amount", 0) for t in transactions if t.get("riskScore", 0) >= 60)
    
    type_map = {}
    for t in transactions:
        if t.get("riskScore", 0) >= 60:
            typ = t.get("type", "Online")
            type_map[typ] = type_map.get(typ, 0) + 1
    distribution_data = [{"name": k, "value": v} for k, v in type_map.items()]
    if not distribution_data:
        distribution_data = [{"name": "No Fraud", "value": 1}]
        
    dates_map = {}
    for t in transactions:
        d = t.get("timestamp", "").split(" ")[0] if t.get("timestamp") else "Unknown"
        if d not in dates_map:
            dates_map[d] = {"name": d, "time": d, "volume": 0, "fraud": 0, "suspicious": 0}
        dates_map[d]["volume"] += 1
        if t.get("riskScore", 0) >= 80:
            dates_map[d]["fraud"] += 1
        elif t.get("riskScore", 0) >= 60:
            dates_map[d]["suspicious"] += 1
            
    time_data = sorted(dates_map.values(), key=lambda x: x["time"])
    
    recent_high_risk = [t for t in transactions if t.get("riskScore", 0) >= 60]
    recent_high_risk.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    recent_high_risk = recent_high_risk[:5]
    
    # Format recent high risk for frontend compatibility
    formatted_recent = []
    for t in recent_high_risk:
        risk_level = "critical" if t.get("riskScore", 0) >= 80 else "high"
        formatted_recent.append({
            "id": t.get("id"),
            "type": t.get("type", "Online"),
            "amount": t.get("amount", 0),
            "location": t.get("location", "Unknown"),
            "riskLevel": risk_level,
            "timestamp": t.get("timestamp", "")
        })
    
    return {
        "totalTransactions": total_transactions,
        "fraudDetected": fraud_detected,
        "suspicious": suspicious,
        "moneyAtRisk": money_at_risk,
        "distributionData": distribution_data,
        "timeData": time_data,
        "recentHighRisk": formatted_recent
    }

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

@router.post("/predict", response_model=FraudPredictionResponse, tags=["ML Engine"])
def predict_fraud(transaction: TransactionInput):
    """
    Accepts a transaction, maps it to ML features, and evaluates it using the Hybrid Risk Engine.
    """
    try:
        # Let the service handle mapping and inference
        result = fraud_model_service.predict(transaction)
        
        # If the service caught an error but returned a fallback, we still return 200 OK
        # with the "ERROR" status in the payload, but if it completely crashes, we catch it below.
        
        return FraudPredictionResponse(**result)
        
    except ValueError as ve:
        # Client-side validation or mapping error
        logger.warning(f"Validation error during prediction: {str(ve)}")
        raise HTTPException(status_code=400, detail="Invalid transaction data provided.")
    except Exception as e:
        # Server-side prediction engine crash
        logger.error("Critical failure in prediction endpoint", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal prediction engine error. Please try again later.")

@router.get("/debug/env")
def get_env():
    import sys
    import sklearn
    return {"python": sys.executable, "sklearn_version": sklearn.__version__}
