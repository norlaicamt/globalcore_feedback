from sqlalchemy import create_engine, text

DATABASE_URL = "YOUR_DATABASE_URL"
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("Connecting to database...")
    try:
        conn.execute(text("ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS rating INTEGER;"))
        conn.commit()
        print("Column 'rating' added (or already exists).")
    except Exception as e:
        print(f"Error: {e}")
