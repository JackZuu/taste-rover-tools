"""
Database — SQLite via SQLAlchemy ORM.

Tables:
  menu_items            — base menu + user additions
  menu_item_enrichment  — per-item enrichment (ingredients, nutrition, tags), run once
  framework_config      — single-row tunable weights and targets

The SQLite file is stored at DATA_DIR/smartr.db.
On Railway, mount a Volume at /data so the file survives redeploys.
Locally it lives at backend/data/smartr.db.
"""

import json
import os
from datetime import datetime
from pathlib import Path

from sqlalchemy import (
    Boolean, Column, DateTime, Float, Integer, String, Text,
    create_engine, event,
)
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

# ─── DB path ──────────────────────────────────────────────────────────────────

_DATA_DIR = Path(os.getenv("DATA_DIR", Path(__file__).parent.parent / "data"))
_DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_URL = f"sqlite:///{_DATA_DIR / 'smartr.db'}"

engine = create_engine(DB_URL, connect_args={"check_same_thread": False})

# Enable WAL mode for better concurrent read performance
@event.listens_for(engine, "connect")
def _set_wal(dbapi_conn, _):
    dbapi_conn.execute("PRAGMA journal_mode=WAL")

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


# ─── ORM models ───────────────────────────────────────────────────────────────

class Base(DeclarativeBase):
    pass


class MenuItemDB(Base):
    __tablename__ = "menu_items"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    name       = Column(String(120), nullable=False)
    category   = Column(String(40),  nullable=False)   # grill/sides/snacks/desserts/cold_drinks/hot_drinks
    price_gbp  = Column(Float,       nullable=False)
    user_added = Column(Boolean,     default=False)
    active     = Column(Boolean,     default=True)
    created_at = Column(DateTime,    default=datetime.utcnow)


class MenuItemEnrichmentDB(Base):
    __tablename__ = "menu_item_enrichment"

    id          = Column(Integer, primary_key=True, autoincrement=True)
    item_id     = Column(Integer, nullable=False, unique=True)   # FK → menu_items.id
    ingredients = Column(Text, nullable=False)   # JSON list of strings
    nutrition   = Column(Text, nullable=False)   # JSON {cal, protein_g, carbs_g, fat_g, fibre_g}
    tags        = Column(Text, nullable=False)   # JSON list of tag strings
    enriched_at = Column(DateTime, default=datetime.utcnow)


class FrameworkConfigDB(Base):
    __tablename__ = "framework_config"

    id                   = Column(Integer, primary_key=True, default=1)
    weather_weight       = Column(Float,   default=1.0)
    trends_weight        = Column(Float,   default=1.0)
    seasonal_weight      = Column(Float,   default=1.0)
    events_weight        = Column(Float,   default=1.0)
    regional_weight      = Column(Float,   default=1.0)
    target_pct_veggie    = Column(Integer, default=30)
    target_pct_vegan     = Column(Integer, default=15)
    target_pct_gluten_free = Column(Integer, default=20)
    avg_price_target_gbp = Column(Float,   default=7.0)
    exclude_allergens    = Column(Text,    default="[]")  # JSON list
    updated_at           = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ─── Seed data — base menu ────────────────────────────────────────────────────

_BASE_MENU: list[dict] = [
    # Grill
    {"name": "Burger",             "category": "grill",       "price_gbp": 8.00},
    {"name": "Cheese Burger",      "category": "grill",       "price_gbp": 8.50},
    {"name": "Portobello Burger",  "category": "grill",       "price_gbp": 8.50},
    {"name": "Beef Skewer",        "category": "grill",       "price_gbp": 9.95},
    {"name": "Chicken Skewer",     "category": "grill",       "price_gbp": 8.50},
    {"name": "Vegetable Skewer",   "category": "grill",       "price_gbp": 6.50},
    {"name": "Margherita",         "category": "grill",       "price_gbp": 9.95},
    {"name": "Pepperoni",          "category": "grill",       "price_gbp": 10.95},
    {"name": "Vegetarian Pizza",   "category": "grill",       "price_gbp": 10.50},
    # Sides
    {"name": "Rice",               "category": "sides",       "price_gbp": 3.50},
    {"name": "Fries",              "category": "sides",       "price_gbp": 3.95},
    {"name": "Sweet Potato Fries", "category": "sides",       "price_gbp": 4.50},
    {"name": "Carrots",            "category": "sides",       "price_gbp": 2.50},
    {"name": "Broccoli",           "category": "sides",       "price_gbp": 2.50},
    {"name": "Mix Crudites",       "category": "sides",       "price_gbp": 3.50},
    {"name": "Tricolore Salad",    "category": "sides",       "price_gbp": 5.00},
    {"name": "Greek Salad",        "category": "sides",       "price_gbp": 5.50},
    {"name": "Mixed Green Salad",  "category": "sides",       "price_gbp": 4.50},
    # Snacks
    {"name": "Bolognese",          "category": "snacks",      "price_gbp": 3.95},
    {"name": "Macaroni Cheese",    "category": "snacks",      "price_gbp": 4.95},
    {"name": "Pesto Pasta",        "category": "snacks",      "price_gbp": 3.95},
    {"name": "Meatball",           "category": "snacks",      "price_gbp": 6.95},
    {"name": "Chicken Pasta Sauce","category": "snacks",      "price_gbp": 7.50},
    {"name": "Minestrone",         "category": "snacks",      "price_gbp": 5.95},
    {"name": "Bacon & Cheese Melt","category": "snacks",      "price_gbp": 5.95},
    {"name": "Tuna Sandwich",      "category": "snacks",      "price_gbp": 7.50},
    {"name": "Cheese Toast",       "category": "snacks",      "price_gbp": 4.95},
    # Desserts
    {"name": "Melon",              "category": "desserts",    "price_gbp": 4.00},
    {"name": "Mango",              "category": "desserts",    "price_gbp": 4.00},
    {"name": "Fruit Salad",        "category": "desserts",    "price_gbp": 4.00},
    {"name": "Cheesecake",         "category": "desserts",    "price_gbp": 5.95},
    {"name": "Chocolate Cake",     "category": "desserts",    "price_gbp": 5.95},
    {"name": "Fruit Cake",         "category": "desserts",    "price_gbp": 4.95},
    {"name": "Vanilla Ice Cream",  "category": "desserts",    "price_gbp": 4.95},
    {"name": "Chocolate Ice Cream","category": "desserts",    "price_gbp": 5.95},
    {"name": "Strawberry Ice Cream","category": "desserts",   "price_gbp": 5.95},
    # Cold Drinks
    {"name": "Coca Cola",          "category": "cold_drinks", "price_gbp": 2.50},
    {"name": "Coca Cola Zero",     "category": "cold_drinks", "price_gbp": 2.50},
    {"name": "Lemonade",           "category": "cold_drinks", "price_gbp": 2.50},
    {"name": "Apple Juice",        "category": "cold_drinks", "price_gbp": 3.00},
    # Hot Drinks
    {"name": "Espresso",           "category": "hot_drinks",  "price_gbp": 2.95},
    {"name": "Cappuccino",         "category": "hot_drinks",  "price_gbp": 3.95},
    {"name": "Americano",          "category": "hot_drinks",  "price_gbp": 3.50},
    {"name": "White Americano",    "category": "hot_drinks",  "price_gbp": 3.75},
    {"name": "Mint Tea",           "category": "hot_drinks",  "price_gbp": 2.95},
    {"name": "Black Tea",          "category": "hot_drinks",  "price_gbp": 2.95},
    {"name": "Green Tea",          "category": "hot_drinks",  "price_gbp": 2.95},
]


# ─── Init / seed ──────────────────────────────────────────────────────────────

def init_db() -> None:
    """Create tables and seed base menu + default config if not present."""
    Base.metadata.create_all(engine)
    with SessionLocal() as session:
        _seed_menu(session)
        _seed_config(session)
        session.commit()


def _seed_menu(session: Session) -> None:
    count = session.query(MenuItemDB).count()
    if count > 0:
        return  # already seeded
    for item in _BASE_MENU:
        session.add(MenuItemDB(**item, user_added=False))


def _seed_config(session: Session) -> None:
    existing = session.query(FrameworkConfigDB).filter_by(id=1).first()
    if existing:
        return
    session.add(FrameworkConfigDB(id=1))


# ─── Helpers ──────────────────────────────────────────────────────────────────

def get_session() -> Session:
    return SessionLocal()
