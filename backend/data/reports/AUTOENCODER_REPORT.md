# Autoencoder Anomaly Detection Report

This report summarizes the design, training, and evaluation of the deep learning Autoencoder model for FraudGuard AI. It serves as the third component in the ML pipeline, utilizing neural network reconstruction error to detect fraudulent transactions.

## 1. Architecture & Design
To effectively compress the dataset and learn the underlying patterns of legitimate transactions, we designed a compact "bottleneck" neural network architecture in Keras/TensorFlow.
* **Input Layer**: 76 dimensions (matching the preprocessed feature count)
* **Encoder**: 1 Dense layer (32 units) with ReLU activation
* **Latent Bottleneck**: 1 Dense layer (16 units) with ReLU activation. *This forces the network to compress the data by nearly 80%, keeping only the most essential patterns.*
* **Decoder**: 1 Dense layer (32 units) with ReLU activation
* **Output Layer**: 76 dimensions with Linear activation
* **Loss Function**: Mean Squared Error (MSE)

## 2. Preprocessing
We utilized the same `preprocessing_pipeline.joblib` as the previous models. 
Crucially, the `StandardScaler` within this pipeline ensures all features have zero mean and unit variance. Neural networks and MSE loss are highly sensitive to unscaled data (e.g., a huge transaction amount would dwarf the loss contribution of all other features).

## 3. Training Strategy (Semi-Supervised)
Similar to the Isolation Forest, we trained the model exclusively on **legitimate transactions (`isFraud == 0`)** from the training split (455,833 transactions).
* **Objective**: The model learns to compress and perfectly reconstruct *normal* behavior. When it encounters a fraudulent transaction, its latent bottleneck will fail to represent it properly, resulting in a high reconstruction error (MSE).
* **Early Stopping**: Monitored `val_loss` (MSE on the validation split) with a patience of 5 epochs to prevent overfitting. Training stopped automatically at Epoch 30.

## 4. Anomaly Score Normalization
To integrate cleanly with the frontend API alongside the Isolation Forest:
1. We calculated the raw MSE reconstruction error for every training row.
2. We fit a `MinMaxScaler` on these training errors to bound them between `0` and `100`.
3. We saved this scaler to `backend/ml/artifacts/autoencoder_scaler.joblib`.
4. Any test score is capped at `100` to handle extreme outliers.

## 5. Evaluation Results (Test Set)
When evaluated on the unseen 10% test set, the 0-100 anomaly scores averaged as follows:
* **Average Score for Legitimate Transactions**: `0.72 / 100`
* **Average Score for Fraudulent Transactions**: `1.99 / 100`

### Interpretation
Because we scaled the maximum training error to `100`, the vast majority of legitimate transactions reconstruct perfectly with near-zero error (averaging `0.72`). 
Fraudulent transactions, however, struggle to reconstruct, yielding an average error that is nearly **triple** (`1.99`) that of legitimate transactions. This provides a strong, mathematically distinct anomaly signal.

## 6. Artifacts Generated
* **Model**: `backend/ml/artifacts/autoencoder.keras`
* **Scaler**: `backend/ml/artifacts/autoencoder_scaler.joblib`
