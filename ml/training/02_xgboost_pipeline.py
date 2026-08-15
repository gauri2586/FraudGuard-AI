import os
import json
import joblib
import pandas as pd
import numpy as np

# Scikit-learn for preprocessing and evaluation
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.metrics import (
    precision_score, recall_score, f1_score, 
    roc_auc_score, average_precision_score, 
    confusion_matrix
)

# XGBoost for advanced classification
import xgboost as xgb

def create_advanced_preprocessor():
    """
    Creates a Scikit-Learn preprocessing pipeline.
    This prepares raw data for the XGBoost model.
    """
    # Define which columns are which
    numeric_features = ['amount', 'hour_of_day', 'day_of_week']
    categorical_features = ['merchant_category', 'device_type']
    
    # Pipeline for numbers: Fill missing with median, then scale
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])

    # Pipeline for categories: Fill missing with "Unknown", then One-Hot Encode
    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='constant', fill_value='Unknown')),
        ('onehot', OneHotEncoder(handle_unknown='ignore'))
    ])

    # Combine them
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_features),
            ('cat', categorical_transformer, categorical_features)
        ])
        
    return preprocessor

def feature_engineering(df):
    """
    Extracts new useful columns (features) from existing data.
    """
    # Extract time-based features from the timestamp
    df['hour_of_day'] = df['timestamp'].dt.hour
    df['day_of_week'] = df['timestamp'].dt.dayofweek
    return df

def train_xgboost_pipeline():
    print("=== FraudGuard AI: XGBoost Pipeline ===")
    
    # 1. Load Data
    data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'raw', 'transactions.csv')
    if not os.path.exists(data_path):
        print(f"ERROR: Dataset not found at {data_path}")
        return
        
    print("Loading data...")
    df = pd.read_csv(data_path)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    # 2. Feature Engineering
    print("Performing feature engineering...")
    df = feature_engineering(df)
    
    # 3. Define Features and Target
    X = df.drop(columns=['transaction_id', 'user_id', 'timestamp', 'is_fraud'])
    y = df['is_fraud']
    
    # 4. Train / Validation / Test Separation (60% Train, 20% Val, 20% Test)
    print("Splitting data into Train, Validation, and Test sets...")
    # First split: 80% Train+Val, 20% Test
    X_temp, X_test, y_temp, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # Second split: From the 80% Temp, split into 75% Train (60% of total) and 25% Val (20% of total)
    X_train, X_val, y_train, y_val = train_test_split(X_temp, y_temp, test_size=0.25, random_state=42, stratify=y_temp)
    
    print(f"  Training samples:   {len(X_train)}")
    print(f"  Validation samples: {len(X_val)}")
    print(f"  Testing samples:    {len(X_test)}")
    
    # 5. Preprocess Data
    print("Fitting preprocessor to training data to prevent data leakage...")
    preprocessor = create_advanced_preprocessor()
    
    # We FIT the preprocessor ONLY on training data. Then we TRANSFORM all datasets.
    X_train_processed = preprocessor.fit_transform(X_train)
    X_val_processed = preprocessor.transform(X_val)
    X_test_processed = preprocessor.transform(X_test)
    
    # 6. Handle Class Imbalance appropriately for XGBoost
    # XGBoost uses `scale_pos_weight` to handle imbalance. 
    # It should be set to: (count of negative examples) / (count of positive examples)
    neg_count = (y_train == 0).sum()
    pos_count = (y_train == 1).sum()
    imbalance_ratio = neg_count / pos_count
    print(f"Calculated scale_pos_weight for XGBoost: {imbalance_ratio:.2f}")
    
    # 7. Train XGBoost Model
    print("Training XGBoost Classifier...")
    model = xgb.XGBClassifier(
        objective='binary:logistic',
        scale_pos_weight=imbalance_ratio,
        learning_rate=0.1,
        max_depth=5,
        n_estimators=100,
        random_state=42,
        eval_metric='logloss',
        # Early stopping prevents overfitting by stopping training if validation score doesn't improve
        early_stopping_rounds=10 
    )
    
    # We pass the validation set to monitor performance during training
    model.fit(
        X_train_processed, y_train,
        eval_set=[(X_val_processed, y_val)],
        verbose=False
    )
    
    # 8. Evaluation on TEST set (Unseen data)
    print("\n=== Model Evaluation (Test Set) ===")
    
    # Predict classes (0 or 1)
    y_pred = model.predict(X_test_processed)
    # Predict probabilities (0.0 to 1.0)
    y_pred_proba = model.predict_proba(X_test_processed)[:, 1]
    
    # Calculate Metrics
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    
    # ROC-AUC: Evaluates how well the model distinguishes between classes
    roc_auc = roc_auc_score(y_test, y_pred_proba)
    # PR-AUC: Precision-Recall Area Under Curve (Crucial for heavily imbalanced data)
    pr_auc = average_precision_score(y_test, y_pred_proba)
    
    # Confusion Matrix
    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = cm.ravel()
    
    # False Positive Rate (FPR) = FP / (FP + TN)
    fpr = fp / (fp + tn)
    
    print(f"Precision: {precision:.4f} (Accuracy of fraud flags)")
    print(f"Recall:    {recall:.4f} (Total fraud caught)")
    print(f"F1-Score:  {f1:.4f} (Harmonic mean)")
    print(f"ROC-AUC:   {roc_auc:.4f}")
    print(f"PR-AUC:    {pr_auc:.4f}")
    print(f"False Positive Rate (FPR): {fpr:.4f}")
    print("\nConfusion Matrix:")
    print(f"  True Negatives:  {tn} | False Positives: {fp}")
    print(f"  False Negatives: {fn}  | True Positives:  {tp}")
    
    # 9. Save Artifacts
    # We save the model AND the preprocessor so we can use them later in production
    models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models')
    os.makedirs(models_dir, exist_ok=True)
    
    model_path = os.path.join(models_dir, 'xgboost_fraud_model.json')
    preprocessor_path = os.path.join(models_dir, 'preprocessor.pkl')
    
    model.save_model(model_path)
    joblib.dump(preprocessor, preprocessor_path)
    print(f"\nModel artifacts saved to {models_dir}")
    
    return model, preprocessor


def predict_transaction(transaction_dict, model_path=None, preprocessor_path=None):
    """
    Takes a single transaction dictionary and predicts fraud probability.
    Returns fraud_probability, predicted_class, and risk_level.
    """
    if model_path is None or preprocessor_path is None:
        models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models')
        model_path = os.path.join(models_dir, 'xgboost_fraud_model.json')
        preprocessor_path = os.path.join(models_dir, 'preprocessor.pkl')
        
    # Load artifacts
    try:
        model = xgb.XGBClassifier()
        model.load_model(model_path)
        preprocessor = joblib.load(preprocessor_path)
    except Exception as e:
        print(f"Error loading model: {e}. Make sure you have trained the model first.")
        return None
        
    # Convert dict to DataFrame (required by sklearn/xgboost)
    df = pd.DataFrame([transaction_dict])
    
    # Ensure timestamp is datetime and extract features
    if 'timestamp' in df.columns:
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = feature_engineering(df)
        df = df.drop(columns=['timestamp'])
        
    # Drop IDs if they were passed
    for col in ['transaction_id', 'user_id']:
        if col in df.columns:
            df = df.drop(columns=[col])
            
    # Transform using saved preprocessor
    X_processed = preprocessor.transform(df)
    
    # Predict Probability
    prob = float(model.predict_proba(X_processed)[0][1])
    
    # Determine Class (Using standard 0.5 threshold, though this can be tuned)
    pred_class = 1 if prob >= 0.5 else 0
    
    # Determine Risk Level
    risk_score = prob * 100
    if risk_score <= 30:
        risk_level = "Low"
    elif risk_score <= 60:
        risk_level = "Medium"
    elif risk_score <= 80:
        risk_level = "High"
    else:
        risk_level = "Critical"
        
    return {
        "fraud_probability": round(prob, 4),
        "predicted_class": pred_class,
        "risk_level": risk_level
    }

if __name__ == "__main__":
    # 1. Train the model
    train_xgboost_pipeline()
    
    # 2. Test the prediction function on a mock transaction
    print("\n=== Testing Inference Function ===")
    mock_transaction = {
        "transaction_id": "TX-TEST-001",
        "user_id": "USR-9999",
        "timestamp": "2023-11-01 02:45:00", # Late night (suspicious)
        "amount": 4500.50,                   # Unusually high
        "merchant_category": "Crypto",       # High risk category
        "device_type": "API"                 # Unusual device
    }
    
    print("Input Transaction:")
    print(json.dumps(mock_transaction, indent=2))
    
    result = predict_transaction(mock_transaction)
    print("\nPrediction Result:")
    print(json.dumps(result, indent=2))
