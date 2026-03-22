"""
Trends module — live food & beverage trend signals via Google Trends (UK).

Queries MENU_CATEGORIES using pytrends, computes momentum vs prior period,
and returns TrendsResult. Falls back to hardcoded data if pytrends is
unavailable or rate-limited. Results are cached for 1 hour.

Adapted from google_trends.py (Taste Rover SmarTR Food Step 3).
"""

import time
from datetime import datetime
from app.models import TrendItem, TrendsResult

# ---------------------------------------------------------------------------
# Monkey-patch: fix pytrends for urllib3 v2+
# pytrends (archived 2025) uses removed 'method_whitelist' kwarg.
# Must patch BEFORE importing pytrends.
# ---------------------------------------------------------------------------
_PYTRENDS_AVAILABLE = False
try:
    import requests.packages.urllib3.util.retry as _retry_mod
    _OrigRetry = _retry_mod.Retry

    class _PatchedRetry(_OrigRetry):
        def __init__(self, *args, **kwargs):
            if "method_whitelist" in kwargs:
                kwargs["allowed_methods"] = kwargs.pop("method_whitelist")
            super().__init__(*args, **kwargs)

    _retry_mod.Retry = _PatchedRetry
    from pytrends.request import TrendReq
    _PYTRENDS_AVAILABLE = True
except Exception:
    pass

# ---------------------------------------------------------------------------
# Configuration (from google_trends.py)
# ---------------------------------------------------------------------------
FOOD_DRINK_CAT = 71      # Google Trends category: Food & Drink
LANGUAGE       = "en-GB"
TIMEZONE       = 0       # GMT
SLEEP          = 2       # seconds between API calls to avoid rate-limiting

MENU_CATEGORIES: dict[str, list[str]] = {
    "grill": [
        "smash burger", "loaded fries", "chicken wings",
        "halloumi burger", "pulled pork",
    ],
    "snacks": [
        "korean corn dog", "mac and cheese bites", "spring rolls",
        "falafel wrap", "churros",
    ],
    "drinks": [
        "bubble tea", "iced coffee", "lemonade",
        "matcha latte", "hot chocolate",
    ],
    "trending_cuisines": [
        "korean street food", "mexican street food", "japanese street food",
        "mediterranean food", "plant based food",
    ],
}

_CAT_MAP: dict[str, str] = {
    "grill":             "main",
    "snacks":            "snack",
    "drinks":            "beverage",
    "trending_cuisines": "cuisine",
}

# ---------------------------------------------------------------------------
# 1-hour in-memory cache
# ---------------------------------------------------------------------------
_cache: dict = {}
_CACHE_TTL_S = 3600

# ---------------------------------------------------------------------------
# Hardcoded fallback (when pytrends is unavailable / rate-limited)
# ---------------------------------------------------------------------------
_FALLBACK: list[dict] = [
    {"label": "Smash Burger",         "direction": "up",     "category": "main",     "momentum_pct": 12.5, "avg_interest": 68.0},
    {"label": "Loaded Fries",         "direction": "up",     "category": "main",     "momentum_pct":  9.2, "avg_interest": 72.0},
    {"label": "Matcha Latte",         "direction": "up",     "category": "beverage", "momentum_pct": 18.1, "avg_interest": 55.0},
    {"label": "Korean Street Food",   "direction": "up",     "category": "cuisine",  "momentum_pct": 11.4, "avg_interest": 44.0},
    {"label": "Plant Based Food",     "direction": "up",     "category": "cuisine",  "momentum_pct":  6.8, "avg_interest": 51.0},
    {"label": "Bubble Tea",           "direction": "up",     "category": "beverage", "momentum_pct":  7.3, "avg_interest": 48.0},
    {"label": "Chicken Wings",        "direction": "stable", "category": "main",     "momentum_pct":  1.2, "avg_interest": 80.0},
    {"label": "Falafel Wrap",         "direction": "stable", "category": "snack",    "momentum_pct": -2.1, "avg_interest": 31.0},
    {"label": "Hot Chocolate",        "direction": "stable", "category": "beverage", "momentum_pct":  0.5, "avg_interest": 74.0},
    {"label": "Churros",              "direction": "stable", "category": "snack",    "momentum_pct":  2.8, "avg_interest": 42.0},
    {"label": "Spring Rolls",         "direction": "stable", "category": "snack",    "momentum_pct":  3.1, "avg_interest": 38.0},
    {"label": "Pulled Pork",          "direction": "down",   "category": "main",     "momentum_pct": -8.3, "avg_interest": 38.0},
    {"label": "Mediterranean Food",   "direction": "down",   "category": "cuisine",  "momentum_pct": -6.1, "avg_interest": 35.0},
]

# ---------------------------------------------------------------------------
# Core fetch functions (adapted from google_trends.py)
# ---------------------------------------------------------------------------

def _fetch_category(pt: "TrendReq", cat_name: str, keywords: list[str], geo: str) -> list[TrendItem]:
    """Fetch interest-over-time for up to 5 keywords and compute momentum."""
    pt.build_payload(keywords[:5], cat=FOOD_DRINK_CAT, timeframe="today 3-m", geo=geo)
    df = pt.interest_over_time()
    if "isPartial" in df.columns:
        df = df.drop(columns=["isPartial"])
    if df.empty:
        return []

    means = df.mean().to_dict()

    # Compare last 4 weeks vs prior 4 weeks for momentum
    if len(df) >= 8:
        recent   = df.iloc[-4:].mean()
        prior    = df.iloc[-8:-4].mean()
        momentum = ((recent - prior) / prior.replace(0, 1) * 100).round(1).to_dict()
    else:
        momentum = {k: 0.0 for k in means}

    category = _CAT_MAP.get(cat_name, cat_name)
    items: list[TrendItem] = []
    for kw in keywords:
        if kw in means:
            mom = float(momentum.get(kw, 0.0))
            direction = "up" if mom > 5 else "down" if mom < -5 else "stable"
            items.append(TrendItem(
                label=kw.title(),
                direction=direction,
                category=category,
                momentum_pct=round(mom, 1),
                avg_interest=round(float(means[kw]), 1),
            ))
    return items


def _fetch_live(geo: str = "GB") -> list[TrendItem] | None:
    """Run all category queries. Returns None on any unrecoverable failure."""
    try:
        pt = TrendReq(hl=LANGUAGE, tz=TIMEZONE, timeout=(10, 30), retries=3, backoff_factor=1.0)
        items: list[TrendItem] = []
        for cat_name, keywords in MENU_CATEGORIES.items():
            try:
                items.extend(_fetch_category(pt, cat_name, keywords, geo))
                time.sleep(SLEEP)
            except Exception:
                continue
        return items if items else None
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_trends(geo: str = "GB") -> TrendsResult:
    """
    Return current food & beverage trend signals.
    Tries Google Trends (cached 1 hr), falls back to hardcoded list.
    DATA SOURCE: Google Trends (pytrends) | hardcoded fallback
    """
    now = datetime.utcnow()
    cached_result = _cache.get("result")
    cached_at     = _cache.get("at")

    if cached_result and cached_at and (now - cached_at).total_seconds() < _CACHE_TTL_S:
        return cached_result

    if _PYTRENDS_AVAILABLE:
        items = _fetch_live(geo=geo)
        if items:
            result = TrendsResult(trends=items, source="google_trends")
            _cache["result"] = result
            _cache["at"] = now
            return result

    # Fallback to hardcoded data
    return TrendsResult(
        trends=[TrendItem(**t) for t in _FALLBACK],
        source="hardcoded",
    )


_custom_cache: dict = {}
_CUSTOM_CACHE_TTL_S = 86400  # 24 hours — menu items don't change frequently


def _openai_trends(keywords: list[str]) -> list[TrendItem] | None:
    """Use OpenAI to assess trend direction for menu item keywords."""
    import os, json
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
    Secondary: pytrends for first 5 keywords if available.
    DATA SOURCE: OpenAI gpt-4o-mini | pytrends | unavailable stubs
    """
    if not keywords:
        return TrendsResult(trends=[], source="unavailable")

    # Cache key: sorted keywords joined
    cache_key = "|".join(sorted(k.lower() for k in keywords))
    now = datetime.utcnow()
    cached = _custom_cache.get(cache_key)
    if cached and (now - cached["at"]).total_seconds() < _CUSTOM_CACHE_TTL_S:
        return cached["result"]

    # Try OpenAI first (handles all keywords at once)
    items = _openai_trends(keywords)
    if items:
        result = TrendsResult(trends=items, source="openai")
        _custom_cache[cache_key] = {"result": result, "at": now}
        return result

    # Try pytrends for first 5 keywords
    if _PYTRENDS_AVAILABLE:
        try:
            pt = TrendReq(hl=LANGUAGE, tz=TIMEZONE, timeout=(10, 30), retries=2, backoff_factor=1.0)
            items = _fetch_category(pt, "custom", keywords[:5], geo)
            if items:
                result = TrendsResult(trends=items, source="google_trends")
                _custom_cache[cache_key] = {"result": result, "at": now}
                return result
        except Exception:
            pass

    # Fallback stubs
    stubs = [
        TrendItem(label=kw, direction="stable", category="main",
                  momentum_pct=0.0, avg_interest=0.0)
        for kw in keywords
    ]
    return TrendsResult(trends=stubs, source="unavailable")


if __name__ == "__main__":
    result = get_trends()
    icons = {"up": "📈", "down": "📉", "stable": "➡️"}
    print(f"Source: {result.source}")
    for t in result.trends:
        print(f"  {icons[t.direction]} {t.label} ({t.category})  "
              f"momentum={t.momentum_pct:+.1f}%  avg={t.avg_interest}")
