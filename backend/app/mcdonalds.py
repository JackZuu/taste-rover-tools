import pandas as pd
import os
import math

# Load the McDonald's data
MCDONALDS_FILE = os.path.join(os.path.dirname(__file__), "mcdonalds_products_structured__1_.xlsx")


def safe_float(value):
    """Convert value to float, returning 0 if NaN or invalid."""
    try:
        if pd.isna(value) or value is None or math.isnan(float(value)):
            return 0
        return float(value)
    except (ValueError, TypeError):
        return 0


def safe_string(value):
    """Convert value to string, returning empty string if NaN or None."""
    if pd.isna(value) or value is None:
        return ""
    return str(value)


def get_mcdonalds_menu():
    """
    Load and return McDonald's menu data.
    """
    try:
        df = pd.read_excel(MCDONALDS_FILE)
        
        # Convert to list of dictionaries
        products = []
        for _, row in df.iterrows():
            product = {
                "name": safe_string(row.get("Product Name", "")),
                "description": safe_string(row.get("Description", "")),
                "price": safe_string(row.get("Price", "")),
                "image_url": safe_string(row.get("Image URL", "")),
                "nutrition": {
                    "energy_kj": safe_float(row.get("Energy (kJ)", 0)),
                    "energy_kcal": safe_float(row.get("Energy (kcal)", 0)),
                    "fat": safe_float(row.get("Fat (g)", 0)),
                    "saturates": safe_float(row.get("Saturates (g)", 0)),
                    "carbohydrates": safe_float(row.get("Carbohydrates (g)", 0)),
                    "sugars": safe_float(row.get("Sugars (g)", 0)),
                    "fibre": safe_float(row.get("Fibre (g)", 0)),
                    "protein": safe_float(row.get("Protein (g)", 0)),
                    "salt": safe_float(row.get("Salt (g)", 0)),
                },
                "ingredients": safe_string(row.get("Main Ingredients", "")),
                "allergens": safe_string(row.get("Allergen Info", ""))
            }
            products.append(product)
        
        return {"products": products, "total": len(products)}
    
    except Exception as e:
        print(f"Error loading McDonald's data: {e}")
        return {
            "error": f"Failed to load menu data: {str(e)}",
            "products": [],
            "total": 0
        }
