"""
Celebrations module — upcoming UK calendar events with food opportunities.

Tries OpenAI (gpt-4o-mini) first to get live, context-aware event data.
Falls back to the hardcoded annual event list if OpenAI is unavailable.
AI results are cached for 30 minutes.

DATA SOURCE: OpenAI gpt-4o-mini | hardcoded fallback
"""
import os
import json
from datetime import date, timedelta
from app.models import CelebrationEvent, CelebrationsResult, FoodSuggestion

# ---------------------------------------------------------------------------
# OpenAI availability check
# ---------------------------------------------------------------------------
_OPENAI_AVAILABLE = False
try:
    from openai import OpenAI as _OpenAI
    _OPENAI_AVAILABLE = True
except ImportError:
    pass

# 30-minute AI cache keyed by date string
_ai_cache: dict = {}

# Annual events: (month, day, name, food_opportunity, menu_suggestions)
# Each menu_suggestion: (name, category) — categories from taxonomy: main/snack/beverage/dessert/produce
_ANNUAL_EVENTS: list[tuple] = [
    (1,  1,  "New Year's Day",          "Party food and mocktails to start the year.",
     [("Party Canapes", "snack"), ("Champagne Mocktail", "beverage"), ("Mini Sliders", "main")]),
    (1,  25, "Burns Night",             "Scottish classics are a draw — haggis wraps and cranachan pots.",
     [("Haggis Wrap", "main"), ("Cranachan Pot", "dessert"), ("Scotch Broth", "snack")]),
    (2,  14, "Valentine's Day",         "Sharing boards, chocolate desserts, and indulgent bites.",
     [("Sharing Platter", "snack"), ("Chocolate Fondant", "dessert"), ("Strawberry Prosecco Slush", "beverage")]),
    (3,  17, "St Patrick's Day",        "Irish-inspired comfort food and stout-flavoured treats.",
     [("Irish Stew Pot", "main"), ("Soda Bread Roll", "snack"), ("Stout Hot Chocolate", "beverage")]),
    (4,  1,  "Easter Sunday",           "Hot cross buns, spring lamb, and seasonal produce specials.",
     [("Spring Lamb Wrap", "main"), ("Hot Cross Bun", "dessert"), ("Elderflower Lemonade", "beverage")]),
    (4,  23, "St George's Day",         "English classics — pies, fish and chips, and heritage produce.",
     [("Beef & Ale Pie", "main"), ("Fish & Chips", "main"), ("English Custard Tart", "dessert")]),
    (5,  5,  "Early May Bank Holiday",  "BBQ season opener — burgers and summer drinks.",
     [("Smash Burger", "main"), ("BBQ Loaded Fries", "snack"), ("Lemonade", "beverage")]),
    (5,  26, "Spring Bank Holiday",     "Outdoor dining with wraps, salads, and cold drinks.",
     [("Chicken Wrap", "main"), ("Side Salad", "snack"), ("Iced Coffee", "beverage")]),
    (6,  21, "Summer Solstice",         "Refreshing cold food and drinks for the longest day.",
     [("Halloumi Skewer", "main"), ("Fruit Skewer", "dessert"), ("Watermelon Juice", "beverage")]),
    (8,  25, "August Bank Holiday",     "Peak BBQ and ice cream weather — summer crowd pleasers.",
     [("Grilled Chicken", "main"), ("Ice Cream Sandwich", "dessert"), ("Mango Slush", "beverage")]),
    (10, 31, "Halloween",               "Spooky themed snacks and warming autumn drinks.",
     [("Pumpkin Soup", "snack"), ("Toffee Apple", "dessert"), ("Spiced Hot Chocolate", "beverage")]),
    (11, 5,  "Bonfire Night",           "Hot dogs, toffee apples, and warming cider drinks.",
     [("Hot Dog", "main"), ("Toffee Apple", "dessert"), ("Mulled Cider", "beverage")]),
    (11, 11, "Remembrance Sunday",      "Comforting soups and warming staples for the season.",
     [("Tomato Soup Roll", "main"), ("Sausage Roll", "snack"), ("Tea", "beverage")]),
    (12, 25, "Christmas Day",           "Festive roast flavours and mince pie treats.",
     [("Turkey & Stuffing Wrap", "main"), ("Mince Pie", "dessert"), ("Mulled Wine", "beverage")]),
    (12, 26, "Boxing Day",              "Leftover specials and comfort classics.",
     [("Bubble & Squeak", "snack"), ("Cold Cut Wrap", "main"), ("Spiced Apple Juice", "beverage")]),
    (12, 31, "New Year's Eve",          "Party platters and fizz for the countdown.",
     [("Party Platter", "snack"), ("Mini Burgers", "main"), ("Sparkling Elderflower", "beverage")]),
]

# UK school holiday approximate windows (month_start, day_start, month_end, day_end, name)
_SCHOOL_HOLIDAYS: list[tuple[int, int, int, int, str]] = [
    (4,  1,  4,  14, "Easter School Holidays"),
    (7,  22, 9,  2,  "Summer School Holidays"),
    (10, 28, 11, 1,  "October Half Term"),
    (12, 20, 1,  6,  "Christmas School Holidays"),
]


def _get_ai_celebrations(today: date, window_days: int = 90) -> list[CelebrationEvent] | None:
    """
    Use OpenAI to fetch upcoming UK events. Returns None on any failure.
    Results are cached for 30 minutes (keyed by today's date).
    """
    if not _OPENAI_AVAILABLE or not os.getenv("OPENAI_API_KEY"):
        return None

    cache_key = today.isoformat()
    if _ai_cache.get("key") == cache_key and _ai_cache.get("events"):
        return _ai_cache["events"]

    try:
        cutoff = today + timedelta(days=window_days)
        client = _OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        prompt = (
            f"Today is {today.isoformat()}. "
            f"List the next 6 upcoming UK public holidays, festivals, or food-relevant cultural events "
            f"between now and {cutoff.isoformat()}. "
            f"Return a JSON object with key \"events\" containing an array. "
            f"Each element must have: "
            f"\"name\" (string), "
            f"\"date\" (YYYY-MM-DD), "
            f"\"food_opportunity\" (1 concise sentence describing the food angle for a street food van), "
            f"\"menu_suggestions\" (array of 2-4 objects each with \"name\" (title case string) and "
            f"\"category\" (one of: main, snack, beverage, dessert, produce)). "
            f"Only include events with known fixed UK dates. Return JSON only."
        )
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=800,
            temperature=0.2,
        )
        raw = response.choices[0].message.content or "{}"
        parsed = json.loads(raw)
        events_list = parsed.get("events", [])
        if not isinstance(events_list, list):
            return None

        VALID_MENU_CATS = {"main", "snack", "beverage", "dessert", "produce"}
        result: list[CelebrationEvent] = []
        for ev in events_list:
            try:
                ev_date = date.fromisoformat(ev["date"])
                days_away = (ev_date - today).days
                if 0 <= days_away <= window_days:
                    raw_suggestions = ev.get("menu_suggestions", [])
                    suggestions = []
                    if isinstance(raw_suggestions, list):
                        for s in raw_suggestions:
                            cat = s.get("category", "main")
                            if cat not in VALID_MENU_CATS:
                                cat = "main"
                            suggestions.append(FoodSuggestion(name=s.get("name", ""), category=cat))
                    result.append(CelebrationEvent(
                        name=ev["name"],
                        date=ev_date.isoformat(),
                        days_away=days_away,
                        food_opportunity=ev.get("food_opportunity", ""),
                        menu_suggestions=suggestions,
                    ))
            except (KeyError, ValueError):
                continue

        if result:
            result.sort(key=lambda e: e.days_away)
            _ai_cache["key"] = cache_key
            _ai_cache["events"] = result[:6]
            return _ai_cache["events"]
    except Exception:
        pass

    return None


def _next_occurrence(month: int, day: int, today: date) -> date:
    """Return the next occurrence of (month, day) on or after today."""
    candidate = date(today.year, month, day)
    if candidate < today:
        candidate = date(today.year + 1, month, day)
    return candidate


def get_celebrations_for_month(month: int) -> CelebrationsResult:
    """
    Return all UK celebrations in the given calendar month (1–12).
    Uses the hardcoded annual events list (no AI — month-specific view).
    """
    month = max(1, min(12, month))
    today = date.today()
    events: list[CelebrationEvent] = []

    for ev_month, day, name, food_opp, suggestions_raw in _ANNUAL_EVENTS:
        if ev_month != month:
            continue
        try:
            # Use current year, fall back to next year if date is past
            ev_date = _next_occurrence(ev_month, day, date(today.year, ev_month, 1))
        except ValueError:
            continue
        days_away = (ev_date - today).days
        suggestions = [FoodSuggestion(name=n, category=c) for n, c in suggestions_raw]
        events.append(CelebrationEvent(
            name=name,
            date=ev_date.isoformat(),
            days_away=days_away,
            food_opportunity=food_opp,
            menu_suggestions=suggestions,
        ))

    events.sort(key=lambda e: e.days_away)
    return CelebrationsResult(upcoming=events, source="hardcoded")


def get_celebrations(window_days: int = 90) -> CelebrationsResult:
    """
    Return upcoming UK celebrations within the next `window_days` days.
    Tries OpenAI first, falls back to hardcoded annual events.
    DATA SOURCE: OpenAI gpt-4o-mini | hardcoded fallback
    """
    today = date.today()

    # Try live AI data first
    ai_events = _get_ai_celebrations(today, window_days)
    if ai_events:
        return CelebrationsResult(upcoming=ai_events, source="openai")
    cutoff = today + timedelta(days=window_days)
    events: list[CelebrationEvent] = []

    for month, day, name, food_opp, suggestions_raw in _ANNUAL_EVENTS:
        try:
            event_date = _next_occurrence(month, day, today)
        except ValueError:
            continue
        if event_date <= cutoff:
            days_away = (event_date - today).days
            suggestions = [FoodSuggestion(name=n, category=c) for n, c in suggestions_raw]
            events.append(CelebrationEvent(
                name=name,
                date=event_date.isoformat(),
                days_away=days_away,
                food_opportunity=food_opp,
                menu_suggestions=suggestions,
            ))

    # Add school holidays that overlap the window
    for ms, ds, me, de, name in _SCHOOL_HOLIDAYS:
        try:
            start = date(today.year, ms, ds)
            end = date(today.year if me >= ms else today.year + 1, me, de)
        except ValueError:
            continue
        if start <= cutoff and end >= today:
            days_away = max(0, (start - today).days)
            if days_away <= window_days:
                events.append(CelebrationEvent(
                    name=name,
                    date=start.isoformat(),
                    days_away=days_away,
                    food_opportunity="Family meals and kids' favourites drive higher footfall.",
                    menu_suggestions=[
                        FoodSuggestion(name="Kids Sharing Platter", category="snack"),
                        FoodSuggestion(name="Hot Dog", category="main"),
                        FoodSuggestion(name="Ice Cream", category="dessert"),
                    ],
                ))

    events.sort(key=lambda e: e.days_away)
    return CelebrationsResult(upcoming=events[:6], source="hardcoded")


if __name__ == "__main__":
    result = get_celebrations()
    for ev in result.upcoming:
        print(f"  [{ev.days_away:3d}d] {ev.name} ({ev.date})")
        print(f"         {ev.food_opportunity}")
