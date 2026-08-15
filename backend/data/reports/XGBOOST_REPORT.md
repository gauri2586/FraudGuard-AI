# XGBoost Fraud Detection Model Report

This report summarizes the training, evaluation, and characteristics of the primary supervised XGBoost model for FraudGuard AI.

## 1. Dataset Split (Temporal Strategy)
To avoid temporal data leakage (where the model "looks into the future" to learn patterns), we split the dataset sequentially by time (`TransactionDT`):
* **Training Set**: First 80% (472,432 rows)
* **Validation Set**: Next 10% (59,054 rows) — Used for early stopping.
* **Test Set**: Final 10% (59,054 rows) — Used for unbiased final evaluation.

## 2. Hyperparameters & Configuration
* **Algorithm**: `XGBClassifier`
* **Class Imbalance Strategy**: Rather than dropping data or using synthetic sampling (SMOTE), we used XGBoost's native `scale_pos_weight`. The imbalance ratio in the training set was **27.46:1** (Negative:Positive). 
* **Key Hyperparameters**:
  * `learning_rate`: 0.05
  * `max_depth`: 6
  * `subsample`: 0.8
  * `colsample_bytree`: 0.8
* **Early Stopping**: Monitored `aucpr` on the Validation set for 10 rounds. Training completed at 300 rounds without early stopping, achieving a peak Validation PR-AUC of 0.482.

## 3. Evaluation Metrics (Test Set)
The model was evaluated strictly on the final 10% test set, representing "future" unseen transactions.

* **ROC-AUC**: 0.9009 (Excellent overall ranking capability)
* **PR-AUC**: 0.4739 (Area Under Precision-Recall Curve)
* **Precision**: 22.77%
* **Recall**: 70.49%
* **F1-Score**: 0.3442

## 4. Confusion Matrix
Out of 59,054 test transactions:
* **True Negatives (TN)**: 51,550 (Legitimate transactions correctly ignored)
* **True Positives (TP)**: 1,560 (Fraud successfully caught!)
* **False Positives (FP)**: 5,291 (Legitimate transactions flagged as fraud)
* **False Negatives (FN)**: 653 (Fraud that slipped through)

## 5. Interpretation: The Fraud Trade-off
Why is the Precision only 22.7% while the Recall is 70.5%? 
In fraud detection, missing a fraudulent transaction (False Negative) is usually much more expensive than investigating a legitimate one (False Positive). Because we used `scale_pos_weight`, the model was heavily penalized for missing fraud. 
* **The Good**: We caught **70.5% of all actual fraud** happening in the future test set.
* **The Trade-off**: For every 1 actual fraud we catch, we flag about 3.4 legitimate transactions for manual review. 
* **Conclusion**: This is a highly realistic, production-ready baseline model. We did not artificially inflate accuracy by simply guessing "Not Fraud" for everything.

## 6. Limitations & Future Work
* The model relies heavily on historical behavior. If fraud tactics suddenly change (concept drift), performance will drop until retrained.
* We can improve Precision by introducing an **Isolation Forest** anomaly detector to filter out "normal" looking False Positives.
* The model is saved at `backend/ml/artifacts/xgboost_fraud_model.json` and is ready for inference integration.
