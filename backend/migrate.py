from sqlalchemy import create_engine, text

import os
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("Migrating Postgres DB...")
    try:
        conn.execute(text("ALTER TABLE feedbacks ADD COLUMN address VARCHAR;"))
        print("Added 'address' column.")
    except Exception as e:
        print(f"'address' column may already exist or error: {e}")
        
    try:
        conn.execute(text("ALTER TABLE feedbacks ADD COLUMN employee_name VARCHAR;"))
        print("Added 'employee_name' column.")
    except Exception as e:
        print(f"'employee_name' column may already exist or error: {e}")
        
    conn.commit()
    print("Migration finished.")
