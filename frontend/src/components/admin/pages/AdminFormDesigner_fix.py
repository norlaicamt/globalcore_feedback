
import os

filepath = r'c:\GlobalCore-Feedback\frontend\src\components\admin\pages\AdminFormDesigner.js'
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# We want to replace lines 1396-1400 (0-indexed: 1395-1399)
# Current state:
# 1396:                                 </div>
# 1397:                               )}
# 1398:                             </div>
# 1399:                           );
# 1400:                       })}

# Target state:
#                                   </div>
#                                 )}
#                               </div>
#                             )}
#                           </div>
#                         );
#                       })}

new_content = [
    '                                  </div>\n',
    '                                )}\n',
    '                              </div>\n',
    '                            )}\n',
    '                          </div>\n',
    '                        );\n',
    '                      })}\n'
]

# Find the location
start_idx = -1
for i, line in enumerate(lines):
    if 'value={item.config?.placeholder || ""}' in line:
        # The following lines should be our target
        if '</div>' in lines[i+4] and ')}' in lines[i+5]:
            start_idx = i + 4
            break

if start_idx != -1:
    lines[start_idx:start_idx+5] = new_content
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print("File fixed successfully")
else:
    print("Could not find the target location")
