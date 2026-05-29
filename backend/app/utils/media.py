import os
import base64
import uuid
import re

def save_base64_image(base64_string: str, folder: str, filename_prefix: str) -> str:
    """
    Saves a base64 encoded image string to a file and returns the relative URL.
    Returns the original string if it is not a base64 image.
    """
    if not base64_string or not isinstance(base64_string, str) or not base64_string.startswith("data:image/"):
        return base64_string

    try:
        # Extract format and data
        header, data = base64_string.split(",", 1)
        match = re.search(r"data:image/([a-zA-Z+]+);base64", header)
        if not match:
            return base64_string
        
        ext = match.group(1)
        if ext == "jpeg":
            ext = "jpg"
            
        # Ensure target folder exists
        upload_dir = os.path.join("uploads", folder)
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        filename = f"{filename_prefix}_{uuid.uuid4().hex[:8]}.{ext}"
        filepath = os.path.join(upload_dir, filename)
        
        # Decode and save
        with open(filepath, "wb") as f:
            f.write(base64.b64decode(data))
            
        # Return the public URL path
        return f"/uploads/{folder}/{filename}"
    except Exception as e:
        print(f"Error saving base64 image: {e}")
        return base64_string
