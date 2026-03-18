"""
Seasonal foods module — what's in season in the UK by month.

Tries OpenAI (gpt-4o-mini) first for richer, context-aware seasonal data.
Falls back to the hardcoded monthly list if OpenAI is unavailable.
AI results are cached per calendar month.

DATA SOURCE: OpenAI gpt-4o-mini | hardcoded fallback
"""
import os
import json
from datetime import date
from app.models import SeasonalItem, SeasonalResult

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

# Valid category values for the taxonomy
VALID_CATEGORIES = {"produce", "protein", "seafood", "game", "herb", "dairy", "dessert", "beverage", "grain"}

# ---------------------------------------------------------------------------
# Hardcoded fallback
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

# ---------------------------------------------------------------------------
# OpenAI fetch
# ---------------------------------------------------------------------------

def _get_ai_seasonal(month: int, month_name: str) -> SeasonalResult | None:
    """
    Use OpenAI to fetch UK seasonal foods for the given month.
    Results are cached per calendar month.
    """
    if not _OPENAI_AVAILABLE or not os.getenv("OPENAI_API_KEY"):
        return None

    if month in _ai_cache:
        return _ai_cache[month]

    try:
        client = _OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        prompt = (
            f"Month: {month_name}. "
            f"List 8 to 12 UK-grown or UK-available seasonal foods and ingredients that are at their best in {month_name}. "
            f"Focus on ingredients a street food van could realistically use or highlight. "
            f"Return a JSON object with: "
            f"\"month\" (string, the month name), "
            f"\"items\" (array of objects each with \"name\" (title case string) and "
            f"\"category\" (one of: produce, protein, seafood, game, herb, dairy, dessert, beverage, grain)). "
            f"Return JSON only."
        )
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=600,
            temperature=0.2,
        )
        raw = response.choices[0].message.content or "{}"
        parsed = json.loads(raw)
        items_raw = parsed.get("items", [])
        if not isinstance(items_raw, list) or not items_raw:
            return None

        items = []
        for it in items_raw:
            cat = it.get("category", "produce")
            if cat not in VALID_CATEGORIES:
                cat = "produce"
            items.append(SeasonalItem(name=it["name"], category=cat))

        result = SeasonalResult(
            month=parsed.get("month", month_name),
            items=items,
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
    Return in-season UK foods for the given month (1–12).
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
    return SeasonalResult(month=month_name, items=items, source="hardcoded")


if __name__ == "__main__":
    result = get_seasonal()
    print(f"Source: {result.source}  |  In season — {result.month}:")
    for item in result.items:
        print(f"  • {item.name} ({item.category})")
