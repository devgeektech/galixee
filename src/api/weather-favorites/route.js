async function handler({ method, body }) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const userId = session.user.id;

  try {
    switch (method) {
      case "GET":
        const favorites = await sql`
          SELECT id, name, latitude, longitude, created_at
          FROM weather_favorite_locations
          WHERE user_id = ${userId}
          ORDER BY created_at DESC
        `;
        return { favorites };

      case "POST":
        const { name, latitude, longitude } = body;
        if (!name || !latitude || !longitude) {
          return { error: "Missing required fields" };
        }

        const [newLocation] = await sql`
          INSERT INTO weather_favorite_locations
          (user_id, name, latitude, longitude)
          VALUES (${userId}, ${name}, ${latitude}, ${longitude})
          RETURNING id, name, latitude, longitude, created_at
        `;
        return newLocation;

      case "DELETE":
        const { id } = body;
        if (!id) {
          return { error: "Location ID is required" };
        }

        // First check if the location exists and belongs to the user
        const [existingLocation] = await sql`
          SELECT id FROM weather_favorite_locations
          WHERE id = ${id} AND user_id = ${userId}
        `;

        if (!existingLocation) {
          return { error: "Location not found or unauthorized" };
        }

        // Then delete it
        await sql`
          DELETE FROM weather_favorite_locations
          WHERE id = ${id} AND user_id = ${userId}
        `;

        return { success: true, id };

      default:
        return { error: "Method not allowed" };
    }
  } catch (err) {
    console.error("Weather favorites handler error:", err);
    return { error: "Internal server error", details: err.message };
  }
}
export async function POST(request) {
  return handler(await request.json());
}