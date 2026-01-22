import getSession from "@/utilities/getSession";
import { getSessionTokenFromRequest } from "@/utilities/getSessionToken";

// POST handler
export async function POST(request) {
  try {
    // Extract session token from request (header, cookie, or body)
    let sessionToken = getSessionTokenFromRequest(request);
    
    // If not in headers/cookies, try to get from body
    if (!sessionToken) {
      try {
        const text = await request.text();
        if (text) {
          const body = JSON.parse(text);
          sessionToken = body.sessionToken || null;
        }
      } catch (error) {
        // Body parsing failed, continue without it
      }
    }

    // Get session using the client's session token (client-based session)
    const sessionData = await getSession(sessionToken);

    if (sessionData) {
      return Response.json(sessionData);
    }

    // No session found
    return Response.json({});
  } catch (error) {
    console.error("Session lookup failed:", error);
    return Response.json({ error: "Session lookup failed" }, { status: 500 });
  }
}
