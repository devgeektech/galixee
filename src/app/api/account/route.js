import { NextResponse } from "next/server";
import sql from "@/db";
import getSession from "@/utilities/getSession";
import { getSessionTokenFromRequest } from "@/utilities/getSessionToken";

async function doLogout(request) {
  try {
    // Get session token from request (header, cookie, or body)
    const sessionToken = getSessionTokenFromRequest(request);
    
    // Get session using the client's session token (client-based session)
    const session = await getSession(sessionToken);
    
    if (session?.user?.id) {
      // Delete the specific session by token (client-based logout)
      // This ensures only the current device's session is logged out
      if (sessionToken) {
        await sql`DELETE FROM auth_sessions WHERE "sessionToken" = ${sessionToken}`;
      } else {
        // Fallback: delete all sessions for the user (if token not provided)
        await sql`DELETE FROM auth_sessions WHERE "userId" = ${session.user.id}`;
      }
      return { success: true };
    }
    return { success: false, error: "No active session" };
  } catch (e) {
    console.error("API logout error:", e);
    return { success: false, error: "Internal error" };
  }
}

export async function POST(request) {
  const result = await doLogout(request);
  const status = result.success ? 200 : result.error === "No active session" ? 200 : 500;
  return NextResponse.json(result, { status });
}

export async function GET(request) {
  // Also support GET for convenience; respond with JSON and optional redirect
  const result = await doLogout(request);
  if (request.nextUrl.searchParams.get("redirect") === "true") {
    const location = new URL("/account/signin", request.url);
    return NextResponse.redirect(location);
  }
  const status = result.success ? 200 : result.error === "No active session" ? 200 : 500;
  return NextResponse.json(result, { status });
}
