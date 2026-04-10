import requests

def test_mentions():
    try:
        # Assuming user 1 is our current user for testing
        user_id = 1
        url = f"http://localhost:8000/feedbacks/?mentioned_user_id={user_id}"
        resp = requests.get(url)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            feedbacks = resp.json()
            print(f"Found {len(feedbacks)} mentioned posts")
            for f in feedbacks:
                print(f"- {f['title']} (ID: {f['id']})")
        else:
            print(f"Error: {resp.text}")
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    test_mentions()
