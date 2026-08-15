# FRAUDGUARD AI - Roadmap & Implementation Plan

Welcome to the FraudGuard AI project! As your senior architect and mentor, I've designed this roadmap to take you from a beginner to building a serious, enterprise-level AI application. 

We will build this iteratively. Do not worry about understanding everything at once; we will focus on one phase at a time.

## Architecture Overview
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui (for UI components), Recharts (for charts), Framer Motion (for animations).
- **Backend**: Python, FastAPI (for building APIs quickly and safely).
- **Database**: PostgreSQL (relational database to store transactions and users).
- **Machine Learning**: Scikit-learn, XGBoost, TensorFlow (Autoencoders), SHAP (for explainability).

---

## Phase 1: Project Skeleton & Foundation
**What we are building:**
We will set up the foundational folders and applications for both the frontend and backend. We won't write complex logic yet, just make sure our React app can talk to our Python API.

**Files to create:**
- `frontend/`: (Generated via Vite) `package.json`, `index.html`, `src/App.tsx`.
- `backend/`: `main.py`, `requirements.txt`.
- `backend/core/config.py`: For environment variables (database URLs, etc.).

**Why we need them:**
This is the starting point. `App.tsx` is our main UI file, and `main.py` is the entry point for our backend server.

**How components communicate:**
The frontend will make a simple HTTP request to a `/health` endpoint on the backend just to verify communication.

**How to test:**
- Run `npm run dev` in the frontend folder and see the React logo.
- Run `uvicorn main:app --reload` in the backend folder and visit `http://localhost:8000/docs` to see the FastAPI Swagger UI.

---

## Phase 2: Database Design & Backend CRUD
**What we are building:**
We will set up PostgreSQL and write the Python code to connect to it. We will define our database tables (Users, Transactions, Alerts).

**Files to create:**
- `backend/models/`: `user.py`, `transaction.py` (SQLAlchemy models).
- `backend/schemas/`: `transaction_schema.py` (Pydantic models for data validation).
- `backend/api/`: `routes.py` (API endpoints).
- `backend/database.py`: Database connection setup.

**Why we need them:**
We need a place to store millions of transactions securely. Models define the database structure, schemas validate the data coming from the frontend, and routes are the URLs the frontend will call.

**How components communicate:**
FastAPI receives a JSON request (e.g., a new transaction), Pydantic checks if it has the right fields (amount, user_id), and SQLAlchemy saves it to PostgreSQL.

**How to test:**
Use the FastAPI Swagger UI (`/docs`) to manually insert a transaction into the database and retrieve it.

---

## Phase 3: Machine Learning Model Development (Offline)
**What we are building:**
Before we put AI in our app, we must train it. We will create scripts to train our 3 models: XGBoost (Classification), Isolation Forest, and Autoencoder (Anomaly Detection).

**Files to create:**
- `ml_pipeline/`: `dataset.csv` (synthetic fraud data).
- `ml_pipeline/train_xgboost.py`
- `ml_pipeline/train_anomaly.py`
- `backend/ml_models/`: (This is where we will save our trained `.pkl` and `.h5` files).

**Why we need them:**
AI models need to learn from historical data before they can predict future fraud.

**How components communicate:**
These scripts run independently of the web app. They read a CSV, learn the patterns of fraud, and output a "saved model" file that our backend will later load.

**How to test:**
Run the Python scripts locally and look at the printed accuracy scores and confusion matrices.

---

## Phase 4: AI Integration & Risk Scoring Engine
**What we are building:**
We will load our trained AI models into the FastAPI backend. We will create a prediction pipeline that takes a transaction, passes it through all 3 models, and creates a "Hybrid Risk Score".

**Files to create:**
- `backend/services/`: `fraud_engine.py` (Loads models and calculates risk).
- `backend/services/`: `shap_explainer.py` (Generates explainable AI insights).

**Why we need them:**
This is the brain of FraudGuard. It turns raw transactions into actionable intelligence (e.g., "95% Fraud Risk because the location is unusual").

**How components communicate:**
When the backend `routes.py` receives a transaction, it passes the data to `fraud_engine.py`, which consults the saved `.pkl` models, calculates the score, and returns it to be saved in the database.

**How to test:**
Send a fake "suspicious" transaction via FastAPI `/docs` and verify that the API returns a high risk score and SHAP reasons.

---

## Phase 5: Frontend Dashboard & Routing
**What we are building:**
We will build the skeleton of our React web application using `shadcn/ui` for beautiful, accessible components.

**Files to create:**
- `frontend/src/components/ui/`: (Buttons, Cards, Tables from shadcn).
- `frontend/src/pages/`: `Dashboard.tsx`, `Transactions.tsx`, `Investigation.tsx`.
- `frontend/src/App.tsx`: (Update with React Router).

**Why we need them:**
Users need a way to navigate the system.

**How components communicate:**
React Router will switch the visible page components based on the URL (e.g., `/dashboard` vs `/transactions`).

**How to test:**
Click through the navigation menu in your browser and ensure the pages swap instantly without reloading.

---

## Phase 6: Data Visualization & Analytics
**What we are building:**
We will connect the frontend to the backend APIs and visualize the data using `Recharts` and `Framer Motion`.

**Files to create:**
- `frontend/src/components/charts/`: `RiskChart.tsx`, `TransactionVolume.tsx`.
- `frontend/src/hooks/`: `useTransactions.ts` (Custom React hooks to fetch API data).

**Why we need them:**
Raw data is hard to read. Charts help analysts spot trends instantly.

**How components communicate:**
The React components call the FastAPI endpoints, receive JSON data, and pass that data into the Recharts components to render SVGs on the screen.

**How to test:**
Load the dashboard and ensure charts animate smoothly into view and display accurate data from the database.

---

## Phase 7: Investigation Page & Explainable AI (SHAP)
**What we are building:**
A detailed view for a single transaction. It will show the exact reasons WHY the AI flagged it as fraud, using SHAP values.

**Files to create:**
- `frontend/src/pages/Investigation.tsx`: (Fleshing out the details).
- `frontend/src/components/`: `ShapWaterfall.tsx` (Visualizing AI reasoning).

**Why we need them:**
Financial institutions cannot block transactions without a reason. Explainable AI builds trust.

**How components communicate:**
The frontend requests the specific transaction ID. The backend runs the SHAP explainer and returns a list of feature importances (e.g., `amount: +20% risk`, `ip_address: +30% risk`). The frontend renders this as a waterfall chart.

**How to test:**
Click on a "High Risk" transaction in the table and verify the explanation makes logical sense.

---

## Phase 8: Authentication & Final Polish
**What we are building:**
Securing the application with admin login (JWT Auth) and doing a final sweep for responsive design and performance.

**Files to create:**
- `backend/auth.py`: JWT token generation and validation.
- `frontend/src/pages/Login.tsx`: Login screen.
- `frontend/src/contexts/AuthContext.tsx`: Managing user login state.

**Why we need them:**
Fraud data is highly sensitive. Only authorized personnel should access the dashboard.

**How components communicate:**
The user logs in. The backend returns a secret JWT token. The frontend saves it and attaches it to the header of all future API requests.

**How to test:**
Try to access the dashboard without logging in (you should be redirected). Log in, and verify you can view data. View the app on a mobile device to ensure the UI scales correctly.

---

## Next Steps
Review this plan, and when you are ready to begin, simply tell me: **"Let's start Phase 1"**, and we will begin setting up the codebase together!
