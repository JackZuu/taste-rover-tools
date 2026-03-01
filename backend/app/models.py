from dataclasses import dataclass, field
from typing import Optional


@dataclass
class WeatherResult:
    date: str           # YYYY-MM-DD
    avg_temp: float     # °C
    condition: str      # "mainly sun" | "mainly cloud" | "mainly rain"
    is_rainy: bool


@dataclass
class DecisionResult:
    meal: str           # "strawberry ice cream" | "tomato soup"
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
