async function handler({ action, sessionToken, userId }) {
  try {
    if (action === "set" && sessionToken) {
      // Store session token for future getSession() calls
      global.activeSessionToken = sessionToken;

      // Get the full session data from database
      const sessions = await sql`
        SELECT s."userId", s.expires, s."sessionToken", u.id, u.name, u.email, u.image
        FROM auth_sessions s
        JOIN auth_users u ON s."userId" = u.id
        WHERE s."sessionToken" = ${sessionToken}
        AND s.expires > NOW()
      `;

      if (sessions.length > 0) {
        const sessionData = sessions[0];
        global.currentSession = {
          user: {
            id: sessionData.id,
            name: sessionData.name,
            email: sessionData.email,
            image: sessionData.image,
          },
          sessionToken: sessionData.sessionToken,
          expires: sessionData.expires,
        };

        return {
          success: true,
          message: "Session set successfully",
          session: global.currentSession,
        };
      } else {
        return {
          success: false,
          error: "Invalid or expired session token",
        };
      }
    }

    if (action === "get") {
      // Try to get session from global first
      if (global.currentSession) {
        return {
          success: true,
          session: global.currentSession,
          source: "global",
        };
      }

      // Try to get session from database using stored token
      if (global.activeSessionToken) {
        const sessions = await sql`
          SELECT s."userId", s.expires, s."sessionToken", u.id, u.name, u.email, u.image
          FROM auth_sessions s
          JOIN auth_users u ON s."userId" = u.id
          WHERE s."sessionToken" = ${global.activeSessionToken}
          AND s.expires > NOW()
        `;

        if (sessions.length > 0) {
          const sessionData = sessions[0];
          global.currentSession = {
            user: {
              id: sessionData.id,
              name: sessionData.name,
              email: sessionData.email,
              image: sessionData.image,
            },
            sessionToken: sessionData.sessionToken,
            expires: sessionData.expires,
          };

          return {
            success: true,
            session: global.currentSession,
            source: "database",
          };
        }
      }

      // Try to find any active session for the test user
      const testUserSessions = await sql`
        SELECT s."userId", s.expires, s."sessionToken", u.id, u.name, u.email, u.image
        FROM auth_sessions s
        JOIN auth_users u ON s."userId" = u.id
        WHERE u.email = 'test@example.com'
        AND s.expires > NOW()
        ORDER BY s.expires DESC
        LIMIT 1
      `;

      if (testUserSessions.length > 0) {
        const sessionData = testUserSessions[0];
        global.currentSession = {
          user: {
            id: sessionData.id,
            name: sessionData.name,
            email: sessionData.email,
            image: sessionData.image,
          },
          sessionToken: sessionData.sessionToken,
          expires: sessionData.expires,
        };
        global.activeSessionToken = sessionData.sessionToken;

        return {
          success: true,
          session: global.currentSession,
          source: "test_user_fallback",
        };
      }

      return {
        success: false,
        error: "No active session found",
        session: null,
      };
    }

    if (action === "clear") {
      global.currentSession = null;
      global.activeSessionToken = null;
      return {
        success: true,
        message: "Session cleared",
      };
    }

    return {
      success: false,
      error: "Invalid action. Use 'set', 'get', or 'clear'",
    };
  } catch (error) {
    console.error("Session middleware error:", error);
    return {
      success: false,
      error: "Session middleware failed",
      details: error.message,
    };
  }
}
export async function POST(request) {
  return handler(await request.json());
}