import os
import sys
import logging
import pandas as pd
import numpy as np
import joblib
from pathlib import Path
from typing import Dict, Any

logger = logging.getLogger(__name__)

class FraudModelService:
    """
    Service layer bridging FastAPI and the Machine Learning models.
    Loads the trained pipeline (preprocessor + best model) using joblib.
    # Triggering uvicorn reload to pick up new models
    """
    _instance = None
    
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            logger.info("Initializing FraudModelService singleton...")
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        self.status = "initializing"
        self.models_loaded = {
            "xgboost": False,
            "isolation_forest": False, # Kept for API compatibility
            "autoencoder": False,      # Kept for API compatibility
            "explainer": False
        }
        
        self.preprocessor = None
        self.model = None
        
        try:
            models_dir = Path(__file__).resolve().parent.parent / "ml" / "models"
            preprocessor_path = models_dir / "preprocessor.joblib"
            model_path = models_dir / "best_fraud_model.joblib"
            
            if not preprocessor_path.exists() or not model_path.exists():
                logger.warning(f"ML models not found at {models_dir}. Please run train_pipeline.py first!")
                self.status = "models_missing"
                return
                
            logger.info("Loading ML Preprocessor...")
            self.preprocessor = joblib.load(preprocessor_path)
            
            logger.info("Loading Best Fraud Model...")
            self.model = joblib.load(model_path)
            
            # Since we loaded a model successfully, mark it as active
            self.models_loaded["xgboost"] = True
            
            self.status = "healthy"
            logger.info("FraudModelService loaded successfully.")
            
        except Exception as e:
            logger.error(f"Failed to load ML models: {e}")
            self.status = "error"
            self.error_message = str(e)
            
    def _map_frontend_to_ml_features(self, transaction: Any) -> pd.DataFrame:
        """
        Maps the simplified frontend JSON into a DataFrame that the ColumnTransformer can process.
        """
        data = {}
        
        # We must provide the columns that the preprocessor expects.
        # It expects all columns that were in X_train during fit.
        # Since we don't have all 300+ features from the frontend, we pad them.
        # However, to avoid hardcoding all 394 columns, we rely on the preprocessor's feature_names_in_
        if self.preprocessor is not None and hasattr(self.preprocessor, "feature_names_in_"):
            for col in self.preprocessor.feature_names_in_:
                data[col] = np.nan
        
        # Map known fields from the frontend
        if hasattr(transaction, 'amount') and transaction.amount is not None:
            data["TransactionAmt"] = transaction.amount
        if hasattr(transaction, 'transaction_type') and transaction.transaction_type is not None:
            data["ProductCD"] = transaction.transaction_type
        if hasattr(transaction, 'device_type') and transaction.device_type is not None:
            data["DeviceType"] = transaction.device_type
            
        df = pd.DataFrame([data])
        return df

    def predict(self, transaction: Any) -> Dict[str, Any]:
        """
        Runs the transaction through the trained ML pipeline.
        """
        if self.status != "healthy":
            return self._fallback_response(transaction, f"Model service is not healthy. Status: {self.status}. Please run backend/app/ml/train_pipeline.py")
            
        try:
            # 1. Map to DataFrame
            df_raw = self._map_frontend_to_ml_features(transaction)
            
            # 2. Preprocess
            X_processed = self.preprocessor.transform(df_raw)
            
            # 3. Predict Probability
            fraud_prob = self.model.predict_proba(X_processed)[0][1]
            risk_score = int(fraud_prob * 100)
            
            # 4. Determine Risk Level
            if risk_score > 80:
                risk_level = "CRITICAL"
                requires_investigation = True
            elif risk_score > 60:
                risk_level = "HIGH"
                requires_investigation = True
            elif risk_score > 30:
                risk_level = "MEDIUM"
                requires_investigation = False
            else:
                risk_level = "LOW"
                requires_investigation = False
                
            # 5. Simple mock explanations since full SHAP explainer requires more complex setup
            explanations = []
            if hasattr(transaction, 'amount') and transaction.amount > 1000:
                explanations.append({"feature": "Transaction Amount", "impact": "increases risk significantly", "value": f"₹{transaction.amount}"})
            
            # 6. Construct Response
            return {
                "transaction_id": transaction.transaction_id or "UNKNOWN",
                "risk_score": risk_score,
                "risk_level": risk_level,
                "fraud_probability": round(fraud_prob, 4),
                "is_fraud": requires_investigation,
                "requires_investigation": requires_investigation,
                "model_scores": {
                    "xgboost": risk_score,
                    "isolation_forest": 0, # Legacy fields kept for API stability
                    "autoencoder": 0       # Legacy fields kept for API stability
                },
                "model_status": "LIVE",
                "model_name": "XGBoost Hybrid Pipeline",
                "model_version": "1.0.0",
                "explanations": explanations
            }
            
        except Exception as e:
            logger.error("Prediction error occurred", exc_info=True)
            return self._fallback_response(transaction, f"Error processing prediction: {str(e)}")
            
    def _fallback_response(self, transaction: Any, message: str) -> Dict[str, Any]:
        """Returns a safe fallback response if ML fails."""
        return {
            "transaction_id": transaction.transaction_id or "UNKNOWN",
            "risk_score": 0,
            "risk_level": "LOW",
            "fraud_probability": 0.0,
            "is_fraud": False,
            "requires_investigation": False,
            "model_scores": {
                "xgboost": 0,
                "isolation_forest": 0,
                "autoencoder": 0
            },
            "explanations": [],
            "model_status": "ERROR",
            "model_name": "Fallback Security Engine",
            "model_version": "1.0.0",
            "message": message
        }

# Global instance initialized during module import
fraud_model_service = FraudModelService.get_instance()
