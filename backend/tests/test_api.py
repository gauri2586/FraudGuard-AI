import os
import sys
import pytest
from fastapi.testclient import TestClient

# Add backend to path so we can import app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Set mock env vars before importing app
os.environ["DATABASE_URL"] = "sqlite:///./mock.db"
os.environ["API_KEY"] = "mock_api_key_for_testing"

from app.main import app
from app.services.fraud_model_service import fraud_model_service

client = TestClient(app)

def test_health_check():
    """1. GET /api/health"""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "service" in data
    assert "version" in data
    assert "models" in data
    # Allow either models_missing or healthy depending on if training was run before tests
    assert data["status"] in ["healthy", "models_missing", "initializing", "error", "degraded"]

def test_predict_valid_data():
    """2. POST /api/predict with valid data"""
    valid_payload = {
        "transaction_id": "TEST-123",
        "amount": 500.0,
        "transaction_type": "Purchase",
        "merchant_category": "Electronics",
        "location": "NY",
        "device_type": "Mobile",
        "account_age_days": 100,
        "transaction_frequency": 5,
        "previous_transaction_amount": 100.0,
        "time_since_last_transaction": 3600,
        "is_international": False,
        "has_new_device": False
    }
    response = client.post("/api/fraud/predict", json=valid_payload)
    assert response.status_code == 200
    data = response.json()
    
    # 5. Prediction response structure
    assert "transaction_id" in data
    assert "risk_score" in data
    assert "risk_level" in data
    assert "fraud_probability" in data
    assert "is_fraud" in data
    assert "requires_investigation" in data
    
    # 6. Risk score range must be 0-100
    assert 0 <= data["risk_score"] <= 100
    
    # 7. Fraud probability must be between 0 and 1
    assert 0.0 <= data["fraud_probability"] <= 1.0
    
    # 8. Risk level must be LOW, MEDIUM, HIGH, or CRITICAL
    assert data["risk_level"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

def test_predict_missing_data():
    """3. POST /api/predict with missing data"""
    # missing 'amount' and 'transaction_type' which are required
    invalid_payload = {
        "transaction_id": "TEST-123"
    }
    response = client.post("/api/fraud/predict", json=invalid_payload)
    assert response.status_code == 422 # Unprocessable Entity (Pydantic validation error)

def test_predict_invalid_data_types():
    """4. POST /api/predict with invalid data types"""
    invalid_payload = {
        "transaction_id": "TEST-123",
        "amount": "not-a-number",
        "transaction_type": "Purchase"
    }
    response = client.post("/api/fraud/predict", json=invalid_payload)
    assert response.status_code == 422 # Pydantic validation error

def test_model_loading_status():
    """9. Model loading"""
    # The models are loaded in fraud_model_service. Check its status property directly
    assert hasattr(fraud_model_service, "status")
    assert fraud_model_service.status in ["healthy", "models_missing", "error", "initializing"]

def test_database_operations():
    """10. Database operations (Mock JSON DB)"""
    response = client.get("/api/transactions")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    
    response = client.get("/api/alerts")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_error_handling_unknown_route():
    """11. Error handling for unknown route"""
    response = client.get("/api/this-route-does-not-exist")
    assert response.status_code == 404
