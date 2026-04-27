
import re

content = open('c:/GlobalCore-Feedback/frontend/src/components/admin/pages/AdminBroadcast.js', 'r', encoding='utf-8').read()

# Remove comments
content = re.sub(r'\{/\*.*?\*/\}', '', content, flags=re.DOTALL)

stack = []
tags = re.findall(r'<(/?)([a-zA-Z0-9]+)|(/>)', content)

for tag in tags:
    if tag[2] == '/>': # Self-closing
        continue
    
    is_closing = tag[0] == '/'
    tag_name = tag[1]
    
    if is_closing:
        if not stack:
            print(f"Extra closing tag </{tag_name}>")
            continue
        last_tag = stack.pop()
        if last_tag != tag_name:
            print(f"Mismatched tag: expected </{last_tag}>, got </{tag_name}>")
    else:
        stack.append(tag_name)

if stack:
    print(f"Unclosed tags: {stack}")
else:
    print("All tags balanced!")
