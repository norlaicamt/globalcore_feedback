from sqlalchemy import create_engine, text

import os
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    res = conn.execute(text("SELECT id, name FROM categories;"))
    print("Categories:")
    for row in res:
        print(f"ID: {row[0]}, Name: {row[1]}")
    
    # Check if there are any departments
    res = conn.execute(text("SELECT id, name FROM departments;"))
    print("\nDepartments:")
    for row in res:
        print(f"ID: {row[0]}, Name: {row[1]}")
