import requests

def test_profiles():
    try:
        url = "http://localhost:8000/users/profiles"
        resp = requests.get(url)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            profiles = resp.json()
            print(f"Found {len(profiles)} profiles")
            if len(profiles) > 0:
                print(f"Sample: {profiles[0]}")
        else:
            print(f"Error: {resp.text}")
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    test_profiles()
