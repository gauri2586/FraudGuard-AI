import os
import json
import pandas as pd

# Define paths
raw_data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "raw")
trans_path = os.path.join(raw_data_dir, "train_transaction.csv.zip")
id_path = os.path.join(raw_data_dir, "train_identity.csv.zip")
report_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dataset_report.json")

print("Loading datasets... This might take a moment.")
try:
    df_trans = pd.read_csv(trans_path, compression="zip")
    df_id = pd.read_csv(id_path, compression="zip")
except Exception as e:
    print(f"Error loading datasets: {e}")
    exit(1)

report = {}

# 1. Number of rows
# 2. Number of columns
report["train_transaction"] = {
    "rows": len(df_trans),
    "columns": len(df_trans.columns)
}
report["train_identity"] = {
    "rows": len(df_id),
    "columns": len(df_id.columns)
}

# 3. Column names & 4. Data types
trans_dtypes = df_trans.dtypes.astype(str).to_dict()
id_dtypes = df_id.dtypes.astype(str).to_dict()
report["train_transaction"]["columns_list"] = list(trans_dtypes.keys())
report["train_transaction"]["dtypes"] = trans_dtypes
report["train_identity"]["columns_list"] = list(id_dtypes.keys())
report["train_identity"]["dtypes"] = id_dtypes

# 5. Missing values
trans_missing = df_trans.isnull().sum().to_dict()
id_missing = df_id.isnull().sum().to_dict()
report["train_transaction"]["missing_values"] = {k: int(v) for k, v in trans_missing.items() if v > 0}
report["train_identity"]["missing_values"] = {k: int(v) for k, v in id_missing.items() if v > 0}

# 6. Duplicate rows
report["train_transaction"]["duplicate_rows"] = int(df_trans.duplicated().sum())
report["train_identity"]["duplicate_rows"] = int(df_id.duplicated().sum())

# 7. Target column
target_col = "isFraud" if "isFraud" in df_trans.columns else None
report["target_column"] = target_col

# 8. Legitimate, 9. Fraudulent, 10. Fraud Percentage
if target_col:
    fraud_counts = df_trans[target_col].value_counts().to_dict()
    legit = int(fraud_counts.get(0, 0))
    fraud = int(fraud_counts.get(1, 0))
    report["legitimate_transactions"] = legit
    report["fraudulent_transactions"] = fraud
    report["fraud_percentage"] = round((fraud / (legit + fraud)) * 100, 2) if (legit + fraud) > 0 else 0

# 11. Numerical and 12. Categorical features
num_cols = df_trans.select_dtypes(include=['int64', 'float64']).columns.tolist()
cat_cols = df_trans.select_dtypes(include=['object', 'category']).columns.tolist()
report["train_transaction"]["numerical_features"] = num_cols
report["train_transaction"]["categorical_features"] = cat_cols

# 13. Potentially useless/high cardinality
# High missing > 80%
high_missing = [k for k, v in trans_missing.items() if v / len(df_trans) > 0.8]
# High cardinality categorical > 100 unique
high_cardinality = [col for col in cat_cols if df_trans[col].nunique() > 100]
report["train_transaction"]["useless_high_missing"] = high_missing
report["train_transaction"]["high_cardinality"] = high_cardinality

# 14. Can be joined? 15. Common key
common_keys = list(set(df_trans.columns) & set(df_id.columns))
can_join = len(common_keys) > 0
report["can_be_joined"] = can_join
report["common_keys"] = common_keys

# 16. Data Leakage risks
# Check if any column is a timestamp in the future, or highly correlated with target
# For a quick check, we'll flag any 'Date' or 'Time' columns, or columns perfectly correlated
leakage_risks = [c for c in df_trans.columns if "time" in c.lower() or "date" in c.lower()]
report["data_leakage_risks"] = leakage_risks

with open(report_path, "w") as f:
    json.dump(report, f, indent=2)

print("\n=== Dataset Inspection Summary ===")
print(f"Transaction Dataset: {len(df_trans)} rows, {len(df_trans.columns)} columns")
print(f"Identity Dataset: {len(df_id)} rows, {len(df_id.columns)} columns")
if target_col:
    print(f"Target Column: {target_col}")
    print(f"Legitimate Transactions: {legit}")
    print(f"Fraudulent Transactions: {fraud} ({report['fraud_percentage']}%)")
print(f"Can be joined: {can_join} (Keys: {common_keys})")
print(f"Data Leakage Risks (time-based): {leakage_risks}")
print(f"High Missing Columns (>80%): {len(high_missing)} columns")
print(f"\nReport successfully saved to {report_path}")
