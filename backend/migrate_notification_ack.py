import psycopg2
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Connection string (from app/database.py)
DB_URL = "YOUR_DATABASE_URL"

def run_migration():
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()

        logger.info("Starting migration: add_is_acknowledged_to_notifications")

        # Add is_acknowledged column
        logger.info("Checking 'is_acknowledged' column in 'notifications'...")
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='notifications' AND column_name='is_acknowledged';
        """)
        if not cur.fetchone():
            logger.info("Adding 'is_acknowledged' column to 'notifications'...")
            cur.execute("ALTER TABLE notifications ADD COLUMN is_acknowledged BOOLEAN DEFAULT FALSE;")
            logger.info("'is_acknowledged' column added successfully.")
        else:
            logger.info("'is_acknowledged' column already exists.")

        # Add read_count to broadcast_logs
        logger.info("Checking 'read_count' column in 'broadcast_logs'...")
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='broadcast_logs' AND column_name='read_count';
        """)
        if not cur.fetchone():
            logger.info("Adding 'read_count' column to 'broadcast_logs'...")
            cur.execute("ALTER TABLE broadcast_logs ADD COLUMN read_count INTEGER DEFAULT 0;")
            logger.info("'read_count' column added successfully.")
        else:
            logger.info("'read_count' column already exists.")

        conn.commit()
        logger.info("Migration completed successfully!")

    except Exception as e:
        if 'conn' in locals():
            conn.rollback()
        logger.error(f"Migration failed: {e}")
    finally:
        if 'conn' in locals():
            cur.close()
            conn.close()

if __name__ == "__main__":
    run_migration()
