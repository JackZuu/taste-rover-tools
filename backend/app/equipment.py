"""
Equipment module — van-based equipment availability.

Van Alpha uses real equipment specs from TasteRover_Kitchen_Equipment_Specs_V3.xlsx.
Other vans still use placeholder data.

DATA SOURCE: Van Alpha = real specs (xlsx), others = mock
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
# Van Alpha: real specs from TasteRover_Kitchen_Equipment_Specs_V3.xlsx
_VAN_EQUIPMENT: dict[str, list[dict]] = {
    "van_alpha": [
        {
            "name": "Broiler", "available": True,
            "model": "Nieco JF62 Electric Conveyor Broiler",
            "electrical": "400V 3-phase", "peak_kw": 20.0, "avg_kw": "8\u201310",
            "weight_kg": 180.0, "dimensions_cm": "122x86x55",
            "clearance": "30 cm rear ventilation",
            "price_new": 22000.0, "price_used": 11000.0,
            "notes": "Only used ON-SHORE",
        },
        {
            "name": "Convection Oven #1", "available": True,
            "model": "Chandley Pico",
            "electrical": "230V 1-phase", "peak_kw": 3.0, "avg_kw": "1.5",
            "weight_kg": 55.0, "dimensions_cm": "60x70x60",
            "clearance": "10 cm sides",
            "price_new": 4500.0, "price_used": 1800.0,
            "notes": "Two units used",
        },
        {
            "name": "Convection Oven #2", "available": True,
            "model": "Chandley Pico",
            "electrical": "230V 1-phase", "peak_kw": 3.0, "avg_kw": "1.5",
            "weight_kg": 55.0, "dimensions_cm": "60x70x60",
            "clearance": "10 cm sides",
            "price_new": 4500.0, "price_used": 1800.0,
        },
        {
            "name": "Finishing Conveyor", "available": True,
            "model": "Quartz Melt Finisher",
            "electrical": "230V 1-phase", "peak_kw": 2.0, "avg_kw": "1",
            "weight_kg": 35.0, "dimensions_cm": "80x55x35",
            "clearance": "10 cm ventilation",
            "price_new": 3200.0, "price_used": 1300.0,
            "notes": "Can be custom-built",
        },
        {
            "name": "Heated Window Shelf", "available": True,
            "model": "Heated Vending Shelf",
            "electrical": "230V 1-phase", "peak_kw": 0.8, "avg_kw": "0.4",
            "weight_kg": 30.0, "dimensions_cm": "120x60",
            "clearance": "Minimal",
            "price_new": 2300.0, "price_used": 700.0,
            "notes": "Simple device, easy to fabricate",
        },
        {
            "name": "Coffee Machine", "available": True,
            "model": "Eversys Cameo C\u20192",
            "electrical": "230V 1-phase", "peak_kw": 3.2, "avg_kw": "1.5",
            "weight_kg": 65.0, "dimensions_cm": "60x60x58",
            "clearance": "10 cm rear",
            "price_new": 17000.0, "price_used": 9000.0,
        },
        {
            "name": "Milk Foamer", "available": True,
            "model": "Eversys Everfoam",
            "electrical": "230V 1-phase", "peak_kw": 1.0, "avg_kw": "0.5",
            "weight_kg": 30.0, "dimensions_cm": "20x40x45",
            "clearance": "Minimal",
            "price_new": 2000.0, "price_used": 1000.0,
        },
        {
            "name": "Container Refrigeration", "available": True,
            "model": "Cartridge Cold Rack",
            "electrical": "230V 1-phase", "peak_kw": 1.8, "avg_kw": "0.7",
            "weight_kg": 140.0, "dimensions_cm": "120x80x180",
            "clearance": "10 cm rear",
            "price_new": 4800.0, "price_used": 2200.0,
            "notes": "Container system",
        },
        {
            "name": "Tray Conveyor", "available": True,
            "model": "Magnetic Rail Conveyor",
            "electrical": "230V 1-phase", "peak_kw": 0.5, "avg_kw": "0.2",
            "weight_kg": 70.0, "dimensions_cm": "250x40",
            "clearance": "Minimal",
            "price_new": 4200.0, "price_used": 2000.0,
            "notes": "Can be simplified/self-built",
        },
        {
            "name": "Tray Loading Station", "available": True,
            "model": "Tray Staging Station",
            "electrical": "230V 1-phase", "peak_kw": 0.2, "avg_kw": "0.1",
            "weight_kg": 45.0, "dimensions_cm": "120x40",
            "clearance": "Minimal",
            "price_new": 2100.0, "price_used": 800.0,
        },
        {
            "name": "Tray Scanner", "available": True,
            "model": "NFC / QR Module",
            "electrical": "230V 1-phase", "peak_kw": 0.1, "avg_kw": "0.05",
            "weight_kg": 8.0, "dimensions_cm": "40x30",
            "clearance": "Minimal",
            "price_new": 1500.0,
            "notes": "Traceability",
        },
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
    items = [EquipmentItem(
        name=e["name"], available=e["available"],
        model=e.get("model"), electrical=e.get("electrical"),
        peak_kw=e.get("peak_kw"), avg_kw=e.get("avg_kw"),
        weight_kg=e.get("weight_kg"), dimensions_cm=e.get("dimensions_cm"),
        clearance=e.get("clearance"), price_new=e.get("price_new"),
        price_used=e.get("price_used"), notes=e.get("notes"),
    ) for e in raw]
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
