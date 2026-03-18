from dataclasses import asdict

from fastapi import FastAPI
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
from app.trends import get_trends
from app.historic import get_historic
from app.seasonal import get_seasonal
from app.celebrations import get_celebrations
from app.regional import get_regional_demand
from app.decision import get_decision_and_options, make_decision
from app.menu_generator import generate_menu
from app.flow import run_flow
from app.models import WeatherResult

# ─── Environment ──────────────────────────────────────────────────────────────

basedir     = os.path.abspath(os.path.dirname(__file__))
backend_dir = os.path.dirname(basedir)
dotenv_path = os.path.join(backend_dir, ".env")
load_dotenv(dotenv_path)

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
    result = get_supply_chain()
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

@app.get("/api/trends")
def get_trends_endpoint():
    result = get_trends()
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
def get_seasonal_endpoint():
    result = get_seasonal()
    return {"month": result.month, "items": [asdict(i) for i in result.items]}

@app.get("/api/celebrations")
def get_celebrations_endpoint():
    result = get_celebrations()
    return {"upcoming": [asdict(e) for e in result.upcoming]}

@app.post("/api/regional")
def get_regional_endpoint(req: RegionRequest):
    result = get_regional_demand(req.region)
    return {"region": result.region, "insights": [asdict(i) for i in result.insights]}

@app.post("/api/decision")
def get_decision_endpoint(req: DecisionRequest):
    weather = WeatherResult(
        date=req.date,
        avg_temp=req.avg_temp,
        condition=req.condition,
        is_rainy=req.is_rainy,
    )
    result = get_decision_and_options(weather)
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
