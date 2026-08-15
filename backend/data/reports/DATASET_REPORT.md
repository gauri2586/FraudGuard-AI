# Dataset Inspection Report

## Overview
We have successfully inspected the raw datasets provided for the FraudGuard AI machine learning phase: `train_transaction.csv` and `train_identity.csv`.

## 1. Size & Shape
* **Transaction Dataset**: 590,540 rows and 394 columns.
* **Identity Dataset**: 144,233 rows and 41 columns.

## 2. Data Relationship
The datasets are linked together using the **`TransactionID`** column. 
* Total transactions recorded: 590,540
* Transactions with matching Identity information: 144,233 (~24.4%)
* Transactions without Identity information: 446,307 (~75.6%)

*(Note: Identity information is typically only collected for certain types of transactions or when specific risk triggers are met, hence the missing data for the majority of transactions).*

## 3. The Target Variable: `isFraud`
Our goal is to predict the `isFraud` column in the Transaction dataset. Here is the distribution:
* **Total Transactions**: 590,540
* **Legitimate Transactions**: 569,877
* **Fraudulent Transactions**: 20,663
* **Fraud Percentage**: 3.5%

## 4. Why Accuracy is Insufficient
As shown above, the dataset suffers from **extreme class imbalance** (only 3.5% of transactions are fraud). 

If we built a "dummy" model that simply predicted "Not Fraud" for every single transaction, it would be **96.5% accurate**. However, this model would be completely useless because it would miss 100% of the actual fraud! 

Therefore, standard accuracy is a misleading metric for fraud detection. Instead, we must evaluate our models using:
* **Precision**: When we flag a transaction as fraud, how often are we right? (Minimizes false positives).
* **Recall**: Out of all the actual fraud, how much did we catch? (Minimizes false negatives).
* **F1 Score**: The harmonic mean of Precision and Recall.
* **ROC-AUC & PR-AUC**: Metrics that evaluate the model's ability to distinguish between classes across different thresholds.
* **Confusion Matrix**: A table showing the exact counts of True Positives, True Negatives, False Positives, and False Negatives.

## 5. Data Quality Observations
* **High Missingness**: Several columns, particularly the `V` (Vesta) features and Identity features, have over 80-90% missing values.
* **Numerical vs Categorical**: The dataset contains a mix. Most `V` features and `C` features are numerical/counts. Features like `ProductCD`, `card4` (Visa/Mastercard), and `DeviceType` are categorical.
* **Potential Leakage**: We must be careful not to use features that are recorded *after* the fraud determination is made. However, in this snapshot, most features represent the state at the time of the transaction.
