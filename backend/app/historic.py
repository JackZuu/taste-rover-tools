"""
Historic data module — Tasterover internal sales / performance data.

Returns structured mock data representing 30 days of operations across
three vans and multiple UK regions. Computed dynamically so dates stay current.

DATA SOURCE: mock
"""
from datetime import date, timedelta
from app.models import HistoricDailyStat, HistoricTopMeal, HistoricResult

# ---------------------------------------------------------------------------
# 30-day top meals (representative totals across all vans / regions)
# ---------------------------------------------------------------------------
_TOP_MEALS_RAW: list[tuple[str, str, int, float]] = [
    # (meal_name, category, total_qty, total_revenue_gbp)
    ("Smash Burger",          "main",     890, 9790.10),
    ("Chicken Tikka Wrap",    "main",     612, 6731.88),
    ("Plant-Based Burger",    "main",     445, 4890.55),
    ("Loaded Fries",          "side",     743, 3707.57),
    ("Tomato Soup & Bread",   "soup",     412, 3291.88),
    ("Halloumi Skewers",      "main",     356, 3200.44),
    ("Mac & Cheese Bowl",     "bowl",     287, 2866.13),
    ("Hot Chocolate",         "beverage", 598, 2386.02),
    ("Churros",               "snack",    398, 1985.02),
    ("Matcha Latte",          "beverage", 334, 1666.66),
]

# ---------------------------------------------------------------------------
# Daily pattern: (covers, top_meal) for the last 14 days
# Index 0 = 14 days ago, index -1 = yesterday
# ---------------------------------------------------------------------------
_DAILY_PATTERN: list[tuple[int, str]] = [
    (145, "Smash Burger"),
    (162, "Chicken Tikka Wrap"),
    (138, "Smash Burger"),
    (155, "Loaded Fries"),
    (170, "Smash Burger"),
    (148, "Chicken Tikka Wrap"),
    (135, "Plant-Based Burger"),
    (178, "Smash Burger"),
    (165, "Chicken Tikka Wrap"),
    (142, "Smash Burger"),
    (159, "Halloumi Skewers"),
    (173, "Smash Burger"),
    (152, "Chicken Tikka Wrap"),
    (141, "Smash Burger"),
]

_AVG_REVENUE_PER_COVER = 8.92   # blended average across all items


def get_historic() -> HistoricResult:
    """
    Return structured Tasterover sales performance data.
    DATA SOURCE: mock
    """
    today = date.today()

    # Build daily stats for the last 14 completed days
    daily_stats: list[HistoricDailyStat] = []
    for i, (covers, top_meal) in enumerate(_DAILY_PATTERN):
        days_ago = len(_DAILY_PATTERN) - i
        day = today - timedelta(days=days_ago)
        revenue = round(covers * _AVG_REVENUE_PER_COVER, 2)
        daily_stats.append(HistoricDailyStat(
            date=day.isoformat(),
            total_covers=covers,
            total_revenue_gbp=revenue,
            top_meal=top_meal,
        ))

    # Build top meals with % of total
    total_rev = sum(rev for _, _, _, rev in _TOP_MEALS_RAW)
    top_meals: list[HistoricTopMeal] = [
        HistoricTopMeal(
            meal_name=name,
            category=cat,
            total_qty=qty,
            total_revenue_gbp=rev,
            pct_of_total=round(rev / total_rev * 100, 1),
        )
        for name, cat, qty, rev in sorted(_TOP_MEALS_RAW, key=lambda x: x[3], reverse=True)
    ]

    avg_daily_covers = int(sum(c for c, _ in _DAILY_PATTERN) / len(_DAILY_PATTERN))
    best_day_entry = max(daily_stats, key=lambda d: d.total_revenue_gbp)

    return HistoricResult(
        daily_stats=daily_stats,
        top_meals=top_meals,
        total_revenue_gbp=round(total_rev, 2),
        avg_daily_covers=avg_daily_covers,
        best_day=best_day_entry.date,
        source="mock",
        message="",
    )


if __name__ == "__main__":
    r = get_historic()
    print(f"Total revenue (30d): £{r.total_revenue_gbp:,.2f}")
    print(f"Avg daily covers:    {r.avg_daily_covers}")
    print(f"Best day:            {r.best_day}")
    print("\nTop meals:")
    for m in r.top_meals:
        print(f"  {m.meal_name:30s} £{m.total_revenue_gbp:,.2f}  ({m.pct_of_total}%)")
