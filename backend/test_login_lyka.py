import requests

BASE_URL = "http://127.0.0.1:8000/admin"

def test_login():
    email = "user@lyka.com"
    password = "YOUR_ADMIN_PASSWORD"
    print(f"Testing login for {email}...")
    res = requests.post(f"{BASE_URL}/login?email={email}&password={password}")
    print(f"Status: {res.status_code}")
    if res.status_code == 200:
        print("Success!")
        print(res.json())
    else:
        print("Failed!")
        print(res.text)

if __name__ == "__main__":
    test_login()
