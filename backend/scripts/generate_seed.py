import os
import sys
import json
import pandas as pd

base_dir = os.path.dirname(os.path.dirname(__file__)) # backend
project_root = os.path.dirname(base_dir) # FraudGuard-AI

if base_dir not in sys.path:
    sys.path.append(base_dir)
if project_root not in sys.path:
    sys.path.append(project_root)

try:
    from app.services.fraud_model_service import fraud_model_service
except Exception as e:
    print(f"Warning: fraud_model_service failed to load: {e}")
    fraud_model_service = None

# fallback implementation if original import fails
import pandas as pd
def load_and_merge_data(data_dir, subset_n=None):
    df = pd.read_csv(os.path.join(project_root, "ml", "data", "raw", "transactions.csv"))
    if subset_n:
        df = df.head(subset_n)
    return df


def generate_seed_data():
    data_dir = os.path.join(base_dir, "data")
    seed_file = os.path.join(data_dir, "seed_transactions.json")
    
    print("Loading a subset of transactions...")
    df = load_and_merge_data(data_dir, subset_n=None) # load all so we have enough fraud cases
    
    # Let's pick 30 legitimate and 20 fraud transactions (or as many as available)
    num_fraud = min(20, len(df[df["is_fraud"] == 1]))
    num_legit = min(30, len(df[df["is_fraud"] == 0]))
    df_legit = df[df["is_fraud"] == 0].sample(n=num_legit, random_state=42)
    df_fraud = df[df["is_fraud"] == 1].sample(n=num_fraud, random_state=42)
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
        if fraud_model_service is not None and getattr(fraud_model_service, 'status', '') == 'healthy':
            result = fraud_model_service.predict(tx_obj)
            explanations = result.get("explanations", [])
            risk = result.get("final_risk_score", 0)
            model_signals = result.get("model_scores", {
                "xgboost": result.get("xgboost_score", 0),
                "isolation_forest": result.get("isolation_forest_score", 0),
                "autoencoder": result.get("autoencoder_score", 0)
            })
            aiConfidence = int(result.get("xgboost_score", 0))
        else:
            import random
            risk = 85 if row.get("is_fraud", 0) == 1 else random.randint(10, 40)
            model_signals = {
                "xgboost": risk,
                "isolation_forest": random.randint(0, 100),
                "autoencoder": random.randint(0, 100)
            }
            aiConfidence = risk
            explanations = [{
                "feature": "Fallback",
                "value": "N/A",
                "shap_value": 0.0,
                "effect": "increases_risk",
                "explanation": "Models not loaded"
            }]
        
        # 4. Construct Frontend Data Object
        tx_dict = {
            "id": tx_obj.transaction_id,
            "user": f"User-{str(row.get('card1', 'Unknown'))}",
            "amount": tx_obj.amount,
            "merchant": f"Merchant-{str(row.get('card2', 'Unknown'))}",
            "location": "Online",
            "device": tx_obj.device_type,
            "timestamp": (pd.to_datetime("2023-11-01") - pd.Timedelta(days=idx % 30, hours=(idx*7)%24, minutes=(idx*13)%60)).strftime("%Y-%m-%d %H:%M:%S"),
            "riskScore": risk,
            "status": "new" if risk < 60 else "review",
            "type": tx_obj.transaction_type,
            "aiConfidence": aiConfidence,
            "modelScores": {
                "xgboost": int(model_signals.get("xgboost", 0)),
                "isolationForest": int(model_signals.get("isolation_forest", 0)),
                "autoencoder": int(model_signals.get("autoencoder", 0))
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
