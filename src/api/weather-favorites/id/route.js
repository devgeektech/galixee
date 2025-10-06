async function handler(params) {
  const session = getSession();

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  // Extract ID from the URL path parameter
  const id = params.id;

  if (!id) {
    return { error: "Location ID is required" };
  }

  try {
    const result = await sql`
      DELETE FROM weather_favorite_locations 
      WHERE id = ${id} 
      AND user_id = ${session.user.id}
      RETURNING id`;

    if (result.length === 0) {
      return { error: "Location not found or unauthorized" };
    }

    return { message: "Location deleted successfully", success: true };
  } catch (error) {
    console.error("Error deleting location:", error);
    return { error: "Failed to delete location" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}