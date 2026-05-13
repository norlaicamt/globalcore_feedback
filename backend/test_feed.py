import sys
import os
from fastapi.testclient import TestClient

# Add backend directory to path
sys.path.insert(0, os.path.abspath('c:\\GlobalCore-Feedback\\backend'))

from main import app

client = TestClient(app)

response = client.get("/feedbacks/")
print(response.status_code)
if response.status_code == 200:
    data = response.json()
    if data:
        print("First feedback keys:", list(data[0].keys()))
        print("First feedback entity keys:", list(data[0].get('entity', {}).keys()) if data[0].get('entity') else "None")
        print("First feedback media:", data[0].get('media'))
    else:
        print("No feedbacks found")
else:
    print(response.text)
