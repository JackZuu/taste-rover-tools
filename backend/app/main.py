from dataclasses import asdict

from fastapi import FastAPI, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from pathlib import Path

from app.core import run_task
from app.nutrition import calculate_nutrition
from app.mcdonalds import get_mcdonalds_menu
from app.burgerking import get_burgerking_menu
from app.greggs import get_greggs_menu
from app.equipment import list_vans, get_van_equipment, get_equipment
from app.supply import get_supply_chain, get_ingredient_supply
from app.supply_bidfood import get_supply_chain as get_supply_chain_bidfood
from app.trends import get_trends, get_custom_trends
from app.historic import get_historic
from app.seasonal import get_seasonal
from app.celebrations import get_celebrations, get_celebrations_for_month
from app.regional import get_regional_demand
from app.decision import get_decision_and_options
from app.menu_generator import generate_menu
from app.flow import run_flow
from app.models import WeatherResult
from app.database import init_db, SessionLocal, MenuItemDB, MenuItemEnrichmentDB, FrameworkConfigDB
from app.menu_proposal import generate_proposal
import json

# ─── Environment ──────────────────────────────────────────────────────────────

basedir     = os.path.abspath(os.path.dirname(__file__))
backend_dir = os.path.dirname(basedir)
dotenv_path = os.path.join(backend_dir, ".env")
load_dotenv(dotenv_path)

init_db()

print(f"Loading .env from: {dotenv_path}")
print(f"OPENAI_API_KEY found: {bool(os.getenv('OPENAI_API_KEY'))}")

# ─── App setup ────────────────────────────────────────────────────────────────

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Request models ───────────────────────────────────────────────────────────

class WeatherRequest(BaseModel):
    postcode: str

class NutritionRequest(BaseModel):
    ingredients: list[str]

class MealRequest(BaseModel):
    meal: str

class VanRequest(BaseModel):
    van_id: str

class RegionRequest(BaseModel):
    region: str

class DecisionRequest(BaseModel):
    avg_temp: float
    is_rainy: bool
    condition: str = "mainly cloud"
    date: str = ""
    region: str = ""
    active_trends: list[str] = []
    seasonal_items: list[str] = []
    upcoming_celebration: str = ""
    celebration_suggestions: list[str] = []
    regional_suggestions: list[str] = []

class MenuRequest(BaseModel):
    avg_temp: float
    is_rainy: bool
    condition: str = "mainly cloud"
    primary_meal: str
    region: str = "London"
    active_trends: list[str] = []
    seasonal_items: list[str] = []
    upcoming_celebration: str = ""

class FlowRequest(BaseModel):
    postcode: str
    date: str          # YYYY-MM-DD
    van_id: str = "van_alpha"
    region: str = "London"

class AddMenuItemRequest(BaseModel):
    name: str
    category: str
    price_gbp: float

class UpdateMenuItemRequest(BaseModel):
    name: str | None = None
    price_gbp: float | None = None
    active: bool | None = None

class FrameworkConfigRequest(BaseModel):
    weather_weight: float | None = None
    trends_weight: float | None = None
    seasonal_weight: float | None = None
    events_weight: float | None = None
    regional_weight: float | None = None
    target_pct_veggie: int | None = None
    target_pct_vegan: int | None = None
    target_pct_gluten_free: int | None = None
    avg_price_target_gbp: float | None = None
    exclude_allergens: list[str] | None = None

class MenuProposalRequest(BaseModel):
    avg_temp: float | None = None
    is_rainy: bool = False
    condition: str = "mainly cloud"
    date: str = ""
    active_trends: list[str] = []
    seasonal_items: list[str] = []
    upcoming_celebration: str = ""
    region: str = "London"
    celebration_suggestions: list[str] = []
    regional_suggestions: list[str] = []

class WeatherSuggestionsRequest(BaseModel):
    avg_temp: float
    condition: str = "mainly cloud"
    is_rainy: bool = False

# ─── Existing endpoints ───────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"ok": True}

@app.post("/api/weather")
def get_weather(req: WeatherRequest):
    return run_task(req.postcode)

@app.post("/api/nutrition")
def get_nutrition(req: NutritionRequest):
    return calculate_nutrition(req.ingredients)

@app.get("/api/mcdonalds/menu")
def get_menu():
    return get_mcdonalds_menu()

@app.get("/api/burgerking/menu")
def get_bk_menu():
    return get_burgerking_menu()

@app.get("/api/greggs/menu")
def get_greggs_menu_endpoint():
    return get_greggs_menu()

# ─── Equipment ────────────────────────────────────────────────────────────────

@app.get("/api/vans")
def get_vans():
    return {"vans": [asdict(v) for v in list_vans()]}

@app.post("/api/equipment/van")
def get_van_equipment_endpoint(req: VanRequest):
    result = get_van_equipment(req.van_id)
    return {
        "van": asdict(result.van),
        "equipment": [asdict(e) for e in result.equipment],
        "available_count": result.available_count,
        "total_count": result.total_count,
    }

# Legacy endpoint kept for backward compatibility
@app.post("/api/equipment")
def get_equipment_legacy(req: MealRequest):
    result = get_equipment(req.meal)
    return {
        "equipment": [asdict(e) for e in result.equipment],
        "all_ready": result.all_ready,
    }

# ─── Supply chain ─────────────────────────────────────────────────────────────

@app.get("/api/supply/chain")
def get_supply_chain_endpoint():
    result = get_supply_chain_bidfood()
    return {
        "suppliers": [asdict(s) for s in result.suppliers],
        "inventory": [asdict(i) for i in result.inventory],
    }

# Legacy endpoint
@app.post("/api/supply")
def get_supply_legacy(req: MealRequest):
    result = get_ingredient_supply(req.meal)
    return {
        "ingredients": [asdict(i) for i in result.ingredients],
        "all_available": result.all_available,
    }

# ─── New modules ──────────────────────────────────────────────────────────────

class CustomTrendsRequest(BaseModel):
    keywords: list[str]

@app.get("/api/trends")
def get_trends_endpoint():
    result = get_trends()
    return {
        "items": [asdict(t) for t in result.items],
        "trend_names": [t.name for t in result.items],
        "source": result.source,
    }

@app.post("/api/trends/custom")
def get_custom_trends_endpoint(req: CustomTrendsRequest):
    result = get_custom_trends(req.keywords)
    return {"trends": [asdict(t) for t in result.trends], "source": result.source}

@app.get("/api/historic")
def get_historic_endpoint():
    result = get_historic()
    return {
        "daily_stats":       [asdict(d) for d in result.daily_stats],
        "top_meals":         [asdict(m) for m in result.top_meals],
        "total_revenue_gbp": result.total_revenue_gbp,
        "avg_daily_covers":  result.avg_daily_covers,
        "best_day":          result.best_day,
        "source":            result.source,
        "message":           result.message,
    }

@app.get("/api/seasonal")
def get_seasonal_endpoint(month: int | None = Query(default=None, ge=1, le=12)):
    result = get_seasonal(month)
    return {"month": result.month, "items": [asdict(i) for i in result.items], "source": result.source}

@app.get("/api/celebrations")
def get_celebrations_endpoint(month: int | None = Query(default=None, ge=1, le=12)):
    if month is not None:
        result = get_celebrations_for_month(month)
    else:
        result = get_celebrations()
    return {"upcoming": [asdict(e) for e in result.upcoming], "source": result.source}

@app.post("/api/regional")
def get_regional_endpoint(req: RegionRequest):
    result = get_regional_demand(req.region)
    return {
        "region": result.region,
        "insights": [asdict(i) for i in result.insights],
        "menu_suggestions": [asdict(s) for s in result.menu_suggestions],
        "source": result.source,
    }

@app.post("/api/decision")
def get_decision_endpoint(req: DecisionRequest):
    weather = WeatherResult(
        date=req.date,
        avg_temp=req.avg_temp,
        condition=req.condition,
        is_rainy=req.is_rainy,
    )
    result = get_decision_and_options(
        weather,
        active_trends=req.active_trends,
        seasonal_items=req.seasonal_items,
        celebration_suggestions=req.celebration_suggestions,
        regional_suggestions=req.regional_suggestions,
    )
    return {
        "primary_meal": result.primary_meal,
        "primary_reason": result.primary_reason,
        "menu_options": [asdict(o) for o in result.menu_options],
    }

@app.post("/api/menu")
def get_menu_proposal(req: MenuRequest):
    weather = WeatherResult(
        date="",
        avg_temp=req.avg_temp,
        condition=req.condition,
        is_rainy=req.is_rainy,
    )
    menu = generate_menu(
        weather=weather,
        primary_meal=req.primary_meal,
        region=req.region,
        active_trends=req.active_trends or [],
        seasonal_items=req.seasonal_items or [],
        upcoming_celebration=req.upcoming_celebration or None,
    )
    return asdict(menu)

# ─── Menu items (CRUD) ────────────────────────────────────────────────────────

@app.get("/api/menu-items")
def list_menu_items():
    with SessionLocal() as session:
        items = session.query(MenuItemDB).filter_by(active=True).order_by(MenuItemDB.category, MenuItemDB.id).all()
        return {"items": [
            {"id": i.id, "name": i.name, "category": i.category,
             "price_gbp": i.price_gbp, "user_added": i.user_added}
            for i in items
        ]}

@app.post("/api/menu-items")
def add_menu_item(req: AddMenuItemRequest):
    from app.taxonomy import MENU_CATEGORIES
    if req.category not in MENU_CATEGORIES:
        from fastapi import HTTPException
        raise HTTPException(400, f"category must be one of {MENU_CATEGORIES}")
    with SessionLocal() as session:
        item = MenuItemDB(name=req.name, category=req.category,
                          price_gbp=req.price_gbp, user_added=True)
        session.add(item)
        session.commit()
        session.refresh(item)
        return {"id": item.id, "name": item.name, "category": item.category,
                "price_gbp": item.price_gbp, "user_added": item.user_added}

@app.delete("/api/menu-items/{item_id}")
def delete_menu_item(item_id: int):
    with SessionLocal() as session:
        item = session.query(MenuItemDB).filter_by(id=item_id).first()
        if not item:
            from fastapi import HTTPException
            raise HTTPException(404, "Item not found")
        item.active = False
        session.commit()
        return {"ok": True}

# ─── Menu item enrichment ─────────────────────────────────────────────────────

@app.get("/api/menu-items/{item_id}/enrichment")
def get_enrichment(item_id: int):
    with SessionLocal() as session:
        row = session.query(MenuItemEnrichmentDB).filter_by(item_id=item_id).first()
        if not row:
            return {"enriched": False}
        return {
            "enriched":    True,
            "item_id":     item_id,
            "ingredients": json.loads(row.ingredients),
            "nutrition":   json.loads(row.nutrition),
            "tags":        json.loads(row.tags),
            "enriched_at": row.enriched_at.isoformat() if row.enriched_at else "",
        }

@app.post("/api/menu-items/{item_id}/enrich")
def enrich_menu_item(item_id: int):
    """Run OpenAI enrichment for a single menu item. Skips if already enriched."""
    with SessionLocal() as session:
        item = session.query(MenuItemDB).filter_by(id=item_id, active=True).first()
        if not item:
            from fastapi import HTTPException
            raise HTTPException(404, "Item not found")
        existing = session.query(MenuItemEnrichmentDB).filter_by(item_id=item_id).first()
        if existing:
            return {
                "enriched":    True,
                "skipped":     True,
                "item_id":     item_id,
                "ingredients": json.loads(existing.ingredients),
                "nutrition":   json.loads(existing.nutrition),
                "tags":        json.loads(existing.tags),
            }

    # Call OpenAI outside session
    import os
    from openai import OpenAI
    from app.prompts import menu_item_enrichment_prompt
    from app.taxonomy import ALL_TAGS
    from datetime import datetime

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    prompt = menu_item_enrichment_prompt(item.name, item.category, item.price_gbp)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        max_tokens=600,
        temperature=0.1,
    )
    raw = json.loads(response.choices[0].message.content or "{}")

    ingredients = raw.get("ingredients", [])
    nutrition   = raw.get("nutrition", {})
    tags_raw    = raw.get("tags", [])
    # Validate tags against taxonomy
    tags = [t for t in tags_raw if t in ALL_TAGS]

    with SessionLocal() as session:
        row = MenuItemEnrichmentDB(
            item_id=item_id,
            ingredients=json.dumps(ingredients),
            nutrition=json.dumps(nutrition),
            tags=json.dumps(tags),
            enriched_at=datetime.utcnow(),
        )
        session.add(row)
        session.commit()

    return {
        "enriched":    True,
        "skipped":     False,
        "item_id":     item_id,
        "ingredients": ingredients,
        "nutrition":   nutrition,
        "tags":        tags,
    }

@app.post("/api/menu-items/enrich-all")
def enrich_all_menu_items():
    """Enrich all unenriched active menu items. Returns summary."""
    with SessionLocal() as session:
        items = session.query(MenuItemDB).filter_by(active=True).all()
        enriched_ids = {r.item_id for r in session.query(MenuItemEnrichmentDB).all()}
        to_enrich = [i for i in items if i.id not in enriched_ids]

    results = []
    for item in to_enrich:
        try:
            result = enrich_menu_item(item.id)
            results.append({"id": item.id, "name": item.name, "ok": True})
        except Exception as e:
            results.append({"id": item.id, "name": item.name, "ok": False, "error": str(e)})

    return {"processed": len(results), "results": results}

@app.post("/api/menu-items/re-enrich-all")
def re_enrich_all_menu_items():
    """Delete all existing enrichment and re-enrich every active menu item."""
    with SessionLocal() as session:
        session.query(MenuItemEnrichmentDB).delete()
        session.commit()
    return enrich_all_menu_items()

# ─── Framework config ─────────────────────────────────────────────────────────

@app.get("/api/framework-config")
def get_framework_config():
    with SessionLocal() as session:
        cfg = session.query(FrameworkConfigDB).filter_by(id=1).first()
        if not cfg:
            from app.taxonomy import CONFIG_DEFAULTS
            return CONFIG_DEFAULTS
        return {
            "weather_weight":         cfg.weather_weight,
            "trends_weight":          cfg.trends_weight,
            "seasonal_weight":        cfg.seasonal_weight,
            "events_weight":          cfg.events_weight,
            "regional_weight":        cfg.regional_weight,
            "target_pct_veggie":      cfg.target_pct_veggie,
            "target_pct_vegan":       cfg.target_pct_vegan,
            "target_pct_gluten_free": cfg.target_pct_gluten_free,
            "avg_price_target_gbp":   cfg.avg_price_target_gbp,
            "exclude_allergens":      json.loads(cfg.exclude_allergens or "[]"),
        }

@app.put("/api/framework-config")
def update_framework_config(req: FrameworkConfigRequest):
    from datetime import datetime
    with SessionLocal() as session:
        cfg = session.query(FrameworkConfigDB).filter_by(id=1).first()
        if not cfg:
            cfg = FrameworkConfigDB(id=1)
            session.add(cfg)
        if req.weather_weight       is not None: cfg.weather_weight       = req.weather_weight
        if req.trends_weight        is not None: cfg.trends_weight        = req.trends_weight
        if req.seasonal_weight      is not None: cfg.seasonal_weight      = req.seasonal_weight
        if req.events_weight        is not None: cfg.events_weight        = req.events_weight
        if req.regional_weight      is not None: cfg.regional_weight      = req.regional_weight
        if req.target_pct_veggie    is not None: cfg.target_pct_veggie    = req.target_pct_veggie
        if req.target_pct_vegan     is not None: cfg.target_pct_vegan     = req.target_pct_vegan
        if req.target_pct_gluten_free is not None: cfg.target_pct_gluten_free = req.target_pct_gluten_free
        if req.avg_price_target_gbp is not None: cfg.avg_price_target_gbp = req.avg_price_target_gbp
        if req.exclude_allergens    is not None: cfg.exclude_allergens    = json.dumps(req.exclude_allergens)
        cfg.updated_at = datetime.utcnow()
        session.commit()
        return {"ok": True}

# ─── Weather meal suggestions ────────────────────────────────────────────────

_weather_suggestions_cache: dict = {}
_WEATHER_SUGGESTIONS_TTL = 3600  # 1 hour

@app.post("/api/weather-suggestions")
def get_weather_suggestions(req: WeatherSuggestionsRequest):
    """Suggest meals suited to the weather forecast (OpenAI, cached 1hr)."""
    from datetime import datetime
    cache_key = f"{round(req.avg_temp)}|{req.condition}|{req.is_rainy}"
    now = datetime.utcnow()
    cached = _weather_suggestions_cache.get(cache_key)
    if cached and (now - cached["at"]).total_seconds() < _WEATHER_SUGGESTIONS_TTL:
        return cached["result"]

    from openai import OpenAI
    from app.prompts import weather_meal_suggestions_prompt
    from app.taxonomy import MENU_CATEGORIES

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return {"suggestions": [], "source": "unavailable"}

    try:
        client = OpenAI(api_key=api_key)
        prompt = weather_meal_suggestions_prompt(req.avg_temp, req.condition, req.is_rainy)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=1000,
            temperature=0.4,
        )
        raw = json.loads(response.choices[0].message.content or "{}")
        valid_cats = set(MENU_CATEGORIES)
        suggestions = []
        for s in raw.get("suggestions", []):
            cat = s.get("category", "snacks")
            if cat not in valid_cats:
                cat = "snacks"
            suggestions.append({
                "name": s.get("name", ""),
                "category": cat,
                "reason": s.get("reason", ""),
                "estimated_price_gbp": round(float(s.get("estimated_price_gbp", 7.0)), 2),
            })
        result = {"suggestions": suggestions, "source": "openai"}
        _weather_suggestions_cache[cache_key] = {"result": result, "at": now}
        return result
    except Exception:
        return {"suggestions": [], "source": "error"}

# ─── Menu proposal (scored) ───────────────────────────────────────────────────

@app.post("/api/menu-proposal")
def get_menu_proposal_scored(req: MenuProposalRequest):
    weather = None
    if req.avg_temp is not None:
        weather = WeatherResult(
            date=req.date,
            avg_temp=req.avg_temp,
            condition=req.condition,
            is_rainy=req.is_rainy,
        )
    return generate_proposal(
        weather=weather,
        active_trends=req.active_trends,
        seasonal_items=req.seasonal_items,
        upcoming_celebration=req.upcoming_celebration,
        region=req.region,
        celebration_suggestions=req.celebration_suggestions,
        regional_suggestions=req.regional_suggestions,
    )

# ─── Full pipeline ────────────────────────────────────────────────────────────

@app.post("/api/flow")
def run_flow_endpoint(req: FlowRequest):
    return run_flow(req.postcode, req.date, req.van_id, req.region)

# ─── Frontend (SPA) ───────────────────────────────────────────────────────────

static_dir = Path(__file__).parent.parent / "static"
if static_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(static_dir / "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        if full_path and not full_path.startswith("api"):
            file_path = static_dir / full_path
            if file_path.exists() and file_path.is_file():
                return FileResponse(file_path)
        return FileResponse(static_dir / "index.html")
