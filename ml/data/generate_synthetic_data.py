import pandas as pd
import numpy as np
import os
import random
from datetime import datetime, timedelta

# Create the data/raw directory if it doesn't exist
os.makedirs(os.path.join(os.path.dirname(__file__), 'raw'), exist_ok=True)

def generate_transactions(n_samples=10000):
    print(f"Generating {n_samples} synthetic transactions...")
    
    np.random.seed(42)
    random.seed(42)
    
    # 1. Base Features
    user_ids = [f"USR-{np.random.randint(1000, 9999)}" for _ in range(n_samples)]
    
    # Amounts mostly log-normal (small everyday purchases with a long tail)
    amounts = np.random.lognormal(mean=3.5, sigma=1.2, size=n_samples)
    amounts = np.round(amounts, 2)
    
    # Categorical features
    merchants = ["Groceries", "Dining", "Retail", "Electronics", "Travel", "Crypto", "Gaming"]
    merchant_probs = [0.3, 0.25, 0.2, 0.1, 0.05, 0.05, 0.05]
    merchant_categories = np.random.choice(merchants, size=n_samples, p=merchant_probs)
    
    devices = ["Mobile_App", "Desktop_Web", "Mobile_Web", "API"]
    device_probs = [0.6, 0.25, 0.1, 0.05]
    device_types = np.random.choice(devices, size=n_samples, p=device_probs)
    
    # 2. Time features
    base_date = datetime(2023, 1, 1)
    timestamps = [base_date + timedelta(minutes=random.randint(0, 525600)) for _ in range(n_samples)]
    # Sort chronologically
    timestamps.sort()
    
    # 3. Create DataFrame
    df = pd.DataFrame({
        "transaction_id": [f"TX-{100000 + i}" for i in range(n_samples)],
        "user_id": user_ids,
        "timestamp": timestamps,
        "amount": amounts,
        "merchant_category": merchant_categories,
        "device_type": device_types
    })
    
    # 4. Generate Target (Fraud) with severe class imbalance (~1.5% fraud)
    # Fraud patterns: Unusually high amounts, specific categories, or just random
    df['is_fraud'] = 0
    
    for idx, row in df.iterrows():
        fraud_prob = 0.005 # Base probability
        
        # Fraudsters target high-value electronics and crypto
        if row['merchant_category'] in ["Electronics", "Crypto"] and row['amount'] > 1000:
            fraud_prob += 0.3
            
        # Unusually high amounts in general
        if row['amount'] > 3000:
            fraud_prob += 0.4
            
        # Assign fraud based on probability
        if random.random() < fraud_prob:
            df.at[idx, 'is_fraud'] = 1
            
    # 5. Inject Missing Values intentionally to teach data cleaning
    # Randomly remove ~5% of device_type and ~2% of amount
    print("Injecting missing values...")
    mask_device = np.random.choice([True, False], size=len(df), p=[0.05, 0.95])
    df.loc[mask_device, 'device_type'] = np.nan
    
    mask_amount = np.random.choice([True, False], size=len(df), p=[0.02, 0.98])
    df.loc[mask_amount, 'amount'] = np.nan
    
    # 6. Save to CSV
    output_path = os.path.join(os.path.dirname(__file__), 'raw', 'transactions.csv')
    df.to_csv(output_path, index=False)
    
    fraud_count = df['is_fraud'].sum()
    print(f"Dataset generation complete! Saved to {output_path}")
    print(f"Total records: {len(df)}")
    print(f"Fraud incidents: {fraud_count} ({(fraud_count/len(df))*100:.2f}%)")
    
if __name__ == "__main__":
    generate_transactions(20000)
