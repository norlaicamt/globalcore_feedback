import os
import sys
import json

sys.path.append(os.path.abspath(os.path.dirname(__file__)))
from app.database import SessionLocal
from app.models import Feedback

db = SessionLocal()
feedbacks = db.query(Feedback).order_by(Feedback.id.desc()).limit(5).all()

for f in feedbacks:
    print(f"Feedback ID: {f.id}")
    if f.custom_data:
        for k, v in f.custom_data.items():
            if isinstance(v, list) and len(v) > 0 and isinstance(v[0], dict) and 'url' in v[0]:
                print(f"  {k}: {v[0]['url']}")
            elif isinstance(v, dict) and 'url' in v:
                print(f"  {k}: {v['url']}")
db.close()
