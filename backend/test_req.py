import requests
import json

payload = {
    "avatar_url": "data:image/jpeg;base64," + ("A" * 80000)
}
res = requests.put("http://127.0.0.1:8000/users/1", json=payload)
print(f"Status: {res.status_code}")
print(f"Response: {res.text}")
