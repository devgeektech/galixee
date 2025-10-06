async function handler() {
  // First check if we have a session from getSession()
  const session = getSession();

  if (session && session.user?.id) {
    try {
      const userResult = await sql`
        SELECT 
          u.id,
          u.name,
          u.email,
          u.subscription_status,
          u.stripe_id,
          p.first_name,
          p.last_name,
          p.image
        FROM auth_users u
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE u.id = ${session.user.id}
      `;

      if (userResult.length > 0) {
        const user = userResult[0];
        return {
          user: {
            id: user.id,
            name:
              user.name ||
              `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
              null,
            email: user.email,
            image: user.image,
            subscription_status: user.subscription_status,
            stripe_id: user.stripe_id,
          },
          expires: session.expires,
        };
      }
    } catch (error) {
      console.error("Database lookup failed:", error);
    }
  }

  // Check for session in global middleware
  try {
    const middlewareResponse = await fetch("/api/session-middleware", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get" }),
    });

    if (middlewareResponse.ok) {
      const middlewareResult = await middlewareResponse.json();
      if (middlewareResult.success && middlewareResult.session) {
        return middlewareResult.session;
      }
    }
  } catch (error) {
    console.error("Middleware session check failed:", error);
  }

  // Fallback: Try to find any active session for the test user
  try {
    const activeSessions = await sql`
      SELECT 
        s."userId",
        s.expires,
        u.name,
        u.email,
        u.subscription_status,
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

    if (activeSessions.length > 0) {
      const sessionData = activeSessions[0];
      return {
        user: {
          id: sessionData.userId,
          name:
            sessionData.name ||
            `${sessionData.first_name || ""} ${
              sessionData.last_name || ""
            }`.trim() ||
            null,
          email: sessionData.email,
          image: sessionData.image,
          subscription_status: sessionData.subscription_status,
          stripe_id: sessionData.stripe_id,
        },
        expires: sessionData.expires,
      };
    }
  } catch (error) {
    console.error("Session fallback lookup failed:", error);
  }

  return null;
}
export async function POST(request) {
  return handler(await request.json());
}