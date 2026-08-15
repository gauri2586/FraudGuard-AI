import os
import sys
import json

base_dir = os.path.dirname(__file__)
if base_dir not in sys.path:
    sys.path.append(base_dir)

from app.services.fraud_model_service import fraud_model_service

class MockTransaction:
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)

print("--- Testing Model Service Status ---")
print(f"Status: {fraud_model_service.status}")
print(f"Models: {fraud_model_service.models_loaded}")

print("\n--- Testing Model Service Prediction ---")
tx = MockTransaction(
    transaction_id="TEST-999",
    amount=5000.00,
    transaction_type="W",
    device_type="mobile",
    transaction_frequency=12,
    time_since_last_transaction=30
)

result = fraud_model_service.predict(tx)
print(json.dumps(result, indent=2))
