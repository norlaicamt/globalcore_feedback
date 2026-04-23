from sqlalchemy import create_engine, inspect

import os
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
inspector = inspect(engine)

def check_table(table_name):
    print(f"\n--- {table_name} ---")
    columns = inspector.get_columns(table_name)
    for column in columns:
        print(f"Column: {column['name']}, Type: {column['type']}")

check_table("broadcast_logs")
check_table("notifications")
check_table("broadcast_templates")
