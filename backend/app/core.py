import requests
from collections import Counter
from datetime import datetime
from zoneinfo import ZoneInfo
import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Constants
API_KEY = os.getenv("OPENWEATHER_API_KEY", "6df4eae843042183d88511bdfdc7abc9")
LOCAL_TZ = ZoneInfo("Europe/London")
DAYS_AHEAD = 5


def get_coordinates_from_postcode(postcode):
    """
    Get latitude and longitude from UK postcode using postcodes.io (free API).
    Returns (lat, lon) tuple or (None, None) if error.
    """
    try:
        postcode_clean = postcode.replace(" ", "").upper()
        geocode_url = f"https://api.postcodes.io/postcodes/{postcode_clean}"
        geocode_response = requests.get(geocode_url, timeout=10)

        if geocode_response.status_code != 200:
            return None, None

        location_data = geocode_response.json()
        if "result" not in location_data or not location_data["result"]:
            return None, None

        lat = location_data["result"]["latitude"]
        lon = location_data["result"]["longitude"]
        return lat, lon

    except Exception as e:
        print(f"Error getting coordinates: {e}")
        return None, None


def classify_conditions(weather_obj: dict) -> str:
    """
    Map OpenWeather conditions to:
      - 'mainly rain'
      - 'mainly cloud'
      - 'mainly sun'
    Uses weather[0].main and clouds.all as fallback.
    """
    weather_main = (weather_obj.get("weather") or [{}])[0].get("main", "")
    clouds = (weather_obj.get("clouds") or {}).get("all", None)

    if weather_main in {"Rain", "Drizzle", "Thunderstorm"}:
        return "mainly rain"

    if weather_main in {
        "Clouds", "Fog", "Mist", "Haze", "Smoke", "Dust", "Sand", "Ash", "Squall", "Tornado"
    }:
        return "mainly cloud"

    if clouds is not None:
        return "mainly cloud" if clouds >= 60 else "mainly sun"

    return "mainly sun"


def get_current_weather_by_postcode(postcode, api_key):
    """
    Returns (temperature_c, label) for current weather.
    """
    try:
        lat, lon = get_coordinates_from_postcode(postcode)
        if lat is None or lon is None:
            return None, None

        url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
        r = requests.get(url, timeout=10)

        if r.status_code != 200:
            return None, None

        data = r.json()
        temp = data["main"]["temp"]
        label = classify_conditions(data)
        return temp, label

    except Exception as e:
        print(f"Current weather error: {e}")
        return None, None


def get_daily_forecast_by_postcode(postcode, api_key, days=5):
    """
    Uses OpenWeather 5-day/3-hour forecast and groups entries by local (London) date.
    Returns a list: [{"date": "YYYY-MM-DD", "avg_temp": float, "mainly": str}, ...]
    """
    try:
        lat, lon = get_coordinates_from_postcode(postcode)
        if lat is None or lon is None:
            return []

        url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={api_key}&units=metric"
        r = requests.get(url, timeout=10)

        if r.status_code != 200:
            return []

        data = r.json()
        items = data.get("list", [])
        if not items:
            return []

        # Group forecast slices by local calendar date
        by_date = {}
        for item in items:
            dt_local = datetime.fromtimestamp(item["dt"], tz=LOCAL_TZ)
            d = dt_local.date()
            bucket = by_date.setdefault(d, {"temps": [], "labels": []})
            bucket["temps"].append(item["main"]["temp"])
            bucket["labels"].append(classify_conditions(item))

        # Build summaries for today + next days (limit to 'days')
        today_local = datetime.now(LOCAL_TZ).date()
        dates_sorted = [d for d in sorted(by_date.keys()) if d >= today_local][:days]

        results = []
        for d in dates_sorted:
            temps = by_date[d]["temps"]
            labels = by_date[d]["labels"]
            avg_temp = sum(temps) / len(temps)
            mainly = Counter(labels).most_common(1)[0][0]
            results.append({"date": d.isoformat(), "avg_temp": avg_temp, "mainly": mainly})

        return results

    except Exception as e:
        print(f"Daily forecast error: {e}")
        return []


def run_task(postcode: str) -> dict:
    """
    Main task function that gets weather data for a given postcode.
    """
    temp_now, label_now = get_current_weather_by_postcode(postcode, API_KEY)
    
    if temp_now is None:
        return {
            "error": "Unable to fetch weather data. Please check the postcode.",
            "postcode": postcode
        }
    
    daily_forecast = get_daily_forecast_by_postcode(postcode, API_KEY, days=DAYS_AHEAD)
    
    return {
        "postcode": postcode,
        "current": {
            "temperature": round(temp_now, 1),
            "condition": label_now
        },
        "forecast": daily_forecast
    }
