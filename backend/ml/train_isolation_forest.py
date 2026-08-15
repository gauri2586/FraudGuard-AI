import os
import json
import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import MinMaxScaler

try:
    from backend.ml.preprocessing import load_and_merge_data
    from backend.ml.feature_config import TARGET_COL, TIME_COL, JOIN_KEY
except ImportError:
    from preprocessing import load_and_merge_data
    from feature_config import TARGET_COL, TIME_COL, JOIN_KEY

def train_isolation_forest():
    print("Starting Isolation Forest Training Process...")
    
    data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    artifact_dir = os.path.join(os.path.dirname(__file__), "artifacts")
    
    # 1. Load Data
    df = load_and_merge_data(data_dir)
    print(f"Total dataset loaded: {df.shape[0]} rows.")
    
    # 2. Temporal Split (Matching XGBoost)
    print("Sorting by time to ensure consistency...")
    df = df.sort_values(TIME_COL).reset_index(drop=True)
    
    n_total = len(df)
    n_train = int(n_total * 0.8)
    n_val = int(n_total * 0.1)
    
    train_df = df.iloc[:n_train]
    test_df = df.iloc[n_train+n_val:]
    
    y_train = train_df[TARGET_COL]
    y_test = test_df[TARGET_COL]
    
    X_train = train_df.drop(columns=[TARGET_COL, JOIN_KEY])
    X_test = test_df.drop(columns=[TARGET_COL, JOIN_KEY])
    
    # 3. Load Preprocessing Pipeline
    preprocessor_path = os.path.join(artifact_dir, "preprocessing_pipeline.joblib")
    if not os.path.exists(preprocessor_path):
        raise FileNotFoundError(f"Preprocessing pipeline not found at {preprocessor_path}. Train XGBoost first.")
        
    print("Loading existing preprocessing pipeline...")
    pipeline = joblib.load(preprocessor_path)
    
    # Transform data
    # Note: the pipeline was already fit on X_train during the XGBoost phase. We just transform here.
    # Alternatively, if we re-ran fit_transform, it would yield the identical result because the split is identical.
    X_train_proc = pipeline.transform(X_train)
    X_test_proc = pipeline.transform(X_test)
    
    # 4. Filter for Semi-Supervised Training
    print("Filtering training data to strictly legitimate transactions (isFraud == 0)...")
    legit_mask = (y_train == 0).values
    X_train_legit = X_train_proc[legit_mask]
    print(f"Training on {len(X_train_legit)} normal transactions.")
    
    # 5. Train Isolation Forest
    print("Training Isolation Forest...")
    # Contamination is set very low because we assume this set is mostly pure "normal" behavior.
    iforest = IsolationForest(
        n_estimators=200, 
        max_samples='auto', 
        contamination=0.001, 
        random_state=42, 
        n_jobs=-1
    )
    iforest.fit(X_train_legit)
    
    # 6. Normalize Scores to 0-100
    print("Calibrating Anomaly Score normalizer (0-100)...")
    # decision_function: lower means more anomalous.
    # We invert it so higher means more anomalous.
    raw_train_scores = -iforest.decision_function(X_train_legit).reshape(-1, 1)
    
    scaler = MinMaxScaler(feature_range=(0, 100))
    scaler.fit(raw_train_scores)
    
    # 7. Evaluate on Test Set
    print("\nEvaluating Anomaly Scores on Test Set...")
    raw_test_scores = -iforest.decision_function(X_test_proc).reshape(-1, 1)
    
    # We clip to [0, 100] just in case the test set has extreme outliers far beyond the training set max
    scaled_test_scores = scaler.transform(raw_test_scores)
    scaled_test_scores = np.clip(scaled_test_scores, 0, 100).flatten()
    
    # Group by actual fraud status
    fraud_mask = (y_test == 1).values
    legit_test_mask = (y_test == 0).values
    
    avg_fraud_score = scaled_test_scores[fraud_mask].mean()
    avg_legit_score = scaled_test_scores[legit_test_mask].mean()
    
    metrics = {
        "avg_anomaly_score_fraud": float(avg_fraud_score),
        "avg_anomaly_score_legit": float(avg_legit_score),
        "score_difference": float(avg_fraud_score - avg_legit_score)
    }
    
    print(f"Average Anomaly Score for ACTUAL FRAUD:      {avg_fraud_score:.2f} / 100")
    print(f"Average Anomaly Score for ACTUAL LEGITIMATE: {avg_legit_score:.2f} / 100")
    
    # 8. Save Artifacts
    iforest_path = os.path.join(artifact_dir, "isolation_forest.joblib")
    scaler_path = os.path.join(artifact_dir, "iforest_scaler.joblib")
    
    joblib.dump(iforest, iforest_path)
    joblib.dump(scaler, scaler_path)
    
    print(f"\nSaved Isolation Forest model to {iforest_path}")
    print(f"Saved Score Normalizer to {scaler_path}")
    
    # Save metrics for report generation
    metrics_path = os.path.join(os.path.dirname(__file__), "iforest_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=4)
        
    print("Isolation Forest training completed successfully!")

if __name__ == "__main__":
    train_isolation_forest()
