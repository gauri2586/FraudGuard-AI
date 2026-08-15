from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, JSON, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base

class Transaction(Base):
    __tablename__ = "transactions"

    transaction_id = Column(String, primary_key=True, index=True)
    amount = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    transaction_type = Column(String, nullable=True)
    merchant_category = Column(String)
    location = Column(String, nullable=True)
    device_type = Column(String)
    
    # Risk Assessment
    risk_score = Column(Float)
    risk_level = Column(String)
    fraud_probability = Column(Float)
    is_fraud = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    model_predictions = relationship("ModelPrediction", back_populates="transaction", cascade="all, delete-orphan")
    alert = relationship("FraudAlert", back_populates="transaction", uselist=False, cascade="all, delete-orphan")


class ModelPrediction(Base):
    __tablename__ = "model_predictions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    transaction_id = Column(String, ForeignKey("transactions.transaction_id"), index=True)
    xgboost_score = Column(Float, nullable=True)
    isolation_forest_score = Column(Float, nullable=True)
    autoencoder_score = Column(Float, nullable=True)
    hybrid_score = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    transaction = relationship("Transaction", back_populates="model_predictions")


class FraudAlert(Base):
    __tablename__ = "fraud_alerts"

    alert_id = Column(Integer, primary_key=True, autoincrement=True)
    transaction_id = Column(String, ForeignKey("transactions.transaction_id"), index=True)
    severity = Column(String) # MEDIUM, HIGH, CRITICAL
    status = Column(String, default="NEW", index=True) # NEW, INVESTIGATING, RESOLVED, FALSE_POSITIVE
    reason = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    transaction = relationship("Transaction", back_populates="alert")
