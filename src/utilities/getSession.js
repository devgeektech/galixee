import sql from "@/db";

/**
 * Get session from database
 * @param {string|null} sessionToken - Optional session token to filter by (for client-based sessions)
 * @returns {Promise<Object|null>} Session data or null
 */
export async function getSession(sessionToken = null) {
  try {
    let query;
    
    // If sessionToken is provided, filter by it (client-based session)
    // This ensures each device/browser has its own session
    if (sessionToken) {
      query = sql`
        SELECT 
          s."userId",
          s.expires,
          s."sessionToken",
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
        LIMIT 1
      `;
    } else {
      // Fallback: get most recent session (for backward compatibility)
      // Note: This should be avoided in production for multi-user scenarios
      query = sql`
        SELECT 
          s."userId",
          s.expires,
          s."sessionToken",
          u.name,
          u.email,
          p.first_name,
          p.last_name,
          u.image
        FROM auth_sessions s
        JOIN auth_users u ON s."userId" = u.id
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE s.expires > NOW()
        ORDER BY s.expires DESC
        LIMIT 1
      `;
    }

    const activeSessions = await query;

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
          subscription_status: sessionData.subscription_status ?? null,
          stripe_id: sessionData.stripe_id ?? null,
        },
        expires: sessionData.expires,
        sessionToken: sessionData.sessionToken,
      };
    }
  } catch (error) {
    console.error("Database session lookup failed:", error);
  }
  return null;
}

export default getSession; // 👈 add this line
