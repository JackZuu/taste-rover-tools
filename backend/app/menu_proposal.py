"""
Menu proposal — scored algorithm that recommends items from the stored base menu.

Each menu item is scored using live demand signals weighted by the
framework config.  Demand signals (trending, seasonal, celebration,
regional) are matched live against item names/ingredients — not baked
into enrichment tags.  Weather fit and positioning tags still come from
enrichment (they're inherent item properties).

DATA SOURCE: SQLite (menu_items + enrichment) + live pipeline inputs
"""
import json
from dataclasses import asdict

from app.database import SessionLocal, MenuItemDB, MenuItemEnrichmentDB, FrameworkConfigDB
from app.models import WeatherResult


# ─── Config & enrichment helpers ─────────────────────────────────────────────

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
            "ingredients":      json.loads(row.ingredients),
            "nutrition":        json.loads(row.nutrition),
            "tags":             json.loads(row.tags),
            "equipment_needed": json.loads(row.equipment_needed or "[]"),
        }


# ─── Ingredient sourcing helper ───────────────────────────────────────────────

def _check_sourcing(ingredients: list[str]) -> dict:
    """Check which ingredients can be sourced from BidFood."""
    from app.supply_bidfood import match_ingredient
    sourced = []
    unsourced = []
    for ing in ingredients:
        matches = match_ingredient(ing)
        if matches:
            best = matches[0]
            sourced.append({
                "ingredient": ing,
                "product": best["name"],
                "product_code": best["product_code"],
                "image_file": best["image_file"],
            })
        else:
            unsourced.append(ing)
    return {
        "sourced": sourced,
        "unsourced": unsourced,
        "pct": round(len(sourced) / max(len(ingredients), 1) * 100),
    }


# ─── Name matching helper ────────────────────────────────────────────────────

def _name_matches(item_name: str, names_list: list[str]) -> bool:
    """Case-insensitive check: item name appears in list or vice versa."""
    item_lower = item_name.lower()
    for n in names_list:
        n_lower = n.lower()
        if item_lower in n_lower or n_lower in item_lower:
            return True
    return False


def _ingredients_match(item_ingredients: list[str], names_list: list[str]) -> bool:
    """Check if any item ingredient appears in the names list."""
    names_lower = {n.lower() for n in names_list}
    for ing in item_ingredients:
        ing_lower = ing.lower()
        if any(ing_lower in n or n in ing_lower for n in names_lower):
            return True
    return False


# ─── Scored item ─────────────────────────────────────────────────────────────

def score_item(
    item_name: str,
    tags: list[str],
    price_gbp: float,
    weather: WeatherResult | None,
    active_trends: list[str],
    seasonal_items: list[str],
    item_ingredients: list[str],
    celebration_suggestions: list[str],
    regional_suggestions: list[str],
    config: dict,
) -> tuple[float, dict]:
    """
    Return (total_score, breakdown_dict) for a menu item.

    Demand signals are matched live by name/ingredients — not from
    enrichment tags.  Weather fit still uses enrichment tags (inherent).
    """
    breakdown = {
        "weather": 0.0,
        "trending": 0.0,
        "seasonal": 0.0,
        "celebration": 0.0,
        "regional": 0.0,
        "price": 0.0,
    }

    # Weather fit (from enrichment tags — inherent item property)
    if weather:
        is_warm = weather.avg_temp > 15 and not weather.is_rainy
        if is_warm and "hot_weather" in tags:
            breakdown["weather"] = round(2.0 * config["weather_weight"], 2)
        elif not is_warm and "cold_weather" in tags:
            breakdown["weather"] = round(2.0 * config["weather_weight"], 2)
        elif "any_weather" in tags:
            breakdown["weather"] = round(1.0 * config["weather_weight"], 2)

    # Trending (live match: item name in trending names list)
    if active_trends and _name_matches(item_name, active_trends):
        breakdown["trending"] = round(1.5 * config["trends_weight"], 2)

    # Seasonal (live match: item ingredients in seasonal items list)
    if seasonal_items and _ingredients_match(item_ingredients, seasonal_items):
        breakdown["seasonal"] = round(1.5 * config["seasonal_weight"], 2)

    # Celebration (live match: item name in celebration suggestion names)
    if celebration_suggestions and _name_matches(item_name, celebration_suggestions):
        breakdown["celebration"] = round(1.5 * config["events_weight"], 2)

    # Regional (live match: item name in regional suggestion names)
    if regional_suggestions and _name_matches(item_name, regional_suggestions):
        breakdown["regional"] = round(1.5 * config["regional_weight"], 2)

    # Price proximity to target
    target = config["avg_price_target_gbp"]
    price_diff = abs(price_gbp - target)
    breakdown["price"] = round(max(0.0, 1.0 - price_diff / 5.0), 2)

    total = sum(breakdown.values())
    breakdown["total"] = round(total, 3)

    return round(total, 3), breakdown


# ─── Proposal generation ────────────────────────────────────────────────────

def generate_proposal(
    weather: WeatherResult | None = None,
    active_trends: list[str] | None = None,
    seasonal_items: list[str] | None = None,
    upcoming_celebration: str = "",
    region: str = "London",
    celebration_suggestions: list[str] | None = None,
    regional_suggestions: list[str] | None = None,
    van_id: str = "van_alpha",
) -> dict:
    """
    Score every active menu item and return the full menu with per-item scores,
    score breakdowns, and a recommended featured subset per category.
    """
    active_trends            = active_trends or []
    seasonal_items           = seasonal_items or []
    celebration_suggestions  = celebration_suggestions or []
    regional_suggestions     = regional_suggestions or []
    config                   = _get_config() or {}

    # Load available equipment types for the selected van
    from app.equipment import get_available_equipment_types
    available_equip = get_available_equipment_types(van_id)

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
        ingredients = enrichment["ingredients"] if enrichment else []
        equipment_needed = enrichment["equipment_needed"] if enrichment else []

        # Skip excluded allergens
        if exclude and any(a in tags for a in exclude):
            continue

        item_score, breakdown = score_item(
            item_name=item["name"],
            tags=tags,
            price_gbp=item["price_gbp"],
            weather=weather,
            active_trends=active_trends,
            seasonal_items=seasonal_items,
            item_ingredients=ingredients,
            celebration_suggestions=celebration_suggestions,
            regional_suggestions=regional_suggestions,
            config=config,
        )

        cat = item["category"]
        if cat not in categories:
            categories[cat] = []

        # Check ingredient sourcing from BidFood
        sourcing = _check_sourcing(ingredients)

        # Check equipment availability
        equip_available = [e for e in equipment_needed if e in available_equip]
        equip_missing   = [e for e in equipment_needed if e not in available_equip]

        categories[cat].append({
            "id":              item["id"],
            "name":            item["name"],
            "price_gbp":      item["price_gbp"],
            "score":           item_score,
            "score_breakdown": breakdown,
            "tags":            tags,
            "nutrition":       nutrition,
            "ingredients":     ingredients,
            "sourcing":        sourcing,
            "equipment_needed":    equipment_needed,
            "equipment_available": equip_available,
            "equipment_missing":   equip_missing,
            "equipment_ready":     len(equip_missing) == 0,
            "featured":        False,
        })

    # Mark top-scored item per category as featured (if score > 1)
    for cat, cat_items in categories.items():
        cat_items.sort(key=lambda x: x["score"], reverse=True)
        for entry in cat_items[:2]:   # top 2 per category
            if entry["score"] > 1.0:
                entry["featured"] = True
                reason = _build_reason(entry, weather, active_trends, seasonal_items,
                                       upcoming_celebration, region, celebration_suggestions,
                                       regional_suggestions)
                featured.append({
                    "id":              entry["id"],
                    "name":            entry["name"],
                    "category":        cat,
                    "price_gbp":       entry["price_gbp"],
                    "score":           entry["score"],
                    "score_breakdown": entry["score_breakdown"],
                    "reason":          reason,
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


def _build_reason(entry: dict, weather, active_trends, seasonal_items,
                   celebration, region, celebration_suggestions, regional_suggestions) -> str:
    """Build a human-readable explanation from the score breakdown."""
    bd = entry.get("score_breakdown", {})
    parts: list[str] = []

    if bd.get("weather", 0) > 0 and weather:
        is_warm = weather.avg_temp > 15 and not weather.is_rainy
        parts.append(f"{'warm' if is_warm else 'cold/wet'} forecast ({weather.avg_temp:.0f}°C)")
    if bd.get("trending", 0) > 0:
        parts.append("trending up")
    if bd.get("seasonal", 0) > 0:
        parts.append("uses seasonal ingredients")
    if bd.get("celebration", 0) > 0 and celebration:
        parts.append(f"fits {celebration}")
    if bd.get("regional", 0) > 0 and region:
        parts.append(f"regional favourite ({region})")

    return ", ".join(parts[:3]) if parts else "strong all-round performer"
