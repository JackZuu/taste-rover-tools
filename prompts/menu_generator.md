# Prompt: Menu Generator

**Module:** `backend/app/menu_generator.py` → `generate_menu()`
**Model:** N/A — this module uses **hardcoded logic only** (no AI call)
**Cache:** None

---

## Overview

The menu generator is currently rule-based (no LLM). It assembles a `MenuProposal`
from hardcoded item pools using the following logic:

1. **Weather signal** — `avg_temp > 15°C and not rainy` → "warm menu"; otherwise "cold menu"
2. **Trend injections** — if any `active_trends` match keys in `_TREND_INJECTIONS`, that item is added to the relevant section
3. **Seasonal injections** — up to 2 seasonal items are appended as grill specials with `(seasonal)` label
4. **Celebration injection** — if `upcoming_celebration` matches a key in `_CELEBRATION_DESSERTS`, that dessert is added
5. **Regional adjustment** — some regions skew toward specific items (e.g. Scotland → Haggis Wrap)

---

## Input parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `weather` | `WeatherResult` | avg_temp, is_rainy, condition |
| `primary_meal` | `str` | Top recommended meal from the decision engine |
| `region` | `str` | UK region name (e.g. "London") |
| `active_trends` | `list[str]` | Trending item labels from the Trends module |
| `seasonal_items` | `list[str]` | In-season ingredient names from the Seasonal module |
| `upcoming_celebration` | `str \| None` | Nearest celebration name, if any |

---

## Output shape (MenuProposal)

```json
{
  "grill":        ["Smash Burger", "Grilled Chicken", "BBQ Pulled Pork Bun"],
  "snacks":       ["Nachos", "Chicken Strips"],
  "cold_drinks":  ["Lemonade", "Iced Coffee"],
  "sides":        ["Sweet Potato Fries", "Coleslaw"],
  "desserts":     ["Churros"],
  "hot_drinks":   ["Flat White", "Chai Latte"],
  "pct_veggie":   25,
  "pct_vegan":    10,
  "pct_gluten_free": 15,
  "influences":   ["Smash Burger trend", "Asparagus (seasonal)"]
}
```

---

## Future: AI-powered menu generation

A future version could replace or augment the rule-based logic with an LLM prompt along
the lines of:

```
Given: weather {condition}, temp {avg_temp}°C, region {region},
top trending items: {trends}, in-season ingredients: {seasonal},
upcoming celebration: {celebration}.

Build a street food van menu with sections: grill, snacks, cold drinks, sides, desserts,
hot drinks. Aim for {pct_veggie}% veggie options. Explain each inclusion briefly.
Return JSON matching the MenuProposal schema.
```
