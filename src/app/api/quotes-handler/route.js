// src/app/api/quotes/route.js
import getSession from "@/utilities/getSession";
import sql from "@/db";
import { NextResponse } from "next/server";

async function handler(request) {
  const session = await getSession();
  const method = request.method;

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const userId = Number(
    typeof session.user.id === "object"
      ? Object.values(session.user.id)[0]
      : session.user.id
  );

  try {
    if (method === "GET") {
      const { searchParams } = new URL(request.url);
      const category = searchParams.get("category");
      const favorites = searchParams.get("favorites");

      const quotes = await sql`
        SELECT * FROM user_quotes 
        WHERE user_id = ${userId}
        ${category ? sql`AND category = ${category}` : sql``}
        ${favorites === "true" ? sql`AND is_favorite = true` : sql``}
        ORDER BY created_at DESC
      `;

      return NextResponse.json({ quotes });
    }

    if (method === "POST") {
      const body = await request.json();
      const {
        quote_text,
        author,
        category = "personal",
        is_favorite = false,
      } = body;

      if (!quote_text) {
        return NextResponse.json(
          { error: "Quote text is required" },
          { status: 400 }
        );
      }

      const [quote] = await sql`
        INSERT INTO user_quotes (user_id, quote_text, author, category, is_favorite)
        VALUES (${userId}, ${quote_text}, ${author}, ${category}, ${is_favorite})
        RETURNING *
      `;

      return NextResponse.json({
        quote,
        message: "Quote created successfully",
      });
    }

    if (method === "PUT") {
      const body = await request.json();
      const { id, quote_text, author, category, is_favorite } = body;

      if (!id) {
        return NextResponse.json(
          { error: "Quote ID is required" },
          { status: 400 }
        );
      }

      const existing = await sql`
        SELECT * FROM user_quotes 
        WHERE id = ${id} AND user_id = ${userId}
      `;

      if (existing.length === 0) {
        return NextResponse.json(
          { error: "Quote not found" },
          { status: 404 }
        );
      }

      const setClauses = [];
      if (quote_text !== undefined) setClauses.push(sql`quote_text = ${quote_text}`);
      if (author !== undefined) setClauses.push(sql`author = ${author}`);
      if (category !== undefined) setClauses.push(sql`category = ${category}`);
      if (is_favorite !== undefined) setClauses.push(sql`is_favorite = ${is_favorite}`);

      if (setClauses.length === 0) {
        return NextResponse.json(
          { error: "No fields to update" },
          { status: 400 }
        );
      }

      const [updated] = await sql`
        UPDATE user_quotes 
        SET ${sql.join([...setClauses, sql`updated_at = ${new Date()}`], sql`, `)}
        WHERE id = ${id} AND user_id = ${userId}
        RETURNING *
      `;

      return NextResponse.json({
        quote: updated,
        message: "Quote updated successfully",
      });
    }

    if (method === "DELETE") {
      const body = await request.json();
      const { id } = body;

      if (!id) {
        return NextResponse.json(
          { error: "Quote ID is required" },
          { status: 400 }
        );
      }

      const existing = await sql`
        SELECT * FROM user_quotes 
        WHERE id = ${id} AND user_id = ${userId}
      `;

      if (existing.length === 0) {
        return NextResponse.json(
          { error: "Quote not found" },
          { status: 404 }
        );
      }

      await sql`
        DELETE FROM user_quotes 
        WHERE id = ${id} AND user_id = ${userId}
      `;

      return NextResponse.json({ message: "Quote deleted successfully" });
    }

    // Unsupported Method
    return NextResponse.json(
      { error: "Method not allowed" },
      { status: 405 }
    );
  } catch (error) {
    console.error("Quotes handler error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  return handler(request);
}

export async function POST(request) {
  return handler(request);
}

export async function PUT(request) {
  return handler(request);
}

export async function DELETE(request) {
  return handler(request);
}