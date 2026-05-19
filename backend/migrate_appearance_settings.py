"""Add appearance preference columns to user_settings."""
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL"))

COLUMNS = [
    ("appearance_category", "VARCHAR(32) DEFAULT 'minimal'"),
    ("appearance_pattern", "VARCHAR(32) DEFAULT 'soft_circles'"),
    ("appearance_accent", "VARCHAR(16)"),
    ("appearance_mode", "VARCHAR(16) DEFAULT 'light'"),
]

with engine.connect() as conn:
    for name, col_type in COLUMNS:
        conn.execute(text(f"ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS {name} {col_type};"))
        print(f"Column '{name}' added/verified.")
    conn.commit()
print("Appearance settings migration finished.")
