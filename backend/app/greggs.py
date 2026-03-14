import json
import os
import re

GREGGS_FILE = os.path.join(os.path.dirname(__file__), "greggs.json")

NUTRITION_MAP = {
    "energy kj":         "energy_kj",
    "energy kcal":       "energy_kcal",
    "fat":               "fat",
    "of which saturates": "saturates",
    "carbohydrate":      "carbohydrates",
    "of which sugars":   "sugars",
    "fibre":             "fibre",
    "protein":           "protein",
    "salt":              "salt",
}


def parse_number(value) -> float:
    """Strip units/commas and return float."""
    if not value:
        return 0.0
    try:
        cleaned = re.sub(r"[^\d.]", "", str(value).replace(",", ""))
        return float(cleaned) if cleaned else 0.0
    except (ValueError, TypeError):
        return 0.0


def get_greggs_menu():
    try:
        with open(GREGGS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)

        products = []
        for item in data.get("items", []):
            nutrition: dict = {
                "energy_kj": 0.0, "energy_kcal": 0.0, "fat": 0.0,
                "saturates": 0.0, "carbohydrates": 0.0, "sugars": 0.0,
                "fibre": 0.0, "protein": 0.0, "salt": 0.0,
            }
            for row in item.get("nutrition", []):
                key = NUTRITION_MAP.get(row.get("name", "").lower().strip())
                if key:
                    nutrition[key] = parse_number(row.get("perPortion", "0"))

            products.append({
                "name":        item.get("name", ""),
                "category":    item.get("category", ""),
                "description": item.get("description", ""),
                "price":       item.get("price", ""),
                "image_url":   item.get("imageUrl", ""),
                "serving_info": item.get("servingInfo", ""),
                "nutrition":   nutrition,
                "allergens":   item.get("allergens", ""),
                "ingredients": "",
            })

        return {"products": products, "total": len(products)}

    except Exception as e:
        print(f"Error loading Greggs data: {e}")
        return {"error": f"Failed to load menu data: {str(e)}", "products": [], "total": 0}
