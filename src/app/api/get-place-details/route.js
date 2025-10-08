async function handler({ place_id }) {
  if (!place_id) {
    return {
      error: "place_id is required",
    };
  }

  try {
    // Get the place name from the autocomplete response
    const response = await fetch(
      `/integrations/google-place-autocomplete/autocomplete/json?input=${encodeURIComponent(
        place_id
      )}&radius=50000`
    );

    const data = await response.json();
    const place = data.predictions?.[0];

    if (!place) {
      return {
        error: "Could not find location",
      };
    }

    // Use the place name to get weather data which includes coordinates
    const weatherResponse = await fetch(
      `/integrations/weather-by-city/weather/${encodeURIComponent(
        place.description
      )}`
    );

    const weatherData = await weatherResponse.json();

    if (!weatherData?.location?.lat || !weatherData?.location?.lon) {
      return {
        error: "Could not get coordinates for this location",
      };
    }

    return {
      name: place.structured_formatting.main_text,
      latitude: weatherData.location.lat,
      longitude: weatherData.location.lon,
    };
  } catch (error) {
    console.error("Error fetching place details:", error);
    return {
      error: "Failed to fetch place details",
    };
  }
}
export async function POST(request) {
  return handler(await request.json());
}