"""
Taxonomy — single source of truth for all categories and tag values used
across menu items, ingredients, enrichment, supply chain and pipeline modules.

Keep every string literal consistent with these constants.
"""

# ─── Menu section categories ─────────────────────────────────────────────────
MENU_CATEGORIES = ["grill", "sides", "snacks", "desserts", "cold_drinks", "hot_drinks"]

# ─── Ingredient / supply categories ──────────────────────────────────────────
INGREDIENT_CATEGORIES = [
    "produce",      # fresh fruit & vegetables
    "meat",         # beef, lamb, pork, game
    "poultry",      # chicken, turkey, duck
    "seafood",      # fish, shellfish
    "dairy",        # milk, cream, cheese, butter, eggs
    "bread",        # buns, wraps, loaves, rolls, pastry
    "pantry",       # oils, sugars, flour, stock, condiments, spices
    "frozen",       # frozen chips, ice cream mix, frozen protein
    "beverages",    # soft drinks, juices, coffee, tea
    "packaging",    # cups, boxes, napkins, trays
]

# ─── Demand / insight categories ─────────────────────────────────────────────
INSIGHT_CATEGORIES = ["demand", "preference", "trend"]

# ─── Celebration / menu item categories (OpenAI prompts) ─────────────────────
FOOD_SUGGESTION_CATEGORIES = ["main", "snack", "beverage", "dessert", "produce"]

# ─── Weather fit tags ─────────────────────────────────────────────────────────
WEATHER_TAGS = ["hot_weather", "cold_weather", "any_weather"]

# ─── Dietary tags ─────────────────────────────────────────────────────────────
DIETARY_TAGS = ["vegetarian", "vegan", "gluten_free", "dairy_free", "halal", "nut_free"]

# ─── Allergen tags ───────────────────────────────────────────────────────────
ALLERGEN_TAGS = [
    "contains_gluten",
    "contains_dairy",
    "contains_eggs",
    "contains_nuts",
    "contains_fish",
    "contains_shellfish",
    "contains_soy",
    "contains_sesame",
]

# ─── Demand signal tags ───────────────────────────────────────────────────────
DEMAND_TAGS = [
    "trending_up",
    "seasonal_spring",   # Mar–May
    "seasonal_summer",   # Jun–Aug
    "seasonal_autumn",   # Sep–Nov
    "seasonal_winter",   # Dec–Feb
    "celebration_fit",
    "regional_special",
]

# ─── Positioning tags ─────────────────────────────────────────────────────────
POSITIONING_TAGS = [
    "premium",           # price > £8
    "budget_friendly",   # price < £5
    "quick_serve",       # prep < 3 min
    "comfort_food",
    "family_friendly",
    "shareable",
    "hero_item",         # lead / featured item for the day
]

# ─── Equipment types (canonical names for enrichment matching) ────────────────
EQUIPMENT_TYPES = [
    "broiler",
    "convection_oven",
    "finishing_conveyor",
    "heated_shelf",
    "coffee_machine",
    "milk_foamer",
    "refrigeration",
    "tray_conveyor",
    "tray_loading_station",
    "tray_scanner",
    "grill",
    "fryer",
    "microwave",
    "blender",
    "kettle",
    "freezer",
    "fridge",
    "panini_press",
]

# All valid tags (union — used for validation)
ALL_TAGS = WEATHER_TAGS + DIETARY_TAGS + ALLERGEN_TAGS + DEMAND_TAGS + POSITIONING_TAGS

# ─── Framework config defaults ────────────────────────────────────────────────
CONFIG_DEFAULTS = {
    "weather_weight":        1.0,
    "trends_weight":         1.0,
    "seasonal_weight":       1.0,
    "events_weight":         1.0,
    "regional_weight":       1.0,
    "target_pct_veggie":     30,
    "target_pct_vegan":      15,
    "target_pct_gluten_free": 20,
    "avg_price_target_gbp":  7.0,
    "exclude_allergens":     [],   # list of allergen tag strings
}
