import os
import pandas as pd
import numpy as np

# Machine Learning libraries
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix, f1_score

def main():
    print("=== FraudGuard AI: Baseline ML Pipeline ===\n")
    
    # ---------------------------------------------------------
    # STEP 1: Load Dataset
    # ---------------------------------------------------------
    data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'raw', 'transactions.csv')
    
    if not os.path.exists(data_path):
        print(f"ERROR: Dataset not found at {data_path}")
        print("Please run 'python data/generate_synthetic_data.py' first.")
        return
        
    print(f"1. Loading dataset from {data_path}...")
    df = pd.read_csv(data_path)
    
    # Convert timestamp to datetime objects
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    # ---------------------------------------------------------
    # STEP 2 & 5: Inspect Data & Exploratory Data Analysis (EDA)
    # ---------------------------------------------------------
    print("\n2 & 5. Inspecting Data & Basic EDA...")
    print(f"Dataset Shape: {df.shape[0]} rows, {df.shape[1]} columns")
    print("\nData Types:")
    print(df.dtypes)
    
    print("\nAmount Statistics (Notice the extreme max value, typical in fraud scenarios):")
    print(df['amount'].describe())
    
    # ---------------------------------------------------------
    # STEP 4: Analyze Class Imbalance
    # ---------------------------------------------------------
    print("\n4. Analyzing Class Imbalance...")
    # Fraud is extremely rare. Models will naturally want to predict "0" for everything.
    # We must measure this to understand the baseline difficulty.
    fraud_counts = df['is_fraud'].value_counts()
    normal_pct = (fraud_counts[0] / len(df)) * 100
    fraud_pct = (fraud_counts[1] / len(df)) * 100
    print(f"Normal (0): {fraud_counts[0]} ({normal_pct:.2f}%)")
    print(f"Fraud (1):  {fraud_counts[1]} ({fraud_pct:.2f}%)")
    
    # ---------------------------------------------------------
    # STEP 7: Create Train/Test Split
    # ---------------------------------------------------------
    print("\n7. Creating Train/Test Split...")
    # Feature Engineering: Extract hour from timestamp
    df['hour_of_day'] = df['timestamp'].dt.hour
    
    # Define features (X) and target (y)
    # We drop transaction_id and user_id as they are unique identifiers, not predictive features (yet).
    X = df.drop(columns=['transaction_id', 'user_id', 'timestamp', 'is_fraud'])
    y = df['is_fraud']
    
    # We use `stratify=y` to ensure that the extreme class imbalance (~1.5%) 
    # is maintained proportionally in BOTH the training and testing sets.
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    print(f"Training set size: {X_train.shape[0]} samples")
    print(f"Testing set size:  {X_test.shape[0]} samples")

    # ---------------------------------------------------------
    # STEP 3 & 6: Preprocessing Pipeline & Handling Missing Values
    # ---------------------------------------------------------
    print("\n3 & 6. Building Preprocessing Pipeline...")
    # Define which columns are numeric vs categorical
    numeric_features = ['amount', 'hour_of_day']
    categorical_features = ['merchant_category', 'device_type']
    
    # Numeric Pipeline:
    # 1. SimpleImputer: Fills missing 'amount' values with the median of the column
    # 2. StandardScaler: Scales numbers to have mean=0 and variance=1 (vital for Logistic Regression)
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])

    # Categorical Pipeline:
    # 1. SimpleImputer: Fills missing 'device_type' with a constant 'Unknown'
    # 2. OneHotEncoder: Converts strings ("Mobile") into binary columns (1 or 0)
    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='constant', fill_value='Unknown')),
        ('onehot', OneHotEncoder(handle_unknown='ignore'))
    ])

    # Combine them using ColumnTransformer
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_features),
            ('cat', categorical_transformer, categorical_features)
        ])
        
    # ---------------------------------------------------------
    # STEP 8: Prevent Data Leakage
    # ---------------------------------------------------------
    # Data Leakage occurs when information from the test set "leaks" into the training process.
    # By using a scikit-learn Pipeline, we ensure that the Imputer and Scaler are ONLY 
    # fitted (calculate mean/median) on the training data. The test data is only transformed.
    
    # ---------------------------------------------------------
    # STEP 9: Create Baseline Model
    # ---------------------------------------------------------
    print("\n9. Training Baseline Model (Logistic Regression)...")
    # We use class_weight='balanced' because our fraud class is so rare. 
    # This penalizes the model heavily if it gets a fraud case wrong.
    model = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', LogisticRegression(class_weight='balanced', random_state=42, max_iter=1000))
    ])
    
    # Train the model!
    model.fit(X_train, y_train)
    
    # ---------------------------------------------------------
    # Evaluate Baseline Model
    # ---------------------------------------------------------
    print("\n=== Baseline Evaluation ===")
    y_pred = model.predict(X_test)
    
    print("\nConfusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    print(f"True Negatives: {cm[0][0]} | False Positives: {cm[0][1]}")
    print(f"False Negatives: {cm[1][0]} | True Positives: {cm[1][1]}")
    
    print("\nClassification Report:")
    # We care most about the "1" class (Fraud) and its F1-score/Recall
    print(classification_report(y_test, y_pred))
    
    baseline_f1 = f1_score(y_test, y_pred)
    print(f"Baseline F1-Score for Fraud: {baseline_f1:.4f}")
    
    print("\nNext Steps:")
    print("This baseline Logistic Regression gives us a starting point.")
    print("Because it is a linear model, it struggles with complex, non-linear fraud patterns.")
    print("In the next phase, we will train XGBoost and Isolation Forests to improve this F1 score!")

if __name__ == "__main__":
    main()
