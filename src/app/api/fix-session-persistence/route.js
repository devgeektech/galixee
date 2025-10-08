async function handler() {
  try {
    const session = getSession();

    if (!session || !session.user?.id) {
      return {
        error: "No active session found",
        authenticated: false,
      };
    }

    const userId = session.user.id;

    // Check for active sessions
    const existingSessions = await sql`
      SELECT id, "userId", expires, "sessionToken"
      FROM auth_sessions 
      WHERE "userId" = ${userId}
      AND expires > NOW()
    `;

    // Check for ALL sessions (including expired)
    const allSessions = await sql`
      SELECT id, "userId", expires, "sessionToken"
      FROM auth_sessions 
      WHERE "userId" = ${userId}
    `;

    const userRecord = await sql`
      SELECT id, name, email 
      FROM auth_users 
      WHERE id = ${userId}
    `;

    if (userRecord.length === 0) {
      return {
        error: "User record not found in database",
        userId: userId,
        repaired: false,
      };
    }

    const diagnostics = {
      userId: userId,
      userExists: userRecord.length > 0,
      activeSessions: existingSessions.length,
      totalSessions: allSessions.length,
      sessionDetails: existingSessions,
      allSessionDetails: allSessions,
      currentTime: new Date().toISOString(),
    };

    // Log detailed diagnostics
    console.log("Session Fix Diagnostics:", {
      userId,
      activeSessions: existingSessions.length,
      totalSessions: allSessions.length,
      sessionTokens: existingSessions.map(
        (s) => s.sessionToken?.substring(0, 20) + "..."
      ),
      expires: existingSessions.map((s) => s.expires),
    });

    if (existingSessions.length === 0) {
      const newSessionToken = `galixee_session_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await sql`
        INSERT INTO auth_sessions ("userId", expires, "sessionToken")
        VALUES (${userId}, ${expiresAt.toISOString()}, ${newSessionToken})
      `;

      const verifySession = await sql`
        SELECT id, "userId", expires, "sessionToken"
        FROM auth_sessions 
        WHERE "userId" = ${userId}
        AND "sessionToken" = ${newSessionToken}
      `;

      return {
        success: true,
        repaired: true,
        message: "Missing session record created",
        diagnostics: diagnostics,
        newSession: verifySession[0],
        user: userRecord[0],
      };
    }

    // Clean up expired sessions
    const expiredSessions = await sql`
      SELECT COUNT(*) as count
      FROM auth_sessions 
      WHERE "userId" = ${userId}
      AND expires <= NOW()
    `;

    if (expiredSessions[0].count > 0) {
      await sql`
        DELETE FROM auth_sessions 
        WHERE "userId" = ${userId}
        AND expires <= NOW()
      `;
    }

    return {
      success: true,
      repaired: false,
      message: `Session persistence is healthy - Found ${existingSessions.length} active sessions`,
      diagnostics: diagnostics,
      cleanedExpiredSessions: expiredSessions[0].count,
      user: userRecord[0],
    };
  } catch (error) {
    console.error("Session fix error:", error);
    return {
      error: "Failed to diagnose session persistence",
      details: error.message,
      repaired: false,
    };
  }
}
export async function POST(request) {
  return handler(await request.json());
}