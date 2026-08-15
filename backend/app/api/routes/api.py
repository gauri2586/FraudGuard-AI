from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.core.security import get_api_key
from app.schemas.domain import (
    TransactionCreate, RiskAssessmentResponse, 
    TransactionResponse, AlertResponse,
    InvestigationCreate, FeedbackCreate
)
from app.services.api_service import APIService

router = APIRouter()

@router.post("/predict", response_model=RiskAssessmentResponse, tags=["ML Engine"])
def predict_fraud(tx_in: TransactionCreate, db: Session = Depends(get_db), api_key: str = Depends(get_api_key)):
    """
    Ingests a new transaction, runs it through the ML Hybrid Engine, calculates SHAP explainability, 
    saves everything to the database, and generates an Alert if necessary.
    """
    return APIService.process_new_transaction(db, tx_in)

@router.get("/transactions", response_model=List[TransactionResponse], tags=["Data"])
def list_transactions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), api_key: str = Depends(get_api_key)):
    """Lists recent transactions."""
    return APIService.get_transactions(db, skip=skip, limit=limit)

@router.get("/transactions/{tx_id}", response_model=TransactionResponse, tags=["Data"])
def get_transaction(tx_id: str, db: Session = Depends(get_db), api_key: str = Depends(get_api_key)):
    """Get a specific transaction by ID."""
    tx = APIService.get_transaction(db, tx_id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx

@router.get("/alerts", response_model=List[AlertResponse], tags=["Data"])
def list_alerts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), api_key: str = Depends(get_api_key)):
    """Lists generated fraud alerts."""
    return APIService.get_alerts(db, skip=skip, limit=limit)

@router.post("/investigations", tags=["Operations"])
def update_investigation(inv_in: InvestigationCreate, db: Session = Depends(get_db), api_key: str = Depends(get_api_key)):
    """Updates the status of an alert after human analyst review."""
    alert = APIService.update_investigation(db, inv_in)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found for this transaction ID")
    return {"status": "success", "alert_id": alert.id, "new_status": alert.status}

@router.post("/feedback", tags=["Operations"])
def submit_feedback(feedback_in: FeedbackCreate, db: Session = Depends(get_db), api_key: str = Depends(get_api_key)):
    """Submits True Positive / False Positive feedback to retrain future models."""
    feedback = APIService.save_feedback(db, feedback_in)
    return {"status": "success", "feedback_id": feedback.id}

@router.get("/users", tags=["Data"])
def get_users(api_key: str = Depends(get_api_key)):
    """Placeholder for aggregated user behavioral profiles."""
    return {"message": "User endpoint initialized. Aggregation logic pending."}

@router.get("/users/{user_id}", tags=["Data"])
def get_user_profile(user_id: str, api_key: str = Depends(get_api_key)):
    """Placeholder for specific user behavioral profile."""
    return {"user_id": user_id, "risk_score": 50, "status": "active"}

@router.get("/analytics", tags=["Dashboards"])
def get_analytics(api_key: str = Depends(get_api_key)):
    """Placeholder for system-wide analytics aggregation."""
    return {"fraud_rate": 1.5, "total_volume": 15000}

@router.get("/model-performance", tags=["Dashboards"])
def get_model_performance(api_key: str = Depends(get_api_key)):
    """Placeholder for ML evaluation metrics."""
    return {"xgboost_f1": 0.92, "iforest_precision": 0.85}
