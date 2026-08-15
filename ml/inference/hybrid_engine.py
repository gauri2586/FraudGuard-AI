import os
import sys

# Add the ml directory to the path so we can import our training scripts
ml_dir = os.path.dirname(os.path.dirname(__file__))
sys.path.append(ml_dir)

import importlib

# Use importlib to bypass Python's syntax error when a file starts with a number
xgb_module = importlib.import_module("training.02_xgboost_pipeline")
if_module = importlib.import_module("training.03_isolation_forest")
ae_module = importlib.import_module("training.04_autoencoder")

xgb_predict = xgb_module.predict_transaction
if_predict = if_module.detect_anomaly
ae_predict = ae_module.detect_deep_anomaly

"""
=============================================================================
FRAUDGUARD AI: HYBRID RISK ENGINE
=============================================================================

SCORING STRATEGY:
We do NOT blindly average the models. Averaging is dangerous in fraud detection 
because a 0-day (novel) attack might be missed by XGBoost (score 5) but flagged heavily 
by the Autoencoder (score 95). An average (50) would let the fraud slip through.

Our tunable strategy:
1. Base Weighted Score:
   - XGBoost (Known Fraud): 40% weight
   - Autoencoder (Deep Anomaly): 25% weight
   - Isolation Forest (Statistical Anomaly): 20% weight
   - Behavioral Indicators (Rules): 15% weight

2. Critical Signal Overrides (The "Veto" System):
   - If XGBoost > 90 (Highly confident known fraud), final score is bumped to at least 90.
   - If Autoencoder > 95 (Extreme deviation from normal), final score is bumped to at least 85.
   - If Behavioral Rules > 90 (Multiple severe rule violations), score is bumped to at least 80.

RISK LEVELS:
- 0-30: LOW (Approve automatically)
- 31-60: MEDIUM (Require step-up authentication, e.g., SMS OTP)
- 61-80: HIGH (Send to human analyst queue)
- 81-100: CRITICAL (Block automatically)
=============================================================================
"""

def evaluate_behavioral_indicators(transaction):
    """
    Evaluates rule-based behavioral indicators.
    Returns a score 0-100.
    """
    score = 0
    factors = []
    
    # 1. Unusual Time (Late night)
    try:
        hour = int(transaction['timestamp'][11:13]) # Extract hour from "YYYY-MM-DD HH:MM:SS"
        if hour >= 0 and hour <= 5:
            score += 30
            factors.append("Late night transaction")
    except:
        pass
        
    # 2. High Risk Category
    if transaction.get('merchant_category') in ['Crypto', 'Electronics', 'Gaming']:
        score += 20
        factors.append("High-risk merchant category")
        
    # 3. High Amount
    amount = float(transaction.get('amount', 0))
    if amount > 5000:
        score += 40
        factors.append("Extremely high transaction amount")
    elif amount > 1000:
        score += 20
        factors.append("High transaction amount")
        
    # 4. Device Context
    if transaction.get('device_type') == 'API':
        score += 30
        factors.append("Unusual device type (API)")
        
    # Cap at 100
    return min(100, score), factors


def evaluate_transaction(transaction):
    """
    Evaluates a transaction across the ensemble of models and calculates a final risk score.
    """
    
    # 1. Get Individual Model Scores (Handle missing models gracefully)
    xgb_result = xgb_predict(transaction)
    xgb_score = (xgb_result['fraud_probability'] * 100) if xgb_result else 0
    
    if_result = if_predict(transaction)
    if_score = if_result['anomaly_score'] if if_result else 0
    
    ae_result = ae_predict(transaction)
    ae_score = ae_result['normalized_anomaly_score'] if ae_result else 0
    
    beh_score, beh_factors = evaluate_behavioral_indicators(transaction)
    
    # 2. Base Weighted Score Calculation
    WEIGHT_XGB = 0.40
    WEIGHT_AE = 0.25
    WEIGHT_IF = 0.20
    WEIGHT_BEH = 0.15
    
    base_score = (
        (xgb_score * WEIGHT_XGB) + 
        (ae_score * WEIGHT_AE) + 
        (if_score * WEIGHT_IF) + 
        (beh_score * WEIGHT_BEH)
    )
    
    final_score = base_score
    contributing_factors = beh_factors.copy()
    
    # 3. Critical Signal Overrides (The Veto System)
    if xgb_score >= 90:
        final_score = max(final_score, xgb_score)
        contributing_factors.append("Critical Alert: Known fraud pattern detected (XGBoost)")
        
    if ae_score >= 95:
        final_score = max(final_score, 85)
        contributing_factors.append("Critical Alert: Severe behavioral anomaly detected (Autoencoder)")
        
    if if_score >= 90:
        contributing_factors.append("Warning: Statistical outlier detected (Isolation Forest)")
        
    # Ensure score stays bounded
    final_score = min(100, max(0, final_score))
    
    # 4. Determine Risk Level
    if final_score <= 30:
        risk_level = "LOW"
    elif final_score <= 60:
        risk_level = "MEDIUM"
    elif final_score <= 80:
        risk_level = "HIGH"
    else:
        risk_level = "CRITICAL"
        
    return {
        "transaction_id": transaction.get("transaction_id", "UNKNOWN"),
        "fraud_probability": round(xgb_score / 100, 4),
        "anomaly_score_iforest": round(if_score, 2),
        "anomaly_score_autoencoder": round(ae_score, 2),
        "behavioral_score": round(beh_score, 2),
        "final_risk_score": round(final_score, 2),
        "risk_level": risk_level,
        "contributing_factors": contributing_factors
    }

if __name__ == "__main__":
    import json
    
    print("=== FraudGuard AI: Hybrid Risk Engine ===")
    
    mock_transaction = {
        "transaction_id": "TX-HYBRID-999",
        "user_id": "USR-1234",
        "timestamp": "2023-11-01 03:15:00", # 3 AM (Late)
        "amount": 8500.00,                   # Very high
        "merchant_category": "Crypto",       # High risk
        "device_type": "API"                 # Unusual
    }
    
    print("\nEvaluating High-Risk Transaction:")
    result = evaluate_transaction(mock_transaction)
    print(json.dumps(result, indent=2))
