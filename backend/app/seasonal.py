"""
Seasonal foods module — what's in season in the UK by month.

DATA SOURCE: hardcoded
"""
from datetime import date
from app.models import SeasonalItem, SeasonalResult

_SEASONAL: dict[int, list[dict]] = {
    1:  [  # January
        {"name": "Leeks",           "category": "produce"},
        {"name": "Parsnips",        "category": "produce"},
        {"name": "Kale",            "category": "produce"},
        {"name": "Blood oranges",   "category": "produce"},
        {"name": "Venison",         "category": "protein"},
    ],
    2:  [  # February
        {"name": "Purple sprouting broccoli", "category": "produce"},
        {"name": "Forced rhubarb",  "category": "produce"},
        {"name": "Leeks",           "category": "produce"},
        {"name": "Clementines",     "category": "produce"},
        {"name": "Mussels",         "category": "protein"},
    ],
    3:  [  # March
        {"name": "Forced rhubarb",  "category": "produce"},
        {"name": "Purple sprouting broccoli", "category": "produce"},
        {"name": "Spring onions",   "category": "produce"},
        {"name": "Sorrel",          "category": "herb"},
        {"name": "Sea trout",       "category": "protein"},
    ],
    4:  [  # April
        {"name": "Asparagus",       "category": "produce"},
        {"name": "Jersey Royals",   "category": "produce"},
        {"name": "Watercress",      "category": "produce"},
        {"name": "Wild garlic",     "category": "herb"},
        {"name": "Lamb",            "category": "protein"},
    ],
    5:  [  # May
        {"name": "Asparagus",       "category": "produce"},
        {"name": "Radishes",        "category": "produce"},
        {"name": "Gooseberries",    "category": "produce"},
        {"name": "Elderflower",     "category": "herb"},
        {"name": "Mackerel",        "category": "protein"},
    ],
    6:  [  # June
        {"name": "Strawberries",    "category": "produce"},
        {"name": "Cherries",        "category": "produce"},
        {"name": "Broad beans",     "category": "produce"},
        {"name": "Courgettes",      "category": "produce"},
        {"name": "Crab",            "category": "protein"},
    ],
    7:  [  # July
        {"name": "Tomatoes",        "category": "produce"},
        {"name": "Raspberries",     "category": "produce"},
        {"name": "Peas",            "category": "produce"},
        {"name": "Basil",           "category": "herb"},
        {"name": "Salmon",          "category": "protein"},
    ],
    8:  [  # August
        {"name": "Sweetcorn",       "category": "produce"},
        {"name": "Blackberries",    "category": "produce"},
        {"name": "Courgettes",      "category": "produce"},
        {"name": "Plums",           "category": "produce"},
        {"name": "Crab",            "category": "protein"},
    ],
    9:  [  # September
        {"name": "Apples",          "category": "produce"},
        {"name": "Pears",           "category": "produce"},
        {"name": "Squash",          "category": "produce"},
        {"name": "Mushrooms",       "category": "produce"},
        {"name": "Grouse",          "category": "protein"},
    ],
    10: [  # October
        {"name": "Pumpkin",         "category": "produce"},
        {"name": "Chestnuts",       "category": "produce"},
        {"name": "Quince",          "category": "produce"},
        {"name": "Kale",            "category": "produce"},
        {"name": "Pheasant",        "category": "protein"},
    ],
    11: [  # November
        {"name": "Parsnips",        "category": "produce"},
        {"name": "Brussels sprouts","category": "produce"},
        {"name": "Cranberries",     "category": "produce"},
        {"name": "Celeriac",        "category": "produce"},
        {"name": "Venison",         "category": "protein"},
    ],
    12: [  # December
        {"name": "Brussels sprouts","category": "produce"},
        {"name": "Red cabbage",     "category": "produce"},
        {"name": "Clementines",     "category": "produce"},
        {"name": "Chestnuts",       "category": "produce"},
        {"name": "Turkey",          "category": "protein"},
    ],
}


def get_seasonal(month: int | None = None) -> SeasonalResult:
    """
    Return in-season UK foods for the given month (1–12).
    Defaults to the current calendar month.
    DATA SOURCE: hardcoded
    """
    if month is None:
        month = date.today().month
    month = max(1, min(12, month))
    month_name = date(2000, month, 1).strftime("%B")
    items = [SeasonalItem(**i) for i in _SEASONAL.get(month, [])]
    return SeasonalResult(month=month_name, items=items)


if __name__ == "__main__":
    result = get_seasonal()
    print(f"In season — {result.month}:")
    for item in result.items:
        print(f"  • {item.name} ({item.category})")
