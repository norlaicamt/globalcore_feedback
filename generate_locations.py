import json
import os
import urllib.request

# URL of the Philippine PSGC data in JSON format
url = "https://raw.githubusercontent.com/flores-jacob/philippine-regions-provinces-cities-municipalities-barangays/master/philippine_provinces_cities_municipalities_and_barangays_2019.json"

output_dir = r"C:\GlobalCore-Feedback\frontend\public\assets\locations"
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

try:
    print("Fetching Philippine PSGC data...")
    with urllib.request.urlopen(url) as response:
        data = json.loads(response.read().decode('utf-8'))

    # Partition the data
    regions = []
    provinces = {}
    cities = {}
    barangays = {}

    # Extract regions (the 1st level keys)
    for reg_name, reg_data in data.items():
        regions.append(reg_name)
        provinces[reg_name] = list(reg_data.get('province_list', {}).keys())
        
        for prov_name, prov_data in reg_data.get('province_list', {}).items():
            cities[prov_name] = list(prov_data.get('municipality_list', {}).keys())
            
            for city_name, city_data in prov_data.get('municipality_list', {}).items():
                barangays[city_name] = city_data.get('barangay_list', [])

    # Save to JSON files
    with open(os.path.join(output_dir, 'regions.json'), 'w') as f:
        json.dump(sorted(regions), f)
    
    with open(os.path.join(output_dir, 'provinces.json'), 'w') as f:
        json.dump(provinces, f)

    with open(os.path.join(output_dir, 'cities.json'), 'w') as f:
        json.dump(cities, f)

    # For barangays, split them into separate files per city to avoid a giant file
    barangay_dir = os.path.join(output_dir, 'barangays')
    if not os.path.exists(barangay_dir):
        os.makedirs(barangay_dir)
    
    for city_name, brgy_list in barangays.items():
        # Clean city name for filename (remove spaces and special chars)
        safe_city_name = "".join(x for x in city_name if x.isalnum() or x in " -_").strip()
        with open(os.path.join(barangay_dir, f"{safe_city_name}.json"), 'w') as f:
            json.dump(brgy_list, f)

    print("Successfully generated location data in frontend/public/assets/locations/")

except Exception as e:
    print(f"Error fetching/parsing data: {e}")
