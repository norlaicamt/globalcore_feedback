
import re

content = open('c:/GlobalCore-Feedback/frontend/src/components/admin/pages/AdminBroadcast.js', 'r', encoding='utf-8').read()

# Remove comments
content = re.sub(r'\{/\*.*?\*/\}', '', content, flags=re.DOTALL)

# Find all tags
# This is a bit naive but should work for basic React JSX
tags = re.findall(r'<(/?)([a-zA-Z0-9.]+)|(/>)', content)

stack = []
self_closing_html = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}

for i, tag in enumerate(tags):
    is_closing = tag[0] == '/'
    tag_name = tag[1]
    is_self_closing = tag[2] == '/>'
    
    if is_self_closing:
        continue
    
    if is_closing:
        if not stack:
            print(f"Extra closing tag </{tag_name}> at index {i}")
            continue
        last_tag = stack.pop()
        if last_tag != tag_name:
            print(f"Mismatched tag at index {i}: expected </{last_tag}>, got </{tag_name}>")
    else:
        if tag_name.lower() in self_closing_html:
            # HTML tags that are usually self-closing in browser but MUST be closed in JSX
            # Wait, in JSX they MUST have /> if they don't have children.
            # If they don't have /> and don't have </tag>, they are invalid in JSX.
            stack.append(tag_name)
        else:
            stack.append(tag_name)

if stack:
    print(f"Unclosed tags: {stack}")
else:
    print("All tags balanced!")
