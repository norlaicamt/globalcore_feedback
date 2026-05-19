from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()
engine = create_engine(os.getenv('DATABASE_URL'))

with engine.connect() as conn:
    print("--- Listing products and their timestamps ---")
    rs = conn.execute(text("SELECT id, name, category, created_at FROM products ORDER BY id DESC LIMIT 10"))
    for row in rs:
        print(f"ID: {row.id} | Name: {row.name} | Category: {row.category} | Created At: {row.created_at}")
