from sqlalchemy import create_engine, text

import os
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("Connecting to database...")
    try:
        conn.execute(text("ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS rating INTEGER;"))
        conn.commit()
        print("Column 'rating' added (or already exists).")
    except Exception as e:
        print(f"Error: {e}")
