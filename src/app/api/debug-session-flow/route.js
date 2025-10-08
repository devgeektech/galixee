async function handler() {
  try {
    const session = getSession();

    const debugInfo = {
      timestamp: new Date().toISOString(),
      sessionFromGetSession: session
        ? {
            user: session.user
              ? {
                  id: session.user.id,
                  name: session.user.name,
                  email: session.user.email,
                }
              : null,
            expires: session.expires,
          }
        : null,
    };

    if (session?.user?.id) {
      const userId = session.user.id;

      // Use direct sql queries instead of transactions
      const dbSessions = await sql`
        SELECT 
          s.id,
          s."sessionToken",
          s.expires,
          s."userId",
          u.name,
          u.email,
          u.subscription_status
        FROM auth_sessions s
        JOIN auth_users u ON s."userId" = u.id
        WHERE s."userId" = ${userId}
        ORDER BY s.expires DESC
      `;

      debugInfo.databaseSessions = dbSessions.map((session) => ({
        id: session.id,
        sessionToken: session.sessionToken
          ? session.sessionToken.substring(0, 10) + "..."
          : null,
        expires: session.expires,
        userId: session.userId,
        userName: session.name,
        userEmail: session.email,
        subscriptionStatus: session.subscription_status,
        isExpired: new Date(session.expires) < new Date(),
      }));

      const allActiveSessions = await sql`
        SELECT COUNT(*) as active_count
        FROM auth_sessions 
        WHERE expires > NOW()
      `;

      debugInfo.totalActiveSessions = allActiveSessions[0]?.active_count || 0;

      const userAccounts = await sql`
        SELECT 
          provider,
          type,
          "providerAccountId"
        FROM auth_accounts
        WHERE "userId" = ${userId}
      `;

      debugInfo.userAccounts = userAccounts;

      // Add more detailed session info
      const userActiveSessions = await sql`
        SELECT COUNT(*) as user_active_count
        FROM auth_sessions 
        WHERE "userId" = ${userId} AND expires > NOW()
      `;

      debugInfo.userActiveSessions =
        userActiveSessions[0]?.user_active_count || 0;
    } else {
      debugInfo.databaseSessions = [];
      debugInfo.totalActiveSessions = 0;
      debugInfo.userAccounts = [];
      debugInfo.userActiveSessions = 0;
      debugInfo.note = "No session found or user ID missing";
    }

    const globalSessionStats = await sql`
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN expires > NOW() THEN 1 END) as active_sessions,
        COUNT(CASE WHEN expires <= NOW() THEN 1 END) as expired_sessions
      FROM auth_sessions
    `;

    debugInfo.globalStats = globalSessionStats[0];

    console.log("Debug Session Flow - Detailed Info:", {
      userId: session?.user?.id,
      userActiveSessions: debugInfo.userActiveSessions,
      totalActiveSessions: debugInfo.totalActiveSessions,
      databaseSessionsFound: debugInfo.databaseSessions?.length || 0,
      globalStats: debugInfo.globalStats,
    });

    return {
      success: true,
      debug: debugInfo,
    };
  } catch (error) {
    console.error("Debug session flow error:", error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}
export async function POST(request) {
  return handler(await request.json());
}