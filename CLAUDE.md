# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Taste Rover Tools is a full-stack web application with two tools:
- **Weather Predictor**: UK postcode weather forecasting (OpenWeatherMap + postcodes.io)
- **Nutrition Calculator**: AI-powered calorie estimation (OpenAI gpt-4o-mini)
- **McDonald's Menu**: Browsable nutrition data from a bundled Excel file

## Development Setup

### Backend (FastAPI)
```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # Windows
pip install -r requirements.txt
cp .env.example .env           # Fill in API keys
uvicorn app.main:app --reload --port 8000
```

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev   # Dev server on :5173, proxies /api to :8000
```

### Docker (Production)
```bash
docker build -t taste-rover .
docker run -p 8000:8000 -e OPENAI_API_KEY=sk-... -e OPENWEATHER_API_KEY=... taste-rover
```

## Architecture

**Single-container deployment**: The Dockerfile builds both backend (Python/FastAPI) and frontend (React/Vite) into one image. Vite outputs to `backend/static/`, and FastAPI serves those static files with a catch-all route for SPA routing. Port 8000 serves everything.

**Dev proxy**: Vite dev server (`vite.config.ts`) proxies `/api/*` to `http://localhost:8000`, so frontend and backend can be run separately during development.

### Backend modules

Each module is independently callable as a plain Python function and exposed via its own API endpoint.

| File | Function | API endpoint |
|------|----------|-------------|
| `core.py` | `run_task(postcode)`, `get_weather_for_day(postcode, date)` | `POST /api/weather` |
| `nutrition.py` | `calculate_nutrition(ingredients_list)` | `POST /api/nutrition` |
| `mcdonalds.py` | `get_mcdonalds_menu()` | `GET /api/mcdonalds/menu` |
| `decision.py` | `make_decision(WeatherResult)` | _(logic only, no own endpoint)_ |
| `supply.py` | `get_ingredient_supply(meal)` | `POST /api/supply` |
| `equipment.py` | `get_equipment(meal)` | `POST /api/equipment` |
| `flow.py` | `run_flow(postcode, date)` | `POST /api/flow` |

**`models.py`** holds shared dataclasses (`WeatherResult`, `DecisionResult`, `SupplyResult`, `EquipmentResult`, etc.) that are the typed interfaces between modules.

### Flow pipeline

`POST /api/flow` runs all modules server-side in sequence: weather → decision → nutrition → supply → equipment.

The **Meal Flow** UI screen (`frontend/src/FlowScreen.tsx`) drives the same modules via individual fetch calls to achieve progressive display. Decision logic is duplicated as a pure TypeScript function in `FlowScreen.tsx` (no round-trip needed for a simple rule).

### Frontend

- `frontend/src/App.tsx` — Screens: `home`, `weather`, `nutrition`, `mcdonalds`, `mcdonalds-detail`, `flow`. Single component, all styles inline.
- `frontend/src/FlowScreen.tsx` — Flow UI. Left sidebar: postcode input or 12-region UK selector (hardcoded `region → postcode` map) + day picker (today + 4 days). Right panel: 6 progressive sections (Weather, Recommendation, Nutrition, Ingredient Supply, Equipment, Final Output).

**Environment variables** (set in `backend/.env` or container env):
- `OPENAI_API_KEY` — Required for nutrition calculator
- `OPENWEATHER_API_KEY` — Required for weather (fallback default key in code)

## Branding / Styling

All UI styles are inline in `App.tsx`. Brand palette: deep green `#1a5f3f` / `#2d8659`, cream `#f5f1e8`, Georgia serif font. Sizing uses CSS `clamp()` throughout for mobile-first responsiveness.

## Deployment

Deployed via Railway.app using `railway.json` (Dockerfile builder). Render.com is an alternative (see `DEPLOYMENT.md`). No CI/CD pipelines configured.
