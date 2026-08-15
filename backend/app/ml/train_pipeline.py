import os
import zipfile
import pandas as pd
import numpy as np
import joblib
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix

try:
    from xgboost import XGBClassifier
    HAS_XGB = True
except ImportError:
    HAS_XGB = False
    print("XGBoost not installed. Skipping XGBoost model.")

# ==========================================
# 1. Configuration
# ==========================================
BASE_DIR = Path(__file__).resolve().parent.parent.parent
RAW_DATA_DIR = BASE_DIR / "data" / "raw"
MODELS_DIR = Path(__file__).resolve().parent / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

SUBSAMPLE_FRAC = 0.20  # Use 20% of data to speed up execution for student project
RANDOM_STATE = 42

def load_and_merge_data():
    """Loads transaction and identity data and merges them."""
    print("Loading datasets...")
    # Read compressed CSVs
    trans_df = pd.read_csv(RAW_DATA_DIR / "train_transaction.csv.zip", compression="zip")
    id_df = pd.read_csv(RAW_DATA_DIR / "train_identity.csv.zip", compression="zip")

    print(f"Loaded Transaction shape: {trans_df.shape}")
    print(f"Loaded Identity shape: {id_df.shape}")

    # Left join on TransactionID
    df = pd.merge(trans_df, id_df, on='TransactionID', how='left')
    print(f"Merged Dataset shape: {df.shape}")
    return df

def preprocess_and_split(df):
    """Handles missing values, drops useless columns, splits target."""
    print("Preprocessing data...")
    
    # 1. Drop Data Leakage / Useless columns
    drop_cols = ['TransactionID', 'TransactionDT']
    
    # Also drop columns with > 80% missing values to save memory
    missing_pct = df.isnull().mean()
    high_missing = missing_pct[missing_pct > 0.8].index.tolist()
    drop_cols.extend(high_missing)
    
    df = df.drop(columns=drop_cols, errors='ignore')
    
    # 2. Subsample to save RAM and time
    print(f"Subsampling {SUBSAMPLE_FRAC*100}% of data to speed up execution...")
    # Stratified subsampling to preserve the 3.5% fraud distribution
    _, df = train_test_split(df, test_size=SUBSAMPLE_FRAC, random_state=RANDOM_STATE, stratify=df['isFraud'])
    
    # 3. Split features and target
    y = df['isFraud']
    X = df.drop(columns=['isFraud'])
    
    # Identify numerical and categorical columns for the pipeline
    numeric_features = X.select_dtypes(include=['int64', 'float64']).columns.tolist()
    categorical_features = X.select_dtypes(include=['object', 'category']).columns.tolist()
    
    # 4. Train/Test Split (80/20)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y)
    
    return X_train, X_test, y_train, y_test, numeric_features, categorical_features

def build_preprocessor(numeric_features, categorical_features):
    """Builds the Scikit-Learn ColumnTransformer for imputation and encoding."""
    # Numerical pipeline: Impute missing with median, then scale
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])

    # Categorical pipeline: Impute missing with 'missing', then OneHotEncode
    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
        ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_features),
            ('cat', categorical_transformer, categorical_features)
        ])
    
    return preprocessor

def evaluate_model(name, y_true, y_pred, y_prob):
    """Calculates and prints evaluation metrics."""
    acc = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred, zero_division=0)
    rec = recall_score(y_true, y_pred)
    f1 = f1_score(y_true, y_pred)
    auc = roc_auc_score(y_true, y_prob)
    cm = confusion_matrix(y_true, y_pred)
    
    print(f"\n--- {name} ---")
    print(f"Accuracy:  {acc:.4f}")
    print(f"Precision: {prec:.4f}")
    print(f"Recall:    {rec:.4f}")
    print(f"F1-Score:  {f1:.4f}")
    print(f"ROC-AUC:   {auc:.4f}")
    print(f"Confusion Matrix:\n{cm}")
    
    return {"name": name, "f1": f1, "recall": rec, "metrics": (acc, prec, rec, f1, auc), "cm": cm}

def main():
    print("=== FraudGuard AI Machine Learning Pipeline ===")
    
    # 1. Load Data
    df = load_and_merge_data()
    
    # 2. Preprocess & Split
    X_train, X_test, y_train, y_test, num_cols, cat_cols = preprocess_and_split(df)
    print(f"Training Set: {X_train.shape[0]} rows | Test Set: {X_test.shape[0]} rows")
    
    # 3. Build Preprocessor
    print("\nFitting preprocessor...")
    preprocessor = build_preprocessor(num_cols, cat_cols)
    X_train_processed = preprocessor.fit_transform(X_train)
    X_test_processed = preprocessor.transform(X_test)
    
    # Save preprocessor immediately so inference API can use it
    joblib.dump(preprocessor, MODELS_DIR / "preprocessor.joblib")
    
    models = []
    
    # 4. Train Logistic Regression
    print("\nTraining Logistic Regression (class_weight='balanced')...")
    lr = LogisticRegression(class_weight='balanced', max_iter=500, random_state=RANDOM_STATE)
    lr.fit(X_train_processed, y_train)
    y_pred_lr = lr.predict(X_test_processed)
    y_prob_lr = lr.predict_proba(X_test_processed)[:, 1]
    models.append((lr, evaluate_model("Logistic Regression", y_test, y_pred_lr, y_prob_lr)))

    # 5. Train Random Forest
    print("\nTraining Random Forest (class_weight='balanced')...")
    rf = RandomForestClassifier(n_estimators=50, max_depth=10, class_weight='balanced', random_state=RANDOM_STATE, n_jobs=-1)
    rf.fit(X_train_processed, y_train)
    y_pred_rf = rf.predict(X_test_processed)
    y_prob_rf = rf.predict_proba(X_test_processed)[:, 1]
    models.append((rf, evaluate_model("Random Forest", y_test, y_pred_rf, y_prob_rf)))

    # 6. Train XGBoost (If available)
    if HAS_XGB:
        print("\nTraining XGBoost (scale_pos_weight)...")
        # Calculate scale_pos_weight: count(negative) / count(positive)
        neg = (y_train == 0).sum()
        pos = (y_train == 1).sum()
        spw = neg / pos if pos > 0 else 1
        
        xgb = XGBClassifier(n_estimators=100, max_depth=6, scale_pos_weight=spw, random_state=RANDOM_STATE, n_jobs=-1, eval_metric='logloss')
        xgb.fit(X_train_processed, y_train)
        y_pred_xgb = xgb.predict(X_test_processed)
        y_prob_xgb = xgb.predict_proba(X_test_processed)[:, 1]
        models.append((xgb, evaluate_model("XGBoost", y_test, y_pred_xgb, y_prob_xgb)))

    # 7. Select Best Model based on F1 Score
    best_model_tuple = max(models, key=lambda item: item[1]['f1'])
    best_model_obj = best_model_tuple[0]
    best_model_stats = best_model_tuple[1]
    
    print(f"\n==============================================")
    print(f"BEST MODEL SELECTED: {best_model_stats['name']}")
    print(f"Winning F1-Score: {best_model_stats['f1']:.4f}")
    print(f"==============================================")
    
    # 8. Save the best model
    model_path = MODELS_DIR / "best_fraud_model.joblib"
    joblib.dump(best_model_obj, model_path)
    print(f"\nSaved best model to: {model_path}")
    print(f"Saved preprocessor to: {MODELS_DIR / 'preprocessor.joblib'}")
    
    # Save a text report
    with open(MODELS_DIR / "evaluation_report.txt", "w") as f:
        f.write(f"Best Model: {best_model_stats['name']}\n")
        f.write(f"F1-Score: {best_model_stats['f1']:.4f}\n")
        f.write(f"Recall: {best_model_stats['recall']:.4f}\n")
        f.write(f"Confusion Matrix:\n{best_model_stats['cm']}\n")

if __name__ == "__main__":
    main()
