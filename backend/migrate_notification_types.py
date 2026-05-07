"""
Migration: Add HIGH_ACTIVITY and SYSTEM_ANNOUNCEMENT to the notificationtype enum.
Run from: c:\GlobalCore-Feedback\backend\
Command:  python migrate_notification_types.py
"""
import psycopg2
import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).parent / ".env")
DATABASE_URL = os.getenv("DATABASE_URL")

conn = psycopg2.connect(DATABASE_URL)
conn.autocommit = True
cur = conn.cursor()

new_values = ["HIGH_ACTIVITY", "SYSTEM_ANNOUNCEMENT"]

for val in new_values:
    try:
        cur.execute(f"ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS '{val}';")
        print(f"[OK] Added enum value: {val}")
    except Exception as e:
        print(f"[WARN] Could not add {val}: {e}")

cur.close()
conn.close()
print("\nMigration complete.")
