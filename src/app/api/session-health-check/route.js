import sql from "@/db";
async function handler() {
  // Look up the most recent active session directly from the DB
  let session = null;
  try {
    const rows = await sql`
      SELECT 
        s."userId",
        s.expires,
        u.name,
        u.email,
        u.stripe_id,
        p.first_name,
        p.last_name,
        p.image
      FROM auth_sessions s
      JOIN auth_users u ON s."userId" = u.id
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE s.expires > NOW()
      ORDER BY s.expires DESC
      LIMIT 1
    `;

    if (rows.length > 0) {
      const r = rows[0];
      session = {
        user: {
          id: r.userId,
          email: r.email,
          name: r.name || `${r.first_name || ""} ${r.last_name || ""}`.trim() || null,
          image: r.image,
          stripe_id: r.stripe_id,
        },
        expires: r.expires,
      };
    }
  } catch (e) {
    // swallow and report in debug section below
  }

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
  const result = await handler();
  return Response.json(result);
}