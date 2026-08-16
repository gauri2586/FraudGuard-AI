import urllib.request
import json
import time

url = 'http://127.0.0.1:8000/api/predict'
headers = {'Content-Type': 'application/json'}

scenarios = [
    {
        'name': '1. Normal low-value transaction',
        'data': {'transaction_id': 'TX1', 'amount': 15.0, 'transaction_type': 'Purchase', 'merchant_category': 'Coffee', 'location': 'New York', 'device_type': 'Mobile'}
    },
    {
        'name': '2. High-value transaction',
        'data': {'transaction_id': 'TX2', 'amount': 15000.0, 'transaction_type': 'Transfer', 'merchant_category': 'Jewelry', 'location': 'New York', 'device_type': 'Desktop'}
    },
    {
        'name': '3. Unusual merchant/category',
        'data': {'transaction_id': 'TX3', 'amount': 500.0, 'transaction_type': 'Purchase', 'merchant_category': 'Crypto Exchange', 'location': 'New York', 'device_type': 'Mobile'}
    },
    {
        'name': '4. Unusual location/device combination',
        'data': {'transaction_id': 'TX4', 'amount': 250.0, 'transaction_type': 'Purchase', 'merchant_category': 'Electronics', 'location': 'Nigeria', 'device_type': 'Linux VM'}
    },
    {
        'name': '5. Missing optional information',
        'data': {'amount': 100.0, 'transaction_type': 'Purchase'}
    },
    {
        'name': '6. Invalid amount',
        'data': {'transaction_id': 'TX6', 'amount': -50.0, 'transaction_type': 'Purchase'}
    },
    {
        'name': '7. Multiple repeated requests',
        'data': {'transaction_id': 'TX7', 'amount': 20.0, 'transaction_type': 'Purchase', 'merchant_category': 'Grocery', 'location': 'Chicago', 'device_type': 'Mobile'}
    }
]

# For scenario 7, we'll run it 3 times to simulate repeated requests
expanded_scenarios = []
for s in scenarios:
    if s['name'].startswith('7'):
        for i in range(3):
            expanded_scenarios.append({
                'name': f"{s['name']} (Attempt {i+1})",
                'data': s['data']
            })
    else:
        expanded_scenarios.append(s)

for s in expanded_scenarios:
    print(f'\n--- Testing {s["name"]} ---')
    req = urllib.request.Request(url, data=json.dumps(s['data']).encode('utf-8'), headers=headers)
    start = time.time()
    try:
        with urllib.request.urlopen(req) as response:
            resp_time = time.time() - start
            body = json.loads(response.read().decode('utf-8'))
            print(f'HTTP Status: {response.status}')
            print(f'Time: {resp_time:.3f}s')
            
            # check for nan/null/infinity
            body_str = json.dumps(body)
            if 'NaN' in body_str or 'Infinity' in body_str:
                print(f'WARNING: Found invalid values: {body_str}')
            
            print(f'Risk Level: {body.get("risk_level")} | Score: {body.get("final_risk_score")} | Fraud Prob: {body.get("fraud_probability")}')
            print(f'XGB: {body.get("xgboost_score")} | IF: {body.get("isolation_forest_score")} | AE: {body.get("autoencoder_score")}')
            if body.get('explanations'):
                print(f'Top feature: {body["explanations"][0]}')
    except urllib.error.HTTPError as e:
        print(f'HTTP Status: {e.code}')
        print(f'Error Body: {e.read().decode("utf-8")}')
    except Exception as e:
        print(f'Error: {e}')
