"use client";
import React from "react";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);
  const [favoriteLocations, setFavoriteLocations] = useState([]);
  const [favoriteWeather, setFavoriteWeather] = useState({});
  const [successMessage, setSuccessMessage] = useState(null);

  // Fetch favorite locations
  useEffect(() => {
    if (user) {
      fetchFavoriteLocations();
    }
  }, [user]);

  const fetchFavoriteLocations = async () => {
    try {
      const response = await fetch("/api/weather-favorites", {
        method: "GET",
      });
      if (!response.ok) throw new Error("Failed to fetch favorite locations");
      const data = await response.json();

      // Ensure each location has an id
      const validLocations = (data.favorites || []).filter((loc) => {
        if (!loc || typeof loc.id === "undefined") {
          console.error("Invalid location data:", loc);
          return false;
        }
        return true;
      });

      setFavoriteLocations(validLocations);

      // Fetch weather for each favorite location
      validLocations.forEach((loc) => {
        fetchWeatherForLocation(loc);
      });
    } catch (err) {
      console.error("Error fetching favorite locations:", err);
      setError("Failed to fetch favorite locations");
    }
  };

  const fetchWeatherForLocation = async (location) => {
    try {
      const response = await fetch(
        `/integrations/weather-by-city/weather/${location.latitude},${location.longitude}`
      );
      if (!response.ok) throw new Error("Failed to fetch weather data");
      const data = await response.json();
      setFavoriteWeather((prev) => ({
        ...prev,
        [location.id]: { weather: data, loading: false },
      }));
    } catch (err) {
      console.error("Error fetching weather for location:", err);
      setFavoriteWeather((prev) => ({
        ...prev,
        [location.id]: { error: "Failed to load weather", loading: false },
      }));
    }
  };

  const removeFavoriteLocation = async (locationId, locationName) => {
    // Ensure locationId is a number
    const numericId = Number(locationId);
    console.log("Attempting to delete location:", {
      locationId,
      numericId,
      locationName,
    });

    if (isNaN(numericId)) {
      console.error("Invalid location ID format:", locationId);
      setError("Invalid location ID format");
      return;
    }

    // Show confirmation dialog
    if (!window.confirm(`Are you sure you want to delete ${locationName}?`)) {
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);

      const response = await fetch("/api/weather-favorites/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ locationId: numericId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || `Failed to delete location (${response.status})`
        );
      }

      if (data.success) {
        // Update the UI state
        setFavoriteLocations((prev) =>
          prev.filter((loc) => loc.id !== numericId)
        );
        setFavoriteWeather((prev) => {
          const newState = { ...prev };
          delete newState[numericId];
          return newState;
        });

        setSuccessMessage(`Successfully deleted ${locationName}`);

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        throw new Error(data.error || "Failed to delete location");
      }
    } catch (err) {
      console.error("Error removing favorite location:", err);
      setError(err.message || "Failed to remove location. Please try again.");
    }
  };

  // Original useEffect for current location weather
  useEffect(() => {
    if (!userLoading && !user) {
      const currentPath = encodeURIComponent(window.location.pathname);
      window.location.href = `/account/signin?callbackUrl=${currentPath}`;
      return;
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await fetch(
              `/integrations/weather-by-city/weather/${position.coords.latitude},${position.coords.longitude}`
            );

            if (!response.ok) {
              throw new Error("Failed to fetch weather data");
            }

            const data = await response.json();
            setWeather(data);
            setLocation(data.location);
            setLoading(false);
          } catch (err) {
            setError("Could not fetch weather data");
            setLoading(false);
          }
        },
        (err) => {
          setError("Please enable location access to see weather information");
          setLoading(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
    }
  }, [user, userLoading]);

  const WeatherCard = ({ weatherData, locationName }) => (
    <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-8 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center space-x-4 mb-6">
            <img
              src={weatherData.current.condition.icon}
              alt={weatherData.current.condition.text}
              className="w-16 h-16"
            />
            <div>
              <h2 className="text-2xl font-bold">
                {locationName ||
                  `${weatherData.location.name}, ${weatherData.location.region}`}
              </h2>
              <p className="text-gray-400">{weatherData.location.country}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-baseline">
              <span className="text-6xl font-bold">
                {weatherData.current.temp_f}°F
              </span>
              <span className="text-2xl text-gray-400 ml-4">
                {weatherData.current.temp_c}°C
              </span>
            </div>
            <p className="text-xl text-gray-300">
              {weatherData.current.condition.text}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#242424] p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <i className="fas fa-temperature-half text-[#6366F1]"></i>
              <span className="text-gray-400">Feels Like</span>
            </div>
            <p className="text-xl">
              {weatherData.current.feelslike_f}°F
              <span className="text-gray-400 text-sm ml-2">
                ({weatherData.current.feelslike_c}°C)
              </span>
            </p>
          </div>

          <div className="bg-[#242424] p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <i className="fas fa-wind text-[#6366F1]"></i>
              <span className="text-gray-400">Wind</span>
            </div>
            <p className="text-xl">
              {weatherData.current.wind_mph} mph {weatherData.current.wind_dir}
            </p>
          </div>

          <div className="bg-[#242424] p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <i className="fas fa-droplet text-[#6366F1]"></i>
              <span className="text-gray-400">Humidity</span>
            </div>
            <p className="text-xl">{weatherData.current.humidity}%</p>
          </div>

          <div className="bg-[#242424] p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <i className="fas fa-sun text-[#6366F1]"></i>
              <span className="text-gray-400">UV Index</span>
            </div>
            <p className="text-xl">{weatherData.current.uv}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#121212] text-white font-roboto">
      <nav className="fixed top-0 left-0 right-0 bg-[#121212]/90 backdrop-blur-sm z-50 flex justify-between items-center p-6 border-b border-[#333333]">
        <a href="/" className="text-2xl font-bold text-white flex items-center">
          <i className="fas fa-galaxy mr-2"></i>
          Galixee
        </a>
        <div className="flex items-center space-x-6">
          <a
            href="/welcome"
            className="text-gray-300 hover:text-white transition-colors"
          >
            Back to Welcome
          </a>
          <a
            href="/account/logout"
            className="text-gray-300 hover:text-white transition-colors"
          >
            Sign Out
          </a>
        </div>
      </nav>

      <main className="pt-24 px-6 pb-16 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#6366F1] to-[#4FD1C5]">
            Weather
          </h1>
        </div>

        {successMessage && (
          <div className="mb-6 bg-green-900/20 border border-green-500/50 p-4 rounded-lg text-green-400">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-8">
          {/* Current Location Section */}
          <section>
            <h2 className="text-2xl font-bold mb-4">
              The Weather in My Current Galixee is:
            </h2>
            {loading ? (
              <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-8">
                <div className="flex items-center justify-center">
                  <i className="fas fa-spinner-third fa-spin text-4xl text-[#6366F1]"></i>
                </div>
              </div>
            ) : weather ? (
              <WeatherCard
                weatherData={weather}
                locationName={`${location.name}, ${location.region}`}
              />
            ) : null}
          </section>

          {/* Additional Locations Section */}
          {favoriteLocations.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4">
                Weather in Galixees Around My Foreververse are:
              </h2>
              <div className="space-y-6">
                {favoriteLocations.map((loc) => {
                  if (!loc || typeof loc.id === "undefined") {
                    console.error("Invalid location data in render:", loc);
                    return null;
                  }

                  return (
                    <div key={loc.id} className="relative">
                      {favoriteWeather[loc.id]?.loading ? (
                        <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-8">
                          <div className="flex items-center justify-center">
                            <i className="fas fa-spinner-third fa-spin text-4xl text-[#6366F1]"></i>
                          </div>
                        </div>
                      ) : favoriteWeather[loc.id]?.error ? (
                        <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-red-400">
                          {favoriteWeather[loc.id].error}
                        </div>
                      ) : favoriteWeather[loc.id]?.weather ? (
                        <div className="group">
                          <WeatherCard
                            weatherData={favoriteWeather[loc.id].weather}
                            locationName={loc.name}
                          />
                          <button
                            onClick={() => {
                              console.log("Delete clicked for location:", loc);
                              if (!loc.id) {
                                console.error("Missing location ID:", loc);
                                setError("Invalid location data");
                                return;
                              }
                              removeFavoriteLocation(loc.id, loc.name);
                            }}
                            className="absolute top-4 right-4 px-4 py-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600"
                          >
                            <i className="fas fa-trash mr-2"></i>
                            Delete
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-5 z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#FF6B6B] rounded-full filter blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#4FD1C5] rounded-full filter blur-[100px]"></div>
      </div>
    </div>
  );
}

export default MainComponent;