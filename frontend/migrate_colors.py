import os
import re

import glob

search_dir = "src"

def replace_colors(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Rule 1: Replace #1f2a56 or #1F2A56
    content = re.sub(r'#1f2a56', 'var(--primary-color)', content, flags=re.IGNORECASE)
    
    # Rule 2: Replace rgba(31, 42, 86, X) exactly
    content = re.sub(r'rgba\(31,\s*42,\s*86,\s*([0-9.]+)\)', r'rgba(var(--primary-rgb), \1)', content)
    
    # Rule 3: Replace rgb(31, 42, 86)
    content = re.sub(r'rgb\(31,\s*42,\s*86\)', r'rgb(var(--primary-rgb))', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Starting color migration...")
count = 0
for filepath in glob.glob(os.path.join(search_dir, "**/*.js"), recursive=True):
    replace_colors(filepath)
    count += 1

print(f"Processed {count} JS files successfully.")
