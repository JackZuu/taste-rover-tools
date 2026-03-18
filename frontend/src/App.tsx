import { useState, useEffect } from "react";
import FlowScreen from "./FlowScreen";
import {
  TrendsScreen, HistoricScreen, SeasonalScreen, CelebrationsScreen,
  RegionalScreen, EquipmentScreen, SupplyScreen,
} from "./ModuleScreens";

type WeatherResponse = {
  postcode: string;
  current: {
    temperature: number;
    condition: string;
  };
  forecast: Array<{
    date: string;
    avg_temp: number;
    mainly: string;
  }>;
  error?: string;
};

type NutritionResponse = {
  items: Array<{
    ingredient: string;
    assumed_amount: string;
    calories_kcal: number;
    notes: string;
  }>;
  total_calories_kcal: number;
  error?: string;
};

type McDonaldsProduct = {
  name: string;
  description: string;
  price: string;
  image_url: string;
  nutrition: {
    energy_kj: number;
    energy_kcal: number;
    fat: number;
    saturates: number;
    carbohydrates: number;
    sugars: number;
    fibre: number;
    protein: number;
    salt: number;
  };
  ingredients: string;
  allergens: string;
};

type BurgerKingProduct = {
  name: string;
  category: string;
  description: string;
  price: string;
  image_url: string;
  meal_components: string[];
  nutrition: {
    energy_kj: number;
    energy_kcal: number;
    fat: number;
    saturates: number;
    carbohydrates: number;
    sugars: number;
    fibre: number;
    protein: number;
    salt: number;
  };
  allergens: string;
  ingredients: string;
};

type GreggsProduct = {
  name: string;
  category: string;
  description: string;
  price: string;
  image_url: string;
  serving_info: string;
  nutrition: {
    energy_kj: number;
    energy_kcal: number;
    fat: number;
    saturates: number;
    carbohydrates: number;
    sugars: number;
    fibre: number;
    protein: number;
    salt: number;
  };
  allergens: string;
  ingredients: string;
};

type Screen =
  | "flow" | "weather" | "nutrition"
  | "mcdonalds" | "mcdonalds-detail"
  | "burgerking" | "burgerking-detail"
  | "greggs" | "greggs-detail"
  | "trends" | "historic" | "seasonal" | "celebrations" | "regional" | "equipment" | "supply";

const getWeatherIcon = (condition: string) => {
  if (condition === "mainly sun") return "☀️";
  if (condition === "mainly rain") return "🌧️";
  return "☁️";
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
};

const checkForCreditsError = (errorMessage: string): boolean => {
  const creditsKeywords = [
    "quota",
    "insufficient_quota",
    "rate_limit",
    "credits",
    "billing",
    "exceeded",
    "limit"
  ];
  
  return creditsKeywords.some(keyword => 
    errorMessage.toLowerCase().includes(keyword)
  );
};

export default function App() {
  const [screen, setScreen] = useState<Screen>("flow");
  
  // Weather state
  const [postcode, setPostcode] = useState("");
  const [weatherInputMode, setWeatherInputMode] = useState<"postcode"|"region">("postcode");
  const [weatherRegion, setWeatherRegion] = useState<string|null>(null);
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const WEATHER_REGIONS = [
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

  // Nutrition state
  const [ingredientsText, setIngredientsText] = useState("");
  const [nutrition, setNutrition] = useState<NutritionResponse | null>(null);
  const [nutritionLoading, setNutritionLoading] = useState(false);
  const [nutritionError, setNutritionError] = useState<string | null>(null);

  // McDonald's state
  const [mcProducts, setMcProducts] = useState<McDonaldsProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<McDonaldsProduct | null>(null);
  const [mcLoading, setMcLoading] = useState(false);
  const [mcError, setMcError] = useState<string | null>(null);

  // Burger King state
  const [bkProducts, setBkProducts] = useState<BurgerKingProduct[]>([]);
  const [selectedBkProduct, setSelectedBkProduct] = useState<BurgerKingProduct | null>(null);
  const [bkLoading, setBkLoading] = useState(false);
  const [bkError, setBkError] = useState<string | null>(null);

  // Greggs state
  const [greggsProducts, setGreggsProducts] = useState<GreggsProduct[]>([]);
  const [selectedGreggsProduct, setSelectedGreggsProduct] = useState<GreggsProduct | null>(null);
  const [greggsLoading, setGreggsLoading] = useState(false);
  const [greggsError, setGreggsError] = useState<string | null>(null);

  async function getWeather() {
    if (!postcode.trim()) return;

    setWeatherLoading(true);
    setWeatherError(null);
    setWeather(null);

    try {
      const res = await fetch("/api/weather", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postcode: postcode.trim() }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as WeatherResponse;
      
      if (data.error) {
        if (checkForCreditsError(data.error)) {
          setWeatherError("⚠️ API credits exhausted. Please contact the administrator at jack@tasterover.com");
        } else {
          setWeatherError(data.error);
        }
      } else {
        setWeather(data);
      }
    } catch (e: any) {
      const errorMsg = e?.message ?? "Failed to fetch weather";
      if (checkForCreditsError(errorMsg)) {
        setWeatherError("⚠️ API credits exhausted. Please contact the administrator at jack@tasterover.com");
      } else {
        setWeatherError(errorMsg);
      }
    } finally {
      setWeatherLoading(false);
    }
  }

  async function calculateNutrition() {
    const ingredients = ingredientsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    if (ingredients.length === 0) {
      setNutritionError("Please add at least one ingredient");
      return;
    }

    setNutritionLoading(true);
    setNutritionError(null);
    setNutrition(null);

    try {
      const res = await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as NutritionResponse;
      
      if (data.error) {
        if (checkForCreditsError(data.error)) {
          setNutritionError("⚠️ API credits exhausted. Please contact the administrator at jack@tasterover.com");
        } else {
          setNutritionError(data.error);
        }
      } else {
        setNutrition(data);
      }
    } catch (e: any) {
      const errorMsg = e?.message ?? "Failed to calculate nutrition";
      if (checkForCreditsError(errorMsg)) {
        setNutritionError("⚠️ API credits exhausted. Please contact the administrator at jack@tasterover.com");
      } else {
        setNutritionError(errorMsg);
      }
    } finally {
      setNutritionLoading(false);
    }
  }

  async function loadMcDonaldsMenu() {
    setMcLoading(true);
    setMcError(null);

    try {
      const res = await fetch("/api/mcdonalds/menu");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      
      if (data.error) {
        setMcError(data.error);
      } else {
        setMcProducts(data.products || []);
      }
    } catch (e: any) {
      setMcError(e?.message ?? "Failed to load menu");
    } finally {
      setMcLoading(false);
    }
  }

  useEffect(() => {
    if (screen === "mcdonalds" && mcProducts.length === 0) {
      loadMcDonaldsMenu();
    }
  }, [screen]);

  function openMcDonalds() {
    if (mcProducts.length === 0) loadMcDonaldsMenu();
    setScreen("mcdonalds");
  }

  async function loadBurgerKingMenu() {
    setBkLoading(true);
    setBkError(null);

    try {
      const res = await fetch("/api/burgerking/menu");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.error) {
        setBkError(data.error);
      } else {
        setBkProducts(data.products || []);
      }
    } catch (e: any) {
      setBkError(e?.message ?? "Failed to load menu");
    } finally {
      setBkLoading(false);
    }
  }

  function openBurgerKing() {
    if (bkProducts.length === 0) loadBurgerKingMenu();
    setScreen("burgerking");
  }

  async function loadGreggsMenu() {
    setGreggsLoading(true);
    setGreggsError(null);

    try {
      const res = await fetch("/api/greggs/menu");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.error) {
        setGreggsError(data.error);
      } else {
        setGreggsProducts(data.products || []);
      }
    } catch (e: any) {
      setGreggsError(e?.message ?? "Failed to load menu");
    } finally {
      setGreggsLoading(false);
    }
  }

  function openGreggs() {
    if (greggsProducts.length === 0) loadGreggsMenu();
    setScreen("greggs");
  }

  const handleWeatherKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !weatherLoading && postcode.trim()) {
      getWeather();
    }
  };

  // SMARTR FOOD + MODULE SCREENS
  // FlowScreen is always kept mounted so pipeline results survive navigation to/from modules.
  // Module screens render on top; FlowScreen is hidden (not unmounted) while a module is open.
  const MODULE_SCREENS = ["trends","historic","seasonal","celebrations","regional","equipment","supply"];
  if (screen === "flow" || MODULE_SCREENS.includes(screen)) {
    return (
      <>
        {screen === "trends"       && <TrendsScreen       onBack={() => setScreen("flow")} />}
        {screen === "historic"     && <HistoricScreen     onBack={() => setScreen("flow")} />}
        {screen === "seasonal"     && <SeasonalScreen     onBack={() => setScreen("flow")} />}
        {screen === "celebrations" && <CelebrationsScreen onBack={() => setScreen("flow")} />}
        {screen === "regional"     && <RegionalScreen     onBack={() => setScreen("flow")} />}
        {screen === "equipment"    && <EquipmentScreen    onBack={() => setScreen("flow")} />}
        {screen === "supply"       && <SupplyScreen       onBack={() => setScreen("flow")} />}
        <div style={{display: MODULE_SCREENS.includes(screen) ? "none" : undefined}}>
          <FlowScreen
            onOpenWeather={() => setScreen("weather")}
            onOpenMcDonalds={openMcDonalds}
            onOpenBurgerKing={openBurgerKing}
            onOpenGreggs={openGreggs}
            onOpenNutrition={() => setScreen("nutrition")}
            onOpenTrends={() => setScreen("trends")}
            onOpenHistoric={() => setScreen("historic")}
            onOpenSeasonal={() => setScreen("seasonal")}
            onOpenCelebrations={() => setScreen("celebrations")}
            onOpenRegional={() => setScreen("regional")}
            onOpenEquipment={() => setScreen("equipment")}
            onOpenSupply={() => setScreen("supply")}
          />
        </div>
      </>
    );
  }

  // MCDONALDS MENU SCREEN
  if (screen === "mcdonalds") {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1a5f3f 0%, #2d8659 100%)",
        fontFamily: "'Georgia', serif",
        padding: "16px"
      }}>
        <button
          onClick={() => setScreen("flow")}
          style={{
            background: "rgba(255, 255, 255, 0.2)",
            border: "none",
            color: "#f5f1e8",
            padding: "10px 20px",
            borderRadius: "50px",
            cursor: "pointer",
            fontSize: "clamp(12px, 3vw, 14px)",
            fontWeight: "600",
            marginBottom: "16px",
            WebkitTapHighlightColor: "transparent"
          }}
        >
          ← Back to SmarTR Food
        </button>

        <div style={{
          textAlign: "center",
          padding: "16px",
          color: "#f5f1e8",
          marginBottom: "20px"
        }}>
          <div style={{
            fontSize: "clamp(28px, 7vw, 40px)",
            fontWeight: "bold",
            letterSpacing: "clamp(2px, 0.5vw, 3px)",
            marginBottom: "8px",
            textTransform: "uppercase"
          }}>
            McDonald's Menu
          </div>
          <div style={{
            fontSize: "clamp(13px, 3.5vw, 16px)",
            fontStyle: "italic",
            opacity: 0.9
          }}>
            Browse {mcProducts.length} products
          </div>
        </div>

        {mcLoading && (
          <div style={{
            textAlign: "center",
            color: "#f5f1e8",
            fontSize: "18px",
            padding: "40px"
          }}>
            Loading menu...
          </div>
        )}

        {mcError && (
          <div style={{
            maxWidth: "600px",
            margin: "0 auto 20px",
            padding: "16px 24px",
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "12px",
            color: "#c41e3a",
            textAlign: "center",
            fontWeight: "500"
          }}>
            {mcError}
          </div>
        )}

        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))",
          gap: "16px",
          padding: "0 16px"
        }}>
          {mcProducts.map((product, index) => (
            <div
              key={index}
              onClick={() => {
                setSelectedProduct(product);
                setScreen("mcdonalds-detail");
              }}
              style={{
                background: "rgba(255, 255, 255, 0.95)",
                borderRadius: "16px",
                overflow: "hidden",
                cursor: "pointer",
                transition: "all 0.3s",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                WebkitTapHighlightColor: "transparent"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
              }}
            >
              {product.image_url && (
                <img
                  src={product.image_url}
                  alt={product.name}
                  style={{
                    width: "100%",
                    height: "180px",
                    objectFit: "cover"
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
              <div style={{ padding: "16px" }}>
                <div style={{
                  fontSize: "clamp(15px, 4vw, 18px)",
                  fontWeight: "600",
                  color: "#1a5f3f",
                  marginBottom: "8px"
                }}>
                  {product.name}
                </div>
                <div style={{
                  fontSize: "clamp(12px, 3vw, 14px)",
                  color: "#666",
                  marginBottom: "8px",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden"
                }}>
                  {product.description}
                </div>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <div style={{
                    fontSize: "clamp(14px, 3.5vw, 16px)",
                    fontWeight: "bold",
                    color: "#1a5f3f"
                  }}>
                    {product.price || "See menu"}
                  </div>
                  <div style={{
                    fontSize: "clamp(12px, 3vw, 14px)",
                    color: "#888"
                  }}>
                    {product.nutrition.energy_kcal || 0} kcal
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // MCDONALDS DETAIL SCREEN
  if (screen === "mcdonalds-detail" && selectedProduct) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1a5f3f 0%, #2d8659 100%)",
        fontFamily: "'Georgia', serif",
        padding: "16px"
      }}>
        <button
          onClick={() => setScreen("mcdonalds")}
          style={{
            background: "rgba(255, 255, 255, 0.2)",
            border: "none",
            color: "#f5f1e8",
            padding: "10px 20px",
            borderRadius: "50px",
            cursor: "pointer",
            fontSize: "clamp(12px, 3vw, 14px)",
            fontWeight: "600",
            marginBottom: "16px",
            WebkitTapHighlightColor: "transparent"
          }}
        >
          ← Back to Menu
        </button>

        <div style={{
          maxWidth: "800px",
          margin: "0 auto"
        }}>
          <div style={{
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "20px",
            overflow: "hidden",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)"
          }}>
            {selectedProduct.image_url && (
              <img
                src={selectedProduct.image_url}
                alt={selectedProduct.name}
                style={{
                  width: "100%",
                  maxHeight: "400px",
                  objectFit: "cover"
                }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}

            <div style={{ padding: "clamp(20px, 5vw, 32px)" }}>
              <div style={{
                fontSize: "clamp(24px, 6vw, 32px)",
                fontWeight: "bold",
                color: "#1a5f3f",
                marginBottom: "12px"
              }}>
                {selectedProduct.name}
              </div>

              {selectedProduct.price && (
                <div style={{
                  fontSize: "clamp(18px, 4.5vw, 24px)",
                  fontWeight: "600",
                  color: "#2d8659",
                  marginBottom: "16px"
                }}>
                  {selectedProduct.price}
                </div>
              )}

              <div style={{
                fontSize: "clamp(13px, 3.5vw, 15px)",
                color: "#333",
                lineHeight: "1.6",
                marginBottom: "24px"
              }}>
                {selectedProduct.description}
              </div>

              <div style={{
                borderTop: "2px solid #e0e0e0",
                paddingTop: "20px",
                marginBottom: "20px"
              }}>
                <div style={{
                  fontSize: "clamp(16px, 4vw, 20px)",
                  fontWeight: "600",
                  color: "#1a5f3f",
                  marginBottom: "16px"
                }}>
                  Nutrition Information
                </div>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: "12px"
                }}>
                  <div style={{ padding: "12px", background: "#f9f9f9", borderRadius: "8px" }}>
                    <div style={{ fontSize: "clamp(11px, 3vw, 12px)", color: "#888" }}>Calories</div>
                    <div style={{ fontSize: "clamp(16px, 4vw, 20px)", fontWeight: "bold", color: "#1a5f3f" }}>
                      {selectedProduct.nutrition.energy_kcal || 0} kcal
                    </div>
                  </div>
                  <div style={{ padding: "12px", background: "#f9f9f9", borderRadius: "8px" }}>
                    <div style={{ fontSize: "clamp(11px, 3vw, 12px)", color: "#888" }}>Protein</div>
                    <div style={{ fontSize: "clamp(16px, 4vw, 20px)", fontWeight: "bold", color: "#1a5f3f" }}>
                      {selectedProduct.nutrition.protein || 0}g
                    </div>
                  </div>
                  <div style={{ padding: "12px", background: "#f9f9f9", borderRadius: "8px" }}>
                    <div style={{ fontSize: "clamp(11px, 3vw, 12px)", color: "#888" }}>Carbs</div>
                    <div style={{ fontSize: "clamp(16px, 4vw, 20px)", fontWeight: "bold", color: "#1a5f3f" }}>
                      {selectedProduct.nutrition.carbohydrates || 0}g
                    </div>
                  </div>
                  <div style={{ padding: "12px", background: "#f9f9f9", borderRadius: "8px" }}>
                    <div style={{ fontSize: "clamp(11px, 3vw, 12px)", color: "#888" }}>Fat</div>
                    <div style={{ fontSize: "clamp(16px, 4vw, 20px)", fontWeight: "bold", color: "#1a5f3f" }}>
                      {selectedProduct.nutrition.fat || 0}g
                    </div>
                  </div>
                  <div style={{ padding: "12px", background: "#f9f9f9", borderRadius: "8px" }}>
                    <div style={{ fontSize: "clamp(11px, 3vw, 12px)", color: "#888" }}>Sugar</div>
                    <div style={{ fontSize: "clamp(16px, 4vw, 20px)", fontWeight: "bold", color: "#1a5f3f" }}>
                      {selectedProduct.nutrition.sugars || 0}g
                    </div>
                  </div>
                  <div style={{ padding: "12px", background: "#f9f9f9", borderRadius: "8px" }}>
                    <div style={{ fontSize: "clamp(11px, 3vw, 12px)", color: "#888" }}>Salt</div>
                    <div style={{ fontSize: "clamp(16px, 4vw, 20px)", fontWeight: "bold", color: "#1a5f3f" }}>
                      {selectedProduct.nutrition.salt || 0}g
                    </div>
                  </div>
                </div>
              </div>

              {selectedProduct.ingredients && (
                <div style={{ marginBottom: "20px" }}>
                  <div style={{
                    fontSize: "clamp(14px, 3.5vw, 16px)",
                    fontWeight: "600",
                    color: "#1a5f3f",
                    marginBottom: "8px"
                  }}>
                    Ingredients
                  </div>
                  <div style={{
                    fontSize: "clamp(12px, 3vw, 14px)",
                    color: "#666",
                    lineHeight: "1.5",
                    maxHeight: "150px",
                    overflow: "auto",
                    padding: "12px",
                    background: "#f9f9f9",
                    borderRadius: "8px"
                  }}>
                    {selectedProduct.ingredients}
                  </div>
                </div>
              )}

              {selectedProduct.allergens && (
                <div>
                  <div style={{
                    fontSize: "clamp(14px, 3.5vw, 16px)",
                    fontWeight: "600",
                    color: "#1a5f3f",
                    marginBottom: "8px"
                  }}>
                    Allergen Information
                  </div>
                  <div style={{
                    fontSize: "clamp(12px, 3vw, 14px)",
                    color: "#666",
                    lineHeight: "1.5",
                    padding: "12px",
                    background: "#fff3cd",
                    borderRadius: "8px",
                    border: "1px solid #ffc107"
                  }}>
                    {selectedProduct.allergens}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // BURGER KING MENU SCREEN
  if (screen === "burgerking") {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1a5f3f 0%, #2d8659 100%)",
        fontFamily: "'Georgia', serif",
        padding: "16px"
      }}>
        <button
          onClick={() => setScreen("flow")}
          style={{
            background: "rgba(255, 255, 255, 0.2)",
            border: "none",
            color: "#f5f1e8",
            padding: "10px 20px",
            borderRadius: "50px",
            cursor: "pointer",
            fontSize: "clamp(12px, 3vw, 14px)",
            fontWeight: "600",
            marginBottom: "16px",
            WebkitTapHighlightColor: "transparent"
          }}
        >
          ← Back to SmarTR Food
        </button>

        <div style={{
          textAlign: "center",
          padding: "16px",
          color: "#f5f1e8",
          marginBottom: "20px"
        }}>
          <div style={{
            fontSize: "clamp(28px, 7vw, 40px)",
            fontWeight: "bold",
            letterSpacing: "clamp(2px, 0.5vw, 3px)",
            marginBottom: "8px",
            textTransform: "uppercase"
          }}>
            Burger King Menu
          </div>
          <div style={{
            fontSize: "clamp(13px, 3.5vw, 16px)",
            fontStyle: "italic",
            opacity: 0.9
          }}>
            Browse {bkProducts.length} products
          </div>
        </div>

        {bkLoading && (
          <div style={{
            textAlign: "center",
            color: "#f5f1e8",
            fontSize: "18px",
            padding: "40px"
          }}>
            Loading menu...
          </div>
        )}

        {bkError && (
          <div style={{
            maxWidth: "600px",
            margin: "0 auto 20px",
            padding: "16px 24px",
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "12px",
            color: "#c41e3a",
            textAlign: "center",
            fontWeight: "500"
          }}>
            {bkError}
          </div>
        )}

        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))",
          gap: "16px",
          padding: "0 16px"
        }}>
          {bkProducts.map((product, index) => (
            <div
              key={index}
              onClick={() => {
                setSelectedBkProduct(product);
                setScreen("burgerking-detail");
              }}
              style={{
                background: "rgba(255, 255, 255, 0.95)",
                borderRadius: "16px",
                overflow: "hidden",
                cursor: "pointer",
                transition: "all 0.3s",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                WebkitTapHighlightColor: "transparent"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
              }}
            >
              {product.image_url && (
                <img
                  src={product.image_url}
                  alt={product.name}
                  style={{
                    width: "100%",
                    height: "180px",
                    objectFit: "cover"
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
              <div style={{ padding: "16px" }}>
                {product.category && (
                  <div style={{
                    fontSize: "clamp(10px, 2.5vw, 11px)",
                    fontWeight: "600",
                    color: "#d4500a",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    marginBottom: "4px"
                  }}>
                    {product.category}
                  </div>
                )}
                <div style={{
                  fontSize: "clamp(15px, 4vw, 18px)",
                  fontWeight: "600",
                  color: "#1a5f3f",
                  marginBottom: "8px"
                }}>
                  {product.name}
                </div>
                <div style={{
                  fontSize: "clamp(12px, 3vw, 14px)",
                  color: "#666",
                  marginBottom: "8px",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden"
                }}>
                  {product.description}
                </div>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <div style={{
                    fontSize: "clamp(14px, 3.5vw, 16px)",
                    fontWeight: "bold",
                    color: "#1a5f3f"
                  }}>
                    {product.price || "See menu"}
                  </div>
                  <div style={{
                    fontSize: "clamp(12px, 3vw, 14px)",
                    color: "#888"
                  }}>
                    {product.nutrition.energy_kcal || 0} kcal
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // BURGER KING DETAIL SCREEN
  if (screen === "burgerking-detail" && selectedBkProduct) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1a5f3f 0%, #2d8659 100%)",
        fontFamily: "'Georgia', serif",
        padding: "16px"
      }}>
        <button
          onClick={() => setScreen("burgerking")}
          style={{
            background: "rgba(255, 255, 255, 0.2)",
            border: "none",
            color: "#f5f1e8",
            padding: "10px 20px",
            borderRadius: "50px",
            cursor: "pointer",
            fontSize: "clamp(12px, 3vw, 14px)",
            fontWeight: "600",
            marginBottom: "16px",
            WebkitTapHighlightColor: "transparent"
          }}
        >
          ← Back to Menu
        </button>

        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={{
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "20px",
            overflow: "hidden",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)"
          }}>
            {selectedBkProduct.image_url && (
              <img
                src={selectedBkProduct.image_url}
                alt={selectedBkProduct.name}
                style={{ width: "100%", maxHeight: "400px", objectFit: "cover" }}
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            )}

            <div style={{ padding: "clamp(20px, 5vw, 32px)" }}>
              {selectedBkProduct.category && (
                <div style={{
                  fontSize: "clamp(11px, 3vw, 12px)",
                  fontWeight: "600",
                  color: "#d4500a",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "6px"
                }}>
                  {selectedBkProduct.category}
                </div>
              )}

              <div style={{
                fontSize: "clamp(24px, 6vw, 32px)",
                fontWeight: "bold",
                color: "#1a5f3f",
                marginBottom: "12px"
              }}>
                {selectedBkProduct.name}
              </div>

              {selectedBkProduct.price && (
                <div style={{
                  fontSize: "clamp(18px, 4.5vw, 24px)",
                  fontWeight: "600",
                  color: "#2d8659",
                  marginBottom: "16px"
                }}>
                  {selectedBkProduct.price}
                </div>
              )}

              <div style={{
                fontSize: "clamp(13px, 3.5vw, 15px)",
                color: "#333",
                lineHeight: "1.6",
                marginBottom: "24px"
              }}>
                {selectedBkProduct.description}
              </div>

              {selectedBkProduct.meal_components.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <div style={{
                    fontSize: "clamp(14px, 3.5vw, 16px)",
                    fontWeight: "600",
                    color: "#1a5f3f",
                    marginBottom: "8px"
                  }}>
                    Meal Components
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {selectedBkProduct.meal_components.map((c, i) => (
                      <span key={i} style={{
                        padding: "4px 12px",
                        background: "#f0f7f3",
                        border: "1px solid #c8e6d0",
                        borderRadius: "20px",
                        fontSize: "clamp(12px, 3vw, 13px)",
                        color: "#1a5f3f"
                      }}>
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{
                borderTop: "2px solid #e0e0e0",
                paddingTop: "20px",
                marginBottom: "20px"
              }}>
                <div style={{
                  fontSize: "clamp(16px, 4vw, 20px)",
                  fontWeight: "600",
                  color: "#1a5f3f",
                  marginBottom: "16px"
                }}>
                  Nutrition Information
                </div>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: "12px"
                }}>
                  {[
                    { label: "Calories", value: `${selectedBkProduct.nutrition.energy_kcal || 0} kcal` },
                    { label: "Protein",  value: `${selectedBkProduct.nutrition.protein || 0}g` },
                    { label: "Carbs",    value: `${selectedBkProduct.nutrition.carbohydrates || 0}g` },
                    { label: "Fat",      value: `${selectedBkProduct.nutrition.fat || 0}g` },
                    { label: "Sugar",    value: `${selectedBkProduct.nutrition.sugars || 0}g` },
                    { label: "Salt",     value: `${selectedBkProduct.nutrition.salt || 0}g` },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ padding: "12px", background: "#f9f9f9", borderRadius: "8px" }}>
                      <div style={{ fontSize: "clamp(11px, 3vw, 12px)", color: "#888" }}>{label}</div>
                      <div style={{ fontSize: "clamp(16px, 4vw, 20px)", fontWeight: "bold", color: "#1a5f3f" }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedBkProduct.allergens && (
                <div>
                  <div style={{
                    fontSize: "clamp(14px, 3.5vw, 16px)",
                    fontWeight: "600",
                    color: "#1a5f3f",
                    marginBottom: "8px"
                  }}>
                    Allergen Information
                  </div>
                  <div style={{
                    fontSize: "clamp(12px, 3vw, 14px)",
                    color: "#666",
                    lineHeight: "1.5",
                    padding: "12px",
                    background: "#fff3cd",
                    borderRadius: "8px",
                    border: "1px solid #ffc107"
                  }}>
                    {selectedBkProduct.allergens}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // GREGGS MENU SCREEN
  if (screen === "greggs") {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1a5f3f 0%, #2d8659 100%)",
        fontFamily: "'Georgia', serif",
        padding: "16px"
      }}>
        <button
          onClick={() => setScreen("flow")}
          style={{
            background: "rgba(255, 255, 255, 0.2)",
            border: "none",
            color: "#f5f1e8",
            padding: "10px 20px",
            borderRadius: "50px",
            cursor: "pointer",
            fontSize: "clamp(12px, 3vw, 14px)",
            fontWeight: "600",
            marginBottom: "16px",
            WebkitTapHighlightColor: "transparent"
          }}
        >
          ← Back to SmarTR Food
        </button>

        <div style={{
          textAlign: "center",
          padding: "16px",
          color: "#f5f1e8",
          marginBottom: "20px"
        }}>
          <div style={{
            fontSize: "clamp(28px, 7vw, 40px)",
            fontWeight: "bold",
            letterSpacing: "clamp(2px, 0.5vw, 3px)",
            marginBottom: "8px",
            textTransform: "uppercase"
          }}>
            Greggs Menu
          </div>
          <div style={{
            fontSize: "clamp(13px, 3.5vw, 16px)",
            fontStyle: "italic",
            opacity: 0.9
          }}>
            Browse {greggsProducts.length} products
          </div>
        </div>

        {greggsLoading && (
          <div style={{
            textAlign: "center",
            color: "#f5f1e8",
            fontSize: "18px",
            padding: "40px"
          }}>
            Loading menu...
          </div>
        )}

        {greggsError && (
          <div style={{
            maxWidth: "600px",
            margin: "0 auto 20px",
            padding: "16px 24px",
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "12px",
            color: "#c41e3a",
            textAlign: "center",
            fontWeight: "500"
          }}>
            {greggsError}
          </div>
        )}

        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))",
          gap: "16px",
          padding: "0 16px"
        }}>
          {greggsProducts.map((product, index) => (
            <div
              key={index}
              onClick={() => {
                setSelectedGreggsProduct(product);
                setScreen("greggs-detail");
              }}
              style={{
                background: "rgba(255, 255, 255, 0.95)",
                borderRadius: "16px",
                overflow: "hidden",
                cursor: "pointer",
                transition: "all 0.3s",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                WebkitTapHighlightColor: "transparent"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
              }}
            >
              {product.image_url && (
                <img
                  src={product.image_url}
                  alt={product.name}
                  style={{ width: "100%", height: "180px", objectFit: "cover" }}
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              )}
              <div style={{ padding: "16px" }}>
                {product.category && (
                  <div style={{
                    fontSize: "clamp(10px, 2.5vw, 11px)",
                    fontWeight: "600",
                    color: "#007a3d",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    marginBottom: "4px"
                  }}>
                    {product.category}
                  </div>
                )}
                <div style={{
                  fontSize: "clamp(15px, 4vw, 18px)",
                  fontWeight: "600",
                  color: "#1a5f3f",
                  marginBottom: "8px"
                }}>
                  {product.name}
                </div>
                <div style={{
                  fontSize: "clamp(12px, 3vw, 14px)",
                  color: "#666",
                  marginBottom: "8px",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden"
                }}>
                  {product.description}
                </div>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <div style={{
                    fontSize: "clamp(14px, 3.5vw, 16px)",
                    fontWeight: "bold",
                    color: "#1a5f3f"
                  }}>
                    {product.price || "See menu"}
                  </div>
                  <div style={{ fontSize: "clamp(12px, 3vw, 14px)", color: "#888" }}>
                    {product.nutrition.energy_kcal || 0} kcal
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // GREGGS DETAIL SCREEN
  if (screen === "greggs-detail" && selectedGreggsProduct) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1a5f3f 0%, #2d8659 100%)",
        fontFamily: "'Georgia', serif",
        padding: "16px"
      }}>
        <button
          onClick={() => setScreen("greggs")}
          style={{
            background: "rgba(255, 255, 255, 0.2)",
            border: "none",
            color: "#f5f1e8",
            padding: "10px 20px",
            borderRadius: "50px",
            cursor: "pointer",
            fontSize: "clamp(12px, 3vw, 14px)",
            fontWeight: "600",
            marginBottom: "16px",
            WebkitTapHighlightColor: "transparent"
          }}
        >
          ← Back to Menu
        </button>

        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={{
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "20px",
            overflow: "hidden",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)"
          }}>
            {selectedGreggsProduct.image_url && (
              <img
                src={selectedGreggsProduct.image_url}
                alt={selectedGreggsProduct.name}
                style={{ width: "100%", maxHeight: "400px", objectFit: "cover" }}
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            )}

            <div style={{ padding: "clamp(20px, 5vw, 32px)" }}>
              {selectedGreggsProduct.category && (
                <div style={{
                  fontSize: "clamp(11px, 3vw, 12px)",
                  fontWeight: "600",
                  color: "#007a3d",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "6px"
                }}>
                  {selectedGreggsProduct.category}
                </div>
              )}

              <div style={{
                fontSize: "clamp(24px, 6vw, 32px)",
                fontWeight: "bold",
                color: "#1a5f3f",
                marginBottom: "12px"
              }}>
                {selectedGreggsProduct.name}
              </div>

              {selectedGreggsProduct.price && (
                <div style={{
                  fontSize: "clamp(18px, 4.5vw, 24px)",
                  fontWeight: "600",
                  color: "#2d8659",
                  marginBottom: "16px"
                }}>
                  {selectedGreggsProduct.price}
                </div>
              )}

              <div style={{
                fontSize: "clamp(13px, 3.5vw, 15px)",
                color: "#333",
                lineHeight: "1.6",
                marginBottom: "24px"
              }}>
                {selectedGreggsProduct.description}
              </div>

              {selectedGreggsProduct.serving_info && (
                <div style={{
                  fontSize: "clamp(11px, 3vw, 13px)",
                  color: "#888",
                  fontStyle: "italic",
                  marginBottom: "16px"
                }}>
                  {selectedGreggsProduct.serving_info}
                </div>
              )}

              <div style={{
                borderTop: "2px solid #e0e0e0",
                paddingTop: "20px",
                marginBottom: "20px"
              }}>
                <div style={{
                  fontSize: "clamp(16px, 4vw, 20px)",
                  fontWeight: "600",
                  color: "#1a5f3f",
                  marginBottom: "16px"
                }}>
                  Nutrition Information
                </div>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: "12px"
                }}>
                  {[
                    { label: "Calories",  value: `${selectedGreggsProduct.nutrition.energy_kcal || 0} kcal` },
                    { label: "Protein",   value: `${selectedGreggsProduct.nutrition.protein || 0}g` },
                    { label: "Carbs",     value: `${selectedGreggsProduct.nutrition.carbohydrates || 0}g` },
                    { label: "Fat",       value: `${selectedGreggsProduct.nutrition.fat || 0}g` },
                    { label: "Sugar",     value: `${selectedGreggsProduct.nutrition.sugars || 0}g` },
                    { label: "Salt",      value: `${selectedGreggsProduct.nutrition.salt || 0}g` },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ padding: "12px", background: "#f9f9f9", borderRadius: "8px" }}>
                      <div style={{ fontSize: "clamp(11px, 3vw, 12px)", color: "#888" }}>{label}</div>
                      <div style={{ fontSize: "clamp(16px, 4vw, 20px)", fontWeight: "bold", color: "#1a5f3f" }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedGreggsProduct.allergens && (
                <div>
                  <div style={{
                    fontSize: "clamp(14px, 3.5vw, 16px)",
                    fontWeight: "600",
                    color: "#1a5f3f",
                    marginBottom: "8px"
                  }}>
                    Allergen Information
                  </div>
                  <div style={{
                    fontSize: "clamp(12px, 3vw, 14px)",
                    color: "#666",
                    lineHeight: "1.5",
                    padding: "12px",
                    background: "#fff3cd",
                    borderRadius: "8px",
                    border: "1px solid #ffc107"
                  }}>
                    {selectedGreggsProduct.allergens}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // WEATHER SCREEN (keeping existing code)
  if (screen === "weather") {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1a5f3f 0%, #2d8659 100%)",
        fontFamily: "'Georgia', serif",
        padding: "16px"
      }}>
        <button
          onClick={() => {
            setScreen("flow");
            setWeather(null);
            setWeatherError(null);
            setPostcode("");
          }}
          style={{
            background: "rgba(255, 255, 255, 0.2)",
            border: "none",
            color: "#f5f1e8",
            padding: "10px 20px",
            borderRadius: "50px",
            cursor: "pointer",
            fontSize: "clamp(12px, 3vw, 14px)",
            fontWeight: "600",
            marginBottom: "16px",
            transition: "all 0.3s",
            WebkitTapHighlightColor: "transparent"
          }}
        >
          ← Back to SmarTR Food
        </button>

        <div style={{
          textAlign: "center",
          padding: "16px",
          color: "#f5f1e8"
        }}>
          <div style={{
            fontSize: "clamp(28px, 7vw, 40px)",
            fontWeight: "bold",
            letterSpacing: "clamp(2px, 0.5vw, 3px)",
            marginBottom: "8px",
            textTransform: "uppercase"
          }}>
            Weather Predictor
          </div>
          <div style={{
            fontSize: "clamp(13px, 3.5vw, 16px)",
            fontStyle: "italic",
            opacity: 0.9
          }}>
            Plan your food truck visits wisely
          </div>
        </div>

        <div style={{ maxWidth: "600px", margin: "0 auto clamp(24px, 6vw, 40px)", padding: "0 16px" }}>
          {/* Mode tabs */}
          <div style={{ display: "flex", borderRadius: "10px", overflow: "hidden", border: "2px solid rgba(255,255,255,0.4)", marginBottom: "12px" }}>
            {(["postcode", "region"] as const).map(mode => (
              <button key={mode} onClick={() => { setWeatherInputMode(mode); setWeather(null); setWeatherError(null); setWeatherRegion(null); }}
                style={{
                  flex: 1, padding: "9px", border: "none",
                  background: weatherInputMode === mode ? "rgba(255,255,255,0.95)" : "transparent",
                  color: weatherInputMode === mode ? "#1a5f3f" : "#f5f1e8",
                  fontWeight: "600", fontSize: "13px", cursor: "pointer",
                  fontFamily: "'Georgia',serif", WebkitTapHighlightColor: "transparent",
                  textTransform: "capitalize",
                }}>
                {mode === "postcode" ? "Postcode" : "UK Region"}
              </button>
            ))}
          </div>

          {weatherInputMode === "postcode" ? (
            <div style={{ background: "#f5f1e8", borderRadius: "50px", padding: "6px 16px", display: "flex", alignItems: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", gap: "8px" }}>
              <input
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                onKeyPress={handleWeatherKeyPress}
                placeholder="Enter UK postcode"
                style={{ flex: 1, border: "none", background: "transparent", padding: "10px 8px", fontSize: "clamp(14px, 3.5vw, 16px)", outline: "none", fontFamily: "'Georgia', serif" }}
              />
              <button onClick={getWeather} disabled={weatherLoading || !postcode.trim()}
                style={{ background: "#1a5f3f", color: "#f5f1e8", border: "none", borderRadius: "50px", padding: "10px clamp(16px, 5vw, 32px)", fontSize: "clamp(13px, 3.5vw, 16px)", fontWeight: "600", cursor: weatherLoading || !postcode.trim() ? "not-allowed" : "pointer", opacity: weatherLoading || !postcode.trim() ? 0.6 : 1, transition: "all 0.3s", fontFamily: "'Georgia', serif", letterSpacing: "1px", whiteSpace: "nowrap", WebkitTapHighlightColor: "transparent" }}>
                {weatherLoading ? "Loading..." : "Check"}
              </button>
            </div>
          ) : (
            <div style={{ background: "rgba(255,255,255,0.95)", borderRadius: "16px", padding: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "12px" }}>
                {WEATHER_REGIONS.map(r => (
                  <button key={r.label} onClick={() => { setWeatherRegion(r.label); setPostcode(r.postcode); setWeather(null); setWeatherError(null); }}
                    style={{ padding: "8px 6px", borderRadius: "8px", border: `2px solid ${weatherRegion === r.label ? "#1a5f3f" : "#ddd"}`, background: weatherRegion === r.label ? "#e6f4ee" : "#fafafa", color: weatherRegion === r.label ? "#1a5f3f" : "#444", fontSize: "12px", fontWeight: weatherRegion === r.label ? "700" : "500", cursor: "pointer", fontFamily: "'Georgia',serif", WebkitTapHighlightColor: "transparent", textAlign: "center" }}>
                    {r.label}
                  </button>
                ))}
              </div>
              {weatherRegion && <div style={{ fontSize: "11px", color: "#888", textAlign: "center", marginBottom: "10px" }}>Using postcode: <strong>{WEATHER_REGIONS.find(r => r.label === weatherRegion)?.postcode}</strong></div>}
              <button onClick={getWeather} disabled={weatherLoading || !weatherRegion}
                style={{ width: "100%", background: weatherLoading || !weatherRegion ? "#ccc" : "#1a5f3f", color: "#fff", border: "none", borderRadius: "10px", padding: "11px", fontSize: "14px", fontWeight: "700", cursor: weatherLoading || !weatherRegion ? "not-allowed" : "pointer", fontFamily: "'Georgia',serif", WebkitTapHighlightColor: "transparent" }}>
                {weatherLoading ? "Loading..." : weatherRegion ? `Check ${weatherRegion}` : "Select a region"}
              </button>
            </div>
          )}
        </div>

        {weatherError && (
          <div style={{
            maxWidth: "600px",
            margin: "0 auto 16px",
            padding: "14px 20px",
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "12px",
            color: "#c41e3a",
            textAlign: "center",
            fontWeight: "500",
            fontSize: "clamp(13px, 3.5vw, 15px)"
          }}>
            {weatherError}
          </div>
        )}

        {weather && !weather.error && (
          <div style={{
            maxWidth: "800px",
            margin: "0 auto",
            padding: "0 16px"
          }}>
            <div style={{
              background: "rgba(255, 255, 255, 0.95)",
              borderRadius: "16px",
              padding: "clamp(20px, 5vw, 32px)",
              marginBottom: "20px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.2)"
            }}>
              <div style={{
                fontSize: "clamp(11px, 3vw, 14px)",
                color: "#1a5f3f",
                fontWeight: "600",
                letterSpacing: "clamp(1px, 0.3vw, 2px)",
                textTransform: "uppercase",
                marginBottom: "12px"
              }}>
                Current Weather • {weather.postcode}
              </div>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "clamp(16px, 4vw, 24px)",
                flexWrap: "wrap"
              }}>
                <div style={{ fontSize: "clamp(48px, 12vw, 72px)" }}>
                  {getWeatherIcon(weather.current.condition)}
                </div>
                <div>
                  <div style={{
                    fontSize: "clamp(40px, 10vw, 56px)",
                    fontWeight: "bold",
                    color: "#1a5f3f",
                    lineHeight: "1"
                  }}>
                    {weather.current.temperature}°C
                  </div>
                  <div style={{
                    fontSize: "clamp(14px, 4vw, 18px)",
                    color: "#666",
                    marginTop: "8px",
                    textTransform: "capitalize"
                  }}>
                    {weather.current.condition}
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              fontSize: "clamp(16px, 4vw, 20px)",
              color: "#f5f1e8",
              fontWeight: "600",
              marginBottom: "12px",
              letterSpacing: "1px"
            }}>
              5-Day Forecast
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(120px, 100%), 1fr))",
              gap: "10px"
            }}>
              {weather.forecast.map((day) => (
                <div
                  key={day.date}
                  style={{
                    background: "rgba(255, 255, 255, 0.95)",
                    borderRadius: "12px",
                    padding: "clamp(14px, 4vw, 20px)",
                    textAlign: "center",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                  }}
                >
                  <div style={{
                    fontSize: "clamp(11px, 3vw, 14px)",
                    fontWeight: "600",
                    color: "#1a5f3f",
                    marginBottom: "10px"
                  }}>
                    {formatDate(day.date)}
                  </div>
                  <div style={{ fontSize: "clamp(28px, 7vw, 36px)", marginBottom: "8px" }}>
                    {getWeatherIcon(day.mainly)}
                  </div>
                  <div style={{
                    fontSize: "clamp(18px, 5vw, 24px)",
                    fontWeight: "bold",
                    color: "#1a5f3f",
                    marginBottom: "4px"
                  }}>
                    {day.avg_temp.toFixed(1)}°C
                  </div>
                  <div style={{
                    fontSize: "clamp(10px, 2.5vw, 12px)",
                    color: "#666",
                    textTransform: "capitalize"
                  }}>
                    {day.mainly}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // NUTRITION SCREEN (keeping existing implementation)
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1a5f3f 0%, #2d8659 100%)",
      fontFamily: "'Georgia', serif",
      padding: "16px"
    }}>
      <button
        onClick={() => {
          setScreen("flow");
          setNutrition(null);
          setNutritionError(null);
          setIngredientsText("");
        }}
        style={{
          background: "rgba(255, 255, 255, 0.2)",
          border: "none",
          color: "#f5f1e8",
          padding: "10px 20px",
          borderRadius: "50px",
          cursor: "pointer",
          fontSize: "clamp(12px, 3vw, 14px)",
          fontWeight: "600",
          marginBottom: "16px",
          transition: "all 0.3s",
          WebkitTapHighlightColor: "transparent"
        }}
      >
        ← Back to SmarTR Food
      </button>

      <div style={{
        textAlign: "center",
        padding: "16px",
        color: "#f5f1e8",
        marginBottom: "clamp(20px, 5vw, 30px)"
      }}>
        <div style={{
          fontSize: "clamp(28px, 7vw, 40px)",
          fontWeight: "bold",
          letterSpacing: "clamp(2px, 0.5vw, 3px)",
          marginBottom: "8px",
          textTransform: "uppercase"
        }}>
          Nutrition Calculator
        </div>
        <div style={{
          fontSize: "clamp(13px, 3.5vw, 16px)",
          fontStyle: "italic",
          opacity: 0.9
        }}>
          Know what you're eating
        </div>
      </div>

      <div style={{
        maxWidth: "700px",
        margin: "0 auto",
        padding: "0 16px"
      }}>
        <div style={{
          background: "rgba(255, 255, 255, 0.95)",
          borderRadius: "16px",
          padding: "clamp(20px, 5vw, 32px)",
          marginBottom: "20px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)"
        }}>
          <div style={{
            fontSize: "clamp(15px, 4vw, 18px)",
            fontWeight: "600",
            color: "#1a5f3f",
            marginBottom: "10px",
            letterSpacing: "1px"
          }}>
            Add Your Ingredients
          </div>
          <div style={{
            fontSize: "clamp(12px, 3vw, 14px)",
            color: "#666",
            marginBottom: "14px",
            fontStyle: "italic",
            lineHeight: "1.4"
          }}>
            Enter one ingredient per line (e.g., "2 large eggs" or "100g chicken breast")
          </div>

          <textarea
            value={ingredientsText}
            onChange={(e) => setIngredientsText(e.target.value)}
            placeholder="2 large eggs&#10;100g chicken breast&#10;1 tbsp olive oil&#10;1 medium banana"
            style={{
              width: "100%",
              minHeight: "clamp(150px, 40vw, 200px)",
              padding: "14px",
              border: "2px solid #e0e0e0",
              borderRadius: "12px",
              fontSize: "clamp(13px, 3.5vw, 15px)",
              outline: "none",
              fontFamily: "'Georgia', serif",
              resize: "vertical",
              lineHeight: "1.6",
              boxSizing: "border-box"
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = "#1a5f3f"}
            onBlur={(e) => e.currentTarget.style.borderColor = "#e0e0e0"}
          />

          <button
            onClick={calculateNutrition}
            disabled={nutritionLoading || !ingredientsText.trim()}
            style={{
              width: "100%",
              marginTop: "16px",
              background: "#1a5f3f",
              color: "#f5f1e8",
              border: "none",
              borderRadius: "12px",
              padding: "clamp(12px, 4vw, 16px)",
              fontSize: "clamp(14px, 3.5vw, 16px)",
              fontWeight: "600",
              cursor: nutritionLoading || !ingredientsText.trim() ? "not-allowed" : "pointer",
              opacity: nutritionLoading || !ingredientsText.trim() ? 0.6 : 1,
              transition: "all 0.3s",
              fontFamily: "'Georgia', serif",
              letterSpacing: "1px",
              WebkitTapHighlightColor: "transparent"
            }}
          >
            {nutritionLoading ? "Calculating..." : "Calculate Nutrition"}
          </button>
        </div>

        {nutritionError && (
          <div style={{
            padding: "14px 20px",
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "12px",
            color: "#c41e3a",
            textAlign: "center",
            fontWeight: "500",
            marginBottom: "20px",
            fontSize: "clamp(13px, 3.5vw, 15px)",
            lineHeight: "1.4"
          }}>
            {nutritionError}
          </div>
        )}

        {nutrition && !nutrition.error && (
          <div>
            <div style={{
              background: "rgba(255, 255, 255, 0.95)",
              borderRadius: "16px",
              padding: "clamp(24px, 6vw, 32px)",
              marginBottom: "20px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
              textAlign: "center"
            }}>
              <div style={{
                fontSize: "clamp(11px, 3vw, 14px)",
                color: "#1a5f3f",
                fontWeight: "600",
                letterSpacing: "clamp(1px, 0.3vw, 2px)",
                textTransform: "uppercase",
                marginBottom: "12px"
              }}>
                Total Calories
              </div>
              <div style={{
                fontSize: "clamp(48px, 12vw, 64px)",
                fontWeight: "bold",
                color: "#1a5f3f",
                lineHeight: "1"
              }}>
                {nutrition.total_calories_kcal}
              </div>
              <div style={{
                fontSize: "clamp(16px, 4vw, 20px)",
                color: "#666",
                marginTop: "8px"
              }}>
                kcal
              </div>
            </div>

            <div style={{
              background: "rgba(255, 255, 255, 0.95)",
              borderRadius: "16px",
              padding: "clamp(20px, 5vw, 32px)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.2)"
            }}>
              <div style={{
                fontSize: "clamp(15px, 4vw, 18px)",
                fontWeight: "600",
                color: "#1a5f3f",
                marginBottom: "16px",
                letterSpacing: "1px"
              }}>
                Breakdown by Ingredient
              </div>

              {nutrition.items.map((item, index) => (
                <div
                  key={index}
                  style={{
                    padding: "clamp(12px, 3vw, 16px)",
                    background: "#f9f9f9",
                    borderRadius: "12px",
                    marginBottom: "10px",
                    border: "1px solid #e0e0e0"
                  }}
                >
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                    gap: "12px",
                    flexWrap: "wrap"
                  }}>
                    <div style={{
                      fontSize: "clamp(14px, 3.5vw, 16px)",
                      fontWeight: "600",
                      color: "#333",
                      flex: 1,
                      minWidth: "120px"
                    }}>
                      {item.ingredient}
                    </div>
                    <div style={{
                      fontSize: "clamp(16px, 4vw, 20px)",
                      fontWeight: "bold",
                      color: "#1a5f3f",
                      whiteSpace: "nowrap"
                    }}>
                      {item.calories_kcal} kcal
                    </div>
                  </div>
                  <div style={{
                    fontSize: "clamp(11px, 3vw, 13px)",
                    color: "#666",
                    marginBottom: "4px"
                  }}>
                    Assumed: {item.assumed_amount}
                  </div>
                  {item.notes && (
                    <div style={{
                      fontSize: "clamp(11px, 3vw, 13px)",
                      color: "#888",
                      fontStyle: "italic",
                      lineHeight: "1.4"
                    }}>
                      {item.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
