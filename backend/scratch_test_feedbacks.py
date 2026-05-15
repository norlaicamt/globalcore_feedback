from app.database import SessionLocal
from app import crud
db = SessionLocal()
try:
    print("Fetching feedbacks...")
    feedbacks = crud.get_feedbacks(db=db, skip=0, limit=20)
    print("Success, found", len(feedbacks))
except Exception as e:
    import traceback
    traceback.print_exc()
