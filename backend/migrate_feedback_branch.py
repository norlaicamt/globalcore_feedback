from app.database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        print("Adding branch_id, branch_name_snapshot, and feedback_type to feedbacks table...")
        
        # Add branch_id
        try:
            conn.execute(text("ALTER TABLE feedbacks ADD COLUMN branch_id INTEGER REFERENCES branches(id)"))
            conn.commit()
            print("Added branch_id")
        except Exception as e:
            print(f"branch_id might already exist: {e}")
            conn.rollback()

        # Add branch_name_snapshot
        try:
            conn.execute(text("ALTER TABLE feedbacks ADD COLUMN branch_name_snapshot VARCHAR"))
            conn.commit()
            print("Added branch_name_snapshot")
        except Exception as e:
            print(f"branch_name_snapshot might already exist: {e}")
            conn.rollback()

        # Add feedback_type
        try:
            conn.execute(text("ALTER TABLE feedbacks ADD COLUMN feedback_type VARCHAR"))
            conn.commit()
            print("Added feedback_type")
        except Exception as e:
            print(f"feedback_type might already exist: {e}")
            conn.rollback()

        print("Migration complete.")

if __name__ == "__main__":
    migrate()
