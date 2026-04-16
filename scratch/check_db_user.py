import sqlite3

def check_user(email):
    conn = sqlite3.connect('globalcore.db') # Assuming SQLite based on previous context/repo structure
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, username, is_active FROM global_user WHERE email = ?", (email,))
    user = cursor.fetchone()
    conn.close()
    if user:
        print(f"User found: ID={user[0]}, Email={user[1]}, Username={user[2]}, Active={user[3]}")
    else:
        print(f"User {email} NOT found in database.")

if __name__ == "__main__":
    check_user('pama@user.com')
