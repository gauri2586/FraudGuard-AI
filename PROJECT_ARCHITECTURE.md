# Project Architecture

## Frontend
- **Entry Point**: `frontend/src/main.tsx` and `frontend/src/App.tsx`
- **Routes**:
  - `/` (Dashboard)
  - `/simulator` (Simulator)
  - `/transactions` (Transactions)
  - `/alerts` (Alerts)
  - `/profile` (Profile)
  - `/risk` (User Risk)
  - `/investigation` (Investigation)
  - `/analytics` (Analytics)
  - `/performance` (Model Performance)
  - `/settings` (Settings)

## Backend
- **Entry Point**: `backend/app/main.py`
- **API Endpoints**:
  - `GET /api/health` - Health check and model status
  - `GET /api/transactions` - Returns seed transaction dataset
  - `GET /api/alerts` - Returns alerts generated from seed dataset
  - `GET /api/metrics` - Returns ML model training metrics
  - `POST /api/fraud/predict` - Accepts a transaction and evaluates it using the Hybrid Risk Engine
  - `GET /api/debug/env` - Debug environment information

## Simulator Flow
The `SimulatorPage` on the frontend allows users to construct transaction payloads. When triggered, it sends a request to the `POST /api/fraud/predict` endpoint. The backend processes the transaction using `fraud_model_service.predict()` which delegates to the loaded ML models to compute a risk score and explainability factors. The frontend then displays this prediction result dynamically.

## Machine Learning
- **ML-related Files**:
  - `backend/app/ml/train_pipeline.py`
  - `backend/app/services/fraud_model_service.py`
  - `backend/ml/` (training and preprocessing scripts like `train_xgboost.py`, `train_autoencoder.py`, `train_isolation_forest.py`, `preprocessing.py`)
  - `ml/` (standalone ML exploration and training pipelines in `ml/training/` and `ml/inference/`)
- **Dataset Locations**:
  - `backend/data/seed_transactions.json`
  - Database: `backend/fraudguard.db` (SQLite)
  - Raw data is generally ignored but typically placed in `backend/data/raw/` or `data/raw/`.
- **Model Locations**:
  - `backend/app/ml/models/` (contains `.joblib` models like `best_fraud_model.joblib`, `preprocessor.joblib`)
  - `backend/ml/artifacts/` (contains generated artifacts like `.keras`, `.joblib`, and `.json` model files)

## Environment Variables
Defined in `backend/.env` (template in `backend/.env.example`):
- `API_V1_STR` (e.g., `/api`)
- `PROJECT_NAME` (e.g., `"FraudGuard AI"`)
- `DATABASE_URL` (e.g., `sqlite:///./fraudguard.db`)
- `API_KEY`

## Run Commands
- **Frontend**:
  ```bash
  cd frontend
  npm run dev
  ```
- **Backend**:
  ```bash
  cd backend
  # Activate virtual environment
  .\venv\Scripts\activate
  # Run the Uvicorn server
  uvicorn app.main:app --reload
  ```
