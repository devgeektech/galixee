async function handler({
  type,
  albumId,
  userId,
  title,
  description,
  visibility,
}) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    switch (type) {
      case "GET_ALBUMS": {
        const albums = await sql`
          SELECT * FROM photo_albums 
          WHERE user_id = ${session.user.id} 
          ORDER BY created_at DESC
        `;
        return { albums };
      }

      case "CREATE_ALBUM": {
        if (!title || !visibility) {
          return { error: "Missing required fields" };
        }

        const [album] = await sql`
          INSERT INTO photo_albums (user_id, title, description, visibility)
          VALUES (${session.user.id}, ${title}, ${description}, ${visibility})
          RETURNING *
        `;
        return { album };
      }

      case "UPDATE_ALBUM": {
        if (!albumId) {
          return { error: "Album ID required" };
        }

        const [album] = await sql`
          UPDATE photo_albums 
          SET title = ${title},
              description = ${description},
              visibility = ${visibility},
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${albumId} 
          AND user_id = ${session.user.id}
          RETURNING *
        `;
        return { album };
      }

      case "DELETE_ALBUM": {
        if (!albumId) {
          return { error: "Album ID required" };
        }

        await sql`
          DELETE FROM photo_albums 
          WHERE id = ${albumId} 
          AND user_id = ${session.user.id}
        `;
        return { success: true };
      }

      default:
        return { error: "Invalid operation type" };
    }
  } catch (error) {
    return { error: "Failed to process request" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}