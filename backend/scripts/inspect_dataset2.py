import pandas as pd
import json
import os

def inspect_dataset():
    data_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'raw')
    tx_file = os.path.join(data_dir, 'train_transaction.csv.zip')
    id_file = os.path.join(data_dir, 'train_identity.csv.zip')
    
    # Check if files exist
    if not os.path.exists(tx_file):
        print(f"Error: {tx_file} not found")
        return
    if not os.path.exists(id_file):
        print(f"Error: {id_file} not found")
        return

    print("Loading datasets...")
    # Load just enough data to get stats if memory is an issue, 
    # but the files are ~60MB zipped, so they're probably ~500k rows, which is around 1-2GB in memory.
    # We can load them entirely to get accurate class distributions and missing values.
    tx_df = pd.read_csv(tx_file)
    id_df = pd.read_csv(id_file)
    
    print("Computing stats for Transactions...")
    tx_rows, tx_cols = tx_df.shape
    tx_mem = tx_df.memory_usage(deep=True).sum() / (1024 * 1024)
    tx_missing = tx_df.isnull().mean().to_dict()
    tx_dtypes = {k: str(v) for k, v in tx_df.dtypes.to_dict().items()}
    
    target_col = 'isFraud' if 'isFraud' in tx_df.columns else None
    class_dist = {}
    if target_col:
        class_dist = tx_df[target_col].value_counts(normalize=True).to_dict()
        class_dist = {str(k): v for k, v in class_dist.items()}
        class_counts = tx_df[target_col].value_counts().to_dict()
        class_counts = {str(k): v for k, v in class_counts.items()}
    else:
        class_counts = {}
        
    print("Computing stats for Identity...")
    id_rows, id_cols = id_df.shape
    id_mem = id_df.memory_usage(deep=True).sum() / (1024 * 1024)
    id_missing = id_df.isnull().mean().to_dict()
    id_dtypes = {k: str(v) for k, v in id_df.dtypes.to_dict().items()}
    
    # Check join key
    join_keys = list(set(tx_df.columns).intersection(set(id_df.columns)))
    
    # Check match of join keys
    if join_keys:
        key = join_keys[0] # Usually TransactionID
        tx_keys = set(tx_df[key])
        id_keys = set(id_df[key])
        match_pct = len(tx_keys.intersection(id_keys)) / len(id_keys) if len(id_keys) > 0 else 0
    else:
        key = None
        match_pct = 0
        
    result = {
        "train_transaction": {
            "rows": tx_rows,
            "columns": tx_cols,
            "memory_mb": round(tx_mem, 2),
            "target_column": target_col,
            "class_distribution": class_dist,
            "class_counts": class_counts,
            "join_keys_present": join_keys,
            "columns_list": list(tx_df.columns)
        },
        "train_identity": {
            "rows": id_rows,
            "columns": id_cols,
            "memory_mb": round(id_mem, 2),
            "columns_list": list(id_df.columns)
        },
        "join_info": {
            "shared_columns": join_keys,
            "identity_keys_in_transaction_pct": match_pct
        }
    }
    
    # Save missing and dtypes to separate files to avoid huge json
    with open('inspect_results.json', 'w') as f:
        json.dump(result, f, indent=2)
        
    with open('inspect_tx_missing.json', 'w') as f:
        json.dump(tx_missing, f, indent=2)
        
    with open('inspect_tx_dtypes.json', 'w') as f:
        json.dump(tx_dtypes, f, indent=2)

    with open('inspect_id_missing.json', 'w') as f:
        json.dump(id_missing, f, indent=2)
        
    with open('inspect_id_dtypes.json', 'w') as f:
        json.dump(id_dtypes, f, indent=2)
        
    print("Done. Results saved to inspect_results.json and others.")

if __name__ == "__main__":
    inspect_dataset()
