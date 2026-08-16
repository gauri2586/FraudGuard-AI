import os
import json
import numpy as np
import joblib
from datetime import datetime
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing import MinMaxScaler
import sys

# Add backend to path to allow importing ml package if run from root
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

def train_autoencoder():
    print("Starting Lightweight Autoencoder Training Process...")
    
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
    print("Filtering training data to strictly legitimate transactions (isFraud == 0)...")
    train_legit_mask = (y_train == 0)
    X_train_legit = X_train[train_legit_mask]
    
    # For speed, we can sample if it's too large, but 450k rows should train in a few minutes
    # Let's take a 50k sample for speed since it's just a lightweight baseline model
    if len(X_train_legit) > 50000:
        np.random.seed(42)
        indices = np.random.choice(len(X_train_legit), 50000, replace=False)
        X_train_legit = X_train_legit[indices]
        
    print(f"Training on {len(X_train_legit)} normal transactions.")
    
    # 3. Build Autoencoder Architecture using MLPRegressor
    print("Training MLPRegressor-based Autoencoder...")
    autoencoder = MLPRegressor(
        hidden_layer_sizes=(32, 16, 32),
        activation='relu',
        solver='adam',
        max_iter=30,
        batch_size=512,
        early_stopping=True,
        validation_fraction=0.1,
        random_state=42,
        verbose=True
    )
    
    # Autoencoder task: predict X from X
    autoencoder.fit(X_train_legit, X_train_legit)
    
    # 4. Calculate MSE and Normalize to 0-100 Score
    print("\nCalibrating Anomaly Score normalizer (0-100)...")
    train_preds = autoencoder.predict(X_train_legit)
    train_mse = np.mean(np.square(X_train_legit - train_preds), axis=1).reshape(-1, 1)
    
    scaler = MinMaxScaler(feature_range=(0, 100))
    scaler.fit(train_mse)
    
    # 5. Evaluate on Validation Set
    print("\nEvaluating Anomaly Scores on Validation Set...")
    val_preds = autoencoder.predict(X_val)
    val_mse = np.mean(np.square(X_val - val_preds), axis=1).reshape(-1, 1)
    
    scaled_val_scores = scaler.transform(val_mse)
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
    model_path = os.path.join(artifact_dir, "autoencoder.joblib")
    scaler_path = os.path.join(artifact_dir, "autoencoder_scaler.joblib")
    
    joblib.dump(autoencoder, model_path)
    joblib.dump(scaler, scaler_path)
    
    print(f"\nSaved Autoencoder model to {model_path}")
    print(f"Saved Score Normalizer to {scaler_path}")
    
    # Save metadata
    metadata = {
        "model_name": "Lightweight Autoencoder Anomaly Detector",
        "training_date": datetime.now().isoformat(),
        "training_rows_used": int(len(X_train_legit)),
        "validation_rows": int(len(X_val)),
        "metrics": metrics
    }
    
    metadata_path = os.path.join(artifact_dir, "autoencoder_metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=4)
        
    print("Autoencoder training completed successfully!")

if __name__ == "__main__":
    train_autoencoder()
