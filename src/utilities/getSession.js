import sql from "@/db";
import { cookies, headers } from "next/headers";
import { verifyAccessToken } from "./jwt-utils";

export async function getSession() {
  try {
    const cookieStore = await cookies();
    const headerStore = await headers();
    
    let sessionToken =
      cookieStore.get("galixee_session_token")?.value ||
      cookieStore.get("sessionToken")?.value;
    let userId;

    // If no session token from cookies, try Authorization header (mobile)
    if (!sessionToken) {
      const authHeader = headerStore.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const jwtToken = authHeader.substring(7);
        const decoded = verifyAccessToken(jwtToken);
        
        if (decoded) {
          userId = decoded.userId;
          // For JWT, we don't need to query database, use decoded data
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

    // Query session by token (web/cookie flow)
    const sessions = await sql`
      SELECT 
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
      AND s.expires > NOW()
    `;

    if (sessions.length > 0) {
      const sessionData = sessions[0];

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
  return null;
}

export default getSession; // 👈 add this line
