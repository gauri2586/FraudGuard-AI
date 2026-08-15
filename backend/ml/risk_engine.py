import os
import json
import joblib
import numpy as np
import pandas as pd
from xgboost import XGBClassifier

# Suppress verbose TF logging
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
import tensorflow as tf

class HybridRiskEngine:
    """
    FraudGuard AI Hybrid Risk Engine
    Combines predictions from XGBoost, Isolation Forest, and Autoencoder 
    into a unified 0-100 risk score and associated decision level.
    """
    
    def __init__(self, 
                 weights={"xgboost": 0.60, "isolation_forest": 0.20, "autoencoder": 0.20},
                 decision_threshold=60):
        
        self.weights = weights
        self.decision_threshold = decision_threshold
        
        # Verify weights sum to 1.0 (or 100%)
        if abs(sum(weights.values()) - 1.0) > 0.001:
            raise ValueError("Hybrid weights must sum to 1.0")
            
        self._load_artifacts()
        
    def _load_artifacts(self):
        """Loads all required models and preprocessing artifacts from disk."""
        base_dir = os.path.dirname(__file__)
        artifact_dir = os.path.join(base_dir, "artifacts")
        
        # 1. Preprocessing Pipeline
        self.pipeline = joblib.load(os.path.join(artifact_dir, "preprocessing_pipeline.joblib"))
        
        # 2. Supervised XGBoost Model
        self.xgb_model = XGBClassifier()
        self.xgb_model.load_model(os.path.join(artifact_dir, "xgboost_fraud_model.json"))
        
        # 3. Unsupervised Isolation Forest
        self.iforest = joblib.load(os.path.join(artifact_dir, "isolation_forest.joblib"))
        self.iforest_scaler = joblib.load(os.path.join(artifact_dir, "iforest_scaler.joblib"))
        
        # 4. Unsupervised Autoencoder
        self.autoencoder = tf.keras.models.load_model(os.path.join(artifact_dir, "autoencoder.keras"))
        self.ae_scaler = joblib.load(os.path.join(artifact_dir, "autoencoder_scaler.joblib"))

    def evaluate(self, df_raw):
        """
        Evaluates a raw DataFrame of transactions.
        df_raw must contain all columns required by the pipeline.
        Returns a list of dictionaries containing individual scores, hybrid score, and decision.
        """
        # Ensure we don't modify the original dataframe
        df = df_raw.copy()
        
        # Drop TARGET_COL and JOIN_KEY if they exist, as they shouldn't be in inference
        for col in ["isFraud", "TransactionID"]:
            if col in df.columns:
                df = df.drop(columns=[col])
                
        # 1. Preprocess
        X_proc = self.pipeline.transform(df)
        
        # 2. XGBoost Signal (0-100)
        # predict_proba returns [prob_legit, prob_fraud]
        xgb_prob = self.xgb_model.predict_proba(X_proc)[:, 1]
        xgb_scores = xgb_prob * 100
        
        # 3. Isolation Forest Signal (0-100)
        # Invert decision function (lower was more anomalous)
        if_raw = -self.iforest.decision_function(X_proc).reshape(-1, 1)
        if_scores = self.iforest_scaler.transform(if_raw).flatten()
        if_scores = np.clip(if_scores, 0, 100)
        
        # 4. Autoencoder Signal (0-100)
        ae_preds = self.autoencoder.predict(X_proc, batch_size=2048, verbose=0)
        ae_mse = np.mean(np.square(X_proc - ae_preds), axis=1).reshape(-1, 1)
        ae_scores = self.ae_scaler.transform(ae_mse).flatten()
        ae_scores = np.clip(ae_scores, 0, 100)
        
        # 5. Hybrid Calculation & Decision Logic
        results = []
        for i in range(len(df)):
            hybrid_score = (
                (xgb_scores[i] * self.weights["xgboost"]) +
                (if_scores[i] * self.weights["isolation_forest"]) +
                (ae_scores[i] * self.weights["autoencoder"])
            )
            
            # Categorize Risk
            if hybrid_score < 30:
                risk_level = "LOW"
                decision_text = "Low Risk"
                requires_investigation = False
            elif hybrid_score < 60:
                risk_level = "MEDIUM"
                decision_text = "Requires Investigation"
                requires_investigation = True
            elif hybrid_score < 80:
                risk_level = "HIGH"
                decision_text = "Potential Fraud"
                requires_investigation = True
            else:
                risk_level = "CRITICAL"
                decision_text = "Potential Fraud"
                requires_investigation = True
            
            result = {
                "hybrid_risk_score": float(round(hybrid_score, 2)),
                "risk_level": risk_level,
                "decision_text": decision_text,
                "requires_investigation": bool(requires_investigation),
                "model_signals": {
                    "xgboost_probability_score": float(round(xgb_scores[i], 2)),
                    "isolation_forest_anomaly_score": float(round(if_scores[i], 2)),
                    "autoencoder_anomaly_score": float(round(ae_scores[i], 2))
                }
            }
            results.append(result)
            
        return results

def test_risk_engine():
    """
    Internal test using real transactions from the dataset.
    """
    print("Initializing Hybrid Risk Engine...")
    engine = HybridRiskEngine()
    print("Engine loaded successfully!\n")
    
    data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    
    # Load a small slice to test
    try:
        from preprocessing import load_and_merge_data
    except ImportError:
        import sys
        sys.path.append(os.path.dirname(os.path.dirname(__file__)))
        from ml.preprocessing import load_and_merge_data
        
    print("Loading test data...")
    df_raw = load_and_merge_data(data_dir, subset_n=20000)
    
    # Let's find 2 known fraud transactions and 2 known legitimate transactions to test
    fraud_df = df_raw[df_raw['isFraud'] == 1].head(2)
    legit_df = df_raw[df_raw['isFraud'] == 0].head(2)
    
    test_cases = pd.concat([fraud_df, legit_df])
    actual_labels = test_cases['isFraud'].values
    
    print("\n--- RUNNING HYBRID ENGINE EVALUATION ---")
    results = engine.evaluate(test_cases)
    
    for i, res in enumerate(results):
        actual = "FRAUD" if actual_labels[i] == 1 else "LEGITIMATE"
        print(f"\nTransaction {i+1} (Actual: {actual})")
        print(f"Hybrid Score: {res['hybrid_risk_score']}/100 -> {res['risk_level']}")
        print(f"Decision:     {res['decision_text']} (Requires Investigation: {res['requires_investigation']})")
        print(f"  [+] XGBoost Signal:     {res['model_signals']['xgboost_probability_score']}")
        print(f"  [+] IF Anomaly Signal:  {res['model_signals']['isolation_forest_anomaly_score']}")
        print(f"  [+] AE Anomaly Signal:  {res['model_signals']['autoencoder_anomaly_score']}")
        print("-" * 50)
        
    print("\nHybrid Risk Engine test completed successfully.")

if __name__ == "__main__":
    test_risk_engine()
