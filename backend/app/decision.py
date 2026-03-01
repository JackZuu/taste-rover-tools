"""
Decision module — primary meal recommendation + weather-informed menu options.

DATA SOURCE: hardcoded rules + hardcoded option catalogue
"""
from app.models import WeatherResult, DecisionResult, MenuOption, DecisionAndOptionsResult

# ─── Hardcoded option catalogue keyed by weather profile ──────────────────────

_OPTIONS_WARM_DRY: list[dict] = [
    {"name": "Smash Burger",          "category": "burger",  "weather_fit": "warm", "emoji": "🍔"},
    {"name": "Grilled Chicken Wrap",  "category": "wrap",    "weather_fit": "warm", "emoji": "🌯"},
    {"name": "Halloumi Skewers",      "category": "skewer",  "weather_fit": "warm", "emoji": "🍢"},
    {"name": "BBQ Pulled Pork Bun",   "category": "burger",  "weather_fit": "warm", "emoji": "🥩"},
    {"name": "Strawberry Ice Cream",  "category": "dessert", "weather_fit": "warm", "emoji": "🍓"},
    {"name": "Mango Sorbet",          "category": "dessert", "weather_fit": "warm", "emoji": "🥭"},
    {"name": "Loaded Fries",          "category": "side",    "weather_fit": "any",  "emoji": "🍟"},
    {"name": "Fresh Green Salad",     "category": "salad",   "weather_fit": "warm", "emoji": "🥗"},
    {"name": "Watermelon Slush",      "category": "drink",   "weather_fit": "warm", "emoji": "🍉"},
    {"name": "Margherita Pizza Slice","category": "pizza",   "weather_fit": "any",  "emoji": "🍕"},
]

_OPTIONS_COLD_OR_RAINY: list[dict] = [
    {"name": "Tomato Soup & Bread",   "category": "soup",    "weather_fit": "cold", "emoji": "🍅"},
    {"name": "Chicken Tikka Wrap",    "category": "wrap",    "weather_fit": "any",  "emoji": "🌯"},
    {"name": "Mac & Cheese Bowl",     "category": "bowl",    "weather_fit": "cold", "emoji": "🧀"},
    {"name": "Chilli Con Carne",      "category": "bowl",    "weather_fit": "cold", "emoji": "🌶️"},
    {"name": "Hot Dog with Onions",   "category": "hot dog", "weather_fit": "cold", "emoji": "🌭"},
    {"name": "Pepperoni Pizza Slice", "category": "pizza",   "weather_fit": "any",  "emoji": "🍕"},
    {"name": "Loaded Fries",          "category": "side",    "weather_fit": "any",  "emoji": "🍟"},
    {"name": "Spiced Lentil Soup",    "category": "soup",    "weather_fit": "cold", "emoji": "🫘"},
    {"name": "Warm Brownie & Cream",  "category": "dessert", "weather_fit": "cold", "emoji": "🍫"},
    {"name": "Hot Chocolate",         "category": "drink",   "weather_fit": "cold", "emoji": "☕"},
]


# ─── Public functions ─────────────────────────────────────────────────────────

def make_decision(weather: WeatherResult) -> DecisionResult:
    """
    Primary recommendation rule:
      - temp > 15°C AND not rainy  →  strawberry ice cream
      - temp <= 15°C OR rainy      →  tomato soup
    """
    if weather.avg_temp > 15 and not weather.is_rainy:
        meal = "strawberry ice cream"
        reason = (
            f"{weather.avg_temp:.1f}°C and {weather.condition} — "
            "warm and dry, perfect for something cold and refreshing!"
        )
    else:
        parts: list[str] = []
        if weather.avg_temp <= 15:
            parts.append(f"{weather.avg_temp:.1f}°C")
        if weather.is_rainy:
            parts.append(weather.condition)
        meal = "tomato soup"
        reason = (
            f"{' and '.join(parts)} — "
            "chilly or wet weather calls for something warming!"
        )
    return DecisionResult(meal=meal, reason=reason)


def generate_menu_options(weather: WeatherResult) -> list[MenuOption]:
    """
    Return a weather-informed set of menu option concepts.
    Warm/dry → cold-weather-friendly options filtered out.
    Cold/wet → warm-weather-only options filtered out.
    DATA SOURCE: hardcoded
    """
    is_warm = weather.avg_temp > 15 and not weather.is_rainy
    catalogue = _OPTIONS_WARM_DRY if is_warm else _OPTIONS_COLD_OR_RAINY
    return [MenuOption(**o) for o in catalogue]


def get_decision_and_options(weather: WeatherResult) -> DecisionAndOptionsResult:
    """Combined: primary recommendation + full options list."""
    decision = make_decision(weather)
    options = generate_menu_options(weather)
    return DecisionAndOptionsResult(
        primary_meal=decision.meal,
        primary_reason=decision.reason,
        menu_options=options,
    )


if __name__ == "__main__":
    sunny_warm = WeatherResult(date="2025-06-01", avg_temp=20.0, condition="mainly sun", is_rainy=False)
    rainy_cold = WeatherResult(date="2025-06-01", avg_temp=10.0, condition="mainly rain", is_rainy=True)

    for w in (sunny_warm, rainy_cold):
        r = get_decision_and_options(w)
        print(f"\nPrimary: {r.primary_meal}")
        print(f"Reason:  {r.primary_reason}")
        print("Options:")
        for opt in r.menu_options:
            print(f"  {opt.emoji} {opt.name} [{opt.category}]")
