import json
from openai import OpenAI
import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")


def calculate_nutrition(ingredients_list: list[str]) -> dict:
    """
    Calculate nutrition information for a list of ingredients using OpenAI API.
    Returns a dict with items breakdown and total calories.
    """
    if not OPENAI_API_KEY:
        return {
            "error": "OpenAI API key not configured. Please set OPENAI_API_KEY environment variable."
        }
    
    if not ingredients_list or len(ingredients_list) == 0:
        return {
            "error": "Please provide at least one ingredient."
        }
    
    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        prompt = f"""
You are a nutrition calculator. Analyze these ingredients and return ONLY a valid JSON object (no markdown, no explanations, no code blocks).

For each ingredient line, estimate calories for THAT item.
Assume common nutrition averages.
If an amount is unclear, make a reasonable assumption and state it.

Return ONLY this exact JSON structure (nothing before or after):
{{
  "items": [
    {{
      "ingredient": "ingredient name",
      "assumed_amount": "what you assumed",
      "calories_kcal": number,
      "notes": "any notes"
    }}
  ],
  "total_calories_kcal": number
}}

Ingredient lines:
{json.dumps(ingredients_list, indent=2)}

Remember: Return ONLY the JSON object, no other text.
"""
        
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        
        response_text = resp.choices[0].message.content
        
        # Try to extract JSON from markdown code blocks if present
        if "```json" in response_text:
            # Extract content between ```json and ```
            start = response_text.find("```json") + 7
            end = response_text.find("```", start)
            response_text = response_text[start:end].strip()
        elif "```" in response_text:
            # Extract content between ``` and ```
            start = response_text.find("```") + 3
            end = response_text.find("```", start)
            response_text = response_text[start:end].strip()
        
        # Clean up any non-JSON text before or after
        response_text = response_text.strip()
        
        # Find first { and last }
        first_brace = response_text.find("{")
        last_brace = response_text.rfind("}")
        
        if first_brace != -1 and last_brace != -1:
            response_text = response_text[first_brace:last_brace + 1]
        
        try:
            data = json.loads(response_text)
        except json.JSONDecodeError as e:
            print(f"JSON parse error: {e}")
            print(f"Response text: {response_text}")
            return {
                "error": f"Failed to parse nutrition data. The AI returned invalid JSON format. Please try again or simplify your ingredients list."
            }
        return data
        
    except json.JSONDecodeError as e:
        return {
            "error": f"Failed to parse nutrition data: {str(e)}"
        }
    except Exception as e:
        return {
            "error": f"Error calculating nutrition: {str(e)}"
        }
