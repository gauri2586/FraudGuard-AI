import sys
sys.path.append('backend')
from app.services.fraud_model_service import fraud_model_service

class MockTx:
    transaction_id = '123'
    amount = 500
    transaction_type = 'W'
    device_type = 'mobile'

if __name__ == '__main__':
    result = fraud_model_service.predict(MockTx())
    import pprint
    pprint.pprint(result)
