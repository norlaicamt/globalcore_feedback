from sqlalchemy import create_engine, text

DB_URL = 'YOUR_DATABASE_URL'
engine = create_engine(DB_URL)

with engine.connect() as conn:
    print("Connecting to database...")
    
    # Create system_labels table if not exists
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS system_labels (
            id SERIAL PRIMARY KEY,
            key VARCHAR UNIQUE NOT NULL,
            value VARCHAR NOT NULL,
            organization_id INTEGER NULL
        )
    """))
    
    # Create indexes
    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_system_labels_id ON system_labels (id)"))
    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_system_labels_key ON system_labels (key)"))
    
    conn.commit()
    print("Migration successful. SystemLabel table created.")
