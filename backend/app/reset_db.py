# reset_db.py
from database import engine, Base
import models

# Drop all tables
Base.metadata.drop_all(bind=engine)
print("All tables dropped.")

# Create tables again
Base.metadata.create_all(bind=engine)
print("All tables recreated.")