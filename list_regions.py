import json

input_file = r'C:\Users\Admin Philceb\.gemini\antigravity\brain\26bc99e1-46c7-4276-883d-0ae92ae73834\.system_generated\steps\88\content.md'

with open(input_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()
    json_start = 0
    for i, line in enumerate(lines):
        if line.strip() == '{':
            json_start = i
            break
    
    data = json.loads(''.join(lines[json_start:]))

regions = sorted(list(set(feature['properties'].get('REGION') for feature in data['features'])))

print("Region List:")
for idx, r in enumerate(regions):
    print(f"{idx+1}. {r}")
