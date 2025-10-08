async function handler({
  method,
  id,
  title,
  description,
  creationType,
  fileUrl,
  thumbnailUrl,
  tags,
  metadata,
  status,
  isPublic,
  userId,
}) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  // Convert method to lowercase for consistent handling
  const methodLower = (method || "").toLowerCase();

  switch (methodLower) {
    case "create": {
      const result = await sql`
        INSERT INTO user_creations (
          user_id, title, description, creation_type, file_url, 
          thumbnail_url, tags, metadata, status, is_public
        ) 
        VALUES (
          ${
            session.user.id
          }, ${title}, ${description}, ${creationType}, ${fileUrl},
          ${thumbnailUrl}, ${tags || []}, ${metadata || {}}, ${
        status || "draft"
      }, ${isPublic || false}
        )
        RETURNING *`;
      return { creation: result[0] };
    }

    case "get": {
      if (id) {
        const result = await sql`
          SELECT * FROM user_creations 
          WHERE id = ${id} 
          AND (user_id = ${session.user.id} OR is_public = true)`;
        return { creation: result[0] };
      }

      const result = await sql`
        SELECT * FROM user_creations 
        WHERE user_id = ${userId || session.user.id}
        ORDER BY created_at DESC`;
      return { creations: result };
    }

    case "update": {
      const result = await sql`
        UPDATE user_creations 
        SET 
          title = ${title},
          description = ${description},
          creation_type = ${creationType},
          file_url = ${fileUrl},
          thumbnail_url = ${thumbnailUrl},
          tags = ${tags || []},
          metadata = ${metadata || {}},
          status = ${status || "draft"},
          is_public = ${isPublic || false},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id} AND user_id = ${session.user.id}
        RETURNING *`;
      return { creation: result[0] };
    }

    case "delete": {
      await sql`
        DELETE FROM user_creations 
        WHERE id = ${id} AND user_id = ${session.user.id}`;
      return { success: true };
    }

    default:
      return {
        error: `Invalid method: ${method}. Expected one of: create, get, update, delete`,
      };
  }
}
export async function POST(request) {
  return handler(await request.json());
}