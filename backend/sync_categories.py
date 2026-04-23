from sqlalchemy import create_engine, text

import os
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("Synching categories...")
    # Ensure ID 1 is Departmental
    conn.execute(text("INSERT INTO categories (id, name) VALUES (1, 'Departmental') ON CONFLICT (id) DO UPDATE SET name = 'Departmental';"))
    # Ensure ID 2 is Individual
    conn.execute(text("INSERT INTO categories (id, name) VALUES (2, 'Individual') ON CONFLICT (id) DO UPDATE SET name = 'Individual';"))
    # Ensure ID 3 is General
    conn.execute(text("INSERT INTO categories (id, name) VALUES (3, 'General') ON CONFLICT (id) DO UPDATE SET name = 'General';"))
    conn.commit()
    print("Categories synced successfully.")
