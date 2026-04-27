
content = open('c:/GlobalCore-Feedback/frontend/src/components/admin/pages/AdminBroadcast.js', 'r', encoding='utf-8').read()
b = 0
lines = content.split('\n')
for i, line in enumerate(lines):
    old_b = b
    for c in line:
        if c == '{': b += 1
        elif c == '}': b -= 1
    if b != old_b:
        print(f"Line {i+1:3}: Balance {old_b:2} -> {b:2} | {line.strip()[:60]}")
