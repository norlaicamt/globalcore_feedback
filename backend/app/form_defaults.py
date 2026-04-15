# backend/app/form_defaults.py

DEFAULT_FORM_CONFIG = {
    "version": 2,
    "steps": [
        { "id": "type",    "label": "How can we help?", "enabled": True,  "order": 1, "type": "core" },
        { "id": "entity",  "label": "Select Service",   "enabled": True,  "order": 2, "type": "core" },
        { "id": "branch",  "label": "Location",         "enabled": True,  "order": 3, "type": "core" },
        { "id": "details", "label": "Report Details",   "enabled": True,  "order": 4, "type": "core" }
    ],
    "toggles": {
        "staff": { "enabled": True, "label": "Staff Involved" },
        "rating": { "enabled": True, "label": "Rate Experience" },
        "attachments": { "enabled": True, "label": "Upload Photo" },
        "voice": { "enabled": True, "label": "Voice Recording" }
    },
    "sections": [],
    "terminology": {
        "entity_label": "Program",
        "location_label": "Office"
    }
}

def migrate_step_schema(config: dict) -> dict:
    """
    Upgrades legacy v1 configs (numeric step IDs) to v2 (string step IDs with order/type).
    Safe to call on any config version.
    """
    if config.get("version", 1) >= 2:
        return config

    id_map = { 1: "type", 2: "entity", 3: "branch", 4: "details" }
    new_steps = []
    for s in config.get("steps", []):
        old_id = s.get("id")
        new_steps.append({
            "id":      id_map.get(old_id, f"custom_{old_id}"),
            "label":   s.get("label", "Step"),
            "enabled": s.get("enabled", True),
            "order":   old_id if isinstance(old_id, int) else len(new_steps) + 1,
            "type":    "core" if old_id in id_map else "custom"
        })

    config["steps"] = new_steps
    config["version"] = 2
    return config

