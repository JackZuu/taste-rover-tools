# SmarTR Food — Data Taxonomy

This file defines the canonical category labels used across all modules.
All AI prompts and hardcoded fallbacks must use these values to ensure
consistency in filtering, display, and downstream logic.

---

## Ingredient / Food Item Categories

Used by: **Seasonal** module (`SeasonalItem.category`)

| Value | Description | Examples |
|-------|-------------|---------|
| `produce` | Fruit, vegetables, fungi | Asparagus, Strawberries, Wild Mushrooms |
| `protein` | Meat and poultry (farmed) | Lamb, Turkey, Chicken |
| `seafood` | Fish and shellfish | Mackerel, Crab, Sea Trout |
| `game` | Wild/hunted meat | Venison, Pheasant, Grouse |
| `herb` | Herbs and edible flowers | Wild Garlic, Elderflower, Sorrel |
| `dairy` | Milk products | Stilton, Clotted Cream |
| `dessert` | Sweet items primarily used in desserts | Forced Rhubarb (dessert use), Chestnuts |
| `beverage` | Drinks and drink ingredients | Elderflower (drink use), Sloe Berries |
| `grain` | Grains, pulses, legumes | Oats, Lentils |

---

## Trend Categories

Used by: **Trends** module (`TrendItem.category`)

| Value | Description | Examples |
|-------|-------------|---------|
| `main` | Primary grill/hot items | Smash Burger, Loaded Fries, Chicken Wings |
| `snack` | Snack and side items | Falafel Wrap, Churros, Spring Rolls |
| `beverage` | Drinks | Bubble Tea, Matcha Latte, Hot Chocolate |
| `cuisine` | Cuisine styles and street food trends | Korean Street Food, Mexican Street Food |
| `custom` | User-defined keywords (custom search) | Any free-text query |

---

## Regional Insight Categories

Used by: **Regional** module (`RegionalInsight.category`)

| Value | Description |
|-------|-------------|
| `demand` | Observed demand signals for a region |
| `preference` | Consumer taste preferences |
| `trend` | Emerging trends specific to this region |

---

## Inventory Status

Used by: **Supply Chain** module (`InventoryItem.status`)

| Value | Description |
|-------|-------------|
| `in_stock` | Sufficient quantity available |
| `low` | Below reorder threshold |
| `out` | Zero stock |

---

## Data Source Labels

Used by: all modules with a `source` field

| Value | Display label (UI) | Description |
|-------|-------------------|-------------|
| `openai` | Live · OpenAI | Result came from a live gpt-4o-mini call |
| `google_trends` | Live · Google Trends | Result came from a live pytrends query |
| `hardcoded` | Mock data | Fell back to hardcoded/static data |
| `mock` | Mock data | Explicitly mocked data (historic sales) |
| `unavailable` | Unavailable | API was unreachable and no cache exists |
