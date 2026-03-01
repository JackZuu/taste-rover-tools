import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type WeatherDay = { date: string; avg_temp: number; mainly: string };

type WeatherResult = {
  avg_temp: number;
  condition: string;
  is_rainy: boolean;
};

type DecisionResult = {
  meal: string;
  reason: string;
};

type NutritionItem = {
  ingredient: string;
  assumed_amount: string;
  calories_kcal: number;
  notes: string;
};

type NutritionResult = {
  items: NutritionItem[];
  total_calories_kcal: number;
  error?: string;
};

type SupplyIngredient = { name: string; quantity: string; available: boolean };
type SupplyResult = { ingredients: SupplyIngredient[]; all_available: boolean };

type EquipmentItem = { name: string; available: boolean };
type EquipmentResult = { equipment: EquipmentItem[]; all_ready: boolean };

type StepStatus = "idle" | "loading" | "done" | "error";

// ─── UK Region → Representative postcode ─────────────────────────────────────

const UK_REGIONS: { label: string; postcode: string }[] = [
  { label: "London",           postcode: "SW1A 1AA" },
  { label: "South East",       postcode: "RH1 1AA"  },
  { label: "South West",       postcode: "BS1 4ST"  },
  { label: "East of England",  postcode: "CB2 1TN"  },
  { label: "East Midlands",    postcode: "NG1 5FB"  },
  { label: "West Midlands",    postcode: "B1 1BB"   },
  { label: "Yorks & Humber",   postcode: "LS1 3AA"  },
  { label: "North West",       postcode: "M1 1AE"   },
  { label: "North East",       postcode: "NE1 7RU"  },
  { label: "Wales",            postcode: "CF10 3NQ" },
  { label: "Scotland",         postcode: "EH1 1YZ"  },
  { label: "N. Ireland",       postcode: "BT1 2LA"  },
];

// ─── Decision logic (mirrors backend decision.py) ─────────────────────────────

function makeDecision(weather: WeatherResult): DecisionResult {
  if (weather.avg_temp > 15 && !weather.is_rainy) {
    return {
      meal: "strawberry ice cream",
      reason: `${weather.avg_temp.toFixed(1)}°C and ${weather.condition} — warm and dry, perfect for something cold and refreshing!`,
    };
  }
  const parts: string[] = [];
  if (weather.avg_temp <= 15) parts.push(`${weather.avg_temp.toFixed(1)}°C`);
  if (weather.is_rainy) parts.push(weather.condition);
  return {
    meal: "tomato soup",
    reason: `${parts.join(" and ")} — chilly or wet weather calls for something warming!`,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COLORS = {
  green:       "#1a5f3f",
  greenLight:  "#2d8659",
  cream:       "#f5f1e8",
  cardBg:      "rgba(255,255,255,0.97)",
  errorRed:    "#c41e3a",
};

function getConditionIcon(condition: string) {
  if (condition === "mainly sun")  return "☀️";
  if (condition === "mainly rain") return "🌧️";
  return "☁️";
}

function formatDateLabel(isoDate: string) {
  const d = new Date(isoDate);
  const today    = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString())    return "Today";
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function getNextFiveDates(): string[] {
  const dates: string[] = [];
  const base = new Date();
  for (let i = 0; i < 5; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({
  step,
  title,
  status,
  children,
}: {
  step: number;
  title: string;
  status: StepStatus;
  children?: React.ReactNode;
}) {
  const borderColor =
    status === "done"    ? COLORS.green :
    status === "error"   ? COLORS.errorRed :
    status === "loading" ? "#aaa" :
    "#e0e0e0";

  return (
    <div style={{
      background: COLORS.cardBg,
      borderRadius: "16px",
      border: `2px solid ${borderColor}`,
      padding: "20px 24px",
      marginBottom: "16px",
      boxShadow: status === "done" ? "0 4px 16px rgba(26,95,63,0.10)" : "0 2px 8px rgba(0,0,0,0.06)",
      transition: "border-color 0.3s, box-shadow 0.3s",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: children ? "16px" : 0,
      }}>
        <div style={{
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          background: status === "done" ? COLORS.green : status === "error" ? COLORS.errorRed : "#ddd",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "13px",
          fontWeight: "700",
          flexShrink: 0,
          transition: "background 0.3s",
        }}>
          {status === "loading" ? "…" : step}
        </div>
        <div style={{
          fontSize: "clamp(15px, 3.5vw, 17px)",
          fontWeight: "700",
          color: status === "done" ? COLORS.green : status === "error" ? COLORS.errorRed : "#999",
          letterSpacing: "0.5px",
          transition: "color 0.3s",
        }}>
          {title}
        </div>
        {status === "loading" && (
          <div style={{ marginLeft: "auto", fontSize: "13px", color: "#999", fontStyle: "italic" }}>
            Loading…
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: "12px",
      fontSize: "12px",
      fontWeight: "600",
      background: ok ? "#e6f4ee" : "#fdecea",
      color: ok ? COLORS.green : COLORS.errorRed,
      border: `1px solid ${ok ? "#b2d8c5" : "#f5c6c2"}`,
    }}>
      {ok ? "✓ Ready" : "✗ Missing"}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function FlowScreen({ onBack }: { onBack: () => void }) {
  // ── Input state ──────────────────────────────────────────────────────────
  const [inputMode, setInputMode] = useState<"postcode" | "region">("postcode");
  const [postcodeInput, setPostcodeInput] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(getNextFiveDates()[0]);

  // Resolved postcode used for API calls
  const activePostcode =
    inputMode === "postcode"
      ? postcodeInput.trim()
      : UK_REGIONS.find((r) => r.label === selectedRegion)?.postcode ?? "";

  // ── Pipeline state ────────────────────────────────────────────────────────
  const [weatherStatus,   setWeatherStatus]   = useState<StepStatus>("idle");
  const [weatherResult,   setWeatherResult]   = useState<WeatherResult | null>(null);
  const [weatherError,    setWeatherError]    = useState<string | null>(null);

  const [decisionResult,  setDecisionResult]  = useState<DecisionResult | null>(null);

  const [nutritionStatus, setNutritionStatus] = useState<StepStatus>("idle");
  const [nutritionResult, setNutritionResult] = useState<NutritionResult | null>(null);
  const [nutritionError,  setNutritionError]  = useState<string | null>(null);

  const [supplyStatus,    setSupplyStatus]    = useState<StepStatus>("idle");
  const [supplyResult,    setSupplyResult]    = useState<SupplyResult | null>(null);
  const [supplyError,     setSupplyError]     = useState<string | null>(null);

  const [equipmentStatus, setEquipmentStatus] = useState<StepStatus>("idle");
  const [equipmentResult, setEquipmentResult] = useState<EquipmentResult | null>(null);
  const [equipmentError,  setEquipmentError]  = useState<string | null>(null);

  const [flowRunning, setFlowRunning] = useState(false);

  // ── Reset ─────────────────────────────────────────────────────────────────
  function resetPipeline() {
    setWeatherStatus("idle");   setWeatherResult(null);   setWeatherError(null);
    setDecisionResult(null);
    setNutritionStatus("idle"); setNutritionResult(null); setNutritionError(null);
    setSupplyStatus("idle");    setSupplyResult(null);    setSupplyError(null);
    setEquipmentStatus("idle"); setEquipmentResult(null); setEquipmentError(null);
  }

  // ── Run flow ──────────────────────────────────────────────────────────────
  async function runFlow() {
    if (!activePostcode) return;
    resetPipeline();
    setFlowRunning(true);

    // Step 1: Weather
    setWeatherStatus("loading");
    let weather: WeatherResult | null = null;
    try {
      const res = await fetch("/api/weather", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postcode: activePostcode }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Find the chosen day in the forecast
      const dayEntry: WeatherDay | undefined = (data.forecast ?? []).find(
        (d: WeatherDay) => d.date === selectedDate
      );
      if (!dayEntry) throw new Error(`No forecast data for ${selectedDate}. Try a date within the next 5 days.`);

      weather = {
        avg_temp:  dayEntry.avg_temp,
        condition: dayEntry.mainly,
        is_rainy:  dayEntry.mainly === "mainly rain",
      };
      setWeatherResult(weather);
      setWeatherStatus("done");
    } catch (e: any) {
      setWeatherError(e?.message ?? "Failed to fetch weather");
      setWeatherStatus("error");
      setFlowRunning(false);
      return;
    }

    // Step 2: Decision (pure client-side)
    const decision = makeDecision(weather);
    setDecisionResult(decision);

    // Step 3: Nutrition
    setNutritionStatus("loading");
    try {
      const res = await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: [`1 standard serving of ${decision.meal}`] }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: NutritionResult = await res.json();
      if (data.error) throw new Error(data.error);
      setNutritionResult(data);
      setNutritionStatus("done");
    } catch (e: any) {
      setNutritionError(e?.message ?? "Failed to fetch nutrition");
      setNutritionStatus("error");
    }

    // Step 4: Supply
    setSupplyStatus("loading");
    try {
      const res = await fetch("/api/supply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meal: decision.meal }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: SupplyResult = await res.json();
      setSupplyResult(data);
      setSupplyStatus("done");
    } catch (e: any) {
      setSupplyError(e?.message ?? "Failed to fetch supply data");
      setSupplyStatus("error");
    }

    // Step 5: Equipment
    setEquipmentStatus("loading");
    try {
      const res = await fetch("/api/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meal: decision.meal }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: EquipmentResult = await res.json();
      setEquipmentResult(data);
      setEquipmentStatus("done");
    } catch (e: any) {
      setEquipmentError(e?.message ?? "Failed to fetch equipment data");
      setEquipmentStatus("error");
    }

    setFlowRunning(false);
  }

  const dates = getNextFiveDates();
  const canRun = !flowRunning && (
    inputMode === "postcode" ? postcodeInput.trim().length > 0 : selectedRegion !== null
  );

  const allDone =
    weatherStatus === "done" &&
    decisionResult !== null &&
    nutritionStatus === "done" &&
    supplyStatus    === "done" &&
    equipmentStatus === "done";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${COLORS.green} 0%, ${COLORS.greenLight} 100%)`,
      fontFamily: "'Georgia', serif",
      padding: "16px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
        <button
          onClick={onBack}
          style={{
            background: "rgba(255,255,255,0.2)",
            border: "none",
            color: COLORS.cream,
            padding: "10px 20px",
            borderRadius: "50px",
            cursor: "pointer",
            fontSize: "clamp(12px,3vw,14px)",
            fontWeight: "600",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          ← Back
        </button>
        <div>
          <div style={{
            fontSize: "clamp(22px,5.5vw,32px)",
            fontWeight: "bold",
            color: COLORS.cream,
            letterSpacing: "2px",
            textTransform: "uppercase",
          }}>
            Meal Flow
          </div>
          <div style={{ fontSize: "clamp(12px,3vw,14px)", color: COLORS.cream, opacity: 0.85, fontStyle: "italic" }}>
            Weather → Decision → Nutrition → Supply → Equipment
          </div>
        </div>
      </div>

      {/* Two-panel layout */}
      <div style={{
        display: "flex",
        gap: "20px",
        alignItems: "flex-start",
        flexWrap: "wrap",
      }}>
        {/* ── LEFT SIDEBAR ─────────────────────────────────────────────────── */}
        <div style={{
          background: COLORS.cardBg,
          borderRadius: "20px",
          padding: "24px",
          width: "clamp(260px, 28vw, 300px)",
          flexShrink: 0,
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        }}>
          <div style={{ fontWeight: "700", color: COLORS.green, fontSize: "15px", marginBottom: "16px", letterSpacing: "0.5px" }}>
            INPUTS
          </div>

          {/* Location mode tabs */}
          <div style={{
            display: "flex",
            borderRadius: "10px",
            overflow: "hidden",
            border: `2px solid ${COLORS.green}`,
            marginBottom: "14px",
          }}>
            {(["postcode", "region"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => { setInputMode(mode); resetPipeline(); }}
                style={{
                  flex: 1,
                  padding: "8px",
                  border: "none",
                  background: inputMode === mode ? COLORS.green : "transparent",
                  color: inputMode === mode ? "#fff" : COLORS.green,
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer",
                  fontFamily: "'Georgia', serif",
                  transition: "all 0.2s",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                {mode === "postcode" ? "Postcode" : "UK Region"}
              </button>
            ))}
          </div>

          {/* Postcode input */}
          {inputMode === "postcode" && (
            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>
                UK Postcode
              </label>
              <input
                value={postcodeInput}
                onChange={(e) => { setPostcodeInput(e.target.value); resetPipeline(); }}
                placeholder="e.g. SW1A 1AA"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: `2px solid #e0e0e0`,
                  borderRadius: "10px",
                  fontSize: "15px",
                  outline: "none",
                  fontFamily: "'Georgia', serif",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = COLORS.green)}
                onBlur={(e)  => (e.currentTarget.style.borderColor = "#e0e0e0")}
              />
            </div>
          )}

          {/* Region selector */}
          {inputMode === "region" && (
            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "8px" }}>
                Select a UK region
              </label>
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "6px",
              }}>
                {UK_REGIONS.map((r) => (
                  <button
                    key={r.label}
                    onClick={() => { setSelectedRegion(r.label); resetPipeline(); }}
                    title={r.postcode}
                    style={{
                      padding: "7px 4px",
                      borderRadius: "8px",
                      border: `2px solid ${selectedRegion === r.label ? COLORS.green : "#ddd"}`,
                      background: selectedRegion === r.label ? "#e6f4ee" : "#fafafa",
                      color: selectedRegion === r.label ? COLORS.green : "#444",
                      fontSize: "11.5px",
                      fontWeight: selectedRegion === r.label ? "700" : "500",
                      cursor: "pointer",
                      fontFamily: "'Georgia', serif",
                      textAlign: "center",
                      transition: "all 0.15s",
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              {selectedRegion && (
                <div style={{ fontSize: "11px", color: "#888", marginTop: "8px", textAlign: "center" }}>
                  Using postcode: <strong>{UK_REGIONS.find(r => r.label === selectedRegion)?.postcode}</strong>
                </div>
              )}
            </div>
          )}

          {/* Day selector */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "8px" }}>
              Day
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              {dates.map((d) => (
                <button
                  key={d}
                  onClick={() => { setSelectedDate(d); resetPipeline(); }}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: `2px solid ${selectedDate === d ? COLORS.green : "#ddd"}`,
                    background: selectedDate === d ? "#e6f4ee" : "#fafafa",
                    color: selectedDate === d ? COLORS.green : "#444",
                    fontSize: "13px",
                    fontWeight: selectedDate === d ? "700" : "500",
                    cursor: "pointer",
                    fontFamily: "'Georgia', serif",
                    textAlign: "left",
                    display: "flex",
                    justifyContent: "space-between",
                    transition: "all 0.15s",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <span>{formatDateLabel(d)}</span>
                  <span style={{ fontSize: "11px", color: "#999", fontWeight: "400" }}>{d}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Run button */}
          <button
            onClick={runFlow}
            disabled={!canRun}
            style={{
              width: "100%",
              padding: "14px",
              background: canRun ? COLORS.green : "#ccc",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              fontSize: "15px",
              fontWeight: "700",
              cursor: canRun ? "pointer" : "not-allowed",
              fontFamily: "'Georgia', serif",
              letterSpacing: "1px",
              transition: "background 0.2s",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {flowRunning ? "Running…" : "▶ Run Flow"}
          </button>
        </div>

        {/* ── RIGHT PANEL ──────────────────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: "280px" }}>

          {/* 1. Weather */}
          <SectionCard step={1} title="Weather" status={weatherStatus}>
            {weatherStatus === "error" && (
              <div style={{ color: COLORS.errorRed, fontSize: "14px" }}>{weatherError}</div>
            )}
            {weatherResult && (
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                <div style={{ fontSize: "48px" }}>{getConditionIcon(weatherResult.condition)}</div>
                <div>
                  <div style={{ fontSize: "36px", fontWeight: "bold", color: COLORS.green, lineHeight: "1" }}>
                    {weatherResult.avg_temp.toFixed(1)}°C
                  </div>
                  <div style={{ fontSize: "14px", color: "#555", marginTop: "4px", textTransform: "capitalize" }}>
                    {weatherResult.condition}
                  </div>
                </div>
                <div style={{ marginLeft: "auto" }}>
                  <StatusBadge ok={!weatherResult.is_rainy} />
                  <div style={{ fontSize: "11px", color: "#888", marginTop: "4px", textAlign: "center" }}>
                    {weatherResult.is_rainy ? "rainy" : "not rainy"}
                  </div>
                </div>
              </div>
            )}
          </SectionCard>

          {/* 2. Recommendation */}
          <SectionCard
            step={2}
            title="Recommendation"
            status={decisionResult ? "done" : weatherStatus === "done" ? "done" : weatherStatus === "loading" ? "loading" : "idle"}
          >
            {decisionResult && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                  <div style={{ fontSize: "40px" }}>
                    {decisionResult.meal === "strawberry ice cream" ? "🍓" : "🍅"}
                  </div>
                  <div>
                    <div style={{
                      fontSize: "clamp(18px,4vw,22px)",
                      fontWeight: "bold",
                      color: COLORS.green,
                      textTransform: "capitalize",
                    }}>
                      {decisionResult.meal}
                    </div>
                  </div>
                </div>
                <div style={{
                  fontSize: "13px",
                  color: "#555",
                  fontStyle: "italic",
                  background: "#f5f5f5",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  lineHeight: "1.5",
                }}>
                  {decisionResult.reason}
                </div>
              </div>
            )}
          </SectionCard>

          {/* 3. Nutrition */}
          <SectionCard step={3} title="Nutrition" status={nutritionStatus}>
            {nutritionStatus === "error" && (
              <div style={{ color: COLORS.errorRed, fontSize: "14px" }}>{nutritionError}</div>
            )}
            {nutritionResult && (
              <div>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                  padding: "12px 16px",
                  background: "#e6f4ee",
                  borderRadius: "10px",
                }}>
                  <span style={{ fontWeight: "600", color: COLORS.green }}>Total calories</span>
                  <span style={{ fontSize: "22px", fontWeight: "bold", color: COLORS.green }}>
                    {nutritionResult.total_calories_kcal} kcal
                  </span>
                </div>
                {nutritionResult.items.map((item, i) => (
                  <div key={i} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    padding: "8px 0",
                    borderBottom: i < nutritionResult.items.length - 1 ? "1px solid #eee" : "none",
                    gap: "12px",
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: "#333" }}>{item.ingredient}</div>
                      <div style={{ fontSize: "11px", color: "#888", fontStyle: "italic" }}>{item.assumed_amount}</div>
                    </div>
                    <div style={{ fontSize: "15px", fontWeight: "bold", color: COLORS.green, whiteSpace: "nowrap" }}>
                      {item.calories_kcal} kcal
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* 4. Ingredient Supply */}
          <SectionCard step={4} title="Ingredient Supply" status={supplyStatus}>
            {supplyStatus === "error" && (
              <div style={{ color: COLORS.errorRed, fontSize: "14px" }}>{supplyError}</div>
            )}
            {supplyResult && (
              <div>
                <div style={{ marginBottom: "10px" }}>
                  <StatusBadge ok={supplyResult.all_available} />
                  <span style={{ fontSize: "12px", color: "#777", marginLeft: "8px" }}>
                    {supplyResult.all_available ? "All ingredients in stock" : "Some ingredients missing"}
                  </span>
                </div>
                {supplyResult.ingredients.map((ing, i) => (
                  <div key={i} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 0",
                    borderBottom: i < supplyResult.ingredients.length - 1 ? "1px solid #f0f0f0" : "none",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        background: ing.available ? "#e6f4ee" : "#fdecea",
                        color: ing.available ? COLORS.green : COLORS.errorRed,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "10px",
                        fontWeight: "700",
                        flexShrink: 0,
                      }}>
                        {ing.available ? "✓" : "✗"}
                      </span>
                      <span style={{ fontSize: "13px", color: "#333" }}>{ing.name}</span>
                    </div>
                    <span style={{ fontSize: "12px", color: "#888" }}>{ing.quantity}</span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* 5. Equipment */}
          <SectionCard step={5} title="Equipment" status={equipmentStatus}>
            {equipmentStatus === "error" && (
              <div style={{ color: COLORS.errorRed, fontSize: "14px" }}>{equipmentError}</div>
            )}
            {equipmentResult && (
              <div>
                <div style={{ marginBottom: "10px" }}>
                  <StatusBadge ok={equipmentResult.all_ready} />
                  <span style={{ fontSize: "12px", color: "#777", marginLeft: "8px" }}>
                    {equipmentResult.all_ready ? "All equipment available" : "Some equipment unavailable"}
                  </span>
                </div>
                {equipmentResult.equipment.map((eq, i) => (
                  <div key={i} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 0",
                    borderBottom: i < equipmentResult.equipment.length - 1 ? "1px solid #f0f0f0" : "none",
                  }}>
                    <span style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      background: eq.available ? "#e6f4ee" : "#fdecea",
                      color: eq.available ? COLORS.green : COLORS.errorRed,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      fontWeight: "700",
                      flexShrink: 0,
                    }}>
                      {eq.available ? "✓" : "✗"}
                    </span>
                    <span style={{ fontSize: "13px", color: "#333" }}>{eq.name}</span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* 6. Final Output */}
          {allDone && decisionResult && weatherResult && (
            <div style={{
              background: COLORS.green,
              borderRadius: "16px",
              padding: "24px",
              marginBottom: "16px",
              boxShadow: "0 8px 24px rgba(26,95,63,0.35)",
              color: "#fff",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <div style={{
                  width: "28px", height: "28px", borderRadius: "50%",
                  background: "rgba(255,255,255,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "13px", fontWeight: "700",
                }}>6</div>
                <div style={{ fontSize: "17px", fontWeight: "700", letterSpacing: "0.5px" }}>Final Output</div>
              </div>

              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <div style={{ fontSize: "56px", marginBottom: "8px" }}>
                  {decisionResult.meal === "strawberry ice cream" ? "🍓" : "🍅"}
                </div>
                <div style={{ fontSize: "clamp(20px,5vw,28px)", fontWeight: "bold", textTransform: "capitalize", marginBottom: "6px" }}>
                  {decisionResult.meal}
                </div>
                <div style={{ fontSize: "13px", opacity: 0.85, fontStyle: "italic" }}>
                  {decisionResult.reason}
                </div>
              </div>

              <div style={{
                background: "rgba(255,255,255,0.15)",
                borderRadius: "12px",
                padding: "14px 16px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}>
                <div style={{ fontSize: "12px", opacity: 0.8 }}>Location</div>
                <div style={{ fontSize: "13px", fontWeight: "600", textAlign: "right" }}>{activePostcode}</div>

                <div style={{ fontSize: "12px", opacity: 0.8 }}>Date</div>
                <div style={{ fontSize: "13px", fontWeight: "600", textAlign: "right" }}>{formatDateLabel(selectedDate)}</div>

                <div style={{ fontSize: "12px", opacity: 0.8 }}>Temperature</div>
                <div style={{ fontSize: "13px", fontWeight: "600", textAlign: "right" }}>{weatherResult.avg_temp.toFixed(1)}°C</div>

                <div style={{ fontSize: "12px", opacity: 0.8 }}>Conditions</div>
                <div style={{ fontSize: "13px", fontWeight: "600", textAlign: "right", textTransform: "capitalize" }}>{weatherResult.condition}</div>

                {nutritionResult && (
                  <>
                    <div style={{ fontSize: "12px", opacity: 0.8 }}>Calories</div>
                    <div style={{ fontSize: "13px", fontWeight: "600", textAlign: "right" }}>{nutritionResult.total_calories_kcal} kcal</div>
                  </>
                )}

                <div style={{ fontSize: "12px", opacity: 0.8 }}>Supply ready</div>
                <div style={{ fontSize: "13px", fontWeight: "600", textAlign: "right" }}>
                  {supplyResult?.all_available ? "✓ Yes" : "✗ Items missing"}
                </div>

                <div style={{ fontSize: "12px", opacity: 0.8 }}>Equipment ready</div>
                <div style={{ fontSize: "13px", fontWeight: "600", textAlign: "right" }}>
                  {equipmentResult?.all_ready ? "✓ Yes" : "✗ Items missing"}
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {weatherStatus === "idle" && (
            <div style={{
              textAlign: "center",
              padding: "48px 24px",
              color: "rgba(255,255,255,0.6)",
              fontStyle: "italic",
              fontSize: "15px",
            }}>
              Choose a location and day, then press <strong style={{ color: "rgba(255,255,255,0.9)" }}>▶ Run Flow</strong> to start the pipeline.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
