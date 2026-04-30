import re

def check_div_balance(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We only care about the FeedbackSidePanel component
    # Let's find the content between the start of the return and the end of the component
    start_marker = 'const FeedbackSidePanel = ('
    end_marker = 'const MetricBox ='
    
    start_idx = content.find(start_marker)
    end_idx = content.find(end_marker)
    
    if start_idx == -1 or end_idx == -1:
        print("Markers not found")
        return
    
    sub_content = content[start_idx:end_idx]
    
    opens = len(re.findall(r'<div', sub_content))
    closes = len(re.findall(r'</div', sub_content))
    
    sections_open = len(re.findall(r'<section', sub_content))
    sections_close = len(re.findall(r'</section', sub_content))
    
    print(f"Divs: {opens} open, {closes} close")
    print(f"Sections: {sections_open} open, {sections_close} close")
    
    # Check fragment balance
    frag_open = len(re.findall(r'<>', sub_content))
    frag_close = len(re.findall(r'</>', sub_content))
    print(f"Fragments: {frag_open} open, {frag_close} close")

check_div_balance('c:/GlobalCore-Feedback/frontend/src/components/admin/pages/AdminFeedbacks.js')
