from app.database import engine
from sqlalchemy import text

def migrate():
    columns = [
        ("daily_summary", "BOOLEAN DEFAULT FALSE"),
        ("notify_new_feedback", "BOOLEAN DEFAULT TRUE"),
        ("notify_assigned", "BOOLEAN DEFAULT TRUE"),
        ("notify_high_activity", "BOOLEAN DEFAULT FALSE"),
        ("notify_system_announcements", "BOOLEAN DEFAULT TRUE")
    ]
    
    with engine.connect() as conn:
        for col_name, col_type in columns:
            try:
                print(f"Adding column {col_name}...")
                conn.execute(text(f"ALTER TABLE global_user ADD COLUMN {col_name} {col_type}"))
                conn.commit()
                print(f"Column {col_name} added successfully.")
            except Exception as e:
                print(f"Error adding {col_name}: {e}")
                conn.rollback()

if __name__ == "__main__":
    migrate()
