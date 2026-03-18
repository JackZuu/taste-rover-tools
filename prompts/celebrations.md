# Prompt: Upcoming Celebrations

**Module:** `backend/app/celebrations.py` → `_get_ai_celebrations()`
**Model:** `gpt-4o-mini`
**Response format:** `json_object`
**Max tokens:** 800
**Temperature:** 0.2
**Cache:** Per calendar day (in-memory, reset on server restart)

---

## Prompt template

```
Today is {today_iso}.
List the next 6 upcoming UK public holidays, festivals, or food-relevant cultural events
between now and {cutoff_iso}.
Return a JSON object with key "events" containing an array.
Each element must have: "name" (string), "date" (YYYY-MM-DD),
"food_opportunity" (1 concise sentence describing the food angle for a street food van),
"menu_suggestions" (array of 2-4 objects each with "name" (title case string) and
"category" (one of: main, snack, beverage, dessert, produce)).
Only include events with known fixed UK dates. Return JSON only.
```

**Variables:**
- `{today_iso}` = today's date in ISO format (e.g. `"2026-03-18"`)
- `{cutoff_iso}` = today + 90 days in ISO format

---

## Expected response shape

```json
{
  "events": [
    {
      "name": "St Patrick's Day",
      "date": "2026-03-17",
      "food_opportunity": "Irish-inspired comfort food and stout-flavoured treats work well on the day.",
      "menu_suggestions": [
        { "name": "Irish Stew Pot",   "category": "main" },
        { "name": "Soda Bread Roll",  "category": "snack" },
        { "name": "Stout Hot Chocolate", "category": "beverage" }
      ]
    }
  ]
}
```

---

## Validation

- Each event must have a valid ISO `date` that falls within the 0–90 day window.
- Events outside the window are silently dropped.
- On any exception or empty result, falls back to the hardcoded `_ANNUAL_EVENTS` list.
- Maximum 6 events returned.
