# backend/app/form_defaults.py

DEFAULT_FORM_CONFIG = {
    "version": 3,
    "steps": [
        { "id": "type",    "label": "How can we help?", "enabled": True,  "order": 1, "items": [{ "type": "module", "key": "feedback_type" }] },
        { "id": "entity",  "label": "Select Service",   "enabled": True,  "order": 2, "items": [{ "type": "module", "key": "entity_picker" }] },
        { "id": "branch",  "label": "Location",         "enabled": True,  "order": 3, "items": [{ "type": "module", "key": "location_picker" }] },
        { "id": "details", "label": "Report Details",   "enabled": True,  "order": 4, "items": [{ "type": "module", "key": "message_input" }] }
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
    Upgrades legacy configs:
    v1 -> v2: Numeric IDs to string IDs.
    v2 -> v3: Flat steps to Modular items.
    """
    version = config.get("version", 1)
    
    # Pre-v2 Migration
    if version < 2:
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
        version = 2

    # v2 -> v3 Migration (Modular)
    if version == 2:
        for s in config.get("steps", []):
            if "items" not in s:
                s["items"] = []
                # Map legacy core types
                if s.get("id") == "type":    s["items"].append({ "type": "module", "key": "feedback_type" })
                elif s.get("id") == "entity":  s["items"].append({ "type": "module", "key": "entity_picker" })
                elif s.get("id") == "branch":  s["items"].append({ "type": "module", "key": "location_picker" })
                elif s.get("id") == "details": s["items"].append({ "type": "module", "key": "message_input" })
                # Map legacy modular keys
                elif s.get("type") == "module" and s.get("module_key"):
                    s["items"].append({ "type": "module", "key": s.get("module_key") })
                # Map legacy section links
                elif s.get("type") == "custom_section" and s.get("linked_section_id"):
                    s["items"].append({ "type": "section", "section_id": s.get("linked_section_id") })
                
                # Cleanup old fields
                s.pop("type", None)
                s.pop("module_key", None)
                s.pop("linked_section_id", None)
        
        config["version"] = 3

    return config

