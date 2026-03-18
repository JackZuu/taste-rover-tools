import { useState, useEffect } from "react";

const G = {
  green:      "#1a5f3f",
  greenLight: "#2d8659",
  cream:      "#f5f1e8",
  card:       "rgba(255,255,255,0.97)",
  red:        "#c41e3a",
  amber:      "#d97706",
};

const bg: React.CSSProperties = {
  minHeight: "100vh",
  background: `linear-gradient(135deg,${G.green} 0%,${G.greenLight} 100%)`,
  fontFamily: "'Georgia', serif",
  padding: "16px",
};

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: "rgba(255,255,255,0.2)", border: "none", color: G.cream,
      padding: "10px 20px", borderRadius: "50px", cursor: "pointer",
      fontSize: "clamp(12px,3vw,14px)", fontWeight: "600", marginBottom: "16px",
      WebkitTapHighlightColor: "transparent",
    }}>
      ← Back to SmarTR Food
    </button>
  );
}

function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ textAlign: "center", padding: "0 16px 20px", color: G.cream }}>
      <div style={{ fontSize: "clamp(24px,6vw,32px)", fontWeight: "bold", letterSpacing: "1px", marginBottom: "4px" }}>
        {title}
      </div>
      {sub && <div style={{ fontSize: "clamp(13px,3.5vw,15px)", fontStyle: "italic", opacity: 0.85 }}>{sub}</div>}
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: G.card, borderRadius: "16px", padding: "20px 22px",
      marginBottom: "14px", boxShadow: "0 4px 14px rgba(26,95,63,0.09)",
      ...style,
    }}>
      {children}
    </div>
  );
}

function RunBtn({ onClick, loading, label, disabled }: { onClick: () => void; loading: boolean; label?: string; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={loading || disabled} style={{
      background: (loading || disabled) ? "#ccc" : G.green,
      color: "#fff", border: "none", borderRadius: "10px",
      padding: "11px 24px", fontSize: "14px", fontWeight: "700",
      cursor: (loading || disabled) ? "not-allowed" : "pointer",
      fontFamily: "'Georgia',serif", WebkitTapHighlightColor: "transparent",
      transition: "background 0.2s",
    }}>
      {loading ? "Loading…" : (label ?? "Refresh")}
    </button>
  );
}

function ErrBox({ msg }: { msg: string }) {
  return (
    <div style={{
      background: "#fdecea", border: `1px solid ${G.red}`, borderRadius: "10px",
      padding: "12px 16px", color: G.red, fontSize: "13px", marginTop: "12px",
    }}>
      {msg}
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  const live = source === "google_trends" || source === "openai";
  return (
    <span style={{
      display: "inline-block", fontSize: "10px", fontWeight: "600",
      color: live ? G.green : "#888",
      background: live ? "#e6f4ee" : "#f0f0f0",
      border: `1px solid ${live ? "#b2d8c5" : "#ddd"}`,
      borderRadius: "4px", padding: "1px 7px", marginLeft: "8px",
      textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "monospace",
    }}>
      {live ? (source === "google_trends" ? "Live · Google Trends" : "Live · OpenAI") : "Mock data"}
    </span>
  );
}

const UK_REGIONS = [
  { label: "London",          postcode: "SW1A 1AA" },
  { label: "South East",      postcode: "RH1 1AA" },
  { label: "South West",      postcode: "BS1 4ST" },
  { label: "East of England", postcode: "CB2 1TN" },
  { label: "East Midlands",   postcode: "NG1 5FB" },
  { label: "West Midlands",   postcode: "B1 1BB" },
  { label: "Yorks & Humber",  postcode: "LS1 3AA" },
  { label: "North West",      postcode: "M1 1AE" },
  { label: "North East",      postcode: "NE1 7RU" },
  { label: "Wales",           postcode: "CF10 3NQ" },
  { label: "Scotland",        postcode: "EH1 1YZ" },
  { label: "N. Ireland",      postcode: "BT1 2LA" },
];

// ─────────────────────────────────────────────────────────────────────────────
// 1. TRENDS SCREEN
// ─────────────────────────────────────────────────────────────────────────────

type TrendItem = { label: string; direction: "up" | "down" | "stable"; category: string; momentum_pct?: number; avg_interest?: number };
type TrendsData = { trends: TrendItem[]; source: string };

function TrendBadge({ t }: { t: TrendItem }) {
  const icon = t.direction === "up" ? "📈" : t.direction === "down" ? "📉" : "➡️";
  const bg2 = t.direction === "up" ? "#e6f4ee" : t.direction === "down" ? "#fdecea" : "#f0f0f0";
  const col = t.direction === "up" ? G.green   : t.direction === "down" ? G.red     : "#555";
  return (
    <div style={{ padding: "10px 14px", borderRadius: "10px", background: bg2, marginBottom: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "14px", fontWeight: "700", color: col }}>{icon} {t.label}</span>
        {t.momentum_pct !== undefined && (
          <span style={{ fontSize: "12px", fontWeight: "600", color: col }}>
            {t.momentum_pct > 0 ? "+" : ""}{t.momentum_pct}%
          </span>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2px" }}>
        <span style={{ fontSize: "11px", color: "#888", textTransform: "capitalize" }}>{t.category}</span>
        {t.avg_interest !== undefined && (
          <span style={{ fontSize: "11px", color: "#aaa" }}>Interest: {t.avg_interest}</span>
        )}
      </div>
    </div>
  );
}

function TrendsGrid({ data }: { data: TrendsData }) {
  const rising  = data.trends.filter(t => t.direction === "up");
  const stable  = data.trends.filter(t => t.direction === "stable");
  const falling = data.trends.filter(t => t.direction === "down");
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "16px" }}>
      {rising.length > 0 && (
        <Card>
          <div style={{ fontWeight: "700", color: G.green, marginBottom: "12px", fontSize: "14px" }}>
            📈 Rising ({rising.length})
          </div>
          {rising.map((t, i) => <TrendBadge key={i} t={t} />)}
        </Card>
      )}
      {stable.length > 0 && (
        <Card>
          <div style={{ fontWeight: "700", color: "#555", marginBottom: "12px", fontSize: "14px" }}>
            ➡️ Stable ({stable.length})
          </div>
          {stable.map((t, i) => <TrendBadge key={i} t={t} />)}
        </Card>
      )}
      {falling.length > 0 && (
        <Card>
          <div style={{ fontWeight: "700", color: G.red, marginBottom: "12px", fontSize: "14px" }}>
            📉 Declining ({falling.length})
          </div>
          {falling.map((t, i) => <TrendBadge key={i} t={t} />)}
        </Card>
      )}
      {rising.length === 0 && stable.length === 0 && falling.length === 0 && (
        <Card><div style={{ color: "#aaa", fontStyle: "italic", textAlign: "center" }}>No trend data returned.</div></Card>
      )}
    </div>
  );
}

export function TrendsScreen({ onBack }: { onBack: () => void }) {
  const [data, setData] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom keyword search
  const [customInput, setCustomInput] = useState("");
  const [customData, setCustomData] = useState<TrendsData | null>(null);
  const [customLoading, setCustomLoading] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);

  async function fetch_() {
    setLoading(true); setError(null);
    try {
      const r = await fetch("/api/trends");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setData(await r.json());
    } catch (e: any) { setError(e?.message ?? "Failed to load"); }
    finally { setLoading(false); }
  }

  async function runCustom() {
    const keywords = customInput.split(",").map(k => k.trim()).filter(Boolean);
    if (!keywords.length) return;
    setCustomLoading(true); setCustomError(null); setCustomData(null);
    try {
      const r = await fetch("/api/trends/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setCustomData(await r.json());
    } catch (e: any) { setCustomError(e?.message ?? "Failed to load"); }
    finally { setCustomLoading(false); }
  }

  useEffect(() => { fetch_(); }, []);

  return (
    <div style={bg}>
      <BackBtn onClick={onBack} />
      <PageTitle title="Food & Drink Trends" sub="UK consumer search interest" />
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>

        {/* Custom keyword search */}
        <Card>
          <div style={{ fontWeight: "700", color: G.green, marginBottom: "10px", fontSize: "14px" }}>
            🔍 Custom Keyword Search
          </div>
          <div style={{ fontSize: "12px", color: "#888", marginBottom: "10px" }}>
            Enter up to 5 keywords separated by commas to see their Google Trends performance.
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <input
              type="text"
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && runCustom()}
              placeholder="e.g. birria tacos, smash burger, matcha"
              style={{
                flex: 1, minWidth: "200px", padding: "9px 12px",
                border: "1.5px solid #ddd", borderRadius: "8px",
                fontSize: "13px", fontFamily: "'Georgia',serif", outline: "none",
              }}
            />
            <RunBtn onClick={runCustom} loading={customLoading} label="Search" />
          </div>
          {customError && <ErrBox msg={customError} />}
          {customData && (
            <div style={{ marginTop: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#555" }}>Results</div>
                <SourceBadge source={customData.source} />
              </div>
              <TrendsGrid data={customData} />
            </div>
          )}
        </Card>

        {/* Pre-built trend categories */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "4px 0 16px" }}>
          <div style={{ fontSize: "14px", fontWeight: "700", color: G.cream }}>Category Trends</div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {data && <SourceBadge source={data.source} />}
            <RunBtn onClick={fetch_} loading={loading} />
          </div>
        </div>
        {error && <ErrBox msg={error} />}
        {data && <TrendsGrid data={data} />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. HISTORIC SCREEN
// ─────────────────────────────────────────────────────────────────────────────

type HistoricTopMeal  = { meal_name: string; category: string; total_qty: number; total_revenue_gbp: number; pct_of_total: number };
type HistoricDailyStat = { date: string; total_covers: number; total_revenue_gbp: number; top_meal: string };
type HistoricData = {
  daily_stats: HistoricDailyStat[];
  top_meals: HistoricTopMeal[];
  total_revenue_gbp: number;
  avg_daily_covers: number;
  best_day: string;
  source: string;
};

export function HistoricScreen({ onBack }: { onBack: () => void }) {
  const [data, setData] = useState<HistoricData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetch_() {
    setLoading(true); setError(null);
    try {
      const r = await fetch("/api/historic");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setData(await r.json());
    } catch (e: any) { setError(e?.message ?? "Failed to load"); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetch_(); }, []);

  const maxRev = data ? Math.max(...data.top_meals.map(m => m.total_revenue_gbp)) : 1;
  const maxCovers = data ? Math.max(...data.daily_stats.map(d => d.total_covers)) : 1;

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }

  return (
    <div style={bg}>
      <BackBtn onClick={onBack} />
      <PageTitle title="Historic Sales Data" sub="Last 30 days — Taste Rover operations" />
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <RunBtn onClick={fetch_} loading={loading} />
          {data && <SourceBadge source={data.source} />}
        </div>
        {error && <ErrBox msg={error} />}
        {data && (
          <>
            {/* Summary stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "12px", marginBottom: "16px" }}>
              {[
                { label: "Total Revenue (30d)", val: `£${data.total_revenue_gbp.toLocaleString("en-GB", { minimumFractionDigits: 2 })}` },
                { label: "Avg Daily Covers",    val: `${data.avg_daily_covers}` },
                { label: "Best Day Revenue",    val: fmtDate(data.best_day) },
              ].map(stat => (
                <div key={stat.label} style={{ background: G.card, borderRadius: "12px", padding: "14px 16px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>{stat.label}</div>
                  <div style={{ fontSize: "22px", fontWeight: "bold", color: G.green }}>{stat.val}</div>
                </div>
              ))}
            </div>

            {/* Top meals */}
            <Card>
              <div style={{ fontWeight: "700", color: G.green, marginBottom: "14px", fontSize: "15px" }}>Top Meals by Revenue (30 days)</div>
              {data.top_meals.map((m, i) => (
                <div key={i} style={{ marginBottom: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#333" }}>
                      {i + 1}. {m.meal_name}
                      <span style={{ fontSize: "11px", color: "#aaa", fontWeight: "400", marginLeft: "6px" }}>{m.category}</span>
                    </span>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: G.green }}>£{m.total_revenue_gbp.toLocaleString()}</span>
                  </div>
                  <div style={{ height: "8px", background: "#f0f0f0", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: "4px",
                      background: i === 0 ? G.green : i < 3 ? G.greenLight : "#a0c4b0",
                      width: `${(m.total_revenue_gbp / maxRev * 100).toFixed(1)}%`,
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                  <div style={{ fontSize: "10px", color: "#aaa", marginTop: "2px" }}>{m.total_qty} covers · {m.pct_of_total}% of revenue</div>
                </div>
              ))}
            </Card>

            {/* Daily covers chart */}
            <Card>
              <div style={{ fontWeight: "700", color: G.green, marginBottom: "14px", fontSize: "15px" }}>Daily Covers — Last 14 Days</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "80px" }}>
                {data.daily_stats.map((d, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                    <div style={{ fontSize: "9px", color: "#aaa", fontWeight: "600" }}>{d.total_covers}</div>
                    <div style={{
                      width: "100%", borderRadius: "3px 3px 0 0",
                      background: G.green,
                      height: `${(d.total_covers / maxCovers * 60).toFixed(0)}px`,
                      minHeight: "4px",
                    }} />
                    <div style={{ fontSize: "8px", color: "#bbb", textAlign: "center", lineHeight: "1.1" }}>
                      {fmtDate(d.date)}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. SEASONAL SCREEN
// ─────────────────────────────────────────────────────────────────────────────

type SeasonalItem = { name: string; category: string };
type SeasonalData = { month: string; items: SeasonalItem[]; source: string };

const CAT_EMOJI: Record<string, string> = {
  produce: "🥦", protein: "🥩", dessert: "🍮", seafood: "🐟",
  game: "🦌", beverage: "🍹", dairy: "🧀", grain: "🌾",
};

export function SeasonalScreen({ onBack }: { onBack: () => void }) {
  const [data, setData] = useState<SeasonalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetch_() {
    setLoading(true); setError(null);
    try {
      const r = await fetch("/api/seasonal");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setData(await r.json());
    } catch (e: any) { setError(e?.message ?? "Failed to load"); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetch_(); }, []);

  const grouped = data
    ? data.items.reduce((acc, item) => {
        (acc[item.category] = acc[item.category] ?? []).push(item.name);
        return acc;
      }, {} as Record<string, string[]>)
    : {};

  return (
    <div style={bg}>
      <BackBtn onClick={onBack} />
      <PageTitle title="In-Season Foods" sub={data ? `Currently in season — ${data.month}` : "Seasonal ingredients by month"} />
      <div style={{ maxWidth: "700px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <RunBtn onClick={fetch_} loading={loading} />
          {data && <SourceBadge source={data.source} />}
        </div>
        {error && <ErrBox msg={error} />}
        {data && Object.entries(grouped).map(([cat, names]) => (
          <Card key={cat}>
            <div style={{ fontWeight: "700", color: G.green, marginBottom: "12px", fontSize: "14px", textTransform: "capitalize" }}>
              {CAT_EMOJI[cat] ?? "🌿"} {cat}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {names.map((name, i) => (
                <span key={i} style={{
                  padding: "6px 14px", borderRadius: "20px",
                  background: "#e6f4ee", color: G.green,
                  fontSize: "13px", fontWeight: "600",
                }}>
                  {name}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. CELEBRATIONS SCREEN
// ─────────────────────────────────────────────────────────────────────────────

type FoodSuggestion = { name: string; category: string };
type CelebrationEvent = { name: string; date: string; days_away: number; food_opportunity: string; menu_suggestions?: FoodSuggestion[] };
type CelebrationsData = { upcoming: CelebrationEvent[]; source: string };

export function CelebrationsScreen({ onBack }: { onBack: () => void }) {
  const [data, setData] = useState<CelebrationsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetch_() {
    setLoading(true); setError(null);
    try {
      const r = await fetch("/api/celebrations");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setData(await r.json());
    } catch (e: any) { setError(e?.message ?? "Failed to load"); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetch_(); }, []);

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  }

  function urgencyColor(days: number) {
    if (days <= 7)  return G.red;
    if (days <= 21) return G.amber;
    return G.green;
  }

  return (
    <div style={bg}>
      <BackBtn onClick={onBack} />
      <PageTitle title="Upcoming Events" sub="UK celebrations & food opportunities" />
      <div style={{ maxWidth: "700px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <RunBtn onClick={fetch_} loading={loading} />
          {data && <SourceBadge source={data.source} />}
        </div>
        {error && <ErrBox msg={error} />}
        {data && data.upcoming.map((ev, i) => (
          <Card key={i} style={{ borderLeft: `4px solid ${urgencyColor(ev.days_away)}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "8px" }}>
              <div style={{ fontSize: "16px", fontWeight: "700", color: "#222" }}>{ev.name}</div>
              <div style={{
                flexShrink: 0, padding: "3px 10px", borderRadius: "20px",
                background: urgencyColor(ev.days_away) + "22",
                color: urgencyColor(ev.days_away),
                fontSize: "12px", fontWeight: "700",
              }}>
                {ev.days_away === 0 ? "Today" : `${ev.days_away}d away`}
              </div>
            </div>
            <div style={{ fontSize: "12px", color: "#888", marginBottom: "8px" }}>{fmtDate(ev.date)}</div>
            <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
              {ev.food_opportunity}
            </div>
            {ev.menu_suggestions && ev.menu_suggestions.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {ev.menu_suggestions.map((s, j) => {
                  const catColors: Record<string, [string, string]> = {
                    main:     ["#e6f4ee", G.green],
                    snack:    ["#fdf3e6", "#a16207"],
                    beverage: ["#e0f2fe", "#0369a1"],
                    dessert:  ["#fce7f3", "#9d174d"],
                    produce:  ["#f0fdf4", "#166534"],
                  };
                  const [bg2, col] = catColors[s.category] ?? ["#f0f0f0", "#555"];
                  return (
                    <span key={j} style={{
                      padding: "3px 10px", borderRadius: "20px",
                      background: bg2, color: col,
                      fontSize: "12px", fontWeight: "600",
                    }}>
                      {s.name}
                      <span style={{ fontSize: "10px", opacity: 0.7, marginLeft: "4px" }}>{s.category}</span>
                    </span>
                  );
                })}
              </div>
            )}
          </Card>
        ))}
        {data && data.upcoming.length === 0 && (
          <Card>
            <div style={{ color: "#aaa", fontStyle: "italic", textAlign: "center" }}>No events in the next 90 days.</div>
          </Card>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. REGIONAL SCREEN
// ─────────────────────────────────────────────────────────────────────────────

type RegionalInsight = { insight: string; category: string };
type RegionalData = { region: string; insights: RegionalInsight[]; source: string };

export function RegionalScreen({ onBack }: { onBack: () => void }) {
  const [region, setRegion] = useState("London");
  const [data, setData] = useState<RegionalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(r: string) {
    setLoading(true); setError(null); setData(null);
    try {
      const res = await fetch("/api/regional", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region: r }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e: any) { setError(e?.message ?? "Failed to load"); }
    finally { setLoading(false); }
  }

  useEffect(() => { run("London"); }, []);

  const catColor = (c: string) => c === "demand" ? "#e0eeff" : c === "trend" ? "#e6f4ee" : "#fdf3e6";
  const catLabel = (c: string) => c === "demand" ? "Demand" : c === "trend" ? "Trend" : "Preference";

  return (
    <div style={bg}>
      <BackBtn onClick={onBack} />
      <PageTitle title="Regional Demand" sub="Consumer insights by UK region" />
      <div style={{ maxWidth: "700px", margin: "0 auto" }}>
        <Card>
          <div style={{ fontWeight: "700", color: G.green, marginBottom: "12px", fontSize: "14px" }}>Select Region</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "14px" }}>
            {UK_REGIONS.map(r => (
              <button key={r.label} onClick={() => { setRegion(r.label); run(r.label); }}
                style={{
                  padding: "8px 6px", borderRadius: "8px",
                  border: `2px solid ${region === r.label ? G.green : "#ddd"}`,
                  background: region === r.label ? "#e6f4ee" : "#fafafa",
                  color: region === r.label ? G.green : "#444",
                  fontSize: "12px", fontWeight: region === r.label ? "700" : "500",
                  cursor: "pointer", fontFamily: "'Georgia',serif",
                  WebkitTapHighlightColor: "transparent",
                }}>
                {r.label}
              </button>
            ))}
          </div>
          <RunBtn onClick={() => run(region)} loading={loading} label={`Get Insights for ${region}`} />
        </Card>
        {error && <ErrBox msg={error} />}
        {data && (
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
              <div style={{ fontWeight: "700", color: G.green, fontSize: "15px" }}>
                Insights for {data.region}
              </div>
              <SourceBadge source={data.source} />
            </div>
            {data.insights.map((ins, i) => (
              <div key={i} style={{
                display: "flex", gap: "10px", alignItems: "flex-start",
                padding: "8px 0",
                borderBottom: i < data.insights.length - 1 ? "1px solid #f0f0f0" : "none",
              }}>
                <span style={{
                  padding: "2px 8px", borderRadius: "10px",
                  background: catColor(ins.category),
                  fontSize: "10px", fontWeight: "600", color: "#555",
                  flexShrink: 0, marginTop: "2px",
                }}>
                  {catLabel(ins.category)}
                </span>
                <span style={{ fontSize: "13px", color: "#333", lineHeight: "1.5" }}>{ins.insight}</span>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. EQUIPMENT SCREEN
// ─────────────────────────────────────────────────────────────────────────────

type Van = { id: string; name: string; base_location: string; postcode: string };
type EqItem = { name: string; available: boolean };
type VanEqData = { van: Van; equipment: EqItem[]; available_count: number; total_count: number };

export function EquipmentScreen({ onBack }: { onBack: () => void }) {
  const [vans, setVans] = useState<Van[]>([]);
  const [vanId, setVanId] = useState("van_alpha");
  const [data, setData] = useState<VanEqData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/vans").then(r => r.json()).then(d => {
      if (d.vans) { setVans(d.vans); setVanId(d.vans[0]?.id ?? "van_alpha"); }
    }).catch(() => {});
    run("van_alpha");
  }, []);

  async function run(id: string) {
    setLoading(true); setError(null);
    try {
      const r = await fetch("/api/equipment/van", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ van_id: id }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setData(await r.json());
    } catch (e: any) { setError(e?.message ?? "Failed to load"); }
    finally { setLoading(false); }
  }

  const allOk = data ? data.available_count === data.total_count : false;

  return (
    <div style={bg}>
      <BackBtn onClick={onBack} />
      <PageTitle title="Equipment Status" sub="Van readiness check" />
      <div style={{ maxWidth: "700px", margin: "0 auto" }}>
        <Card>
          <div style={{ fontWeight: "700", color: G.green, marginBottom: "12px", fontSize: "14px" }}>Select Van</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
            {vans.map(v => (
              <button key={v.id} onClick={() => { setVanId(v.id); run(v.id); }}
                style={{
                  padding: "10px 14px", borderRadius: "10px", textAlign: "left",
                  border: `2px solid ${vanId === v.id ? G.green : "#ddd"}`,
                  background: vanId === v.id ? "#e6f4ee" : "#fafafa",
                  cursor: "pointer", fontFamily: "'Georgia',serif",
                  WebkitTapHighlightColor: "transparent",
                }}>
                <div style={{ fontSize: "13px", fontWeight: "700", color: vanId === v.id ? G.green : "#333" }}>🚐 {v.name}</div>
                <div style={{ fontSize: "11px", color: "#888" }}>{v.base_location}</div>
              </button>
            ))}
          </div>
          <RunBtn onClick={() => run(vanId)} loading={loading} label="Check Equipment" />
        </Card>
        {error && <ErrBox msg={error} />}
        {data && (
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px", flexWrap: "wrap" }}>
              <div style={{ fontWeight: "700", color: G.green, fontSize: "15px" }}>{data.van.name}</div>
              <span style={{
                padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "600",
                background: allOk ? "#e6f4ee" : "#fdecea",
                color: allOk ? G.green : G.red,
                border: `1px solid ${allOk ? "#b2d8c5" : "#f5c6c2"}`,
              }}>
                {allOk ? "✓ All Ready" : "✗ Items Missing"}
              </span>
              <span style={{ fontSize: "12px", color: "#888", marginLeft: "auto" }}>
                {data.available_count}/{data.total_count} available
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: "6px" }}>
              {data.equipment.map((e, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "6px 10px", borderRadius: "8px",
                  background: e.available ? "#e6f4ee" : "#fdecea",
                  fontSize: "12px", fontWeight: "500",
                  color: e.available ? G.green : G.red,
                }}>
                  <span>{e.available ? "✓" : "✗"}</span> {e.name}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. SUPPLY SCREEN
// ─────────────────────────────────────────────────────────────────────────────

type Supplier = { name: string; distance_miles: number; lead_time_hours: number; categories: string[]; reliability_pct: number };
type InvItem  = { name: string; category: string; status: "in_stock" | "low" | "out" };
type SupplyData = { suppliers: Supplier[]; inventory: InvItem[] };

function StatusDot({ status }: { status: string }) {
  const color = status === "in_stock" ? G.green : status === "low" ? G.amber : G.red;
  const label = status === "in_stock" ? "In stock" : status === "low" ? "Low" : "Out";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: "600", color }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, display: "inline-block" }} />
      {label}
    </span>
  );
}

export function SupplyScreen({ onBack }: { onBack: () => void }) {
  const [data, setData] = useState<SupplyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetch_() {
    setLoading(true); setError(null);
    try {
      const r = await fetch("/api/supply/chain");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setData(await r.json());
    } catch (e: any) { setError(e?.message ?? "Failed to load"); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetch_(); }, []);

  return (
    <div style={bg}>
      <BackBtn onClick={onBack} />
      <PageTitle title="Supply Chain & Inventory" sub="Suppliers and ingredient stock levels" />
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ marginBottom: "16px" }}>
          <RunBtn onClick={fetch_} loading={loading} />
        </div>
        {error && <ErrBox msg={error} />}
        {data && (
          <>
            <Card>
              <div style={{ fontWeight: "700", color: G.green, marginBottom: "14px", fontSize: "15px" }}>Nearby Suppliers</div>
              {data.suppliers.map((s, i) => (
                <div key={i} style={{
                  padding: "10px 12px", background: "#f9f9f9", borderRadius: "10px",
                  marginBottom: "8px", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-start",
                }}>
                  <div style={{ flex: 1, minWidth: "140px" }}>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: "#222" }}>{s.name}</div>
                    <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>{s.categories.join(" · ")}</div>
                  </div>
                  <div style={{ display: "flex", gap: "14px", fontSize: "12px", color: "#666", flexShrink: 0, alignItems: "center" }}>
                    <span>📍 {s.distance_miles} mi</span>
                    <span>⏱ {s.lead_time_hours}h</span>
                    <span style={{
                      fontWeight: "700",
                      color: s.reliability_pct >= 90 ? G.green : s.reliability_pct >= 75 ? G.amber : G.red,
                    }}>
                      ⭐ {s.reliability_pct}%
                    </span>
                  </div>
                </div>
              ))}
            </Card>
            <Card>
              <div style={{ fontWeight: "700", color: G.green, marginBottom: "14px", fontSize: "15px" }}>Ingredient Inventory</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: "6px" }}>
                {data.inventory.map((item, i) => (
                  <div key={i} style={{
                    padding: "6px 10px", background: "#f9f9f9", borderRadius: "8px",
                    display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px",
                  }}>
                    <span style={{ fontSize: "12px", color: "#333" }}>{item.name}</span>
                    <StatusDot status={item.status} />
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
