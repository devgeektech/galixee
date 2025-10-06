async function handler({
  method,
  userId,
  collectionId,
  name,
  description,
  creationId,
  action,
}) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  switch (method) {
    case "GET": {
      if (collectionId) {
        // Get single collection with its items
        const [collection, items] = await sql.transaction([
          sql`
            SELECT * FROM creation_collections 
            WHERE id = ${collectionId} AND user_id = ${session.user.id}
          `,
          sql`
            SELECT ci.*, uc.title, uc.description as creation_description, uc.file_url, uc.thumbnail_url, uc.creation_type
            FROM creation_collection_items ci
            JOIN user_creations uc ON ci.creation_id = uc.id
            WHERE ci.collection_id = ${collectionId}
          `,
        ]);

        if (collection.length === 0) {
          return { error: "Collection not found" };
        }

        return {
          collection: collection[0],
          items: items,
        };
      }

      // Get all collections for user
      const collections = await sql`
        SELECT * FROM creation_collections 
        WHERE user_id = ${session.user.id}
        ORDER BY created_at DESC
      `;
      return { collections };
    }

    case "POST": {
      if (action === "add_item") {
        // Add item to collection
        const result = await sql`
          INSERT INTO creation_collection_items (collection_id, creation_id)
          VALUES (${collectionId}, ${creationId})
          ON CONFLICT (collection_id, creation_id) DO NOTHING
          RETURNING *
        `;
        return { item: result[0] };
      }

      // Create new collection
      const result = await sql`
        INSERT INTO creation_collections (user_id, name, description)
        VALUES (${session.user.id}, ${name}, ${description})
        RETURNING *
      `;
      return { collection: result[0] };
    }

    case "PUT": {
      const result = await sql`
        UPDATE creation_collections
        SET name = ${name},
            description = ${description},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${collectionId} 
        AND user_id = ${session.user.id}
        RETURNING *
      `;

      if (result.length === 0) {
        return { error: "Collection not found" };
      }
      return { collection: result[0] };
    }

    case "DELETE": {
      if (creationId) {
        // Remove item from collection
        await sql`
          DELETE FROM creation_collection_items
          WHERE collection_id = ${collectionId}
          AND creation_id = ${creationId}
        `;
        return { success: true };
      }

      // Delete entire collection
      await sql.transaction([
        sql`
          DELETE FROM creation_collection_items
          WHERE collection_id = ${collectionId}
        `,
        sql`
          DELETE FROM creation_collections
          WHERE id = ${collectionId}
          AND user_id = ${session.user.id}
        `,
      ]);
      return { success: true };
    }

    default:
      return { error: "Method not allowed" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}