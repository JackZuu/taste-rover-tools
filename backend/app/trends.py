"""
Trends module — high-level food & beverage trend signals.

DATA SOURCE: hardcoded
"""
from app.models import TrendItem, TrendsResult

_TRENDS: list[dict] = [
    {"label": "Matcha",                      "direction": "up",     "category": "beverage"},
    {"label": "Protein snacks",              "direction": "up",     "category": "snack"},
    {"label": "Plant-based burgers",         "direction": "up",     "category": "main"},
    {"label": "Hot honey drizzle",           "direction": "up",     "category": "condiment"},
    {"label": "Korean-inspired street food", "direction": "up",     "category": "cuisine"},
    {"label": "Loaded fries",                "direction": "up",     "category": "side"},
    {"label": "Smash burgers",               "direction": "up",     "category": "main"},
    {"label": "Cold brew coffee",            "direction": "stable", "category": "beverage"},
    {"label": "Traditional fish & chips",    "direction": "down",   "category": "main"},
    {"label": "Gluten-free options",         "direction": "up",     "category": "dietary"},
    {"label": "Birria tacos",                "direction": "up",     "category": "cuisine"},
    {"label": "Overnight oats",             "direction": "stable", "category": "breakfast"},
]


def get_trends() -> TrendsResult:
    """
    Return current food & beverage trend signals.
    DATA SOURCE: hardcoded
    """
    return TrendsResult(trends=[TrendItem(**t) for t in _TRENDS])


if __name__ == "__main__":
    result = get_trends()
    icons = {"up": "📈", "down": "📉", "stable": "➡️"}
    for t in result.trends:
        print(f"  {icons[t.direction]} {t.label} ({t.category})")
