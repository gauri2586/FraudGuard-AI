import os
import json
import numpy as np
import joblib
from datetime import datetime
from xgboost import XGBClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, confusion_matrix
)
import sys

# Add backend to path to allow importing ml package if run from root
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from ml.preprocessing import build_preprocessing_pipeline

def train_and_evaluate():
    print("Starting Robust XGBoost Training Process...")
    
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
    print(f"Val set shape: {X_val.shape}")
    
    # Get feature names from config
    _, final_num_cols, final_cat_cols = build_preprocessing_pipeline()
    feature_names = final_num_cols + final_cat_cols
    
    # 2. Handle Class Imbalance
    num_positive = np.sum(y_train)
    num_negative = len(y_train) - num_positive
    imbalance_ratio = num_negative / num_positive if num_positive > 0 else 1.0
    print(f"Training Class Imbalance Ratio (Neg/Pos): {imbalance_ratio:.2f}")
    
    # 3. Initialize XGBoost
    # Using tree_method='hist' for fast training on large datasets
    print("Initializing XGBoost Classifier...")
    model = XGBClassifier(
        n_estimators=300,
        learning_rate=0.05,
        max_depth=6,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=imbalance_ratio,
        objective='binary:logistic',
        eval_metric='aucpr',
        tree_method='hist',
        early_stopping_rounds=15,
        random_state=42,
        n_jobs=-1
    )
    
    # 4. Train Model
    print("Training XGBoost Classifier...")
    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=25
    )
    
    # 5. Save Model
    model_path = os.path.join(artifact_dir, "xgboost_fraud_model.json")
    model.save_model(model_path)
    print(f"Saved XGBoost model to {model_path}")
    
    # 6. Predict and Evaluate
    print("Evaluating on Validation Set...")
    # The best iteration is automatically used for predictions when early stopping is used
    y_pred = model.predict(X_val)
    y_prob = model.predict_proba(X_val)[:, 1]
    
    acc = accuracy_score(y_val, y_pred)
    precision = precision_score(y_val, y_pred)
    recall = recall_score(y_val, y_pred)
    f1 = f1_score(y_val, y_pred)
    roc_auc = roc_auc_score(y_val, y_prob)
    pr_auc = average_precision_score(y_val, y_prob)
    
    cm = confusion_matrix(y_val, y_pred)
    tn, fp, fn, tp = cm.ravel()
    
    metrics = {
        "accuracy": float(acc),
        "precision": float(precision),
        "recall": float(recall),
        "f1": float(f1),
        "roc_auc": float(roc_auc),
        "pr_auc": float(pr_auc),
        "confusion_matrix": {
            "tn": int(tn),
            "fp": int(fp),
            "fn": int(fn),
            "tp": int(tp)
        }
    }
    
    print("\n--- VALIDATION METRICS ---")
    print(f"Accuracy:  {metrics['accuracy']:.4f}")
    print(f"Precision: {metrics['precision']:.4f}")
    print(f"Recall:    {metrics['recall']:.4f}")
    print(f"F1-score:  {metrics['f1']:.4f}")
    print(f"ROC-AUC:   {metrics['roc_auc']:.4f}")
    print(f"PR-AUC:    {metrics['pr_auc']:.4f}")
    print(f"Confusion Matrix: TN={tn}, FP={fp}, FN={fn}, TP={tp}")
    
    # 7. Save Metadata
    metadata = {
        "model_name": "XGBoost Fraud Detection Model",
        "training_date": datetime.now().isoformat(),
        "feature_count": len(feature_names),
        "feature_names": feature_names,
        "training_rows": int(len(y_train)),
        "validation_rows": int(len(y_val)),
        "metrics": metrics
    }
    
    metadata_path = os.path.join(artifact_dir, "xgboost_metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=4)
        
    print(f"\nSaved metadata to {metadata_path}")
    print("Training completed successfully!")

if __name__ == "__main__":
    train_and_evaluate()
