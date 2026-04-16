import { NextResponse } from "next/server";
import sql from "@/db";

export async function GET(request) {
  try {
    const sessionToken = request.cookies.get("galixee_session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await sql`
      SELECT
        s."userId",
        s.expires,
        u.id,
        u.name,
        u.email,
        u.image,
        p.first_name,
        p.last_name
      FROM auth_sessions s
      JOIN auth_users u ON s."userId" = u.id
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE s."sessionToken" = ${sessionToken}
        AND s.expires > NOW()
      LIMIT 1
    `;

    if (sessions.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = sessions[0];
    const user = {
      id: session.id,
      name:
        session.name ||
        `${session.first_name || ""} ${session.last_name || ""}`.trim() ||
        null,
      email: session.email,
      image: session.image,
    };

    return NextResponse.json({
      user,
      expires: session.expires,
    });
  } catch (error) {
    console.error("GET /api/me failed:", error);
    return NextResponse.json(
      { error: "Failed to load current user" },
      { status: 500 }
    );
  }
}
