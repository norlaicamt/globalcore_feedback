import json
import os
import urllib.request
import time
import re
import unicodedata

# PSGC Cloud API endpoints
BASE_URL = "https://psgc.cloud/api"
OUTPUT_DIR = r"C:\GlobalCore-Feedback\frontend\public\assets\locations"
BARANGAY_DIR = os.path.join(OUTPUT_DIR, "barangays")

# Create directories
os.makedirs(BARANGAY_DIR, exist_ok=True)

# List of official NCR Cities/Municipalities
# We use simpler strings to avoid encoding mismatches in the filter
NCR_LGUS_SEARCH = [
    "Manila", "Quezon", "Caloocan", "Las Pi", "Makati", "Malabon", 
    "Mandaluyong", "Marikina", "Muntinlupa", "Navotas", "Para", 
    "Pasay", "Pasig", "San Juan", "Taguig", "Valenzuela", "Pateros"
]

def fetch_json(endpoint):
    url = f"{BASE_URL}/{endpoint}"
    # print(f"Fetching {url}...")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            content = response.read()
            return json.loads(content.decode('utf-8'))
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def clean_name(name):
    if not name: return ""
    # Fix double-encoding of ñ if present
    try:
        # If it's double encoded, this might fix it
        # C3 B1 -> \u00c3\u00b1
        if "\u00c3\u00b1" in name or "Ã±" in name:
            name = name.encode('latin-1').decode('utf-8')
    except:
        pass
        
    name = re.sub(r"^(City of |Province of |Municipality of )", "", name, flags=re.IGNORECASE)
    name = name.replace("Peninzula", "Peninsula")
    return name.strip()

def is_ncr_lgu(name):
    for lgu in NCR_LGUS_SEARCH:
        if lgu.lower() in name.lower():
            return True
    return False

def run():
    print("Starting PSGC location data generation (V3.2)...")
    
    # Fetch all data once
    regions_raw = fetch_json("regions")
    all_provinces = fetch_json("provinces")
    all_cities = fetch_json("cities-municipalities")
    
    if not regions_raw or not all_provinces or not all_cities: 
        print("Failed to fetch initial data.")
        return
    
    region_map = {r['code'][:2]: clean_name(r['name']) for r in regions_raw}
    province_code_to_name = {p['code'][:4]: clean_name(p['name']) for p in all_provinces}

    region_list = sorted(list(region_map.values()))
    with open(os.path.join(OUTPUT_DIR, "regions.json"), "w", encoding='utf-8') as f:
        json.dump(region_list, f, ensure_ascii=False)
    
    provinces_by_region = {}
    cities_by_province = {}
    
    # Regular provinces
    for p in all_provinces:
        reg_name = region_map.get(p['code'][:2])
        if reg_name and reg_name != "National Capital Region (NCR)":
            if reg_name not in provinces_by_region: provinces_by_region[reg_name] = []
            provinces_by_region[reg_name].append(clean_name(p['name']))

    # NCR special handling
    ncr_cities = []
    for c in all_cities:
        if c['code'][:2] == '13':
            cname = clean_name(c['name'])
            if is_ncr_lgu(cname):
                ncr_cities.append(c)
                
    ncr_region_name = "National Capital Region (NCR)"
    provinces_by_region[ncr_region_name] = sorted(list(set([clean_name(c['name']) for c in ncr_cities])))

    # Group cities by province
    for c in all_cities:
        city_name = clean_name(c['name'])
        reg_code = c['code'][:2]
        
        if reg_code == '13':
            if is_ncr_lgu(city_name):
                cities_by_province[city_name] = [city_name]
        else:
            prov_name = province_code_to_name.get(c['code'][:4])
            if prov_name:
                if prov_name not in cities_by_province: cities_by_province[prov_name] = []
                cities_by_province[prov_name].append(city_name)
    
    # Save provinces and cities
    with open(os.path.join(OUTPUT_DIR, "provinces.json"), "w", encoding='utf-8') as f:
        json.dump(provinces_by_region, f, ensure_ascii=False)
    with open(os.path.join(OUTPUT_DIR, "cities.json"), "w", encoding='utf-8') as f:
        json.dump(cities_by_province, f, ensure_ascii=False)

    # Fetch barangays
    cities_to_fetch = []
    for cities in cities_by_province.values():
        for city in cities:
            # Find closest match for city in all_cities
            match = [c for c in all_cities if clean_name(c['name']) == city]
            if match: cities_to_fetch.append(match[0])

    print("Fetching barangays...")
    total = len(cities_to_fetch)
    for i, c in enumerate(cities_to_fetch):
        city_name = clean_name(c['name'])
        # ASCII normalize for filename safety (e.g. Parañaque -> Paranaque)
        safe_name = "".join(x for x in unicodedata.normalize('NFD', city_name) if unicodedata.category(x) != 'Mn')
        safe_name = "".join(x for x in safe_name if x.isalnum() or x in " -_").strip()
        path = os.path.join(BARANGAY_DIR, f"{safe_name}.json")
        
        if os.path.exists(path): continue
        
        if i % 20 == 0:
            print(f"Progress: {i}/{total}")
            time.sleep(0.5) # Increased sleep to avoid 429
            
        data = fetch_json(f"cities-municipalities/{c['code']}/barangays")
        if data:
            names = sorted([clean_name(b['name']) for b in data])
            with open(path, "w", encoding='utf-8') as f:
                json.dump(names, f, ensure_ascii=False)

    print("Done!")

if __name__ == "__main__":
    run()
