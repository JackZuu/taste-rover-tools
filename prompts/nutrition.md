# Prompt: Nutrition Calculator

**Module:** `backend/app/nutrition.py` → `calculate_nutrition()`
**Model:** `gpt-4o-mini`
**Response format:** raw JSON (plain text, no `json_object` mode)
**Cache:** None (called per request)

---

## Prompt template

```
You are a nutrition calculator. Analyze these ingredients and return ONLY a valid JSON
object (no markdown, no explanations, no code blocks).

For each ingredient line, estimate calories for THAT item.
Assume common nutrition averages.
If an amount is unclear, make a reasonable assumption and state it.

Return ONLY this exact JSON structure (nothing before or after):
{
  "items": [
    {
      "ingredient": "ingredient name",
      "assumed_amount": "what you assumed",
      "calories_kcal": number,
      "notes": "any notes"
    }
  ],
  "total_calories_kcal": number
}

Ingredient lines:
{ingredients_json}

Remember: Return ONLY the JSON object, no other text.
```

**Variable:** `{ingredients_json}` = JSON array of ingredient strings passed by the caller

---

## Expected response shape

```json
{
  "items": [
    {
      "ingredient": "smash burger patty 150g",
      "assumed_amount": "150g beef patty",
      "calories_kcal": 390,
      "notes": "80/20 ground beef"
    }
  ],
  "total_calories_kcal": 390
}
```

---

## Usage in the pipeline

The Flow UI (step 11) calls this with a default burger ingredient list to show a nutrition sample card. Users can also call it directly from the Nutrition tool on the home screen.
