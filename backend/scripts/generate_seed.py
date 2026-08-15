import os
import sys
import json
import pandas as pd

base_dir = os.path.dirname(os.path.dirname(__file__))
if base_dir not in sys.path:
    sys.path.append(base_dir)

from app.services.fraud_model_service import fraud_model_service
from ml.preprocessing import load_and_merge_data

def generate_seed_data():
    data_dir = os.path.join(base_dir, "data")
    seed_file = os.path.join(data_dir, "seed_transactions.json")
    
    print("Loading a subset of transactions...")
    df = load_and_merge_data(data_dir, subset_n=2000)
    
    # Let's pick 30 legitimate and 20 fraud transactions
    df_legit = df[df["isFraud"] == 0].sample(n=30, random_state=42)
    df_fraud = df[df["isFraud"] == 1].sample(n=20, random_state=42)
    df_sample = pd.concat([df_legit, df_fraud]).sample(frac=1, random_state=42) # Shuffle
    
    transactions = []
    
    print("Evaluating transactions through the Hybrid Risk Engine...")
    for idx, row in df_sample.iterrows():
        # Map raw pandas row to our MockTransaction object shape
        class MockTx:
            def __init__(self, r):
                self.transaction_id = str(r.get("TransactionID", f"TX-{idx}"))
                self.amount = float(r.get("TransactionAmt", 0))
                self.transaction_type = str(r.get("ProductCD", "W"))
                self.device_type = str(r.get("DeviceType", "mobile"))
                self.transaction_frequency = float(r.get("C1", 1))
                self.time_since_last_transaction = float(r.get("D1", 1)) * 86400
                
        tx_obj = MockTx(row)
        
        # We need the full row for accurate ML inference, not just the mapped fields
        # But wait, our API expects the simple mapped fields, and the service maps them back to a dataframe with NaNs.
        # This means if we pass just the mapped fields, it evaluates as a new frontend transaction!
        # Let's pass the raw row directly to the risk engine to get accurate scores based on ALL features.
        
        # 1. Create a 1-row DataFrame of the RAW data
        df_raw = pd.DataFrame([row.to_dict()])
        
        # 2. Get Risk Score directly from engine
        engine_results = fraud_model_service.risk_engine.evaluate(df_raw)
        result = engine_results[0]
        
        # 3. Get Explanations
        shap_results = fraud_model_service.explainer.explain_transaction(df_raw, top_n=5)
        explanations = shap_results[0]
        
        # 4. Construct Frontend Data Object
        tx_dict = {
            "id": tx_obj.transaction_id,
            "user": f"User-{str(row.get('card1', 'Unknown'))}",
            "amount": tx_obj.amount,
            "merchant": f"Merchant-{str(row.get('card2', 'Unknown'))}",
            "location": "Online",
            "device": tx_obj.device_type,
            "timestamp": "2023-11-01 14:30:00",
            "riskScore": int(result["hybrid_risk_score"]),
            "status": "new" if result["hybrid_risk_score"] < 60 else "review",
            "type": tx_obj.transaction_type,
            "aiConfidence": round(result["model_signals"]["xgboost_probability_score"]),
            "modelScores": {
                "xgboost": int(result["model_signals"]["xgboost_probability_score"]),
                "isolationForest": int(result["model_signals"]["isolation_forest_anomaly_score"]),
                "autoencoder": int(result["model_signals"]["autoencoder_anomaly_score"])
            },
            "explanations": explanations,
            "reasons": ["Automated ML processing"]
        }
        
        transactions.append(tx_dict)
        
    with open(seed_file, "w") as f:
        json.dump(transactions, f, indent=2)
        
    print(f"Successfully generated {len(transactions)} seed transactions at {seed_file}")

if __name__ == "__main__":
    generate_seed_data()
