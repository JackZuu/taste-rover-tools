from app.models import SupplyIngredient, SupplyResult

# Mock inventory — replace with a real stock/DB lookup later
_MOCK_INVENTORY: dict[str, list[dict]] = {
    "strawberry ice cream": [
        {"name": "Strawberries",     "quantity": "500 g",  "available": True},
        {"name": "Double cream",     "quantity": "300 ml", "available": True},
        {"name": "Caster sugar",     "quantity": "150 g",  "available": False},
        {"name": "Vanilla extract",  "quantity": "1 tsp",  "available": True},
        {"name": "Lemon juice",      "quantity": "1 tbsp", "available": True},
    ],
    "tomato soup": [
        {"name": "Tomatoes",         "quantity": "800 g",  "available": True},
        {"name": "Vegetable stock",  "quantity": "500 ml", "available": True},
        {"name": "Onion",            "quantity": "1 large","available": True},
        {"name": "Garlic",           "quantity": "3 cloves","available": True},
        {"name": "Olive oil",        "quantity": "2 tbsp", "available": True},
        {"name": "Double cream",     "quantity": "50 ml",  "available": False},
        {"name": "Fresh basil",      "quantity": "handful","available": True},
    ],
}


def get_ingredient_supply(meal: str) -> SupplyResult:
    """
    Returns ingredient availability for the given meal.
    Currently backed by mock inventory — wire to a real stock system later.
    """
    raw = _MOCK_INVENTORY.get(meal, [])
    ingredients = [
        SupplyIngredient(name=i["name"], quantity=i["quantity"], available=i["available"])
        for i in raw
    ]
    all_available = all(i.available for i in ingredients)
    return SupplyResult(ingredients=ingredients, all_available=all_available)


if __name__ == "__main__":
    for meal in ("strawberry ice cream", "tomato soup"):
        result = get_ingredient_supply(meal)
        print(f"\n{meal}:")
        for ing in result.ingredients:
            status = "✓" if ing.available else "✗"
            print(f"  {status} {ing.name} ({ing.quantity})")
        print(f"  All available: {result.all_available}")
