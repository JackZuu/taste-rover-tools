import { useState, useEffect } from "react";

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
type Celebration    = {name:string; date:string; days_away:number; food_opportunity:string};
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
  const borderColor = status==="done"?"#b2d8c5":status==="error"?G.red:status==="loading"?"#ccc":"#e8e8e8";
  return (
    <div style={{
      background:G.card, borderRadius:"16px", border:`2px solid ${borderColor}`,
      padding:"18px 22px", marginBottom:"14px",
      boxShadow:status==="done"?"0 4px 14px rgba(26,95,63,0.09)":"0 2px 6px rgba(0,0,0,0.05)",
      transition:"border-color 0.3s,box-shadow 0.3s",
    }}>
      <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:children?12:0}}>
        <div style={{
          width:26,height:26,borderRadius:"50%",flexShrink:0,
          background:status==="done"?G.green:status==="error"?G.red:"#ddd",
          color:"#fff",display:"flex",alignItems:"center",
          justifyContent:"center",fontSize:"12px",fontWeight:"700",
          transition:"background 0.3s",
        }}>{status==="loading"?"…":step}</div>
        <div style={{
          fontSize:"clamp(14px,3.2vw,16px)",fontWeight:"700",flex:1,
          color:status==="done"?G.green:status==="error"?G.red:"#bbb",
          letterSpacing:"0.4px",transition:"color 0.3s",
        }}>{title}</div>
        {status==="loading"&&<span style={{fontSize:"12px",color:"#aaa",fontStyle:"italic"}}>Loading…</span>}
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
  const [regionResult,     setRegionResult]     = useState<{region:string;insights:RegionalInsight[]}|null>(null);

  const [competitorStatus, setCompetitorStatus] = useState<PS>("idle");

  const [weatherStatus,    setWeatherStatus]    = useState<PS>("idle");
  const [weatherResult,    setWeatherResult]    = useState<{avg_temp:number;condition:string;is_rainy:boolean}|null>(null);
  const [weatherErr,       setWeatherErr]       = useState<string|null>(null);

  const [decisionStatus,   setDecisionStatus]   = useState<PS>("idle");
  const [decisionResult,   setDecisionResult]   = useState<{primary_meal:string;primary_reason:string;menu_options:MenuOption[]}|null>(null);

  const [nutritionStatus,  setNutritionStatus]  = useState<PS>("idle");
  const [nutritionResult,  setNutritionResult]  = useState<{items:NutritionItem[];total_calories_kcal:number}|null>(null);
  const [nutritionErr,     setNutritionErr]     = useState<string|null>(null);

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
    setNutritionStatus("idle");  setNutritionResult(null); setNutritionErr(null);
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

    const [eq, sup, tr, hi, sea, cel, reg] = await Promise.allSettled([
      post("/api/equipment/van", {van_id: selectedVan}),
      fetchJson("/api/supply/chain"),
      fetchJson("/api/trends"),
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

    if (tr.status==="fulfilled")  { setTrendsResult(tr.value);  setTrendsStatus("done"); }
    else                           setTrendsStatus("error");

    if (hi.status==="fulfilled")  { setHistoricData(hi.value); setHistoricStatus("done"); }
    else                           setHistoricStatus("error");

    if (sea.status==="fulfilled") { setSeasonResult(sea.value); setSeasonStatus("done"); }
    else                           setSeasonStatus("error");

    if (cel.status==="fulfilled") { setCelebResult(cel.value);  setCelebStatus("done"); }
    else                           setCelebStatus("error");

    if (reg.status==="fulfilled") { setRegionResult(reg.value); setRegionStatus("done"); }
    else                           setRegionStatus("error");

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

    // ── Step 11: Nutrition — always smash burger ───────────────────────────
    setNutritionStatus("loading");
    try {
      const data = await post("/api/nutrition", {ingredients:["1 smash burger"]});
      if (data.error) throw new Error(data.error);
      setNutritionResult(data); setNutritionStatus("done");
    } catch(e:any) {
      setNutritionErr(e?.message??"Failed to fetch nutrition");
      setNutritionStatus("error");
    }

    // ── Step 12: Menu proposal ─────────────────────────────────────────────
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
    weatherStatus,decisionStatus,nutritionStatus,menuStatus,
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
          <em>Smart</em><span style={{fontStyle:"normal"}}>R Food</span>
        </div>
        <div style={{fontSize:"11px",color:G.cream,opacity:0.6,fontStyle:"italic"}}>by Taste Rover</div>
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

          <button onClick={runFlow} disabled={!canRun}
            style={{width:"100%",padding:"13px",background:canRun?G.green:"#ccc",color:"#fff",border:"none",borderRadius:"10px",fontSize:"15px",fontWeight:"700",cursor:canRun?"pointer":"not-allowed",fontFamily:"'Georgia',serif",letterSpacing:"1px",transition:"background 0.2s",WebkitTapHighlightColor:"transparent"}}>
            {running?"Running…":"▶ Run SmarTR Food"}
          </button>
        </div>

        {/* ── RIGHT PANEL ─────────────────────────────────────────────────── */}
        <div style={{flex:1,minWidth:"280px"}}>

          {weatherStatus==="idle"&&!running&&(
            <div style={{textAlign:"center",padding:"56px 24px",color:"rgba(255,255,255,0.55)",fontStyle:"italic",fontSize:"15px"}}>
              Choose a location and day — then press <strong style={{color:"rgba(255,255,255,0.85)"}}>▶ Run SmarTR Food</strong>.
            </div>
          )}

          {/* ① Equipment */}
          <SectionCard step={1} title="Equipment Availability" status={equipStatus} dataLabel="mock"
            titleAction={<button onClick={onOpenEquipment} style={{marginLeft:"auto",padding:"4px 10px",border:`1.5px solid ${equipStatus==="done"?G.green:"rgba(255,255,255,0.6)"}`,borderRadius:"20px",background:"transparent",color:equipStatus==="done"?G.green:"#fff",fontSize:"11px",fontWeight:"600",cursor:"pointer",fontFamily:"'Georgia',serif",WebkitTapHighlightColor:"transparent",flexShrink:0}}>Open module →</button>}
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

          {/* ② Supply Chain */}
          <SectionCard step={2} title="Supply Chain & Inventory" status={supplyStatus} dataLabel="mock"
            titleAction={<button onClick={onOpenSupply} style={{marginLeft:"auto",padding:"4px 10px",border:`1.5px solid ${supplyStatus==="done"?G.green:"rgba(255,255,255,0.6)"}`,borderRadius:"20px",background:"transparent",color:supplyStatus==="done"?G.green:"#fff",fontSize:"11px",fontWeight:"600",cursor:"pointer",fontFamily:"'Georgia',serif",WebkitTapHighlightColor:"transparent",flexShrink:0}}>Open module →</button>}
          >
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
          <SectionCard step={3} title="High-Level Trends" status={trendsStatus}
            dataLabel={trendsResult?.source==="google_trends"?"Google Trends":"hardcoded"}
            titleAction={<button onClick={onOpenTrends} style={{marginLeft:"auto",padding:"4px 10px",border:`1.5px solid ${trendsStatus==="done"?G.green:"rgba(255,255,255,0.6)"}`,borderRadius:"20px",background:"transparent",color:trendsStatus==="done"?G.green:"#fff",fontSize:"11px",fontWeight:"600",cursor:"pointer",fontFamily:"'Georgia',serif",WebkitTapHighlightColor:"transparent",flexShrink:0}}>Open module →</button>}
          >
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
          <SectionCard step={4} title="Tasterover Historic Data" status={historicStatus} dataLabel="mock"
            titleAction={<button onClick={onOpenHistoric} style={{marginLeft:"auto",padding:"4px 10px",border:`1.5px solid ${historicStatus==="idle"?G.green:historicStatus==="done"?G.green:"rgba(255,255,255,0.6)"}`,borderRadius:"20px",background:"transparent",color:historicStatus==="idle"||historicStatus==="done"?G.green:"#fff",fontSize:"11px",fontWeight:"600",cursor:"pointer",fontFamily:"'Georgia',serif",WebkitTapHighlightColor:"transparent",flexShrink:0}}>Open module →</button>}
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
            titleAction={<button onClick={onOpenSeasonal} style={{marginLeft:"auto",padding:"4px 10px",border:`1.5px solid ${seasonStatus==="done"?G.green:"rgba(255,255,255,0.6)"}`,borderRadius:"20px",background:"transparent",color:seasonStatus==="done"?G.green:"#fff",fontSize:"11px",fontWeight:"600",cursor:"pointer",fontFamily:"'Georgia',serif",WebkitTapHighlightColor:"transparent",flexShrink:0}}>Open module →</button>}
          >
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
          <SectionCard step={6} title="Upcoming Events" status={celebStatus} dataLabel={celebResult?.source==="openai"?"OpenAI":"hardcoded"}
            titleAction={<button onClick={onOpenCelebrations} style={{marginLeft:"auto",padding:"4px 10px",border:`1.5px solid ${celebStatus==="done"?G.green:"rgba(255,255,255,0.6)"}`,borderRadius:"20px",background:"transparent",color:celebStatus==="done"?G.green:"#fff",fontSize:"11px",fontWeight:"600",cursor:"pointer",fontFamily:"'Georgia',serif",WebkitTapHighlightColor:"transparent",flexShrink:0}}>Open module →</button>}
          >
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
          <SectionCard step={7} title="Demand by Region" status={regionStatus} dataLabel="hardcoded"
            titleAction={<button onClick={onOpenRegional} style={{marginLeft:"auto",padding:"4px 10px",border:`1.5px solid ${regionStatus==="done"?G.green:"rgba(255,255,255,0.6)"}`,borderRadius:"20px",background:"transparent",color:regionStatus==="done"?G.green:"#fff",fontSize:"11px",fontWeight:"600",cursor:"pointer",fontFamily:"'Georgia',serif",WebkitTapHighlightColor:"transparent",flexShrink:0}}>Open module →</button>}
          >
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

          {/* ⑧ Competitor Menus */}
          <SectionCard step={8} title="Competitor Menus" status={competitorStatus==="idle"?"done":competitorStatus} dataLabel="reference">
            <div>
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
          </SectionCard>

          {/* ⑨ Weather */}
          <SectionCard
            step={9} title="Weather" status={weatherStatus==="idle"?"done":weatherStatus}
            titleAction={
              <button onClick={onOpenWeather}
                style={{
                  marginLeft:"auto", padding:"4px 10px",
                  border:`1.5px solid ${weatherStatus==="idle"?G.green:"rgba(255,255,255,0.6)"}`, borderRadius:"20px",
                  background:"transparent", color:weatherStatus==="idle"?G.green:"#fff",
                  fontSize:"11px", fontWeight:"600", cursor:"pointer",
                  fontFamily:"'Georgia',serif", WebkitTapHighlightColor:"transparent",
                  flexShrink:0,
                }}>
                Open tool →
              </button>
            }
          >
            {weatherStatus==="idle"&&(
              <div style={{fontSize:"12px",color:"#aaa",fontStyle:"italic"}}>
                Click <strong style={{color:G.green}}>Open tool →</strong> to check weather independently, or run the full flow above.
              </div>
            )}
            {weatherStatus==="error"&&<div style={{color:G.red,fontSize:"13px"}}>{weatherErr}</div>}
            {weatherResult&&(
              <div>
                <div style={{display:"flex",alignItems:"center",gap:"16px",flexWrap:"wrap",marginBottom:decisionResult?"12px":"0"}}>
                  <div style={{fontSize:"48px"}}>{condIcon(weatherResult.condition)}</div>
                  <div>
                    <div style={{fontSize:"36px",fontWeight:"bold",color:G.green,lineHeight:"1"}}>{weatherResult.avg_temp.toFixed(1)}°C</div>
                    <div style={{fontSize:"13px",color:"#555",marginTop:"4px",textTransform:"capitalize"}}>{weatherResult.condition}</div>
                  </div>
                  <div style={{marginLeft:"auto"}}>
                    <StatusBadge ok={!weatherResult.is_rainy} labelOk="Not rainy" labelNo="Rainy"/>
                  </div>
                </div>
                {decisionResult&&(
                  <div style={{padding:"10px 12px",background:"#e6f4ee",borderRadius:"8px",display:"flex",alignItems:"center",gap:"10px"}}>
                    <span style={{fontSize:"22px"}}>{decisionResult.primary_meal==="strawberry ice cream"?"🍓":"🍅"}</span>
                    <div>
                      <div style={{fontSize:"11px",color:"#888",textTransform:"uppercase",letterSpacing:"0.5px"}}>Recommended</div>
                      <div style={{fontSize:"13px",fontWeight:"700",color:G.green,textTransform:"capitalize"}}>{decisionResult.primary_meal}</div>
                      <div style={{fontSize:"11px",color:"#555",fontStyle:"italic"}}>{decisionResult.primary_reason}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </SectionCard>

          {/* ⑩ Menu Framework */}
          <SectionCard step={10} title="Menu Framework & Configuration" status={decisionStatus==="idle"?"done":decisionStatus} dataLabel="hardcoded">
            <div>
              <div style={{fontSize:"12px",color:"#888",marginBottom:"12px"}}>
                Parameters that shape the final menu proposal.
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"10px"}}>
                {[
                  {label:"Dietary Mix",    detail:"30% Veggie · 15% Vegan · 20% GF"},
                  {label:"Mains",          detail:"450–750 kcal per portion"},
                  {label:"Sides",          detail:"150–350 kcal per portion"},
                  {label:"Desserts",       detail:"200–400 kcal per portion"},
                  {label:"Drinks",         detail:"£2–£5 · hot & cold options"},
                  {label:"Allergens",      detail:"Nuts excluded · Dairy labelled"},
                  {label:"Price bands",    detail:"Mains £8–£14 · Sides £3–£6"},
                  {label:"Items per tab",  detail:"6–12 items per category"},
                ].map(row=>(
                  <div key={row.label} style={{padding:"8px 10px",background:"#f9f9f9",borderRadius:"8px",border:"1px solid #eee"}}>
                    <div style={{fontSize:"10px",color:"#888",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"3px"}}>{row.label}</div>
                    <div style={{fontSize:"12px",fontWeight:"600",color:"#333"}}>{row.detail}</div>
                  </div>
                ))}
              </div>
              {decisionResult&&(
                <div style={{padding:"8px 12px",background:"#f0f0f0",borderRadius:"8px",fontSize:"11px",color:"#777",fontStyle:"italic"}}>
                  Menu options pool: {decisionResult.menu_options.length} weather-matched items ready for selection
                </div>
              )}
            </div>
          </SectionCard>

          {/* ⑪ Nutrition — burger sample only */}
          <SectionCard step={11} title="Nutrition Sample" status={nutritionStatus==="idle"?"done":nutritionStatus} dataLabel={nutritionResult?"OpenAI":undefined}
            titleAction={
              <button onClick={onOpenNutrition}
                style={{
                  marginLeft:"auto", padding:"4px 10px",
                  border:`1.5px solid ${nutritionStatus==="idle"?G.green:"rgba(255,255,255,0.6)"}`, borderRadius:"20px",
                  background:"transparent", color:nutritionStatus==="idle"?G.green:"#fff",
                  fontSize:"11px", fontWeight:"600", cursor:"pointer",
                  fontFamily:"'Georgia',serif", WebkitTapHighlightColor:"transparent",
                  flexShrink:0,
                }}>
                Open tool →
              </button>
            }
          >
            {nutritionStatus==="idle"&&(
              <div style={{fontSize:"12px",color:"#aaa",fontStyle:"italic"}}>
                Click <strong style={{color:G.green}}>Open tool →</strong> to calculate nutrition for custom ingredients, or run the full flow for a Smash Burger sample.
              </div>
            )}
            {nutritionStatus==="error"&&<div style={{color:G.red,fontSize:"13px"}}>{nutritionErr}</div>}
            {nutritionResult&&(
              <div>
                <div style={{fontSize:"12px",color:"#888",marginBottom:"8px",fontStyle:"italic"}}>
                  Calorie estimate for a Smash Burger (example item)
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:"#e6f4ee",borderRadius:"8px",marginBottom:"10px"}}>
                  <span style={{fontWeight:"600",color:G.green,fontSize:"13px"}}>🍔 Smash Burger</span>
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

          {/* ⑫ Menu Proposal — TR styled */}
          <SectionCard step={12} title="Menu Proposal" status={menuStatus} dataLabel="hardcoded logic">
            {menuStatus==="error"&&<div style={{color:G.red,fontSize:"13px"}}>{menuErr}</div>}
            {menuResult&&(
              <TRMenuDisplay menuResult={menuResult} primaryMeal={decisionResult?.primary_meal ?? ""} />
            )}
          </SectionCard>

        </div>
      </div>
    </div>
  );
}
