# Isolation Forest Anomaly Detection Report

This report summarizes the implementation and training of the unsupervised Isolation Forest model, which serves as a secondary anomaly signal for FraudGuard AI alongside the primary XGBoost supervised model.

## 1. Purpose and Role
While the XGBoost model asks *"Does this transaction match known patterns of fraud?"*, the Isolation Forest asks *"Is this transaction highly unusual compared to normal behavior?"* 

This dual-model approach is powerful because Isolation Forests can detect entirely new zero-day fraud tactics that XGBoost has never seen in the training data, simply because the new tactics look "abnormal."

## 2. Feature Selection & Preprocessing
To ensure consistency and prevent pipeline duplication, the Isolation Forest utilizes the exact same preprocessing pipeline (`preprocessing_pipeline.joblib`) as XGBoost. 
* **Standardization**: All numerical features (like `TransactionAmt`, distances, and time deltas) are standardized using `StandardScaler`. This is crucial for Isolation Forest, which relies on distance-like partitioning to isolate outliers.
* **Categorical Handling**: Handled via robust ordinal encoding.

## 3. Training Strategy (Semi-Supervised)
* **Temporal Split**: We used the same strict temporal split (80/10/10) to prevent leakage.
* **Normalcy Profiling**: During training, we **filtered out all known fraud** from the training set. The model was fit exclusively on the 455,833 legitimate transactions. 
* **Contamination**: We set `contamination=0.001` to account for slight noise in the legitimate dataset. The model learned the boundaries of strictly "normal" behavior.

## 4. Anomaly Score Normalization
Scikit-Learn's native `decision_function` returns raw bounded scores where lower values mean more anomalous. 
To create an intuitive API response for the frontend:
1. We inverted the raw scores (`higher = more anomalous`).
2. We fit a `MinMaxScaler` on the training data to map the scores to a clean **0-100 scale**.
3. We saved this scaler to `backend/ml/artifacts/iforest_scaler.joblib`.

## 5. Evaluation Results (Test Set)
When evaluated on the unseen 10% test set, the 0-100 anomaly scores averaged as follows:
* **Average Score for Legitimate Transactions**: `18.65 / 100`
* **Average Score for Fraudulent Transactions**: `32.68 / 100`

This ~14-point separation confirms that the model successfully identifies fraud as statistically more anomalous than legitimate transactions, without ever being explicitly told what fraud looks like during training!

## 6. Limitations & Considerations
* **Not a standalone classifier**: While the score for fraud is higher on average, the distributions overlap. Anomaly detection should not be used as the *sole* decision-maker for blocking a transaction, but rather as an amplifier or flag for manual review.
* **Feature space**: Isolation Forests can suffer in extremely high-dimensional spaces. We mitigated this by using the curated, reduced feature set defined in `feature_config.py`.
