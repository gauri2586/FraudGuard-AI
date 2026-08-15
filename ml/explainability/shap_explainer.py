import os
import json
import joblib
import pandas as pd
import numpy as np
import shap
import xgboost as xgb

# Add ml_dir to path so we can use the feature engineering function
import sys
ml_dir = os.path.dirname(os.path.dirname(__file__))
sys.path.append(ml_dir)
import importlib
xgb_module = importlib.import_module("training.02_xgboost_pipeline")
feature_engineering = xgb_module.feature_engineering

"""
=============================================================================
FRAUDGUARD AI: EXPLAINABLE AI (SHAP)
=============================================================================

1. What is SHAP?
   Machine Learning models like XGBoost are often called "Black Boxes" because 
   it's hard to understand *why* they make a specific decision. SHAP (SHapley 
   Additive exPlanations) is a technique borrowed from cooperative game theory 
   that solves this.

2. How does SHAP work in simple language?
   Imagine the XGBoost model is a group of players (features like Amount, Device, 
   Time) working together to win a game (predicting if a transaction is fraud). 
   
   SHAP calculates exactly how much "credit" or "blame" each player deserves for 
   the final score. It does this by asking: "What would the fraud probability be 
   if we completely removed the 'Amount' feature from the equation?" 

3. Interpreting SHAP Values:
   - A POSITIVE SHAP value pushes the probability towards FRAUD (Increases Risk).
   - A NEGATIVE SHAP value pushes the probability towards NORMAL (Reduces Risk).
   - The LARGER the absolute number, the more INFLUENTIAL that feature was.
=============================================================================
"""

def get_pipeline_feature_names(preprocessor):
    """
    Extracts the final feature names from a Scikit-Learn ColumnTransformer pipeline.
    This is necessary because OneHotEncoding transforms a single column (e.g. 'device_type')
    into multiple columns (e.g. 'device_type_API', 'device_type_Mobile').
    We need these exact names to map the SHAP values back to human-readable concepts!
    """
    feature_names = []
    
    for name, transformer, features in preprocessor.transformers_:
        if name == 'remainder' and transformer == 'drop':
            continue
            
        if name == 'num':
            # Numeric features stay the same
            feature_names.extend(features)
        elif name == 'cat':
            # We must ask the OneHotEncoder what columns it generated
            ohe = transformer.named_steps['onehot']
            cat_features = ohe.get_feature_names_out(features)
            feature_names.extend(cat_features)
            
    return feature_names

def map_feature_to_human_readable(feature_name, direction):
    """
    Maps an exact, machine-level feature name to a clean, human-readable 
    sentence explaining its impact.
    """
    # 1. Base human concept
    concept = feature_name
    if feature_name == 'amount':
        concept = "transaction amount"
    elif feature_name == 'hour_of_day':
        concept = "time of day"
    elif feature_name == 'day_of_week':
        concept = "day of the week"
    elif feature_name.startswith('device_type_'):
        device = feature_name.replace('device_type_', '')
        concept = f"use of a {device} device"
    elif feature_name.startswith('merchant_category_'):
        merchant = feature_name.replace('merchant_category_', '')
        concept = f"{merchant} merchant category"
        
    # 2. Add directional explanation
    if direction == "strongly increases risk":
        return f"The {concept} strongly flagged this as fraudulent."
    elif direction == "increases risk":
        return f"The {concept} is slightly suspicious, increasing risk."
    elif direction == "strongly reduces risk":
        return f"The {concept} heavily indicates this is a normal transaction."
    elif direction == "reduces risk":
        return f"The {concept} lowers the fraud risk."
    else:
        return f"The {concept} had a neutral impact."

def explain_transaction(transaction_dict, model_path=None, preprocessor_path=None):
    """
    Analyzes a transaction using SHAP and returns exactly what features 
    drove the XGBoost model to its decision.
    """
    # 1. Load Artifacts
    if model_path is None or preprocessor_path is None:
        models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models')
        model_path = os.path.join(models_dir, 'xgboost_fraud_model.json')
        preprocessor_path = os.path.join(models_dir, 'preprocessor.pkl')
        
    try:
        model = xgb.XGBClassifier()
        model.load_model(model_path)
        preprocessor = joblib.load(preprocessor_path)
    except Exception as e:
        print(f"Error loading models: {e}. Ensure you ran 02_xgboost_pipeline.py")
        return None

    # 2. Prepare Data (Must match exactly what XGBoost saw during training)
    df = pd.DataFrame([transaction_dict])
    if 'timestamp' in df.columns:
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = feature_engineering(df)
        df = df.drop(columns=['timestamp'])
        
    for col in ['transaction_id', 'user_id']:
        if col in df.columns:
            df = df.drop(columns=[col])
            
    # Transform
    X_processed = preprocessor.transform(df)
    feature_names = get_pipeline_feature_names(preprocessor)
    
    # 3. Initialize SHAP Explainer
    # TreeExplainer is highly optimized for XGBoost and Random Forests
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_processed)
    
    # Because we only passed 1 transaction, we only want the first row of SHAP values
    transaction_shap_values = shap_values[0]
    
    # 4. Map SHAP values to Feature Names and sort by absolute magnitude
    feature_impacts = []
    
    for i in range(len(feature_names)):
        feat_name = feature_names[i]
        shap_val = float(transaction_shap_values[i])
        
        # We don't care about features that had almost zero impact
        if abs(shap_val) < 0.05:
            continue
            
        feature_impacts.append({
            "feature": feat_name,
            "shap_value": shap_val,
            "absolute_impact": abs(shap_val)
        })
        
    # Sort descending by absolute impact (Most important features first)
    feature_impacts.sort(key=lambda x: x["absolute_impact"], reverse=True)
    
    # 5. Format Structured Output
    structured_explanations = []
    human_sentences = []
    
    for impact in feature_impacts:
        val = impact["shap_value"]
        
        # Determine Direction
        if val > 1.0:
            direction = "strongly increases risk"
        elif val > 0:
            direction = "increases risk"
        elif val < -1.0:
            direction = "strongly reduces risk"
        else:
            direction = "reduces risk"
            
        # Get human readable sentence
        human_readable = map_feature_to_human_readable(impact["feature"], direction)
        
        structured_explanations.append({
            "feature": impact["feature"],
            "contribution": round(val, 4),
            "direction": direction,
            "human_readable_explanation": human_readable
        })
        
        human_sentences.append(human_readable)

    # Combine the top sentences into a cohesive paragraph summary
    if len(human_sentences) > 0:
        overall_summary = " ".join(human_sentences[:3]) # Take the top 3 most important
    else:
        overall_summary = "No single feature strongly influenced this decision."

    return {
        "transaction_id": transaction_dict.get("transaction_id", "UNKNOWN"),
        "top_influencing_features": structured_explanations,
        "human_readable_summary": overall_summary
    }


if __name__ == "__main__":
    print("=== FraudGuard AI: SHAP Explainability Engine ===")
    
    # Let's test it on a highly suspicious transaction
    mock_fraud_tx = {
        "transaction_id": "TX-SHAP-001",
        "user_id": "USR-9999",
        "timestamp": "2023-11-01 04:00:00", # 4 AM
        "amount": 8500.00,                   # Huge amount
        "merchant_category": "Crypto",       # Risky
        "device_type": "API"                 # Unusual
    }
    
    print("\nInput Suspicious Transaction:")
    print(json.dumps(mock_fraud_tx, indent=2))
    
    print("\nExtracting AI Decision Logic using SHAP...")
    explanation = explain_transaction(mock_fraud_tx)
    
    print("\nSHAP Explanation Result:")
    print(json.dumps(explanation, indent=2))
