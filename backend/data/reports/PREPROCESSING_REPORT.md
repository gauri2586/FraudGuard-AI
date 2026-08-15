# Preprocessing Strategy Report

This report documents the machine learning preprocessing strategy implemented for the FraudGuard AI platform.

## 1. Feature Selection Strategy
We avoided blindly using all 400+ raw columns to prevent overfitting and reduce memory consumption.
* **Selected Numerical**: `TransactionAmt`, `dist1`, `dist2`, `C1`-`C14` (counts), and `D1`-`D15` (time distances). These provide core information about the transaction's monetary value and historical context.
* **Selected Categorical**: `ProductCD`, `card1`-`card6` (payment card info), `addr1`, `addr2` (billing regions), `P_emaildomain`, `R_emaildomain`, `DeviceType`, `DeviceInfo`, and selected identity features (`id_12`-`id_38`). These provide behavioral and contextual identity.
* **Removed Features**: 
  * The `V` features were excluded from the initial pass to minimize the dimensionality and because many are highly collinear or mostly missing.
  * `TransactionID` was explicitly removed as an input feature to prevent the model from memorizing specific transactions (which is a form of target leakage).

## 2. Feature Engineering
We created several derived features in a custom Scikit-Learn Transformer (`FeatureEngineer`):
* `TransactionAmt_Log`: The natural log of the transaction amount. Fraud datasets often have extremely skewed transaction amounts; log scaling normalizes this.
* `hour_of_day` & `day_of_week`: Extracted from `TransactionDT`. Fraud often happens at unusual hours.
* `email_match`: A binary indicator (0 or 1) checking if the purchaser's email domain matches the recipient's email domain.

## 3. Missing Value Strategy
Missing values are handled seamlessly within the pipeline:
* **Numerical Features**: Imputed using the **Median** value of the training set. Median is robust to the extreme outliers often found in financial data.
* **Categorical Features**: Imputed using a constant string `"Missing"`. This explicitly tells the model that the absence of data might itself be a predictive signal.

## 4. Categorical Encoding
* We used **Ordinal Encoding** for categorical features. 
* *Why not One-Hot Encoding?* Fraud datasets often have categorical variables with extremely high cardinality (e.g., thousands of unique card types or email domains). One-Hot Encoding would create an explosion of columns, leading to memory issues and sparse matrices.
* *Unknown Categories*: The encoder is configured to handle unknown categories during inference (by assigning a specific unknown value) rather than crashing.

## 5. Leakage Prevention
To prevent data leakage (where the model inadvertently "sees" test data during training):
1. **Fit vs. Transform**: The pipeline (`fit_transform`) is ONLY fitted on the training dataset. It learns the medians and category mappings. 
2. **Persistence**: The fitted pipeline is saved to disk (`backend/ml/artifacts/preprocessing_pipeline.joblib`). 
3. **Inference**: During evaluation or real-time inference, we only call `.transform()`, ensuring that live data is scaled and imputed using the statistics learned strictly from the training set.
