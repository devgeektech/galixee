async function handler({ sessionToken, userId }) {
  if (!sessionToken && !userId) {
    return { error: "Missing sessionToken or userId" };
  }

  try {
    let session;

    if (sessionToken) {
      session = await sql`
        SELECT s.*, u.id as user_id, u.name, u.email, u.image 
        FROM auth_sessions s
        JOIN auth_users u ON s."userId" = u.id
        WHERE s."sessionToken" = ${sessionToken}
        AND s.expires > NOW()
      `;
    } else if (userId) {
      session = await sql`
        SELECT s.*, u.id as user_id, u.name, u.email, u.image 
        FROM auth_sessions s
        JOIN auth_users u ON s."userId" = u.id
        WHERE u.id = ${userId}
        AND s.expires > NOW()
        ORDER BY s.expires DESC
        LIMIT 1
      `;
    }

    if (!session || session.length === 0) {
      return { error: "No valid session found" };
    }

    const sessionData = session[0];

    return {
      success: true,
      session: {
        user: {
          id: sessionData.user_id,
          name: sessionData.name,
          email: sessionData.email,
          image: sessionData.image,
        },
        sessionToken: sessionData.sessionToken,
        expires: sessionData.expires,
      },
      headers: {
        "Set-Cookie": `next-auth.session-token=${sessionData.sessionToken}; Path=/; HttpOnly; SameSite=Lax; Secure`,
      },
    };
  } catch (error) {
    return {
      error: "Database error",
      details: error.message,
    };
  }
}
export async function POST(request) {
  return handler(await request.json());
}