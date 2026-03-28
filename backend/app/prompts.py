"""
Prompts — centralised store for all OpenAI prompt templates.

Each prompt is a plain string or a callable that accepts parameters and
returns a formatted string.  No OpenAI imports here — this is just text.

Business context is loaded from context.md and injected into all
suggestion prompts so OpenAI understands what TasteRover is.
"""
from pathlib import Path

_CONTEXT_PATH = Path(__file__).parent / "context.md"
_CONTEXT: str = ""
if _CONTEXT_PATH.exists():
    _CONTEXT = _CONTEXT_PATH.read_text(encoding="utf-8").strip()


def _biz_context() -> str:
    """Return the TasteRover business context block for prompt injection."""
    return f"""## Business Context
{_CONTEXT}
"""


def menu_item_enrichment_prompt(item_name: str, category: str, price_gbp: float) -> str:
    """
    Prompt to enrich a single menu item with ingredients, nutrition and tags.
    Returns JSON with keys: ingredients, nutrition, tags.
    Tags must be chosen exclusively from the provided taxonomy lists.
    """
    return f"""You are a UK street-food nutrition and menu expert.

Analyse the following menu item and return a JSON object with exactly these keys:

1. "ingredients" — array of strings, each a canonical ingredient name in Title Case
   (e.g. "Beef Mince", "Burger Bun", "Cheddar Cheese", "Iceberg Lettuce").
   Use consistent UK English names. List 3–8 key ingredients.

2. "nutrition" — object with keys: cal (kcal integer), protein_g (float 1dp),
   carbs_g (float 1dp), fat_g (float 1dp), fibre_g (float 1dp). Per serving.

3. "tags" — array of strings chosen ONLY from the following taxonomy lists.
   Pick every tag that genuinely applies (typically 3–8 tags):

   Weather fit (pick exactly one): hot_weather, cold_weather, any_weather
   Dietary (pick all that apply): vegetarian, vegan, gluten_free, dairy_free, halal, nut_free
   Allergens (pick all that apply): contains_gluten, contains_dairy, contains_eggs,
     contains_nuts, contains_fish, contains_shellfish, contains_soy, contains_sesame
   Positioning (pick all that apply): premium, budget_friendly, quick_serve,
     comfort_food, family_friendly, shareable, hero_item

Menu item: "{item_name}"
Category: {category}
Price: £{price_gbp:.2f}

Return JSON only. No explanation."""


def celebrations_prompt(today_iso: str, cutoff_iso: str) -> str:
    """Prompt to fetch upcoming UK food-relevant events."""
    return f"""{_biz_context()}

Today is {today_iso}.
List the next 6 upcoming UK public holidays, festivals, or food-relevant cultural events
between now and {cutoff_iso}.
For each event, suggest menu items that TasteRover could serve from a food truck.
Return a JSON object with key "events" containing an array.
Each element must have:
  "name" (string),
  "date" (YYYY-MM-DD),
  "food_opportunity" (1 concise sentence describing the food angle for a street-food van),
  "menu_suggestions" (array of 2–4 objects each with "name" (Title Case string) and
    "category" (one of: main, snack, beverage, dessert, produce)).
Only include events with known fixed UK dates. Return JSON only."""


def seasonal_prompt(month_name: str, month_num: int) -> str:
    """Prompt to fetch UK seasonal ingredients and meal suggestions for a given month."""
    return f"""{_biz_context()}

List seasonal ingredients available in the UK in {month_name} (month {month_num}),
then suggest street-food meals that TasteRover could serve using those ingredients.

Return a JSON object with two keys:

1. "ingredients" — array of 8–12 objects each with:
   "name" (string, Title Case — the raw ingredient),
   "category" (one of: produce, protein, seafood, game, herb, dairy, dessert, beverage, grain).

2. "meals" — array of 6–10 objects each with:
   "name" (string, Title Case — a street-food dish/drink name),
   "category" (one of: grill, sides, snacks, desserts, cold_drinks, hot_drinks),
   "linked_ingredient" (string — the seasonal ingredient this meal uses, must match a name from the ingredients list),
   "estimated_price_gbp" (float — typical UK street food price).

Return JSON only."""


def menu_trends_prompt(items: list[str]) -> str:
    """
    Prompt to assess UK trend direction for a list of menu item names.
    Returns JSON with key "trends" — array of objects per item.
    """
    items_str = "\n".join(f"- {name}" for name in items)
    return f"""You are a UK food & beverage market analyst with up-to-date knowledge of consumer trends.

For each of the following menu items, assess their current trend direction in the UK street-food and casual dining market.

Items:
{items_str}

Return a JSON object with key "trends" containing an array. Each element must have:
  "label" — the item name exactly as provided
  "direction" — one of: "up", "stable", "down"
  "momentum_pct" — estimated momentum as a float (positive = growing, negative = declining). Range roughly -30 to +60.
  "avg_interest" — estimated relative consumer interest score 0–100
  "category" — one of: main, snack, beverage, dessert, side, pizza, pasta

Base your assessment on UK food culture, social media trends, restaurant/street-food popularity, and seasonal factors for the current time of year (March 2026).
Return JSON only."""


def regional_prompt(region: str) -> str:
    """Prompt to fetch regional food demand insights for a UK region."""
    return f"""{_biz_context()}

Describe food demand for TasteRover's street-food van operating in {region}, UK.
Suggest menu items that would sell well in this region, suitable for serving from a food truck.
Return a JSON object with two keys:
  "insights": array of 4–6 objects each with "insight" (string) and
    "category" (one of: demand, preference, trend).
  "menu_suggestions": array of 4 objects each with "name" (Title Case string) and
    "category" (one of: main, snack, beverage, dessert, produce).
Return JSON only."""


def trending_discovery_prompt(month_name: str, season: str) -> str:
    """Prompt to discover trending UK street food items for the current period."""
    return f"""{_biz_context()}

What are the top 12 trending street food items in the UK right now ({month_name}, {season})
that TasteRover could realistically serve from a food truck?
Include a mix of mains, snacks, drinks, and desserts.
Focus on items gaining popularity on social media, at food festivals, and in the casual dining scene.

Return a JSON object with key "items" — an array of objects each with:
  "name" (Title Case string — the dish/drink name),
  "category" (one of: grill, sides, snacks, desserts, cold_drinks, hot_drinks),
  "why_trending" (1 concise sentence explaining why this is trending),
  "estimated_price_gbp" (float — typical UK street food price).

Return JSON only. No explanation."""


def weather_meal_suggestions_prompt(avg_temp: float, condition: str, is_rainy: bool) -> str:
    """Prompt to suggest meals suited to a specific weather forecast."""
    weather_desc = f"{avg_temp:.1f}°C, {condition}"
    if is_rainy:
        weather_desc += ", rainy"
    return f"""{_biz_context()}

The weather forecast is: {weather_desc}.

Suggest 8–10 meals, snacks, and drinks that TasteRover should serve from its food truck
in this weather. Consider what customers crave in these conditions — warming comfort food
for cold/wet, refreshing light options for warm/dry. All items must be feasible from a
food truck with standard equipment (grill, fryer, coffee machine, etc).

Return a JSON object with key "suggestions" — an array of objects each with:
  "name" (Title Case string — the dish/drink name),
  "category" (one of: grill, sides, snacks, desserts, cold_drinks, hot_drinks),
  "reason" (1 concise sentence explaining why this suits the weather),
  "estimated_price_gbp" (float — typical UK street food price).

Return JSON only. No explanation."""
