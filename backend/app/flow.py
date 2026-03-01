"""
Full pipeline orchestrator.

Run each module in sequence and return a combined result dict.
This is used by POST /api/flow for single-call pipeline execution
(e.g. CLI or scripting use).

The frontend drives the same modules individually via separate API calls
to achieve progressive display.
"""
from app.core import get_weather_for_day
from app.decision import make_decision
from app.nutrition import calculate_nutrition
from app.supply import get_ingredient_supply
from app.equipment import get_equipment


def run_flow(postcode: str, date: str) -> dict:
    """
    Run the full pipeline for the given postcode and date.
    Returns a serialisable dict or {"error": "..."} on failure.
    """
    # 1. Weather
    weather = get_weather_for_day(postcode, date)
    if weather is None:
        return {"error": f"Could not fetch weather for postcode '{postcode}' on {date}."}

    # 2. Decision
    decision = make_decision(weather)

    # 3. Nutrition — call with a single descriptive ingredient string
    nutrition = calculate_nutrition([f"1 standard serving of {decision.meal}"])

    # 4. Ingredient supply
    supply = get_ingredient_supply(decision.meal)

    # 5. Equipment
    equipment = get_equipment(decision.meal)

    return {
        "postcode": postcode,
        "date": date,
        "weather": {
            "avg_temp": weather.avg_temp,
            "condition": weather.condition,
            "is_rainy": weather.is_rainy,
        },
        "decision": {
            "meal": decision.meal,
            "reason": decision.reason,
        },
        "nutrition": nutrition,
        "supply": {
            "ingredients": [
                {"name": i.name, "quantity": i.quantity, "available": i.available}
                for i in supply.ingredients
            ],
            "all_available": supply.all_available,
        },
        "equipment": {
            "equipment": [
                {"name": e.name, "available": e.available}
                for e in equipment.equipment
            ],
            "all_ready": equipment.all_ready,
        },
    }


if __name__ == "__main__":
    import json
    from datetime import date

    postcode = input("UK postcode: ").strip() or "SW1A 1AA"
    target_date = input(f"Date (YYYY-MM-DD) [today={date.today()}]: ").strip() or date.today().isoformat()

    result = run_flow(postcode, target_date)
    print(json.dumps(result, indent=2))
