"""
Celebrations module — upcoming UK calendar events with food opportunities.

Events are computed relative to today's date against a hardcoded
annual event list. Returns the next 5 events within 90 days.

DATA SOURCE: hardcoded
"""
from datetime import date, timedelta
from app.models import CelebrationEvent, CelebrationsResult

# Annual events: (month, day, name, food_opportunity)
# Floating holidays use approximate fixed dates for POC
_ANNUAL_EVENTS: list[tuple[int, int, str, str]] = [
    (1,  1,  "New Year's Day",          "Party food, champagne mocktails, canapés"),
    (1,  25, "Burns Night",             "Haggis, neeps & tatties, cranachan"),
    (2,  14, "Valentine's Day",         "Sharing boards, desserts, chocolates"),
    (3,  17, "St Patrick's Day",        "Irish stew, soda bread, Guinness cake"),
    (4,  1,  "Easter Sunday",           "Hot cross buns, simnel cake, roast lamb"),
    (4,  23, "St George's Day",         "Fish & chips, pies, English classics"),
    (5,  5,  "Early May Bank Holiday",  "BBQ, burgers, summer drinks"),
    (5,  26, "Spring Bank Holiday",     "Outdoor dining, wraps, cold drinks"),
    (6,  21, "Summer Solstice",         "Salads, cold desserts, refreshing drinks"),
    (8,  25, "August Bank Holiday",     "BBQ, ice cream, street food"),
    (10, 31, "Halloween",               "Pumpkin soup, spooky snacks, hot chocolate"),
    (11, 5,  "Bonfire Night",           "Hot dogs, toffee apples, mulled cider"),
    (11, 11, "Remembrance Sunday",      "Comfort food, warming soups"),
    (12, 25, "Christmas Day",           "Roast turkey, mince pies, mulled wine"),
    (12, 26, "Boxing Day",              "Leftovers specials, cold cuts, bubble & squeak"),
    (12, 31, "New Year's Eve",          "Party platters, fizz, finger food"),
]

# UK school holiday approximate windows (month_start, day_start, month_end, day_end, name)
_SCHOOL_HOLIDAYS: list[tuple[int, int, int, int, str]] = [
    (4,  1,  4,  14, "Easter School Holidays"),
    (7,  22, 9,  2,  "Summer School Holidays"),
    (10, 28, 11, 1,  "October Half Term"),
    (12, 20, 1,  6,  "Christmas School Holidays"),
]


def _next_occurrence(month: int, day: int, today: date) -> date:
    """Return the next occurrence of (month, day) on or after today."""
    candidate = date(today.year, month, day)
    if candidate < today:
        candidate = date(today.year + 1, month, day)
    return candidate


def get_celebrations(window_days: int = 90) -> CelebrationsResult:
    """
    Return upcoming UK celebrations within the next `window_days` days.
    DATA SOURCE: hardcoded
    """
    today = date.today()
    cutoff = today + timedelta(days=window_days)
    events: list[CelebrationEvent] = []

    for month, day, name, food_opp in _ANNUAL_EVENTS:
        try:
            event_date = _next_occurrence(month, day, today)
        except ValueError:
            continue
        if event_date <= cutoff:
            days_away = (event_date - today).days
            events.append(CelebrationEvent(
                name=name,
                date=event_date.isoformat(),
                days_away=days_away,
                food_opportunity=food_opp,
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
                    food_opportunity="Family meals, kids' favourites, sharing platters",
                ))

    events.sort(key=lambda e: e.days_away)
    return CelebrationsResult(upcoming=events[:6])


if __name__ == "__main__":
    result = get_celebrations()
    for ev in result.upcoming:
        print(f"  [{ev.days_away:3d}d] {ev.name} ({ev.date})")
        print(f"         {ev.food_opportunity}")
