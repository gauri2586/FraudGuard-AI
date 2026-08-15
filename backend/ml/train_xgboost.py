import os
import json
import pandas as pd
import numpy as np
import joblib
from xgboost import XGBClassifier
from sklearn.metrics import (
    precision_score, recall_score, f1_score, roc_auc_score,
    average_precision_score, confusion_matrix, classification_report
)

try:
    from backend.ml.preprocessing import load_and_merge_data, build_preprocessing_pipeline
    from backend.ml.feature_config import TARGET_COL, TIME_COL, JOIN_KEY
except ImportError:
    from preprocessing import load_and_merge_data, build_preprocessing_pipeline
    from feature_config import TARGET_COL, TIME_COL, JOIN_KEY

def train_and_evaluate():
    print("Starting XGBoost Training Process...")
    
    data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    artifact_dir = os.path.join(os.path.dirname(__file__), "artifacts")
    os.makedirs(artifact_dir, exist_ok=True)
    
    # 1. Load Data
    # For a local sandbox run, we can restrict to nrows if memory is an issue, 
    # but the full dataset is ~60MB zipped which fits in memory nicely.
    # To ensure it runs fast in this environment, we'll use the full dataset.
    df = load_and_merge_data(data_dir)
    
    print(f"Total dataset loaded: {df.shape[0]} rows.")
    
    # 2. Temporal Split
    print("Sorting by time to prevent temporal leakage...")
    # IEEE-CIS dataset uses TransactionDT
    df = df.sort_values(TIME_COL).reset_index(drop=True)
    
    n_total = len(df)
    n_train = int(n_total * 0.8)
    n_val = int(n_total * 0.1)
    
    train_df = df.iloc[:n_train]
    val_df = df.iloc[n_train:n_train+n_val]
    test_df = df.iloc[n_train+n_val:]
    
    print(f"Train split: {len(train_df)} rows")
    print(f"Validation split: {len(val_df)} rows")
    print(f"Test split: {len(test_df)} rows")
    
    y_train = train_df[TARGET_COL]
    y_val = val_df[TARGET_COL]
    y_test = test_df[TARGET_COL]
    
    X_train = train_df.drop(columns=[TARGET_COL, JOIN_KEY])
    X_val = val_df.drop(columns=[TARGET_COL, JOIN_KEY])
    X_test = test_df.drop(columns=[TARGET_COL, JOIN_KEY])
    
    # 3. Preprocessing (Fit on Train only)
    print("Building and fitting preprocessing pipeline on training data...")
    pipeline, final_num, final_cat = build_preprocessing_pipeline()
    
    X_train_proc = pipeline.fit_transform(X_train)
    X_val_proc = pipeline.transform(X_val)
    X_test_proc = pipeline.transform(X_test)
    
    # Save preprocessing artifact
    preprocessor_path = os.path.join(artifact_dir, "preprocessing_pipeline.joblib")
    joblib.dump(pipeline, preprocessor_path)
    print(f"Saved preprocessing pipeline to {preprocessor_path}")
    
    # 4. Class Imbalance
    num_positive = y_train.sum()
    num_negative = len(y_train) - num_positive
    imbalance_ratio = num_negative / num_positive if num_positive > 0 else 1.0
    print(f"Training Class Imbalance Ratio (Neg/Pos): {imbalance_ratio:.2f}")
    
    # 5. Train XGBoost
    print("Training XGBoost Classifier...")
    model = XGBClassifier(
        n_estimators=300,
        learning_rate=0.05,
        max_depth=6,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=imbalance_ratio,
        objective='binary:logistic',
        eval_metric='aucpr',
        early_stopping_rounds=10,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(
        X_train_proc, y_train,
        eval_set=[(X_val_proc, y_val)],
        verbose=10
    )
    
    # Save Model
    model_path = os.path.join(artifact_dir, "xgboost_fraud_model.json")
    model.save_model(model_path)
    print(f"Saved XGBoost model to {model_path}")
    
    # 6. Evaluation
    print("Evaluating on Test Set...")
    y_pred = model.predict(X_test_proc)
    y_prob = model.predict_proba(X_test_proc)[:, 1]
    
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, y_prob)
    pr_auc = average_precision_score(y_test, y_prob)
    
    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = cm.ravel()
    
    metrics = {
        "precision": float(precision),
        "recall": float(recall),
        "f1": float(f1),
        "roc_auc": float(roc_auc),
        "pr_auc": float(pr_auc),
        "true_negatives": int(tn),
        "false_positives": int(fp),
        "false_negatives": int(fn),
        "true_positives": int(tp),
        "total_test_samples": len(y_test)
    }
    
    print("\n--- TEST METRICS ---")
    for k, v in metrics.items():
        print(f"{k}: {v}")
        
    # Write to a JSON file so we can easily generate the markdown report
    metrics_path = os.path.join(os.path.dirname(__file__), "eval_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=4)
        
    print("\nTraining completed successfully!")

if __name__ == "__main__":
    train_and_evaluate()
