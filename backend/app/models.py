from dataclasses import dataclass, field
from typing import Optional


# ─── Existing models ──────────────────────────────────────────────────────────

@dataclass
class WeatherResult:
    date: str           # YYYY-MM-DD
    avg_temp: float     # °C
    condition: str      # "mainly sun" | "mainly cloud" | "mainly rain"
    is_rainy: bool


@dataclass
class DecisionResult:
    meal: str           # primary recommended meal
    reason: str


@dataclass
class SupplyIngredient:
    name: str
    quantity: str
    available: bool


@dataclass
class SupplyResult:
    ingredients: list[SupplyIngredient] = field(default_factory=list)
    all_available: bool = False


@dataclass
class EquipmentItem:
    name: str
    available: bool


@dataclass
class EquipmentResult:
    equipment: list[EquipmentItem] = field(default_factory=list)
    all_ready: bool = False


# ─── Van / Equipment ──────────────────────────────────────────────────────────

@dataclass
class Van:
    id: str
    name: str
    base_location: str   # human-readable e.g. "North London Depot"
    postcode: str        # representative postcode for the van's base


@dataclass
class VanEquipmentResult:
    van: Van
    equipment: list[EquipmentItem] = field(default_factory=list)
    available_count: int = 0
    total_count: int = 0


# ─── Supply chain ─────────────────────────────────────────────────────────────

@dataclass
class Supplier:
    name: str
    distance_miles: float
    lead_time_hours: int
    categories: list[str]    # e.g. ["dairy", "produce"]
    reliability_pct: int     # 0–100


@dataclass
class InventoryItem:
    name: str
    category: str
    status: str              # "in_stock" | "low" | "out"


@dataclass
class SupplyChainResult:
    suppliers: list[Supplier] = field(default_factory=list)
    inventory: list[InventoryItem] = field(default_factory=list)


# ─── Trends ───────────────────────────────────────────────────────────────────

@dataclass
class TrendItem:
    label: str
    direction: str      # "up" | "down" | "stable"
    category: str       # e.g. "beverage", "snack", "main", "cuisine"
    momentum_pct: float = 0.0
    avg_interest: float = 0.0


@dataclass
class TrendsResult:
    trends: list[TrendItem] = field(default_factory=list)
    source: str = "hardcoded"   # "google_trends" | "hardcoded"


# ─── Historic ─────────────────────────────────────────────────────────────────

@dataclass
class HistoricDailyStat:
    date: str                   # ISO date
    total_covers: int
    total_revenue_gbp: float
    top_meal: str


@dataclass
class HistoricTopMeal:
    meal_name: str
    category: str
    total_qty: int
    total_revenue_gbp: float
    pct_of_total: float         # % of 30-day revenue


@dataclass
class HistoricResult:
    daily_stats: list = field(default_factory=list)   # list[HistoricDailyStat]
    top_meals: list = field(default_factory=list)     # list[HistoricTopMeal]
    total_revenue_gbp: float = 0.0
    avg_daily_covers: int = 0
    best_day: str = ""
    source: str = "mock"
    message: str = ""           # kept for backward compat


# ─── Seasonal ─────────────────────────────────────────────────────────────────

@dataclass
class SeasonalItem:
    name: str
    category: str    # e.g. "produce", "protein", "dessert"


@dataclass
class SeasonalResult:
    month: str
    items: list[SeasonalItem] = field(default_factory=list)
    source: str = "hardcoded"   # "openai" | "hardcoded"


# ─── Celebrations ─────────────────────────────────────────────────────────────

@dataclass
class FoodSuggestion:
    name: str
    category: str   # from taxonomy: main, snack, beverage, dessert, produce, etc.


@dataclass
class CelebrationEvent:
    name: str
    date: str                # ISO date string
    days_away: int
    food_opportunity: str    # short human-readable description
    menu_suggestions: list = field(default_factory=list)  # list[FoodSuggestion]


@dataclass
class CelebrationsResult:
    upcoming: list[CelebrationEvent] = field(default_factory=list)
    source: str = "hardcoded"   # "openai" | "hardcoded"


# ─── Regional demand ──────────────────────────────────────────────────────────

@dataclass
class RegionalInsight:
    insight: str
    category: str    # e.g. "demand", "preference", "trend"


@dataclass
class RegionalResult:
    region: str
    insights: list[RegionalInsight] = field(default_factory=list)
    menu_suggestions: list = field(default_factory=list)  # list[FoodSuggestion]
    source: str = "hardcoded"   # "openai" | "hardcoded"


# ─── Decision + options ───────────────────────────────────────────────────────

@dataclass
class MenuOption:
    name: str
    category: str       # "burger", "wrap", "dessert", "soup", etc.
    weather_fit: str    # "warm", "cold", "any"
    emoji: str


@dataclass
class DecisionAndOptionsResult:
    primary_meal: str
    primary_reason: str
    menu_options: list[MenuOption] = field(default_factory=list)


# ─── Final menu proposal ──────────────────────────────────────────────────────

@dataclass
class MenuProposal:
    grill: list[str] = field(default_factory=list)
    snacks: list[str] = field(default_factory=list)
    cold_drinks: list[str] = field(default_factory=list)
    sides: list[str] = field(default_factory=list)
    desserts: list[str] = field(default_factory=list)
    hot_drinks: list[str] = field(default_factory=list)
    pct_veggie: int = 0
    pct_vegan: int = 0
    pct_gluten_free: int = 0
    influences: list[str] = field(default_factory=list)
