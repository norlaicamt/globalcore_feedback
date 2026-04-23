import os

filepath = r'c:\GlobalCore-Feedback\frontend\src\components\admin\pages\AdminFormDesigner.js'
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'value={item.config?.placeholder || ""}' in line:
        new_lines = [
            '                                  </div>\n',
            '                                )}\n',
            '                              </div>\n',
            '                            )}\n',
            '                          </div>\n',
            '                        );\n',
            '                      })}\n'
        ]
        # Replace lines 1395 to 1399
        lines[i+3:i+8] = new_lines
        break

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Fixed!')
