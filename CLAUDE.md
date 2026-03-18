# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SmarTR Food** (by Taste Rover) — a food-truck operations tool. Given a UK postcode/region and date it runs a 12-step pipeline: equipment → supply → trends → historic → seasonal → celebrations → regional demand → weather → meal decision → nutrition → menu proposal. Results are shown progressively in the **Meal Flow** UI.

The app is branded "SmarTR Food" in the UI and deployed on Railway.app.

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

**Single-container deployment**: Dockerfile builds backend (Python/FastAPI) and frontend (React/Vite) into one image. Vite outputs to `backend/static/`, FastAPI serves those static files with a catch-all SPA route. Port 8000 serves everything.

**Dev proxy**: Vite dev server (`vite.config.ts`) proxies `/api/*` to `http://localhost:8000`.

### Backend modules

Each module is independently callable as a plain Python function and exposed via its own API endpoint.

| File | Key function(s) | API endpoint | Data source |
|------|-----------------|-------------|-------------|
| `core.py` | `run_task(postcode)`, `get_weather_for_day(postcode, date)` | `POST /api/weather` | **Live** — OpenWeatherMap + postcodes.io |
| `nutrition.py` | `calculate_nutrition(ingredients_list)` | `POST /api/nutrition` | **Live** — OpenAI gpt-4o-mini |
| `trends.py` | `get_trends()`, `get_custom_trends(keywords)` | `GET /api/trends`, `POST /api/trends/custom` | **Live** — pytrends (Google Trends), hardcoded fallback |
| `seasonal.py` | `get_seasonal(month)` | `GET /api/seasonal?month=N` | **Live** — OpenAI gpt-4o-mini, hardcoded fallback |
| `celebrations.py` | `get_celebrations()`, `get_celebrations_for_month(month)` | `GET /api/celebrations?month=N` | **Live** — OpenAI gpt-4o-mini, hardcoded fallback |
| `regional.py` | `get_regional_demand(region)` | `POST /api/regional` | **Live** — OpenAI gpt-4o-mini, hardcoded fallback |
| `decision.py` | `get_decision_and_options(WeatherResult)` | `POST /api/decision` | Hardcoded rules |
| `menu_generator.py` | `generate_menu(weather, primary_meal, region, …)` | `POST /api/menu` | Hardcoded algorithm |
| `supply.py` | `get_supply_chain()`, `get_ingredient_supply(meal)` | `GET /api/supply/chain`, `POST /api/supply` | **Mock** |
| `equipment.py` | `list_vans()`, `get_van_equipment(van_id)`, `get_equipment(meal)` | `GET /api/vans`, `POST /api/equipment/van`, `POST /api/equipment` | **Mock** |
| `historic.py` | `get_historic()` | `GET /api/historic` | **Mock** |
| `mcdonalds.py` | `get_mcdonalds_menu()` | `GET /api/mcdonalds/menu` | Bundled Excel file |
| `burgerking.py` | `get_burgerking_menu()` | `GET /api/burgerking/menu` | Bundled data |
| `greggs.py` | `get_greggs_menu()` | `GET /api/greggs/menu` | Bundled data |
| `flow.py` | `run_flow(postcode, date, van_id, region)` | `POST /api/flow` | Aggregates all modules |

**`models.py`** holds all shared dataclasses: `WeatherResult`, `DecisionAndOptionsResult`, `MenuProposal`, `VanEquipmentResult`, `SupplyChainResult`, `TrendsResult`, `TrendItem`, `SeasonalResult`, `SeasonalItem`, `CelebrationsResult`, `CelebrationEvent`, `RegionalResult`, `RegionalInsight`, `FoodSuggestion`, etc.

All result objects include a `source` field (`"openai"` / `"google_trends"` / `"hardcoded"` / `"mock"`) shown as a badge in the UI.

### Data taxonomy

Two category systems are in use — keep them consistent:

- **Ingredient categories** (used in seasonal, supply): `produce`, `protein`, `seafood`, `game`, `herb`, `dairy`, `dessert`, `beverage`, `grain`
- **Menu item categories** (used in celebrations, regional, trends): `main`, `snack`, `beverage`, `dessert`, `produce`
- **Insight categories** (used in regional): `demand`, `preference`, `trend`

See `taxonomy/categories.md` and `prompts/` for full prompt templates.

### Flow pipeline

The **Meal Flow** UI (`frontend/src/FlowScreen.tsx`) runs 12 steps via individual fetch calls for progressive display:

- **Steps 1–7 (parallel)**: equipment → supply → trends → historic → seasonal → celebrations → regional
- **Steps 8–12 (sequential)**: weather → meal decision (client-side) → nutrition → menu proposal

Each step card shows an animated loading bar while working and taxonomy food-item pills (coloured by category) as the primary output for steps 3, 5, 6, 7.

`FlowRequest` for the server-side `/api/flow` endpoint: `postcode`, `date` (YYYY-MM-DD), `van_id` (default `"van_alpha"`), `region` (default `"London"`).

### Frontend screens

All screens are in `frontend/src/App.tsx` (screen routing) + `frontend/src/FlowScreen.tsx` + `frontend/src/ModuleScreens.tsx`.

| Screen key | Component | Notes |
|-----------|-----------|-------|
| `flow` | `FlowScreen` | Always mounted (CSS `display:none` when other screens active) for state persistence |
| `weather` | inline in App.tsx | Postcode or UK region input (12-region grid), OpenWeatherMap |
| `nutrition` | inline in App.tsx | OpenAI gpt-4o-mini |
| `mcdonalds` / `burgerking` / `greggs` | inline in App.tsx | Competitor menu browsers |
| `trends` | `TrendsScreen` | Category columns + custom search columns (localStorage, X to remove) |
| `historic` | `HistoricScreen` | 30-day mock data |
| `seasonal` | `SeasonalScreen` | Month dropdown, OpenAI |
| `celebrations` | `CelebrationsScreen` | Month dropdown or next-90-days, OpenAI |
| `regional` | `RegionalScreen` | 12-region grid, OpenAI |
| `equipment` | `EquipmentScreen` | Van selector, mock data |
| `supply` | `SupplyScreen` | Mock data |

**Styling**: all inline styles, brand palette `#1a5f3f` / `#2d8659` / `#f5f1e8`, Georgia serif, CSS `clamp()` for responsive sizing. `openModBtn` constant in FlowScreen for consistent green "Open module →" buttons.

**Environment variables** (set in `backend/.env` or container env):
- `OPENAI_API_KEY` — required for nutrition, seasonal, celebrations, regional
- `OPENWEATHER_API_KEY` — required for weather (fallback default key in code)

## Known mock data (priority to replace)

| Module | Status | Next step |
|--------|--------|-----------|
| Supply chain | Mock | Replace with Bidfood wholesale scrape |
| Equipment / vans | Mock | Real van register |
| Historic sales | Mock (30-day fake data) | Connect real POS/CSV exports |

## Deployment

Deployed via Railway.app using `railway.json` (Dockerfile builder). Port 8000 serves everything. No CI/CD configured — push to `main` triggers Railway redeploy.
