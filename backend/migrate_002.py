from app.database import engine
from sqlalchemy import text

statements = [
    "ALTER TABLE global_user ADD COLUMN IF NOT EXISTS birthdate VARCHAR;",
    "ALTER TABLE global_user ADD COLUMN IF NOT EXISTS birthplace VARCHAR;"
]

print("Applying migration 002...")
with engine.connect() as conn:
    for sql in statements:
        try:
            conn.execute(text(sql))
            print(f"Executed: {sql}")
        except Exception as e:
            print(f"Error executing {sql}: {e}")
    conn.commit()
print("Migration completed.")
