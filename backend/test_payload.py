import urllib.request
import json
import base64

large_payload = "A" * 500000
b64_str = f"data:image/jpeg;base64,{large_payload}"

payload = {
    "title": "Test Title",
    "description": "Test Desc",
    "category_id": 1,
    "sender_id": 1,
    "attachments": json.dumps([b64_str, b64_str])
}

req = urllib.request.Request("http://127.0.0.1:8000/feedbacks/", method="POST")
req.add_header('Content-Type', 'application/json')
data = json.dumps(payload).encode('utf-8')

try:
    with urllib.request.urlopen(req, data=data) as res:
        print(res.status, res.read().decode())
except Exception as e:
    print(f"Exception: {e}")
