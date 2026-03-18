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
"food_opportunity" (1 sentence describing the food angle).
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
      "food_opportunity": "Irish stew, soda bread, and Guinness-inspired bakes are crowd-pleasers."
    },
    ...
  ]
}
```

---

## Validation

- Each event must have a valid ISO `date` that falls within the 0–90 day window.
- Events outside the window are silently dropped.
- On any exception or empty result, falls back to the hardcoded `_ANNUAL_EVENTS` list.
- Maximum 6 events returned.
