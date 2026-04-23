from sqlalchemy import create_engine, text

import os
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("Adding id photo column...")
    conn.execute(text("ALTER TABLE global_user ADD COLUMN IF NOT EXISTS id_photo_url TEXT;"))
    conn.commit()
    print("Migration complete.")
