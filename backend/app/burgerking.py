import json
import os
import re

BK_FILE = os.path.join(os.path.dirname(__file__), "burger-king.json")


def parse_number(value) -> float:
    """Parse a numeric string, stripping units, commas, and whitespace."""
    if not value:
        return 0.0
    try:
        cleaned = re.sub(r"[^\d.]", "", str(value).replace(",", ""))
        return float(cleaned) if cleaned else 0.0
    except (ValueError, TypeError):
        return 0.0


def get_burgerking_menu():
    try:
        with open(BK_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)

        products = []
        for item in data.get("items", []):
            nutrition_components = item.get("nutrition", [])

            total_kcal = sum(parse_number(n.get("energy_kcal", 0)) for n in nutrition_components)
            total_kj   = sum(parse_number(n.get("energy_kj", 0)) for n in nutrition_components)
            total_fat  = sum(parse_number(n.get("fat_g", 0)) for n in nutrition_components)
            total_sat  = sum(parse_number(n.get("saturates_g", 0)) for n in nutrition_components)
            total_carb = sum(parse_number(n.get("carbohydrates_g", 0)) for n in nutrition_components)
            total_sug  = sum(parse_number(n.get("sugars_g", 0)) for n in nutrition_components)
            total_prot = sum(parse_number(n.get("protein_g", 0)) for n in nutrition_components)
            total_salt = sum(parse_number(n.get("salt_g", 0)) for n in nutrition_components)

            allergens_contains: set = set()
            allergens_may_contain: set = set()
            for n in nutrition_components:
                allergens_contains.update(n.get("allergens_contains", []))
                allergens_may_contain.update(n.get("allergens_may_contain", []))

            allergens_parts = []
            if allergens_contains:
                allergens_parts.append("Contains: " + ", ".join(sorted(allergens_contains)))
            if allergens_may_contain:
                allergens_parts.append("May contain: " + ", ".join(sorted(allergens_may_contain)))
            allergens_str = ". ".join(allergens_parts)

            products.append({
                "name": item.get("name", ""),
                "category": item.get("category", ""),
                "description": item.get("description", ""),
                "price": item.get("price", ""),
                "image_url": item.get("imageUrl", ""),
                "meal_components": item.get("mealComponents", []),
                "nutrition": {
                    "energy_kj":      round(total_kj, 1),
                    "energy_kcal":    round(total_kcal, 1),
                    "fat":            round(total_fat, 1),
                    "saturates":      round(total_sat, 1),
                    "carbohydrates":  round(total_carb, 1),
                    "sugars":         round(total_sug, 1),
                    "fibre":          0,
                    "protein":        round(total_prot, 1),
                    "salt":           round(total_salt, 1),
                },
                "allergens": allergens_str,
                "ingredients": "",
            })

        return {"products": products, "total": len(products)}

    except Exception as e:
        print(f"Error loading Burger King data: {e}")
        return {"error": f"Failed to load menu data: {str(e)}", "products": [], "total": 0}
