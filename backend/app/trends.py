"""
Trends module — food trend discovery and menu-item trend assessment.

Two systems:
  1. get_trends()        — discover what's trending in UK street food (OpenAI)
  2. get_custom_trends()  — assess trend direction for specific menu items (OpenAI)

Both use in-memory caching to minimise API calls.
"""

import json
import os
import time
from datetime import datetime, date

from app.models import (
    TrendItem, TrendsResult,
    TrendDiscoveryItem, TrendDiscoveryResult,
)
from app.taxonomy import MENU_CATEGORIES

# ---------------------------------------------------------------------------
# Cache
# ---------------------------------------------------------------------------
_discovery_cache: dict = {}
_DISCOVERY_CACHE_TTL_S = 3600  # 1 hour

_custom_cache: dict = {}
_CUSTOM_CACHE_TTL_S = 86400  # 24 hours

# ---------------------------------------------------------------------------
# Hardcoded fallback for trend discovery (when OpenAI unavailable)
# ---------------------------------------------------------------------------
_FALLBACK_DISCOVERY: list[dict] = [
    {"name": "Smash Burger",          "category": "grill",       "why_trending": "Viral on TikTok and food festivals across the UK", "estimated_price_gbp": 9.00},
    {"name": "Birria Tacos",          "category": "grill",       "why_trending": "Mexican street food craze, consommé-dipping trend", "estimated_price_gbp": 10.00},
    {"name": "Korean Corn Dog",       "category": "snacks",      "why_trending": "K-food wave, popular at pop-ups and markets", "estimated_price_gbp": 6.50},
    {"name": "Loaded Fries",          "category": "sides",       "why_trending": "Customisable comfort food, strong social media appeal", "estimated_price_gbp": 7.00},
    {"name": "Bao Buns",              "category": "snacks",      "why_trending": "Asian fusion staple, light and shareable", "estimated_price_gbp": 7.50},
    {"name": "Matcha Latte",          "category": "hot_drinks",  "why_trending": "Health-conscious coffee alternative, Instagram favourite", "estimated_price_gbp": 4.50},
    {"name": "Bubble Tea",            "category": "cold_drinks", "why_trending": "Gen Z favourite, customisable flavours", "estimated_price_gbp": 5.00},
    {"name": "Halloumi Fries",        "category": "sides",       "why_trending": "Vegetarian crowd-pleaser, strong at festivals", "estimated_price_gbp": 6.00},
    {"name": "Churros",               "category": "desserts",    "why_trending": "Portable dessert, pairs with dipping sauces", "estimated_price_gbp": 5.50},
    {"name": "Nashville Hot Chicken", "category": "grill",       "why_trending": "American fried chicken trend hitting UK street food", "estimated_price_gbp": 9.50},
    {"name": "Falafel Wrap",          "category": "snacks",      "why_trending": "Plant-based demand growing, affordable and filling", "estimated_price_gbp": 7.00},
    {"name": "Iced Coffee",           "category": "cold_drinks", "why_trending": "Year-round demand, especially among younger customers", "estimated_price_gbp": 4.00},
]


# ---------------------------------------------------------------------------
# 1. Trend discovery — what's trending right now
# ---------------------------------------------------------------------------

def _get_season(month: int) -> str:
    if month in (3, 4, 5):
        return "spring"
    elif month in (6, 7, 8):
        return "summer"
    elif month in (9, 10, 11):
        return "autumn"
    return "winter"


def _openai_discover() -> list[TrendDiscoveryItem] | None:
    """Call OpenAI to discover trending UK street food items."""
    try:
        from openai import OpenAI
        from app.prompts import trending_discovery_prompt
    except ImportError:
        return None

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None

    today = date.today()
    month_name = today.strftime("%B")
    season = _get_season(today.month)

    try:
        client = OpenAI(api_key=api_key)
        prompt = trending_discovery_prompt(month_name, season)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=1200,
            temperature=0.4,
        )
        raw = json.loads(response.choices[0].message.content or "{}")
        raw_items = raw.get("items", [])

        valid_cats = set(MENU_CATEGORIES)
        items: list[TrendDiscoveryItem] = []
        for r in raw_items:
            cat = r.get("category", "snacks")
            if cat not in valid_cats:
                cat = "snacks"
            items.append(TrendDiscoveryItem(
                name=r.get("name", ""),
                category=cat,
                why_trending=r.get("why_trending", ""),
                estimated_price_gbp=round(float(r.get("estimated_price_gbp", 7.0)), 2),
            ))
        return items if items else None
    except Exception:
        return None


def get_trends() -> TrendDiscoveryResult:
    """
    Discover what's trending in UK street food right now.
    Tries OpenAI (cached 1 hr), falls back to hardcoded list.
    DATA SOURCE: OpenAI gpt-4o-mini | hardcoded fallback
    """
    now = datetime.utcnow()
    cached_result = _discovery_cache.get("result")
    cached_at = _discovery_cache.get("at")

    if cached_result and cached_at and (now - cached_at).total_seconds() < _DISCOVERY_CACHE_TTL_S:
        return cached_result

    items = _openai_discover()
    if items:
        result = TrendDiscoveryResult(items=items, source="openai")
        _discovery_cache["result"] = result
        _discovery_cache["at"] = now
        return result

    # Fallback
    return TrendDiscoveryResult(
        items=[TrendDiscoveryItem(**t) for t in _FALLBACK_DISCOVERY],
        source="fallback",
    )


# ---------------------------------------------------------------------------
# 2. Custom trends — assess specific menu items (unchanged)
# ---------------------------------------------------------------------------

def _openai_trends(keywords: list[str]) -> list[TrendItem] | None:
    """Use OpenAI to assess trend direction for menu item keywords."""
    try:
        from openai import OpenAI
        from app.prompts import menu_trends_prompt
    except ImportError:
        return None

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None

    try:
        client = OpenAI(api_key=api_key)
        prompt = menu_trends_prompt(keywords)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=1200,
            temperature=0.3,
        )
        raw = json.loads(response.choices[0].message.content or "{}")
        trends_list = raw.get("trends", [])
        items: list[TrendItem] = []
        for t in trends_list:
            direction = t.get("direction", "stable")
            if direction not in ("up", "down", "stable"):
                direction = "stable"
            items.append(TrendItem(
                label=t.get("label", ""),
                direction=direction,
                category=t.get("category", "main"),
                momentum_pct=round(float(t.get("momentum_pct", 0.0)), 1),
                avg_interest=round(float(t.get("avg_interest", 0.0)), 1),
            ))
        return items if items else None
    except Exception:
        return None


def get_custom_trends(keywords: list[str], geo: str = "GB") -> TrendsResult:
    """
    Assess trend direction for a list of menu item keywords.
    Primary: OpenAI analysis (cached 24 hrs per keyword set).
    DATA SOURCE: OpenAI gpt-4o-mini | unavailable stubs
    """
    if not keywords:
        return TrendsResult(trends=[], source="unavailable")

    cache_key = "|".join(sorted(k.lower() for k in keywords))
    now = datetime.utcnow()
    cached = _custom_cache.get(cache_key)
    if cached and (now - cached["at"]).total_seconds() < _CUSTOM_CACHE_TTL_S:
        return cached["result"]

    items = _openai_trends(keywords)
    if items:
        result = TrendsResult(trends=items, source="openai")
        _custom_cache[cache_key] = {"result": result, "at": now}
        return result

    # Fallback stubs
    stubs = [
        TrendItem(label=kw, direction="stable", category="main",
                  momentum_pct=0.0, avg_interest=0.0)
        for kw in keywords
    ]
    return TrendsResult(trends=stubs, source="unavailable")


if __name__ == "__main__":
    result = get_trends()
    print(f"Source: {result.source}")
    for item in result.items:
        print(f"  {item.name} [{item.category}] — {item.why_trending} (~£{item.estimated_price_gbp:.2f})")
