#!/usr/bin/env python3
"""
Taste Rover -- SmarTR Food Step 3: Live Food Trends
=====================================================
Replaces the hardcoded MOCK trends data in the SmarTR Food pipeline
with real Google Trends data for the UK Food & Drink category.

Designed to slot directly into the 12-step recommendation engine.
Outputs a JSON file (trends_feed.json) that the menu proposal logic
can consume, plus CSV exports for analysis.

Usage:
    pip install pytrends pandas
    python smartr_trends.py                        # GB-wide, defaults
    python smartr_trends.py --region GB-ENG        # England only
    python smartr_trends.py --region GB-WLS        # Wales only
    python smartr_trends.py --postcode SW1A        # postcode prefix

The JSON output contains:
    - rising_foods:       what's surging right now (menu opportunities)
    - declining_foods:    what's falling off (items to deprioritise)
    - regional_demand:    interest by UK region for tracked categories
    - related_searches:   what people search alongside your menu items
    - seasonal_signal:    interest-over-time for seasonal ingredients
    - timestamp:          when this data was pulled

This feeds into Step 12 (Menu Proposal) so recommendations reflect
real consumer demand rather than static assumptions.
"""

import os
import sys
import time
import json
import argparse
from datetime import datetime

import pandas as pd
pd.set_option('future.no_silent_downcasting', True)

# ---------------------------------------------------------------------------
# Monkey-patch: fix pytrends for urllib3 v2+
# pytrends (archived 2025) uses removed 'method_whitelist' kwarg.
# Must patch BEFORE importing pytrends.
# ---------------------------------------------------------------------------
import requests.packages.urllib3.util.retry as _retry_mod
_OrigRetry = _retry_mod.Retry

class _PatchedRetry(_OrigRetry):
    def __init__(self, *args, **kwargs):
        if "method_whitelist" in kwargs:
            kwargs["allowed_methods"] = kwargs.pop("method_whitelist")
        super().__init__(*args, **kwargs)

_retry_mod.Retry = _PatchedRetry
from pytrends.request import TrendReq


# ---------------------------------------------------------------------------
# Configuration -- tune these for Taste Rover's menu categories
# ---------------------------------------------------------------------------
FOOD_DRINK_CAT = 71     # Google Trends category: Food & Drink
COOKING_CAT    = 122    # Sub-category: Cooking & Recipes
LANGUAGE       = "en-GB"
TIMEZONE       = 0      # GMT
OUTPUT_DIR     = "trends_output"
SLEEP          = 2      # seconds between API calls

# Food truck menu categories -- these map to SmarTR Food's menu sections.
# Each group is queried separately (max 5 keywords per pytrends call).
MENU_CATEGORIES = {
    "grill": [
        "smash burger",
        "loaded fries",
        "chicken wings",
        "halloumi burger",
        "pulled pork",
    ],
    "snacks": [
        "korean corn dog",
        "mac and cheese bites",
        "spring rolls",
        "falafel wrap",
        "churros",
    ],
    "drinks": [
        "bubble tea",
        "iced coffee",
        "lemonade",
        "matcha latte",
        "hot chocolate",
    ],
    "trending_cuisines": [
        "korean street food",
        "mexican street food",
        "japanese street food",
        "mediterranean food",
        "plant based food",
    ],
}

# Seasonal ingredients to track (swapped per quarter if you like)
SEASONAL_INGREDIENTS = [
    "asparagus",
    "rhubarb",
    "wild garlic",
    "jersey royals",
    "blood orange",
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def ensure_output_dir():
    os.makedirs(OUTPUT_DIR, exist_ok=True)


def save_csv(df, name):
    path = os.path.join(OUTPUT_DIR, f"{name}.csv")
    df.to_csv(path)
    print(f"  -> Saved {path}  ({len(df)} rows)")
    return path


def save_json(data, name):
    path = os.path.join(OUTPUT_DIR, f"{name}.json")
    with open(path, "w") as f:
        json.dump(data, f, indent=2, default=str)
    print(f"  -> Saved {path}")
    return path


def log(msg):
    print(f"  {msg}")


def heading(title):
    print(f"\n{'=' * 64}")
    print(f"  {title}")
    print(f"{'=' * 64}")


# ---------------------------------------------------------------------------
# Core data-fetching functions
# ---------------------------------------------------------------------------

def fetch_interest_over_time(pt, keywords, geo="GB", cat=FOOD_DRINK_CAT,
                              timeframe="today 3-m"):
    """Return interest-over-time DataFrame for up to 5 keywords."""
    pt.build_payload(keywords[:5], cat=cat, timeframe=timeframe, geo=geo)
    df = pt.interest_over_time()
    if "isPartial" in df.columns:
        df = df.drop(columns=["isPartial"])
    return df


def fetch_related_queries(pt, keyword, geo="GB", cat=FOOD_DRINK_CAT):
    """Return (top_df, rising_df) for a single keyword."""
    pt.build_payload([keyword], cat=cat, timeframe="today 3-m", geo=geo)
    rq = pt.related_queries()
    result = rq.get(keyword, {})
    return result.get("top", pd.DataFrame()), result.get("rising", pd.DataFrame())


def fetch_regional_interest(pt, keywords, geo="GB", cat=FOOD_DRINK_CAT):
    """Return interest-by-region DataFrame."""
    pt.build_payload(keywords[:5], cat=cat, timeframe="today 3-m", geo=geo)
    df = pt.interest_by_region(
        resolution="COUNTRY", inc_low_vol=True, inc_geo_code=True
    )
    return df


def fetch_trending_rss(geo="GB"):
    """Fallback: pull today's trending searches from Google's RSS feed."""
    import xml.etree.ElementTree as ET
    url = f"https://trends.google.com/trending/rss?geo={geo}"
    resp = __import__("requests").get(url, timeout=15)
    resp.raise_for_status()
    root = ET.fromstring(resp.content)
    titles = []
    for item in root.iter("item"):
        t = item.find("title")
        if t is not None and t.text:
            titles.append(t.text)
    return titles


# ---------------------------------------------------------------------------
# Pipeline Step 3: Assemble the trends feed
# ---------------------------------------------------------------------------

def build_trends_feed(pt, geo="GB"):
    """Run all queries and return a dict ready for the menu engine."""
    feed = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "geo": geo,
        "category": "Food & Drink (cat=71)",
    }

    # -- A. Interest over time per menu category --------------------------
    heading("A - Menu Category Trends (last 3 months)")
    category_trends = {}
    for cat_name, keywords in MENU_CATEGORIES.items():
        try:
            df = fetch_interest_over_time(pt, keywords, geo=geo)
            if df.empty:
                log(f"{cat_name}: no data")
                continue
            # Compute average interest and recent trend direction
            means = df.mean().to_dict()
            # Compare last 4 weeks vs prior 4 weeks
            if len(df) >= 8:
                recent = df.iloc[-4:].mean()
                prior  = df.iloc[-8:-4].mean()
                momentum = ((recent - prior) / prior.replace(0, 1) * 100).round(1).to_dict()
            else:
                momentum = {k: 0.0 for k in means}

            items = []
            for kw in keywords:
                if kw in means:
                    direction = "rising" if momentum.get(kw, 0) > 5 else \
                                "falling" if momentum.get(kw, 0) < -5 else "stable"
                    items.append({
                        "keyword": kw,
                        "avg_interest": round(means[kw], 1),
                        "momentum_pct": momentum.get(kw, 0),
                        "direction": direction,
                    })
            items.sort(key=lambda x: x["momentum_pct"], reverse=True)
            category_trends[cat_name] = items

            log(f"{cat_name}:")
            for it in items:
                arrow = {"rising": "[UP]", "falling": "[DOWN]", "stable": "[--]"}[it["direction"]]
                log(f"  {arrow} {it['keyword']:30s}  avg={it['avg_interest']:5.1f}  momentum={it['momentum_pct']:+.1f}%")

            save_csv(df, f"trend_{cat_name}")
            time.sleep(SLEEP)
        except Exception as e:
            log(f"{cat_name}: ERROR - {e}")

    feed["category_trends"] = category_trends

    # Compute top rising and declining across all categories
    all_items = [it for items in category_trends.values() for it in items]
    feed["rising_foods"]   = [it for it in sorted(all_items, key=lambda x: x["momentum_pct"], reverse=True) if it["direction"] == "rising"]
    feed["declining_foods"] = [it for it in sorted(all_items, key=lambda x: x["momentum_pct"]) if it["direction"] == "falling"]

    # -- B. Seasonal ingredient signal ------------------------------------
    heading("B - Seasonal Ingredients")
    try:
        df = fetch_interest_over_time(pt, SEASONAL_INGREDIENTS, geo=geo)
        if not df.empty:
            means = df.mean().round(1).to_dict()
            feed["seasonal_signal"] = [
                {"ingredient": k, "avg_interest": v}
                for k, v in sorted(means.items(), key=lambda x: x[1], reverse=True)
            ]
            for s in feed["seasonal_signal"]:
                log(f"  {s['ingredient']:20s}  avg={s['avg_interest']}")
            save_csv(df, "trend_seasonal")
        else:
            feed["seasonal_signal"] = []
            log("No seasonal data returned.")
        time.sleep(SLEEP)
    except Exception as e:
        feed["seasonal_signal"] = []
        log(f"ERROR - {e}")

    # -- C. Related searches for top grill item ---------------------------
    heading("C - Related Searches (smash burger)")
    try:
        top_df, rising_df = fetch_related_queries(pt, "smash burger", geo=geo)
        related = {}
        if top_df is not None and not top_df.empty:
            related["top"] = top_df.head(10).to_dict(orient="records")
            log(f"  Top queries: {len(top_df)} found")
            save_csv(top_df, "related_top_smash_burger")
        if rising_df is not None and not rising_df.empty:
            related["rising"] = rising_df.head(10).to_dict(orient="records")
            log(f"  Rising queries: {len(rising_df)} found")
            save_csv(rising_df, "related_rising_smash_burger")
        feed["related_searches"] = related
        time.sleep(SLEEP)
    except Exception as e:
        feed["related_searches"] = {}
        log(f"ERROR - {e}")

    # -- D. Regional demand for key items ---------------------------------
    heading("D - Regional Demand (UK)")
    try:
        top_items = ["smash burger", "loaded fries", "chicken wings",
                     "bubble tea", "korean street food"]
        df = fetch_regional_interest(pt, top_items, geo=geo)
        if not df.empty:
            feed["regional_demand"] = {}
            for region in df.index:
                row = df.loc[region]
                geo_code = row.get("geoCode", "")
                scores = {col: int(row[col]) for col in top_items if col in df.columns}
                feed["regional_demand"][region] = {
                    "geoCode": geo_code,
                    "scores": scores,
                }
            log(df.to_string())
            save_csv(df, "regional_demand")
        else:
            feed["regional_demand"] = {}
            log("No regional data returned.")
        time.sleep(SLEEP)
    except Exception as e:
        feed["regional_demand"] = {}
        log(f"ERROR - {e}")

    # -- E. General trending searches (not food-specific) -----------------
    heading("E - Today's Trending Searches (GB)")
    try:
        titles = fetch_trending_rss(geo=geo[:2])
        if titles:
            feed["general_trending"] = titles[:20]
            for t in titles[:10]:
                log(f"  {t}")
            if len(titles) > 10:
                log(f"  ... and {len(titles) - 10} more")
        else:
            feed["general_trending"] = []
    except Exception as e:
        feed["general_trending"] = []
        log(f"ERROR - {e}")

    return feed


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    global OUTPUT_DIR

    parser = argparse.ArgumentParser(
        description="SmarTR Food Step 3: Pull live food trends from Google"
    )
    parser.add_argument(
        "--region", default="GB",
        help="Google Trends geo code (GB, GB-ENG, GB-WLS, GB-SCT, GB-NIR)"
    )
    parser.add_argument(
        "--output-dir", default=None,
        help="Directory for CSV and JSON output (default: trends_output)"
    )
    args = parser.parse_args()

    if args.output_dir is not None:
        OUTPUT_DIR = args.output_dir
    ensure_output_dir()

    geo = args.region.upper()

    print()
    print("=" * 64)
    print("  Taste Rover -- SmarTR Food Step 3: Live Food Trends")
    print("=" * 64)
    print(f"  Time:     {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Region:   {geo}")
    print(f"  Category: Food & Drink (cat={FOOD_DRINK_CAT})")
    print(f"  Output:   ./{OUTPUT_DIR}/")

    pt = TrendReq(hl=LANGUAGE, tz=TIMEZONE, timeout=(10, 30),
                  retries=3, backoff_factor=1.0)

    feed = build_trends_feed(pt, geo=geo)

    # -- Save the master JSON for the pipeline ----------------------------
    heading("OUTPUT")
    json_path = save_json(feed, "trends_feed")
    print()
    log("This JSON replaces the hardcoded MOCK data in Step 3.")
    log("Import it in your menu engine:")
    log("")
    log('  import json')
    log('  with open("trends_output/trends_feed.json") as f:')
    log('      trends = json.load(f)')
    log("")
    log("Key fields for the menu proposal:")
    log(f"  trends['rising_foods']    -> {len(feed.get('rising_foods', []))} items trending up")
    log(f"  trends['declining_foods'] -> {len(feed.get('declining_foods', []))} items trending down")
    log(f"  trends['seasonal_signal'] -> {len(feed.get('seasonal_signal', []))} seasonal ingredients")
    log(f"  trends['regional_demand'] -> {len(feed.get('regional_demand', {}))} UK regions")
    print()


if __name__ == "__main__":
    main()