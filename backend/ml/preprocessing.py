import os
import pandas as pd
import numpy as np
import joblib
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OrdinalEncoder

# Import configuration
try:
    from backend.ml.feature_config import (
        JOIN_KEY, TARGET_COL, TIME_COL, 
        NUMERICAL_COLS, CATEGORICAL_COLS, 
        ENGINEERED_NUMERICAL_COLS, ENGINEERED_CATEGORICAL_COLS
    )
except ImportError:
    from feature_config import (
        JOIN_KEY, TARGET_COL, TIME_COL, 
        NUMERICAL_COLS, CATEGORICAL_COLS, 
        ENGINEERED_NUMERICAL_COLS, ENGINEERED_CATEGORICAL_COLS
    )

class FeatureEngineer(BaseEstimator, TransformerMixin):
    """
    Custom Scikit-Learn Transformer for Engineering Features.
    This ensures transformations applied during training are identically 
    applied during inference, preventing data leakage.
    """
    def fit(self, X, y=None):
        return self
        
    def transform(self, X):
        X_out = X.copy()
        
        # 1. Transaction Amount Log
        if 'TransactionAmt' in X_out.columns:
            X_out['TransactionAmt_Log'] = np.log1p(X_out['TransactionAmt'].fillna(0))
            
        # 2. Time-based features
        if TIME_COL in X_out.columns:
            # Assuming TransactionDT is timedelta in seconds from a reference date
            # 86400 seconds in a day, 3600 in an hour
            X_out['hour_of_day'] = (X_out[TIME_COL] // 3600) % 24
            X_out['day_of_week'] = (X_out[TIME_COL] // 86400) % 7
            X_out.drop(columns=[TIME_COL], inplace=True)
            
        # 3. Email Match Indicator
        if 'P_emaildomain' in X_out.columns and 'R_emaildomain' in X_out.columns:
            # Create a string representation to safely compare NaNs
            p_email = X_out['P_emaildomain'].astype(str).fillna('missing')
            r_email = X_out['R_emaildomain'].astype(str).fillna('missing')
            X_out['email_match'] = (p_email == r_email).astype(int)
            
        # 4. Cast categorical columns to string to avoid mixed types in OrdinalEncoder
        for col in CATEGORICAL_COLS:
            if col in X_out.columns:
                # astype(str) converts np.nan to 'nan', which is fine as a category, 
                # but we can explicitly fillna to 'Missing' here
                X_out[col] = X_out[col].fillna('Missing').astype(str)
                
        return X_out

def build_preprocessing_pipeline():
    """
    Builds the production scikit-learn preprocessing pipeline.
    """
    # Define columns expected after FeatureEngineer runs
    final_num_cols = NUMERICAL_COLS + ENGINEERED_NUMERICAL_COLS
    final_cat_cols = CATEGORICAL_COLS + ENGINEERED_CATEGORICAL_COLS
    
    # Numerical Pipeline: Median Imputation -> Standard Scaling
    num_pipeline = Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())  # Standard scaling required for Isolation Forest/Autoencoders
    ])
    
    # Categorical Pipeline: Constant Imputation -> Ordinal Encoding
    # We use Ordinal Encoding over One-Hot to handle high cardinality safely.
    # handle_unknown='use_encoded_value' ensures inference doesn't crash on unseen categories
    cat_pipeline = Pipeline([
        ('imputer', SimpleImputer(strategy='constant', fill_value='Missing')),
        ('encoder', OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1))
    ])
    
    # Combine using ColumnTransformer
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', num_pipeline, final_num_cols),
            ('cat', cat_pipeline, final_cat_cols)
        ],
        remainder='drop'  # Drop any columns not explicitly defined in config
    )
    
    # Full Pipeline: Feature Engineering -> Imputation & Encoding
    full_pipeline = Pipeline([
        ('feature_engineer', FeatureEngineer()),
        ('preprocessor', preprocessor)
    ])
    
    return full_pipeline, final_num_cols, final_cat_cols

def load_and_merge_data(data_dir, subset_n=None):
    """
    Loads and merges the raw datasets. 
    Allows loading a subset for testing the pipeline locally.
    """
    tx_path = os.path.join(data_dir, "raw", "train_transaction.csv.zip")
    id_path = os.path.join(data_dir, "raw", "train_identity.csv.zip")
    
    print("Loading Transaction data...")
    tx_df = pd.read_csv(tx_path, compression='zip', nrows=subset_n)
    
    print("Loading Identity data...")
    id_df = pd.read_csv(id_path, compression='zip', nrows=subset_n)
    
    print("Merging datasets...")
    # LEFT JOIN on TransactionID to keep all transactions
    df = tx_df.merge(id_df, on=JOIN_KEY, how='left')
    
    return df

def test_pipeline():
    """
    Tests the pipeline on a small subset of the data.
    """
    import warnings
    warnings.filterwarnings('ignore')
    
    data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    artifact_dir = os.path.join(os.path.dirname(__file__), "artifacts")
    
    print("--- PIPELINE TEST START ---")
    df = load_and_merge_data(data_dir, subset_n=5000)
    
    # Ensure config columns actually exist in df (some might be missing if we used a subset or different version)
    global NUMERICAL_COLS, CATEGORICAL_COLS
    NUMERICAL_COLS = [c for c in NUMERICAL_COLS if c in df.columns]
    CATEGORICAL_COLS = [c for c in CATEGORICAL_COLS if c in df.columns]
    
    # Separate Target
    y = df[TARGET_COL]
    X = df.drop(columns=[TARGET_COL, JOIN_KEY])
    
    print("\nBuilding Pipeline...")
    pipeline, final_num, final_cat = build_preprocessing_pipeline()
    
    print("Fitting and Transforming Data (Simulating Training)...")
    X_processed = pipeline.fit_transform(X)
    
    # Validate dimensions
    expected_cols = len(final_num) + len(final_cat)
    print(f"Processed Shape: {X_processed.shape}")
    print(f"Expected Columns: {expected_cols}")
    assert X_processed.shape[1] == expected_cols, "Column mismatch!"
    
    # Validate NaN handling
    assert not np.isnan(X_processed).any(), "NaN values found in processed data!"
    
    print("\nSaving Pipeline Artifact...")
    artifact_path = os.path.join(artifact_dir, "preprocessing_pipeline.joblib")
    joblib.dump(pipeline, artifact_path)
    print(f"Pipeline saved to {artifact_path}")
    
    print("--- PIPELINE TEST SUCCESS ---")

if __name__ == "__main__":
    test_pipeline()
