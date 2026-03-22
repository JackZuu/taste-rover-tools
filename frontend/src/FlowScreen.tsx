import { useState, useEffect } from "react";

const G = {
  green:      "#1a5f3f",
  greenLight: "#2d8659",
  cream:      "#f5f1e8",
  card:       "rgba(255,255,255,0.97)",
  red:        "#c41e3a",
  amber:      "#d97706",
};

const openModBtn: React.CSSProperties = {
  marginLeft: "auto", padding: "5px 12px",
  border: "1.5px solid #1a5f3f", borderRadius: "20px",
  background: "#e6f4ee", color: "#1a5f3f",
  fontSize: "11px", fontWeight: "600",
  cursor: "pointer", fontFamily: "'Georgia',serif",
  WebkitTapHighlightColor: "transparent", flexShrink: 0,
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

// ─── Item emoji map ────────────────────────────────────────────────────────────

const ITEM_EMOJIS: Record<string,string> = {
  "Smash Burger":"🍔","BBQ Pulled Pork Bun":"🥩","Halloumi Skewer":"🍢",
  "Halloumi Skewers":"🍢","Hot Dog":"🌭","Hot Dog with Onions":"🌭",
  "Bacon & Egg Roll":"🥚","Sausage Sandwich":"🥪","Chicken Thigh Wrap":"🌯",
  "Grilled Chicken":"🍗","Grilled Chicken Wrap":"🌯","Plant-Based Burger":"🌱",
  "Birria-Style Wrap":"🌮","Nachos":"🧆","Chicken Strips":"🍗",
  "Corn on the Cob":"🌽","Falafel Bites":"🧆","Arancini Balls":"🧆",
  "Samosas":"🥟","Spring Rolls":"🥟","Mac Bites":"🧀",
  "Korean Fried Cauliflower":"🥦","Sweet Potato Fries":"🍠","Coleslaw":"🥗",
  "Side Salad":"🥗","Corn Ribs":"🌽","Loaded Fries":"🍟","Cheesy Chips":"🍟",
  "Onion Rings":"🧅","Garlic Bread":"🍞","Fresh Green Salad":"🥗",
  "Strawberry Ice Cream":"🍓","Mango Sorbet":"🥭","Churros":"🍩",
  "Fruit Skewer":"🍡","Warm Brownie":"🍫","Warm Brownie & Cream":"🍫",
  "Sticky Toffee Pudding":"🍮","Crumble Pot":"🥧","Hot Waffle":"🧇",
  "Lemonade":"🍋","Mango Slush":"🥭","Iced Coffee":"☕",
  "Watermelon Juice":"🍉","Sparkling Water":"💧","Watermelon Slush":"🍉",
  "Flat White":"☕","Chai Latte":"🍵","Hot Chocolate":"☕",
  "English Breakfast Tea":"🫖","Matcha Latte":"🍵",
  "Pumpkin Spice Cupcake":"🎃","Mince Pie":"🥧","Chocolate Fondant":"🍫",
  "Hot Cross Bun":"🍞","Toffee Apple":"🍎","Haggis Roll":"🥙",
  "Welsh Lamb Wrap":"🌯","Ulster Fry Wrap":"🍳","Cornish Pasty":"🥐",
  "Stottie Sandwich":"🥪","Chip Butty":"🍟","Tomato Soup":"🍅",
  "Tomato Soup & Bread":"🍅","Mac & Cheese Bowl":"🧀","Chilli Con Carne":"🌶️",
  "Spiced Lentil Soup":"🫘","Margherita Pizza":"🍕","Pepperoni Pizza":"🍕",
  "Margherita Pizza Slice":"🍕","Pepperoni Pizza Slice":"🍕",
  "Chicken Tikka Wrap":"🌯",
};

// ─── Item nutrition data (hardcoded per serving) ────────────────────────────

const ITEM_NUTRITION: Record<string,{cal:number;protein:number;carbs:number;fat:number;fibre:number}> = {
  "Smash Burger":              {cal:620,protein:35,carbs:42,fat:32,fibre:2},
  "BBQ Pulled Pork Bun":       {cal:580,protein:38,carbs:48,fat:21,fibre:3},
  "Halloumi Skewers":          {cal:310,protein:18,carbs:8, fat:24,fibre:1},
  "Halloumi Skewer":           {cal:310,protein:18,carbs:8, fat:24,fibre:1},
  "Hot Dog with Onions":       {cal:380,protein:14,carbs:38,fat:20,fibre:2},
  "Hot Dog":                   {cal:340,protein:13,carbs:34,fat:18,fibre:2},
  "Grilled Chicken Wrap":      {cal:440,protein:36,carbs:38,fat:14,fibre:3},
  "Chicken Tikka Wrap":        {cal:490,protein:32,carbs:44,fat:18,fibre:3},
  "Grilled Chicken":           {cal:290,protein:36,carbs:0, fat:14,fibre:0},
  "Plant-Based Burger":        {cal:520,protein:28,carbs:48,fat:22,fibre:5},
  "Birria-Style Wrap":         {cal:550,protein:34,carbs:46,fat:22,fibre:3},
  "Nachos":                    {cal:480,protein:12,carbs:56,fat:24,fibre:5},
  "Chicken Strips":            {cal:370,protein:28,carbs:28,fat:16,fibre:1},
  "Corn on the Cob":           {cal:190,protein:5, carbs:38,fat:3, fibre:4},
  "Falafel Bites":             {cal:290,protein:10,carbs:34,fat:14,fibre:6},
  "Arancini Balls":            {cal:320,protein:10,carbs:42,fat:12,fibre:2},
  "Samosas":                   {cal:280,protein:7, carbs:38,fat:12,fibre:3},
  "Spring Rolls":              {cal:240,protein:6, carbs:32,fat:10,fibre:2},
  "Mac Bites":                 {cal:360,protein:12,carbs:42,fat:16,fibre:1},
  "Sweet Potato Fries":        {cal:280,protein:3, carbs:48,fat:10,fibre:5},
  "Coleslaw":                  {cal:140,protein:1, carbs:14,fat:9, fibre:2},
  "Side Salad":                {cal:80, protein:3, carbs:8, fat:4, fibre:3},
  "Fresh Green Salad":         {cal:80, protein:3, carbs:8, fat:4, fibre:3},
  "Loaded Fries":              {cal:420,protein:8, carbs:55,fat:22,fibre:4},
  "Cheesy Chips":              {cal:380,protein:10,carbs:50,fat:18,fibre:3},
  "Onion Rings":               {cal:260,protein:4, carbs:34,fat:12,fibre:2},
  "Garlic Bread":              {cal:220,protein:5, carbs:30,fat:9, fibre:2},
  "Corn Ribs":                 {cal:220,protein:5, carbs:36,fat:8, fibre:4},
  "Korean Fried Cauliflower":  {cal:310,protein:8, carbs:38,fat:14,fibre:5},
  "Strawberry Ice Cream":      {cal:210,protein:3, carbs:28,fat:10,fibre:0},
  "Mango Sorbet":              {cal:150,protein:1, carbs:36,fat:0, fibre:2},
  "Churros":                   {cal:320,protein:5, carbs:44,fat:14,fibre:2},
  "Warm Brownie & Cream":      {cal:380,protein:5, carbs:48,fat:19,fibre:2},
  "Warm Brownie":              {cal:320,protein:5, carbs:42,fat:16,fibre:2},
  "Sticky Toffee Pudding":     {cal:420,protein:4, carbs:64,fat:16,fibre:2},
  "Crumble Pot":               {cal:360,protein:4, carbs:58,fat:12,fibre:3},
  "Hot Waffle":                {cal:340,protein:6, carbs:52,fat:12,fibre:2},
  "Fruit Skewer":              {cal:80, protein:1, carbs:18,fat:0, fibre:2},
  "Lemonade":                  {cal:90, protein:0, carbs:22,fat:0, fibre:0},
  "Mango Slush":               {cal:140,protein:0, carbs:34,fat:0, fibre:1},
  "Watermelon Slush":          {cal:120,protein:1, carbs:30,fat:0, fibre:1},
  "Watermelon Juice":          {cal:100,protein:1, carbs:24,fat:0, fibre:1},
  "Iced Coffee":               {cal:140,protein:4, carbs:18,fat:5, fibre:0},
  "Flat White":                {cal:120,protein:7, carbs:10,fat:6, fibre:0},
  "Chai Latte":                {cal:180,protein:6, carbs:28,fat:5, fibre:0},
  "Hot Chocolate":             {cal:220,protein:8, carbs:28,fat:9, fibre:0},
  "Matcha Latte":              {cal:160,protein:5, carbs:22,fat:5, fibre:0},
  "English Breakfast Tea":     {cal:10, protein:0, carbs:1, fat:0, fibre:0},
  "Tomato Soup & Bread":       {cal:280,protein:8, carbs:44,fat:7, fibre:4},
  "Tomato Soup":               {cal:180,protein:5, carbs:28,fat:5, fibre:4},
  "Mac & Cheese Bowl":         {cal:510,protein:16,carbs:62,fat:22,fibre:2},
  "Chilli Con Carne":          {cal:420,protein:28,carbs:36,fat:16,fibre:8},
  "Spiced Lentil Soup":        {cal:240,protein:14,carbs:38,fat:4, fibre:10},
  "Margherita Pizza":          {cal:580,protein:24,carbs:76,fat:18,fibre:4},
  "Pepperoni Pizza":           {cal:720,protein:32,carbs:78,fat:28,fibre:4},
  "Margherita Pizza Slice":    {cal:290,protein:12,carbs:38,fat:9, fibre:2},
  "Pepperoni Pizza Slice":     {cal:360,protein:16,carbs:39,fat:14,fibre:2},
  "Sausage Sandwich":          {cal:450,protein:18,carbs:38,fat:24,fibre:2},
  "Bacon & Egg Roll":          {cal:420,protein:22,carbs:34,fat:22,fibre:2},
};

function getItemEmoji(name: string): string {
  if (ITEM_EMOJIS[name]) return ITEM_EMOJIS[name];
  const lower = name.toLowerCase();
  for (const [k,v] of Object.entries(ITEM_EMOJIS)) {
    if (lower.includes(k.toLowerCase())) return v;
  }
  if (lower.includes("burger")||lower.includes("bun")) return "🍔";
  if (lower.includes("wrap")||lower.includes("taco")) return "🌯";
  if (lower.includes("pizza")) return "🍕";
  if (lower.includes("soup")) return "🍲";
  if (lower.includes("salad")) return "🥗";
  if (lower.includes("fries")||lower.includes("chips")) return "🍟";
  if (lower.includes("ice cream")||lower.includes("sorbet")) return "🍦";
  if (lower.includes("cake")||lower.includes("brownie")||lower.includes("pudding")) return "🍰";
  if (lower.includes("coffee")||lower.includes("latte")||lower.includes("cappuccino")) return "☕";
  if (lower.includes("tea")||lower.includes("matcha")) return "🍵";
  if (lower.includes("juice")||lower.includes("slush")||lower.includes("lemonade")) return "🥤";
  if (lower.includes("chicken")) return "🍗";
  if (lower.includes("seasonal")) return "🌿";
  return "🍽️";
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Van            = {id:string; name:string; base_location:string; postcode:string};
type EqItem         = {name:string; available:boolean};
type Supplier       = {name:string; distance_miles:number; lead_time_hours:number; categories:string[]; reliability_pct:number};
type InvItem        = {name:string; category:string; status:"in_stock"|"low"|"out"};
type TrendItem      = {label:string; direction:"up"|"down"|"stable"; category:string; momentum_pct?:number; avg_interest?:number};
type SeasonalItem   = {name:string; category:string};
type FoodSuggestion = {name:string; category:string};
type Celebration    = {name:string; date:string; days_away:number; food_opportunity:string; menu_suggestions?:FoodSuggestion[]};
type RegionalInsight= {insight:string; category:string};
type MenuOption     = {name:string; category:string; weather_fit:string; emoji:string};
type NutritionItem  = {ingredient:string; assumed_amount:string; calories_kcal:number; notes:string};
type StepStatus     = "idle"|"loading"|"done"|"error";

// ─── UK regions ───────────────────────────────────────────────────────────────

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

// ─── Van auto-selection ───────────────────────────────────────────────────────

function autoSelectVan(vans: Van[], postcode: string, region: string): string {
  if (!vans.length) return "van_alpha";
  if (region) {
    const words = region.toLowerCase().split(/[\s,&]+/).filter(w=>w.length>2);
    for (const v of vans) {
      const base = v.base_location.toLowerCase();
      if (words.some(w => base.includes(w))) return v.id;
    }
  }
  if (postcode) {
    const prefix = postcode.trim().toUpperCase().match(/^[A-Z]{1,2}/)?.[0] ?? "";
    for (const v of vans) {
      if (v.postcode.startsWith(prefix)) return v.id;
    }
  }
  return vans[0].id;
}

// ─── Decision logic ───────────────────────────────────────────────────────────

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
      display:"inline-block", fontSize:"10px", fontWeight:"600", color:"#888",
      background:"#f0f0f0", border:"1px solid #ddd", borderRadius:"4px",
      padding:"1px 6px", marginBottom:"10px", letterSpacing:"0.5px",
      textTransform:"uppercase", fontFamily:"monospace",
    }}>{label}</div>
  );
}

function StatusBadge({ok,labelOk="Ready",labelNo="Missing"}:{ok:boolean;labelOk?:string;labelNo?:string}) {
  return (
    <span style={{
      display:"inline-block", padding:"2px 10px", borderRadius:"12px",
      fontSize:"12px", fontWeight:"600",
      background:ok?"#e6f4ee":"#fdecea", color:ok?G.green:G.red,
      border:`1px solid ${ok?"#b2d8c5":"#f5c6c2"}`,
    }}>{ok?`✓ ${labelOk}`:`✗ ${labelNo}`}</span>
  );
}

function Dot({status}:{status:string}) {
  const color = status==="in_stock"?G.green : status==="low"?G.amber : G.red;
  const label = status==="in_stock"?"In stock" : status==="low"?"Low" : "Out";
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:"4px",fontSize:"11px",fontWeight:"600",color}}>
      <span style={{width:7,height:7,borderRadius:"50%",background:color,display:"inline-block"}}/>
      {label}
    </span>
  );
}

type SectionCardProps = {
  step:number; title:string; status:StepStatus;
  dataLabel?:string; children?:React.ReactNode; titleAction?:React.ReactNode;
};
function SectionCard({step,title,status,dataLabel,children,titleAction}:SectionCardProps) {
  const borderColor = status==="done"?"#b2d8c5":status==="error"?G.red:status==="loading"?G.greenLight:"#e8e8e8";
  return (
    <div style={{
      background:G.card, borderRadius:"16px", border:`2px solid ${borderColor}`,
      padding:"18px 22px", marginBottom:"14px",
      boxShadow:status==="done"?"0 4px 14px rgba(26,95,63,0.09)":"0 2px 6px rgba(0,0,0,0.05)",
      transition:"border-color 0.3s,box-shadow 0.3s",
      overflow:"hidden", position:"relative",
    }}>
      {status==="loading"&&(
        <div style={{
          position:"absolute", top:0, left:0, right:0, height:"3px",
          background:`linear-gradient(90deg,${G.green},${G.greenLight},${G.green})`,
          backgroundSize:"200% 100%",
          animation:"pulse-bar 1.4s ease infinite",
        }}/>
      )}
      <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:children?12:0}}>
        <div style={{
          width:26,height:26,borderRadius:"50%",flexShrink:0,
          background:status==="done"?G.green:status==="error"?G.red:status==="loading"?G.greenLight:"#ddd",
          color:"#fff",display:"flex",alignItems:"center",
          justifyContent:"center",fontSize:"12px",fontWeight:"700",
          transition:"background 0.3s",
        }}>{status==="loading"?"…":step}</div>
        <div style={{
          fontSize:"clamp(14px,3.2vw,16px)",fontWeight:"700",flex:1,
          color:status==="done"?G.green:status==="error"?G.red:status==="loading"?G.greenLight:"#bbb",
          letterSpacing:"0.4px",transition:"color 0.3s",
        }}>{title}</div>
        {status==="loading"&&<span style={{fontSize:"12px",color:G.greenLight,fontStyle:"italic",fontWeight:"600"}}>Working…</span>}
        {titleAction}
      </div>
      {children && dataLabel && <MockLabel label={dataLabel}/>}
      {children}
    </div>
  );
}

// ─── TR App-style menu display ────────────────────────────────────────────────

const MENU_TABS = [
  {key:"grill",       label:"Grill"},
  {key:"snacks",      label:"Snacks"},
  {key:"cold_drinks", label:"Cold Drinks"},
  {key:"sides",       label:"Sides"},
  {key:"desserts",    label:"Desserts"},
  {key:"hot_drinks",  label:"Hot Drinks"},
];

function ItemCard({name, featured, onClick, selected}:{name:string; featured?:boolean; onClick?:()=>void; selected?:boolean}) {
  const emoji = getItemEmoji(name);
  return (
    <div
      onClick={onClick}
      style={{
        background:"#fff", borderRadius:"12px", overflow:"hidden",
        boxShadow: selected ? `0 0 0 2px ${G.green}, 0 4px 12px rgba(26,95,63,0.18)` : "0 2px 8px rgba(0,0,0,0.08)",
        border: featured ? `2px solid ${G.green}` : selected ? `2px solid ${G.green}` : "1.5px solid #ececec",
        cursor:"pointer", transition:"transform 0.1s, box-shadow 0.1s",
      }}
      onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform="scale(1.04)";}}
      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform="scale(1)";}}
    >
      <div style={{
        background:"#f0ede6", height:"80px",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:"34px", position:"relative",
      }}>
        {emoji}
        {featured && (
          <div style={{
            position:"absolute", top:"5px", left:"5px",
            background:G.green, color:"#fff",
            fontSize:"8px", fontWeight:"700",
            padding:"2px 5px", borderRadius:"4px", letterSpacing:"0.5px",
          }}>FEATURED</div>
        )}
        <div style={{
          position:"absolute", bottom:"5px", right:"5px",
          width:"22px", height:"22px", borderRadius:"50%",
          background:G.green, color:"#fff",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:"17px", fontWeight:"300", border:"2px solid #fff", lineHeight:"1",
        }}>ℹ</div>
      </div>
      <div style={{padding:"8px 9px"}}>
        <div style={{
          fontSize:"11px", fontWeight:"600", color:"#1a1a1a",
          fontFamily:"'Georgia',serif", lineHeight:"1.3",
        }}>{name}</div>
      </div>
    </div>
  );
}

function TRMenuDisplay({menuResult, primaryMeal}:{menuResult:any; primaryMeal:string}) {
  const [activeTab, setActiveTab] = useState("grill");
  const [selectedItem, setSelectedItem] = useState<string|null>(null);
  const activeItems: string[] = menuResult[activeTab] ?? [];
  const activeLabel = MENU_TABS.find(t=>t.key===activeTab)?.label ?? "";
  const primaryWord = primaryMeal.split(" ")[0].toLowerCase();

  const handleTabChange = (key: string) => { setActiveTab(key); setSelectedItem(null); };

  const tabStyle = (active:boolean): React.CSSProperties => ({
    padding:"7px 2px", border:`1.5px solid ${active?"transparent":"rgba(255,255,255,0.55)"}`,
    borderRadius:"8px", background:active?"#fff":"transparent",
    color:active?G.green:"#fff", fontWeight:"600", fontSize:"11px",
    cursor:"pointer", fontFamily:"'Georgia',serif",
    transition:"all 0.15s", WebkitTapHighlightColor:"transparent",
  });

  const nutr = selectedItem ? ITEM_NUTRITION[selectedItem] : null;

  return (
    <div style={{borderRadius:"14px", overflow:"hidden", boxShadow:"0 4px 20px rgba(0,0,0,0.12)"}}>
      {/* Green header */}
      <div style={{background:G.green, padding:"14px 16px 10px"}}>
        <div style={{
          fontSize:"28px", fontStyle:"italic", fontWeight:"bold",
          color:"#fff", fontFamily:"'Georgia',serif", marginBottom:"10px", lineHeight:"1",
        }}>
          <em>TR</em>
        </div>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"5px", marginBottom:"5px"}}>
          {MENU_TABS.slice(0,3).map(tab=>(
            <button key={tab.key} style={tabStyle(activeTab===tab.key)} onClick={()=>handleTabChange(tab.key)}>
              {tab.label}
            </button>
          ))}
        </div>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"5px"}}>
          {MENU_TABS.slice(3).map(tab=>(
            <button key={tab.key} style={tabStyle(activeTab===tab.key)} onClick={()=>handleTabChange(tab.key)}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{background:"#f5f3ef", padding:"16px"}}>
        <div style={{
          fontSize:"22px", fontWeight:"700", color:"#1a1a1a",
          fontFamily:"'Georgia',serif", marginBottom:"14px",
        }}>{activeLabel}</div>

        {activeItems.length === 0 ? (
          <div style={{color:"#aaa", fontStyle:"italic", fontSize:"13px", padding:"8px 0"}}>
            No items for this category
          </div>
        ) : (
          <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"9px"}}>
            {activeItems.map((item,i) => (
              <ItemCard
                key={i} name={item}
                featured={i===0 && item.toLowerCase().includes(primaryWord)}
                selected={selectedItem === item}
                onClick={()=>setSelectedItem(selectedItem===item ? null : item)}
              />
            ))}
          </div>
        )}

        {/* Nutrition panel */}
        {selectedItem && (
          <div style={{
            marginTop:"12px", padding:"12px 14px",
            background:"#fff", borderRadius:"10px",
            border:`1.5px solid ${G.green}`,
            animation:"fadeIn 0.15s ease",
          }}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
              <div style={{fontSize:"13px",fontWeight:"700",color:G.green}}>
                {getItemEmoji(selectedItem)} {selectedItem}
              </div>
              <button
                onClick={()=>setSelectedItem(null)}
                style={{background:"none",border:"none",cursor:"pointer",fontSize:"16px",color:"#aaa",lineHeight:"1",padding:"2px 4px"}}
              >✕</button>
            </div>
            {nutr ? (
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"6px"}}>
                {[
                  {label:"Calories", val:`${nutr.cal} kcal`},
                  {label:"Protein",  val:`${nutr.protein}g`},
                  {label:"Carbs",    val:`${nutr.carbs}g`},
                  {label:"Fat",      val:`${nutr.fat}g`},
                  {label:"Fibre",    val:`${nutr.fibre}g`},
                ].map(c=>(
                  <div key={c.label} style={{padding:"6px 4px",background:"#f5f3ef",borderRadius:"8px",textAlign:"center"}}>
                    <div style={{fontSize:"9px",color:"#888",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"3px"}}>{c.label}</div>
                    <div style={{fontSize:"12px",fontWeight:"700",color:G.green}}>{c.val}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{color:"#aaa",fontStyle:"italic",fontSize:"12px"}}>
                Nutrition data not yet available for this item.
              </div>
            )}
          </div>
        )}

        {!selectedItem && activeItems.length > 0 && (
          <div style={{marginTop:"8px",fontSize:"10px",color:"#bbb",fontStyle:"italic",textAlign:"center"}}>
            Tap any item to see nutrition info
          </div>
        )}

        {/* Influences */}
        {(menuResult.influences as string[])?.length > 0 && (
          <div style={{
            marginTop:"14px", padding:"8px 12px",
            background:"#e6f4ee", borderRadius:"8px",
            fontSize:"11px", color:G.green, fontStyle:"italic",
          }}>
            Tailored by: {(menuResult.influences as string[]).join(" · ")}
          </div>
        )}

        {/* Diet %s */}
        <div style={{display:"flex", gap:"8px", flexWrap:"wrap", marginTop:"10px"}}>
          {[
            {label:"Veggie", val:menuResult.pct_veggie, color:"#22c55e"},
            {label:"Vegan",  val:menuResult.pct_vegan,  color:"#16a34a"},
            {label:"GF",     val:menuResult.pct_gluten_free, color:"#f59e0b"},
          ].map(p=>(
            <div key={p.label} style={{
              padding:"4px 10px", borderRadius:"20px", background:"#fff",
              display:"flex", gap:"4px", alignItems:"center",
              fontSize:"11px", border:"1px solid #e0e0e0",
            }}>
              <span style={{fontWeight:"700", color:p.color}}>{p.val}%</span>
              <span style={{color:"#666"}}>{p.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── New TypeScript interfaces ────────────────────────────────────────────────

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  is_base: boolean;
  enriched: boolean;
  enrichment?: {
    ingredients: string[];
    nutrition: { cal?: number; calories?: number; protein_g?: number; protein?: number; carbs_g?: number; carbs?: number; fat_g?: number; fat?: number; fibre_g?: number };
    tags: string[];
  };
}

interface FrameworkConfig {
  weather_weight: number;
  trends_weight: number;
  seasonal_weight: number;
  events_weight: number;
  regional_weight: number;
  target_pct_veggie: number;
  target_pct_vegan: number;
  target_pct_gluten_free: number;
  avg_price_target_gbp: number;
  exclude_allergens: string[];
}

interface ProposalFeaturedItem {
  name: string;
  category: string;
  price: number;
  price_gbp?: number;
  score: number;
  reason: string;
}

interface MenuProposalResult {
  featured_items: ProposalFeaturedItem[];
  categories: Record<string, Array<{name: string; score: number; price: number; price_gbp?: number}>>;
}

// ─── ModuleGroup component ────────────────────────────────────────────────────

function ModuleGroup({
  title, borderColor, itemCount, defaultOpen, children,
}: {
  title: string;
  borderColor: string;
  itemCount: number;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: "18px" }}>
      {/* Group header */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          background: G.card,
          borderRadius: "12px",
          borderLeft: `4px solid ${borderColor}`,
          padding: "12px 16px",
          marginBottom: open ? "10px" : "0",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          WebkitTapHighlightColor: "transparent",
          userSelect: "none",
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "12px", fontWeight: "800", color: borderColor, letterSpacing: "1.5px" }}>
            {title}
          </div>
          <div style={{ fontSize: "11px", color: "#aaa", marginTop: "1px" }}>
            {itemCount} module{itemCount !== 1 ? "s" : ""}
          </div>
        </div>
        <div style={{
          fontSize: "18px", color: borderColor, lineHeight: "1",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.2s",
        }}>
          ⌄
        </div>
      </div>
      {open && (
        <div style={{ paddingLeft: "4px" }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Tag pill helper ──────────────────────────────────────────────────────────

function tagPillStyle(tag: string): React.CSSProperties {
  const t = tag.toLowerCase();
  if (t.includes("weather") || t === "hot_weather" || t === "cold_weather" || t === "any_weather") {
    return { background: "#dbeafe", color: "#1d4ed8" };
  }
  if (t === "vegetarian" || t === "vegan" || t === "gluten_free" || t.includes("dietary")) {
    return { background: "#dcfce7", color: "#15803d" };
  }
  if (t.startsWith("contains_")) {
    return { background: "#fee2e2", color: "#b91c1c" };
  }
  if (t.includes("trending") || t.includes("seasonal")) {
    return { background: "#ede9fe", color: "#7c3aed" };
  }
  if (t === "premium" || t === "hero_item" || t.includes("position")) {
    return { background: "#fef3c7", color: "#b45309" };
  }
  return { background: "#f0f0f0", color: "#555" };
}

// ─── MenuModule (combined menu management + enrichment) ───────────────────────

const MENU_CATEGORIES = ["grill", "sides", "snacks", "desserts", "cold_drinks", "hot_drinks"];

const CATEGORY_DISPLAY: Record<string, string> = {
  grill: "🔥 Grill",
  sides: "🥗 Sides",
  snacks: "🍝 Snacks",
  desserts: "🍰 Desserts",
  cold_drinks: "🧃 Cold Drinks",
  hot_drinks: "☕ Hot Drinks",
};

const CAT_DEFAULT_EMOJI: Record<string, string> = {
  grill: "🔥", sides: "🥗", snacks: "🍝",
  desserts: "🍰", cold_drinks: "🧃", hot_drinks: "☕",
};

function MenuModule({ refreshTrigger = 0 }: { refreshTrigger?: number }) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enrichingAll, setEnrichingAll] = useState(false);
  const [enrichingId, setEnrichingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addName, setAddName] = useState("");
  const [addCat, setAddCat] = useState("grill");
  const [addPrice, setAddPrice] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addErr, setAddErr] = useState<string | null>(null);

  async function loadItems() {
    setLoading(true); setError(null);
    try {
      const r = await fetch("/api/menu-items");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      const baseItems: MenuItem[] = (d.items ?? []).map((i: any) => ({
        ...i, price: i.price_gbp ?? i.price ?? 0, is_base: !i.user_added, enriched: !!i.enrichment,
      }));
      // Load enrichment for each item
      const enriched = await Promise.all(baseItems.map(async item => {
        try {
          const re = await fetch(`/api/menu-items/${item.id}/enrichment`);
          if (re.ok) {
            const enr = await re.json();
            if (enr && enr.ingredients) return { ...item, enriched: true, enrichment: enr };
          }
        } catch {}
        return item;
      }));
      setItems(enriched);
    } catch (e: any) { setError(e?.message ?? "Failed to load menu items"); }
    finally { setLoading(false); }
  }

  async function addItem() {
    if (!addName.trim() || !addPrice) return;
    setAddLoading(true); setAddErr(null);
    try {
      const r = await fetch("/api/menu-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: addName.trim(), category: addCat, price_gbp: parseFloat(addPrice) }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setAddName(""); setAddPrice("");
      loadItems();
    } catch (e: any) { setAddErr(e?.message ?? "Failed to add item"); }
    finally { setAddLoading(false); }
  }

  async function removeItem(id: string) {
    try {
      await fetch(`/api/menu-items/${id}`, { method: "DELETE" });
      loadItems();
    } catch {}
  }

  async function enrichAll() {
    setEnrichingAll(true); setError(null);
    try {
      const r = await fetch("/api/menu-items/enrich-all", { method: "POST" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      loadItems();
    } catch (e: any) { setError(e?.message ?? "Failed to enrich all"); }
    finally { setEnrichingAll(false); }
  }

  async function enrichOne(id: string) {
    setEnrichingId(id);
    try {
      const r = await fetch(`/api/menu-items/${id}/enrich`, { method: "POST" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      setItems(prev => prev.map(i => i.id === id ? { ...i, enriched: true, enrichment: d.enrichment ?? d } : i));
      setExpandedId(id);
    } catch (e: any) { setError(e?.message ?? "Failed to enrich item"); }
    finally { setEnrichingId(null); }
  }

  useEffect(() => { loadItems(); }, [refreshTrigger]);

  const grouped = items.reduce((acc, item) => {
    (acc[item.category] = acc[item.category] ?? []).push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const unenriched = items.filter(i => !i.enriched).length;

  return (
    <div style={{
      background: G.card, borderRadius: "16px", border: "2px solid #e8e8e8",
      padding: "18px 22px", marginBottom: "14px",
      boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
        <div style={{
          width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
          background: G.green, color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "12px", fontWeight: "700",
        }}>M</div>
        <div style={{ fontSize: "clamp(14px,3.2vw,16px)", fontWeight: "700", flex: 1, color: G.green, letterSpacing: "0.4px" }}>
          Menu Options
        </div>
        {loading && <span style={{ fontSize: "11px", color: G.greenLight, fontStyle: "italic" }}>Loading…</span>}
        <button
          onClick={enrichAll}
          disabled={enrichingAll || unenriched === 0}
          style={{
            padding: "5px 12px", borderRadius: "20px",
            border: `1.5px solid ${G.green}`,
            background: enrichingAll || unenriched === 0 ? "#ccc" : "#e6f4ee",
            color: enrichingAll || unenriched === 0 ? "#fff" : G.green,
            fontSize: "11px", fontWeight: "700",
            cursor: enrichingAll || unenriched === 0 ? "not-allowed" : "pointer",
            fontFamily: "'Georgia',serif", flexShrink: 0,
          }}
        >
          {enrichingAll ? "Enriching…" : `Enrich All (${unenriched})`}
        </button>
      </div>

      {error && (
        <div style={{ background: "#fdecea", border: `1px solid ${G.red}`, borderRadius: "8px", padding: "8px 12px", color: G.red, fontSize: "12px", marginBottom: "12px" }}>
          {error} — <button onClick={loadItems} style={{ background: "none", border: "none", color: G.red, cursor: "pointer", textDecoration: "underline", fontSize: "12px" }}>Retry</button>
        </div>
      )}

      {/* Items grouped by category */}
      {MENU_CATEGORIES.map(cat => {
        const catItems = grouped[cat] ?? [];
        if (catItems.length === 0) return null;
        return (
          <div key={cat} style={{ marginBottom: "12px" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: G.green, marginBottom: "6px", letterSpacing: "0.3px" }}>
              {CATEGORY_DISPLAY[cat] ?? cat.replace("_", " ")}
            </div>
            {catItems.map(item => {
              const emoji = ITEM_EMOJIS[item.name] ?? CAT_DEFAULT_EMOJI[item.category] ?? "🍽️";
              const expanded = expandedId === item.id;
              return (
                <div key={item.id} style={{
                  background: "#f9f9f9", borderRadius: "10px", marginBottom: "6px",
                  border: item.enriched ? `1.5px solid ${G.green}` : "1.5px solid #eee",
                  overflow: "hidden",
                }}>
                  {/* Item row */}
                  <div
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", cursor: item.enriched ? "pointer" : "default" }}
                    onClick={() => item.enriched && setExpandedId(expanded ? null : item.id)}
                  >
                    <span style={{ fontSize: "18px", flexShrink: 0 }}>{emoji}</span>
                    <span style={{ flex: 1, fontSize: "13px", fontWeight: "600", color: "#333" }}>{item.name}</span>
                    <span style={{ fontSize: "12px", color: G.green, fontWeight: "700", flexShrink: 0 }}>£{item.price.toFixed(2)}</span>
                    {/* Dietary tags */}
                    {item.enrichment?.tags && item.enrichment.tags.filter(t => t === "vegetarian" || t === "vegan").map((t, ti) => (
                      <span key={ti} style={{ padding: "1px 6px", borderRadius: "8px", fontSize: "9px", fontWeight: "600", background: "#dcfce7", color: "#15803d", flexShrink: 0 }}>
                        {t}
                      </span>
                    ))}
                    {item.enrichment?.tags && item.enrichment.tags.filter(t => t.startsWith("contains_")).slice(0, 2).map((t, ti) => (
                      <span key={ti} style={{ padding: "1px 6px", borderRadius: "8px", fontSize: "9px", fontWeight: "600", background: "#fee2e2", color: "#dc2626", flexShrink: 0 }}>
                        {t.replace("contains_", "")}
                      </span>
                    ))}
                    {/* Enrichment dot */}
                    <span style={{
                      width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                      background: item.enriched ? G.green : "#ccc", display: "inline-block",
                    }} title={item.enriched ? "Enriched" : "Not enriched"} />
                    {/* Enrich button */}
                    {!item.enriched && (
                      <button
                        onClick={e => { e.stopPropagation(); enrichOne(item.id); }}
                        disabled={enrichingId === item.id}
                        style={{
                          padding: "3px 10px", borderRadius: "8px",
                          border: `1px solid ${G.green}`, background: "#e6f4ee",
                          color: G.green, fontSize: "11px", fontWeight: "600",
                          cursor: enrichingId === item.id ? "not-allowed" : "pointer",
                          fontFamily: "'Georgia',serif", flexShrink: 0,
                        }}
                      >
                        {enrichingId === item.id ? "…" : "Enrich"}
                      </button>
                    )}
                    {/* Remove button */}
                    {!item.is_base && (
                      <button
                        onClick={e => { e.stopPropagation(); removeItem(item.id); }}
                        style={{
                          background: "#fdecea", border: "none", borderRadius: "6px",
                          color: G.red, fontSize: "10px", fontWeight: "700", cursor: "pointer",
                          padding: "2px 6px", flexShrink: 0,
                        }}
                      >✕</button>
                    )}
                  </div>

                  {/* Enriching indicator */}
                  {enrichingId === item.id && (
                    <div style={{ fontSize: "11px", color: G.greenLight, fontStyle: "italic", padding: "4px 10px 8px" }}>
                      Enriching via OpenAI…
                    </div>
                  )}

                  {/* Enrichment detail (collapsible) */}
                  {expanded && item.enriched && item.enrichment && (
                    <div style={{ padding: "0 10px 10px", borderTop: "1px solid #e8e8e8" }}>
                      {item.enrichment.ingredients.length > 0 && (
                        <div style={{ fontSize: "11px", color: "#555", marginBottom: "6px", marginTop: "8px" }}>
                          <span style={{ fontWeight: "700", color: "#333" }}>Ingredients: </span>
                          {item.enrichment.ingredients.join(", ")}
                        </div>
                      )}
                      <div style={{ fontSize: "11px", color: "#555", marginBottom: "8px" }}>
                        <span style={{ fontWeight: "700", color: "#333" }}>Nutrition: </span>
                        {item.enrichment.nutrition.cal ?? item.enrichment.nutrition.calories ?? "—"} kcal · {item.enrichment.nutrition.protein_g ?? item.enrichment.nutrition.protein ?? "—"}g protein · {item.enrichment.nutrition.carbs_g ?? item.enrichment.nutrition.carbs ?? "—"}g carbs · {item.enrichment.nutrition.fat_g ?? item.enrichment.nutrition.fat ?? "—"}g fat
                      </div>
                      {item.enrichment.tags.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                          <span style={{ fontSize: "11px", fontWeight: "700", color: "#333", marginRight: "2px" }}>Tags:</span>
                          {item.enrichment.tags.map((tag, ti) => (
                            <span key={ti} style={{
                              padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: "600",
                              ...tagPillStyle(tag),
                            }}>
                              {tag.replace(/_/g, " ")}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {items.length === 0 && !loading && (
        <div style={{ fontSize: "12px", color: "#aaa", fontStyle: "italic", marginBottom: "12px" }}>
          No menu items loaded. Check /api/menu-items endpoint.
        </div>
      )}

      {/* Add item form */}
      <div style={{
        background: "#f5f1e8", borderRadius: "10px", padding: "12px",
        marginTop: "10px", border: "1px dashed #d5c9b0",
      }}>
        <div style={{ fontSize: "11px", fontWeight: "700", color: G.green, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Add Item
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "6px" }}>
          <input
            value={addName}
            onChange={e => setAddName(e.target.value)}
            placeholder="Item name"
            style={{ flex: 2, minWidth: "120px", padding: "7px 10px", border: "1.5px solid #ddd", borderRadius: "8px", fontSize: "12px", fontFamily: "'Georgia',serif", outline: "none" }}
            onFocus={e => e.currentTarget.style.borderColor = G.green}
            onBlur={e => e.currentTarget.style.borderColor = "#ddd"}
          />
          <select
            value={addCat}
            onChange={e => setAddCat(e.target.value)}
            style={{ flex: 1, minWidth: "90px", padding: "7px 8px", border: "1.5px solid #ddd", borderRadius: "8px", fontSize: "12px", fontFamily: "'Georgia',serif", outline: "none" }}
          >
            {MENU_CATEGORIES.map(c => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
          </select>
          <input
            type="number"
            value={addPrice}
            onChange={e => setAddPrice(e.target.value)}
            placeholder="£0.00"
            min="0"
            step="0.10"
            style={{ flex: 1, minWidth: "70px", padding: "7px 10px", border: "1.5px solid #ddd", borderRadius: "8px", fontSize: "12px", fontFamily: "'Georgia',serif", outline: "none" }}
            onFocus={e => e.currentTarget.style.borderColor = G.green}
            onBlur={e => e.currentTarget.style.borderColor = "#ddd"}
          />
        </div>
        <button
          onClick={addItem}
          disabled={addLoading || !addName.trim() || !addPrice}
          style={{
            background: addLoading || !addName.trim() || !addPrice ? "#ccc" : G.green,
            color: "#fff", border: "none", borderRadius: "8px",
            padding: "8px 16px", fontSize: "12px", fontWeight: "700",
            cursor: addLoading || !addName.trim() || !addPrice ? "not-allowed" : "pointer",
            fontFamily: "'Georgia',serif",
          }}
        >
          {addLoading ? "Adding…" : "+ Add Item"}
        </button>
        {addErr && <div style={{ fontSize: "11px", color: G.red, marginTop: "6px" }}>{addErr}</div>}
      </div>
    </div>
  );
}

// ─── FrameworkConfigPanel ─────────────────────────────────────────────────────

const ALLERGEN_OPTIONS = [
  "contains_gluten", "contains_dairy", "contains_eggs", "contains_nuts",
  "contains_fish", "contains_shellfish", "contains_soy", "contains_sesame",
];

function FrameworkConfigPanel() {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<FrameworkConfig>({
    weather_weight: 1.0,
    trends_weight: 1.0,
    seasonal_weight: 1.0,
    events_weight: 1.0,
    regional_weight: 1.0,
    target_pct_veggie: 30,
    target_pct_vegan: 15,
    target_pct_gluten_free: 20,
    avg_price_target_gbp: 7.0,
    exclude_allergens: [],
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadConfig() {
    try {
      const r = await fetch("/api/framework-config");
      if (r.ok) setConfig(await r.json());
    } catch {}
  }

  async function saveConfig() {
    setLoading(true); setError(null);
    try {
      const r = await fetch("/api/framework-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) { setError(e?.message ?? "Failed to save"); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadConfig(); }, []);

  const sliders = [
    { key: "weather_weight" as const, label: "Weather influence" },
    { key: "trends_weight" as const, label: "Trends influence" },
    { key: "seasonal_weight" as const, label: "Seasonal influence" },
    { key: "events_weight" as const, label: "Events influence" },
    { key: "regional_weight" as const, label: "Regional influence" },
  ];

  const targets = [
    { key: "target_pct_veggie" as const, label: "Target % vegetarian" },
    { key: "target_pct_vegan" as const, label: "Target % vegan" },
    { key: "target_pct_gluten_free" as const, label: "Target % gluten-free" },
  ];

  return (
    <div style={{ marginBottom: "18px" }}>
      {/* Collapsible header */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          background: G.card, borderRadius: "12px",
          padding: "14px 18px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: "10px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          marginBottom: open ? "2px" : "0",
          WebkitTapHighlightColor: "transparent", userSelect: "none",
          border: "1.5px solid #e8e8e8",
        }}
      >
        <div style={{ fontSize: "14px" }}>⚙️</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "14px", fontWeight: "700", color: G.green }}>Framework & Config</div>
          <div style={{ fontSize: "11px", color: "#aaa" }}>Weights, targets, allergen exclusions</div>
        </div>
        <div style={{ fontSize: "18px", color: G.green, transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>⌄</div>
      </div>

      {open && (
        <div style={{
          background: G.card, borderRadius: "12px", padding: "18px 20px",
          boxShadow: "0 4px 14px rgba(26,95,63,0.09)",
          border: "1.5px solid #e8e8e8",
        }}>
          {/* Influence sliders */}
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "12px", fontWeight: "700", color: G.green, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Influence Weights
            </div>
            {sliders.map(s => (
              <div key={s.key} style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                  <label style={{ fontSize: "12px", color: "#555" }}>{s.label}</label>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: G.green }}>{(config[s.key] ?? 1.0).toFixed(1)}</span>
                </div>
                <input
                  type="range" min="0" max="2" step="0.1"
                  value={config[s.key] ?? 1.0}
                  onChange={e => setConfig(prev => ({ ...prev, [s.key]: parseFloat(e.target.value) }))}
                  style={{ width: "100%", accentColor: G.green }}
                />
              </div>
            ))}
          </div>

          {/* Target percentages */}
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "12px", fontWeight: "700", color: G.green, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Dietary Targets
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "10px" }}>
              {targets.map(t => (
                <div key={t.key}>
                  <label style={{ fontSize: "10px", color: "#888", display: "block", marginBottom: "3px" }}>{t.label}</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <input
                      type="number" min="0" max="100"
                      value={config[t.key]}
                      onChange={e => setConfig(prev => ({ ...prev, [t.key]: parseInt(e.target.value) || 0 }))}
                      style={{ width: "100%", padding: "6px 8px", border: "1.5px solid #ddd", borderRadius: "7px", fontSize: "13px", fontFamily: "'Georgia',serif", outline: "none", textAlign: "center" }}
                    />
                    <span style={{ fontSize: "11px", color: "#888", flexShrink: 0 }}>%</span>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <label style={{ fontSize: "10px", color: "#888", display: "block", marginBottom: "3px" }}>Average price target (£)</label>
              <input
                type="number" min="0" step="0.50"
                value={config.avg_price_target_gbp}
                onChange={e => setConfig(prev => ({ ...prev, avg_price_target_gbp: parseFloat(e.target.value) || 0 }))}
                style={{ width: "100px", padding: "6px 8px", border: "1.5px solid #ddd", borderRadius: "7px", fontSize: "13px", fontFamily: "'Georgia',serif", outline: "none" }}
              />
            </div>
          </div>

          {/* Allergen exclusions */}
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "12px", fontWeight: "700", color: G.green, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Allergen Exclusions
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {ALLERGEN_OPTIONS.map(a => {
                const checked = config.exclude_allergens.includes(a);
                return (
                  <label key={a} style={{
                    display: "flex", alignItems: "center", gap: "5px",
                    padding: "4px 10px", borderRadius: "20px", cursor: "pointer",
                    background: checked ? "#fee2e2" : "#f0f0f0",
                    border: `1.5px solid ${checked ? "#fca5a5" : "#e0e0e0"}`,
                    fontSize: "11px", fontWeight: "600",
                    color: checked ? "#b91c1c" : "#555",
                    userSelect: "none",
                  }}>
                    <input
                      type="checkbox" checked={checked}
                      onChange={e => setConfig(prev => ({
                        ...prev,
                        exclude_allergens: e.target.checked
                          ? [...prev.exclude_allergens, a]
                          : prev.exclude_allergens.filter(x => x !== a),
                      }))}
                      style={{ display: "none" }}
                    />
                    {a.replace("contains_", "")}
                  </label>
                );
              })}
            </div>
          </div>


          {error && <div style={{ fontSize: "12px", color: G.red, marginBottom: "8px" }}>{error}</div>}

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={saveConfig}
              disabled={loading}
              style={{
                background: loading ? "#ccc" : G.green, color: "#fff",
                border: "none", borderRadius: "10px",
                padding: "10px 22px", fontSize: "13px", fontWeight: "700",
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "'Georgia',serif",
              }}
            >
              {loading ? "Saving…" : "Save Config"}
            </button>
            {saved && (
              <span style={{ fontSize: "13px", fontWeight: "700", color: G.green }}>
                Saved ✓
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MenuProposalSection ──────────────────────────────────────────────────────

function MenuProposalSection({
  weatherResult, trendsResult, seasonResult, celebResult, regionResult, activeRegion,
}: {
  weatherResult: { avg_temp: number; condition: string; is_rainy: boolean } | null;
  trendsResult: { trends: TrendItem[]; source: string } | null;
  seasonResult: { month: string; items: SeasonalItem[]; source: string } | null;
  celebResult: { upcoming: Celebration[]; source: string } | null;
  regionResult: { region: string; insights: RegionalInsight[]; menu_suggestions?: FoodSuggestion[]; source: string } | null;
  activeRegion: string;
}) {
  const [proposal, setProposal] = useState<MenuProposalResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate when weather result arrives (final required input)
  useEffect(() => {
    if (weatherResult) generateProposal();
  }, [weatherResult, activeRegion]);

  async function generateProposal() {
    setLoading(true); setError(null); setProposal(null);
    try {
      const activeTrends = trendsResult
        ? trendsResult.trends.filter(t => t.direction === "up").map(t => t.label)
        : [];
      const seasonalNames = seasonResult ? seasonResult.items.map(i => i.name) : [];
      const nextCeleb = celebResult ? (celebResult.upcoming?.[0]?.name ?? "") : "";

      const body: Record<string, unknown> = {
        region: activeRegion,
        active_trends: activeTrends,
        seasonal_items: seasonalNames,
        upcoming_celebration: nextCeleb,
      };
      if (weatherResult) {
        body.avg_temp = weatherResult.avg_temp;
        body.is_rainy = weatherResult.is_rainy;
        body.condition = weatherResult.condition;
      }

      const r = await fetch("/api/menu-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const raw = await r.json();
      // Normalise price_gbp → price throughout the proposal response
      if (raw.featured_items) {
        raw.featured_items = raw.featured_items.map((i: any) => ({ ...i, price: i.price_gbp ?? i.price ?? 0 }));
      }
      if (raw.categories) {
        Object.keys(raw.categories).forEach(cat => {
          raw.categories[cat] = raw.categories[cat].map((i: any) => ({ ...i, price: i.price_gbp ?? i.price ?? 0 }));
        });
      }
      setProposal(raw);
    } catch (e: any) { setError(e?.message ?? "Failed to generate proposal"); }
    finally { setLoading(false); }
  }

  return (
    <div style={{
      background: G.card, borderRadius: "16px",
      border: `2px solid ${G.green}`,
      padding: "20px 22px", marginBottom: "18px",
      boxShadow: "0 4px 14px rgba(26,95,63,0.09)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
        <div style={{ fontSize: "20px" }}>🍽️</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "16px", fontWeight: "700", color: G.green, letterSpacing: "0.4px" }}>Menu Proposal</div>
          <div style={{ fontSize: "11px", color: "#888" }}>AI-powered menu based on all signals</div>
        </div>
        <button
          onClick={generateProposal}
          disabled={loading}
          style={{
            background: "transparent", color: G.green,
            border: `1.5px solid ${G.green}`, borderRadius: "8px",
            padding: "6px 12px", fontSize: "11px", fontWeight: "700",
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "'Georgia',serif", flexShrink: 0, opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? "…" : "↻ Refresh"}
        </button>
      </div>

      {error && (
        <div style={{ background: "#fdecea", border: `1px solid ${G.red}`, borderRadius: "8px", padding: "10px 14px", color: G.red, fontSize: "12px", marginBottom: "12px" }}>
          {error}
        </div>
      )}

      {!proposal && !loading && (
        <div style={{ fontSize: "12px", color: "#aaa", fontStyle: "italic", textAlign: "center", padding: "16px 0" }}>
          Proposal generates automatically after ▶ Run SmarTR completes.
        </div>
      )}

      {proposal && (
        <>
          {/* Featured items */}
          {proposal.featured_items && proposal.featured_items.length > 0 && (
            <div style={{ marginBottom: "18px" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: G.green, marginBottom: "10px" }}>
                ⭐ Featured Items
              </div>
              {proposal.featured_items.map((item, i) => (
                <div key={i} style={{
                  padding: "10px 12px", background: "#f0f9f4",
                  borderRadius: "10px", marginBottom: "8px",
                  border: `1.5px solid ${G.green}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <span style={{ fontSize: "14px" }}>⭐</span>
                    <span style={{ flex: 1, fontSize: "14px", fontWeight: "700", color: "#222" }}>{item.name}</span>
                    <span style={{ fontSize: "11px", color: "#888", textTransform: "capitalize" }}>{item.category}</span>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: G.green }}>£{item.price.toFixed(2)}</span>
                  </div>
                  {/* Score bar */}
                  <div style={{ height: "6px", background: "#e0e0e0", borderRadius: "3px", marginBottom: "6px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: "3px",
                      background: G.green,
                      width: `${Math.min(100, Math.round(item.score * 100))}%`,
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                  {item.reason && (
                    <div style={{ fontSize: "11px", color: "#555", fontStyle: "italic" }}>{item.reason}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* All items by category — visual food cards */}
          {proposal.categories && Object.keys(proposal.categories).length > 0 && (
            <div>
              {Object.entries(proposal.categories).map(([cat, catItems]) => {
                const sorted = [...catItems].sort((a, b) => b.score - a.score);
                const catLabel = CATEGORY_DISPLAY[cat] ?? cat.replace(/_/g," ");
                return (
                  <div key={cat} style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: G.green, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "8px", borderBottom: `2px solid #e6f4ee`, paddingBottom: "4px" }}>
                      {catLabel}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: "8px" }}>
                      {sorted.map((item, i) => {
                        const isFeatured = (item as any).featured || (i === 0 && (item.score ?? 0) > 1);
                        const emoji = ITEM_EMOJIS[item.name] ?? CAT_DEFAULT_EMOJI[cat] ?? "🍽️";
                        const scoreW = Math.min(100, Math.round(((item.score ?? 0) / 6) * 100));
                        return (
                          <div key={i} style={{
                            background: isFeatured ? "#f0f9f4" : "#fafafa",
                            border: `1.5px solid ${isFeatured ? G.green : "#e8e8e8"}`,
                            borderRadius: "12px", padding: "10px 10px 8px",
                            position: "relative",
                          }}>
                            {isFeatured && <div style={{ position: "absolute", top: 5, right: 7, fontSize: "10px" }}>⭐</div>}
                            <div style={{ fontSize: "24px", marginBottom: "4px", lineHeight: 1 }}>{emoji}</div>
                            <div style={{ fontSize: "11px", fontWeight: "700", color: "#222", marginBottom: "2px", lineHeight: "1.3" }}>{item.name}</div>
                            <div style={{ fontSize: "11px", fontWeight: "700", color: G.green, marginBottom: "5px" }}>£{(item.price ?? 0).toFixed(2)}</div>
                            <div style={{ height: "3px", background: "#e0e0e0", borderRadius: "2px", overflow: "hidden" }}>
                              <div style={{ height: "100%", background: isFeatured ? G.green : "#b2d8c5", width: `${scoreW}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function FlowScreen({
  onOpenWeather,
  onOpenMcDonalds,
  onOpenBurgerKing,
  onOpenGreggs,
  onOpenNutrition,
  onOpenTrends,
  onOpenHistoric,
  onOpenSeasonal,
  onOpenCelebrations,
  onOpenRegional,
  onOpenEquipment,
  onOpenSupply,
}: {
  onOpenWeather: () => void;
  onOpenMcDonalds: () => void;
  onOpenBurgerKing: () => void;
  onOpenGreggs: () => void;
  onOpenNutrition: () => void;
  onOpenTrends: () => void;
  onOpenHistoric: () => void;
  onOpenSeasonal: () => void;
  onOpenCelebrations: () => void;
  onOpenRegional: () => void;
  onOpenEquipment: () => void;
  onOpenSupply: () => void;
}) {
  const [vans, setVans] = useState<Van[]>([]);
  const [selectedVan, setSelectedVan] = useState<string>("van_alpha");
  const [menuRefresh, setMenuRefresh] = useState(0);
  const [inputMode, setInputMode] = useState<"postcode"|"region">("postcode");
  const [postcodeInput, setPostcodeInput] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string|null>(null);
  const [selectedDate, setSelectedDate] = useState(next5Dates()[0]);

  const activePostcode = inputMode==="postcode"
    ? postcodeInput.trim()
    : UK_REGIONS.find(r=>r.label===selectedRegion)?.postcode ?? "";
  const activeRegion = selectedRegion ?? "London";

  useEffect(()=>{
    fetch("/api/vans").then(r=>r.json()).then(d=>{ if(d.vans) setVans(d.vans); });
  },[]);

  // Auto-select van whenever location or vans list changes
  useEffect(()=>{
    if (vans.length > 0) {
      const id = autoSelectVan(
        vans,
        inputMode==="postcode" ? postcodeInput : "",
        inputMode==="region"   ? (selectedRegion ?? "") : "",
      );
      setSelectedVan(id);
    }
  },[vans, postcodeInput, selectedRegion, inputMode]);

  const selectedVanData = vans.find(v=>v.id===selectedVan);

  // ── Pipeline state ────────────────────────────────────────────────────────
  type PS = StepStatus;
  const [equipStatus,      setEquipStatus]      = useState<PS>("idle");
  const [equipResult,      setEquipResult]      = useState<{van:Van;equipment:EqItem[];available_count:number;total_count:number}|null>(null);
  const [equipErr,         setEquipErr]         = useState<string|null>(null);

  const [supplyStatus,     setSupplyStatus]     = useState<PS>("idle");
  const [supplyResult,     setSupplyResult]     = useState<{suppliers:Supplier[];inventory:InvItem[]}|null>(null);
  const [supplyErr,        setSupplyErr]        = useState<string|null>(null);

  const [trendsStatus,     setTrendsStatus]     = useState<PS>("idle");
  const [trendsResult,     setTrendsResult]     = useState<{trends:TrendItem[];source:string}|null>(null);

  type HistoricData = {
    daily_stats:{date:string;total_covers:number;total_revenue_gbp:number;top_meal:string}[];
    top_meals:{meal_name:string;category:string;total_qty:number;total_revenue_gbp:number;pct_of_total:number}[];
    total_revenue_gbp:number; avg_daily_covers:number; best_day:string; source:string;
  };
  const [historicStatus,   setHistoricStatus]   = useState<PS>("idle");
  const [historicData,     setHistoricData]     = useState<HistoricData|null>(null);

  const [seasonStatus,     setSeasonStatus]     = useState<PS>("idle");
  const [seasonResult,     setSeasonResult]     = useState<{month:string;items:SeasonalItem[];source:string}|null>(null);

  const [celebStatus,      setCelebStatus]      = useState<PS>("idle");
  const [celebResult,      setCelebResult]      = useState<{upcoming:Celebration[];source:string}|null>(null);

  const [regionStatus,     setRegionStatus]     = useState<PS>("idle");
  const [regionResult,     setRegionResult]     = useState<{region:string;insights:RegionalInsight[];menu_suggestions?:FoodSuggestion[];source:string}|null>(null);

  const [competitorStatus, setCompetitorStatus] = useState<PS>("idle");

  const [weatherStatus,    setWeatherStatus]    = useState<PS>("idle");
  const [weatherResult,    setWeatherResult]    = useState<{avg_temp:number;condition:string;is_rainy:boolean}|null>(null);
  const [weatherErr,       setWeatherErr]       = useState<string|null>(null);

  const [decisionStatus,   setDecisionStatus]   = useState<PS>("idle");
  const [decisionResult,   setDecisionResult]   = useState<{primary_meal:string;primary_reason:string;menu_options:MenuOption[]}|null>(null);

  const [menuStatus,       setMenuStatus]       = useState<PS>("idle");
  const [menuResult,       setMenuResult]       = useState<any|null>(null);
  const [menuErr,          setMenuErr]          = useState<string|null>(null);

  const [running, setRunning] = useState(false);

  function resetAll() {
    setEquipStatus("idle");      setEquipResult(null);   setEquipErr(null);
    setSupplyStatus("idle");     setSupplyResult(null);  setSupplyErr(null);
    setTrendsStatus("idle");     setTrendsResult(null);
    setHistoricStatus("idle");   setHistoricData(null);
    setSeasonStatus("idle");     setSeasonResult(null);
    setCelebStatus("idle");      setCelebResult(null);
    setRegionStatus("idle");     setRegionResult(null);
    setCompetitorStatus("idle");
    setWeatherStatus("idle");    setWeatherResult(null); setWeatherErr(null);
    setDecisionStatus("idle");   setDecisionResult(null);
    setMenuStatus("idle");       setMenuResult(null);    setMenuErr(null);
  }

  async function runFlow() {
    if (!activePostcode) return;
    resetAll();
    setRunning(true);

    async function fetchJson(url:string, opts?:RequestInit) {
      const r = await fetch(url, opts);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    }
    const post = (url:string, body:object) => fetchJson(url,{
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify(body),
    });

    // ── Steps 1–7 concurrently + step 8 (competitor, static) ──────────────
    setEquipStatus("loading"); setSupplyStatus("loading");
    setTrendsStatus("loading"); setHistoricStatus("loading");
    setSeasonStatus("loading"); setCelebStatus("loading");
    setRegionStatus("loading"); setCompetitorStatus("loading");

    // Fetch menu item names to use as trend keywords
    let menuKeywords: string[] = [];
    try {
      const md = await fetchJson("/api/menu-items");
      menuKeywords = (md.items ?? []).map((i: any) => i.name).slice(0, 20);
    } catch {}

    const [eq, sup, tr, hi, sea, cel, reg] = await Promise.allSettled([
      post("/api/equipment/van", {van_id: selectedVan}),
      fetchJson("/api/supply/chain"),
      menuKeywords.length > 0
        ? post("/api/trends/custom", {keywords: menuKeywords})
        : fetchJson("/api/trends"),
      fetchJson("/api/historic"),
      fetchJson("/api/seasonal"),
      fetchJson("/api/celebrations"),
      post("/api/regional", {region: activeRegion}),
    ]);

    // Competitor menus is static — always completes
    setCompetitorStatus("done");

    if (eq.status==="fulfilled")  { setEquipResult(eq.value);   setEquipStatus("done"); }
    else                          { setEquipErr(String(eq.reason)); setEquipStatus("error"); }

    if (sup.status==="fulfilled") { setSupplyResult(sup.value); setSupplyStatus("done"); }
    else                          { setSupplyErr(String(sup.reason)); setSupplyStatus("error"); }

    if (tr.status==="fulfilled")  { setTrendsResult({...tr.value, source: menuKeywords.length > 0 ? "menu_items" : tr.value.source});  setTrendsStatus("done"); }
    else                           setTrendsStatus("error");

    if (hi.status==="fulfilled")  { setHistoricData(hi.value); setHistoricStatus("done"); }
    else                           setHistoricStatus("error");

    if (sea.status==="fulfilled") { setSeasonResult(sea.value); setSeasonStatus("done"); }
    else                           setSeasonStatus("error");

    if (cel.status==="fulfilled") { setCelebResult(cel.value);  setCelebStatus("done"); }
    else                           setCelebStatus("error");

    if (reg.status==="fulfilled") { setRegionResult(reg.value); setRegionStatus("done"); }
    else                           setRegionStatus("error");

    // ── Enrich any unenriched menu items (background, non-blocking) ────────
    fetch("/api/menu-items/enrich-all", { method: "POST" })
      .then(() => setMenuRefresh(n => n + 1))
      .catch(() => {});

    // ── Step 9: Weather ────────────────────────────────────────────────────
    setWeatherStatus("loading");
    let wr: {avg_temp:number; condition:string; is_rainy:boolean} | null = null;
    try {
      const data = await post("/api/weather", {postcode: activePostcode});
      if (data.error) throw new Error(data.error);
      const dayEntry = (data.forecast??[]).find((d:any)=>d.date===selectedDate);
      if (!dayEntry) throw new Error(`No forecast for ${selectedDate}`);
      wr = {avg_temp:dayEntry.avg_temp, condition:dayEntry.mainly, is_rainy:dayEntry.mainly==="mainly rain"};
      setWeatherResult(wr); setWeatherStatus("done");
    } catch(e:any) {
      setWeatherErr(e?.message??"Failed to fetch weather");
      setWeatherStatus("error"); setRunning(false); return;
    }

    // ── Step 10: Decision (client-side) ───────────────────────────────────
    setDecisionStatus("loading");
    const dec = decideAndOptions(wr.avg_temp, wr.is_rainy, wr.condition);
    setDecisionResult(dec); setDecisionStatus("done");

    // ── Step 11: Menu proposal ─────────────────────────────────────────────
    setMenuStatus("loading");
    try {
      // Read from settled results directly to avoid stale-closure issues
      const activeTrends = tr.status==="fulfilled"
        ? tr.value.trends.filter((t:any)=>t.direction==="up").map((t:any)=>t.label)
        : [];
      const seasonalNames = sea.status==="fulfilled"
        ? sea.value.items.map((i:any)=>i.name)
        : [];
      const nextCeleb = cel.status==="fulfilled"
        ? (cel.value.upcoming?.[0]?.name ?? "")
        : "";
      const data = await post("/api/menu",{
        avg_temp:wr.avg_temp, is_rainy:wr.is_rainy, condition:wr.condition,
        primary_meal:dec.primary_meal, region:activeRegion,
        active_trends:activeTrends, seasonal_items:seasonalNames,
        upcoming_celebration:nextCeleb,
      });
      setMenuResult(data); setMenuStatus("done");
    } catch(e:any) {
      setMenuErr(e?.message??"Failed to generate menu");
      setMenuStatus("error");
    }

    setRunning(false);
  }

  const dates   = next5Dates();
  const canRun  = !running && (inputMode==="postcode" ? postcodeInput.trim().length>0 : selectedRegion!==null);
  const allDone = [
    equipStatus,supplyStatus,trendsStatus,historicStatus,
    seasonStatus,celebStatus,regionStatus,competitorStatus,
    weatherStatus,decisionStatus,menuStatus,
  ].every(s=>s==="done"||s==="error");

  const tabBtn = (active:boolean): React.CSSProperties => ({
    flex:1, padding:"7px 4px", border:"none", fontFamily:"'Georgia',serif",
    background:active?G.green:"transparent", color:active?"#fff":G.green,
    fontWeight:"600", fontSize:"13px", cursor:"pointer",
    transition:"all 0.2s", WebkitTapHighlightColor:"transparent",
  });

  const dateBtn = (active:boolean): React.CSSProperties => ({
    padding:"7px 10px", borderRadius:"8px", border:`2px solid ${active?G.green:"#ddd"}`,
    background:active?"#e6f4ee":"#fafafa", color:active?G.green:"#444",
    fontSize:"12px", fontWeight:active?"700":"500", cursor:"pointer",
    fontFamily:"'Georgia',serif", display:"flex", justifyContent:"space-between",
    transition:"all 0.15s", WebkitTapHighlightColor:"transparent",
  });

  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(135deg,${G.green} 0%,${G.greenLight} 100%)`,fontFamily:"'Georgia',serif",padding:"16px"}}>

      {/* Header */}
      <div style={{display:"flex",alignItems:"baseline",gap:"10px",marginBottom:"20px"}}>
        <div style={{fontSize:"clamp(22px,5vw,30px)",fontWeight:"bold",color:G.cream,letterSpacing:"1px"}}>
          <em>SmarTR</em><span style={{fontStyle:"italic",fontWeight:"400",fontSize:"clamp(13px,3vw,18px)",opacity:0.8,marginLeft:"6px"}}> by TasteRover</span>
        </div>
      </div>

      <div style={{display:"flex",gap:"18px",alignItems:"flex-start",flexWrap:"wrap"}}>

        {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
        <div style={{background:G.card,borderRadius:"20px",padding:"20px",width:"clamp(240px,26vw,280px)",flexShrink:0,boxShadow:"0 8px 24px rgba(0,0,0,0.2)"}}>
          <div style={{fontWeight:"700",color:G.green,fontSize:"14px",marginBottom:"14px",letterSpacing:"0.5px"}}>INPUTS</div>

          {/* Auto-selected van */}
          <div style={{marginBottom:"16px"}}>
            <label style={{fontSize:"11px",color:"#777",display:"block",marginBottom:"6px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Van (Auto-selected)</label>
            {vans.length===0
              ? <div style={{fontSize:"12px",color:"#aaa",fontStyle:"italic"}}>Loading…</div>
              : (
                <div style={{padding:"8px 10px",borderRadius:"8px",background:"#e6f4ee",border:`2px solid ${G.green}`}}>
                  <div style={{fontSize:"13px",fontWeight:"700",color:G.green}}>🚐 {selectedVanData?.name ?? selectedVan}</div>
                  <div style={{fontSize:"10px",color:"#666",marginTop:"2px"}}>{selectedVanData?.base_location ?? "Auto-assigned"}</div>
                </div>
              )
            }
          </div>

          {/* Location mode tabs */}
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
                onBlur={e=>e.currentTarget.style.borderColor="#e0e0e0"}
              />
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

          <FrameworkConfigPanel />

          <button onClick={runFlow} disabled={!canRun}
            style={{width:"100%",padding:"13px",background:canRun?G.green:"#ccc",color:"#fff",border:"none",borderRadius:"10px",fontSize:"15px",fontWeight:"700",cursor:canRun?"pointer":"not-allowed",fontFamily:"'Georgia',serif",letterSpacing:"1px",transition:"background 0.2s",WebkitTapHighlightColor:"transparent"}}>
            {running?"Running…":"▶ Run SmarTR"}
          </button>
        </div>

        {/* ── RIGHT PANEL ─────────────────────────────────────────────────── */}
        <div style={{flex:1,minWidth:"280px"}}>

          {weatherStatus==="idle"&&!running&&(
            <div style={{textAlign:"center",padding:"56px 24px",color:"rgba(255,255,255,0.55)",fontStyle:"italic",fontSize:"15px"}}>
              Choose a location and day — then press <strong style={{color:"rgba(255,255,255,0.85)"}}>▶ Run SmarTR</strong>.
            </div>
          )}

          {/* ══ GROUP 1: INPUT ══════════════════════════════════════════════ */}
          <ModuleGroup
            title="INPUT"
            borderColor="#2563eb"
            itemCount={2}
            defaultOpen={true}
          >
            {/* Menu Options (combined menu management + enrichment) */}
            <MenuModule refreshTrigger={menuRefresh} />

            {/* Competitor Menus */}
            <div style={{
              background:G.card, borderRadius:"16px", border:"2px solid #e8e8e8",
              padding:"18px 22px", marginBottom:"14px",
              boxShadow:"0 2px 6px rgba(0,0,0,0.05)",
            }}>
              <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"12px"}}>
                <div style={{
                  width:26,height:26,borderRadius:"50%",flexShrink:0,
                  background:G.green, color:"#fff",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:"12px",fontWeight:"700",
                }}>C</div>
                <div style={{fontSize:"clamp(14px,3.2vw,16px)",fontWeight:"700",flex:1,color:G.green,letterSpacing:"0.4px"}}>
                  Competitor Menus
                </div>
                <span style={{
                  display:"inline-block", fontSize:"10px", fontWeight:"600", color:"#888",
                  background:"#f0f0f0", border:"1px solid #ddd", borderRadius:"4px",
                  padding:"1px 6px", letterSpacing:"0.5px", textTransform:"uppercase", fontFamily:"monospace",
                }}>reference</span>
              </div>
              <div style={{fontSize:"12px",color:"#888",marginBottom:"10px"}}>
                Browse competitor menus for context and positioning.
              </div>
              <button
                onClick={onOpenMcDonalds}
                style={{
                  display:"flex", alignItems:"center", gap:"12px",
                  width:"100%", padding:"12px 14px",
                  background:"#fff7f0", border:"1.5px solid #ffd6a0",
                  borderRadius:"10px", cursor:"pointer",
                  fontFamily:"'Georgia',serif", textAlign:"left",
                  transition:"background 0.15s", WebkitTapHighlightColor:"transparent",
                }}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background="#fff0e0";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="#fff7f0";}}
              >
                <span style={{fontSize:"28px"}}>🍔</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:"14px",fontWeight:"700",color:"#c8600a"}}>McDonald's Menu</div>
                  <div style={{fontSize:"11px",color:"#888",marginTop:"2px"}}>Browse full menu & nutrition data →</div>
                </div>
              </button>
              <button
                onClick={onOpenBurgerKing}
                style={{
                  display:"flex", alignItems:"center", gap:"12px",
                  width:"100%", padding:"12px 14px", marginTop:"10px",
                  background:"#fff8f0", border:"1.5px solid #f5c06a",
                  borderRadius:"10px", cursor:"pointer",
                  fontFamily:"'Georgia',serif", textAlign:"left",
                  transition:"background 0.15s", WebkitTapHighlightColor:"transparent",
                }}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background="#fff0dc";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="#fff8f0";}}
              >
                <span style={{fontSize:"28px"}}>👑</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:"14px",fontWeight:"700",color:"#b8520a"}}>Burger King Menu</div>
                  <div style={{fontSize:"11px",color:"#888",marginTop:"2px"}}>Browse full menu & nutrition data →</div>
                </div>
              </button>
              <button
                onClick={onOpenGreggs}
                style={{
                  display:"flex", alignItems:"center", gap:"12px",
                  width:"100%", padding:"12px 14px", marginTop:"10px",
                  background:"#f0f9f4", border:"1.5px solid #a0d8b8",
                  borderRadius:"10px", cursor:"pointer",
                  fontFamily:"'Georgia',serif", textAlign:"left",
                  transition:"background 0.15s", WebkitTapHighlightColor:"transparent",
                }}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background="#dff2ea";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="#f0f9f4";}}
              >
                <span style={{fontSize:"28px"}}>🥐</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:"14px",fontWeight:"700",color:"#007a3d"}}>Greggs Menu</div>
                  <div style={{fontSize:"11px",color:"#888",marginTop:"2px"}}>Browse full menu & nutrition data →</div>
                </div>
              </button>
            </div>
          </ModuleGroup>

          {/* ══ GROUP 2: SUPPLY ═════════════════════════════════════════════ */}
          <ModuleGroup
            title="SUPPLY"
            borderColor="#d97706"
            itemCount={2}
            defaultOpen={true}
          >
            {/* ① Equipment */}
            <SectionCard step={1} title="Equipment Availability" status={equipStatus} dataLabel="mock"
              titleAction={<button onClick={onOpenEquipment} style={openModBtn}>Open module →</button>}
            >
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

            {/* ② Supply Chain & Inventory */}
            <SectionCard step={2} title="Supply Chain & Inventory" status={supplyStatus} dataLabel="mock"
              titleAction={<button onClick={onOpenSupply} style={openModBtn}>Open module →</button>}
            >
              {supplyStatus==="error"&&<div style={{color:G.red,fontSize:"13px"}}>{supplyErr}</div>}
              {supplyResult&&(
                <div>
                  <div style={{marginBottom:"12px"}}>
                    <div style={{fontWeight:"600",color:G.green,fontSize:"13px",marginBottom:"6px"}}>Supplier</div>
                    {supplyResult.suppliers.slice(0,1).map((s,i)=>(
                      <div key={i} style={{padding:"8px 10px",background:"#f9f9f9",borderRadius:"8px",marginBottom:"5px",display:"flex",gap:"10px",flexWrap:"wrap",alignItems:"flex-start"}}>
                        <div style={{flex:1,minWidth:"120px"}}>
                          <div style={{fontSize:"13px",fontWeight:"600",color:"#333"}}>🚚 {s.name}</div>
                          <div style={{fontSize:"11px",color:"#888"}}>{s.categories.slice(0,4).join(", ")}{s.categories.length>4?" …":""}</div>
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
          </ModuleGroup>

          {/* ══ GROUP 3: DEMAND ══════════════════════════════════════════════ */}
          <ModuleGroup
            title="DEMAND"
            borderColor="#1a5f3f"
            itemCount={6}
            defaultOpen={true}
          >
            {/* ③ Trends */}
            <SectionCard step={3} title="High-Level Trends" status={trendsStatus}
              dataLabel={trendsResult?.source==="google_trends"?"Google Trends":trendsResult?.source==="menu_items"?"Menu Items · Trends":"hardcoded"}
              titleAction={<button onClick={onOpenTrends} style={openModBtn}>Open module →</button>}
            >
              {trendsResult&&(
                <div>
                  {trendsResult.trends.filter(t=>t.direction==="up").length>0&&(
                    <div style={{marginBottom:"8px"}}>
                      <div style={{fontSize:"11px",color:"#888",marginBottom:"5px",textTransform:"uppercase",letterSpacing:"0.4px"}}>Rising trends — influencing menu</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:"5px"}}>
                        {trendsResult.trends.filter(t=>t.direction==="up").map((t,i)=>{
                          const catColors: Record<string,[string,string]> = {
                            main:["#e6f4ee",G.green], snack:["#fdf3e6","#a16207"],
                            beverage:["#e0f2fe","#0369a1"], dessert:["#fce7f3","#9d174d"],
                            cuisine:["#ede9fe","#6d28d9"], produce:["#f0fdf4","#166534"],
                          };
                          const [bg,col] = catColors[t.category]??["#e6f4ee",G.green];
                          return(
                            <span key={i} style={{padding:"4px 10px",borderRadius:"20px",background:bg,color:col,fontSize:"12px",fontWeight:"600"}}>
                              📈 {t.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {trendsResult.trends.filter(t=>t.direction!=="up").length>0&&(
                    <div style={{display:"flex",flexWrap:"wrap",gap:"5px"}}>
                      {trendsResult.trends.filter(t=>t.direction!=="up").map((t,i)=>{
                        const icon = t.direction==="down"?"📉":"➡️";
                        const bg   = t.direction==="down"?"#fdecea":"#f0f0f0";
                        const col  = t.direction==="down"?G.red:"#555";
                        return(
                          <span key={i} style={{padding:"3px 8px",borderRadius:"20px",background:bg,color:col,fontSize:"11px",fontWeight:"500"}}>
                            {icon} {t.label}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </SectionCard>

            {/* ④ Historic */}
            <SectionCard step={4} title="Historic Data" status={historicStatus} dataLabel="mock"
              titleAction={<button onClick={onOpenHistoric} style={openModBtn}>Open module →</button>}
            >
              {historicStatus==="idle"&&(
                <div style={{fontSize:"12px",color:"#aaa",fontStyle:"italic"}}>
                  Click <strong style={{color:G.green}}>Open module →</strong> to view full historic sales data.
                </div>
              )}
              {historicData&&(
                <div>
                  <div style={{display:"flex",gap:"14px",flexWrap:"wrap",marginBottom:"10px"}}>
                    <div style={{padding:"6px 12px",background:"#e6f4ee",borderRadius:"8px",textAlign:"center"}}>
                      <div style={{fontSize:"10px",color:"#888",textTransform:"uppercase",letterSpacing:"0.5px"}}>30-day Revenue</div>
                      <div style={{fontSize:"16px",fontWeight:"700",color:G.green}}>£{historicData.total_revenue_gbp.toLocaleString()}</div>
                    </div>
                    <div style={{padding:"6px 12px",background:"#e6f4ee",borderRadius:"8px",textAlign:"center"}}>
                      <div style={{fontSize:"10px",color:"#888",textTransform:"uppercase",letterSpacing:"0.5px"}}>Avg Daily Covers</div>
                      <div style={{fontSize:"16px",fontWeight:"700",color:G.green}}>{historicData.avg_daily_covers}</div>
                    </div>
                  </div>
                  <div style={{fontSize:"12px",color:"#888",marginBottom:"6px",fontWeight:"600"}}>Top meals</div>
                  {historicData.top_meals.slice(0,3).map((m,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:i<2?"1px solid #f0f0f0":"none",fontSize:"12px"}}>
                      <span style={{color:"#333"}}>{m.meal_name}</span>
                      <span style={{color:G.green,fontWeight:"700"}}>£{m.total_revenue_gbp.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* ⑤ Seasonal */}
            <SectionCard step={5} title="In-Season Foods" status={seasonStatus} dataLabel={seasonResult?.source==="openai"?"OpenAI":"hardcoded"}
              titleAction={<button onClick={onOpenSeasonal} style={openModBtn}>Open module →</button>}
            >
              {seasonResult&&(
                <div>
                  <div style={{fontSize:"11px",color:"#888",marginBottom:"6px",textTransform:"uppercase",letterSpacing:"0.4px"}}>In season — <strong style={{color:G.green}}>{seasonResult.month}</strong> — use in menu</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:"5px"}}>
                    {seasonResult.items.map((item,i)=>{
                      const catColors: Record<string,[string,string]> = {
                        produce:["#e6f4ee",G.green], protein:["#fdf3e6","#a16207"],
                        seafood:["#e0f2fe","#0369a1"], game:["#fdf3e6","#92400e"],
                        dairy:["#fce7f3","#9d174d"], dessert:["#fce7f3","#9d174d"],
                        beverage:["#e0f2fe","#0369a1"], grain:["#fefce8","#92400e"],
                      };
                      const [bg,col] = catColors[item.category]??["#e6f4ee",G.green];
                      return(
                        <span key={i} style={{padding:"4px 10px",borderRadius:"20px",background:bg,color:col,fontSize:"12px",fontWeight:"600"}}>
                          {item.name}
                          <span style={{fontSize:"10px",opacity:0.65,marginLeft:"4px"}}>{item.category}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </SectionCard>

            {/* ⑥ Celebrations */}
            <SectionCard step={6} title="Upcoming Events" status={celebStatus} dataLabel={celebResult?.source==="openai"?"OpenAI":"hardcoded"}
              titleAction={<button onClick={onOpenCelebrations} style={openModBtn}>Open module →</button>}
            >
              {celebResult&&(()=>{
                const catColors: Record<string,[string,string]> = {
                  main:["#e6f4ee",G.green], snack:["#fdf3e6","#a16207"],
                  beverage:["#e0f2fe","#0369a1"], dessert:["#fce7f3","#9d174d"],
                  produce:["#f0fdf4","#166534"],
                };
                return(
                  <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                    {celebResult.upcoming.slice(0,3).map((ev,i)=>(
                      <div key={i} style={{padding:"8px 10px",background:"#f9f9f9",borderRadius:"8px"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"5px"}}>
                          <span style={{fontSize:"13px",fontWeight:"600",color:"#333"}}>{ev.name}</span>
                          <span style={{fontSize:"11px",color:"#888",flexShrink:0,marginLeft:"8px"}}>{ev.days_away===0?"Today":`in ${ev.days_away}d`}</span>
                        </div>
                        {ev.menu_suggestions&&ev.menu_suggestions.length>0&&(
                          <div style={{display:"flex",flexWrap:"wrap",gap:"4px"}}>
                            {ev.menu_suggestions.map((s,j)=>{
                              const [bg,col] = catColors[s.category]??["#f0f0f0","#555"];
                              return(
                                <span key={j} style={{padding:"3px 8px",borderRadius:"20px",background:bg,color:col,fontSize:"11px",fontWeight:"600"}}>
                                  {s.name}
                                  <span style={{fontSize:"9px",opacity:0.65,marginLeft:"3px"}}>{s.category}</span>
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </SectionCard>

            {/* ⑦ Regional */}
            <SectionCard step={7} title="Demand by Region" status={regionStatus} dataLabel={regionResult?.source==="openai"?"OpenAI":"hardcoded"}
              titleAction={<button onClick={onOpenRegional} style={openModBtn}>Open module →</button>}
            >
              {regionResult&&(
                <div>
                  {regionResult.menu_suggestions&&regionResult.menu_suggestions.length>0&&(()=>{
                    const catColors: Record<string,[string,string]> = {
                      main:["#e6f4ee",G.green], snack:["#fdf3e6","#a16207"],
                      beverage:["#e0f2fe","#0369a1"], dessert:["#fce7f3","#9d174d"],
                      produce:["#f0fdf4","#166534"],
                    };
                    return(
                      <div>
                        <div style={{fontSize:"11px",color:"#888",marginBottom:"6px",textTransform:"uppercase",letterSpacing:"0.4px"}}>Regional menu items — <strong style={{color:G.green}}>{regionResult.region}</strong></div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:"5px",marginBottom:"8px"}}>
                          {regionResult.menu_suggestions!.map((s,i)=>{
                            const [bg,col] = catColors[s.category]??["#f0f0f0","#555"];
                            return(
                              <span key={i} style={{padding:"4px 10px",borderRadius:"20px",background:bg,color:col,fontSize:"12px",fontWeight:"600"}}>
                                {s.name}
                                <span style={{fontSize:"10px",opacity:0.65,marginLeft:"4px"}}>{s.category}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                  <div style={{fontSize:"11px",color:"#aaa",fontStyle:"italic"}}>
                    {regionResult.insights.length} demand insights available — open module for details
                  </div>
                </div>
              )}
            </SectionCard>

            {/* ⑧ Weather */}
            <SectionCard
              step={8} title="Weather" status={weatherStatus==="idle"?"done":weatherStatus}
              titleAction={<button onClick={onOpenWeather} style={openModBtn}>Open module →</button>}
            >
              {weatherStatus==="idle"&&(
                <div style={{fontSize:"12px",color:"#aaa",fontStyle:"italic"}}>
                  Run the full flow above, or open the Weather module independently.
                </div>
              )}
              {weatherStatus==="error"&&<div style={{color:G.red,fontSize:"13px"}}>{weatherErr}</div>}
              {weatherResult&&(
                <div>
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
                </div>
              )}
            </SectionCard>
          </ModuleGroup>


          {/* ══ PIPELINE OUTPUTS ════════════════════════════════════════════ */}

          {/* ══ MENU PROPOSAL SECTION ═══════════════════════════════════════ */}
          <MenuProposalSection
            weatherResult={weatherResult}
            trendsResult={trendsResult}
            seasonResult={seasonResult}
            celebResult={celebResult}
            regionResult={regionResult}
            activeRegion={activeRegion}
          />

        </div>
      </div>
    </div>
  );
}
