import json
import os
import urllib.request

base_url = "https://raw.githubusercontent.com/isaacdarcilla/philippine-addresses/master/"
levels = ["region", "province", "city", "barangay"]

output_dir = r"C:\GlobalCore-Feedback\frontend\public\assets\locations"
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

def fetch_json(level):
    url = f"{base_url}{level}.json"
    print(f"Fetching {level}.json...")
    with urllib.request.urlopen(url) as response:
        return json.loads(response.read().decode('utf-8'))

try:
    regions_raw = fetch_json("region")
    provinces_raw = fetch_json("province")
    cities_raw = fetch_json("city")
    barangays_raw = fetch_json("barangay")

    # The region.json typically has [{"id": 1, "region_name": "...", "region_code": "..."}]
    # We want a mapping that's easy to cascade.
    
    # 1. Regions
    regions = sorted([r['region_name'] for r in regions_raw])
    with open(os.path.join(output_dir, 'regions.json'), 'w') as f:
        json.dump(regions, f)
        
    # Map region_code to province names
    region_code_to_name = {r['region_code']: r['region_name'] for r in regions_raw}
    
    # 2. Provinces grouped by region name
    provinces_by_region = {}
    for p in provinces_raw:
        reg_name = region_code_to_name.get(p['region_code'])
        if reg_name:
            if reg_name not in provinces_by_region:
                provinces_by_region[reg_name] = []
            provinces_by_region[reg_name].append(p['province_name'])
    
    with open(os.path.join(output_dir, 'provinces.json'), 'w') as f:
        # Sort each list
        for reg in provinces_by_region:
            provinces_by_region[reg] = sorted(provinces_by_region[reg])
        json.dump(provinces_by_region, f)

    # 3. Cities grouped by province name
    prov_code_to_name = {p['province_code']: p['province_name'] for p in provinces_raw}
    cities_by_province = {}
    for c in cities_raw:
        prov_name = prov_code_to_name.get(c['province_code'])
        if prov_name:
            if prov_name not in cities_by_province:
                cities_by_province[prov_name] = []
            cities_by_province[prov_name].append(c['city_name'])
            
    with open(os.path.join(output_dir, 'cities.json'), 'w') as f:
        for prov in cities_by_province:
            cities_by_province[prov] = sorted(cities_by_province[prov])
        json.dump(cities_by_province, f)

    # 4. Barangays grouped by city name
    city_code_to_name = {c['city_code']: c['city_name'] for c in cities_raw}
    barangay_dir = os.path.join(output_dir, 'barangays')
    if not os.path.exists(barangay_dir):
        os.makedirs(barangay_dir)
        
    # We'll buffer them to avoid too many file writes if possible, 
    # but city by city is better for the frontend.
    temp_barangays = {}
    for b in barangays_raw:
        city_name = city_code_to_name.get(b['city_code'])
        if city_name:
            if city_name not in temp_barangays:
                temp_barangays[city_name] = []
            temp_barangays[city_name].append(b['brgy_name'])
            
    for city_name, brgy_list in temp_barangays.items():
        safe_city_name = "".join(x for x in city_name if x.isalnum() or x in " -_").strip()
        with open(os.path.join(barangay_dir, f"{safe_city_name}.json"), 'w') as f:
            json.dump(sorted(brgy_list), f)

    print("Location data generation complete!")

except Exception as e:
    print(f"Error: {e}")
