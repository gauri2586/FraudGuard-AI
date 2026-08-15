import unittest
from hybrid_engine import evaluate_behavioral_indicators, evaluate_transaction
from unittest.mock import patch

class TestHybridEngine(unittest.TestCase):

    def test_behavioral_indicators_low_risk(self):
        """Test that a perfectly normal transaction gets a score of 0"""
        tx = {
            "timestamp": "2023-11-01 14:30:00", # 2:30 PM
            "amount": 45.00,
            "merchant_category": "Groceries",
            "device_type": "Mobile_App"
        }
        score, factors = evaluate_behavioral_indicators(tx)
        self.assertEqual(score, 0)
        self.assertEqual(len(factors), 0)
        
    def test_behavioral_indicators_high_risk(self):
        """Test that a highly suspicious transaction accumulates behavioral risk"""
        tx = {
            "timestamp": "2023-11-01 02:30:00", # 2:30 AM (+30)
            "amount": 6000.00,                  # > 5000 (+40)
            "merchant_category": "Crypto",      # High risk (+20)
            "device_type": "API"                # API (+30)
        }
        score, factors = evaluate_behavioral_indicators(tx)
        # Should cap at 100 (30+40+20+30 = 120 -> 100)
        self.assertEqual(score, 100)
        self.assertTrue("Late night transaction" in factors)
        
    # We patch the individual model predictions so we can test the Scoring Strategy logic
    # without needing the actual model files loaded.
    @patch('hybrid_engine.xgb_predict')
    @patch('hybrid_engine.if_predict')
    @patch('hybrid_engine.ae_predict')
    def test_base_weighted_scoring(self, mock_ae, mock_if, mock_xgb):
        """Test the standard weighted average (No critical overrides)"""
        # Mock moderate scores that shouldn't trigger vetoes
        mock_xgb.return_value = {"fraud_probability": 0.50} # 50 score
        mock_if.return_value = {"anomaly_score": 60}
        mock_ae.return_value = {"normalized_anomaly_score": 50}
        
        tx = {
            "transaction_id": "TX-1",
            "timestamp": "2023-11-01 14:30:00", 
            "amount": 45.00,
            "merchant_category": "Groceries",
            "device_type": "Mobile_App"
        }
        
        # Beh score for this is 0.
        # XGB: 50 * 0.40 = 20
        # AE:  50 * 0.25 = 12.5
        # IF:  60 * 0.20 = 12
        # BEH: 0  * 0.15 = 0
        # Total Base: 44.5 -> MEDIUM
        
        result = evaluate_transaction(tx)
        self.assertEqual(result["final_risk_score"], 44.5)
        self.assertEqual(result["risk_level"], "MEDIUM")
        
    @patch('hybrid_engine.xgb_predict')
    @patch('hybrid_engine.if_predict')
    @patch('hybrid_engine.ae_predict')
    def test_critical_override_xgboost(self, mock_ae, mock_if, mock_xgb):
        """Test that if XGBoost is > 90, the final score vetoes a low average"""
        mock_xgb.return_value = {"fraud_probability": 0.95} # 95 score
        mock_if.return_value = {"anomaly_score": 0}
        mock_ae.return_value = {"normalized_anomaly_score": 0}
        
        tx = {
            "transaction_id": "TX-2",
            "timestamp": "2023-11-01 14:30:00", 
            "amount": 45.00
        }
        
        # Without veto, average would be (95 * 0.4) = 38 (Medium).
        # But Veto rule says if XGB >= 90, final_score = max(final_score, xgb_score)
        
        result = evaluate_transaction(tx)
        self.assertEqual(result["final_risk_score"], 95)
        self.assertEqual(result["risk_level"], "CRITICAL")
        self.assertTrue(any("Known fraud" in factor for factor in result["contributing_factors"]))

    @patch('hybrid_engine.xgb_predict')
    @patch('hybrid_engine.if_predict')
    @patch('hybrid_engine.ae_predict')
    def test_critical_override_autoencoder(self, mock_ae, mock_if, mock_xgb):
        """Test that a 0-day attack missed by XGBoost but caught by AE triggers a veto"""
        mock_xgb.return_value = {"fraud_probability": 0.05} # XGBoost misses it (5)
        mock_if.return_value = {"anomaly_score": 0}
        mock_ae.return_value = {"normalized_anomaly_score": 99} # AE catches it
        
        tx = {
            "transaction_id": "TX-3",
            "timestamp": "2023-11-01 14:30:00", 
            "amount": 45.00
        }
        
        # Veto rule says if AE >= 95, final_score = max(final_score, 85)
        
        result = evaluate_transaction(tx)
        self.assertEqual(result["final_risk_score"], 85)
        self.assertEqual(result["risk_level"], "CRITICAL")
        self.assertTrue(any("Severe behavioral anomaly" in factor for factor in result["contributing_factors"]))


if __name__ == '__main__':
    unittest.main()
