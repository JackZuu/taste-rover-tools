"""
Supply chain module — BidFood Direct wholesale supplier + ingredient inventory.

BidFood Direct is the single supplier.  Inventory items use the taxonomy
ingredient categories defined in app/taxonomy.py.  This is mock data;
a future version will scrape the live BidFood catalogue.

DATA SOURCE: mock data (BidFood Direct catalogue — to be scraped)
"""
from app.models import Supplier, InventoryItem, SupplyChainResult

# ─── BidFood Direct — single supplier ────────────────────────────────────────

_BIDFOOD_SUPPLIER = {
    "name":             "Bidfood Direct",
    "distance_miles":   8.5,
    "lead_time_hours":  24,
    "categories":       ["produce", "meat", "poultry", "seafood", "dairy",
                         "bread", "pantry", "frozen", "beverages", "packaging"],
    "reliability_pct":  92,
}

# ─── BidFood inventory — mock catalogue ──────────────────────────────────────
# categories from taxonomy.INGREDIENT_CATEGORIES
# status: "in_stock" | "low" | "out"

_INVENTORY: list[dict] = [
    # Produce
    {"name": "Beef Mince",              "category": "meat",     "status": "in_stock"},
    {"name": "Beef Patties",            "category": "meat",     "status": "in_stock"},
    {"name": "Chicken Breast",          "category": "poultry",  "status": "in_stock"},
    {"name": "Chicken Thigh",           "category": "poultry",  "status": "in_stock"},
    {"name": "Bacon Rashers",           "category": "meat",     "status": "low"},
    {"name": "Lamb Mince",              "category": "meat",     "status": "in_stock"},
    {"name": "Pork Sausages",           "category": "meat",     "status": "in_stock"},
    {"name": "Tuna (Canned)",           "category": "seafood",  "status": "in_stock"},
    # Dairy
    {"name": "Cheddar Cheese",          "category": "dairy",    "status": "in_stock"},
    {"name": "Mozzarella",              "category": "dairy",    "status": "in_stock"},
    {"name": "Double Cream",            "category": "dairy",    "status": "low"},
    {"name": "Whole Milk",              "category": "dairy",    "status": "in_stock"},
    {"name": "Butter",                  "category": "dairy",    "status": "in_stock"},
    {"name": "Eggs",                    "category": "dairy",    "status": "in_stock"},
    # Produce
    {"name": "Iceberg Lettuce",         "category": "produce",  "status": "in_stock"},
    {"name": "Tomatoes",                "category": "produce",  "status": "in_stock"},
    {"name": "Red Onion",               "category": "produce",  "status": "in_stock"},
    {"name": "White Onion",             "category": "produce",  "status": "in_stock"},
    {"name": "Garlic",                  "category": "produce",  "status": "in_stock"},
    {"name": "Potatoes",                "category": "produce",  "status": "in_stock"},
    {"name": "Sweet Potatoes",          "category": "produce",  "status": "in_stock"},
    {"name": "Broccoli",                "category": "produce",  "status": "in_stock"},
    {"name": "Carrots",                 "category": "produce",  "status": "in_stock"},
    {"name": "Courgette",               "category": "produce",  "status": "in_stock"},
    {"name": "Portobello Mushrooms",    "category": "produce",  "status": "in_stock"},
    {"name": "Mixed Peppers",           "category": "produce",  "status": "in_stock"},
    {"name": "Cucumber",                "category": "produce",  "status": "in_stock"},
    {"name": "Strawberries",            "category": "produce",  "status": "low"},
    {"name": "Mango",                   "category": "produce",  "status": "in_stock"},
    {"name": "Melon",                   "category": "produce",  "status": "in_stock"},
    {"name": "Lemon",                   "category": "produce",  "status": "in_stock"},
    # Bread / pastry
    {"name": "Burger Buns",             "category": "bread",    "status": "in_stock"},
    {"name": "Wraps (Flour)",           "category": "bread",    "status": "in_stock"},
    {"name": "Sliced White Bread",      "category": "bread",    "status": "in_stock"},
    {"name": "Pizza Dough Bases",       "category": "bread",    "status": "in_stock"},
    # Pantry
    {"name": "Olive Oil",               "category": "pantry",   "status": "in_stock"},
    {"name": "Vegetable Stock",         "category": "pantry",   "status": "in_stock"},
    {"name": "Passata",                 "category": "pantry",   "status": "in_stock"},
    {"name": "Pesto",                   "category": "pantry",   "status": "in_stock"},
    {"name": "Tomato Sauce",            "category": "pantry",   "status": "in_stock"},
    {"name": "Macaroni Pasta",          "category": "pantry",   "status": "in_stock"},
    {"name": "Spaghetti",               "category": "pantry",   "status": "in_stock"},
    {"name": "Penne Pasta",             "category": "pantry",   "status": "in_stock"},
    {"name": "Rice (Long Grain)",       "category": "pantry",   "status": "in_stock"},
    {"name": "Caster Sugar",            "category": "pantry",   "status": "out"},
    {"name": "Plain Flour",             "category": "pantry",   "status": "in_stock"},
    {"name": "Salt",                    "category": "pantry",   "status": "in_stock"},
    {"name": "Black Pepper",            "category": "pantry",   "status": "in_stock"},
    {"name": "Mixed Herbs",             "category": "pantry",   "status": "in_stock"},
    {"name": "Paprika",                 "category": "pantry",   "status": "in_stock"},
    {"name": "Mayonnaise",              "category": "pantry",   "status": "in_stock"},
    {"name": "Ketchup",                 "category": "pantry",   "status": "in_stock"},
    # Frozen
    {"name": "Frozen Chips",            "category": "frozen",   "status": "in_stock"},
    {"name": "Frozen Sweet Potato Fries","category": "frozen",  "status": "in_stock"},
    {"name": "Ice Cream Mix (Vanilla)", "category": "frozen",   "status": "out"},
    {"name": "Ice Cream Mix (Chocolate)","category": "frozen",  "status": "low"},
    # Beverages
    {"name": "Coca Cola (330ml)",       "category": "beverages","status": "in_stock"},
    {"name": "Coca Cola Zero (330ml)",  "category": "beverages","status": "in_stock"},
    {"name": "Lemonade (330ml)",        "category": "beverages","status": "in_stock"},
    {"name": "Apple Juice (1L)",        "category": "beverages","status": "in_stock"},
    {"name": "Coffee Beans",            "category": "beverages","status": "in_stock"},
    {"name": "Mint Tea Bags",           "category": "beverages","status": "in_stock"},
    {"name": "Black Tea Bags",          "category": "beverages","status": "in_stock"},
    {"name": "Green Tea Bags",          "category": "beverages","status": "in_stock"},
    {"name": "Whole Milk (for coffee)", "category": "beverages","status": "in_stock"},
]


def get_supply_chain() -> SupplyChainResult:
    """
    Return BidFood Direct supplier and ingredient inventory.
    DATA SOURCE: mock data (BidFood Direct catalogue — to be scraped)
    """
    supplier = Supplier(**_BIDFOOD_SUPPLIER)
    inventory = [InventoryItem(**i) for i in _INVENTORY]
    return SupplyChainResult(suppliers=[supplier], inventory=inventory)
