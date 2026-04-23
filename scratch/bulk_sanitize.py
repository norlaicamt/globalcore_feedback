import os
import re

root_dir = r"c:\GlobalCore-Feedback"
targets = [
    ('import os
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")', """
import os
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
"""),
    ('os.getenv("ADMIN_PASSWORD")', 'os.getenv("ADMIN_PASSWORD")'),
    ('os.getenv("ADMIN_PASSWORD")', 'os.getenv("ADMIN_PASSWORD")'),
    ("os.getenv("PAMA_PASSWORD")", 'os.getenv("PAMA_PASSWORD")'),
    ('password=os.getenv("ADMIN_PASSWORD")', 'password=os.getenv("ADMIN_PASSWORD")'),
    ('password = os.getenv("ADMIN_PASSWORD")', 'password = os.getenv("ADMIN_PASSWORD")'),
]

def sanitize_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    modified = False
    new_content = content
    for target, replacement in targets:
        if target in new_content:
            print(f"Sanitizing {file_path} for {target}")
            new_content = new_content.replace(target, replacement.strip())
            modified = True
    
    if modified:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)

for root, dirs, files in os.walk(root_dir):
    if "node_modules" in dirs:
        dirs.remove("node_modules")
    if ".git" in dirs:
        dirs.remove(".git")
    
    for file in files:
        if file.endswith(".py"):
            sanitize_file(os.path.join(root, file))

print("Sanitization script completed.")
