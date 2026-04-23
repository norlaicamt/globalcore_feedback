from sqlalchemy import create_engine, text

import os
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE notifications ADD COLUMN subject TEXT;"))
        conn.commit()
        print("Successfully added subject column to notifications table.")
    except Exception as e:
        print(f"Error (maybe column exists?): {e}")
