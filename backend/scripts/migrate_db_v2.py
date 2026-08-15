import sqlite3
import os
import sys
import json
from datetime import datetime

# Add the parent directory to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import engine, Base, SessionLocal
from app.models.domain import Transaction, ModelPrediction, FraudAlert

def run_migration():
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "fraudguard.db")
    print(f"Connecting to database at {db_path}...")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [t[0] for t in cursor.fetchall()]
    
    if "transactions" not in tables:
        print("transactions table not found")
        return
        
    print("Renaming existing tables to v1_...")
    
    try:
        cursor.execute("ALTER TABLE transactions RENAME TO v1_transactions")
        cursor.execute("DROP INDEX IF EXISTS ix_transactions_id")
    except: pass
    
    try:
        if "model_predictions" in tables:
            cursor.execute("ALTER TABLE model_predictions RENAME TO v1_model_predictions")
            cursor.execute("DROP INDEX IF EXISTS ix_model_predictions_id")
    except: pass
        
    try:
        if "fraud_alerts" in tables:
            cursor.execute("ALTER TABLE fraud_alerts RENAME TO v1_fraud_alerts")
            cursor.execute("DROP INDEX IF EXISTS ix_fraud_alerts_id")
    except: pass
    
    # Also clean up old abandoned tables if any exist
    for t in ['users', 'investigations']:
        cursor.execute(f"DROP TABLE IF EXISTS {t}")
        
    conn.commit()
    
    print("Creating new SQLAlchemy schema...")
    Base.metadata.create_all(bind=engine)
    
    print("Migrating data from v1_ tables...")
    db = SessionLocal()
    
    # 1. Fetch v1_transactions and v1_model_predictions to combine them or separate them
    # Because we're reading them into memory, let's just do it
    
    cursor.execute("SELECT * FROM v1_transactions")
    tx_cols = [d[0] for d in cursor.description]
    v1_txs = [dict(zip(tx_cols, row)) for row in cursor.fetchall()]
    
    cursor.execute("SELECT * FROM v1_model_predictions")
    mp_cols = [d[0] for d in cursor.description]
    v1_mps = { row[1]: dict(zip(mp_cols, row)) for row in cursor.fetchall() } # keyed by transaction_id
    
    for tx_data in v1_txs:
        tx_id = tx_data["id"]
        mp_data = v1_mps.get(tx_id, {})
        
        # Parse timestamp
        ts = tx_data.get("timestamp")
        if isinstance(ts, str):
            try: ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            except: 
                try: ts = datetime.strptime(ts.split(".")[0], "%Y-%m-%d %H:%M:%S")
                except: ts = datetime.utcnow()
        elif not isinstance(ts, datetime): ts = datetime.utcnow()
        
        # Determine is_fraud
        is_fraud = tx_data.get("status") == "FLAGGED"
        
        new_tx = Transaction(
            transaction_id=tx_id,
            amount=tx_data.get("amount", 0.0),
            timestamp=ts,
            transaction_type="Online",
            merchant_category=tx_data.get("merchant_category", "Unknown"),
            location=tx_data.get("location"),
            device_type=tx_data.get("device_type", "Unknown"),
            risk_score=mp_data.get("hybrid_risk_score", 0.0),
            risk_level=mp_data.get("risk_level", "LOW"),
            fraud_probability=mp_data.get("xgboost_score", 0.0),
            is_fraud=is_fraud,
            created_at=datetime.utcnow()
        )
        db.add(new_tx)
        
        new_pred = ModelPrediction(
            transaction_id=tx_id,
            xgboost_score=mp_data.get("xgboost_score"),
            isolation_forest_score=mp_data.get("iforest_score"),
            autoencoder_score=mp_data.get("autoencoder_score"),
            hybrid_score=mp_data.get("hybrid_risk_score", 0.0),
            created_at=datetime.utcnow()
        )
        db.add(new_pred)
        
    if "v1_fraud_alerts" in [t[0] for t in cursor.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]:
        cursor.execute("SELECT * FROM v1_fraud_alerts")
        alt_cols = [d[0] for d in cursor.description]
        for row in cursor.fetchall():
            alt_data = dict(zip(alt_cols, row))
            
            ts = alt_data.get("created_at")
            if isinstance(ts, str):
                try: ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                except: 
                    try: ts = datetime.strptime(ts.split(".")[0], "%Y-%m-%d %H:%M:%S")
                    except: ts = datetime.utcnow()
            elif not isinstance(ts, datetime): ts = datetime.utcnow()
            
            new_alert = FraudAlert(
                transaction_id=alt_data.get("transaction_id"),
                severity=alt_data.get("severity", "MEDIUM"),
                status=alt_data.get("status", "NEW"),
                reason="High anomaly score detected",
                created_at=ts,
                resolved_at=None
            )
            db.add(new_alert)
            
    db.commit()
    db.close()
    
    print("Dropping v1_ tables...")
    cursor.execute("DROP TABLE IF EXISTS v1_transactions")
    cursor.execute("DROP TABLE IF EXISTS v1_model_predictions")
    cursor.execute("DROP TABLE IF EXISTS v1_fraud_alerts")
    conn.commit()
    conn.close()
    
    print("Migration complete!")

if __name__ == "__main__":
    run_migration()
