from sqlalchemy import create_engine, text
from app.database import DATABASE_URL

def migrate():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        print("Updating global_user schema for presence tracking...")
        
        # Add last_seen column
        try:
            conn.execute(text("ALTER TABLE global_user ADD COLUMN last_seen TIMESTAMP WITH TIME ZONE;"))
            print("Successfully added 'last_seen' column.")
        except Exception as e:
            if 'already exists' in str(e).lower():
                print("'last_seen' column already exists.")
            else:
                print(f"Error adding 'last_seen': {e}")
            
        # Add current_module column
        try:
            conn.execute(text("ALTER TABLE global_user ADD COLUMN current_module VARCHAR;"))
            print("Successfully added 'current_module' column.")
        except Exception as e:
            if 'already exists' in str(e).lower():
                print("'current_module' column already exists.")
            else:
                print(f"Error adding 'current_module': {e}")
        
        conn.commit()
        print("Database migration finalized.")

if __name__ == "__main__":
    migrate()
