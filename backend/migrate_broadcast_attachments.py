
from sqlalchemy import create_engine, text
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env
env_path = Path(__file__).resolve().parent / '.env'
load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("DATABASE_URL not found in .env, falling back to SQLite for safety")
    DATABASE_URL = "sqlite:///./feedback.db"

engine = create_engine(DATABASE_URL)

def migrate():
    with engine.connect() as conn:
        print(f"Starting migration on {DATABASE_URL}")
        
        # Check if columns exist first (Postgres specific check, but text() works)
        try:
            # We use JSONB for Postgres, and JSON for SQLite if needed.
            # SQLAlchemy's JSONB maps to JSON in many places, but here we use raw SQL.
            type_name = "JSONB" if "postgresql" in DATABASE_URL else "JSON"
            
            conn.execute(text(f"ALTER TABLE broadcast_logs ADD COLUMN attachments {type_name}"))
            print(f"Added attachments column to broadcast_logs ({type_name})")
        except Exception as e:
            print(f"Note: Could not add attachments to broadcast_logs (might already exist): {e}")

        try:
            type_name = "JSONB" if "postgresql" in DATABASE_URL else "JSON"
            conn.execute(text(f"ALTER TABLE notifications ADD COLUMN attachments {type_name}"))
            print(f"Added attachments column to notifications ({type_name})")
        except Exception as e:
            print(f"Note: Could not add attachments to notifications (might already exist): {e}")

        conn.commit()
        print("Migration completed successfully")

if __name__ == "__main__":
    migrate()
