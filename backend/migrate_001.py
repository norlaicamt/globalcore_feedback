from app.database import engine
from sqlalchemy import text

statements = [
    "ALTER TABLE global_user ADD COLUMN IF NOT EXISTS unit_name VARCHAR;",
    "ALTER TABLE global_user ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;",
    "ALTER TABLE global_user ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;",
    "ALTER TABLE global_user ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;"
]

print("Applying migrations...")
with engine.connect() as conn:
    for sql in statements:
        try:
            conn.execute(text(sql))
            print(f"Executed: {sql}")
        except Exception as e:
            print(f"Error executing {sql}: {e}")
    conn.commit()
print("Database schema updated.")
