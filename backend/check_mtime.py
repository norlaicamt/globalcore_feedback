import os
from datetime import datetime

file_path = r'c:\GlobalCore-Feedback\frontend\src\components\GeneralFeedback.js'
mtime = os.path.getmtime(file_path)
print(f"GeneralFeedback.js was modified at: {datetime.fromtimestamp(mtime)}")
