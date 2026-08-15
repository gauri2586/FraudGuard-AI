import os
import json
import numpy as np
import pandas as pd
import joblib

# Suppress verbose TF logging
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
import tensorflow as tf
from tensorflow.keras.models import Model, Sequential
from tensorflow.keras.layers import Input, Dense
from tensorflow.keras.callbacks import EarlyStopping
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error

try:
    from backend.ml.preprocessing import load_and_merge_data
    from backend.ml.feature_config import TARGET_COL, TIME_COL, JOIN_KEY
except ImportError:
    from preprocessing import load_and_merge_data
    from feature_config import TARGET_COL, TIME_COL, JOIN_KEY

def train_autoencoder():
    print("Starting Autoencoder Training Process...")
    
    data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    artifact_dir = os.path.join(os.path.dirname(__file__), "artifacts")
    
    # 1. Load Data
    df = load_and_merge_data(data_dir)
    print(f"Total dataset loaded: {df.shape[0]} rows.")
    
    # 2. Temporal Split (Matching XGBoost & Isolation Forest)
    print("Sorting by time to ensure consistency...")
    df = df.sort_values(TIME_COL).reset_index(drop=True)
    
    n_total = len(df)
    n_train = int(n_total * 0.8)
    n_val = int(n_total * 0.1)
    
    train_df = df.iloc[:n_train]
    val_df = df.iloc[n_train:n_train+n_val]
    test_df = df.iloc[n_train+n_val:]
    
    y_train = train_df[TARGET_COL].values
    y_val = val_df[TARGET_COL].values
    y_test = test_df[TARGET_COL].values
    
    X_train = train_df.drop(columns=[TARGET_COL, JOIN_KEY])
    X_val = val_df.drop(columns=[TARGET_COL, JOIN_KEY])
    X_test = test_df.drop(columns=[TARGET_COL, JOIN_KEY])
    
    # 3. Load Preprocessing Pipeline
    preprocessor_path = os.path.join(artifact_dir, "preprocessing_pipeline.joblib")
    if not os.path.exists(preprocessor_path):
        raise FileNotFoundError(f"Preprocessing pipeline not found at {preprocessor_path}.")
        
    print("Loading existing preprocessing pipeline...")
    pipeline = joblib.load(preprocessor_path)
    
    # Transform data
    X_train_proc = pipeline.transform(X_train)
    X_val_proc = pipeline.transform(X_val)
    X_test_proc = pipeline.transform(X_test)
    
    # 4. Filter for Semi-Supervised Training
    print("Filtering training and validation data to strictly legitimate transactions (isFraud == 0)...")
    train_legit_mask = (y_train == 0)
    val_legit_mask = (y_val == 0)
    
    X_train_legit = X_train_proc[train_legit_mask]
    X_val_legit = X_val_proc[val_legit_mask]
    print(f"Training on {len(X_train_legit)} normal transactions. Validating on {len(X_val_legit)} normal transactions.")
    
    # 5. Build Autoencoder Architecture
    input_dim = X_train_legit.shape[1]
    print(f"Building Autoencoder (Input Dimension: {input_dim})...")
    
    autoencoder = Sequential([
        Input(shape=(input_dim,)),
        Dense(32, activation='relu', name='encoder_1'),
        Dense(16, activation='relu', name='bottleneck'),
        Dense(32, activation='relu', name='decoder_1'),
        Dense(input_dim, activation='linear', name='output')
    ])
    
    autoencoder.compile(optimizer='adam', loss='mse')
    autoencoder.summary()
    
    # 6. Train the Model
    print("\nTraining Neural Network...")
    early_stopping = EarlyStopping(
        monitor='val_loss', 
        patience=5, 
        restore_best_weights=True,
        verbose=1
    )
    
    autoencoder.fit(
        X_train_legit, X_train_legit,
        epochs=50,
        batch_size=512,
        shuffle=True,
        validation_data=(X_val_legit, X_val_legit),
        callbacks=[early_stopping],
        verbose=1
    )
    
    # 7. Calculate MSE and Normalize to 0-100 Score
    print("\nCalibrating Anomaly Score normalizer (0-100)...")
    # Compute MSE for training set
    train_preds = autoencoder.predict(X_train_legit, batch_size=2048)
    # Mean across features to get 1 score per row
    train_mse = np.mean(np.square(X_train_legit - train_preds), axis=1).reshape(-1, 1)
    
    # MinMaxScaler to bounded 0-100 scale
    scaler = MinMaxScaler(feature_range=(0, 100))
    scaler.fit(train_mse)
    
    # 8. Evaluate on Test Set
    print("\nEvaluating Anomaly Scores on Test Set...")
    test_preds = autoencoder.predict(X_test_proc, batch_size=2048)
    test_mse = np.mean(np.square(X_test_proc - test_preds), axis=1).reshape(-1, 1)
    
    scaled_test_scores = scaler.transform(test_mse)
    # Clip to 100 in case the test set has extreme outliers far beyond training max
    scaled_test_scores = np.clip(scaled_test_scores, 0, 100).flatten()
    
    fraud_mask = (y_test == 1)
    legit_test_mask = (y_test == 0)
    
    avg_fraud_score = scaled_test_scores[fraud_mask].mean()
    avg_legit_score = scaled_test_scores[legit_test_mask].mean()
    
    metrics = {
        "avg_anomaly_score_fraud": float(avg_fraud_score),
        "avg_anomaly_score_legit": float(avg_legit_score),
        "score_difference": float(avg_fraud_score - avg_legit_score)
    }
    
    print(f"Average Anomaly Score for ACTUAL FRAUD:      {avg_fraud_score:.2f} / 100")
    print(f"Average Anomaly Score for ACTUAL LEGITIMATE: {avg_legit_score:.2f} / 100")
    
    # 9. Save Artifacts
    model_path = os.path.join(artifact_dir, "autoencoder.keras")
    scaler_path = os.path.join(artifact_dir, "autoencoder_scaler.joblib")
    
    autoencoder.save(model_path)
    joblib.dump(scaler, scaler_path)
    
    print(f"\nSaved Autoencoder model to {model_path}")
    print(f"Saved Score Normalizer to {scaler_path}")
    
    # Save metrics for report generation
    metrics_path = os.path.join(os.path.dirname(__file__), "autoencoder_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=4)
        
    print("Autoencoder training completed successfully!")

if __name__ == "__main__":
    train_autoencoder()
