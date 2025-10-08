function handler() {
  const session = getSession();

  if (!session || !session.user) {
    return {
      error: "No session found",
      sessionExists: false,
      timestamp: new Date().toISOString(),
    };
  }

  return {
    sessionComparison: {
      sessionExists: true,
      userId: session.user.id,
      userEmail: session.user.email,
      userName: session.user.name,
      sessionData: {
        hasUser: !!session.user,
        userIdType: typeof session.user.id,
        userIdValue: session.user.id,
        emailExists: !!session.user.email,
        nameExists: !!session.user.name,
      },
      debugInfo: {
        sessionKeys: Object.keys(session),
        userKeys: session.user ? Object.keys(session.user) : [],
        fullSession: session,
      },
      subscriptionCheckData: {
        userIdForQuery: session.user.id,
        canQueryDatabase: true,
        timestamp: new Date().toISOString(),
      },
    },
    recommendations: [
      "Check if subscription-status function receives same session data",
      "Verify user ID is properly passed to database queries",
      "Compare session structure between working and failing functions",
      "Check if session persistence differs between function calls",
    ],
  };
}
export async function POST(request) {
  return handler(await request.json());
}