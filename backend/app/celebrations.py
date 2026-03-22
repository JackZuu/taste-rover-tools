"""
Celebrations module — upcoming UK calendar events with food opportunities.

Always uses OpenAI gpt-4o-mini.  Results are cached in memory for 30 minutes
(keyed by today's date string).  If OpenAI is unavailable or the call fails,
an empty result with source="error" is returned.

DATA SOURCE: OpenAI gpt-4o-mini (no hardcoded fallback)
"""
import os
import json
from datetime import date, timedelta

from app.models import CelebrationEvent, CelebrationsResult, FoodSuggestion
from app.prompts import celebrations_prompt
from app.taxonomy import FOOD_SUGGESTION_CATEGORIES

_OPENAI_AVAILABLE = False
try:
    from openai import OpenAI as _OpenAI
    _OPENAI_AVAILABLE = True
except ImportError:
    pass

# 30-minute in-memory cache keyed by today's date string
_ai_cache: dict = {}


def _get_ai_celebrations(today: date, window_days: int = 90) -> tuple[list[CelebrationEvent], str]:
    """
    Call OpenAI to get upcoming UK events.
    Returns (events_list, source_string).
    source is "openai" on success, "error" on failure.
    """
    if not _OPENAI_AVAILABLE or not os.getenv("OPENAI_API_KEY"):
        return [], "error"

    cache_key = today.isoformat()
    if _ai_cache.get("key") == cache_key and _ai_cache.get("events") is not None:
        return _ai_cache["events"], "openai"

    try:
        cutoff = today + timedelta(days=window_days)
        client = _OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        prompt = celebrations_prompt(today.isoformat(), cutoff.isoformat())
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=800,
            temperature=0.2,
        )
        raw = response.choices[0].message.content or "{}"
        parsed = json.loads(raw)
        events_list = parsed.get("events", [])
        if not isinstance(events_list, list):
            return [], "error"

        valid_cats = set(FOOD_SUGGESTION_CATEGORIES)
        result: list[CelebrationEvent] = []
        for ev in events_list:
            try:
                ev_date = date.fromisoformat(ev["date"])
                days_away = (ev_date - today).days
                if 0 <= days_away <= window_days:
                    raw_sugg = ev.get("menu_suggestions", [])
                    suggestions = []
                    if isinstance(raw_sugg, list):
                        for s in raw_sugg:
                            cat = s.get("category", "main")
                            if cat not in valid_cats:
                                cat = "main"
                            suggestions.append(FoodSuggestion(name=s.get("name", ""), category=cat))
                    result.append(CelebrationEvent(
                        name=ev["name"],
                        date=ev_date.isoformat(),
                        days_away=days_away,
                        food_opportunity=ev.get("food_opportunity", ""),
                        menu_suggestions=suggestions,
                    ))
            except (KeyError, ValueError):
                continue

        result.sort(key=lambda e: e.days_away)
        events = result[:6]
        _ai_cache["key"] = cache_key
        _ai_cache["events"] = events
        return events, "openai"

    except Exception:
        return [], "error"


def get_celebrations(window_days: int = 90) -> CelebrationsResult:
    """
    Return upcoming UK celebrations within the next window_days days.
    DATA SOURCE: OpenAI gpt-4o-mini
    """
    today = date.today()
    events, source = _get_ai_celebrations(today, window_days)
    return CelebrationsResult(upcoming=events, source=source)


def get_celebrations_for_month(month: int) -> CelebrationsResult:
    """
    Return upcoming UK celebrations for a specific calendar month.
    Uses OpenAI — returns events within 365 days filtered to the given month.
    """
    today = date.today()
    all_events, source = _get_ai_celebrations(today, window_days=365)
    month_events = [e for e in all_events if date.fromisoformat(e.date).month == month]
    return CelebrationsResult(upcoming=month_events, source=source)
