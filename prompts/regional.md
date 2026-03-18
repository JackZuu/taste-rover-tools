# Prompt: Regional Demand Insights

**Module:** `backend/app/regional.py` → `_get_ai_regional()`
**Model:** `gpt-4o-mini`
**Response format:** `json_object`
**Max tokens:** 600
**Temperature:** 0.3
**Cache:** Per region key (in-memory, reset on server restart)

---

## Prompt template

```
UK region: {region}.
Provide 5 to 7 actionable consumer demand insights for a street food van operating in {region}.
Cover: peak trading times, popular food preferences, local specialities that resonate,
emerging food and drink trends, and pricing sensitivity.
Return a JSON object with:
"region" (string),
"insights" (array of objects each with "insight" (concise string, max 15 words) and
"category" (one of: demand, preference, trend)).
Return JSON only.
```

**Variable:** `{region}` = UK region name (e.g. `"London"`, `"Scotland"`, `"North West"`)

---

## Expected response shape

```json
{
  "region": "London",
  "insights": [
    { "insight": "Lunch trade peaks 12–2 pm in business districts", "category": "demand" },
    { "insight": "Strong appetite for plant-based and vegan options", "category": "preference" },
    { "insight": "Matcha and specialty coffee growing rapidly",      "category": "trend" }
  ]
}
```

---

## Validation

- Each insight's `category` is checked against `VALID_INSIGHT_CATS`; invalid values default to `"demand"`.
- On any exception or empty result, falls back to the hardcoded `_REGIONAL_DATA` dict.
- Results are cached per region key for the lifetime of the server process.

---

## Valid categories (taxonomy)

| Value | Description |
|-------|-------------|
| `demand` | Observed demand signals — footfall, peak times, spend levels |
| `preference` | Consumer taste and product preferences |
| `trend` | Emerging or growing food and drink trends in the region |

See [../taxonomy/categories.md](../taxonomy/categories.md) for full taxonomy.
