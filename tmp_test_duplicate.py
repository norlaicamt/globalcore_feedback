import requests
import json
import time

BASE_URL = "http://localhost:8000/api" # Adjust to your local backend URL

def test_duplicate_feedback():
    payload = {
        "sender_id": 22, # Use an existing user ID
        "feedback_type": "idea",
        "entity_id": 25, # Use an existing entity ID
        "description": "This is a test feedback for duplicate protection " + str(time.time()),
        "rating": 5,
        "is_anonymous": False,
        "allow_comments": True,
        "custom_data": {}
    }

    print("Submitting first feedback...")
    resp1 = requests.post(f"{BASE_URL}/feedbacks/", json=payload)
    if resp1.status_code != 200:
        print(f"Error submitting first: {resp1.status_code} {resp1.text}")
        return
    
    id1 = resp1.json().get("id")
    print(f"First feedback ID: {id1}")

    print("Submitting identical feedback immediately...")
    resp2 = requests.post(f"{BASE_URL}/feedbacks/", json=payload)
    if resp2.status_code != 200:
        print(f"Error submitting second: {resp2.status_code} {resp2.text}")
        return
    
    id2 = resp2.json().get("id")
    print(f"Second feedback ID: {id2}")

    if id1 == id2:
        print("SUCCESS: Duplicate prevented (returned same ID)")
    else:
        print("FAILURE: Duplicate created (returned different ID)")

if __name__ == "__main__":
    test_duplicate_feedback()
