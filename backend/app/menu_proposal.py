"""
Menu proposal — scored algorithm that recommends items from the stored base menu.

Each menu item is scored using live demand signals weighted by the
framework config.  Items with the highest scores per category are flagged
as featured/recommended.  The full menu is always returned; only the
recommended subset is highlighted.

DATA SOURCE: SQLite (menu_items + enrichment) + live pipeline inputs
"""
import json
from dataclasses import asdict

from app.database import SessionLocal, MenuItemDB, MenuItemEnrichmentDB, FrameworkConfigDB
from app.models import WeatherResult


# ─── Scored item ──────────────────────────────────────────────────────────────

def _get_config():
    with SessionLocal() as session:
        cfg = session.query(FrameworkConfigDB).filter_by(id=1).first()
        if not cfg:
            return None
        return {
            "weather_weight":         cfg.weather_weight,
            "trends_weight":          cfg.trends_weight,
            "seasonal_weight":        cfg.seasonal_weight,
            "events_weight":          cfg.events_weight,
            "regional_weight":        cfg.regional_weight,
            "target_pct_veggie":      cfg.target_pct_veggie,
            "target_pct_vegan":       cfg.target_pct_vegan,
            "target_pct_gluten_free": cfg.target_pct_gluten_free,
            "avg_price_target_gbp":   cfg.avg_price_target_gbp,
            "exclude_allergens":      json.loads(cfg.exclude_allergens or "[]"),
        }


def _get_enrichment(item_id: int) -> dict | None:
    with SessionLocal() as session:
        row = session.query(MenuItemEnrichmentDB).filter_by(item_id=item_id).first()
        if not row:
            return None
        return {
            "ingredients": json.loads(row.ingredients),
            "nutrition":   json.loads(row.nutrition),
            "tags":        json.loads(row.tags),
        }


def score_item(
    tags: list[str],
    price_gbp: float,
    weather: WeatherResult | None,
    active_trends: list[str],
    seasonal_items: list[str],
    upcoming_celebration: str,
    region: str,
    config: dict,
) -> float:
    """Return a relevance score for a menu item given current demand signals."""
    score = 0.0

    # Weather fit
    if weather:
        is_warm = weather.avg_temp > 15 and not weather.is_rainy
        if is_warm and "hot_weather" in tags:
            score += 2.0 * config["weather_weight"]
        elif not is_warm and "cold_weather" in tags:
            score += 2.0 * config["weather_weight"]
        elif "any_weather" in tags:
            score += 1.0 * config["weather_weight"]

    # Trending
    if "trending_up" in tags and active_trends:
        score += 1.5 * config["trends_weight"]

    # Seasonal
    if seasonal_items:
        seasonal_signals = ["seasonal_spring", "seasonal_summer", "seasonal_autumn", "seasonal_winter"]
        if any(t in tags for t in seasonal_signals):
            score += 1.5 * config["seasonal_weight"]

    # Celebration
    if upcoming_celebration and "celebration_fit" in tags:
        score += 1.5 * config["events_weight"]

    # Regional
    if region and "regional_special" in tags:
        score += 1.5 * config["regional_weight"]

    # Price proximity to target
    target = config["avg_price_target_gbp"]
    price_diff = abs(price_gbp - target)
    score += max(0.0, 1.0 - price_diff / 5.0)   # within £5 of target gets a small boost

    return round(score, 3)


def generate_proposal(
    weather: WeatherResult | None = None,
    active_trends: list[str] | None = None,
    seasonal_items: list[str] | None = None,
    upcoming_celebration: str = "",
    region: str = "London",
) -> dict:
    """
    Score every active menu item and return the full menu with per-item scores
    and a recommended featured subset per category.

    Returns:
      {
        "categories": {
          "grill": [{"id", "name", "price_gbp", "score", "tags", "nutrition", "featured"}, …],
          ...
        },
        "featured_items": [{"id", "name", "category", "price_gbp", "score", "reason"}, …],
        "influences": [str, …],
        "config_snapshot": {...},
      }
    """
    active_trends     = active_trends or []
    seasonal_items    = seasonal_items or []
    config            = _get_config() or {}

    if not config:
        from app.taxonomy import CONFIG_DEFAULTS
        config = dict(CONFIG_DEFAULTS)

    exclude = set(config.get("exclude_allergens", []))

    # Load all active items
    with SessionLocal() as session:
        items = session.query(MenuItemDB).filter_by(active=True).all()
        item_list = [
            {"id": i.id, "name": i.name, "category": i.category,
             "price_gbp": i.price_gbp, "user_added": i.user_added}
            for i in items
        ]

    # Build scored categories
    categories: dict[str, list] = {}
    featured: list[dict] = []

    for item in item_list:
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

        cat = item["category"]
        if cat not in categories:
            categories[cat] = []

        categories[cat].append({
            "id":        item["id"],
            "name":      item["name"],
            "price_gbp": item["price_gbp"],
            "score":     item_score,
            "tags":      tags,
            "nutrition": nutrition,
            "featured":  False,
        })

    # Mark top-scored item per category as featured (if score > 1)
    reasons_map = _build_reason_map(weather, active_trends, seasonal_items, upcoming_celebration, region)
    for cat, cat_items in categories.items():
        cat_items.sort(key=lambda x: x["score"], reverse=True)
        for entry in cat_items[:2]:   # top 2 per category
            if entry["score"] > 1.0:
                entry["featured"] = True
                reason = _build_reason(entry["tags"], reasons_map)
                featured.append({
                    "id":        entry["id"],
                    "name":      entry["name"],
                    "category":  cat,
                    "price_gbp": entry["price_gbp"],
                    "score":     entry["score"],
                    "reason":    reason,
                })

    featured.sort(key=lambda x: x["score"], reverse=True)

    influences = []
    if weather:
        influences.append(f"weather: {weather.condition}, {weather.avg_temp:.0f}°C")
    if active_trends:
        influences.append("current trends")
    if seasonal_items:
        influences.append("seasonal produce")
    if upcoming_celebration:
        influences.append(f"upcoming: {upcoming_celebration}")
    if region:
        influences.append(f"region: {region}")

    return {
        "categories":      categories,
        "featured_items":  featured[:10],
        "influences":      influences,
        "config_snapshot": config,
    }


def _build_reason_map(weather, trends, seasonal, celebration, region) -> dict:
    m = {}
    if weather:
        m["hot_weather"]      = f"warm forecast ({weather.avg_temp:.0f}°C)"
        m["cold_weather"]     = f"cold/wet forecast ({weather.avg_temp:.0f}°C)"
    if trends:
        m["trending_up"]      = "trending up"
    if seasonal:
        m["seasonal_spring"]  = "in season (spring)"
        m["seasonal_summer"]  = "in season (summer)"
        m["seasonal_autumn"]  = "in season (autumn)"
        m["seasonal_winter"]  = "in season (winter)"
    if celebration:
        m["celebration_fit"]  = f"fits {celebration}"
    if region:
        m["regional_special"] = f"regional favourite ({region})"
    return m


def _build_reason(tags: list[str], reason_map: dict) -> str:
    parts = [reason_map[t] for t in tags if t in reason_map]
    return ", ".join(parts[:3]) if parts else "strong all-round performer"
