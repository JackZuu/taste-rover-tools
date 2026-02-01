import { useState, useEffect } from "react";

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

type Screen = "home" | "weather" | "nutrition" | "mcdonalds" | "mcdonalds-detail";

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
  const [screen, setScreen] = useState<Screen>("home");
  
  // Weather state
  const [postcode, setPostcode] = useState("");
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

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

  const handleWeatherKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !weatherLoading && postcode.trim()) {
      getWeather();
    }
  };

  // HOME SCREEN
  if (screen === "home") {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1a5f3f 0%, #2d8659 100%)",
        fontFamily: "'Georgia', serif",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{
          textAlign: "center",
          padding: "clamp(20px, 5vw, 30px) 16px",
          color: "#f5f1e8",
          marginBottom: "clamp(24px, 6vw, 40px)"
        }}>
          <div style={{
            fontSize: "clamp(32px, 8vw, 56px)",
            fontWeight: "bold",
            letterSpacing: "clamp(2px, 0.5vw, 4px)",
            marginBottom: "8px",
            textTransform: "uppercase"
          }}>
            TASTE ROVER
          </div>
          <div style={{
            fontSize: "clamp(14px, 4vw, 20px)",
            fontStyle: "italic",
            opacity: 0.9,
            letterSpacing: "1px"
          }}>
            Welcome hungry friend
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
          gap: "16px",
          maxWidth: "900px",
          width: "100%",
          padding: "0 16px"
        }}>
          <button
            onClick={() => setScreen("weather")}
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              border: "none",
              borderRadius: "16px",
              padding: "clamp(24px, 6vw, 32px) clamp(20px, 5vw, 24px)",
              cursor: "pointer",
              transition: "all 0.3s",
              boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
              textAlign: "center",
              WebkitTapHighlightColor: "transparent"
            }}
          >
            <div style={{ fontSize: "clamp(36px, 10vw, 42px)", marginBottom: "12px" }}>🌤️</div>
            <div style={{
              fontSize: "clamp(16px, 4.5vw, 20px)",
              fontWeight: "bold",
              color: "#1a5f3f",
              marginBottom: "6px",
              letterSpacing: "0.5px"
            }}>
              Weather
            </div>
            <div style={{
              fontSize: "clamp(11px, 2.8vw, 13px)",
              color: "#666",
              lineHeight: "1.4"
            }}>
              UK forecast
            </div>
          </button>

          <button
            onClick={() => setScreen("nutrition")}
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              border: "none",
              borderRadius: "16px",
              padding: "clamp(24px, 6vw, 32px) clamp(20px, 5vw, 24px)",
              cursor: "pointer",
              transition: "all 0.3s",
              boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
              textAlign: "center",
              WebkitTapHighlightColor: "transparent"
            }}
          >
            <div style={{ fontSize: "clamp(36px, 10vw, 42px)", marginBottom: "12px" }}>🥗</div>
            <div style={{
              fontSize: "clamp(16px, 4.5vw, 20px)",
              fontWeight: "bold",
              color: "#1a5f3f",
              marginBottom: "6px",
              letterSpacing: "0.5px"
            }}>
              Nutrition
            </div>
            <div style={{
              fontSize: "clamp(11px, 2.8vw, 13px)",
              color: "#666",
              lineHeight: "1.4"
            }}>
              Calorie calculator
            </div>
          </button>

          <button
            onClick={() => setScreen("mcdonalds")}
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              border: "none",
              borderRadius: "16px",
              padding: "clamp(24px, 6vw, 32px) clamp(20px, 5vw, 24px)",
              cursor: "pointer",
              transition: "all 0.3s",
              boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
              textAlign: "center",
              WebkitTapHighlightColor: "transparent"
            }}
          >
            <div style={{ fontSize: "clamp(36px, 10vw, 42px)", marginBottom: "12px" }}>🍔</div>
            <div style={{
              fontSize: "clamp(16px, 4.5vw, 20px)",
              fontWeight: "bold",
              color: "#1a5f3f",
              marginBottom: "6px",
              letterSpacing: "0.5px"
            }}>
              McDonald's
            </div>
            <div style={{
              fontSize: "clamp(11px, 2.8vw, 13px)",
              color: "#666",
              lineHeight: "1.4"
            }}>
              Menu & nutrition
            </div>
          </button>
        </div>

        <div style={{
          textAlign: "center",
          marginTop: "clamp(40px, 8vw, 60px)",
          color: "#f5f1e8",
          fontSize: "clamp(12px, 3vw, 14px)",
          opacity: 0.8,
          padding: "0 16px"
        }}>
          🍔 Taste Rover Tools • Making food decisions easier
        </div>
      </div>
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
          onClick={() => setScreen("home")}
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
          ← Back to Home
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
            setScreen("home");
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
          ← Back to Home
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

        <div style={{
          maxWidth: "600px",
          margin: "0 auto clamp(24px, 6vw, 40px)",
          padding: "0 16px"
        }}>
          <div style={{
            background: "#f5f1e8",
            borderRadius: "50px",
            padding: "6px 16px",
            display: "flex",
            alignItems: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            gap: "8px"
          }}>
            <input
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              onKeyPress={handleWeatherKeyPress}
              placeholder="Enter UK postcode"
              style={{
                flex: 1,
                border: "none",
                background: "transparent",
                padding: "10px 8px",
                fontSize: "clamp(14px, 3.5vw, 16px)",
                outline: "none",
                fontFamily: "'Georgia', serif"
              }}
            />
            <button
              onClick={getWeather}
              disabled={weatherLoading || !postcode.trim()}
              style={{
                background: "#1a5f3f",
                color: "#f5f1e8",
                border: "none",
                borderRadius: "50px",
                padding: "10px clamp(16px, 5vw, 32px)",
                fontSize: "clamp(13px, 3.5vw, 16px)",
                fontWeight: "600",
                cursor: weatherLoading || !postcode.trim() ? "not-allowed" : "pointer",
                opacity: weatherLoading || !postcode.trim() ? 0.6 : 1,
                transition: "all 0.3s",
                fontFamily: "'Georgia', serif",
                letterSpacing: "1px",
                whiteSpace: "nowrap",
                WebkitTapHighlightColor: "transparent"
              }}
            >
              {weatherLoading ? "Loading..." : "Check"}
            </button>
          </div>
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
          setScreen("home");
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
        ← Back to Home
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
