from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime

# ==========================================
# Input Schemas
# ==========================================

class TransactionCreate(BaseModel):
    transaction_id: str = Field(..., max_length=100, description="Unique transaction ID")
    user_id: str = Field(..., max_length=100, description="User ID")
    amount: float = Field(..., ge=0, description="Transaction amount")
    merchant_category: str = Field(..., max_length=100, description="Category of merchant")
    location: Optional[str] = Field(None, max_length=100, description="Physical location or IP geolocation")
    device_type: str = Field(..., max_length=50, description="Device used (Mobile_App, Desktop_Web, etc)")
    timestamp: datetime = Field(..., description="Time of transaction")

class InvestigationCreate(BaseModel):
    transaction_id: str = Field(..., max_length=100)
    status: str = Field(..., max_length=50) # INVESTIGATING, CONFIRMED_FRAUD, FALSE_POSITIVE, RESOLVED
    resolution_notes: Optional[str] = Field(None, max_length=2000)

class FeedbackCreate(BaseModel):
    transaction_id: str = Field(..., max_length=100)
    is_fraud: bool
    notes: Optional[str] = Field(None, max_length=2000)

# ==========================================
# Output Schemas (Responses)
# ==========================================

class SHAPExplanation(BaseModel):
    feature: str
    contribution: float
    direction: str
    human_readable_explanation: str

class RiskAssessmentResponse(BaseModel):
    transaction_id: str
    fraud_probability: float
    anomaly_score_iforest: float
    anomaly_score_autoencoder: float
    behavioral_score: float
    final_risk_score: float
    risk_level: str
    contributing_factors: List[str]
    shap_explanation: Optional[Dict[str, Any]] = None

class TransactionResponse(BaseModel):
    id: str
    user_id: str
    amount: float
    merchant_category: str
    location: Optional[str] = None
    device_type: str
    timestamp: datetime
    fraud_probability: float
    final_risk_score: float
    risk_level: str
    
    class Config:
        from_attributes = True

class AlertResponse(BaseModel):
    id: int
    transaction_id: str
    severity: str
    status: str
    created_at: datetime
    transaction: TransactionResponse
    
    class Config:
        from_attributes = True
