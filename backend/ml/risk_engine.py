from typing import Dict, Any

class HybridRiskEngine:
    """
    FraudGuard AI Hybrid Risk Engine
    Combines predictions from XGBoost, Isolation Forest, and Autoencoder 
    into a unified 0-100 risk score and associated decision level.
    
    Scoring Method (Deterministic):
    - XGBoost Probability is scaled 0-100. This is the primary supervised signal.
    - Isolation Forest Score is scaled 0-100. This is the primary unsupervised signal.
    - Autoencoder Score is scaled 0-100. This is the neural reconstruction signal.
    
    Final Risk Score = max(XGBoost, Isolation Forest * 0.8, Autoencoder * 0.8)
    This ensures that if the supervised model is highly confident, it dominates,
    but if an extreme anomaly occurs, it can trigger an investigation even if 
    XGBoost misses it.
    """
    
    def __init__(self):
        # Risk thresholds (0-100 scale)
        self.thresholds = {
            "CRITICAL": 80,
            "HIGH": 60,
            "MEDIUM": 30,
            "LOW": 0
        }

    def evaluate(self, xgb_prob: float, iforest_score_normalized: int, ae_score_normalized: int) -> Dict[str, Any]:
        """
        Calculates the final risk metrics and decision.
        
        Args:
            xgb_prob (float): Raw probability from XGBoost (0.0 to 1.0)
            iforest_score_normalized (int): Scaled 0-100 anomaly score
            ae_score_normalized (int): Scaled 0-100 reconstruction anomaly score
            
        Returns:
            Dict containing the structured response expected by the frontend API.
        """
        # 1. Normalize XGBoost to 0-100
        xgb_score = int(xgb_prob * 100)
        
        # 2. Deterministic Scoring Method
        # The XGBoost model is given primary weight (1.0).
        # Unsupervised models can elevate risk, but are discounted (0.8) to prevent false positives.
        final_risk_score = max(
            xgb_score,
            int(iforest_score_normalized * 0.8),
            int(ae_score_normalized * 0.8)
        )
        
        # 3. Determine Risk Level
        risk_level = "LOW"
        requires_investigation = False
        
        if final_risk_score > self.thresholds["CRITICAL"]:
            risk_level = "CRITICAL"
            requires_investigation = True
        elif final_risk_score > self.thresholds["HIGH"]:
            risk_level = "HIGH"
            requires_investigation = True
        elif final_risk_score > self.thresholds["MEDIUM"]:
            risk_level = "MEDIUM"
            requires_investigation = False
        else:
            risk_level = "LOW"
            requires_investigation = False
            
        # 4. Construct Output
        return {
            "fraud_probability": round(xgb_prob, 4),
            "xgboost_score": xgb_score,
            "isolation_forest_score": iforest_score_normalized,
            "autoencoder_score": ae_score_normalized,
            "final_risk_score": final_risk_score,
            "risk_level": risk_level,
            "fraud_detected": requires_investigation
        }

# Global singleton
hybrid_risk_engine = HybridRiskEngine()
