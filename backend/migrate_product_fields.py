from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("DATABASE_URL not found")
    exit(1)

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("Adding missing columns to feedbacks table...")
    
    # Check and add product_id
    try:
        conn.execute(text("ALTER TABLE feedbacks ADD COLUMN product_id INTEGER REFERENCES products(id)"))
        conn.commit()
        print("Added product_id")
    except Exception as e:
        print(f"Error adding product_id (might already exist): {e}")

    # Check and add product_sku
    try:
        conn.execute(text("ALTER TABLE feedbacks ADD COLUMN product_sku VARCHAR"))
        conn.commit()
        print("Added product_sku")
    except Exception as e:
        print(f"Error adding product_sku (might already exist): {e}")

    # Check and add product_name
    try:
        conn.execute(text("ALTER TABLE feedbacks ADD COLUMN product_name VARCHAR"))
        conn.commit()
        print("Added product_name")
    except Exception as e:
        print(f"Error adding product_name (might already exist): {e}")

    print("Migration complete.")
