from sqlalchemy import text
from app.database import engine

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE entities ADD COLUMN created_by_id INTEGER REFERENCES global_user(id)"))
        print("Successfully added created_by_id column to entities table.")
except Exception as e:
    print(f"Failed: {e}")
