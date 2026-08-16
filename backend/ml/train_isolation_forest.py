import os
import json
import numpy as np
import joblib
from datetime import datetime
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import MinMaxScaler
import sys

# Add backend to path to allow importing ml package if run from root
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

def train_isolation_forest():
    print("Starting Isolation Forest Training Process...")
    
    base_dir = os.path.dirname(os.path.dirname(__file__))
    artifact_dir = os.path.join(base_dir, "ml", "artifacts")
    
    # 1. Load Preprocessed Data
    print("Loading preprocessed training and validation sets...")
    try:
        X_train = joblib.load(os.path.join(artifact_dir, "X_train.joblib"))
        y_train = joblib.load(os.path.join(artifact_dir, "y_train.joblib"))
        X_val = joblib.load(os.path.join(artifact_dir, "X_val.joblib"))
        y_val = joblib.load(os.path.join(artifact_dir, "y_val.joblib"))
    except FileNotFoundError:
        print("Error: Preprocessed data not found. Please run prepare_data.py first.")
        return
        
    print(f"Train set shape: {X_train.shape}")
    
    # 2. Filter for Semi-Supervised Training
    # We train the anomaly detector strictly on normal/legitimate transactions
    print("Filtering training data to strictly legitimate transactions (isFraud == 0)...")
    legit_mask = (y_train == 0)
    X_train_legit = X_train[legit_mask]
    print(f"Training on {len(X_train_legit)} normal transactions.")
    
    # 3. Train Isolation Forest
    print("Training Isolation Forest...")
    # Use max_samples to limit memory/computation and improve anomaly trees
    iforest = IsolationForest(
        n_estimators=200, 
        max_samples=10000, 
        contamination=0.001, # We expect very few anomalies in the 'legit' set
        random_state=42, 
        n_jobs=-1
    )
    iforest.fit(X_train_legit)
    
    # 4. Normalize Scores to 0-100
    print("Calibrating Anomaly Score normalizer (0-100)...")
    # decision_function returns lower values for anomalies. We invert it so higher = more anomalous.
    raw_train_scores = -iforest.decision_function(X_train_legit).reshape(-1, 1)
    
    scaler = MinMaxScaler(feature_range=(0, 100))
    scaler.fit(raw_train_scores)
    
    # 5. Evaluate on Validation Set
    print("\nEvaluating Anomaly Scores on Validation Set...")
    raw_val_scores = -iforest.decision_function(X_val).reshape(-1, 1)
    
    # Scale test scores and clip to 0-100 just in case there are extreme outliers
    scaled_val_scores = scaler.transform(raw_val_scores)
    scaled_val_scores = np.clip(scaled_val_scores, 0, 100).flatten()
    
    fraud_mask = (y_val == 1)
    legit_val_mask = (y_val == 0)
    
    avg_fraud_score = scaled_val_scores[fraud_mask].mean()
    avg_legit_score = scaled_val_scores[legit_val_mask].mean()
    
    metrics = {
        "avg_anomaly_score_fraud": float(avg_fraud_score),
        "avg_anomaly_score_legit": float(avg_legit_score),
        "score_difference": float(avg_fraud_score - avg_legit_score)
    }
    
    print(f"Average Anomaly Score for ACTUAL FRAUD:      {avg_fraud_score:.2f} / 100")
    print(f"Average Anomaly Score for ACTUAL LEGITIMATE: {avg_legit_score:.2f} / 100")
    
    # 6. Save Artifacts
    iforest_path = os.path.join(artifact_dir, "isolation_forest.joblib")
    scaler_path = os.path.join(artifact_dir, "iforest_scaler.joblib")
    
    joblib.dump(iforest, iforest_path)
    joblib.dump(scaler, scaler_path)
    
    print(f"\nSaved Isolation Forest model to {iforest_path}")
    print(f"Saved Score Normalizer to {scaler_path}")
    
    # Save metrics for metadata report
    metadata = {
        "model_name": "Isolation Forest Anomaly Detector",
        "training_date": datetime.now().isoformat(),
        "training_rows_used": int(len(X_train_legit)),
        "validation_rows": int(len(X_val)),
        "metrics": metrics
    }
    
    metadata_path = os.path.join(artifact_dir, "iforest_metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=4)
        
    print("Isolation Forest training completed successfully!")

if __name__ == "__main__":
    train_isolation_forest()
