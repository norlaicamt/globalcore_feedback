from sqlalchemy import create_engine, text

import os
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    rs = conn.execute(text("SELECT id, name, email, role, is_active, password, program_id, session_token, department FROM global_user"))
    for row in rs:
        print(f"ID: {row.id}, Email: {row.email}, Role: {row.role}, IsActive: {row.is_active}, Password: {'[SET]' if row.password else '[NONE]'}, ProgramID: {row.program_id}, Dept: {row.department}")
