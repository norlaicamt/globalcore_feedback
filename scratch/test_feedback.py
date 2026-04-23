import requests

# Test submission to http://localhost:8000/feedbacks/
# Using the entities we found earlier (entity_id 1 exists)

payload = {
    "entity_id": 1,
    "description": "Test feedback from script",
    "rating": 5,
    "is_anonymous": True,
    "feedback_type": "Appreciation",
    "custom_data": {}
}

try:
    response = requests.post("http://localhost:8000/feedbacks/", json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
