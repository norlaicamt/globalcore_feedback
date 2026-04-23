import os

filepath = r'c:\GlobalCore-Feedback\frontend\src\components\admin\pages\AdminFormDesigner.js'
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'value={item.config?.placeholder || ""}' in line:
        # i is line 1392
        # i+2 is line 1394 currently holding "                                      />"
        lines.insert(i+2, "                                      style={{ ...st.input(theme), height: '32px', fontSize: '12px' }}\n")
        break

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Fixed style properly!')
