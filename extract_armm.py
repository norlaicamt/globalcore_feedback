import json

input_file = r'C:\Users\Admin Philceb\.gemini\antigravity\brain\26bc99e1-46c7-4276-883d-0ae92ae73834\.system_generated\steps\88\content.md'
output_file = 'armm_raw.json'

with open(input_file, 'r', encoding='utf-8') as f:
    # Skip the header lines if any (the preview showed Source: ... and ---)
    lines = f.readlines()
    json_start = 0
    for i, line in enumerate(lines):
        if line.strip() == '{':
            json_start = i
            break
    
    data = json.loads(''.join(lines[json_start:]))

armm_feature = None
for feature in data['features']:
    if feature['properties'].get('REGION') == 'Autonomous Region of Muslim Mindanao (ARMM)':
        armm_feature = feature
        break

if armm_feature:
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(armm_feature, f)
    print(f"Successfully extracted ARMM feature to {output_file}")
else:
    print("ARMM feature not found")
