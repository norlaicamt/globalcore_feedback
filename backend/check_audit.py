from sqlalchemy import create_engine, text

DATABASE_URL = "YOUR_DATABASE_URL"
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    rs = conn.execute(text("SELECT id, action_type, performed_by_id, target_id, details, timestamp FROM audit_logs ORDER BY timestamp DESC LIMIT 20"))
    for row in rs:
        print(f"[{row.timestamp}] Action: {row.action_type}, By UID: {row.performed_by_id}, Target: {row.target_id}, Details: {row.details}")
