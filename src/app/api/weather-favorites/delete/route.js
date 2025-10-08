async function handler({ locationId }) {
  const session = getSession();

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  // Log the incoming locationId for debugging
  console.log("Received locationId:", locationId, "type:", typeof locationId);

  // Ensure locationId is provided
  if (locationId === undefined || locationId === null) {
    return { error: "Location ID is required" };
  }

  // Validate locationId is a number
  const locationIdNum = parseInt(locationId, 10);
  if (isNaN(locationIdNum)) {
    return { error: "Invalid location ID format" };
  }

  try {
    console.log(
      "Attempting to delete location:",
      locationIdNum,
      "for user:",
      session.user.id
    );

    const result = await sql`
      DELETE FROM weather_favorite_locations 
      WHERE id = ${locationIdNum}
      AND user_id = ${session.user.id}
      RETURNING id
    `;

    console.log("Delete result:", result);

    if (!result || result.length === 0) {
      return { error: "Location not found or already deleted" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting location:", error);
    return { error: "Failed to delete location: " + error.message };
  }
}
export async function POST(request) {
  return handler(await request.json());
}