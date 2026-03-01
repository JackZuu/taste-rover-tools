"""
Equipment module — van-based equipment availability.

Each van has a fixed set of equipment items. Availability reflects
real-world variation between vans (some items are broken/missing).

DATA SOURCE: hardcoded
"""
from app.models import Van, EquipmentItem, VanEquipmentResult, EquipmentResult

# ─── Hardcoded van definitions ────────────────────────────────────────────────

_VANS: list[dict] = [
    {"id": "van_alpha",  "name": "Van Alpha",  "base_location": "North London Depot",   "postcode": "N1 9GU"},
    {"id": "van_beta",   "name": "Van Beta",   "base_location": "South London Depot",   "postcode": "SE1 7PB"},
    {"id": "van_gamma",  "name": "Van Gamma",  "base_location": "East London Depot",    "postcode": "E1 6RF"},
    {"id": "van_delta",  "name": "Van Delta",  "base_location": "West London Depot",    "postcode": "W1T 1JY"},
]

# Equipment availability per van — True = working, False = missing/broken
_VAN_EQUIPMENT: dict[str, list[dict]] = {
    "van_alpha": [
        {"name": "Kettle",          "available": True},
        {"name": "Broiler",         "available": True},
        {"name": "Fryer",           "available": True},
        {"name": "Grill",           "available": True},
        {"name": "Fridge",          "available": True},
        {"name": "Freezer",         "available": False},
        {"name": "Blender",         "available": True},
        {"name": "Coffee machine",  "available": True},
        {"name": "Microwave",       "available": True},
        {"name": "Panini press",    "available": False},
    ],
    "van_beta": [
        {"name": "Kettle",          "available": True},
        {"name": "Broiler",         "available": False},
        {"name": "Fryer",           "available": True},
        {"name": "Grill",           "available": True},
        {"name": "Fridge",          "available": True},
        {"name": "Freezer",         "available": True},
        {"name": "Blender",         "available": False},
        {"name": "Coffee machine",  "available": True},
        {"name": "Microwave",       "available": True},
        {"name": "Panini press",    "available": True},
    ],
    "van_gamma": [
        {"name": "Kettle",          "available": True},
        {"name": "Broiler",         "available": True},
        {"name": "Fryer",           "available": False},
        {"name": "Grill",           "available": True},
        {"name": "Fridge",          "available": True},
        {"name": "Freezer",         "available": True},
        {"name": "Blender",         "available": True},
        {"name": "Coffee machine",  "available": False},
        {"name": "Microwave",       "available": True},
        {"name": "Panini press",    "available": True},
    ],
    "van_delta": [
        {"name": "Kettle",          "available": True},
        {"name": "Broiler",         "available": True},
        {"name": "Fryer",           "available": True},
        {"name": "Grill",           "available": False},
        {"name": "Fridge",          "available": True},
        {"name": "Freezer",         "available": True},
        {"name": "Blender",         "available": True},
        {"name": "Coffee machine",  "available": True},
        {"name": "Microwave",       "available": False},
        {"name": "Panini press",    "available": True},
    ],
}


# ─── Public API ───────────────────────────────────────────────────────────────

def list_vans() -> list[Van]:
    """Return all available vans."""
    return [Van(**v) for v in _VANS]


def get_van_equipment(van_id: str) -> VanEquipmentResult:
    """
    Return equipment availability for the given van.
    Falls back to van_alpha if van_id is unknown.
    DATA SOURCE: hardcoded
    """
    van_data = next((v for v in _VANS if v["id"] == van_id), _VANS[0])
    van = Van(**van_data)
    raw = _VAN_EQUIPMENT.get(van_id, _VAN_EQUIPMENT["van_alpha"])
    items = [EquipmentItem(name=e["name"], available=e["available"]) for e in raw]
    available = sum(1 for i in items if i.available)
    return VanEquipmentResult(van=van, equipment=items, available_count=available, total_count=len(items))


# Legacy helper kept for backward compatibility with flow.py (meal-based)
def get_equipment(meal: str) -> EquipmentResult:
    """Deprecated — use get_van_equipment(van_id) instead."""
    result = get_van_equipment("van_alpha")
    return EquipmentResult(equipment=result.equipment, all_ready=result.available_count == result.total_count)


if __name__ == "__main__":
    for van in list_vans():
        r = get_van_equipment(van.id)
        print(f"\n{r.van.name} ({r.van.base_location}): {r.available_count}/{r.total_count} items available")
        for eq in r.equipment:
            print(f"  {'✓' if eq.available else '✗'} {eq.name}")
