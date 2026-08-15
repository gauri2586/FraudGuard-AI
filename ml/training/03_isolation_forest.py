import os
import json
import joblib
import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import IsolationForest
from sklearn.metrics import classification_report, confusion_matrix

"""
=============================================================================
FRAUDGUARD AI: ISOLATION FOREST EXPLAINER
=============================================================================

1. What does an Isolation Forest do?
   Unlike XGBoost (which learns boundaries between "normal" and "fraud" based 
   on labels), an Isolation Forest ignores labels entirely. It builds a forest 
   of random decision trees. It randomly selects a feature and randomly selects 
   a split value. Because anomalies (outliers) are "few and different", they 
   get isolated much closer to the root of the tree. The shorter the path to 
   isolate a data point, the more anomalous it is.

2. Why is it useful for fraud detection?
   Fraudsters constantly invent new tactics (Zero-Day Fraud) that have never 
   been seen in historical data. XGBoost cannot catch what it hasn't been trained 
   on. Isolation Forests excel at catching these novel attacks because they just 
   look for "weirdness" (deviations from the norm).

3. How is contamination selected?
   'Contamination' is a hyperparameter that tells the model what percentage of 
   the dataset we expect to be anomalies. In banking, this is usually set very 
   low (e.g., 1% to 5%). We set it to 0.02 (2%) as a conservative estimate to 
   avoid too many false alarms.

4. How is the anomaly score normalized?
   By default, sklearn's IsolationForest `decision_function` returns values where 
   negative numbers are anomalies and positive numbers are normal. We normalize 
   this mathematically to a 0-100 scale, where 100 means "Highly Anomalous".

LIMITATIONS & DISCLAIMERS:
- Anomaly != Fraud: Just because a transaction is weird (e.g., buying a $10,000 
  watch at 3 AM) does not mean it is fraud. The user might just be wealthy and 
  awake. This model flags things for review, but cannot confirm criminal intent.
- Curse of Dimensionality: If you feed an Isolation Forest too many irrelevant 
  features, true anomalies get hidden in the noise.
=============================================================================
"""

def create_preprocessor():
    numeric_features = ['amount', 'hour_of_day', 'day_of_week']
    categorical_features = ['merchant_category', 'device_type']
    
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])

    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='constant', fill_value='Unknown')),
        ('onehot', OneHotEncoder(handle_unknown='ignore'))
    ])

    return ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_features),
            ('cat', categorical_transformer, categorical_features)
        ])

def feature_engineering(df):
    df['hour_of_day'] = df['timestamp'].dt.hour
    df['day_of_week'] = df['timestamp'].dt.dayofweek
    return df

def train_isolation_forest():
    print("\n=== FraudGuard AI: Isolation Forest (Unsupervised) ===")
    
    data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'raw', 'transactions.csv')
    df = pd.read_csv(data_path)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    df = feature_engineering(df)
    
    # We drop the 'is_fraud' label for training, because this is UNSUPERVISED!
    X = df.drop(columns=['transaction_id', 'user_id', 'timestamp', 'is_fraud'])
    y = df['is_fraud'] # We only keep this to evaluate how anomalies map to fraud later.
    
    # We still split to evaluate properly
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    preprocessor = create_preprocessor()
    X_train_processed = preprocessor.fit_transform(X_train)
    X_test_processed = preprocessor.transform(X_test)
    
    # Train the Model
    # Contamination=0.02 means we expect about 2% of transactions to be anomalies
    print("Training Isolation Forest... (Contamination = 2%)")
    iso_forest = IsolationForest(
        n_estimators=100, 
        max_samples='auto', 
        contamination=0.02, 
        random_state=42
    )
    
    iso_forest.fit(X_train_processed)
    
    # Evaluate on Test Set
    # predict() returns 1 for inliers (normal) and -1 for outliers (anomalies)
    preds = iso_forest.predict(X_test_processed)
    
    # Map predictions to match our labels: 
    # Normal (1) -> 0, Anomaly (-1) -> 1
    anomaly_flags = [1 if x == -1 else 0 for x in preds]
    
    print("\n=== Evaluation (Anomaly vs Actual Fraud) ===")
    print("WARNING: Anomalies do not automatically mean fraud. This evaluation just checks overlap.")
    print("Confusion Matrix:")
    cm = confusion_matrix(y_test, anomaly_flags)
    print(f"True Negatives:  {cm[0][0]} | False Positives (Weird but not fraud): {cm[0][1]}")
    print(f"False Negatives: {cm[1][0]}  | True Positives (Weird AND fraud):    {cm[1][1]}")
    
    print("\nClassification Report:")
    print(classification_report(y_test, anomaly_flags))
    
    # Save artifacts
    models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models')
    os.makedirs(models_dir, exist_ok=True)
    
    joblib.dump(iso_forest, os.path.join(models_dir, 'isolation_forest.pkl'))
    joblib.dump(preprocessor, os.path.join(models_dir, 'iso_preprocessor.pkl'))
    print("Model and preprocessor saved successfully.")
    
    return iso_forest, preprocessor


def get_normalized_score(model, X_processed):
    """
    Normalizes the raw decision_function output to a 0-100 anomaly score.
    Raw scores: Negative means anomaly, positive means normal.
    We invert and scale it so 100 = max anomaly.
    """
    raw_scores = model.decision_function(X_processed)
    
    # Invert so higher = more anomalous
    inverted_scores = -raw_scores 
    
    # Sklearn's raw scores usually fall between -0.5 and 0.5. 
    # We clip to standard ranges and scale to 0-100
    # min_val and max_val are approximations for standard IsolationForest outputs
    min_val = -0.3
    max_val = 0.3
    
    clipped = np.clip(inverted_scores, min_val, max_val)
    normalized = ((clipped - min_val) / (max_val - min_val)) * 100
    
    return normalized


def detect_anomaly(transaction_dict, model_path=None, preprocessor_path=None):
    """
    Takes a single transaction dictionary and predicts its anomaly score.
    """
    if model_path is None or preprocessor_path is None:
        models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models')
        model_path = os.path.join(models_dir, 'isolation_forest.pkl')
        preprocessor_path = os.path.join(models_dir, 'iso_preprocessor.pkl')
        
    try:
        model = joblib.load(model_path)
        preprocessor = joblib.load(preprocessor_path)
    except Exception as e:
        print(f"Error loading model: {e}")
        return None
        
    df = pd.DataFrame([transaction_dict])
    
    if 'timestamp' in df.columns:
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = feature_engineering(df)
        df = df.drop(columns=['timestamp'])
        
    for col in ['transaction_id', 'user_id']:
        if col in df.columns:
            df = df.drop(columns=[col])
            
    X_processed = preprocessor.transform(df)
    
    # 1 for normal, -1 for anomaly
    raw_pred = model.predict(X_processed)[0]
    is_anomaly = True if raw_pred == -1 else False
    
    # Calculate 0-100 score
    score = float(get_normalized_score(model, X_processed)[0])
    
    explanation = "Transaction exhibits statistical deviation from historical norms." if is_anomaly else "Transaction aligns with normal baseline."
    
    return {
        "anomaly_score": round(score, 2),
        "anomaly_flag": is_anomaly,
        "explanation": explanation
    }

if __name__ == "__main__":
    train_isolation_forest()
    
    print("\n=== Testing Anomaly Detection Function ===")
    mock_transaction = {
        "transaction_id": "TX-TEST-002",
        "user_id": "USR-1111",
        "timestamp": "2023-11-01 14:00:00", 
        "amount": 95000.00,                  # Extremely high, distinct anomaly
        "merchant_category": "Gaming",       
        "device_type": "API"                 
    }
    
    print("Input Transaction:")
    print(json.dumps(mock_transaction, indent=2))
    
    result = detect_anomaly(mock_transaction)
    print("\nAnomaly Detection Result:")
    print(json.dumps(result, indent=2))
