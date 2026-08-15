import os
import sys

# Ensure the ML directory is accessible for imports
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
project_root = os.path.dirname(backend_dir)
ml_dir = os.path.join(project_root, 'ml')
sys.path.append(ml_dir)

try:
    from inference.hybrid_engine import evaluate_transaction
    from explainability.shap_explainer import explain_transaction
except ImportError as e:
    print(f"WARNING: ML Modules not found. Ensure the ML pipeline is built. Error: {e}")
    # Provide dummy fallbacks if models aren't trained yet
    def evaluate_transaction(tx):
        return {
            "transaction_id": tx.get("transaction_id", "UNKNOWN"),
            "fraud_probability": 0.5,
            "anomaly_score_iforest": 50,
            "anomaly_score_autoencoder": 50,
            "behavioral_score": 50,
            "final_risk_score": 50,
            "risk_level": "MEDIUM",
            "contributing_factors": ["ML Models not loaded. Mock response."]
        }
    def explain_transaction(tx):
        return {
            "transaction_id": tx.get("transaction_id", "UNKNOWN"),
            "top_influencing_features": [],
            "human_readable_summary": "ML Models not loaded. Mock response."
        }

class MLService:
    @staticmethod
    def assess_risk(transaction_data: dict) -> dict:
        """
        Runs the transaction through the Hybrid Risk Engine.
        """
        # Convert timestamp to string if it's a datetime object (ML scripts expect string)
        if 'timestamp' in transaction_data and not isinstance(transaction_data['timestamp'], str):
            transaction_data['timestamp'] = transaction_data['timestamp'].strftime("%Y-%m-%d %H:%M:%S")
            
        return evaluate_transaction(transaction_data)

    @staticmethod
    def get_explanation(transaction_data: dict) -> dict:
        """
        Runs SHAP explainability on the transaction.
        """
        if 'timestamp' in transaction_data and not isinstance(transaction_data['timestamp'], str):
            transaction_data['timestamp'] = transaction_data['timestamp'].strftime("%Y-%m-%d %H:%M:%S")
            
        return explain_transaction(transaction_data)
