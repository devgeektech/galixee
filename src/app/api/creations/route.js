// src/app/api/creations/route.js
import sql from "@/db";
import getSession from "@/utilities/getSession";
import { NextResponse } from "next/server";

export async function handler(reqData) {
  const {
    method,
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
  } = reqData;

  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" });

  const methodUpper = method?.toUpperCase();

  // CREATE CREATION OR COLLECTION
  if (methodUpper === "POST") {
    if (action === "create") {
      if (!fileUrl || !title || !creationType)
        return NextResponse.json({ error: "Missing required fields" });

      const [creation] = await sql`
        INSERT INTO user_creations (
          user_id, title, description, creation_type,
          file_url, thumbnail_url, is_public, metadata
        ) VALUES (
          ${session.user.id},
          ${title},
          ${description},
          ${creationType},
          ${fileUrl},
          ${thumbnailUrl || fileUrl},
          ${isPublic || false},
          ${JSON.stringify(metadata)}
        )
        RETURNING *
      `;

      if (collectionId) {
        await sql`
          INSERT INTO creation_collection_items (collection_id, creation_id)
          VALUES (${collectionId}, ${creation.id})
        `;
      }

      return NextResponse.json({ creation });
    }

    if (action === "createCollection") {
      if (!title) return NextResponse.json({ error: "Collection name required" });

      const [collection] = await sql`
        INSERT INTO creation_collections (user_id, name, description)
        VALUES (${session.user.id}, ${title}, ${description})
        RETURNING *
      `;

      return NextResponse.json({ collection });
    }
  }

  // UPDATE CREATION
  if (methodUpper === "PUT") {
    if (!creationId) return NextResponse.json({ error: "Creation ID required" });

    const updates = [];
    if (title !== undefined) updates.push(sql`title = ${title}`);
    if (description !== undefined) updates.push(sql`description = ${description}`);
    if (creationType !== undefined) updates.push(sql`creation_type = ${creationType}`);
    if (isPublic !== undefined) updates.push(sql`is_public = ${isPublic}`);
    if (metadata !== undefined) updates.push(sql`metadata = ${JSON.stringify(metadata)}`);

    if (updates.length === 0) return NextResponse.json({ error: "No updates provided" });

    const setClause = sql.join([...updates, sql`updated_at = CURRENT_TIMESTAMP`], sql`, `);

    const [updated] = await sql`
      UPDATE user_creations
      SET ${setClause}
      WHERE id = ${creationId} AND user_id = ${session.user.id}
      RETURNING *
    `;

    return NextResponse.json({ creation: updated });
  }

  // GET CREATIONS
  if (methodUpper === "GET") {
    const validColumns = ["created_at", "title", "creation_type"];
    const column = validColumns.includes(sortBy) ? sortBy : "created_at";
    const order = sortOrder?.toUpperCase() === "DESC" ? "DESC" : "ASC";

    // Use parameterized query to safely handle column and order
    const creations = await sql`
      SELECT *
      FROM user_creations
      WHERE user_id = ${session.user.id}
      ${filters?.type ? sql`AND creation_type = ${filters.type}` : sql``}
      ${filters?.isPublic !== undefined ? sql`AND is_public = ${filters.isPublic}` : sql``}
      ORDER BY ${sql.unsafe(column)} ${sql.unsafe(order)}
    `;

    return NextResponse.json({ creations });
  }

  // DELETE CREATION
  if (methodUpper === "DELETE") {
    if (!creationId) return NextResponse.json({ error: "Creation ID required" });

    await sql`
      DELETE FROM creation_collection_items
      WHERE creation_id = ${creationId} AND
            collection_id IN (SELECT id FROM creation_collections WHERE user_id = ${session.user.id})
    `;

    const [deleted] = await sql`
      DELETE FROM user_creations
      WHERE id = ${creationId} AND user_id = ${session.user.id}
      RETURNING *
    `;

    return NextResponse.json({ deleted });
  }

  return NextResponse.json({ error: "Method not allowed" });
}

export async function POST(request) {
return handler(await request.json());
}