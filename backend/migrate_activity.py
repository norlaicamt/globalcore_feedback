from sqlalchemy import create_engine, text
from app.database import DATABASE_URL

engine = create_engine(DATABASE_URL)

def run_migration():
    commands = [
        "ALTER TABLE reactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;",
        "ALTER TABLE reply_reactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;"
    ]
    
    with engine.connect() as conn:
        for cmd in commands:
            print(f"Executing: {cmd}")
            try:
                conn.execute(text(cmd))
                conn.commit()
                print("Success!")
            except Exception as e:
                print(f"Error: {e}")

if __name__ == "__main__":
    run_migration()
