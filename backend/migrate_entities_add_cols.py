from sqlalchemy import text
from app.database import engine

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE entities ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))
        conn.execute(text("ALTER TABLE entities ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))
        print("Successfully added created_at and updated_at columns to entities table.")
except Exception as e:
    print(f"Failed: {e}")
