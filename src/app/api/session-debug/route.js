import getSession from '@/utilities/getSession'
async function handler() {
  try {
    const session = getSession();

    // Get database session info
    let databaseSessions = [];
    let totalActiveSessions = 0;
    let userActiveSessions = 0;

    try {
      // Get all active sessions
      const allActiveSessions = await sql`
        SELECT s."userId", s.expires, s."sessionToken", u.email, u.name
        FROM auth_sessions s
        JOIN auth_users u ON s."userId" = u.id
        WHERE s.expires > NOW()
        ORDER BY s.expires DESC
      `;

      databaseSessions = allActiveSessions.map((s) => ({
        userId: s.userId,
        email: s.email,
        name: s.name,
        expires: s.expires,
        sessionToken: s.sessionToken?.substring(0, 10) + "...",
        isExpired: new Date(s.expires) < new Date(),
      }));

      totalActiveSessions = allActiveSessions.length;

      // If we have a session, count user-specific sessions
      if (session?.user?.id) {
        const userSessions = await sql`
          SELECT COUNT(*) as count
          FROM auth_sessions 
          WHERE "userId" = ${session.user.id} AND expires > NOW()
        `;
        userActiveSessions = parseInt(userSessions[0].count);
      }
    } catch (dbError) {
      console.error("Database query error:", dbError);
    }

    const debugInfo = {
      timestamp: new Date().toISOString(),

      // Session from getSession()
      sessionFromGetSession: session
        ? {
            user: session.user
              ? {
                  id: session.user.id,
                  name: session.user.name,
                  email: session.user.email,
                  hasImage: !!session.user.image,
                  allUserKeys: Object.keys(session.user),
                }
              : null,
            expires: session.expires,
            sessionToken: session.sessionToken ? "present" : "missing",
            allSessionKeys: Object.keys(session),
          }
        : null,

      // Basic checks
      sessionExists: !!session,
      userExists: !!(session && session.user),
      userId: session?.user?.id || null,
      userEmail: session?.user?.email || null,

      // Database session info
      databaseSessions: databaseSessions.slice(0, 5), // Show first 5 for brevity
      totalActiveSessions,
      userActiveSessions,

      // Environment info
      nodeEnv: process.env.NODE_ENV,
      hasSessionSecret: !!process.env.NEXTAUTH_SECRET,

      // Detailed analysis
      analysis: {
        sessionWorking: !!session && !!session.user,
        hasUserId: !!session?.user?.id,
        hasUserEmail: !!session?.user?.email,
        canIdentifyUser: !!(session?.user?.id || session?.user?.email),
        databaseHasSessions: totalActiveSessions > 0,
        userHasActiveSessions: userActiveSessions > 0,
      },
    };

    return {
      success: true,
      debug: debugInfo,
    };
  } catch (error) {
    console.error("Session debug error:", error);
    return {
      success: false,
      error: error.message,
      debug: {
        timestamp: new Date().toISOString(),
        sessionFromGetSession: null,
        sessionExists: false,
        errorOccurred: true,
      },
    };
  }
}
export async function POST(request) {
  return handler(await request.json());
}