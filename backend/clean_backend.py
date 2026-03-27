import os

files = [
    os.path.join("app", "models.py"),
    os.path.join("app", "schemas.py"),
    os.path.join("app", "crud.py"),
    os.path.join("app", "routers", "admin.py")
]

for file_path in files:
    if not os.path.exists(file_path):
        continue
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Remove literal backslash-n sequences
    # They appear as literal '\' and 'n' in the file
    content = content.replace("\\\\n", "")
    
    # Logic to fix models.py duplication specifically if needed
    if "models.py" in file_path:
        # If we have class BroadcastLog twice, keep only the first one
        parts = content.split("class BroadcastLog(Base):")
        if len(parts) > 2:
            # Reconstruct with only the first definition
            # parts[0] is the prefix, parts[1] is the first class, parts[2] is the second
            # We assume the second one is at the very end
            content = parts[0] + "class BroadcastLog(Base):" + parts[1]
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\\n")

print("Backend files sanitized.")
