from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from app.core import run_task
from app.nutrition import calculate_nutrition
from app.mcdonalds import get_mcdonalds_menu
from dotenv import load_dotenv
import os
from pathlib import Path

# Load environment variables from .env file
# Get the directory where this file is located
basedir = os.path.abspath(os.path.dirname(__file__))
# Go up one level to the backend directory
backend_dir = os.path.dirname(basedir)
dotenv_path = os.path.join(backend_dir, '.env')
load_dotenv(dotenv_path)

print(f"Loading .env from: {dotenv_path}")
print(f"OPENAI_API_KEY found: {bool(os.getenv('OPENAI_API_KEY'))}")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class WeatherRequest(BaseModel):
    postcode: str

class NutritionRequest(BaseModel):
    ingredients: list[str]

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

# Serve static files (frontend)
static_dir = Path(__file__).parent.parent / "static"
if static_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(static_dir / "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        # Serve index.html for all non-API routes
        if full_path and not full_path.startswith("api"):
            file_path = static_dir / full_path
            if file_path.exists() and file_path.is_file():
                return FileResponse(file_path)
        return FileResponse(static_dir / "index.html")
