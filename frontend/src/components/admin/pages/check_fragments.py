import re

def check_fragments(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    opens = len(re.findall(r'<>', content))
    closes = len(re.findall(r'</>', content))
    
    print(f"Fragments: {opens} open, {closes} close")

check_fragments('c:/GlobalCore-Feedback/frontend/src/components/admin/pages/AdminFeedbacks.js')
