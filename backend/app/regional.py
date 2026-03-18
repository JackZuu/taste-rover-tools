"""
Regional demand module — demand and preference insights by UK region.

Tries OpenAI (gpt-4o-mini) first for richer, context-aware regional intelligence.
Falls back to the hardcoded regional data if OpenAI is unavailable.
AI results are cached per region (in-memory, reset on server restart).

DATA SOURCE: OpenAI gpt-4o-mini | hardcoded fallback
"""
import os
import json
from app.models import RegionalInsight, RegionalResult

# ---------------------------------------------------------------------------
# OpenAI availability
# ---------------------------------------------------------------------------
_OPENAI_AVAILABLE = False
try:
    from openai import OpenAI as _OpenAI
    _OPENAI_AVAILABLE = True
except ImportError:
    pass

# Per-region cache: {region: RegionalResult}
_ai_cache: dict = {}

# Valid insight categories (taxonomy)
VALID_INSIGHT_CATS = {"demand", "preference", "trend"}

# ---------------------------------------------------------------------------
# Hardcoded fallback
# ---------------------------------------------------------------------------
_REGIONAL_DATA: dict[str, list[dict]] = {
    "London": [
        {"insight": "High demand for street food and international cuisines",   "category": "demand"},
        {"insight": "Lunch trade peaks 12–2 pm Mon–Fri in business districts", "category": "demand"},
        {"insight": "Strong preference for plant-based and vegan options",      "category": "preference"},
        {"insight": "Matcha and specialty coffee growing rapidly",              "category": "trend"},
        {"insight": "Premium pricing well accepted (avg spend £9–£14)",         "category": "preference"},
    ],
    "South East": [
        {"insight": "Commuter routes drive strong breakfast trade",             "category": "demand"},
        {"insight": "Families dominate weekend footfall",                       "category": "demand"},
        {"insight": "Sandwiches and wraps most popular grab-and-go choice",    "category": "preference"},
        {"insight": "Coastal towns boost fish and seafood demand in summer",   "category": "trend"},
    ],
    "South West": [
        {"insight": "Cream teas and pasties remain top sellers year-round",    "category": "preference"},
        {"insight": "Seasonal tourism spikes June–August",                     "category": "demand"},
        {"insight": "Local sourcing and provenance messaging resonates well",  "category": "preference"},
        {"insight": "Cider and craft drinks popular in rural areas",           "category": "trend"},
    ],
    "East of England": [
        {"insight": "Agricultural communities prefer hearty, filling meals",   "category": "preference"},
        {"insight": "Lower avg spend than London (£6–£10 sweet spot)",         "category": "demand"},
        {"insight": "Breakfast rolls and hot drinks strong AM trade",          "category": "demand"},
    ],
    "East Midlands": [
        {"insight": "Pork pies and Stilton have strong regional identity",     "category": "preference"},
        {"insight": "Family-sized portions preferred over premium single",     "category": "preference"},
        {"insight": "Value-for-money messaging key differentiator",            "category": "demand"},
    ],
    "West Midlands": [
        {"insight": "Balti and South Asian fusion very popular",               "category": "preference"},
        {"insight": "Dense urban footfall in Birmingham city centre",          "category": "demand"},
        {"insight": "Plant-based options growing among younger demographic",   "category": "trend"},
    ],
    "Yorks & Humber": [
        {"insight": "Yorkshire pudding wraps trending on social media",        "category": "trend"},
        {"insight": "Strong demand for hearty, warming meals Oct–Mar",         "category": "demand"},
        {"insight": "Festival and outdoor event season strong May–Sept",       "category": "demand"},
    ],
    "North West": [
        {"insight": "Manchester drives strong craft food and drink culture",   "category": "trend"},
        {"insight": "Lunch trade highly competitive; speed of service key",    "category": "demand"},
        {"insight": "Pasties, pies and comfort food remain top sellers",       "category": "preference"},
        {"insight": "Festival season (May–Aug) significantly boosts demand",  "category": "demand"},
    ],
    "North East": [
        {"insight": "Stotties and pease pudding strong local favourites",      "category": "preference"},
        {"insight": "Price sensitivity higher than national average",          "category": "demand"},
        {"insight": "Hot food demand strong across all seasons",               "category": "demand"},
    ],
    "Wales": [
        {"insight": "Cawl and lamb dishes resonate strongly",                  "category": "preference"},
        {"insight": "Tourism in national parks drives summer footfall",        "category": "demand"},
        {"insight": "Welsh cakes popular as sweet treat or gift",              "category": "preference"},
    ],
    "Scotland": [
        {"insight": "Haggis, Irn-Bru and deep-fried snacks iconic",           "category": "preference"},
        {"insight": "Edinburgh Fringe (Aug) creates major demand spike",       "category": "demand"},
        {"insight": "Cold and wet climate favours warming food year-round",    "category": "demand"},
        {"insight": "Craft whisky pairing becoming a draw for tourists",       "category": "trend"},
    ],
    "N. Ireland": [
        {"insight": "Ulster fry is the undisputed breakfast favourite",        "category": "preference"},
        {"insight": "Soda bread and wheaten bread high baseline demand",       "category": "preference"},
        {"insight": "Tourist trade in Causeway Coast boosts summer demand",    "category": "demand"},
    ],
}

_DEFAULT_INSIGHTS: list[dict] = [
    {"insight": "General UK street food demand is growing year-on-year",       "category": "demand"},
    {"insight": "Health-conscious options increasingly expected",               "category": "preference"},
]


# ---------------------------------------------------------------------------
# OpenAI fetch
# ---------------------------------------------------------------------------

def _get_ai_regional(region: str) -> RegionalResult | None:
    """
    Use OpenAI to fetch regional demand insights for a UK region.
    Results are cached per region key.
    """
    if not _OPENAI_AVAILABLE or not os.getenv("OPENAI_API_KEY"):
        return None

    if region in _ai_cache:
        return _ai_cache[region]

    try:
        client = _OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        prompt = (
            f"UK region: {region}. "
            f"Provide 5 to 7 actionable consumer demand insights for a street food van operating in {region}. "
            f"Cover: peak trading times, popular food preferences, local specialities that resonate, "
            f"emerging food and drink trends, and pricing sensitivity. "
            f"Return a JSON object with: "
            f"\"region\" (string), "
            f"\"insights\" (array of objects each with \"insight\" (concise string, max 15 words) and "
            f"\"category\" (one of: demand, preference, trend)). "
            f"Return JSON only."
        )
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=600,
            temperature=0.3,
        )
        raw = response.choices[0].message.content or "{}"
        parsed = json.loads(raw)
        insights_raw = parsed.get("insights", [])
        if not isinstance(insights_raw, list) or not insights_raw:
            return None

        insights = []
        for it in insights_raw:
            cat = it.get("category", "demand")
            if cat not in VALID_INSIGHT_CATS:
                cat = "demand"
            insights.append(RegionalInsight(insight=it["insight"], category=cat))

        result = RegionalResult(
            region=parsed.get("region", region),
            insights=insights,
            source="openai",
        )
        _ai_cache[region] = result
        return result
    except Exception:
        pass

    return None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_regional_demand(region: str) -> RegionalResult:
    """
    Return demand and preference insights for the given UK region.
    Tries OpenAI first, falls back to hardcoded data.
    DATA SOURCE: OpenAI gpt-4o-mini | hardcoded fallback
    """
    ai_result = _get_ai_regional(region)
    if ai_result:
        return ai_result

    raw = _REGIONAL_DATA.get(region, _DEFAULT_INSIGHTS)
    insights = [RegionalInsight(**i) for i in raw]
    return RegionalResult(region=region, insights=insights, source="hardcoded")


if __name__ == "__main__":
    for region in ("London", "Scotland", "Wales"):
        result = get_regional_demand(region)
        print(f"\n{result.region} [{result.source}]:")
        for ins in result.insights:
            print(f"  [{ins.category}] {ins.insight}")
