from app.models import WeatherResult, DecisionResult


def make_decision(weather: WeatherResult) -> DecisionResult:
    """
    Decides which meal to recommend based on weather conditions:
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
        parts = []
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


if __name__ == "__main__":
    # Quick standalone test
    sunny_warm = WeatherResult(date="2025-06-01", avg_temp=20.0, condition="mainly sun", is_rainy=False)
    rainy_cold = WeatherResult(date="2025-06-01", avg_temp=10.0, condition="mainly rain", is_rainy=True)

    print(make_decision(sunny_warm))
    print(make_decision(rainy_cold))
