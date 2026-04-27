
content = open('c:/GlobalCore-Feedback/frontend/src/components/admin/pages/AdminBroadcast.js', 'r', encoding='utf-8').read()
p = 0
for i, c in enumerate(content):
    if c == '(':
        p += 1
    elif c == ')':
        p -= 1
    if p < 0:
        line = content.count('\n', 0, i) + 1
        print(f"Extra closing paren at line {line}, char {i}")
        break
print(f"Final Paren Balance: {p}")
