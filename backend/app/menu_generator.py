"""
Menu generator module — produces a structured POC menu proposal.

Combines weather, primary recommendation, trends, seasonal foods,
celebrations and regional demand to generate a plausible menu.

Accuracy is NOT required — this is a functional POC.
DATA SOURCE: hardcoded logic + inputs from other modules
"""
from app.models import WeatherResult, MenuProposal

# ─── Hardcoded item pools ─────────────────────────────────────────────────────

_GRILL_WARM  = ["Smash Burger", "Grilled Chicken", "BBQ Pulled Pork Bun", "Halloumi Skewer"]
_GRILL_COLD  = ["Hot Dog", "Bacon & Egg Roll", "Sausage Sandwich", "Chicken Thigh Wrap"]
_SNACKS_WARM = ["Nachos", "Chicken Strips", "Corn on the Cob", "Falafel Bites"]
_SNACKS_COLD = ["Arancini Balls", "Samosas", "Spring Rolls", "Mac Bites"]
_COLD_DRINKS = ["Lemonade", "Mango Slush", "Iced Coffee", "Watermelon Juice", "Sparkling Water"]
_HOT_DRINKS  = ["Flat White", "Chai Latte", "Hot Chocolate", "English Breakfast Tea", "Matcha Latte"]
_SIDES_WARM  = ["Sweet Potato Fries", "Coleslaw", "Side Salad", "Corn Ribs"]
_SIDES_COLD  = ["Loaded Fries", "Cheesy Chips", "Onion Rings", "Garlic Bread"]
_DESSERTS_WARM = ["Strawberry Ice Cream", "Mango Sorbet", "Churros", "Fruit Skewer"]
_DESSERTS_COLD = ["Warm Brownie", "Sticky Toffee Pudding", "Crumble Pot", "Hot Waffle"]

# Trend → item mappings (if a trend matches, inject the item into the menu)
_TREND_INJECTIONS: dict[str, tuple[str, str]] = {
    "Matcha":          ("hot_drinks", "Matcha Latte"),
    "Loaded fries":    ("sides",      "Loaded Fries"),
    "Smash burgers":   ("grill",      "Smash Burger"),
    "Plant-based burgers": ("grill",  "Plant-Based Burger"),
    "Korean-inspired street food": ("snacks", "Korean Fried Cauliflower"),
    "Birria tacos":    ("grill",      "Birria-Style Wrap"),
}

# Celebration → dessert injection
_CELEBRATION_DESSERTS: dict[str, str] = {
    "Halloween":     "Pumpkin Spice Cupcake",
    "Christmas Day": "Mince Pie",
    "Valentine's Day": "Chocolate Fondant",
    "Easter Sunday": "Hot Cross Bun",
    "Bonfire Night": "Toffee Apple",
}


def generate_menu(
    weather: WeatherResult,
    primary_meal: str,
    region: str = "London",
    active_trends: list[str] | None = None,
    seasonal_items: list[str] | None = None,
    upcoming_celebration: str | None = None,
) -> MenuProposal:
    """
    Generate a structured menu proposal for the given conditions.
    DATA SOURCE: hardcoded logic
    """
    is_warm = weather.avg_temp > 15 and not weather.is_rainy

    grill    = list(_GRILL_WARM[:3]  if is_warm else _GRILL_COLD[:3])
    snacks   = list(_SNACKS_WARM[:2] if is_warm else _SNACKS_COLD[:2])
    sides    = list(_SIDES_WARM[:2]  if is_warm else _SIDES_COLD[:2])
    desserts = list(_DESSERTS_WARM[:2] if is_warm else _DESSERTS_COLD[:2])
    cold_drinks = _COLD_DRINKS[:3]
    hot_drinks  = _HOT_DRINKS[:3]

    # Ensure primary meal features somewhere
    if "ice cream" in primary_meal and primary_meal.title() not in desserts:
        desserts.insert(0, primary_meal.title())
    elif "soup" in primary_meal and primary_meal.title() not in grill:
        snacks.insert(0, primary_meal.title())

    # Inject trend-driven items
    for trend_label, (slot, item) in _TREND_INJECTIONS.items():
        if active_trends and any(trend_label.lower() in t.lower() for t in active_trends):
            if slot == "grill"      and item not in grill:    grill.append(item)
            elif slot == "snacks"   and item not in snacks:   snacks.append(item)
            elif slot == "sides"    and item not in sides:    sides.append(item)
            elif slot == "hot_drinks" and item not in hot_drinks: hot_drinks.append(item)

    # Inject seasonal item (first one that fits a food category)
    if seasonal_items:
        for s in seasonal_items[:2]:
            if s not in grill and s not in snacks:
                snacks.append(f"Seasonal {s} special")

    # Inject celebration dessert
    if upcoming_celebration:
        for keyword, dessert in _CELEBRATION_DESSERTS.items():
            if keyword.lower() in upcoming_celebration.lower():
                if dessert not in desserts:
                    desserts.append(dessert)

    # Regional tweak — add regional specialty to grill
    _REGIONAL_SPECIALS: dict[str, str] = {
        "Scotland":   "Haggis Roll",
        "Wales":      "Welsh Lamb Wrap",
        "N. Ireland": "Ulster Fry Wrap",
        "South West": "Cornish Pasty",
        "North East": "Stottie Sandwich",
        "North West": "Chip Butty",
    }
    if region in _REGIONAL_SPECIALS and _REGIONAL_SPECIALS[region] not in grill:
        grill.append(_REGIONAL_SPECIALS[region])

    # Calculate rough proportions (hardcoded approximations)
    all_items = grill + snacks + sides + desserts
    total = max(1, len(all_items))
    veggie_items = {"Halloumi Skewer", "Side Salad", "Nachos", "Corn on the Cob",
                    "Sweet Potato Fries", "Falafel Bites", "Fruit Skewer",
                    "Mango Sorbet", "Strawberry Ice Cream", "Churros"}
    vegan_items  = {"Mango Sorbet", "Fruit Skewer", "Falafel Bites", "Corn on the Cob"}
    pct_veggie = round(len([i for i in all_items if i in veggie_items]) / total * 100)
    pct_vegan  = round(len([i for i in all_items if i in vegan_items])  / total * 100)
    pct_gf     = 20  # approximation

    influences = ["weather conditions"]
    if active_trends:
        influences.append("current trends")
    if seasonal_items:
        influences.append("seasonal produce")
    if upcoming_celebration:
        influences.append(f"upcoming {upcoming_celebration}")
    if region in _REGIONAL_SPECIALS:
        influences.append(f"{region} regional demand")

    return MenuProposal(
        grill=grill,
        snacks=snacks,
        cold_drinks=list(cold_drinks),
        sides=sides,
        desserts=desserts,
        hot_drinks=list(hot_drinks),
        pct_veggie=pct_veggie,
        pct_vegan=pct_vegan,
        pct_gluten_free=pct_gf,
        influences=influences,
    )


if __name__ == "__main__":
    import json
    from app.models import WeatherResult
    weather = WeatherResult(date="2025-06-01", avg_temp=20.0, condition="mainly sun", is_rainy=False)
    menu = generate_menu(weather, "strawberry ice cream", region="London",
                         active_trends=["Matcha", "Smash burgers"],
                         seasonal_items=["Strawberries", "Asparagus"],
                         upcoming_celebration="Easter Sunday")
    print(json.dumps(menu.__dict__, indent=2))
