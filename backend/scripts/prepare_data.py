import os
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split

import sys
# Add backend to path to allow importing ml package
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from ml.preprocessing import build_preprocessing_pipeline
from ml.feature_config import JOIN_KEY, TARGET_COL, TIME_COL

def prepare_data(data_dir, output_dir, test_size=0.2, random_state=42):
    """
    Loads raw data, joins it, applies preprocessing, 
    splits into train/val sets, and saves the artifacts.
    """
    os.makedirs(output_dir, exist_ok=True)
    
    tx_path = os.path.join(data_dir, "raw", "train_transaction.csv.zip")
    id_path = os.path.join(data_dir, "raw", "train_identity.csv.zip")
    
    print("Loading Transaction data...")
    tx_df = pd.read_csv(tx_path, compression='zip')
    
    print("Loading Identity data...")
    id_df = pd.read_csv(id_path, compression='zip')
    
    print("Merging datasets on", JOIN_KEY, "...")
    # LEFT JOIN on TransactionID to keep all transactions
    df = tx_df.merge(id_df, on=JOIN_KEY, how='left')
    
    # Sort by TIME_COL to prevent time-leakage in our split
    print("Sorting by", TIME_COL, "to prevent time leakage...")
    df = df.sort_values(TIME_COL).reset_index(drop=True)
    
    print("Separating Features (X) and Target (y)...")
    y = df[TARGET_COL]
    # We drop TARGET_COL to prevent leakage. JOIN_KEY can also be dropped here 
    # but the pipeline will ignore unconfigured columns anyway.
    X = df.drop(columns=[TARGET_COL])
    
    print("Splitting into Train and Validation sets (time-based split)...")
    # shuffle=False ensures we train on the past and validate on the future
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=test_size, shuffle=False, random_state=random_state
    )
    
    print(f"Train size: {len(X_train)} | Val size: {len(X_val)}")
    
    print("Building Preprocessing Pipeline...")
    pipeline, num_cols, cat_cols = build_preprocessing_pipeline()
    
    print("Fitting and Transforming Train set...")
    X_train_processed = pipeline.fit_transform(X_train)
    
    print("Transforming Validation set...")
    X_val_processed = pipeline.transform(X_val)
    
    # Save the fitted pipeline
    artifact_path = os.path.join(output_dir, "preprocessing_pipeline.joblib")
    joblib.dump(pipeline, artifact_path)
    print(f"Saved preprocessor to {artifact_path}")
    
    # Save processed numpy arrays to disk for quick loading by models
    print("Saving processed data arrays...")
    joblib.dump(X_train_processed, os.path.join(output_dir, "X_train.joblib"))
    joblib.dump(X_val_processed, os.path.join(output_dir, "X_val.joblib"))
    joblib.dump(y_train.values, os.path.join(output_dir, "y_train.joblib"))
    joblib.dump(y_val.values, os.path.join(output_dir, "y_val.joblib"))
    
    print("Data Preparation Complete!")

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(__file__))
    data_dir = os.path.join(base_dir, "data")
    output_dir = os.path.join(base_dir, "ml", "artifacts")
    
    prepare_data(data_dir, output_dir)
