import os
import json
import joblib
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer

# TensorFlow / Keras
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2' # Hide unnecessary TF warnings
import tensorflow as tf
from tensorflow.keras.models import Model, Sequential
from tensorflow.keras.layers import Dense, Input
from tensorflow.keras.callbacks import EarlyStopping

"""
=============================================================================
FRAUDGUARD AI: AUTOENCODER EXPLAINER (DEEP LEARNING)
=============================================================================

1. What is an Autoencoder?
   An Autoencoder is a Neural Network designed to copy its input to its output.
   However, we force the data through a "bottleneck" (a hidden layer with very 
   few neurons). To successfully pass data through this bottleneck, the network 
   MUST learn the most important, underlying patterns of the data (compression).

2. How do we use it for Fraud Detection?
   We train the Autoencoder ONLY on LEGITIMATE (Normal) transactions. 
   Over time, the network becomes extremely good at compressing and perfectly 
   reconstructing normal behavior. 
   
   When we feed a FRAUDULENT transaction into the trained network, it has never 
   seen those patterns before. It tries to compress it using "normal" rules, 
   fails, and reconstructs it poorly. The difference between the Input and Output 
   is called the "Reconstruction Error". High Error = Anomaly/Fraud.

3. Why is this reliable?
   It requires zero labeled fraud data to train! It only requires you to know 
   what "normal" looks like.

Architecture (Simple & Reliable):
Input Layer (N features) -> Dense(16) -> Bottleneck(8) -> Dense(16) -> Output(N features)
=============================================================================
"""

def create_preprocessor():
    numeric_features = ['amount', 'hour_of_day', 'day_of_week']
    categorical_features = ['merchant_category', 'device_type']
    
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])

    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='constant', fill_value='Unknown')),
        ('onehot', OneHotEncoder(handle_unknown='ignore'))
    ])

    return ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_features),
            ('cat', categorical_transformer, categorical_features)
        ])

def feature_engineering(df):
    df['hour_of_day'] = df['timestamp'].dt.hour
    df['day_of_week'] = df['timestamp'].dt.dayofweek
    return df

def calculate_reconstruction_error(original, reconstructed):
    """
    Calculates the Mean Squared Error (MSE) between the original input 
    and the reconstructed output for EACH transaction.
    """
    # np.mean across axis=1 means we average the error of all features for each row
    return np.mean(np.square(original - reconstructed), axis=1)

def plot_visualizations(test_errors, test_labels, threshold):
    """
    Generates educational visualizations for the Autoencoder results.
    """
    eval_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'evaluation')
    os.makedirs(eval_dir, exist_ok=True)
    
    plt.figure(figsize=(12, 6))
    
    # Separate errors by actual class
    normal_errors = test_errors[test_labels == 0]
    fraud_errors = test_errors[test_labels == 1]
    
    # Plot 1: Histogram of Reconstruction Errors
    plt.subplot(1, 2, 1)
    plt.hist(normal_errors, bins=50, alpha=0.6, color='blue', label='Normal', density=True)
    plt.hist(fraud_errors, bins=50, alpha=0.6, color='red', label='Fraud', density=True)
    plt.axvline(threshold, color='black', linestyle='dashed', linewidth=2, label=f'Threshold ({threshold:.2f})')
    plt.title('Reconstruction Error Distribution')
    plt.xlabel('Reconstruction Error (MSE)')
    plt.ylabel('Density')
    plt.legend()
    # Limit X axis for readability, as fraud errors can be extremely large
    plt.xlim(0, threshold * 3) 
    
    # Plot 2: Scatter plot of instances
    plt.subplot(1, 2, 2)
    # Plot normal points
    plt.scatter(range(len(normal_errors)), normal_errors, color='blue', alpha=0.3, s=10, label='Normal')
    # Plot fraud points (shifted on X-axis so they don't overlap completely)
    plt.scatter(range(len(normal_errors), len(normal_errors) + len(fraud_errors)), 
                fraud_errors, color='red', alpha=0.6, s=15, label='Fraud')
    plt.axhline(threshold, color='black', linestyle='dashed', linewidth=2, label='Threshold')
    plt.title('Normal vs Anomalous Examples')
    plt.xlabel('Transaction Index')
    plt.ylabel('Reconstruction Error')
    plt.legend()
    plt.ylim(0, threshold * 3)
    
    plt.tight_layout()
    plot_path = os.path.join(eval_dir, 'autoencoder_analysis.png')
    plt.savefig(plot_path)
    plt.close()
    print(f"\nVisualizations saved to: {plot_path}")

def train_autoencoder():
    print("\n=== FraudGuard AI: Autoencoder (Deep Learning) ===")
    
    # 1. Load Data
    data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'raw', 'transactions.csv')
    df = pd.read_csv(data_path)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df = feature_engineering(df)
    
    # 2. Split Data
    X = df.drop(columns=['transaction_id', 'user_id', 'timestamp', 'is_fraud'])
    y = df['is_fraud']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # 3. CRITICAL STEP: Filter Training Data
    # We ONLY train the Autoencoder on Normal (is_fraud == 0) transactions.
    # It must learn what normal looks like, so it will fail when it sees fraud.
    print("Filtering training data to ONLY include legitimate transactions...")
    X_train_normal = X_train[y_train == 0]
    
    # 4. Preprocess Data
    preprocessor = create_preprocessor()
    X_train_normal_processed = preprocessor.fit_transform(X_train_normal)
    X_test_processed = preprocessor.transform(X_test)
    
    # Ensure dense array format for TensorFlow
    if hasattr(X_train_normal_processed, "toarray"):
        X_train_normal_processed = X_train_normal_processed.toarray()
        X_test_processed = X_test_processed.toarray()
        
    input_dim = X_train_normal_processed.shape[1]
    
    # 5. Build Simple Reliable Architecture
    print(f"Building Autoencoder... Input Dimensions: {input_dim}")
    
    autoencoder = Sequential([
        # Encoder (Compresses data)
        Input(shape=(input_dim,)),
        Dense(16, activation='relu'),
        # Bottleneck (Forces model to learn the most important patterns)
        Dense(8, activation='relu'),
        # Decoder (Tries to rebuild data)
        Dense(16, activation='relu'),
        Dense(input_dim, activation='linear')
    ])
    
    # Compile with Mean Squared Error (to measure reconstruction accuracy)
    autoencoder.compile(optimizer='adam', loss='mse')
    
    # 6. Train the Model
    print("Training neural network on normal transactions...")
    early_stop = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)
    
    autoencoder.fit(
        X_train_normal_processed, X_train_normal_processed, # Target is the INPUT itself!
        epochs=50,
        batch_size=32,
        validation_split=0.1,
        callbacks=[early_stop],
        verbose=0 # Set to 1 if you want to see progress bars
    )
    
    # 7. Calculate Threshold
    # Predict on the training data (normal transactions) to see their error.
    # The threshold is mathematically set to flag anything worse than 99% of normal transactions.
    print("\nCalculating dynamic threshold...")
    train_reconstructed = autoencoder.predict(X_train_normal_processed, verbose=0)
    train_errors = calculate_reconstruction_error(X_train_normal_processed, train_reconstructed)
    
    # Set threshold at the 98th percentile of normal errors
    threshold = np.percentile(train_errors, 98)
    print(f"Threshold set to: {threshold:.4f}")
    
    # 8. Evaluate on Test Set
    test_reconstructed = autoencoder.predict(X_test_processed, verbose=0)
    test_errors = calculate_reconstruction_error(X_test_processed, test_reconstructed)
    
    # 9. Create Visualizations
    plot_visualizations(test_errors, y_test, threshold)
    
    # 10. Save Artifacts
    models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models')
    os.makedirs(models_dir, exist_ok=True)
    
    autoencoder.save(os.path.join(models_dir, 'autoencoder.keras'))
    joblib.dump(preprocessor, os.path.join(models_dir, 'ae_preprocessor.pkl'))
    
    # Save the threshold so the inference function can use it later
    with open(os.path.join(models_dir, 'ae_threshold.json'), 'w') as f:
        json.dump({"threshold": float(threshold)}, f)
        
    print("Model, preprocessor, and threshold saved successfully.")

def detect_deep_anomaly(transaction_dict, models_dir=None):
    """
    Takes a single transaction dictionary, runs it through the Autoencoder, 
    calculates reconstruction error, and flags deep anomalies.
    """
    if models_dir is None:
        models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models')
        
    try:
        model = tf.keras.models.load_model(os.path.join(models_dir, 'autoencoder.keras'))
        preprocessor = joblib.load(os.path.join(models_dir, 'ae_preprocessor.pkl'))
        with open(os.path.join(models_dir, 'ae_threshold.json'), 'r') as f:
            threshold = json.load(f)["threshold"]
    except Exception as e:
        print(f"Error loading models: {e}")
        return None

    df = pd.DataFrame([transaction_dict])
    
    if 'timestamp' in df.columns:
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = feature_engineering(df)
        df = df.drop(columns=['timestamp'])
        
    for col in ['transaction_id', 'user_id']:
        if col in df.columns:
            df = df.drop(columns=[col])
            
    X_processed = preprocessor.transform(df)
    
    if hasattr(X_processed, "toarray"):
        X_processed = X_processed.toarray()
        
    # Reconstruct and calculate error
    reconstructed = model.predict(X_processed, verbose=0)
    error = calculate_reconstruction_error(X_processed, reconstructed)[0]
    
    is_anomaly = bool(error > threshold)
    
    # Normalize score (0-100) based on threshold
    # If error == threshold, score = 50. If error >= 2*threshold, score = 100
    normalized_score = min(100.0, (error / (threshold * 2)) * 100.0)
    
    return {
        "reconstruction_error": round(float(error), 4),
        "normalized_anomaly_score": round(float(normalized_score), 2),
        "anomaly_flag": is_anomaly
    }

if __name__ == "__main__":
    train_autoencoder()
    
    print("\n=== Testing Deep Anomaly Detection ===")
    mock_transaction = {
        "transaction_id": "TX-TEST-003",
        "user_id": "USR-4444",
        "timestamp": "2023-11-01 19:30:00", 
        "amount": 12.50,                     # Seemingly normal amount
        "merchant_category": "Gaming",       # But strange combination context
        "device_type": "API"                 
    }
    
    print("Input Transaction:")
    print(json.dumps(mock_transaction, indent=2))
    
    result = detect_deep_anomaly(mock_transaction)
    print("\nDeep Anomaly Result:")
    print(json.dumps(result, indent=2))
