import requests
import uuid

BASE_URL = "http://127.0.0.1:8000"

print("--- SECURITY AUDIT ---")
res = requests.post(f"{BASE_URL}/admin/login", params={"email": "admin@globalcore.com", "password": "admin"})
if res.status_code == 200:
    data = res.json()
    token = data["session_token"]
    print(f"Global Admin Logged in. Token: {token[:10]}...")
    
    # Let's try to hit an endpoint
    res2 = requests.get(f"{BASE_URL}/admin/analytics/snapshot", headers={"X-Session-Token": token})
    print("Snapshot status:", res2.status_code)
else:
    print(res.text)

print("Done.")
