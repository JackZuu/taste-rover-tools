# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SmarTR by TasteRover** — a food-truck operations tool. Given a UK postcode and date it runs an 11-step pipeline and produces a scored menu proposal. The UI is organised into 3 collapsible module groups (INPUT / SUPPLY / DEMAND) plus a Framework & Config panel and visual Menu Proposal section.

Deployed on Railway.app as a single Docker container.

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
docker run -p 8000:8000 \
  -e OPENAI_API_KEY=sk-... \
  -e OPENWEATHER_API_KEY=... \
  -v /data:/data \
  taste-rover
```

## Architecture

**Single-container deployment**: Dockerfile builds frontend (React/Vite → `backend/static/`) and backend (FastAPI). FastAPI serves static files with catch-all SPA route. Port 8000 serves everything.

**Dev proxy**: `vite.config.ts` proxies `/api/*` to `http://localhost:8000`.

**Database**: SQLite at `DATA_DIR/smartr.db` (default `backend/data/smartr.db`). On Railway, mount a Volume at `/data` or set `DATA_DIR=/data` env var. WAL mode enabled for concurrent reads.

---

## Backend modules

### Core pipeline modules

| File | Key function(s) | API endpoint | Data source |
|------|-----------------|-------------|-------------|
| `core.py` | `get_weather_for_day(postcode, date)` | `POST /api/weather` | OpenWeatherMap + postcodes.io |
| `equipment.py` | `list_vans()`, `get_van_equipment(van_id)` | `GET /api/vans`, `POST /api/equipment/van` | Mock |
| `supply_bidfood.py` | `get_supply_chain_bidfood()` | `GET /api/supply/chain` | Mock (BidFood Direct inventory) |
| `trends.py` | `get_trends()`, `get_custom_trends(keywords)` | `GET /api/trends`, `POST /api/trends/custom` | pytrends (Google Trends) / OpenAI gpt-4o-mini |
| `historic.py` | `get_historic()` | `GET /api/historic` | Mock |
| `seasonal.py` | `get_seasonal(month)` | `GET /api/seasonal?month=N` | OpenAI gpt-4o-mini, hardcoded fallback |
| `celebrations.py` | `get_celebrations()` | `GET /api/celebrations?month=N` | OpenAI gpt-4o-mini (no hardcoded fallback) |
| `regional.py` | `get_regional_demand(region)` | `POST /api/regional` | OpenAI gpt-4o-mini, hardcoded fallback |
| `decision.py` | `get_decision_and_options(WeatherResult)` | `POST /api/decision` | Rules-based |
| `menu_proposal.py` | `generate_proposal()` | `POST /api/menu-proposal` | Scored algorithm (SQLite + framework config) |

### New data/config modules

| File | Purpose |
|------|---------|
| `database.py` | SQLAlchemy ORM. Tables: `MenuItemDB`, `MenuItemEnrichmentDB`, `FrameworkConfigDB`. `init_db()` seeds 47 base menu items + default config on first run. |
| `taxonomy.py` | Single source of truth for all tag/category constants: `MENU_CATEGORIES`, `INGREDIENT_CATEGORIES`, `WEATHER_TAGS`, `DIETARY_TAGS`, `ALLERGEN_TAGS`, `DEMAND_TAGS`, `POSITIONING_TAGS`, `ALL_TAGS`, `CONFIG_DEFAULTS`. |
| `prompts.py` | All OpenAI prompt templates: `menu_item_enrichment_prompt()`, `celebrations_prompt()`, `seasonal_prompt()`, `regional_prompt()`, `menu_trends_prompt()`. |
| `models.py` | All shared dataclasses: `WeatherResult`, `TrendsResult`, `TrendItem`, `MenuItem`, `MenuItemEnrichment`, `FrameworkConfig`, `MenuProposalResult`, etc. |

### Menu & enrichment endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/menu-items` | GET | List all menu items from SQLite |
| `/api/menu-items` | POST | Add a custom menu item |
| `/api/menu-items/{id}` | DELETE | Remove a menu item |
| `/api/menu-items/{id}/enrichment` | GET | Get enrichment data for an item |
| `/api/menu-items/{id}/enrich` | POST | Enrich item via OpenAI (skips if already done) |
| `/api/menu-items/enrich-all` | POST | Enrich all un-enriched items (fire-and-forget) |
| `/api/framework-config` | GET | Get current framework config |
| `/api/framework-config` | PUT | Update framework config |
| `/api/menu-proposal` | POST | Generate scored menu proposal |

---

## Trends architecture (two-tier)

**Trend discovery** (used in Meal Flow pipeline — DEMAND group):
- `GET /api/trends` → `get_trends()` in `trends.py`
- Source: OpenAI gpt-4o-mini (`trending_discovery_prompt`) — discovers what's trending
- Returns `{items: [{name, category, why_trending, estimated_price_gbp}], trend_names: [str], source}`
- Items shown with "+" buttons to add to menu
- 1-hour in-memory cache; hardcoded fallback if OpenAI unavailable

**Menu-item-specific trends** (used in Trends module screen):
- `POST /api/trends/custom` with `{keywords: [...]}` → `get_custom_trends()` in `trends.py`
- Source: OpenAI gpt-4o-mini (primary, via `menu_trends_prompt`), stub fallback
- 24-hour in-memory cache keyed by sorted keyword set

---

## Enrichment and demand signals

**Static enrichment** (stored in SQLite, persists until re-enriched):
- Ingredients, nutrition, weather fit tags, dietary tags, allergen tags, positioning tags
- Enrichment runs once per item via OpenAI; "Re-enrich All" button wipes and re-runs

**Dynamic demand signals** (computed live, not stored):
- Trending: item name matched against live trend discovery names
- Seasonal: item ingredients matched against live seasonal items
- Celebration: item name matched against celebration menu suggestions
- Regional: item name matched against regional menu suggestions
- All matching done case-insensitive in `score_item()` at scoring time

---

## Weather meal suggestions

- `POST /api/weather-suggestions` → OpenAI suggests 8-10 meals suited to forecast
- Cached 1hr keyed by rounded temp + condition + rainy
- Shown in DEMAND group with "+" buttons to add to menu

---

## Menu proposal scoring

`generate_proposal()` in `menu_proposal.py`:
1. Loads all menu items + their enrichment tags from SQLite
2. Loads current `FrameworkConfig` weights
3. `score_item()` combines: weather fit tag, `trending_up` demand signal, seasonal signals, events signals, regional preferences — all weighted by config sliders
4. Returns categorised proposal with per-item scores, ⭐ featured items (top scorers), and influence breakdown

---

## Taxonomy

`taxonomy.py` is the single source of truth. Key constants:

- `MENU_CATEGORIES`: `grill`, `sides`, `snacks`, `desserts`, `cold_drinks`, `hot_drinks`
- `INGREDIENT_CATEGORIES`: `produce`, `protein`, `seafood`, `game`, `herb`, `dairy`, `dessert`, `beverage`, `grain`
- `WEATHER_TAGS`: `hot_weather`, `cold_weather`, `any_weather`
- `DIETARY_TAGS`: `vegetarian`, `vegan`, `gluten_free`, `dairy_free`, `halal`, `nut_free`
- `ALLERGEN_TAGS`: `contains_gluten`, `contains_dairy`, `contains_eggs`, `contains_nuts`, `contains_fish`, `contains_shellfish`, `contains_soy`, `contains_sesame`
- `DEMAND_TAGS`: `trending_up`, `seasonal_spring`, `seasonal_summer`, `seasonal_autumn`, `seasonal_winter`, `celebration_fit`, `regional_special`
- `POSITIONING_TAGS`: `premium`, `budget_friendly`, `quick_serve`, `comfort_food`, `family_friendly`, `shareable`, `hero_item`
- `CONFIG_DEFAULTS`: default weight values for the framework sliders

---

## Framework & Config panel

Stored in `framework_config` SQLite table (single row). Fields:

| Field | Type | Description |
|-------|------|-------------|
| `weather_weight` | float 0–2 | How much weather fit influences proposal scoring |
| `trends_weight` | float 0–2 | How much trending_up tag influences scoring |
| `seasonal_weight` | float 0–2 | Weight for seasonal alignment |
| `events_weight` | float 0–2 | Weight for upcoming events/celebrations |
| `regional_weight` | float 0–2 | Weight for regional demand signals |
| `target_pct_veggie` | int 0–100 | Target % vegetarian items in proposal |
| `target_pct_vegan` | int 0–100 | Target % vegan items in proposal |
| `target_pct_gluten_free` | int 0–100 | Target % gluten-free items |
| `avg_price_target_gbp` | float | Target average price per item |
| `exclude_allergens` | list[str] | Allergens to exclude from all proposals |

---

## Flow pipeline (Meal Flow screen)

`FlowScreen.tsx` — steps run as:
1. **Parallel (steps 1–7)**: equipment → supply → trend discovery → historic → seasonal → celebrations → regional
2. **Background**: enrich-all (non-blocking, fire-and-forget)
3. **Sequential**: weather → weather meal suggestions → decision (backend) → menu proposal

### UI group order (top to bottom):
1. **DEMAND** (green): Trends, Historic, Seasonal, Celebrations, Regional, Weather, Weather Suggestions
2. **INPUT** (blue): MenuModule + Competitor Menus
3. **SUPPLY** (amber): Equipment + Supply Chain
4. **MENU PROPOSAL**: Scored items with expandable enrichment + score breakdown

All DEMAND modules show "+" buttons to add suggested items to the menu.
The menu proposal auto-generates via `useEffect` when `weatherResult` or `activeRegion` changes.

---

## Frontend screens

| Screen | Component | Notes |
|--------|-----------|-------|
| `flow` | `FlowScreen` | Always mounted (CSS display:none when inactive) |
| `weather` | inline App.tsx | Postcode or 12-region grid |
| `nutrition` | inline App.tsx | OpenAI gpt-4o-mini |
| `mcdonalds`/`burgerking`/`greggs` | inline App.tsx | Competitor menus — INPUT group |
| `trends` | `TrendsScreen` | OpenAI menu-item trends + custom keyword search |
| `historic` | `HistoricScreen` | 30-day mock |
| `seasonal` | `SeasonalScreen` | Month dropdown, OpenAI |
| `celebrations` | `CelebrationsScreen` | Month dropdown / next-90-days, OpenAI |
| `regional` | `RegionalScreen` | 12-region grid, OpenAI |
| `equipment` | `EquipmentScreen` | Van selector, mock |
| `supply` | `SupplyScreen` | BidFood Direct mock inventory |

### Module groups (FlowScreen) — rendered top to bottom
- **DEMAND** (green `#1a5f3f`): Trending Items, Historic Data, In-Season Foods, Upcoming Events, Regional Demand, Weather, Weather Meal Suggestions — all with "+" add-to-menu buttons
- **INPUT** (blue `#2563eb`): Current Menu Options + Enrichment, Competitor Menus
- **SUPPLY** (amber `#d97706`): Equipment, Supply Chain

### Key components
- `ModuleGroup`: collapsible section with coloured left border + chevron, item count badge
- `MenuModule({ refreshTrigger })`: combined menu list + per-item enrichment. Accepts `refreshTrigger` int — increments trigger data reload.
- `FrameworkConfigPanel()`: sliders/inputs that GET/PUT `/api/framework-config`
- `MenuProposalSection`: visual card grid with emoji, price, ⭐ featured badge, score bar

**Styling**: inline styles throughout, brand palette `#1a5f3f`/`#2d8659`/`#f5f1e8`, Georgia serif, `clamp()` for responsive sizing.

---

## Environment variables

Set in `backend/.env` or container environment:

| Variable | Required | Notes |
|----------|----------|-------|
| `OPENAI_API_KEY` | Yes | Used for enrichment, seasonal, celebrations, regional, custom trends |
| `OPENWEATHER_API_KEY` | Yes | Weather step (fallback default key in code) |
| `DATA_DIR` | No | SQLite directory (default: `backend/data/`) — set to `/data` on Railway |

---

## Data status

| Module | Status | Notes |
|--------|--------|-------|
| Menu items | 47 base items seeded from `database.py` | BidFood-sourced categories |
| Supply chain | BidFood Direct mock (65 items) | `supply_bidfood.py` |
| Equipment / vans | Mock | `equipment.py` |
| Historic sales | Mock (30-day fake data) | `historic.py` |
| Competitor menus | Bundled data | McDonald's (Excel), Burger King, Greggs |
| Enrichment | OpenAI, cached in SQLite | Runs once per item, never re-called |
| Celebrations | OpenAI, no fallback | `celebrations.py` |
| Trends (broad) | pytrends + hardcoded fallback | `trends.py` `get_trends()` |
| Trends (menu-specific) | OpenAI, 24hr cache | `trends.py` `get_custom_trends()` |

---

## Deployment

Railway.app via `railway.json` (Dockerfile builder). Port 8000. Mount a Volume at `/data` and set `DATA_DIR=/data` for SQLite persistence across deploys.
