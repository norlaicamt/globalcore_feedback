from sqlalchemy import create_engine, text

import os
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def migrate():
    with engine.connect() as conn:
        print("Adding 'citizenship' column...")
        try:
            conn.execute(text("ALTER TABLE global_user ADD COLUMN citizenship VARCHAR;"))
            conn.commit()
            print("Successfully added 'citizenship'")
        except Exception as e:
            print(f"Error adding citizenship: {e}")
            conn.rollback()

        print("Adding 'marital_status' column...")
        try:
            conn.execute(text("ALTER TABLE global_user ADD COLUMN marital_status VARCHAR;"))
            conn.commit()
            print("Successfully added 'marital_status'")
        except Exception as e:
            print(f"Error adding marital_status: {e}")
            conn.rollback()

if __name__ == "__main__":
    migrate()
