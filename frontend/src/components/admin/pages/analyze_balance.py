import re

def detailed_balance_check(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    start_marker = 'const FeedbackSidePanel = ('
    end_marker = 'const MetricBox ='
    
    start_idx = content.find(start_marker)
    end_idx = content.find(end_marker)
    
    if start_idx == -1 or end_idx == -1:
        print("Markers not found")
        return
    
    sub_content = content[start_idx:end_idx]
    
    stack = []
    lines = sub_content.split('\n')
    
    matching = {
        '</div': '<div',
        '</section': '<section',
        '</>': '<>'
    }
    
    for i, line in enumerate(lines):
        # We look for <div (start of opening tag), </div (start of closing tag), etc.
        found = re.findall(r'<div|</div|<section|</section|<>|</>', line)
        for tag in found:
            if tag.startswith('</'):
                if not stack:
                    print(f"Error: Orphaned closing tag {tag} at line {i+1}: {line.strip()}")
                else:
                    top_tag, top_line, top_content = stack.pop()
                    expected = matching.get(tag)
                    if top_tag != expected:
                        print(f"Error: Mismatched tag at line {i+1}. Found {tag} but expected closing for {top_tag} from line {top_line}")
                        print(f"  Line {i+1} content: {line.strip()}")
                        print(f"  Top tag content: {top_content}")
            else:
                stack.append((tag, i+1, line.strip()))
    
    if stack:
        print("\nUnclosed tags at end of block:")
        for tag, line_no, content in stack:
            print(f"  {tag} at line {line_no}: {content}")

detailed_balance_check('c:/GlobalCore-Feedback/frontend/src/components/admin/pages/AdminFeedbacks.js')
