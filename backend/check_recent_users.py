from sqlalchemy import create_engine, text

import os
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    rs = conn.execute(text("SELECT id, name, email, role, is_active FROM global_user ORDER BY id DESC LIMIT 5"))
    for row in rs:
        print(f"ID: {row.id}, Email: {row.email}, Role: {row.role}, IsActive: {row.is_active}")
