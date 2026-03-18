"""
Full pipeline orchestrator — 11-step flow.

Run order:
  1. Equipment availability   (hardcoded)
  2. Supply chain             (mock data)
  3. High-level trends        (hardcoded)
  4. Tasterover historic data (no data)
  5. In-season foods          (hardcoded)
  6. Celebrations             (hardcoded)
  7. Regional demand          (hardcoded)
  8. Weather                  (live API)
  9. Decision + options       (rules-based)
 10. Nutrition                (OpenAI)
 11. Menu proposal            (hardcoded logic)

Steps 1–7 are independent and could run concurrently.
Steps 8–11 are sequential (each depends on the previous).

Used by POST /api/flow for single-call server-side execution.
The frontend uses individual endpoints for progressive display.
"""
from dataclasses import asdict

from app.core import get_weather_for_day
from app.equipment import get_van_equipment
from app.supply import get_supply_chain
from app.trends import get_trends
from app.historic import get_historic
from app.seasonal import get_seasonal
from app.celebrations import get_celebrations
from app.regional import get_regional_demand
from app.decision import get_decision_and_options
from app.nutrition import calculate_nutrition
from app.menu_generator import generate_menu


def run_flow(postcode: str, date: str, van_id: str = "van_alpha", region: str = "London") -> dict:
    """
    Run the full 11-step pipeline.
    Returns a serialisable dict or {"error": "..."} on failure.
    """
    # ── Steps 1–7: independent modules ───────────────────────────────────────
    equipment_result = get_van_equipment(van_id)
    supply_result    = get_supply_chain()
    trends_result    = get_trends()
    historic_result  = get_historic()
    seasonal_result  = get_seasonal()
    celebrations_result = get_celebrations()
    regional_result  = get_regional_demand(region)

    # ── Step 8: Weather ───────────────────────────────────────────────────────
    weather = get_weather_for_day(postcode, date)
    if weather is None:
        return {"error": f"Could not fetch weather for postcode '{postcode}' on {date}."}

    # ── Step 9: Decision + options ────────────────────────────────────────────
    decision_result = get_decision_and_options(weather)

    # ── Step 10: Nutrition ────────────────────────────────────────────────────
    nutrition = calculate_nutrition([f"1 standard serving of {decision_result.primary_meal}"])

    # ── Step 11: Menu proposal ────────────────────────────────────────────────
    active_trend_labels = [t.label for t in trends_result.trends if t.direction == "up"]
    seasonal_names      = [i.name for i in seasonal_result.items]
    next_celebration    = celebrations_result.upcoming[0].name if celebrations_result.upcoming else None

    menu = generate_menu(
        weather=weather,
        primary_meal=decision_result.primary_meal,
        region=region,
        active_trends=active_trend_labels,
        seasonal_items=seasonal_names,
        upcoming_celebration=next_celebration,
    )

    # ── Serialise and return ──────────────────────────────────────────────────
    return {
        "postcode": postcode,
        "date": date,
        "van_id": van_id,
        "region": region,

        "equipment": {
            "van": asdict(equipment_result.van),
            "equipment": [asdict(e) for e in equipment_result.equipment],
            "available_count": equipment_result.available_count,
            "total_count": equipment_result.total_count,
        },
        "supply": {
            "suppliers": [asdict(s) for s in supply_result.suppliers],
            "inventory": [asdict(i) for i in supply_result.inventory],
        },
        "trends": {"trends": [asdict(t) for t in trends_result.trends]},
        "historic": {
            "daily_stats":       [asdict(d) for d in historic_result.daily_stats],
            "top_meals":         [asdict(m) for m in historic_result.top_meals],
            "total_revenue_gbp": historic_result.total_revenue_gbp,
            "avg_daily_covers":  historic_result.avg_daily_covers,
            "best_day":          historic_result.best_day,
            "source":            historic_result.source,
        },
        "seasonal": {
            "month": seasonal_result.month,
            "items": [asdict(i) for i in seasonal_result.items],
        },
        "celebrations": {"upcoming": [asdict(e) for e in celebrations_result.upcoming]},
        "regional": {
            "region": regional_result.region,
            "insights": [asdict(i) for i in regional_result.insights],
        },
        "weather": {
            "avg_temp": weather.avg_temp,
            "condition": weather.condition,
            "is_rainy": weather.is_rainy,
        },
        "decision": {
            "primary_meal": decision_result.primary_meal,
            "primary_reason": decision_result.primary_reason,
            "menu_options": [asdict(o) for o in decision_result.menu_options],
        },
        "nutrition": nutrition,
        "menu": asdict(menu),
    }


if __name__ == "__main__":
    import json
    from datetime import date as date_cls

    postcode   = input("UK postcode [SW1A 1AA]: ").strip() or "SW1A 1AA"
    target_date = input(f"Date (YYYY-MM-DD) [today]: ").strip() or date_cls.today().isoformat()
    van_id     = input("Van ID [van_alpha]: ").strip() or "van_alpha"
    region     = input("Region [London]: ").strip() or "London"

    result = run_flow(postcode, target_date, van_id, region)
    print(json.dumps(result, indent=2))
