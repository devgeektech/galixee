function handler() {
  const session = getSession();

  const healthCheck = {
    timestamp: new Date().toISOString(),
    sessionExists: !!session,
    sessionData: session
      ? {
          hasUser: !!session.user,
          userId: session.user?.id || null,
          userEmail: session.user?.email || null,
          userName: session.user?.name || null,
        }
      : null,
    environment: {
      nodeEnv: process.env.NODE_ENV || "unknown",
      hasSessionSecret: !!process.env.NEXTAUTH_SECRET,
      hasSessionUrl: !!process.env.NEXTAUTH_URL,
    },
    debug: {
      sessionType: typeof session,
      sessionKeys: session ? Object.keys(session) : [],
      userKeys: session?.user ? Object.keys(session.user) : [],
    },
  };

  return {
    status: session ? "healthy" : "no_session",
    ...healthCheck,
  };
}
export async function POST(request) {
  return handler(await request.json());
}