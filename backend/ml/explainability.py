import os
import joblib
import numpy as np
import pandas as pd
import shap
from xgboost import XGBClassifier

try:
    from ml.feature_config import (
        NUMERICAL_COLS, ENGINEERED_NUMERICAL_COLS, 
        CATEGORICAL_COLS, ENGINEERED_CATEGORICAL_COLS
    )
except ImportError:
    from feature_config import (
        NUMERICAL_COLS, ENGINEERED_NUMERICAL_COLS, 
        CATEGORICAL_COLS, ENGINEERED_CATEGORICAL_COLS
    )

# ---------------------------------------------------------
# Human-Readable Feature Mapping
# ---------------------------------------------------------
FEATURE_DISPLAY_NAMES = {
    "TransactionAmt": "Transaction Amount",
    "TransactionAmt_Log": "Log(Transaction Amount)",
    "dist1": "Distance from Billing Address",
    "dist2": "Distance from Shipping Address",
    "hour_of_day": "Hour of Day",
    "day_of_week": "Day of Week",
    "email_match": "Purchaser/Receiver Email Match",
    "P_emaildomain": "Purchaser Email Domain",
    "R_emaildomain": "Receiver Email Domain",
    "ProductCD": "Product Code",
    "DeviceType": "Device Type",
    "DeviceInfo": "Device Info",
    "card1": "Payment Card ID 1",
    "card2": "Payment Card ID 2",
    "card3": "Payment Card ID 3",
    "card4": "Payment Card Network",
    "card5": "Payment Card Type",
    "card6": "Payment Card Credit/Debit",
    "addr1": "Billing Region",
    "addr2": "Billing Country",
}

# Add generic mappings for C and D features (counts and time deltas)
for i in range(1, 15):
    FEATURE_DISPLAY_NAMES[f"C{i}"] = f"Address/Card Frequency Count {i}"
for i in range(1, 16):
    FEATURE_DISPLAY_NAMES[f"D{i}"] = f"Days Since Previous Transaction {i}"
for i in range(12, 39):
    FEATURE_DISPLAY_NAMES[f"id_{i:02d}"] = f"Identity Marker {i}"


class FraudExplainer:
    """
    Explainable AI module for FraudGuard AI using SHAP.
    Calculates feature contributions to the XGBoost risk score.
    """
    def __init__(self):
        self._load_artifacts()
        
        # Determine the exact feature order produced by the ColumnTransformer
        self.feature_names = (
            NUMERICAL_COLS + ENGINEERED_NUMERICAL_COLS + 
            CATEGORICAL_COLS + ENGINEERED_CATEGORICAL_COLS
        )
        
        # Initialize SHAP TreeExplainer
        self.explainer = shap.TreeExplainer(self.xgb_model)
        
    def _load_artifacts(self):
        """Loads the XGBoost model and preprocessing pipeline."""
        base_dir = os.path.dirname(__file__)
        artifact_dir = os.path.join(base_dir, "artifacts")
        
        self.pipeline = joblib.load(os.path.join(artifact_dir, "preprocessing_pipeline.joblib"))
        
        self.xgb_model = XGBClassifier()
        self.xgb_model.load_model(os.path.join(artifact_dir, "xgboost_fraud_model.json"))
        
    def explain_transaction(self, df_raw, top_n=5):
        """
        Explains a single transaction (or multiple, returns list of explanations).
        df_raw: pandas DataFrame of raw transaction(s).
        Returns: list of lists, where each inner list contains top_n contributing factors.
        """
        # Ensure we don't modify original dataframe
        df = df_raw.copy()
        for col in ["isFraud", "TransactionID"]:
            if col in df.columns:
                df = df.drop(columns=[col])
                
        # 1. Preprocess the transaction
        X_proc = self.pipeline.transform(df)
        
        # 2. Calculate SHAP values
        shap_values = self.explainer.shap_values(X_proc)
        
        explanations = []
        for i in range(len(df)):
            # shap_values[i] contains the contribution of each feature for row i
            row_shap_values = shap_values[i]
            
            # Create a list of feature contributions
            factors = []
            for j, feature_name in enumerate(self.feature_names):
                shap_val = float(row_shap_values[j])
                # Skip features with exactly 0 impact to save space
                if shap_val == 0:
                    continue
                    
                display_name = FEATURE_DISPLAY_NAMES.get(feature_name, feature_name)
                
                factors.append({
                    "feature": feature_name,
                    "display_name": display_name,
                    "impact": abs(shap_val),
                    "direction": "increases_risk" if shap_val > 0 else "decreases_risk",
                    "raw_shap": shap_val
                })
                
            # Sort by absolute impact (highest first)
            factors.sort(key=lambda x: x["impact"], reverse=True)
            
            # Select top N factors
            top_factors = factors[:top_n]
            
            # Remove raw_shap from final output for cleaner API response
            for f in top_factors:
                del f["raw_shap"]
                
            explanations.append(top_factors)
            
        return explanations

def test_explainability():
    """
    Internal test using real transactions.
    """
    print("Initializing Fraud Explainer...")
    explainer = FraudExplainer()
    print("Explainer loaded successfully!\n")
    
    data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    
    try:
        from preprocessing import load_and_merge_data
    except ImportError:
        import sys
        sys.path.append(os.path.dirname(os.path.dirname(__file__)))
        from ml.preprocessing import load_and_merge_data
        
    print("Loading test data...")
    df_raw = load_and_merge_data(data_dir, subset_n=5000)
    
    # 2 Fraud, 2 Legit
    fraud_df = df_raw[df_raw['isFraud'] == 1].head(2)
    legit_df = df_raw[df_raw['isFraud'] == 0].head(2)
    
    test_cases = pd.concat([fraud_df, legit_df])
    actual_labels = test_cases['isFraud'].values
    
    print("\n--- RUNNING SHAP EXPLANATIONS ---")
    explanations = explainer.explain_transaction(test_cases, top_n=5)
    
    for i, explanation in enumerate(explanations):
        actual = "FRAUD" if actual_labels[i] == 1 else "LEGITIMATE"
        print(f"\nTransaction {i+1} (Actual: {actual})")
        print("Top 5 Driving Factors:")
        for factor in explanation:
            print(f"  - [{factor['direction'].upper()}] {factor['display_name']} (Impact: {factor['impact']:.4f})")
        print("-" * 50)
        
    print("\nSHAP explainability test completed successfully.")

if __name__ == "__main__":
    test_explainability()
