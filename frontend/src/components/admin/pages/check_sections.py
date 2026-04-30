import re

def check_sections(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    opens = len(re.findall(r'<section', content))
    closes = len(re.findall(r'</section', content))
    
    print(f"Sections: {opens} open, {closes} close")

check_sections('c:/GlobalCore-Feedback/frontend/src/components/admin/pages/AdminFeedbacks.js')
