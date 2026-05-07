"""
Migration: Refine existing 'Feedback Entry' titles in the database.
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

# 1. Fetch all feedbacks with the generic title
cur.execute("SELECT id, description FROM feedbacks WHERE title = 'Feedback Entry' OR title IS NULL;")
rows = cur.fetchall()

print(f"Found {len(rows)} feedbacks to update.")

for fid, desc in rows:
    if desc:
        snippet = desc.strip().split('\n')[0]
        if len(snippet) > 60:
            snippet = snippet[:57] + "..."
        if not snippet:
            snippet = "Feedback Entry" # Fallback if empty
    else:
        snippet = "Feedback Entry"

    cur.execute("UPDATE feedbacks SET title = %s WHERE id = %s;", (snippet, fid))
    print(f"Updated Feedback ID {fid} -> {snippet}")

cur.close()
conn.close()
print("\nUpdate complete.")
