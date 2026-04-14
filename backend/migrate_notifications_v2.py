import psycopg2
from psycopg2 import sql
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Connection string
# From app/database.py: YOUR_DATABASE_URL
DB_URL = "YOUR_DATABASE_URL"

def run_migration():
    try:
        conn = psycopg2.connect(DB_URL)
        conn.autocommit = False
        cur = conn.cursor()

        logger.info("Starting migration: upgrade_notifications_v2")

        # 1. Backup the notifications table
        logger.info("Creating backup of 'notifications' table...")
        cur.execute("CREATE TABLE IF NOT EXISTS notifications_backup_v1 AS SELECT * FROM notifications;")
        
        # 2. Modify feedback_id to be nullable
        logger.info("Setting 'feedback_id' to nullable...")
        cur.execute("ALTER TABLE notifications ALTER COLUMN feedback_id DROP NOT NULL;")

        # 3. Add entity_id column to notifications
        logger.info("Adding 'entity_id' column to 'notifications'...")
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='notifications' AND column_name='entity_id';
        """)
        if not cur.fetchone():
            cur.execute("ALTER TABLE notifications ADD COLUMN entity_id INTEGER;")
            cur.execute("ALTER TABLE notifications ADD CONSTRAINT fk_notifications_entity FOREIGN KEY (entity_id) REFERENCES entities(id);")
            logger.info("'entity_id' column added to notifications successfully.")
        else:
            logger.info("'entity_id' column already exists in notifications, skipping.")

        # 4. Add entity_id column to broadcast_logs if missing
        logger.info("Checking 'entity_id' column in 'broadcast_logs'...")
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='broadcast_logs' AND column_name='entity_id';
        """)
        if not cur.fetchone():
            logger.info("Adding 'entity_id' column to 'broadcast_logs'...")
            cur.execute("ALTER TABLE broadcast_logs ADD COLUMN entity_id INTEGER;")
            cur.execute("ALTER TABLE broadcast_logs ADD CONSTRAINT fk_broadcast_logs_entity FOREIGN KEY (entity_id) REFERENCES entities(id);")
            logger.info("'entity_id' column added to broadcast_logs successfully.")
        else:
            logger.info("'entity_id' column already exists in broadcast_logs.")

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
