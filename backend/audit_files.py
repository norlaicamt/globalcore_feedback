import os
import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Feedback

# Using sqlite for now assuming that is what is used. 
# We should probably check database.py to be sure. Let's assume it's sqlite at "sqlite:///./sql_app.db"
# Wait, it might be in backend/sql_app.db. Let's use the app's get_db.
import sys
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.database import SessionLocal, engine
from app import models

import urllib.request

def run_audit():
    db = SessionLocal()
    feedbacks = db.query(models.Feedback).all()
    
    print("--- [AUDIT:FILE_EXISTS] ---")
    for fb in feedbacks:
        if not fb.custom_data:
            continue
            
        media_urls = []
        for k, v in fb.custom_data.items():
            if isinstance(v, list):
                for item in v:
                    if isinstance(item, dict) and ('preview' in item or 'url' in item):
                        media_urls.append(item.get('url'))
            elif isinstance(v, dict) and ('preview' in v or 'url' in v):
                media_urls.append(v.get('url'))
                
        for u in media_urls:
            if not u: continue
            
            print(f"feedback_id: {fb.id}")
            print(f"raw_db_url: {u}")
            
            if '/uploads/feedback/' in u:
                filename = u.split('/uploads/feedback/')[-1]
                # Assuming script runs from root, or backend
                actual_file_path = os.path.join('backend', 'uploads', 'feedback', filename)
                # the upload endpoint does os.path.join("uploads", "feedback", filename) without backend.
                # Let's check both
                if not os.path.exists(actual_file_path):
                    actual_file_path = os.path.join('uploads', 'feedback', filename)
                    
                exists = os.path.exists(actual_file_path)
                fsize = os.path.getsize(actual_file_path) if exists else 0
                
                print(f"resolved_disk_path: {actual_file_path}")
                print(f"exists={exists}")
                print(f"file_size={fsize}")
                
                test_url = f"http://localhost:8000/uploads/feedback/{filename}"
                print("--- [AUDIT:STATIC_ROUTE] ---")
                try:
                    req = urllib.request.Request(test_url, method='HEAD')
                    with urllib.request.urlopen(req, timeout=2) as res:
                        print(f"url: {test_url}")
                        print(f"status_code: {res.status}")
                        print(f"content_type: {res.headers.get('Content-Type')}")
                except Exception as e:
                    print(f"url: {test_url}")
                    print(f"status_code: ERROR")
                    print(f"error: {str(e)}")
                print("-" * 20)

if __name__ == "__main__":
    run_audit()
