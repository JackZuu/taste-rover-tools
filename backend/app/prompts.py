"""
Prompts — centralised store for all OpenAI prompt templates.

Each prompt is a plain string or a callable that accepts parameters and
returns a formatted string.  No OpenAI imports here — this is just text.
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
   Demand signals (pick all that apply): trending_up, seasonal_spring, seasonal_summer,
     seasonal_autumn, seasonal_winter, celebration_fit, regional_special
   Positioning (pick all that apply): premium, budget_friendly, quick_serve,
     comfort_food, family_friendly, shareable, hero_item

Menu item: "{item_name}"
Category: {category}
Price: £{price_gbp:.2f}

Return JSON only. No explanation."""


def celebrations_prompt(today_iso: str, cutoff_iso: str) -> str:
    """Prompt to fetch upcoming UK food-relevant events."""
    return f"""Today is {today_iso}.
List the next 6 upcoming UK public holidays, festivals, or food-relevant cultural events
between now and {cutoff_iso}.
Return a JSON object with key "events" containing an array.
Each element must have:
  "name" (string),
  "date" (YYYY-MM-DD),
  "food_opportunity" (1 concise sentence describing the food angle for a street-food van),
  "menu_suggestions" (array of 2–4 objects each with "name" (Title Case string) and
    "category" (one of: main, snack, beverage, dessert, produce)).
Only include events with known fixed UK dates. Return JSON only."""


def seasonal_prompt(month_name: str, month_num: int) -> str:
    """Prompt to fetch UK seasonal foods for a given month."""
    return f"""List seasonal foods available in the UK in {month_name} (month {month_num}).
Return a JSON object with key "items" — an array of objects each with:
  "name" (string, Title Case),
  "category" (one of: produce, protein, seafood, game, herb, dairy, dessert, beverage, grain).
Include 8–12 items. Return JSON only."""


def regional_prompt(region: str) -> str:
    """Prompt to fetch regional food demand insights for a UK region."""
    return f"""You are a UK street-food market analyst.
Describe food demand for a street-food van operating in {region}, UK.
Return a JSON object with two keys:
  "insights": array of 4–6 objects each with "insight" (string) and
    "category" (one of: demand, preference, trend).
  "menu_suggestions": array of 4 objects each with "name" (Title Case string) and
    "category" (one of: main, snack, beverage, dessert, produce).
Return JSON only."""
