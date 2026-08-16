import os
import sys
import logging
import pandas as pd
import numpy as np
import joblib
from pathlib import Path
from typing import Dict, Any

from ml.risk_engine import hybrid_risk_engine

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
        self.explainer = None
        self.feature_names = None
        self.iforest = None
        self.iforest_scaler = None
        self.autoencoder = None
        self.autoencoder_scaler = None
        
        try:
            models_dir = Path(__file__).resolve().parent.parent.parent / "ml" / "artifacts"
            preprocessor_path = models_dir / "preprocessing_pipeline.joblib"
            model_path = models_dir / "xgboost_fraud_model.json"
            iforest_path = models_dir / "isolation_forest.joblib"
            iforest_scaler_path = models_dir / "iforest_scaler.joblib"
            autoencoder_path = models_dir / "autoencoder.joblib"
            autoencoder_scaler_path = models_dir / "autoencoder_scaler.joblib"
            
            if not preprocessor_path.exists():
                logger.warning(f"ML preprocessor not found at {preprocessor_path}. Please run prepare_data.py first!")
                self.status = "models_missing"
                return
                
            logger.info("Loading ML Preprocessor...")
            self.preprocessor = joblib.load(preprocessor_path)
            
            if model_path.exists():
                from xgboost import XGBClassifier
                logger.info("Loading Best Fraud Model (XGBoost)...")
                # Load XGBoost model using native method
                self.model = XGBClassifier()
                self.model.load_model(model_path)
                self.models_loaded["xgboost"] = True
                self.status = "healthy"
                
                try:
                    import shap
                    self.explainer = shap.TreeExplainer(self.model)
                    
                    # Try to get feature names by rebuilding the config
                    try:
                        import sys
                        backend_dir = Path(__file__).resolve().parent.parent.parent
                        if str(backend_dir) not in sys.path:
                            sys.path.append(str(backend_dir))
                        from ml.preprocessing import build_preprocessing_pipeline
                        _, final_num_cols, final_cat_cols = build_preprocessing_pipeline()
                        self.feature_names = final_num_cols + final_cat_cols
                    except Exception as e:
                        logger.warning(f"Could not load feature names for SHAP: {e}")
                        self.feature_names = None
                except ImportError:
                    logger.warning("SHAP is not installed. Explanations will use fallback.")
                    self.explainer = None
            else:
                logger.warning(f"XGBoost model not found at {model_path}")
                self.status = "models_missing"
                
            if iforest_path.exists() and iforest_scaler_path.exists():
                logger.info("Loading Isolation Forest Model...")
                self.iforest = joblib.load(iforest_path)
                self.iforest_scaler = joblib.load(iforest_scaler_path)
                self.models_loaded["isolation_forest"] = True
                
            if autoencoder_path.exists() and autoencoder_scaler_path.exists():
                logger.info("Loading Autoencoder Model...")
                self.autoencoder = joblib.load(autoencoder_path)
                self.autoencoder_scaler = joblib.load(autoencoder_scaler_path)
                self.models_loaded["autoencoder"] = True
                
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
        
        # Pad all required columns with NaN so inference pipeline doesn't crash on incomplete API requests
        try:
            import sys
            backend_dir = Path(__file__).resolve().parent.parent.parent
            if str(backend_dir) not in sys.path:
                sys.path.append(str(backend_dir))
            from ml.feature_config import NUMERICAL_COLS, CATEGORICAL_COLS, ENGINEERED_NUMERICAL_COLS, ENGINEERED_CATEGORICAL_COLS, TIME_COL
            for col in NUMERICAL_COLS + CATEGORICAL_COLS + ENGINEERED_NUMERICAL_COLS + ENGINEERED_CATEGORICAL_COLS + [TIME_COL]:
                data[col] = np.nan
        except Exception as e:
            logger.warning(f"Could not load feature configs for padding: {e}")
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
            error_details = getattr(self, 'error_message', 'Models missing or not trained.')
            return self._fallback_response(transaction, f"Model service is offline. Reason: {error_details}")
            
        try:
            # 1. Map to DataFrame
            df_raw = self._map_frontend_to_ml_features(transaction)
            
            # 2. Preprocess
            X_processed = self.preprocessor.transform(df_raw)
            
            # 3. Predict Probability (XGBoost)
            risk_score = 0
            fraud_prob = 0.0
            if self.model is not None:
                fraud_prob = float(self.model.predict_proba(X_processed)[0][1])
                risk_score = int(fraud_prob * 100)
                
            # 4. Predict Anomaly (Isolation Forest)
            iforest_score_normalized = 0
            if self.iforest is not None and self.iforest_scaler is not None:
                raw_score = -self.iforest.decision_function(X_processed)[0]
                scaled_score = self.iforest_scaler.transform([[raw_score]])[0][0]
                iforest_score_normalized = int(np.clip(scaled_score, 0, 100))
                    
            # 5. Predict Anomaly (Autoencoder)
            autoencoder_score_normalized = 0
            if self.autoencoder is not None and self.autoencoder_scaler is not None:
                pred = self.autoencoder.predict(X_processed)
                mse = np.mean(np.square(X_processed - pred), axis=1)[0]
                scaled_ae = self.autoencoder_scaler.transform([[mse]])[0][0]
                autoencoder_score_normalized = int(np.clip(scaled_ae, 0, 100))
            
            # 6. Hybrid Risk Level via Dedicated Engine
            engine_result = hybrid_risk_engine.evaluate(
                xgb_prob=fraud_prob,
                iforest_score_normalized=iforest_score_normalized,
                ae_score_normalized=autoencoder_score_normalized
            )
                
            # 7. Generate Explanations using SHAP
            explanations = []
            
            if self.explainer is not None and self.feature_names is not None:
                try:
                    # XGBoost SHAP values
                    shap_vals = self.explainer.shap_values(X_processed)
                    
                    # Ensure it's a 1D array
                    if len(shap_vals.shape) == 2:
                        shap_vals_1d = shap_vals[0]
                    else:
                        shap_vals_1d = shap_vals
                        
                    # Filter out NaNs just in case
                    valid_indices = [i for i, v in enumerate(shap_vals_1d) if not np.isnan(v)]
                    
                    # Get top 3 features with highest absolute SHAP values
                    feature_impacts = [(i, shap_vals_1d[i]) for i in valid_indices]
                    feature_impacts.sort(key=lambda x: abs(x[1]), reverse=True)
                    top_impacts = feature_impacts[:3]
                    
                    for i, shap_val in top_impacts:
                        if abs(shap_val) < 0.01:
                            continue # Skip insignificant features
                            
                        feature_name = self.feature_names[i] if i < len(self.feature_names) else f"Feature_{i}"
                        feature_value = X_processed[0][i]
                        
                        # Handle NaN values for display
                        display_val = "Unknown" if np.isnan(feature_value) else float(round(feature_value, 2))
                        
                        effect = "increases_risk" if shap_val > 0 else "decreases_risk"
                        effect_text = "increased" if shap_val > 0 else "decreased"
                        
                        explanations.append({
                            "feature": feature_name,
                            "value": display_val,
                            "shap_value": float(round(shap_val, 4)),
                            "effect": effect,
                            "explanation": f"{feature_name} {effect_text} the predicted fraud risk."
                        })
                except Exception as e:
                    logger.error(f"SHAP explanation failed: {e}")
                    explanations.append({
                        "feature": "Unknown",
                        "value": "N/A",
                        "shap_value": 0.0,
                        "effect": "increases_risk",
                        "explanation": "Explanation unavailable for this transaction"
                    })
            else:
                explanations.append({
                    "feature": "Unknown",
                    "value": "N/A",
                    "shap_value": 0.0,
                    "effect": "increases_risk",
                    "explanation": "Explanation unavailable for this transaction"
                })
            
            # Add unsupervised anomaly signals if present
            if iforest_score_normalized > 70:
                explanations.append({
                    "feature": "Behavioral Anomaly (Isolation Forest)", 
                    "value": f"{iforest_score_normalized}/100",
                    "shap_value": 0.5,
                    "effect": "increases_risk",
                    "explanation": "Unusual pattern detected"
                })
                
            if autoencoder_score_normalized > 70:
                explanations.append({
                    "feature": "Reconstruction Error (Autoencoder)", 
                    "value": f"{autoencoder_score_normalized}/100",
                    "shap_value": 0.5,
                    "effect": "increases_risk",
                    "explanation": "High deviation from normal"
                })
            
            # 8. Construct Response
            # We merge the engine_result with the fields the frontend explicitly expects
            response = {
                "transaction_id": getattr(transaction, 'transaction_id', None) or "UNKNOWN",
                
                # New standard risk engine fields
                "fraud_probability": engine_result["fraud_probability"],
                "xgboost_score": engine_result["xgboost_score"],
                "isolation_forest_score": engine_result["isolation_forest_score"],
                "autoencoder_score": engine_result["autoencoder_score"],
                "final_risk_score": engine_result["final_risk_score"],
                "risk_level": engine_result["risk_level"],
                "fraud_detected": engine_result["fraud_detected"],
                
                # Legacy compatibility fields for existing React UI
                "risk_score": engine_result["final_risk_score"],
                "is_fraud": engine_result["fraud_detected"],
                "requires_investigation": engine_result["fraud_detected"],
                "model_scores": {
                    "xgboost": engine_result["xgboost_score"],
                    "isolation_forest": engine_result["isolation_forest_score"],
                    "autoencoder": engine_result["autoencoder_score"]
                },
                "model_status": "LIVE",
                "model_name": "FraudGuard Hybrid Engine",
                "model_version": "2.0.0",
                "explanations": explanations
            }
            return response
            
        except Exception as e:
            logger.error("Prediction error occurred", exc_info=True)
            return self._fallback_response(transaction, f"Error processing prediction: {str(e)}")
            
    def _fallback_response(self, transaction: Any, message: str) -> Dict[str, Any]:
        """Returns a safe fallback response if ML fails."""
        return {
            "transaction_id": getattr(transaction, 'transaction_id', None) or "UNKNOWN",
            "fraud_probability": 0.0,
            "fraud_detected": False,
            "final_risk_score": 0,
            "risk_level": "LOW",
            "xgboost_score": 0,
            "isolation_forest_score": 0,
            "autoencoder_score": 0,
            "explanations": [],
            "model_status": "ERROR",
            "model_name": "Fallback Security Engine",
            "model_version": "1.0.0",
            "message": message,
            # Legacy compatibility fields
            "risk_score": 0,
            "is_fraud": False,
            "requires_investigation": False,
            "model_scores": {
                "xgboost": 0,
                "isolation_forest": 0,
                "autoencoder": 0
            }
        }

# Global instance initialized during module import
fraud_model_service = FraudModelService.get_instance()
