import getSession from "@/utilities/getSession";
import sql from "@/db";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { sessionToken } = body;

    // Get session from utility
    const session = await getSession();

    // Try to find session in database with the token
    let dbSession = null;
    if (sessionToken) {
      const result = await sql`
        SELECT s."userId", s.expires, s."sessionToken", u.id, u.email, u.name
        FROM auth_sessions s
        JOIN auth_users u ON s."userId" = u.id
        WHERE s."sessionToken" = ${sessionToken}
      `;
      dbSession = result.length > 0 ? result[0] : null;
    }

    return NextResponse.json({
      sessionFromUtil: session ? {
        userId: session.user.id,
        email: session.user.email,
        name: session.user.name,
        expires: session.expires,
      } : null,
      sessionFromDB: dbSession ? {
        userId: dbSession.userId,
        email: dbSession.email,
        name: dbSession.name,
        expires: dbSession.expires,
        tokenProvided: !!sessionToken,
      } : null,
      tokenProvidedInRequest: !!sessionToken,
      timestamp: new Date().toISOString(),
      allMatched: session && dbSession && session.user.id === dbSession.userId,
    });
  } catch (error) {
    return NextResponse.json({
      error: error.message,
      details: error,
    }, { status: 500 });
  }
}
