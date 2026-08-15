from sqlalchemy.orm import Session
from app.models.domain import Transaction, Alert, Feedback
from app.schemas.domain import TransactionCreate, InvestigationCreate, FeedbackCreate
from app.services.ml_service import MLService
from typing import List

class APIService:
    
    @staticmethod
    def process_new_transaction(db: Session, tx_in: TransactionCreate) -> dict:
        """
        Orchestrates the entire prediction, explanation, and storage flow.
        """
        tx_data = tx_in.dict()
        
        # 1. Run ML Prediction
        risk_assessment = MLService.assess_risk(tx_data)
        
        # 2. Run SHAP Explanation
        explanation = MLService.get_explanation(tx_data)
        
        # 3. Save to Database
        db_tx = Transaction(
            id=tx_in.transaction_id,
            user_id=tx_in.user_id,
            amount=tx_in.amount,
            merchant_category=tx_in.merchant_category,
            location=tx_in.location,
            device_type=tx_in.device_type,
            timestamp=tx_in.timestamp,
            fraud_probability=risk_assessment['fraud_probability'],
            anomaly_score_iforest=risk_assessment['anomaly_score_iforest'],
            anomaly_score_autoencoder=risk_assessment['anomaly_score_autoencoder'],
            behavioral_score=risk_assessment['behavioral_score'],
            final_risk_score=risk_assessment['final_risk_score'],
            risk_level=risk_assessment['risk_level'],
            contributing_factors=risk_assessment['contributing_factors'],
            shap_explanation=explanation
        )
        db.add(db_tx)
        
        # 4. Create an Alert if HIGH or CRITICAL
        if risk_assessment['risk_level'] in ['HIGH', 'CRITICAL']:
            alert = Alert(
                transaction_id=tx_in.transaction_id,
                severity=risk_assessment['risk_level']
            )
            db.add(alert)
            
        db.commit()
        
        # 5. Construct Response
        response = risk_assessment.copy()
        response['shap_explanation'] = explanation
        return response

    @staticmethod
    def get_transactions(db: Session, skip: int = 0, limit: int = 100) -> List[Transaction]:
        return db.query(Transaction).order_by(Transaction.timestamp.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_transaction(db: Session, tx_id: str) -> Transaction:
        return db.query(Transaction).filter(Transaction.id == tx_id).first()

    @staticmethod
    def get_alerts(db: Session, skip: int = 0, limit: int = 100) -> List[Alert]:
        return db.query(Alert).order_by(Alert.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def update_investigation(db: Session, inv_in: InvestigationCreate) -> Alert:
        alert = db.query(Alert).filter(Alert.transaction_id == inv_in.transaction_id).first()
        if alert:
            alert.status = inv_in.status
            alert.resolution_notes = inv_in.resolution_notes
            db.commit()
            db.refresh(alert)
        return alert

    @staticmethod
    def save_feedback(db: Session, feedback_in: FeedbackCreate) -> Feedback:
        feedback = Feedback(
            transaction_id=feedback_in.transaction_id,
            is_fraud=feedback_in.is_fraud,
            notes=feedback_in.notes
        )
        db.add(feedback)
        db.commit()
        db.refresh(feedback)
        return feedback
