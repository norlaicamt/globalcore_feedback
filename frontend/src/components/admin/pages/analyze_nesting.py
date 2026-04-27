
content = open('c:/GlobalCore-Feedback/frontend/src/components/admin/pages/AdminBroadcast.js', 'r', encoding='utf-8').read()
stack = []
for i, c in enumerate(content):
    if c == '{':
        stack.append(('{', i))
    elif c == '}':
        if not stack:
            print(f"Extra closing brace at {i}")
            break
        stack.pop()
    elif c == '(':
        stack.append(('(', i))
    elif c == ')':
        if not stack:
            print(f"Extra closing paren at {i}")
            break
        stack.pop()

if stack:
    print("Unclosed tokens:")
    for t, pos in stack:
        start = max(0, pos-20)
        end = min(len(content), pos+40)
        line = content.count('\n', 0, pos) + 1
        print(f"Token {t} at line {line}, char {pos}: ...{content[start:end].replace('\n', ' ')}...")
else:
    print("Perfect balance!")
