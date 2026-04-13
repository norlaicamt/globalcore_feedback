from app.database import engine
from sqlalchemy import text
import sys

def add_column():
    try:
        with engine.connect() as conn:
            conn.execute(text('ALTER TABLE global_user ADD COLUMN IF NOT EXISTS is_global_user BOOLEAN DEFAULT FALSE'))
            conn.commit()
            print("Column 'is_global_user' added or already exists.")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    add_column()
