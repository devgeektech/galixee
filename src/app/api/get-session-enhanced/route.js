import sql from "@/db";
import { cookies, headers } from "next/headers";
import { verifyAccessToken } from "@/utilities/jwt-utils";

// Handler to get session from DB
async function handler(request) {
  try {
    const cookieStore = await cookies();
    const headerStore = await headers();
    
    let sessionToken = cookieStore.get("galixee_session_token")?.value;

    // If no session token from cookies, try Authorization header (mobile)
    if (!sessionToken) {
      const authHeader = headerStore.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const jwtToken = authHeader.substring(7);
        const decoded = verifyAccessToken(jwtToken);
        
        if (decoded) {
          // For JWT, return decoded data directly
          return {
            user: {
              id: decoded.userId,
              name: decoded.name,
              email: decoded.email,
            },
            source: "jwt",
          };
        }
      }
      return null;
    }

    // Query the specific session from the token
    const activeSessions = await sql`SELECT 
  s."userId",
  s.expires,
  u.name,
  u.email,
  p.first_name,
  p.last_name,
  u.image
FROM auth_sessions s
JOIN auth_users u ON s."userId" = u.id
LEFT JOIN user_profiles p ON u.id = p.user_id
WHERE s."sessionToken" = ${sessionToken}
AND s.expires > NOW()`;


    if (activeSessions.length > 0) {
      const sessionData = activeSessions[0];

      return {
        user: {
          id: sessionData.userId,
          name:
            sessionData.name ||
            `${sessionData.first_name || ""} ${sessionData.last_name || ""}`.trim() ||
            null,
          email: sessionData.email,
          image: sessionData.image,
        },
        expires: sessionData.expires,
        source: "session",
      };
    }
  } catch (error) {
    console.error("Database session lookup failed:", error);
  }

  // No session found
  return null;
}

// POST handler
export async function POST(request) {
  let body = {};

  try {
    const text = await request.text();
    body = text ? JSON.parse(text) : {};
  } catch (error) {
    console.error("Failed to parse JSON body:", error);
  }

  const sessionData = await handler(request);

  return Response.json(sessionData || {});
}
