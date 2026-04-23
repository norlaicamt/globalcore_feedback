from sqlalchemy import create_engine, text

import os
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

STATEMENTS = [
    "ALTER TABLE global_user ADD COLUMN IF NOT EXISTS role_identity VARCHAR;",
    "ALTER TABLE global_user ADD COLUMN IF NOT EXISTS school VARCHAR;",
    "ALTER TABLE global_user ADD COLUMN IF NOT EXISTS company_name VARCHAR;",
    "ALTER TABLE global_user ADD COLUMN IF NOT EXISTS position_title VARCHAR;",
    "ALTER TABLE global_user ADD COLUMN IF NOT EXISTS region VARCHAR;",
    "ALTER TABLE global_user ADD COLUMN IF NOT EXISTS province VARCHAR;",
    "ALTER TABLE global_user ADD COLUMN IF NOT EXISTS city VARCHAR;",
    "ALTER TABLE global_user ADD COLUMN IF NOT EXISTS barangay VARCHAR;",
    "ALTER TABLE global_user ADD COLUMN IF NOT EXISTS exact_address VARCHAR;",
    "ALTER TABLE global_user ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;",
]

with engine.connect() as conn:
    print("Running onboarding user migration...")
    for stmt in STATEMENTS:
        conn.execute(text(stmt))
    conn.commit()
    print("Migration complete.")
