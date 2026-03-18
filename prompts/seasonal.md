# Prompt: Seasonal Foods

**Module:** `backend/app/seasonal.py` → `_get_ai_seasonal()`
**Model:** `gpt-4o-mini`
**Response format:** `json_object`
**Max tokens:** 600
**Temperature:** 0.2
**Cache:** Per calendar month (in-memory, reset on server restart)

---

## Prompt template

```
Month: {month_name}.
List 8 to 12 UK-grown or UK-available seasonal foods and ingredients that are at
their best in {month_name}.
Focus on ingredients a street food van could realistically use or highlight.
Return a JSON object with:
"month" (string, the month name),
"items" (array of objects each with "name" (title case string) and
"category" (one of: produce, protein, seafood, game, herb, dairy, dessert, beverage, grain)).
Return JSON only.
```

**Variable:** `{month_name}` = full English month name (e.g. `"March"`)

---

## Expected response shape

```json
{
  "month": "March",
  "items": [
    { "name": "Purple Sprouting Broccoli", "category": "produce" },
    { "name": "Forced Rhubarb",            "category": "produce" },
    { "name": "Sea Trout",                 "category": "seafood" },
    ...
  ]
}
```

---

## Validation

- `items` must be a non-empty list.
- Each item's `category` is checked against the valid taxonomy set; invalid values default to `"produce"`.
- On any exception or empty result, falls back to the hardcoded `_SEASONAL` dict in `seasonal.py`.

---

## Valid categories (taxonomy)

`produce` · `protein` · `seafood` · `game` · `herb` · `dairy` · `dessert` · `beverage` · `grain`

See [../taxonomy/categories.md](../taxonomy/categories.md) for full taxonomy.
