"""
Regional demand module — demand and preference insights by UK region.

DATA SOURCE: hardcoded
"""
from app.models import RegionalInsight, RegionalResult

_REGIONAL_DATA: dict[str, list[dict]] = {
    "London": [
        {"insight": "High demand for street food and international cuisines", "category": "demand"},
        {"insight": "Lunch trade peaks 12–2 pm Mon–Fri in business districts", "category": "demand"},
        {"insight": "Strong preference for plant-based and vegan options",    "category": "preference"},
        {"insight": "Matcha and specialty coffee growing rapidly",            "category": "trend"},
        {"insight": "Premium pricing well accepted (avg spend £9–£14)",       "category": "preference"},
    ],
    "South East": [
        {"insight": "Commuter routes drive strong breakfast trade",           "category": "demand"},
        {"insight": "Families dominate weekend footfall",                     "category": "demand"},
        {"insight": "Sandwiches and wraps most popular grab-and-go choice",  "category": "preference"},
        {"insight": "Coastal towns boost fish and seafood demand in summer",  "category": "trend"},
    ],
    "South West": [
        {"insight": "Cream teas and pasties remain top sellers year-round",  "category": "preference"},
        {"insight": "Seasonal tourism spikes June–August",                   "category": "demand"},
        {"insight": "Local sourcing and provenance messaging resonates well", "category": "preference"},
        {"insight": "Cider and craft drinks popular in rural areas",         "category": "trend"},
    ],
    "East of England": [
        {"insight": "Agricultural communities prefer hearty, filling meals",  "category": "preference"},
        {"insight": "Lower avg spend than London (£6–£10 sweet spot)",       "category": "demand"},
        {"insight": "Breakfast rolls and hot drinks strong AM trade",        "category": "demand"},
    ],
    "East Midlands": [
        {"insight": "Pork pies and Stilton have strong regional identity",   "category": "preference"},
        {"insight": "Family-sized portions preferred over premium single",   "category": "preference"},
        {"insight": "Value-for-money messaging key differentiator",          "category": "demand"},
    ],
    "West Midlands": [
        {"insight": "Balti and South Asian fusion very popular",             "category": "preference"},
        {"insight": "Dense urban footfall in Birmingham city centre",        "category": "demand"},
        {"insight": "Plant-based options growing among younger demographic", "category": "trend"},
    ],
    "Yorks & Humber": [
        {"insight": "Yorkshire pudding wraps trending on social media",      "category": "trend"},
        {"insight": "Strong demand for hearty, warming meals Oct–Mar",       "category": "demand"},
        {"insight": "Festival and outdoor event season strong May–Sept",     "category": "demand"},
    ],
    "North West": [
        {"insight": "Manchester drives strong craft food and drink culture", "category": "trend"},
        {"insight": "Lunch trade highly competitive; speed of service key",  "category": "demand"},
        {"insight": "Pasties, pies and comfort food remain top sellers",    "category": "preference"},
        {"insight": "Festival season (May–Aug) significantly boosts demand", "category": "demand"},
    ],
    "North East": [
        {"insight": "Stotties and pease pudding strong local favourites",   "category": "preference"},
        {"insight": "Price sensitivity higher than national average",        "category": "demand"},
        {"insight": "Hot food demand strong across all seasons",             "category": "demand"},
    ],
    "Wales": [
        {"insight": "Cawl and lamb dishes resonate strongly",               "category": "preference"},
        {"insight": "Tourism in national parks drives summer footfall",     "category": "demand"},
        {"insight": "Welsh cakes popular as sweet treat or gift",           "category": "preference"},
    ],
    "Scotland": [
        {"insight": "Haggis, Irn-Bru and deep-fried snacks iconic",        "category": "preference"},
        {"insight": "Edinburgh Fringe (Aug) creates major demand spike",    "category": "demand"},
        {"insight": "Cold and wet climate favours warming food year-round", "category": "demand"},
        {"insight": "Craft whisky pairing becoming a draw for tourists",   "category": "trend"},
    ],
    "N. Ireland": [
        {"insight": "Ulster fry is the undisputed breakfast favourite",     "category": "preference"},
        {"insight": "Soda bread and wheaten bread high baseline demand",    "category": "preference"},
        {"insight": "Tourist trade in Causeway Coast boosts summer demand", "category": "demand"},
    ],
}

_DEFAULT_INSIGHTS: list[dict] = [
    {"insight": "General UK street food demand is growing year-on-year",   "category": "demand"},
    {"insight": "Health-conscious options increasingly expected",           "category": "preference"},
]


def get_regional_demand(region: str) -> RegionalResult:
    """
    Return demand and preference insights for the given UK region.
    Falls back to default insights if the region is not found.
    DATA SOURCE: hardcoded
    """
    raw = _REGIONAL_DATA.get(region, _DEFAULT_INSIGHTS)
    insights = [RegionalInsight(**i) for i in raw]
    return RegionalResult(region=region, insights=insights)


if __name__ == "__main__":
    for region in ("London", "Scotland", "Wales"):
        result = get_regional_demand(region)
        print(f"\n{result.region}:")
        for ins in result.insights:
            print(f"  [{ins.category}] {ins.insight}")
