from app.database import SessionLocal
from app import crud

db = SessionLocal()
try:
    print("Attempting to fetch public feed...")
    feed = crud.get_public_feed(db)
    print(f"Success! Fetched {len(feed)} items.")
except Exception as e:
    print("Error fetching public feed:")
    import traceback
    traceback.print_exc()
finally:
    db.close()
