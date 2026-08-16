import os
import pandas as pd
import numpy as np
import joblib
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import RobustScaler, OrdinalEncoder

# Import configuration
from ml.feature_config import (
    JOIN_KEY, TARGET_COL, TIME_COL, 
    NUMERICAL_COLS, CATEGORICAL_COLS, 
    ENGINEERED_NUMERICAL_COLS, ENGINEERED_CATEGORICAL_COLS
)

class MemoryReducer(BaseEstimator, TransformerMixin):
    """
    Safely downcasts numeric features to float32 to reduce memory footprint
    during training and inference.
    """
    def fit(self, X, y=None):
        return self
        
    def transform(self, X):
        X_out = X.copy()
        for col in X_out.columns:
            if pd.api.types.is_numeric_dtype(X_out[col]):
                # Downcast to float32 for model safety and memory
                X_out[col] = X_out[col].astype(np.float32)
        return X_out

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
        
        # 1. Transaction Amount Log (Handle extreme values gently)
        if 'TransactionAmt' in X_out.columns:
            X_out['TransactionAmt_Log'] = np.log1p(X_out['TransactionAmt'].fillna(0))
            
        # 2. Time-based features
        if TIME_COL in X_out.columns:
            X_out['hour_of_day'] = (X_out[TIME_COL] // 3600) % 24
            X_out['day_of_week'] = (X_out[TIME_COL] // 86400) % 7
            X_out.drop(columns=[TIME_COL], inplace=True)
            
        # 3. Email Match Indicator
        if 'P_emaildomain' in X_out.columns and 'R_emaildomain' in X_out.columns:
            p_email = X_out['P_emaildomain'].astype(str).fillna('missing')
            r_email = X_out['R_emaildomain'].astype(str).fillna('missing')
            X_out['email_match'] = (p_email == r_email).astype(int)
            
        # 4. Cast categorical columns to string
        for col in CATEGORICAL_COLS:
            if col in X_out.columns:
                X_out[col] = X_out[col].fillna('Missing').astype(str)
                
        return X_out

def build_preprocessing_pipeline():
    """
    Builds the robust production scikit-learn preprocessing pipeline.
    """
    final_num_cols = NUMERICAL_COLS + ENGINEERED_NUMERICAL_COLS
    final_cat_cols = CATEGORICAL_COLS + ENGINEERED_CATEGORICAL_COLS
    
    # Numerical Pipeline: Median Imputation -> Robust Scaling (handles extreme values)
    num_pipeline = Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', RobustScaler())
    ])
    
    # Categorical Pipeline: Constant Imputation -> Ordinal Encoding
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
        remainder='drop' # Automatically drops unconfigured columns, preventing leakage
    )
    
    # Full Pipeline: Feature Engineering -> Memory Reduction -> Imputation & Encoding
    full_pipeline = Pipeline([
        ('feature_engineer', FeatureEngineer()),
        ('memory_reducer', MemoryReducer()),
        ('preprocessor', preprocessor)
    ])
    
    return full_pipeline, final_num_cols, final_cat_cols
