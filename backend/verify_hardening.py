import requests
import json

BASE_URL = "http://localhost:8000/admin"

def test_auth_and_scoping():
    print("--- 1. Testing Global Admin (admin@globalcore.com) ---")
    login_res = requests.post(f"{BASE_URL}/login?email=admin@globalcore.com&password=YOUR_ADMIN_PASSWORD")
    if login_res.status_code != 200:
        print(f"Login failed: {login_res.text}")
        return
    
    global_admin = login_res.json()
    token = global_admin['session_token']
    print(f"Logged in as {global_admin['name']}. Token: {token[:8]}...")

    headers = {"X-Session-Token": token}
    summary_res = requests.get(f"{BASE_URL}/analytics/summary", headers=headers)
    print(f"Global Summary: {summary_res.json()}")

    print("\n--- 2. Testing Program Admin (user@lyka.com) ---")
    login_res_lyka = requests.post(f"{BASE_URL}/login?email=user@lyka.com&password=YOUR_ADMIN_PASSWORD")
    if login_res_lyka.status_code != 200:
        print(f"Login failed: {login_res_lyka.text}")
        return
    
    lyka_admin = login_res_lyka.json()
    lyka_token = lyka_admin['session_token']
    print(f"Logged in as {lyka_admin['name']} (Program ID: {lyka_admin.get('program_id')}). Token: {lyka_token[:8]}...")

    headers_lyka = {"X-Session-Token": lyka_token}
    summary_res_lyka = requests.get(f"{BASE_URL}/analytics/summary", headers=headers_lyka)
    print(f"Program Summary: {summary_res_lyka.json()}")

    print("\n--- 3. Testing Token Validation (Invalid Token) ---")
    bad_headers = {"X-Session-Token": "invalid-token"}
    bad_res = requests.get(f"{BASE_URL}/analytics/summary", headers=bad_headers)
    print(f"Invalid Token Status: {bad_res.status_code} - {bad_res.text}")

if __name__ == "__main__":
    test_auth_and_scoping()
