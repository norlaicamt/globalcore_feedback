from sqlalchemy import create_engine, text

DATABASE_URL = "YOUR_DATABASE_URL"
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE notifications ADD COLUMN message TEXT;"))
        conn.commit()
        print("Successfully added message column to notifications table.")
    except Exception as e:
        print(f"Error (maybe column exists?): {e}")
