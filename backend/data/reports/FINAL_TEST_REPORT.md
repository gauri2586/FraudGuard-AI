# FraudGuard AI - Final Automated Test Report

## Execution Summary
- **Execution Date**: 2026-08-15
- **Testing Framework**: `pytest` & `fastapi.testclient`
- **Target Component**: FastAPI Backend & ML Model Service
- **Status**: **ALL PASSED**

## Detailed Results

| Test | Result | Status | Notes |
| :--- | :--- | :--- | :--- |
| `1. GET /api/health` | HTTP 200 | PASSED | Verified API is alive and `FraudModelService` reports a valid status. |
| `2. POST /api/predict with valid data` | HTTP 200 | PASSED | Sent complete transaction payload. Model successfully returned risk scores. |
| `3. POST /api/predict with missing data` | HTTP 422 | PASSED | Removed required `amount` and `transaction_type`. Pydantic successfully rejected it. |
| `4. POST /api/predict with invalid data types` | HTTP 422 | PASSED | Sent `"not-a-number"` for `amount`. Pydantic correctly enforced `float` typing. |
| `5. Prediction response structure` | Verified | PASSED | Confirmed `transaction_id`, `risk_score`, `risk_level`, `fraud_probability`, and `explanations` fields exist. |
| `6. Risk score range` | Verified | PASSED | Evaluated `0 <= risk_score <= 100` assertion. |
| `7. Fraud probability range` | Verified | PASSED | Evaluated `0.0 <= fraud_probability <= 1.0` assertion. |
| `8. Risk level categories` | Verified | PASSED | Confirmed risk levels map precisely to `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL`. |
| `9. Model loading` | Verified | PASSED | Checked `fraud_model_service.status` to ensure ML pipeline singleton initializes without crashing. |
| `10. Database operations` | HTTP 200 | PASSED | Polled `/api/transactions` and `/api/alerts` to ensure mock JSON reads succeed. |
| `11. Error handling` | HTTP 404 | PASSED | Requested non-existent endpoint to confirm `404 Not Found` response. |

*Note: All tests were executed live within the backend's Python environment.*
