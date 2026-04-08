from app.database import engine
from sqlalchemy import text

def add_column():
    try:
        with engine.connect() as conn:
            conn.execute(text('ALTER TABLE departments ADD COLUMN category_id INTEGER REFERENCES categories(id)'))
            conn.commit()
            print("Column category_id added successfully.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    add_column()
