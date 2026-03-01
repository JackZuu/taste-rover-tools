import { useState, useEffect } from "react";

// ─── Colours & helpers ────────────────────────────────────────────────────────

const G = {
  green:      "#1a5f3f",
  greenLight: "#2d8659",
  cream:      "#f5f1e8",
  card:       "rgba(255,255,255,0.97)",
  red:        "#c41e3a",
  amber:      "#d97706",
};

function condIcon(c: string) {
  if (c === "mainly sun")  return "☀️";
  if (c === "mainly rain") return "🌧️";
  return "☁️";
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  const t = new Date(); t.setHours(0,0,0,0);
  const tm = new Date(t); tm.setDate(t.getDate()+1);
  if (d.toDateString()===t.toDateString())  return "Today";
  if (d.toDateString()===tm.toDateString()) return "Tomorrow";
  return d.toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"});
}

function next5Dates(): string[] {
  return Array.from({length:5},(_,i)=>{
    const d=new Date(); d.setDate(d.getDate()+i);
    return d.toISOString().split("T")[0];
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Van       = {id:string; name:string; base_location:string; postcode:string};
type EqItem    = {name:string; available:boolean};
type Supplier  = {name:string; distance_miles:number; lead_time_hours:number; categories:string[]; reliability_pct:number};
type InvItem   = {name:string; category:string; status:"in_stock"|"low"|"out"};
type TrendItem = {label:string; direction:"up"|"down"|"stable"; category:string};
type SeasonalItem = {name:string; category:string};
type Celebration = {name:string; date:string; days_away:number; food_opportunity:string};
type RegionalInsight = {insight:string; category:string};
type MenuOption = {name:string; category:string; weather_fit:string; emoji:string};
type NutritionItem = {ingredient:string; assumed_amount:string; calories_kcal:number; notes:string};

type StepStatus = "idle"|"loading"|"done"|"error";

// ─── UK Region → postcode ─────────────────────────────────────────────────────

const UK_REGIONS = [
  {label:"London",          postcode:"SW1A 1AA"},
  {label:"South East",      postcode:"RH1 1AA"},
  {label:"South West",      postcode:"BS1 4ST"},
  {label:"East of England", postcode:"CB2 1TN"},
  {label:"East Midlands",   postcode:"NG1 5FB"},
  {label:"West Midlands",   postcode:"B1 1BB"},
  {label:"Yorks & Humber",  postcode:"LS1 3AA"},
  {label:"North West",      postcode:"M1 1AE"},
  {label:"North East",      postcode:"NE1 7RU"},
  {label:"Wales",           postcode:"CF10 3NQ"},
  {label:"Scotland",        postcode:"EH1 1YZ"},
  {label:"N. Ireland",      postcode:"BT1 2LA"},
];

// ─── Decision logic (mirrors decision.py) ─────────────────────────────────────

function decideAndOptions(avgTemp:number, isRainy:boolean, condition:string): {
  primary_meal:string; primary_reason:string; menu_options:MenuOption[];
}{
  const warm = avgTemp>15 && !isRainy;
  const primary_meal = warm ? "strawberry ice cream" : "tomato soup";
  const primary_reason = warm
    ? `${avgTemp.toFixed(1)}°C and ${condition} — warm and dry, perfect for something cold!`
    : `${avgTemp.toFixed(1)}°C${isRainy?" and "+condition:""} — chilly or wet, time for something warming!`;

  const warm_opts:MenuOption[] = [
    {name:"Smash Burger",         category:"burger",  weather_fit:"warm", emoji:"🍔"},
    {name:"Grilled Chicken Wrap", category:"wrap",    weather_fit:"warm", emoji:"🌯"},
    {name:"Halloumi Skewers",     category:"skewer",  weather_fit:"warm", emoji:"🍢"},
    {name:"BBQ Pulled Pork Bun",  category:"burger",  weather_fit:"warm", emoji:"🥩"},
    {name:"Strawberry Ice Cream", category:"dessert", weather_fit:"warm", emoji:"🍓"},
    {name:"Mango Sorbet",         category:"dessert", weather_fit:"warm", emoji:"🥭"},
    {name:"Loaded Fries",         category:"side",    weather_fit:"any",  emoji:"🍟"},
    {name:"Fresh Green Salad",    category:"salad",   weather_fit:"warm", emoji:"🥗"},
    {name:"Watermelon Slush",     category:"drink",   weather_fit:"warm", emoji:"🍉"},
    {name:"Margherita Pizza",     category:"pizza",   weather_fit:"any",  emoji:"🍕"},
  ];
  const cold_opts:MenuOption[] = [
    {name:"Tomato Soup & Bread",  category:"soup",    weather_fit:"cold", emoji:"🍅"},
    {name:"Chicken Tikka Wrap",   category:"wrap",    weather_fit:"any",  emoji:"🌯"},
    {name:"Mac & Cheese Bowl",    category:"bowl",    weather_fit:"cold", emoji:"🧀"},
    {name:"Chilli Con Carne",     category:"bowl",    weather_fit:"cold", emoji:"🌶️"},
    {name:"Hot Dog with Onions",  category:"hot dog", weather_fit:"cold", emoji:"🌭"},
    {name:"Pepperoni Pizza",      category:"pizza",   weather_fit:"any",  emoji:"🍕"},
    {name:"Loaded Fries",         category:"side",    weather_fit:"any",  emoji:"🍟"},
    {name:"Spiced Lentil Soup",   category:"soup",    weather_fit:"cold", emoji:"🫘"},
    {name:"Warm Brownie & Cream", category:"dessert", weather_fit:"cold", emoji:"🍫"},
    {name:"Hot Chocolate",        category:"drink",   weather_fit:"cold", emoji:"☕"},
  ];
  return {primary_meal, primary_reason, menu_options: warm ? warm_opts : cold_opts};
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MockLabel({label}:{label:string}) {
  return (
    <div style={{
      display:"inline-block",
      fontSize:"10px", fontWeight:"600",
      color:"#888",
      background:"#f0f0f0",
      border:"1px solid #ddd",
      borderRadius:"4px",
      padding:"1px 6px",
      marginBottom:"10px",
      letterSpacing:"0.5px",
      textTransform:"uppercase",
      fontFamily:"monospace",
    }}>{label}</div>
  );
}

function StatusBadge({ok, labelOk="Ready", labelNo="Missing"}:{ok:boolean;labelOk?:string;labelNo?:string}) {
  return (
    <span style={{
      display:"inline-block",
      padding:"2px 10px",
      borderRadius:"12px",
      fontSize:"12px", fontWeight:"600",
      background: ok?"#e6f4ee":"#fdecea",
      color: ok?G.green:G.red,
      border:`1px solid ${ok?"#b2d8c5":"#f5c6c2"}`,
    }}>{ok?`✓ ${labelOk}`:`✗ ${labelNo}`}</span>
  );
}

function Dot({status}:{status:"in_stock"|"low"|"out"|string}) {
  const color = status==="in_stock"?G.green : status==="low"?G.amber : G.red;
  const label = status==="in_stock"?"In stock" : status==="low"?"Low" : "Out";
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:"4px",
      fontSize:"11px", fontWeight:"600", color,
    }}>
      <span style={{width:7,height:7,borderRadius:"50%",background:color,display:"inline-block"}}/>
      {label}
    </span>
  );
}

type SectionCardProps = {
  step:number; title:string; status:StepStatus;
  dataLabel?:string; children?:React.ReactNode;
};
function SectionCard({step,title,status,dataLabel,children}:SectionCardProps) {
  const borderColor =
    status==="done"?"#b2d8c5": status==="error"?G.red: status==="loading"?"#ccc":"#e8e8e8";
  return (
    <div style={{
      background:G.card, borderRadius:"16px",
      border:`2px solid ${borderColor}`,
      padding:"18px 22px", marginBottom:"14px",
      boxShadow: status==="done"?"0 4px 14px rgba(26,95,63,0.09)":"0 2px 6px rgba(0,0,0,0.05)",
      transition:"border-color 0.3s, box-shadow 0.3s",
    }}>
      <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom: children?12:0}}>
        <div style={{
          width:26, height:26, borderRadius:"50%", flexShrink:0,
          background: status==="done"?G.green: status==="error"?G.red:"#ddd",
          color:"#fff", display:"flex", alignItems:"center",
          justifyContent:"center", fontSize:"12px", fontWeight:"700",
          transition:"background 0.3s",
        }}>
          {status==="loading"?"…":step}
        </div>
        <div style={{
          fontSize:"clamp(14px,3.2vw,16px)", fontWeight:"700",
          color: status==="done"?G.green: status==="error"?G.red:"#bbb",
          letterSpacing:"0.4px", transition:"color 0.3s",
        }}>{title}</div>
        {status==="loading"&&(
          <span style={{marginLeft:"auto",fontSize:"12px",color:"#aaa",fontStyle:"italic"}}>Loading…</span>
        )}
      </div>
      {children && dataLabel && <MockLabel label={dataLabel}/>}
      {children}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function FlowScreen({onBack}:{onBack:()=>void}) {

  // ── Sidebar inputs ──────────────────────────────────────────────────────
  const [vans, setVans] = useState<Van[]>([]);
  const [selectedVan, setSelectedVan] = useState<string>("van_alpha");
  const [inputMode, setInputMode] = useState<"postcode"|"region">("postcode");
  const [postcodeInput, setPostcodeInput] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string|null>(null);
  const [selectedDate, setSelectedDate] = useState(next5Dates()[0]);

  const activePostcode = inputMode==="postcode"
    ? postcodeInput.trim()
    : UK_REGIONS.find(r=>r.label===selectedRegion)?.postcode ?? "";
  const activeRegion = selectedRegion ?? "London";

  // Load vans on mount
  useEffect(()=>{
    fetch("/api/vans").then(r=>r.json()).then(d=>{ if(d.vans) setVans(d.vans); });
  },[]);

  // ── Pipeline state ──────────────────────────────────────────────────────
  type PS = StepStatus;
  const [equipStatus,   setEquipStatus]   = useState<PS>("idle");
  const [equipResult,   setEquipResult]   = useState<{van:Van;equipment:EqItem[];available_count:number;total_count:number}|null>(null);
  const [equipErr,      setEquipErr]      = useState<string|null>(null);

  const [supplyStatus,  setSupplyStatus]  = useState<PS>("idle");
  const [supplyResult,  setSupplyResult]  = useState<{suppliers:Supplier[];inventory:InvItem[]}|null>(null);
  const [supplyErr,     setSupplyErr]     = useState<string|null>(null);

  const [trendsStatus,  setTrendsStatus]  = useState<PS>("idle");
  const [trendsResult,  setTrendsResult]  = useState<{trends:TrendItem[]}|null>(null);

  const [historicStatus,setHistoricStatus]= useState<PS>("idle");
  const [historicMsg,   setHistoricMsg]   = useState<string|null>(null);

  const [seasonStatus,  setSeasonStatus]  = useState<PS>("idle");
  const [seasonResult,  setSeasonResult]  = useState<{month:string;items:SeasonalItem[]}|null>(null);

  const [celebStatus,   setCelebStatus]   = useState<PS>("idle");
  const [celebResult,   setCelebResult]   = useState<{upcoming:Celebration[]}|null>(null);

  const [regionStatus,  setRegionStatus]  = useState<PS>("idle");
  const [regionResult,  setRegionResult]  = useState<{region:string;insights:RegionalInsight[]}|null>(null);

  const [weatherStatus, setWeatherStatus] = useState<PS>("idle");
  const [weatherResult, setWeatherResult] = useState<{avg_temp:number;condition:string;is_rainy:boolean}|null>(null);
  const [weatherErr,    setWeatherErr]    = useState<string|null>(null);

  const [decisionStatus,setDecisionStatus]= useState<PS>("idle");
  const [decisionResult,setDecisionResult]= useState<{primary_meal:string;primary_reason:string;menu_options:MenuOption[]}|null>(null);

  const [nutritionStatus,setNutritionStatus]= useState<PS>("idle");
  const [nutritionResult,setNutritionResult]= useState<{items:NutritionItem[];total_calories_kcal:number}|null>(null);
  const [nutritionErr,  setNutritionErr]  = useState<string|null>(null);

  const [menuStatus,    setMenuStatus]    = useState<PS>("idle");
  const [menuResult,    setMenuResult]    = useState<any|null>(null);
  const [menuErr,       setMenuErr]       = useState<string|null>(null);

  const [running, setRunning] = useState(false);

  function resetAll() {
    setEquipStatus("idle");   setEquipResult(null);   setEquipErr(null);
    setSupplyStatus("idle");  setSupplyResult(null);  setSupplyErr(null);
    setTrendsStatus("idle");  setTrendsResult(null);
    setHistoricStatus("idle");setHistoricMsg(null);
    setSeasonStatus("idle");  setSeasonResult(null);
    setCelebStatus("idle");   setCelebResult(null);
    setRegionStatus("idle");  setRegionResult(null);
    setWeatherStatus("idle"); setWeatherResult(null); setWeatherErr(null);
    setDecisionStatus("idle");setDecisionResult(null);
    setNutritionStatus("idle");setNutritionResult(null);setNutritionErr(null);
    setMenuStatus("idle");    setMenuResult(null);    setMenuErr(null);
  }

  // ── Run flow ────────────────────────────────────────────────────────────
  async function runFlow() {
    if (!activePostcode) return;
    resetAll();
    setRunning(true);

    // Helper
    async function fetchJson(url:string, opts?:RequestInit) {
      const r = await fetch(url, opts);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    }

    // ── Steps 1–7 concurrently ─────────────────────────────────────────
    setEquipStatus("loading"); setSupplyStatus("loading");
    setTrendsStatus("loading"); setHistoricStatus("loading");
    setSeasonStatus("loading"); setCelebStatus("loading");
    setRegionStatus("loading");

    const post = (url:string,body:object) => fetchJson(url,{
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify(body),
    });

    const [eq, sup, tr, hi, sea, cel, reg] = await Promise.allSettled([
      post("/api/equipment/van",  {van_id: selectedVan}),
      fetchJson("/api/supply/chain"),
      fetchJson("/api/trends"),
      fetchJson("/api/historic"),
      fetchJson("/api/seasonal"),
      fetchJson("/api/celebrations"),
      post("/api/regional", {region: activeRegion}),
    ]);

    if (eq.status==="fulfilled")  { setEquipResult(eq.value);    setEquipStatus("done"); }
    else                          { setEquipErr(String(eq.reason)); setEquipStatus("error"); }

    if (sup.status==="fulfilled") { setSupplyResult(sup.value);  setSupplyStatus("done"); }
    else                          { setSupplyErr(String(sup.reason)); setSupplyStatus("error"); }

    if (tr.status==="fulfilled")  { setTrendsResult(tr.value);   setTrendsStatus("done"); }
    else                          setTrendsStatus("error");

    if (hi.status==="fulfilled")  { setHistoricMsg(hi.value.message); setHistoricStatus("done"); }
    else                          setHistoricStatus("error");

    if (sea.status==="fulfilled") { setSeasonResult(sea.value);  setSeasonStatus("done"); }
    else                          setSeasonStatus("error");

    if (cel.status==="fulfilled") { setCelebResult(cel.value);   setCelebStatus("done"); }
    else                          setCelebStatus("error");

    if (reg.status==="fulfilled") { setRegionResult(reg.value);  setRegionStatus("done"); }
    else                          setRegionStatus("error");

    // ── Step 8: Weather ────────────────────────────────────────────────
    setWeatherStatus("loading");
    let wr:{avg_temp:number;condition:string;is_rainy:boolean}|null = null;
    try {
      const data = await post("/api/weather", {postcode: activePostcode});
      if (data.error) throw new Error(data.error);
      const dayEntry = (data.forecast??[]).find((d:any)=>d.date===selectedDate);
      if (!dayEntry) throw new Error(`No forecast data for ${selectedDate}`);
      wr = {avg_temp:dayEntry.avg_temp, condition:dayEntry.mainly, is_rainy:dayEntry.mainly==="mainly rain"};
      setWeatherResult(wr); setWeatherStatus("done");
    } catch(e:any) {
      setWeatherErr(e?.message??"Failed to fetch weather");
      setWeatherStatus("error"); setRunning(false); return;
    }

    // ── Step 9: Decision (client-side) ────────────────────────────────
    setDecisionStatus("loading");
    const dec = decideAndOptions(wr.avg_temp, wr.is_rainy, wr.condition);
    setDecisionResult(dec); setDecisionStatus("done");

    // ── Step 10: Nutrition ────────────────────────────────────────────
    setNutritionStatus("loading");
    try {
      const data = await post("/api/nutrition",{ingredients:[`1 standard serving of ${dec.primary_meal}`]});
      if (data.error) throw new Error(data.error);
      setNutritionResult(data); setNutritionStatus("done");
    } catch(e:any) {
      setNutritionErr(e?.message??"Failed to fetch nutrition");
      setNutritionStatus("error");
    }

    // ── Step 11: Menu proposal ────────────────────────────────────────
    setMenuStatus("loading");
    try {
      const activeTrends = trendsResult?.trends.filter(t=>t.direction==="up").map(t=>t.label) ?? [];
      const seasonalNames = seasonResult?.items.map(i=>i.name) ?? [];
      const nextCeleb = celebResult?.upcoming?.[0]?.name ?? "";
      const data = await post("/api/menu",{
        avg_temp:wr.avg_temp, is_rainy:wr.is_rainy, condition:wr.condition,
        primary_meal:dec.primary_meal,
        region:activeRegion,
        active_trends:activeTrends,
        seasonal_items:seasonalNames,
        upcoming_celebration:nextCeleb,
      });
      setMenuResult(data); setMenuStatus("done");
    } catch(e:any) {
      setMenuErr(e?.message??"Failed to generate menu");
      setMenuStatus("error");
    }

    setRunning(false);
  }

  const dates = next5Dates();
  const canRun = !running && (
    inputMode==="postcode" ? postcodeInput.trim().length>0 : selectedRegion!==null
  );
  const allDone = [equipStatus,supplyStatus,trendsStatus,historicStatus,
    seasonStatus,celebStatus,regionStatus,weatherStatus,
    decisionStatus,nutritionStatus,menuStatus].every(s=>s==="done"||s==="error");

  // ─── Sidebar button style ───────────────────────────────────────────────
  const tabBtn = (active:boolean):React.CSSProperties => ({
    flex:1, padding:"7px 4px", border:"none", fontFamily:"'Georgia',serif",
    background: active?G.green:"transparent",
    color: active?"#fff":G.green,
    fontWeight:"600", fontSize:"13px", cursor:"pointer",
    transition:"all 0.2s", WebkitTapHighlightColor:"transparent",
  });

  const dateBtn = (active:boolean):React.CSSProperties => ({
    padding:"7px 10px", borderRadius:"8px", border:`2px solid ${active?G.green:"#ddd"}`,
    background: active?"#e6f4ee":"#fafafa", color: active?G.green:"#444",
    fontSize:"12px", fontWeight: active?"700":"500", cursor:"pointer",
    fontFamily:"'Georgia',serif", display:"flex", justifyContent:"space-between",
    transition:"all 0.15s", WebkitTapHighlightColor:"transparent",
  });

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(135deg,${G.green} 0%,${G.greenLight} 100%)`,fontFamily:"'Georgia',serif",padding:"16px"}}>

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:"16px",marginBottom:"20px"}}>
        <button onClick={onBack} style={{background:"rgba(255,255,255,0.2)",border:"none",color:G.cream,padding:"10px 20px",borderRadius:"50px",cursor:"pointer",fontSize:"clamp(12px,3vw,14px)",fontWeight:"600",WebkitTapHighlightColor:"transparent"}}>
          ← Back
        </button>
        <div>
          <div style={{fontSize:"clamp(20px,5vw,30px)",fontWeight:"bold",color:G.cream,letterSpacing:"2px",textTransform:"uppercase"}}>Meal Flow</div>
          <div style={{fontSize:"clamp(11px,2.5vw,13px)",color:G.cream,opacity:0.8,fontStyle:"italic"}}>Equipment → Supply → Trends → History → Season → Events → Region → Weather → Decision → Nutrition → Menu</div>
        </div>
      </div>

      {/* Two-panel layout */}
      <div style={{display:"flex",gap:"18px",alignItems:"flex-start",flexWrap:"wrap"}}>

        {/* ── LEFT SIDEBAR ───────────────────────────────────────────────── */}
        <div style={{background:G.card,borderRadius:"20px",padding:"20px",width:"clamp(240px,26vw,280px)",flexShrink:0,boxShadow:"0 8px 24px rgba(0,0,0,0.2)"}}>
          <div style={{fontWeight:"700",color:G.green,fontSize:"14px",marginBottom:"14px",letterSpacing:"0.5px"}}>INPUTS</div>

          {/* Van selector */}
          <div style={{marginBottom:"16px"}}>
            <label style={{fontSize:"11px",color:"#777",display:"block",marginBottom:"6px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Select Van</label>
            {vans.length===0
              ? <div style={{fontSize:"12px",color:"#aaa",fontStyle:"italic"}}>Loading vans…</div>
              : vans.map(v=>(
                <button key={v.id} onClick={()=>{setSelectedVan(v.id);resetAll();}}
                  style={{
                    display:"block", width:"100%", textAlign:"left",
                    padding:"7px 10px", marginBottom:"4px",
                    borderRadius:"8px", cursor:"pointer",
                    border:`2px solid ${selectedVan===v.id?G.green:"#ddd"}`,
                    background:selectedVan===v.id?"#e6f4ee":"#fafafa",
                    fontFamily:"'Georgia',serif", WebkitTapHighlightColor:"transparent",
                    transition:"all 0.15s",
                  }}>
                  <div style={{fontSize:"13px",fontWeight:selectedVan===v.id?"700":"500",color:selectedVan===v.id?G.green:"#333"}}>{v.name}</div>
                  <div style={{fontSize:"10px",color:"#999"}}>{v.base_location}</div>
                </button>
              ))
            }
          </div>

          {/* Location tabs */}
          <div style={{display:"flex",borderRadius:"8px",overflow:"hidden",border:`2px solid ${G.green}`,marginBottom:"12px"}}>
            <button style={tabBtn(inputMode==="postcode")} onClick={()=>{setInputMode("postcode");resetAll();}}>Postcode</button>
            <button style={tabBtn(inputMode==="region")}   onClick={()=>{setInputMode("region");resetAll();}}>UK Region</button>
          </div>

          {inputMode==="postcode" && (
            <div style={{marginBottom:"16px"}}>
              <input value={postcodeInput} onChange={e=>{setPostcodeInput(e.target.value);resetAll();}}
                placeholder="e.g. SW1A 1AA"
                style={{width:"100%",padding:"9px 11px",border:"2px solid #e0e0e0",borderRadius:"8px",fontSize:"14px",outline:"none",fontFamily:"'Georgia',serif",boxSizing:"border-box",transition:"border-color 0.2s"}}
                onFocus={e=>e.currentTarget.style.borderColor=G.green}
                onBlur={e=>e.currentTarget.style.borderColor="#e0e0e0"}/>
            </div>
          )}

          {inputMode==="region" && (
            <div style={{marginBottom:"16px"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"5px",marginBottom:"6px"}}>
                {UK_REGIONS.map(r=>(
                  <button key={r.label} onClick={()=>{setSelectedRegion(r.label);resetAll();}} title={r.postcode}
                    style={{padding:"6px 3px",borderRadius:"7px",border:`2px solid ${selectedRegion===r.label?G.green:"#ddd"}`,background:selectedRegion===r.label?"#e6f4ee":"#fafafa",color:selectedRegion===r.label?G.green:"#444",fontSize:"10.5px",fontWeight:selectedRegion===r.label?"700":"500",cursor:"pointer",fontFamily:"'Georgia',serif",textAlign:"center",transition:"all 0.15s",WebkitTapHighlightColor:"transparent"}}>
                    {r.label}
                  </button>
                ))}
              </div>
              {selectedRegion&&<div style={{fontSize:"10px",color:"#999",textAlign:"center"}}>Postcode: <strong>{UK_REGIONS.find(r=>r.label===selectedRegion)?.postcode}</strong></div>}
            </div>
          )}

          {/* Day selector */}
          <div style={{marginBottom:"20px"}}>
            <label style={{fontSize:"11px",color:"#777",display:"block",marginBottom:"6px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Day</label>
            <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
              {dates.map(d=>(
                <button key={d} onClick={()=>{setSelectedDate(d);resetAll();}} style={dateBtn(selectedDate===d)}>
                  <span>{fmtDate(d)}</span>
                  <span style={{fontSize:"10px",color:"#aaa",fontWeight:"400"}}>{d}</span>
                </button>
              ))}
            </div>
          </div>

          <button onClick={runFlow} disabled={!canRun}
            style={{width:"100%",padding:"13px",background:canRun?G.green:"#ccc",color:"#fff",border:"none",borderRadius:"10px",fontSize:"15px",fontWeight:"700",cursor:canRun?"pointer":"not-allowed",fontFamily:"'Georgia',serif",letterSpacing:"1px",transition:"background 0.2s",WebkitTapHighlightColor:"transparent"}}>
            {running?"Running…":"▶ Run Flow"}
          </button>
        </div>

        {/* ── RIGHT PANEL ──────────────────────────────────────────────────── */}
        <div style={{flex:1,minWidth:"280px"}}>

          {/* Empty state */}
          {weatherStatus==="idle"&&!running&&(
            <div style={{textAlign:"center",padding:"56px 24px",color:"rgba(255,255,255,0.55)",fontStyle:"italic",fontSize:"15px"}}>
              Choose a van, location and day — then press <strong style={{color:"rgba(255,255,255,0.85)"}}>▶ Run Flow</strong>.
            </div>
          )}

          {/* ① Equipment */}
          <SectionCard step={1} title="Equipment Availability" status={equipStatus} dataLabel="hardcoded">
            {equipStatus==="error"&&<div style={{color:G.red,fontSize:"13px"}}>{equipErr}</div>}
            {equipResult&&(
              <div>
                <div style={{marginBottom:"10px",display:"flex",alignItems:"center",gap:"10px",flexWrap:"wrap"}}>
                  <div style={{fontWeight:"600",color:G.green,fontSize:"14px"}}>{equipResult.van.name}</div>
                  <div style={{fontSize:"12px",color:"#777"}}>{equipResult.van.base_location}</div>
                  <StatusBadge ok={equipResult.available_count===equipResult.total_count} labelOk="All ready" labelNo="Items missing"/>
                  <div style={{fontSize:"12px",color:"#888",marginLeft:"auto"}}>{equipResult.available_count}/{equipResult.total_count} available</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:"6px"}}>
                  {equipResult.equipment.map((e,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:"6px",padding:"5px 8px",background:e.available?"#e6f4ee":"#fdecea",borderRadius:"6px",fontSize:"12px",fontWeight:"500",color:e.available?G.green:G.red}}>
                      <span>{e.available?"✓":"✗"}</span> {e.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>

          {/* ② Supply Chain */}
          <SectionCard step={2} title="Supply Chain & Inventory" status={supplyStatus} dataLabel="mock data">
            {supplyStatus==="error"&&<div style={{color:G.red,fontSize:"13px"}}>{supplyErr}</div>}
            {supplyResult&&(
              <div>
                <div style={{marginBottom:"12px"}}>
                  <div style={{fontWeight:"600",color:G.green,fontSize:"13px",marginBottom:"6px"}}>Nearby Suppliers</div>
                  {supplyResult.suppliers.map((s,i)=>(
                    <div key={i} style={{padding:"8px 10px",background:"#f9f9f9",borderRadius:"8px",marginBottom:"5px",display:"flex",gap:"10px",flexWrap:"wrap",alignItems:"flex-start"}}>
                      <div style={{flex:1,minWidth:"120px"}}>
                        <div style={{fontSize:"13px",fontWeight:"600",color:"#333"}}>{s.name}</div>
                        <div style={{fontSize:"11px",color:"#888"}}>{s.categories.join(", ")}</div>
                      </div>
                      <div style={{display:"flex",gap:"12px",fontSize:"11px",color:"#666",flexShrink:0}}>
                        <span>📍 {s.distance_miles} mi</span>
                        <span>⏱ {s.lead_time_hours}h</span>
                        <span style={{color:s.reliability_pct>=90?G.green:s.reliability_pct>=75?G.amber:G.red,fontWeight:"600"}}>⭐ {s.reliability_pct}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{fontWeight:"600",color:G.green,fontSize:"13px",marginBottom:"6px"}}>Ingredient Inventory</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:"5px"}}>
                    {supplyResult.inventory.map((item,i)=>(
                      <div key={i} style={{padding:"5px 8px",background:"#f9f9f9",borderRadius:"6px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:"8px"}}>
                        <span style={{fontSize:"12px",color:"#333"}}>{item.name}</span>
                        <Dot status={item.status}/>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </SectionCard>

          {/* ③ Trends */}
          <SectionCard step={3} title="High-Level Trends" status={trendsStatus} dataLabel="hardcoded">
            {trendsResult&&(
              <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
                {trendsResult.trends.map((t,i)=>{
                  const icon = t.direction==="up"?"📈":t.direction==="down"?"📉":"➡️";
                  const bg   = t.direction==="up"?"#e6f4ee":t.direction==="down"?"#fdecea":"#f0f0f0";
                  const col  = t.direction==="up"?G.green:t.direction==="down"?G.red:"#555";
                  return(
                    <div key={i} style={{padding:"4px 10px",borderRadius:"20px",background:bg,color:col,fontSize:"12px",fontWeight:"600",display:"flex",alignItems:"center",gap:"4px"}}>
                      {icon} {t.label}
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          {/* ④ Historic */}
          <SectionCard step={4} title="Tasterover Historic Data" status={historicStatus}>
            {historicStatus==="done"&&(
              <div style={{display:"flex",alignItems:"center",gap:"8px",padding:"10px 14px",background:"#f5f5f5",borderRadius:"8px"}}>
                <span style={{fontSize:"18px"}}>📂</span>
                <span style={{fontSize:"14px",color:"#888",fontStyle:"italic"}}>{historicMsg}</span>
              </div>
            )}
          </SectionCard>

          {/* ⑤ Seasonal */}
          <SectionCard step={5} title="In-Season Foods" status={seasonStatus} dataLabel="hardcoded">
            {seasonResult&&(
              <div>
                <div style={{fontSize:"12px",color:"#888",marginBottom:"8px"}}>Currently in season — <strong>{seasonResult.month}</strong></div>
                <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
                  {seasonResult.items.map((item,i)=>(
                    <span key={i} style={{padding:"4px 10px",borderRadius:"20px",background:"#e6f4ee",color:G.green,fontSize:"12px",fontWeight:"600"}}>
                      🌿 {item.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>

          {/* ⑥ Celebrations */}
          <SectionCard step={6} title="Upcoming Events" status={celebStatus} dataLabel="hardcoded">
            {celebResult&&(
              <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                {celebResult.upcoming.map((ev,i)=>(
                  <div key={i} style={{padding:"8px 10px",background:"#f9f9f9",borderRadius:"8px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"2px"}}>
                      <span style={{fontSize:"13px",fontWeight:"600",color:"#333"}}>{ev.name}</span>
                      <span style={{fontSize:"11px",color:"#888",flexShrink:0,marginLeft:"8px"}}>{ev.days_away===0?"Today":`in ${ev.days_away}d`}</span>
                    </div>
                    <div style={{fontSize:"11px",color:"#777",fontStyle:"italic"}}>{ev.food_opportunity}</div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* ⑦ Regional */}
          <SectionCard step={7} title="Demand by Region" status={regionStatus} dataLabel="hardcoded">
            {regionResult&&(
              <div>
                <div style={{fontSize:"12px",color:"#888",marginBottom:"8px"}}>Insights for <strong>{regionResult.region}</strong></div>
                {regionResult.insights.map((ins,i)=>{
                  const catColor = ins.category==="demand"?"#e0eeff":ins.category==="trend"?"#e6f4ee":"#fdf3e6";
                  const catLabel = ins.category==="demand"?"Demand":ins.category==="trend"?"Trend":"Preference";
                  return(
                    <div key={i} style={{display:"flex",gap:"8px",alignItems:"flex-start",padding:"6px 0",borderBottom:i<regionResult.insights.length-1?"1px solid #f0f0f0":"none"}}>
                      <span style={{padding:"2px 7px",borderRadius:"10px",background:catColor,fontSize:"10px",fontWeight:"600",color:"#555",flexShrink:0,marginTop:"1px"}}>{catLabel}</span>
                      <span style={{fontSize:"13px",color:"#333"}}>{ins.insight}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          {/* ⑧ Weather */}
          <SectionCard step={8} title="Weather" status={weatherStatus}>
            {weatherStatus==="error"&&<div style={{color:G.red,fontSize:"13px"}}>{weatherErr}</div>}
            {weatherResult&&(
              <div style={{display:"flex",alignItems:"center",gap:"16px",flexWrap:"wrap"}}>
                <div style={{fontSize:"48px"}}>{condIcon(weatherResult.condition)}</div>
                <div>
                  <div style={{fontSize:"36px",fontWeight:"bold",color:G.green,lineHeight:"1"}}>{weatherResult.avg_temp.toFixed(1)}°C</div>
                  <div style={{fontSize:"13px",color:"#555",marginTop:"4px",textTransform:"capitalize"}}>{weatherResult.condition}</div>
                </div>
                <div style={{marginLeft:"auto"}}>
                  <StatusBadge ok={!weatherResult.is_rainy} labelOk="Not rainy" labelNo="Rainy"/>
                </div>
              </div>
            )}
          </SectionCard>

          {/* ⑨ Decision + Options */}
          <SectionCard step={9} title="Decision & Menu Options" status={decisionStatus} dataLabel="hardcoded rules">
            {decisionResult&&(
              <div>
                {/* Primary recommendation */}
                <div style={{padding:"12px 14px",background:"#e6f4ee",borderRadius:"10px",marginBottom:"14px"}}>
                  <div style={{fontSize:"11px",color:"#888",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"6px"}}>Primary Recommendation</div>
                  <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"6px"}}>
                    <span style={{fontSize:"32px"}}>{decisionResult.primary_meal==="strawberry ice cream"?"🍓":"🍅"}</span>
                    <span style={{fontSize:"clamp(16px,4vw,20px)",fontWeight:"bold",color:G.green,textTransform:"capitalize"}}>{decisionResult.primary_meal}</span>
                  </div>
                  <div style={{fontSize:"12px",color:"#555",fontStyle:"italic",lineHeight:"1.5"}}>{decisionResult.primary_reason}</div>
                </div>
                {/* Options grid */}
                <div style={{fontSize:"12px",color:"#888",marginBottom:"8px"}}>Weather-informed menu concepts:</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:"6px"}}>
                  {decisionResult.menu_options.map((opt,i)=>(
                    <div key={i} style={{padding:"7px 10px",background:"#f9f9f9",borderRadius:"8px",border:"1px solid #eee",display:"flex",alignItems:"center",gap:"7px"}}>
                      <span style={{fontSize:"18px"}}>{opt.emoji}</span>
                      <div>
                        <div style={{fontSize:"12px",fontWeight:"600",color:"#333"}}>{opt.name}</div>
                        <div style={{fontSize:"10px",color:"#aaa",textTransform:"capitalize"}}>{opt.category}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>

          {/* ⑩ Nutrition */}
          <SectionCard step={10} title="Nutrition" status={nutritionStatus} dataLabel={nutritionResult?"OpenAI":undefined}>
            {nutritionStatus==="error"&&<div style={{color:G.red,fontSize:"13px"}}>{nutritionErr}</div>}
            {nutritionResult&&(
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:"#e6f4ee",borderRadius:"8px",marginBottom:"10px"}}>
                  <span style={{fontWeight:"600",color:G.green,fontSize:"13px"}}>Total calories</span>
                  <span style={{fontSize:"20px",fontWeight:"bold",color:G.green}}>{nutritionResult.total_calories_kcal} kcal</span>
                </div>
                {nutritionResult.items.map((item,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"6px 0",borderBottom:i<nutritionResult.items.length-1?"1px solid #f0f0f0":"none",gap:"10px"}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:"13px",fontWeight:"600",color:"#333"}}>{item.ingredient}</div>
                      <div style={{fontSize:"11px",color:"#888",fontStyle:"italic"}}>{item.assumed_amount}</div>
                    </div>
                    <div style={{fontSize:"14px",fontWeight:"bold",color:G.green,whiteSpace:"nowrap"}}>{item.calories_kcal} kcal</div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* ⑪ Final Menu */}
          <SectionCard step={11} title="Menu Proposal" status={menuStatus} dataLabel="hardcoded logic">
            {menuStatus==="error"&&<div style={{color:G.red,fontSize:"13px"}}>{menuErr}</div>}
            {menuResult&&(
              <div>
                {/* Proportions */}
                <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"14px"}}>
                  {[
                    {label:"Veggie",      val:menuResult.pct_veggie, color:"#22c55e"},
                    {label:"Vegan",       val:menuResult.pct_vegan,  color:"#16a34a"},
                    {label:"Gluten-free", val:menuResult.pct_gluten_free, color:"#f59e0b"},
                  ].map(p=>(
                    <div key={p.label} style={{padding:"6px 12px",borderRadius:"20px",background:"#f0f0f0",display:"flex",gap:"6px",alignItems:"center"}}>
                      <span style={{fontSize:"13px",fontWeight:"700",color:p.color}}>{p.val}%</span>
                      <span style={{fontSize:"12px",color:"#666"}}>{p.label}</span>
                    </div>
                  ))}
                </div>

                {/* Categories */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"10px",marginBottom:"12px"}}>
                  {[
                    {key:"grill",      label:"🔥 Grill"},
                    {key:"snacks",     label:"🧆 Snacks"},
                    {key:"sides",      label:"🍟 Sides"},
                    {key:"desserts",   label:"🍮 Desserts"},
                    {key:"cold_drinks",label:"🥤 Cold Drinks"},
                    {key:"hot_drinks", label:"☕ Hot Drinks"},
                  ].map(cat=>(
                    <div key={cat.key} style={{padding:"10px 12px",background:"#f9f9f9",borderRadius:"10px",border:"1px solid #eee"}}>
                      <div style={{fontSize:"12px",fontWeight:"700",color:G.green,marginBottom:"6px"}}>{cat.label}</div>
                      {(menuResult[cat.key] as string[]).map((item,i)=>(
                        <div key={i} style={{fontSize:"12px",color:"#444",padding:"2px 0",borderBottom:i<(menuResult[cat.key] as string[]).length-1?"1px solid #f0f0f0":"none"}}>• {item}</div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Influences */}
                <div style={{fontSize:"11px",color:"#aaa",fontStyle:"italic"}}>
                  Influenced by: {(menuResult.influences as string[]).join(", ")}
                </div>
              </div>
            )}
          </SectionCard>

          {/* ── Final summary banner ─────────────────────────────────── */}
          {allDone && decisionResult && weatherResult && (
            <div style={{background:G.green,borderRadius:"16px",padding:"22px",marginBottom:"14px",boxShadow:"0 8px 24px rgba(26,95,63,0.35)",color:"#fff"}}>
              <div style={{textAlign:"center",marginBottom:"16px"}}>
                <div style={{fontSize:"52px",marginBottom:"6px"}}>{decisionResult.primary_meal==="strawberry ice cream"?"🍓":"🍅"}</div>
                <div style={{fontSize:"clamp(18px,4.5vw,24px)",fontWeight:"bold",textTransform:"capitalize"}}>{decisionResult.primary_meal}</div>
                <div style={{fontSize:"13px",opacity:0.8,fontStyle:"italic",marginTop:"4px"}}>{decisionResult.primary_reason}</div>
              </div>
              <div style={{background:"rgba(255,255,255,0.15)",borderRadius:"10px",padding:"12px 16px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",fontSize:"12px"}}>
                <span style={{opacity:0.75}}>Location</span>   <span style={{textAlign:"right",fontWeight:"600"}}>{activePostcode}</span>
                <span style={{opacity:0.75}}>Date</span>       <span style={{textAlign:"right",fontWeight:"600"}}>{fmtDate(selectedDate)}</span>
                <span style={{opacity:0.75}}>Temperature</span><span style={{textAlign:"right",fontWeight:"600"}}>{weatherResult.avg_temp.toFixed(1)}°C</span>
                <span style={{opacity:0.75}}>Conditions</span> <span style={{textAlign:"right",fontWeight:"600",textTransform:"capitalize"}}>{weatherResult.condition}</span>
                {nutritionResult&&<><span style={{opacity:0.75}}>Calories</span><span style={{textAlign:"right",fontWeight:"600"}}>{nutritionResult.total_calories_kcal} kcal</span></>}
                {menuResult&&<><span style={{opacity:0.75}}>Veggie %</span><span style={{textAlign:"right",fontWeight:"600"}}>{menuResult.pct_veggie}%</span></>}
              </div>
            </div>
          )}

        </div>{/* end right panel */}
      </div>{/* end two-panel */}
    </div>
  );
}
