# FraudGuard AI Backend

This is the foundational FastAPI backend for the FraudGuard AI project. It provides a simple API structure that will eventually connect to the Python ML models (XGBoost, Isolation Forest).

Currently, this backend serves a clean architecture with placeholder demo responses. 

## Getting Started on Windows

Follow these steps to set up and run the backend:

### 1. Create a Python Virtual Environment
Open your terminal (PowerShell or Command Prompt) and navigate to this `backend` folder. Run:
```bash
python -m venv venv
```

### 2. Activate the Virtual Environment
On Windows, activate the environment by running:
```bash
.\venv\Scripts\activate
```
*(You should see `(venv)` appear at the beginning of your terminal prompt).*

### 3. Install Requirements
With the virtual environment activated, install the minimal dependencies:
```bash
pip install -r requirements.txt
```

### 4. Start the FastAPI Server
Run the application using Uvicorn with hot-reloading enabled:
```bash
uvicorn app.main:app --reload
```
The backend will start running at `http://127.0.0.1:8000`.

---

## Testing the Endpoints

Once the server is running, you can test the APIs:

### 1. Health Check
Open your browser and visit:
[http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

You should see:
```json
{
  "status": "healthy",
  "service": "FraudGuard AI",
  "version": "1.0.0"
}
```

### 2. Interactive API Documentation
FastAPI automatically generates interactive Swagger documentation. Visit:
[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

From here, you can visually test the `POST /api/fraud/predict` endpoint without needing Postman.

## Future ML Integration
Later in the project, the actual ML algorithms will be implemented inside the `backend/app/ml/` folder and imported into `backend/app/api/routes.py` to replace the demo response with real predictions.
