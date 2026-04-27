
content = open('c:/GlobalCore-Feedback/frontend/src/components/admin/pages/AdminBroadcast.js', 'r', encoding='utf-8').read()

stack = []
for i, c in enumerate(content):
    if c == '{': stack.append(('{', i))
    elif c == '}':
        if not stack or stack[-1][0] != '{': 
            line = content.count('\n', 0, i) + 1
            print(f"Extra }} at line {line}")
            break
        stack.pop()
    elif c == '(': stack.append(('(', i))
    elif c == ')':
        if not stack or stack[-1][0] != '(': 
            line = content.count('\n', 0, i) + 1
            print(f"Extra ) at line {line}")
            break
        stack.pop()
    elif c == '[': stack.append(('[', i))
    elif c == ']':
        if not stack or stack[-1][0] != '[': 
            line = content.count('\n', 0, i) + 1
            print(f"Extra ] at line {line}")
            break
        stack.pop()

if stack:
    for t, pos in stack:
        line = content.count('\n', 0, pos) + 1
        print(f"Unclosed {t} at line {line}")
else:
    print("All balanced!")
