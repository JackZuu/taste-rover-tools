"""
Seasonal foods module — what's in season in the UK by month.

Returns two things:
  1. In-season ingredients (for display only — not directly addable to menu)
  2. Seasonal meal suggestions using those ingredients (addable to menu)

Tries OpenAI (gpt-4o-mini) first for richer, context-aware seasonal data.
Falls back to the hardcoded monthly list if OpenAI is unavailable.
AI results are cached per calendar month.

DATA SOURCE: OpenAI gpt-4o-mini | hardcoded fallback
"""
import os
import json
from datetime import date
from app.models import SeasonalItem, SeasonalMeal, SeasonalResult
from app.taxonomy import MENU_CATEGORIES

# ---------------------------------------------------------------------------
# OpenAI availability
# ---------------------------------------------------------------------------
_OPENAI_AVAILABLE = False
try:
    from openai import OpenAI as _OpenAI
    _OPENAI_AVAILABLE = True
except ImportError:
    pass

# Month-keyed cache: {month_int: SeasonalResult}
_ai_cache: dict = {}

# Valid category values for ingredients
VALID_INGREDIENT_CATS = {"produce", "protein", "seafood", "game", "herb", "dairy", "dessert", "beverage", "grain"}

# ---------------------------------------------------------------------------
# Hardcoded fallback (ingredients only — meals generated from these)
# ---------------------------------------------------------------------------
_SEASONAL: dict[int, list[dict]] = {
    1:  [
        {"name": "Leeks",                      "category": "produce"},
        {"name": "Parsnips",                   "category": "produce"},
        {"name": "Kale",                       "category": "produce"},
        {"name": "Blood Oranges",              "category": "produce"},
        {"name": "Venison",                    "category": "game"},
    ],
    2:  [
        {"name": "Purple Sprouting Broccoli",  "category": "produce"},
        {"name": "Forced Rhubarb",             "category": "produce"},
        {"name": "Leeks",                      "category": "produce"},
        {"name": "Clementines",                "category": "produce"},
        {"name": "Mussels",                    "category": "seafood"},
    ],
    3:  [
        {"name": "Forced Rhubarb",             "category": "produce"},
        {"name": "Purple Sprouting Broccoli",  "category": "produce"},
        {"name": "Spring Onions",              "category": "produce"},
        {"name": "Sorrel",                     "category": "herb"},
        {"name": "Sea Trout",                  "category": "seafood"},
    ],
    4:  [
        {"name": "Asparagus",                  "category": "produce"},
        {"name": "Jersey Royals",              "category": "produce"},
        {"name": "Watercress",                 "category": "produce"},
        {"name": "Wild Garlic",                "category": "herb"},
        {"name": "Lamb",                       "category": "protein"},
    ],
    5:  [
        {"name": "Asparagus",                  "category": "produce"},
        {"name": "Radishes",                   "category": "produce"},
        {"name": "Gooseberries",               "category": "produce"},
        {"name": "Elderflower",                "category": "herb"},
        {"name": "Mackerel",                   "category": "seafood"},
    ],
    6:  [
        {"name": "Strawberries",               "category": "produce"},
        {"name": "Cherries",                   "category": "produce"},
        {"name": "Broad Beans",                "category": "produce"},
        {"name": "Courgettes",                 "category": "produce"},
        {"name": "Crab",                       "category": "seafood"},
    ],
    7:  [
        {"name": "Tomatoes",                   "category": "produce"},
        {"name": "Raspberries",                "category": "produce"},
        {"name": "Peas",                       "category": "produce"},
        {"name": "Basil",                      "category": "herb"},
        {"name": "Salmon",                     "category": "seafood"},
    ],
    8:  [
        {"name": "Sweetcorn",                  "category": "produce"},
        {"name": "Blackberries",               "category": "produce"},
        {"name": "Courgettes",                 "category": "produce"},
        {"name": "Plums",                      "category": "produce"},
        {"name": "Crab",                       "category": "seafood"},
    ],
    9:  [
        {"name": "Apples",                     "category": "produce"},
        {"name": "Pears",                      "category": "produce"},
        {"name": "Squash",                     "category": "produce"},
        {"name": "Wild Mushrooms",             "category": "produce"},
        {"name": "Grouse",                     "category": "game"},
    ],
    10: [
        {"name": "Pumpkin",                    "category": "produce"},
        {"name": "Chestnuts",                  "category": "produce"},
        {"name": "Quince",                     "category": "produce"},
        {"name": "Kale",                       "category": "produce"},
        {"name": "Pheasant",                   "category": "game"},
    ],
    11: [
        {"name": "Parsnips",                   "category": "produce"},
        {"name": "Brussels Sprouts",           "category": "produce"},
        {"name": "Cranberries",                "category": "produce"},
        {"name": "Celeriac",                   "category": "produce"},
        {"name": "Venison",                    "category": "game"},
    ],
    12: [
        {"name": "Brussels Sprouts",           "category": "produce"},
        {"name": "Red Cabbage",                "category": "produce"},
        {"name": "Clementines",                "category": "produce"},
        {"name": "Chestnuts",                  "category": "produce"},
        {"name": "Turkey",                     "category": "protein"},
    ],
}

# Hardcoded fallback meals (simple mapping from key ingredients)
_FALLBACK_MEALS: dict[int, list[dict]] = {
    1:  [{"name": "Leek & Potato Soup", "category": "snacks", "linked_ingredient": "Leeks", "estimated_price_gbp": 5.50},
         {"name": "Parsnip Fries", "category": "sides", "linked_ingredient": "Parsnips", "estimated_price_gbp": 4.50}],
    2:  [{"name": "Rhubarb Crumble", "category": "desserts", "linked_ingredient": "Forced Rhubarb", "estimated_price_gbp": 5.50}],
    3:  [{"name": "Rhubarb Crumble", "category": "desserts", "linked_ingredient": "Forced Rhubarb", "estimated_price_gbp": 5.50},
         {"name": "Sea Trout Wrap", "category": "grill", "linked_ingredient": "Sea Trout", "estimated_price_gbp": 9.00}],
    4:  [{"name": "Asparagus & Halloumi Wrap", "category": "grill", "linked_ingredient": "Asparagus", "estimated_price_gbp": 8.50},
         {"name": "Lamb Skewer", "category": "grill", "linked_ingredient": "Lamb", "estimated_price_gbp": 9.50}],
    5:  [{"name": "Elderflower Lemonade", "category": "cold_drinks", "linked_ingredient": "Elderflower", "estimated_price_gbp": 3.50},
         {"name": "Mackerel Wrap", "category": "grill", "linked_ingredient": "Mackerel", "estimated_price_gbp": 8.50}],
    6:  [{"name": "Strawberries & Cream", "category": "desserts", "linked_ingredient": "Strawberries", "estimated_price_gbp": 5.00},
         {"name": "Crab Sandwich", "category": "snacks", "linked_ingredient": "Crab", "estimated_price_gbp": 8.50}],
    7:  [{"name": "Caprese Salad", "category": "sides", "linked_ingredient": "Tomatoes", "estimated_price_gbp": 5.50},
         {"name": "Raspberry Sorbet", "category": "desserts", "linked_ingredient": "Raspberries", "estimated_price_gbp": 4.50}],
    8:  [{"name": "Corn on the Cob", "category": "sides", "linked_ingredient": "Sweetcorn", "estimated_price_gbp": 4.00},
         {"name": "Blackberry Crumble", "category": "desserts", "linked_ingredient": "Blackberries", "estimated_price_gbp": 5.50}],
    9:  [{"name": "Squash Soup", "category": "snacks", "linked_ingredient": "Squash", "estimated_price_gbp": 5.50},
         {"name": "Wild Mushroom Toastie", "category": "snacks", "linked_ingredient": "Wild Mushrooms", "estimated_price_gbp": 7.00}],
    10: [{"name": "Pumpkin Soup", "category": "snacks", "linked_ingredient": "Pumpkin", "estimated_price_gbp": 5.50},
         {"name": "Chestnut Brownie", "category": "desserts", "linked_ingredient": "Chestnuts", "estimated_price_gbp": 5.00}],
    11: [{"name": "Parsnip Soup", "category": "snacks", "linked_ingredient": "Parsnips", "estimated_price_gbp": 5.50},
         {"name": "Cranberry Hot Chocolate", "category": "hot_drinks", "linked_ingredient": "Cranberries", "estimated_price_gbp": 4.00}],
    12: [{"name": "Turkey Wrap", "category": "grill", "linked_ingredient": "Turkey", "estimated_price_gbp": 8.50},
         {"name": "Chestnut Roast Bun", "category": "snacks", "linked_ingredient": "Chestnuts", "estimated_price_gbp": 7.00}],
}

# ---------------------------------------------------------------------------
# OpenAI fetch
# ---------------------------------------------------------------------------

def _get_ai_seasonal(month: int, month_name: str) -> SeasonalResult | None:
    """
    Use OpenAI to fetch UK seasonal ingredients + meal suggestions.
    Results are cached per calendar month.
    """
    if not _OPENAI_AVAILABLE or not os.getenv("OPENAI_API_KEY"):
        return None

    if month in _ai_cache:
        return _ai_cache[month]

    try:
        from app.prompts import seasonal_prompt
        client = _OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        prompt = seasonal_prompt(month_name, month)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=1200,
            temperature=0.2,
        )
        raw = response.choices[0].message.content or "{}"
        parsed = json.loads(raw)

        # Parse ingredients
        items_raw = parsed.get("ingredients", parsed.get("items", []))
        items = []
        for it in items_raw:
            cat = it.get("category", "produce")
            if cat not in VALID_INGREDIENT_CATS:
                cat = "produce"
            items.append(SeasonalItem(name=it.get("name", ""), category=cat))

        # Parse meals
        valid_menu_cats = set(MENU_CATEGORIES)
        meals_raw = parsed.get("meals", [])
        meals = []
        for m in meals_raw:
            cat = m.get("category", "snacks")
            if cat not in valid_menu_cats:
                cat = "snacks"
            meals.append(SeasonalMeal(
                name=m.get("name", ""),
                category=cat,
                linked_ingredient=m.get("linked_ingredient", ""),
                estimated_price_gbp=round(float(m.get("estimated_price_gbp", 7.0)), 2),
            ))

        result = SeasonalResult(
            month=month_name,
            items=items,
            meals=meals,
            source="openai",
        )
        _ai_cache[month] = result
        return result
    except Exception:
        pass

    return None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_seasonal(month: int | None = None) -> SeasonalResult:
    """
    Return in-season UK ingredients + meal suggestions for the given month.
    Defaults to the current calendar month.
    Tries OpenAI first, falls back to hardcoded list.
    DATA SOURCE: OpenAI gpt-4o-mini | hardcoded fallback
    """
    if month is None:
        month = date.today().month
    month = max(1, min(12, month))
    month_name = date(2000, month, 1).strftime("%B")

    ai_result = _get_ai_seasonal(month, month_name)
    if ai_result:
        return ai_result

    items = [SeasonalItem(**i) for i in _SEASONAL.get(month, [])]
    meals = [SeasonalMeal(**m) for m in _FALLBACK_MEALS.get(month, [])]
    return SeasonalResult(month=month_name, items=items, meals=meals, source="hardcoded")


if __name__ == "__main__":
    result = get_seasonal()
    print(f"Source: {result.source}  |  In season — {result.month}:")
    print("Ingredients:")
    for item in result.items:
        print(f"  • {item.name} ({item.category})")
    print("Meal suggestions:")
    for meal in result.meals:
        print(f"  • {meal.name} [{meal.category}] — uses {meal.linked_ingredient} (~£{meal.estimated_price_gbp:.2f})")
