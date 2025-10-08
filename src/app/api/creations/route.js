async function handler({
  method,
  userId,
  action,
  id: creationId,
  title,
  description,
  creationType,
  fileUrl,
  thumbnailUrl,
  isPublic,
  collectionId,
  metadata = {},
  sortBy,
  sortOrder,
  filters,
}) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  // Convert method to uppercase to make it case-insensitive
  const methodUpper = method?.toUpperCase();

  switch (methodUpper) {
    case "POST": {
      if (action === "create") {
        if (!fileUrl || !title || !creationType) {
          return { error: "Missing required fields" };
        }

        const [creation] = await sql`
          INSERT INTO user_creations (
            user_id, title, description, creation_type, 
            file_url, thumbnail_url, is_public, metadata
          )
          VALUES (
            ${session.user.id}, ${title}, ${description}, ${creationType},
            ${fileUrl}, ${thumbnailUrl || fileUrl}, ${
          isPublic || false
        }, ${JSON.stringify(metadata)}
          )
          RETURNING *
        `;

        if (collectionId) {
          await sql`
            INSERT INTO creation_collection_items (collection_id, creation_id)
            VALUES (${collectionId}, ${creation.id})
          `;
        }

        return { creation };
      }

      if (action === "createCollection") {
        if (!title) return { error: "Collection name required" };

        const [collection] = await sql`
          INSERT INTO creation_collections (user_id, name, description)
          VALUES (${session.user.id}, ${title}, ${description})
          RETURNING *
        `;

        return { collection };
      }
    }

    case "PUT": {
      if (!creationId) return { error: "Creation ID required" };

      const updates = [];
      const values = [];
      let paramCount = 1;

      if (title) {
        updates.push(`title = $${paramCount}`);
        values.push(title);
        paramCount++;
      }
      if (description !== undefined) {
        updates.push(`description = $${paramCount}`);
        values.push(description);
        paramCount++;
      }
      if (creationType) {
        updates.push(`creation_type = $${paramCount}`);
        values.push(creationType);
        paramCount++;
      }
      if (isPublic !== undefined) {
        updates.push(`is_public = $${paramCount}`);
        values.push(isPublic);
        paramCount++;
      }
      if (metadata) {
        updates.push(`metadata = $${paramCount}`);
        values.push(JSON.stringify(metadata));
        paramCount++;
      }

      if (updates.length === 0) return { error: "No updates provided" };

      const [updated] = await sql(
        `
        UPDATE user_creations 
        SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
        RETURNING *
      `,
        [...values, creationId, session.user.id]
      );

      return { creation: updated };
    }

    case "GET": {
      let query = "SELECT * FROM user_creations WHERE user_id = $1";
      const queryParams = [session.user.id];
      let paramCount = 2;

      if (filters) {
        if (filters.type) {
          query += ` AND creation_type = $${paramCount}`;
          queryParams.push(filters.type);
          paramCount++;
        }
        if (filters.isPublic !== undefined) {
          query += ` AND is_public = $${paramCount}`;
          queryParams.push(filters.isPublic);
          paramCount++;
        }
      }

      if (sortBy) {
        const validColumns = ["created_at", "title", "creation_type"];
        const column = validColumns.includes(sortBy) ? sortBy : "created_at";
        const order = sortOrder?.toUpperCase() === "DESC" ? "DESC" : "ASC";
        query += ` ORDER BY ${column} ${order}`;
      } else {
        query += " ORDER BY created_at DESC";
      }

      const creations = await sql(query, queryParams);
      return { creations };
    }

    case "DELETE": {
      if (!creationId) return { error: "Creation ID required" };

      await sql`
        DELETE FROM creation_collection_items 
        WHERE creation_id = ${creationId} AND 
        collection_id IN (
          SELECT id FROM creation_collections 
          WHERE user_id = ${session.user.id}
        )
      `;

      const [deleted] = await sql`
        DELETE FROM user_creations 
        WHERE id = ${creationId} AND user_id = ${session.user.id}
        RETURNING *
      `;

      return { deleted };
    }

    default:
      return { error: "Method not allowed" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}