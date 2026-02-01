# Taste Rover Tools

Two helpful tools for Taste Rover food truck operations:
1. **Weather Predictor** - Check weather forecasts by UK postcode
2. **Nutrition Calculator** - Calculate calories for meal ingredients using AI

## Project Structure

```
local-python-ui/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py         # FastAPI endpoints
│   │   ├── core.py         # Weather logic
│   │   └── nutrition.py    # Nutrition calculation logic
│   └── requirements.txt
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── main.tsx
        └── App.tsx         # Taste Rover branded UI
```

## Features

### Weather Predictor
- Enter any UK postcode
- Get current weather (temperature & conditions)
- See 5-day forecast
- Uses OpenWeatherMap API

### Nutrition Calculator
- Add multiple ingredients with amounts
- AI-powered calorie estimation
- Detailed breakdown per ingredient
- Uses OpenAI API for smart parsing

## Setup

### 1. Environment Variables (Important!)

Create a `.env` file in the `backend` directory:

```bash
# Optional: OpenWeather API (default key included for demo)
OPENWEATHER_API_KEY=your_key_here

# Required for Nutrition Calculator
OPENAI_API_KEY=your_openai_api_key_here
```

**Note:** The nutrition calculator requires an OpenAI API key to work!

### 2. Start the Backend

From the project root:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

You should see:
```
Uvicorn running on http://127.0.0.1:8000
```

Test it: Open http://localhost:8000/api/health

### 3. Start the Frontend (new terminal)

From the project root:

```bash
cd frontend
npm install
npm run dev
```

You'll see:
```
Local: http://localhost:5173/
```

Open http://localhost:5173/ in your browser 🎉

## Usage

### Home Screen
Choose between:
- 🌤️ Weather Predictor
- 🥗 Nutrition Calculator

### Weather Predictor
1. Enter a UK postcode (e.g., "TR19 7AD")
2. Click "Check Weather" or press Enter
3. View current weather and 5-day forecast

### Nutrition Calculator
1. Add your ingredients with amounts (e.g., "2 large eggs", "100g chicken breast")
2. Click "Calculate Nutrition"
3. View total calories and breakdown per ingredient

## API Information

### Weather
- Uses **postcodes.io** for free UK postcode geocoding
- Uses **OpenWeatherMap API** for weather data
- Default API key included for demo

### Nutrition
- Uses **OpenAI API** (GPT-4.1-mini) for intelligent calorie estimation
- Parses natural language ingredient descriptions
- Provides assumptions and notes for transparency

## Customization

### Weather Logic
Edit `backend/app/core.py` to modify weather data processing.

### Nutrition Logic
Edit `backend/app/nutrition.py` to adjust the AI prompt or response format.

### UI Styling
Edit `frontend/src/App.tsx` - all styles are inline for easy customization.

## Branding

The app uses Taste Rover's signature:
- Deep green color scheme (#1a5f3f, #2d8659)
- Cream/beige accents (#f5f1e8)
- Georgia serif font
- Food truck theme

## Troubleshooting

### Nutrition Calculator shows "API key not configured"
Set your OpenAI API key in the `.env` file or as an environment variable:
```bash
export OPENAI_API_KEY="your-key-here"  # Mac/Linux
set OPENAI_API_KEY=your-key-here       # Windows CMD
$env:OPENAI_API_KEY="your-key-here"    # Windows PowerShell
```

### Weather not loading
The default OpenWeather API key may have hit rate limits. Get a free key at https://openweathermap.org/api

## Next Steps

This structure supports:
- Adding more weather metrics (humidity, wind, UV index)
- Saving favorite locations
- Meal planning features
- Integration with ordering/booking systems
- Expanded nutrition info (protein, carbs, fats)
