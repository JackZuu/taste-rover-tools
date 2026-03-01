from app.models import EquipmentItem, EquipmentResult

# Mock equipment registry — replace with a real asset/inventory system later
_MOCK_EQUIPMENT: dict[str, list[dict]] = {
    "strawberry ice cream": [
        {"name": "Ice cream maker",   "available": True},
        {"name": "Hand blender",      "available": True},
        {"name": "Mixing bowls",      "available": True},
        {"name": "Fine-mesh sieve",   "available": True},
        {"name": "Freezer-safe tub",  "available": True},
    ],
    "tomato soup": [
        {"name": "Large saucepan",          "available": True},
        {"name": "Hand blender / blender",  "available": True},
        {"name": "Chopping board & knife",  "available": True},
        {"name": "Wooden spoon",            "available": True},
        {"name": "Ladle",                   "available": False},
    ],
}


def get_equipment(meal: str) -> EquipmentResult:
    """
    Returns equipment requirements and availability for the given meal.
    Currently backed by mock data — wire to a real asset tracker later.
    """
    raw = _MOCK_EQUIPMENT.get(meal, [])
    items = [
        EquipmentItem(name=e["name"], available=e["available"])
        for e in raw
    ]
    all_ready = all(e.available for e in items)
    return EquipmentResult(equipment=items, all_ready=all_ready)


if __name__ == "__main__":
    for meal in ("strawberry ice cream", "tomato soup"):
        result = get_equipment(meal)
        print(f"\n{meal}:")
        for eq in result.equipment:
            status = "✓" if eq.available else "✗"
            print(f"  {status} {eq.name}")
        print(f"  All ready: {result.all_ready}")
