
content = open('c:/GlobalCore-Feedback/frontend/src/components/admin/pages/AdminBroadcast.js', 'r', encoding='utf-8').read()
b = 0
p = 0
for i, c in enumerate(content):
    if c == '{':
        b += 1
    elif c == '}':
        b -= 1
    elif c == '(':
        p += 1
    elif c == ')':
        p -= 1
    
    if b < 0:
        print(f"Extra closing brace at char {i}")
        # Print context
        start = max(0, i-20)
        end = min(len(content), i+20)
        print(f"Context: ...{content[start:end]}...")
        break
    if p < 0:
        print(f"Extra closing paren at char {i}")
        start = max(0, i-20)
        end = min(len(content), i+20)
        print(f"Context: ...{content[start:end]}...")
        break

print(f"Final Balance - Braces: {b}, Parens: {p}")
