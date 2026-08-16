# Dataset Inspection Report

Based on the actual inspection of `train_transaction.csv.zip` and `train_identity.csv.zip` using Pandas:

## Dataset Dimensions
- **`train_transaction`**:
  - **Rows**: 590,540
  - **Columns**: 394
- **`train_identity`**:
  - **Rows**: 144,233
  - **Columns**: 41

## Schema Overview
- **Target Column**: `isFraud` (located in `train_transaction`).
- **Join Key**: `TransactionID` is present in both datasets.
- **Can they be joined correctly?**: Yes. 100% of the `TransactionID` keys in the identity dataset exist in the transaction dataset. A left join from `train_transaction` to `train_identity` on `TransactionID` is the correct approach.

## Class Distribution (Fraud vs Legitimate)
The dataset is highly imbalanced:
- **Legitimate (0)**: 569,877 rows (96.50%)
- **Fraud (1)**: 20,663 rows (3.50%)

## Approximate Memory Requirements
If fully loaded into Pandas DataFrames (with default data types):
- **Transaction Dataset**: ~2.10 GB
- **Identity Dataset**: ~157.63 MB
- **Total**: ~2.26 GB
> [!TIP]
> To avoid memory constraints, we should use `dtype` optimizations (e.g., loading `float64` as `float32`, `int64` as `int32`, or categorical encoding) during the actual training phase.

## Column Analysis

### 1. Useful Transaction Columns
- **Core features**: `TransactionAmt` (amount), `ProductCD` (product code).
- **Payment card info**: `card1` through `card6` (includes categorical info like card type, network).
- **Address info**: `addr1`, `addr2`.
- **Email domains**: `P_emaildomain` (purchaser), `R_emaildomain` (recipient).
- **Engineered features**: 
  - `C1` - `C14`: Counting features (e.g., number of addresses associated).
  - `D1` - `D15`: Time deltas (e.g., days since previous transaction).
  - `M1` - `M9`: Match features (names, addresses, etc.).
  - `V1` - `V339`: Vesta engineered numeric features.

### 2. Useful Identity Columns
- **Device info**: `DeviceType` (mobile/desktop), `DeviceInfo` (e.g., Windows, iOS).
- **Network & Software info**: `id_12` through `id_38` contain rich categorical features like browser version, screen resolution, and OS.
- **Identity numericals**: `id_01` through `id_11`.

### 3. Columns to Exclude (Leakage / IDs)
- **`TransactionID`**: Must be excluded during training as it is a unique identifier and provides no predictive value.
- **`TransactionDT`**: This is a timedelta (timestamp) representing the time from a given reference date. Using it raw will cause severe overfitting/leakage (the model will learn the chronological ordering instead of fraud patterns). It should only be used to engineer new features like `hour_of_day` or `day_of_week` and then dropped.
- **Highly Missing Columns**: Many `V` columns and `id` columns have >70% missing values. Depending on the model (e.g., if using a simple Neural Network instead of XGBoost), they may need to be dropped or heavily imputed.

## Missing Values and Data Types
- **Data Types**: The dataset contains a mix of numerical (`float64`, `int64` for `C`, `D`, `V` columns) and categorical (`object` for `ProductCD`, `card4`, `card6`, `P_emaildomain`, `DeviceType`, etc.).
- **Missing Values**: Missing values vary wildly. Core columns like `TransactionAmt` and `ProductCD` have 0% missing, whereas some `dist` and `V` columns exceed 75% missing rates. The identity dataset features are inherently sparse (missing for ~75% of the transaction rows).
