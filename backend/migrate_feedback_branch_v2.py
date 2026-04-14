from app.database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        print("Adding manual_location_text to feedbacks table...")
        
        try:
            conn.execute(text("ALTER TABLE feedbacks ADD COLUMN manual_location_text TEXT"))
            conn.commit()
            print("Added manual_location_text")
        except Exception as e:
            print(f"manual_location_text might already exist: {e}")
            conn.rollback()

        print("Migration complete.")

if __name__ == "__main__":
    migrate()
