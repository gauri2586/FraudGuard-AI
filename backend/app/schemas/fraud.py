from pydantic import BaseModel, Field
from typing import Optional

class TransactionInput(BaseModel):
    """
    Schema for validating incoming transaction data.
    These fields will eventually be passed to the ML models.
    """
    transaction_id: Optional[str] = Field(None, max_length=100, description="Unique identifier for the transaction")
    amount: float = Field(..., gt=0, description="Transaction amount")
    transaction_type: str = Field(..., max_length=50, description="Type of transaction (e.g., Transfer, Purchase)")
    merchant_category: Optional[str] = Field(None, max_length=100, description="Category of the merchant")
    location: Optional[str] = Field(None, max_length=100, description="Transaction location (e.g., city or country code)")
    device_type: Optional[str] = Field(None, max_length=50, description="Device used (e.g., Mobile, Desktop)")
    account_age_days: Optional[int] = Field(None, ge=0, description="Age of the user's account in days")
    transaction_frequency: Optional[int] = Field(None, ge=0, description="Number of transactions in the last 24h")
    previous_transaction_amount: Optional[float] = Field(None, ge=0, description="Amount of the previous transaction")
    time_since_last_transaction: Optional[int] = Field(None, ge=0, description="Seconds since last transaction")
    is_international: Optional[bool] = Field(False, description="Whether the transaction crosses borders")
    has_new_device: Optional[bool] = Field(False, description="Whether this is the first time using this device")

class FraudPredictionResponse(BaseModel):
    """
    Schema for the response returned by the prediction endpoint.
    Now supports full ML output.
    """
    transaction_id: str
    risk_score: int
    risk_level: str
    fraud_probability: float
    is_fraud: bool
    requires_investigation: bool
    model_scores: dict
    explanations: list
    model_status: str
    model_name: Optional[str] = "XGBoost Hybrid Pipeline"
    model_version: Optional[str] = "1.0.0"
    message: Optional[str] = None
