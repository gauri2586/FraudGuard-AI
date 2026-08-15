import sqlite3
import os
import sys
import json
from datetime import datetime

# Add the parent directory to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import engine, Base, SessionLocal
from app.models.domain import User, Transaction, ModelPrediction, FraudAlert, Investigation

def run_migration():
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "fraudguard.db")
    print(f"Connecting to database at {db_path}...")
    
    # Connect using raw sqlite3 to rename tables
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if tables exist before renaming
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [t[0] for t in cursor.fetchall()]
    
    if "users" in tables:
        print("Migration already run. Exiting.")
        return
        
    print("Renaming existing tables...")
    if "transactions" in tables:
        cursor.execute("ALTER TABLE transactions RENAME TO old_transactions")
        cursor.execute("DROP INDEX IF EXISTS ix_transactions_id")
        cursor.execute("DROP INDEX IF EXISTS ix_transactions_user_id")
    if "alerts" in tables:
        cursor.execute("ALTER TABLE alerts RENAME TO old_alerts")
        cursor.execute("DROP INDEX IF EXISTS ix_alerts_id")
    if "feedback" in tables:
        cursor.execute("ALTER TABLE feedback RENAME TO old_feedback")
        cursor.execute("DROP INDEX IF EXISTS ix_feedback_id")
        
    conn.commit()
    
    # Re-fetch tables list in case they were renamed
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [t[0] for t in cursor.fetchall()]
    
    print("Creating new SQLAlchemy schema...")
    Base.metadata.create_all(bind=engine)
    
    # Now migrate data from old tables to new tables
    print("Migrating data...")
    db = SessionLocal()
    
    # Migrate Transactions
    if "old_transactions" in tables:
        cursor.execute("SELECT * FROM old_transactions")
        columns = [d[0] for d in cursor.description]
        
        users_created = set()
        
        for row in cursor.fetchall():
            tx_data = dict(zip(columns, row))
            
            # 1. Ensure User exists
            user_id = tx_data.get("user_id", "UNKNOWN-USER")
            if user_id not in users_created:
                new_user = User(
                    id=user_id,
                    name=f"User {user_id}",
                    account_status="ACTIVE"
                )
                db.add(new_user)
                users_created.add(user_id)
                
            # 2. Create Transaction
            # Parse timestamp if it's a string
            ts = tx_data.get("timestamp")
            if isinstance(ts, str):
                try:
                    ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                except ValueError:
                    try:
                        ts = datetime.strptime(ts.split(".")[0], "%Y-%m-%d %H:%M:%S")
                    except:
                        pass
                        
            new_tx = Transaction(
                id=tx_data["id"],
                user_id=user_id,
                amount=tx_data.get("amount", 0.0),
                merchant_category=tx_data.get("merchant_category", "Unknown"),
                location=tx_data.get("location"),
                device_type=tx_data.get("device_type", "Unknown"),
                timestamp=ts if isinstance(ts, datetime) else datetime.utcnow(),
                status="APPROVED"
            )
            db.add(new_tx)
            
            # 3. Create Model Prediction
            shap_json = tx_data.get("shap_explanation")
            if isinstance(shap_json, str):
                try:
                    shap_json = json.loads(shap_json)
                except:
                    shap_json = None
                    
            new_pred = ModelPrediction(
                transaction_id=tx_data["id"],
                xgboost_score=tx_data.get("fraud_probability"),
                iforest_score=tx_data.get("anomaly_score_iforest"),
                autoencoder_score=tx_data.get("anomaly_score_autoencoder"),
                hybrid_risk_score=tx_data.get("final_risk_score", 0.0),
                risk_level=tx_data.get("risk_level", "LOW"),
                shap_explanations=shap_json
            )
            db.add(new_pred)
            
    # Migrate Alerts
    if "old_alerts" in tables:
        cursor.execute("SELECT * FROM old_alerts")
        columns = [d[0] for d in cursor.description]
        for row in cursor.fetchall():
            alt_data = dict(zip(columns, row))
            
            ts = alt_data.get("created_at")
            if isinstance(ts, str):
                try:
                    ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                except ValueError:
                    try:
                        ts = datetime.strptime(ts.split(".")[0], "%Y-%m-%d %H:%M:%S")
                    except:
                        pass
                        
            new_alert = FraudAlert(
                id=alt_data["id"],
                transaction_id=alt_data.get("transaction_id"),
                severity=alt_data.get("severity", "MEDIUM"),
                status=alt_data.get("status", "NEW"),
                created_at=ts if isinstance(ts, datetime) else datetime.utcnow()
            )
            db.add(new_alert)
            
    # Migrate Feedback to Investigations
    if "old_feedback" in tables:
        cursor.execute("SELECT * FROM old_feedback")
        columns = [d[0] for d in cursor.description]
        for row in cursor.fetchall():
            fb_data = dict(zip(columns, row))
            
            ts = fb_data.get("created_at")
            if isinstance(ts, str):
                try:
                    ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                except ValueError:
                    try:
                        ts = datetime.strptime(ts.split(".")[0], "%Y-%m-%d %H:%M:%S")
                    except:
                        pass
                        
            is_fraud = fb_data.get("is_fraud", False)
            
            new_inv = Investigation(
                id=fb_data["id"],
                transaction_id=fb_data.get("transaction_id"),
                status="CLOSED",
                conclusion="CONFIRMED_FRAUD" if is_fraud else "FALSE_POSITIVE",
                notes=fb_data.get("notes"),
                created_at=ts if isinstance(ts, datetime) else datetime.utcnow(),
                completed_at=ts if isinstance(ts, datetime) else datetime.utcnow()
            )
            db.add(new_inv)
            
    db.commit()
    db.close()
    
    print("Data migration complete. Dropping old tables...")
    if "transactions" in tables:
        cursor.execute("DROP TABLE old_transactions")
    if "alerts" in tables:
        cursor.execute("DROP TABLE old_alerts")
    if "feedback" in tables:
        cursor.execute("DROP TABLE old_feedback")
        
    conn.commit()
    conn.close()
    print("Database upgrade successfully finished!")

if __name__ == "__main__":
    run_migration()
