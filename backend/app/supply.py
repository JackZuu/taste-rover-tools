"""
Supply chain module — nearby suppliers and general ingredient inventory.

Suppliers and inventory are region-agnostic mock data; in production
these would be fetched from a real stock management / supplier API.

DATA SOURCE: mock data
"""
from app.models import (
    Supplier, InventoryItem, SupplyChainResult,
    SupplyIngredient, SupplyResult,
)


# ─── Mock supplier network ────────────────────────────────────────────────────

_SUPPLIERS: list[dict] = [
    {
        "name": "Fresh Fields Wholesale",
        "distance_miles": 4.2,
        "lead_time_hours": 2,
        "categories": ["produce", "dairy", "herbs"],
        "reliability_pct": 94,
    },
    {
        "name": "BritMeat Co.",
        "distance_miles": 7.8,
        "lead_time_hours": 4,
        "categories": ["meat", "poultry", "deli"],
        "reliability_pct": 88,
    },
    {
        "name": "Sunrise Bakery Supplies",
        "distance_miles": 2.1,
        "lead_time_hours": 1,
        "categories": ["bread", "pastry", "flour"],
        "reliability_pct": 97,
    },
    {
        "name": "Coolchain Beverages",
        "distance_miles": 11.5,
        "lead_time_hours": 6,
        "categories": ["drinks", "dairy", "frozen"],
        "reliability_pct": 82,
    },
    {
        "name": "Spice & Sauce Depot",
        "distance_miles": 5.9,
        "lead_time_hours": 3,
        "categories": ["condiments", "spices", "sauces"],
        "reliability_pct": 91,
    },
]

# ─── Mock ingredient inventory ────────────────────────────────────────────────

_INVENTORY: list[dict] = [
    # Produce
    {"name": "Tomatoes",        "category": "produce",    "status": "in_stock"},
    {"name": "Strawberries",    "category": "produce",    "status": "low"},
    {"name": "Lettuce",         "category": "produce",    "status": "in_stock"},
    {"name": "Onions",          "category": "produce",    "status": "in_stock"},
    {"name": "Garlic",          "category": "produce",    "status": "in_stock"},
    {"name": "Potatoes",        "category": "produce",    "status": "in_stock"},
    # Dairy
    {"name": "Double cream",    "category": "dairy",      "status": "low"},
    {"name": "Cheddar cheese",  "category": "dairy",      "status": "in_stock"},
    {"name": "Butter",          "category": "dairy",      "status": "in_stock"},
    {"name": "Milk",            "category": "dairy",      "status": "in_stock"},
    # Meat / protein
    {"name": "Beef patties",    "category": "meat",       "status": "in_stock"},
    {"name": "Chicken breast",  "category": "poultry",    "status": "in_stock"},
    {"name": "Bacon",           "category": "meat",       "status": "low"},
    # Bread / pastry
    {"name": "Burger buns",     "category": "bread",      "status": "in_stock"},
    {"name": "Wraps",           "category": "bread",      "status": "in_stock"},
    # Pantry
    {"name": "Caster sugar",    "category": "pantry",     "status": "out"},
    {"name": "Olive oil",       "category": "pantry",     "status": "in_stock"},
    {"name": "Vegetable stock", "category": "pantry",     "status": "in_stock"},
    # Frozen
    {"name": "Ice cream mix",   "category": "frozen",     "status": "out"},
    {"name": "Frozen chips",    "category": "frozen",     "status": "in_stock"},
]


# ─── Public API ───────────────────────────────────────────────────────────────

def get_supply_chain() -> SupplyChainResult:
    """
    Return nearby suppliers and general ingredient inventory.
    DATA SOURCE: mock data
    """
    suppliers = [Supplier(**s) for s in _SUPPLIERS]
    inventory = [InventoryItem(**i) for i in _INVENTORY]
    return SupplyChainResult(suppliers=suppliers, inventory=inventory)


# Legacy helper — returns meal-specific ingredient subset (backward compat)
_LEGACY_ITEMS: dict[str, list[dict]] = {
    "strawberry ice cream": [
        {"name": "Strawberries",   "quantity": "500 g",  "available": True},
        {"name": "Double cream",   "quantity": "300 ml", "available": True},
        {"name": "Caster sugar",   "quantity": "150 g",  "available": False},
        {"name": "Vanilla extract","quantity": "1 tsp",  "available": True},
    ],
    "tomato soup": [
        {"name": "Tomatoes",       "quantity": "800 g",  "available": True},
        {"name": "Vegetable stock","quantity": "500 ml", "available": True},
        {"name": "Onion",          "quantity": "1 large","available": True},
        {"name": "Olive oil",      "quantity": "2 tbsp", "available": True},
        {"name": "Double cream",   "quantity": "50 ml",  "available": False},
    ],
}

def get_ingredient_supply(meal: str) -> SupplyResult:
    """Deprecated — use get_supply_chain() instead."""
    raw = _LEGACY_ITEMS.get(meal, [])
    ingredients = [SupplyIngredient(**i) for i in raw]
    return SupplyResult(ingredients=ingredients, all_available=all(i.available for i in ingredients))


if __name__ == "__main__":
    result = get_supply_chain()
    print("=== Suppliers ===")
    for s in result.suppliers:
        print(f"  {s.name} — {s.distance_miles} mi, {s.lead_time_hours}h lead, {s.reliability_pct}% reliable")
        print(f"    Categories: {', '.join(s.categories)}")
    print("\n=== Inventory ===")
    for item in result.inventory:
        icon = "✓" if item.status == "in_stock" else ("⚠" if item.status == "low" else "✗")
        print(f"  {icon} {item.name} ({item.category}) — {item.status}")
