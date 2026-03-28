"""
Decision module — primary meal recommendation + weather-informed menu options.

Reads enriched menu items from the database and scores them using the
framework config weights and live pipeline signals (weather, trends,
seasonal, celebrations, region).  No hardcoded menus.

DATA SOURCE: SQLite (menu_items + enrichment) + framework config + pipeline signals
"""
from app.database import SessionLocal, MenuItemDB
from app.menu_proposal import score_item, _get_config, _get_enrichment
from app.models import WeatherResult, DecisionResult, DecisionAndOptionsResult, MenuOption


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _load_scored_items(
    weather: WeatherResult | None,
    active_trends: list[str],
    seasonal_items: list[str],
    upcoming_celebration: str,
    region: str,
) -> list[dict]:
    """Load all active items, enrich, score, and return sorted descending."""
    config = _get_config()
    if not config:
        from app.taxonomy import CONFIG_DEFAULTS
        config = dict(CONFIG_DEFAULTS)

    exclude = set(config.get("exclude_allergens", []))

    with SessionLocal() as session:
        rows = session.query(MenuItemDB).filter_by(active=True).all()
        items = [
            {"id": r.id, "name": r.name, "category": r.category, "price_gbp": r.price_gbp}
            for r in rows
        ]

    scored: list[dict] = []
    for item in items:
        enrichment = _get_enrichment(item["id"])
        tags = enrichment["tags"] if enrichment else []
        nutrition = enrichment["nutrition"] if enrichment else {}

        # Skip excluded allergens
        if exclude and any(a in tags for a in exclude):
            continue

        item_score = score_item(
            tags=tags,
            price_gbp=item["price_gbp"],
            weather=weather,
            active_trends=active_trends,
            seasonal_items=seasonal_items,
            upcoming_celebration=upcoming_celebration,
            region=region,
            config=config,
        )

        scored.append({
            **item,
            "score": item_score,
            "tags": tags,
            "nutrition": nutrition,
        })

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored


def _weather_label(weather: WeatherResult) -> str:
    """Human-readable weather summary for the reason string."""
    parts = []
    parts.append(f"{weather.avg_temp:.1f}°C")
    parts.append(weather.condition)
    return " and ".join(parts)


def _build_reason(item: dict, weather: WeatherResult | None, active_trends: list[str],
                  seasonal_items: list[str], upcoming_celebration: str, region: str) -> str:
    """Build a human-readable explanation for why this item was chosen."""
    tags = item.get("tags", [])
    reasons: list[str] = []

    if weather:
        is_warm = weather.avg_temp > 15 and not weather.is_rainy
        if is_warm and "hot_weather" in tags:
            reasons.append(f"great for warm weather ({weather.avg_temp:.0f}°C, {weather.condition})")
        elif not is_warm and "cold_weather" in tags:
            reasons.append(f"perfect for cold/wet weather ({weather.avg_temp:.0f}°C, {weather.condition})")
        elif "any_weather" in tags:
            reasons.append("works in any weather")

    if "trending_up" in tags and active_trends:
        reasons.append("trending up right now")
    if any(t in tags for t in ["seasonal_spring", "seasonal_summer", "seasonal_autumn", "seasonal_winter"]):
        if seasonal_items:
            reasons.append("uses seasonal ingredients")
    if "celebration_fit" in tags and upcoming_celebration:
        reasons.append(f"fits {upcoming_celebration}")
    if "regional_special" in tags and region:
        reasons.append(f"regional favourite ({region})")
    if "comfort_food" in tags:
        reasons.append("comfort food")
    if "hero_item" in tags:
        reasons.append("hero item")

    if not reasons:
        reasons.append("strong all-round performer")

    return ", ".join(reasons[:3]).capitalize()


# ─── Public functions ─────────────────────────────────────────────────────────

def make_decision(
    weather: WeatherResult,
    active_trends: list[str] | None = None,
    seasonal_items: list[str] | None = None,
    upcoming_celebration: str = "",
    region: str = "",
) -> DecisionResult:
    """
    Pick the single best menu item as the primary recommendation,
    scored using enrichment tags and framework config weights.
    """
    active_trends = active_trends or []
    seasonal_items = seasonal_items or []

    scored = _load_scored_items(weather, active_trends, seasonal_items, upcoming_celebration, region)

    if not scored:
        return DecisionResult(
            meal="(no enriched items — run enrichment first)",
            reason="No scored items available. Enrich your menu to enable smart recommendations.",
        )

    best = scored[0]
    reason = _build_reason(best, weather, active_trends, seasonal_items, upcoming_celebration, region)

    return DecisionResult(meal=best["name"], reason=reason)


def generate_menu_options(
    weather: WeatherResult,
    active_trends: list[str] | None = None,
    seasonal_items: list[str] | None = None,
    upcoming_celebration: str = "",
    region: str = "",
) -> list[MenuOption]:
    """
    Return the top-scoring menu items as weather-informed options.
    Picks up to 10 items, preferring variety across categories.
    """
    active_trends = active_trends or []
    seasonal_items = seasonal_items or []

    scored = _load_scored_items(weather, active_trends, seasonal_items, upcoming_celebration, region)

    # Pick top items with category diversity (max 2 per category, up to 10 total)
    options: list[MenuOption] = []
    cat_counts: dict[str, int] = {}

    for item in scored:
        cat = item["category"]
        if cat_counts.get(cat, 0) >= 2:
            continue

        # Determine weather_fit from tags
        tags = item.get("tags", [])
        if "hot_weather" in tags:
            weather_fit = "warm"
        elif "cold_weather" in tags:
            weather_fit = "cold"
        else:
            weather_fit = "any"

        options.append(MenuOption(
            name=item["name"],
            category=cat,
            weather_fit=weather_fit,
            emoji="",  # frontend handles emoji mapping
            score=item["score"],
            tags=tags,
        ))
        cat_counts[cat] = cat_counts.get(cat, 0) + 1

        if len(options) >= 10:
            break

    return options


def get_decision_and_options(
    weather: WeatherResult,
    active_trends: list[str] | None = None,
    seasonal_items: list[str] | None = None,
    upcoming_celebration: str = "",
    region: str = "",
) -> DecisionAndOptionsResult:
    """Combined: primary recommendation + full options list, all data-driven."""
    decision = make_decision(weather, active_trends, seasonal_items, upcoming_celebration, region)
    options = generate_menu_options(weather, active_trends, seasonal_items, upcoming_celebration, region)
    return DecisionAndOptionsResult(
        primary_meal=decision.meal,
        primary_reason=decision.reason,
        menu_options=options,
    )


if __name__ == "__main__":
    from app.database import init_db
    init_db()

    sunny_warm = WeatherResult(date="2025-06-01", avg_temp=20.0, condition="mainly sun", is_rainy=False)
    rainy_cold = WeatherResult(date="2025-06-01", avg_temp=10.0, condition="mainly rain", is_rainy=True)

    for w in (sunny_warm, rainy_cold):
        r = get_decision_and_options(w)
        print(f"\nPrimary: {r.primary_meal}")
        print(f"Reason:  {r.primary_reason}")
        print("Options:")
        for opt in r.menu_options:
            print(f"  {opt.name} [{opt.category}] score={opt.score:.2f} weather={opt.weather_fit}")
