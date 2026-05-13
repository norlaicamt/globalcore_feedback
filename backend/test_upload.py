import urllib.request
import urllib.parse
import json
import os

def test_upload():
    # create a dummy file
    with open("dummy.png", "wb") as f:
        f.write(b"fake image content")
        
    url = "http://localhost:8000/feedbacks/upload"
    
    # Simple multipart/form-data request using urllib
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    
    body = (
        f"--{boundary}\r\n"
        f"Content-Disposition: form-data; name=\"file\"; filename=\"dummy.png\"\r\n"
        f"Content-Type: image/png\r\n\r\n"
        f"fake image content\r\n"
        f"--{boundary}--\r\n"
    )
    
    req = urllib.request.Request(url, data=body.encode('utf-8'))
    req.add_header('Content-type', f'multipart/form-data; boundary={boundary}')
    
    try:
        with urllib.request.urlopen(req) as response:
            print(f"Status Code: {response.status}")
            print(f"Response: {response.read().decode('utf-8')}")
    except urllib.error.HTTPError as e:
        print(f"Status Code: {e.code}")
        print(f"Response: {e.read().decode('utf-8')}")

if __name__ == "__main__":
    test_upload()
