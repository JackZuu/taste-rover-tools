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

| File | Key function(s) | API endpoint |
|------|-----------------|-------------|
| `core.py` | `run_task(postcode)`, `get_weather_for_day(postcode, date)` | `POST /api/weather` |
| `nutrition.py` | `calculate_nutrition(ingredients_list)` | `POST /api/nutrition` |
| `mcdonalds.py` | `get_mcdonalds_menu()` | `GET /api/mcdonalds/menu` |
| `decision.py` | `get_decision_and_options(WeatherResult)` | `POST /api/decision` |
| `menu_generator.py` | `generate_menu(weather, primary_meal, region, …)` | `POST /api/menu` |
| `supply.py` | `get_supply_chain()`, `get_ingredient_supply(meal)` | `GET /api/supply/chain`, `POST /api/supply` |
| `equipment.py` | `list_vans()`, `get_van_equipment(van_id)`, `get_equipment(meal)` | `GET /api/vans`, `POST /api/equipment/van`, `POST /api/equipment` |
| `trends.py` | `get_trends()` | `GET /api/trends` |
| `historic.py` | `get_historic()` | `GET /api/historic` |
| `seasonal.py` | `get_seasonal()` | `GET /api/seasonal` |
| `celebrations.py` | `get_celebrations()` | `GET /api/celebrations` |
| `regional.py` | `get_regional_demand(region)` | `POST /api/regional` |
| `flow.py` | `run_flow(postcode, date, van_id, region)` | `POST /api/flow` |

**`models.py`** holds all shared dataclasses (`WeatherResult`, `DecisionAndOptionsResult`, `MenuProposal`, `VanEquipmentResult`, `SupplyChainResult`, `TrendsResult`, `SeasonalResult`, `CelebrationsResult`, `RegionalResult`, etc.) that are the typed interfaces between modules.

Most data modules (`trends`, `historic`, `seasonal`, `celebrations`, `equipment`, `supply`, `regional`) return hardcoded/mock data. Only `core.py` (weather) and `nutrition.py` (OpenAI) make live API calls.

### Flow pipeline

`POST /api/flow` (`flow.py`) runs an 11-step pipeline server-side:
1–7. Independent (parallel-capable): equipment → supply → trends → historic → seasonal → celebrations → regional
8–11. Sequential: weather → decision+options → nutrition → menu proposal

`FlowRequest` requires `postcode`, `date` (YYYY-MM-DD), and optionally `van_id` (default `"van_alpha"`) and `region` (default `"London"`).

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
