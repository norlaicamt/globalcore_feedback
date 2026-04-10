from app.database import engine
from sqlalchemy import inspect

try:
    print(f"Engine: {engine}")
    inspector = inspect(engine)
    columns = [c["name"] for c in inspector.get_columns("global_user")]
    print(f"Columns in global_user: {columns}")
except Exception as e:
    print(f"Error: {e}")
