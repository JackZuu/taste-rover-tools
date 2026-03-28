"""
Supply chain module — BidFood Direct wholesale supplier + real scraped inventory.

Loads the scraped BidFood Direct catalogue from bidfood-products.json and
provides searchable inventory with category mapping to our taxonomy.

DATA SOURCE: Scraped BidFood Direct catalogue (bidfood-products.json)
"""
import json
from pathlib import Path
from app.models import Supplier, InventoryItem, SupplyChainResult

# ─── Load scraped data ────────────────────────────────────────────────────────

_DATA_PATH = Path(__file__).parent.parent.parent.parent / "bidfood_comps" / "bidfood-products.json"
_IMAGES_DIR = Path(__file__).parent.parent.parent.parent / "bidfood_comps" / "images"

_PRODUCTS: list[dict] = []
_PRODUCTS_BY_CATEGORY: dict[str, list[dict]] = {}
_PRODUCT_INDEX: dict[str, dict] = {}  # productCode → product

# Map BidFood categories to our taxonomy ingredient categories
_CATEGORY_MAP: dict[str, str] = {
    "Meat & Poultry":                "meat",
    "Fish & Seafood":                "seafood",
    "Dairy":                         "dairy",
    "Bakery":                        "bread",
    "Desserts":                      "frozen",
    "Everyday Essentials":           "produce",
    "Meal Solutions":                "pantry",
    "Drinks, Snacks & Confectionery":"beverages",
    "Catering Supplies":             "packaging",
    "Produce & Accompaniments":      "produce",
    "Alcohol":                       "beverages",
    "Delicatessen":                  "pantry",
}

def _load_catalogue():
    """Load the scraped BidFood catalogue once at startup."""
    global _PRODUCTS, _PRODUCTS_BY_CATEGORY, _PRODUCT_INDEX
    if _PRODUCTS:
        return
    if not _DATA_PATH.exists():
        return

    try:
        raw = json.loads(_DATA_PATH.read_text(encoding="utf-8"))
        for cat_obj in raw.get("categories", []):
            bidfood_cat = cat_obj.get("name", "")
            taxonomy_cat = _CATEGORY_MAP.get(bidfood_cat, "pantry")
            for p in cat_obj.get("products", []):
                product = {
                    "name":         p.get("name", ""),
                    "brand":        p.get("brand", ""),
                    "category":     taxonomy_cat,
                    "bidfood_category": bidfood_cat,
                    "storage_type": p.get("storageType", ""),
                    "product_code": p.get("productCode", ""),
                    "image_file":   p.get("imageFile", ""),
                    "detail_url":   p.get("detailUrl", ""),
                    "status":       "in_stock",  # all scraped items assumed available
                }
                _PRODUCTS.append(product)
                _PRODUCT_INDEX[product["product_code"]] = product
                if taxonomy_cat not in _PRODUCTS_BY_CATEGORY:
                    _PRODUCTS_BY_CATEGORY[taxonomy_cat] = []
                _PRODUCTS_BY_CATEGORY[taxonomy_cat].append(product)
    except Exception:
        pass

_load_catalogue()


# ─── BidFood Direct — single supplier ────────────────────────────────────────

_BIDFOOD_SUPPLIER = Supplier(
    name="Bidfood Direct",
    distance_miles=8.5,
    lead_time_hours=24,
    categories=list(_PRODUCTS_BY_CATEGORY.keys()) if _PRODUCTS_BY_CATEGORY else [
        "produce", "meat", "seafood", "dairy", "bread", "pantry", "frozen", "beverages", "packaging"
    ],
    reliability_pct=92,
)


# ─── Public API ──────────────────────────────────────────────────────────────

def get_supply_chain() -> SupplyChainResult:
    """Return supplier info + inventory summary (top items per category)."""
    inventory: list[InventoryItem] = []
    for cat, products in _PRODUCTS_BY_CATEGORY.items():
        # Show up to 8 items per category as inventory sample
        for p in products[:8]:
            inventory.append(InventoryItem(
                name=p["name"],
                category=cat,
                status="in_stock",
            ))
    return SupplyChainResult(
        suppliers=[_BIDFOOD_SUPPLIER],
        inventory=inventory,
    )


def get_full_catalogue() -> dict:
    """Return the full catalogue grouped by taxonomy category, with product counts."""
    result = {}
    for cat, products in _PRODUCTS_BY_CATEGORY.items():
        result[cat] = {
            "count": len(products),
            "products": [
                {
                    "name": p["name"],
                    "brand": p["brand"],
                    "product_code": p["product_code"],
                    "image_file": p["image_file"],
                    "storage_type": p["storage_type"],
                }
                for p in products
            ],
        }
    return result


def search_products(query: str, limit: int = 20) -> list[dict]:
    """Search products by name (case-insensitive substring match)."""
    query_lower = query.lower()
    results = []
    for p in _PRODUCTS:
        if query_lower in p["name"].lower():
            results.append(p)
            if len(results) >= limit:
                break
    return results


def get_product_count() -> int:
    """Return total number of products loaded."""
    return len(_PRODUCTS)


def get_images_dir() -> Path:
    """Return path to the images directory for static serving."""
    return _IMAGES_DIR


def match_ingredient(ingredient_name: str) -> list[dict]:
    """
    Find BidFood products that match an ingredient name.
    Uses word-boundary matching to avoid false positives
    (e.g. "Tea" shouldn't match "Tealights", "Bread" shouldn't match "Shortbread").
    Returns matching products (up to 10).
    """
    import re
    ing_lower = ingredient_name.lower().strip()
    terms = [t for t in ing_lower.split() if len(t) > 1]
    if not terms:
        return []

    # Build word-boundary regex for each term
    # Use full word boundary (\b...\b) to avoid partial matches
    patterns = []
    for t in terms:
        patterns.append(re.compile(r'\b' + re.escape(t) + r'\b', re.IGNORECASE))

    # Exclude non-food categories from matching
    exclude_cats = {"packaging"}

    matches: list[tuple[int, dict]] = []
    for p in _PRODUCTS:
        if p["category"] in exclude_cats:
            continue
        name = p["name"]
        # All terms must match as word boundaries
        if all(pat.search(name) for pat in patterns):
            # Score: prefer shorter product names (more specific matches)
            score = len(name)
            matches.append((score, p))

    # Sort by name length (shorter = more relevant)
    matches.sort(key=lambda x: x[0])
    return [m[1] for m in matches[:10]]
