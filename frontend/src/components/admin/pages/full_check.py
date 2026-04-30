import re

def check_file_div_balance(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple regex to find all <div and </div
    # To handle self-closing, we need to find <div ... />
    
    opens = 0
    closes = 0
    
    # Find all <div
    # Use finditer to check if it's self-closing
    for match in re.finditer(r'<div', content):
        # Check if it's self-closing
        # Find the next >
        end_idx = content.find('>', match.start())
        if end_idx != -1:
            tag_content = content[match.start():end_idx+1]
            if tag_content.endswith('/>'):
                # Self-closing, don't count as open
                pass
            else:
                opens += 1
                
    # Find all </div
    closes = len(re.findall(r'</div', content))
    
    print(f"File Total Divs: {opens} open, {closes} close")

check_file_div_balance('c:/GlobalCore-Feedback/frontend/src/components/admin/pages/AdminFeedbacks.js')
