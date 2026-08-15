import pandas as pd
import numpy as np
import os
import json

def inspect_datasets():
    print("Loading datasets...")
    # IEEE-CIS datasets are quite large.
    # Reading directly from ZIP.
    data_dir = os.path.join(os.path.dirname(__file__), "..", "data", "raw")
    
    # Check if files exist, they might be unzipped or zipped
    tx_path_zip = os.path.join(data_dir, "train_transaction.csv.zip")
    tx_path_csv = os.path.join(data_dir, "train_transaction.csv")
    id_path_zip = os.path.join(data_dir, "train_identity.csv.zip")
    id_path_csv = os.path.join(data_dir, "train_identity.csv")

    if os.path.exists(tx_path_zip):
        tx_df = pd.read_csv(tx_path_zip, compression='zip')
    else:
        tx_df = pd.read_csv(tx_path_csv)

    if os.path.exists(id_path_zip):
        id_df = pd.read_csv(id_path_zip, compression='zip')
    else:
        id_df = pd.read_csv(id_path_csv)

    print("--- DATASET INSPECTION ---")
    print(f"Transaction Shape: {tx_df.shape[0]} rows, {tx_df.shape[1]} columns")
    print(f"Identity Shape: {id_df.shape[0]} rows, {id_df.shape[1]} columns")

    # Data Types & Missing Values
    def get_summary(df):
        missing = df.isnull().sum()
        missing_pct = (missing / len(df)) * 100
        unique = df.nunique()
        types = df.dtypes
        return pd.DataFrame({
            'type': types,
            'missing': missing,
            'missing_pct': missing_pct,
            'unique': unique
        })

    tx_summary = get_summary(tx_df)
    
    numerical_cols_tx = tx_df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols_tx = tx_df.select_dtypes(exclude=[np.number]).columns.tolist()
    
    print(f"\nTransaction - Numerical Features: {len(numerical_cols_tx)}")
    print(f"Transaction - Categorical Features: {len(categorical_cols_tx)}")
    
    id_summary = get_summary(id_df)
    numerical_cols_id = id_df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols_id = id_df.select_dtypes(exclude=[np.number]).columns.tolist()
    
    print(f"Identity - Numerical Features: {len(numerical_cols_id)}")
    print(f"Identity - Categorical Features: {len(categorical_cols_id)}")

    print("\n--- TARGET DISTRIBUTION ---")
    if 'isFraud' in tx_df.columns:
        total_tx = len(tx_df)
        fraud_tx = tx_df['isFraud'].sum()
        legit_tx = total_tx - fraud_tx
        fraud_pct = (fraud_tx / total_tx) * 100
        print(f"Total Transactions: {total_tx}")
        print(f"Legitimate Transactions: {legit_tx}")
        print(f"Fraudulent Transactions: {fraud_tx}")
        print(f"Fraud Percentage: {fraud_pct:.2f}%")
        print("\nExplanation: This shows extreme class imbalance. Accuracy is insufficient for fraud detection because simply guessing 'not fraud' for every transaction would yield >96% accuracy, missing 100% of the actual fraud. We must evaluate using Precision, Recall, F1, ROC-AUC, PR-AUC, and Confusion Matrix.")

    print("\n--- DATA RELATIONSHIP ---")
    # Identify join key
    common_cols = set(tx_df.columns).intersection(set(id_df.columns))
    print(f"Common columns between datasets: {common_cols}")
    
    if 'TransactionID' in common_cols:
        join_key = 'TransactionID'
        print(f"Join key identified: {join_key}")
        
        tx_ids = set(tx_df[join_key])
        id_ids = set(id_df[join_key])
        
        tx_with_id = len(tx_ids.intersection(id_ids))
        tx_without_id = len(tx_ids) - tx_with_id
        
        print(f"Number of transaction records: {len(tx_df)}")
        print(f"Number of identity records: {len(id_df)}")
        print(f"Transactions WITH identity info: {tx_with_id}")
        print(f"Transactions WITHOUT identity info: {tx_without_id}")

    print("\n--- DATA QUALITY ---")
    high_missing_tx = tx_summary[tx_summary['missing_pct'] > 90].index.tolist()
    print(f"Columns with >90% missing values (Transaction): {len(high_missing_tx)}")
    
    constant_cols_tx = tx_summary[tx_summary['unique'] <= 1].index.tolist()
    print(f"Columns with constant values/no variance (Transaction): {constant_cols_tx}")
    
    print("\nPotential ID Columns (High uniqueness):")
    high_unique_tx = tx_summary[tx_summary['unique'] == len(tx_df)].index.tolist()
    print(f"Transaction: {high_unique_tx}")

    print("\nPotential leakage columns:")
    print("In fraud detection, features like the 'target' itself or post-facto outcomes (if any) shouldn't be used. Currently need domain expertise to flag exact leakage, but looking at features closely related to transaction outcomes.")

    # Write dictionary to JSON to easily create reports later
    out_dict = {
        'tx_cols': list(tx_df.columns),
        'id_cols': list(id_df.columns),
        'fraud_pct': fraud_pct if 'isFraud' in tx_df.columns else 0
    }
    with open('inspect_output.json', 'w') as f:
        json.dump(out_dict, f)

if __name__ == "__main__":
    inspect_datasets()
