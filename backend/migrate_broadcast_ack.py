from sqlalchemy import create_engine, text
import os

DATABASE_URL = "YOUR_DATABASE_URL"
engine = create_engine(DATABASE_URL)

def run_migration():
    with engine.connect() as conn:
        print("Starting Broadcast & Acknowledgment Migration...")
        
        # 1. Add ack_count to broadcast_logs
        try:
            conn.execute(text("ALTER TABLE broadcast_logs ADD COLUMN ack_count INTEGER DEFAULT 0"))
            conn.commit()
            print("Successfully added ack_count to broadcast_logs.")
        except Exception as e:
            if "already exists" in str(e):
                print("ack_count column already exists in broadcast_logs.")
            else:
                print(f"Error adding ack_count: {e}")

        # 2. Add require_ack to notifications
        try:
            conn.execute(text("ALTER TABLE notifications ADD COLUMN require_ack BOOLEAN DEFAULT FALSE"))
            conn.commit()
            print("Successfully added require_ack to notifications.")
        except Exception as e:
            if "already exists" in str(e):
                print("require_ack column already exists in notifications.")
            else:
                print(f"Error adding require_ack: {e}")
        
        # 3. Create broadcast_templates if missing
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS broadcast_templates (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR,
                    title VARCHAR,
                    message VARCHAR,
                    entity_id INTEGER REFERENCES entities(id),
                    created_by_id INTEGER REFERENCES global_user(id),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """))
            conn.commit()
            print("Successfully verified broadcast_templates table.")
        except Exception as e:
            print(f"Error creating templates table: {e}")

        print("\nMigration Complete.")

if __name__ == "__main__":
    run_migration()
