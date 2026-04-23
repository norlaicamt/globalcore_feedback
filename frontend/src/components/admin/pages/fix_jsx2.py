import os

filepath = r'c:\GlobalCore-Feedback\frontend\src\components\admin\pages\AdminFormDesigner.js'
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'value={item.config?.placeholder || ""}' in line:
        new_lines = [
            '                                      />\n',
            '                                  </div>\n',
            '                                )}\n',
            '                              </div>\n',
            '                            )}\n',
            '                          </div>\n',
            '                        );\n',
            '                      })}\n'
        ]
        # Current state has lost the /> and has duplicate endings.
        # Lines 1395 to 1402 are indices i+3 to i+10
        lines[i+2:i+11] = new_lines
        break

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Fixed properly!')
