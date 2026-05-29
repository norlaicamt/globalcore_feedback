import os
from dotenv import load_dotenv
load_dotenv('backend/.env')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import User, Entity

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

user = db.query(User).first()
entity = db.query(Entity).first()

if user and entity:
    print(f"VALID_USER_ID: {user.id}")
    print(f"VALID_ENTITY_ID: {entity.id}")
else:
    print("No data found")
