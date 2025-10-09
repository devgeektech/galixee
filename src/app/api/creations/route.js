// src/app/api/creations/route.js
import sql from "@/db";
import getSession from "@/utilities/getSession";
import { NextResponse } from "next/server";

export async function handler(reqData) {
  const {
    method, action, id: creationId,
    title, description, creationType,
    fileUrl, thumbnailUrl, isPublic,
    collectionId, metadata = {},
    sortBy, sortOrder, filters
  } = reqData;

  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" });

  const methodUpper = method?.toUpperCase();
  if (methodUpper === "POST") {
    if (action === "create") {
      if (!fileUrl || !title || !creationType)
        return NextResponse.json({ error: "Missing required fields" });

      const creationQuery = `
        INSERT INTO user_creations (
          user_id, title, description, creation_type,
          file_url, thumbnail_url, is_public, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      const creationValues = [
        session.user.id,
        title,
        description,
        creationType,
        fileUrl,
        thumbnailUrl || fileUrl,
        isPublic || false,
        JSON.stringify(metadata)
      ];

      const [creation] = await sql(creationQuery, ...creationValues);

      if (collectionId) {
        const collectionQuery = `
          INSERT INTO creation_collection_items (collection_id, creation_id)
          VALUES ($1, $2)
        `;
        await sql(collectionQuery, collectionId, creation.id);
      }

      return NextResponse.json({ creation });
    }

    if (action === "createCollection") {
      if (!title) return NextResponse.json({ error: "Collection name required" });

      const collectionQuery = `
        INSERT INTO creation_collections (user_id, name, description)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      const collectionValues = [session.user.id, title, description];

      const [collection] = await sql(collectionQuery, ...collectionValues);
      return NextResponse.json({ collection });
    }
  }

  if (methodUpper === "PUT") {
    if (!creationId) return NextResponse.json({ error: "Creation ID required" });

    const updates = [];
    const values = [];

    if (title) { updates.push(`title = $${updates.length + 1}`); values.push(title); }
    if (description !== undefined) { updates.push(`description = $${updates.length + 1}`); values.push(description); }
    if (creationType) { updates.push(`creation_type = $${updates.length + 1}`); values.push(creationType); }
    if (isPublic !== undefined) { updates.push(`is_public = $${updates.length + 1}`); values.push(isPublic); }
    if (metadata) { updates.push(`metadata = $${updates.length + 1}`); values.push(JSON.stringify(metadata)); }

    if (updates.length === 0) return NextResponse.json({ error: "No updates provided" });

    values.push(creationId, session.user.id); // for WHERE clause
    const queryText = `
      UPDATE user_creations
      SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${values.length - 1} AND user_id = $${values.length}
      RETURNING *
    `;

    const [updated] = await sql(queryText, ...values);
    return NextResponse.json({ creation: updated });
  }

  if (methodUpper === "GET") {
  let queryText = "SELECT * FROM user_creations WHERE user_id = $1";
  const queryParams = [session.user.id];

  if (filters?.type) {
    queryParams.push(filters.type);
    queryText += ` AND creation_type = $${queryParams.length}`;
  }

  if (filters?.isPublic !== undefined) {
    queryParams.push(filters.isPublic);
    queryText += ` AND is_public = $${queryParams.length}`;
  }

  const validColumns = ["created_at", "title", "creation_type"];
  const column = validColumns.includes(sortBy) ? sortBy : "created_at";
  const order = sortOrder?.toUpperCase() === "DESC" ? "DESC" : "ASC";

  queryText += ` ORDER BY ${column} ${order}`;

  const creations = await sql(queryText, ...queryParams);
  return NextResponse.json({ creations });
}

  if (methodUpper === "DELETE") {
    if (!creationId) return NextResponse.json({ error: "Creation ID required" });

    const deleteCollectionItemsQuery = `
      DELETE FROM creation_collection_items
      WHERE creation_id = $1 AND
            collection_id IN (SELECT id FROM creation_collections WHERE user_id = $2)
    `;
    await sql(deleteCollectionItemsQuery, creationId, session.user.id);

    const deleteCreationQuery = `
      DELETE FROM user_creations
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const [deleted] = await sql(deleteCreationQuery, creationId, session.user.id);

    return NextResponse.json({ deleted });
  }

  return NextResponse.json({ error: "Method not allowed" });
}

export async function POST(request) {
  return handler(await request.json());
}
