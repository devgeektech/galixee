async function handler({ method, body, params }) {
  try {
    const session = getSession();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;

    if (method === "GET") {
      const favorites = await sql`
        SELECT id::integer, name, latitude, longitude, created_at
        FROM weather_favorite_locations
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `;

      // Ensure each favorite has the correct data structure
      const validFavorites = favorites.map((fav) => ({
        id: parseInt(fav.id, 10),
        name: fav.name,
        latitude: fav.latitude,
        longitude: fav.longitude,
        created_at: fav.created_at,
      }));

      return { favorites: validFavorites };
    }

    if (method === "POST") {
      const { name, latitude, longitude } = body;

      if (!name || !latitude || !longitude) {
        return { error: "Missing required fields" };
      }

      // Insert the new location
      const [newLocation] = await sql`
        INSERT INTO weather_favorite_locations
        (user_id, name, latitude, longitude)
        VALUES (${userId}, ${name}, ${latitude}, ${longitude})
        RETURNING id::integer, name, latitude, longitude, created_at
      `;

      // Return the newly created location
      return {
        id: parseInt(newLocation.id, 10),
        name: newLocation.name,
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
        created_at: newLocation.created_at,
      };
    }

    return { error: "Method not allowed" };
  } catch (error) {
    console.error("Weather favorites handler error:", error);
    return { error: "An unexpected error occurred" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}