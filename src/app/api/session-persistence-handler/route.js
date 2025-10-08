async function handler({ action, sessionData, userId, email }) {
  const session = getSession();

  if (action === "validate") {
    if (!session || !session.user) {
      return {
        valid: false,
        needsReauth: true,
        message: "No active session found",
      };
    }

    try {
      const user = await sql`
        SELECT id, email, name, subscription_status 
        FROM auth_users 
        WHERE id = ${session.user.id}
      `;

      if (user.length === 0) {
        return {
          valid: false,
          needsReauth: true,
          message: "User not found in database",
        };
      }

      return {
        valid: true,
        user: user[0],
        sessionId: session.user.id,
      };
    } catch (error) {
      return {
        valid: false,
        error: "Database validation failed",
        needsReauth: true,
      };
    }
  }

  if (action === "persist") {
    if (!session || !session.user) {
      return {
        success: false,
        message: "No session to persist",
      };
    }

    try {
      const sessionToken =
        Math.random().toString(36).substring(2) + Date.now().toString(36);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await sql`
        INSERT INTO auth_sessions ("userId", expires, "sessionToken")
        VALUES (${session.user.id}, ${expiresAt}, ${sessionToken})
        ON CONFLICT ("sessionToken") DO UPDATE SET
        expires = EXCLUDED.expires
      `;

      return {
        success: true,
        sessionToken,
        expiresAt: expiresAt.toISOString(),
        userId: session.user.id,
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to persist session",
      };
    }
  }

  if (action === "restore") {
    if (!sessionData || !sessionData.sessionToken) {
      return {
        success: false,
        message: "No session data provided",
      };
    }

    try {
      const sessionRecord = await sql`
        SELECT s."userId", s.expires, u.email, u.name, u.subscription_status
        FROM auth_sessions s
        JOIN auth_users u ON s."userId" = u.id
        WHERE s."sessionToken" = ${sessionData.sessionToken}
        AND s.expires > NOW()
      `;

      if (sessionRecord.length === 0) {
        return {
          success: false,
          message: "Session expired or not found",
          needsReauth: true,
        };
      }

      const user = sessionRecord[0];
      return {
        success: true,
        user: {
          id: user.userId,
          email: user.email,
          name: user.name,
          subscription_status: user.subscription_status,
        },
        sessionValid: true,
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to restore session",
      };
    }
  }

  if (action === "cleanup") {
    try {
      const deletedCount = await sql`
        DELETE FROM auth_sessions 
        WHERE expires < NOW()
      `;

      return {
        success: true,
        cleanedSessions: deletedCount.length,
        message: "Expired sessions cleaned up",
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to cleanup sessions",
      };
    }
  }

  if (action === "sandbox_auth") {
    if (!userId && !email) {
      return {
        success: false,
        message: "User ID or email required for sandbox authentication",
      };
    }

    try {
      let user;
      if (userId) {
        const result = await sql`
          SELECT id, email, name, subscription_status 
          FROM auth_users 
          WHERE id = ${userId}
        `;
        user = result[0];
      } else {
        const result = await sql`
          SELECT id, email, name, subscription_status 
          FROM auth_users 
          WHERE email = ${email}
        `;
        user = result[0];
      }

      if (!user) {
        return {
          success: false,
          message: "User not found for sandbox authentication",
        };
      }

      const sessionToken =
        Math.random().toString(36).substring(2) + Date.now().toString(36);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await sql`
        INSERT INTO auth_sessions ("userId", expires, "sessionToken")
        VALUES (${user.id}, ${expiresAt}, ${sessionToken})
      `;

      return {
        success: true,
        user,
        sessionToken,
        expiresAt: expiresAt.toISOString(),
        message: "Sandbox session created",
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to create sandbox session",
      };
    }
  }

  if (action === "health_check") {
    try {
      const activeSessionsCount = await sql`
        SELECT COUNT(*) as count 
        FROM auth_sessions 
        WHERE expires > NOW()
      `;

      const totalUsersCount = await sql`
        SELECT COUNT(*) as count 
        FROM auth_users
      `;

      return {
        success: true,
        activeSessions: parseInt(activeSessionsCount[0].count),
        totalUsers: parseInt(totalUsersCount[0].count),
        currentSession: session
          ? {
              userId: session.user?.id,
              email: session.user?.email,
              valid: true,
            }
          : null,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: "Health check failed",
      };
    }
  }

  return {
    success: false,
    message: "Invalid action specified",
    availableActions: [
      "validate",
      "persist",
      "restore",
      "cleanup",
      "sandbox_auth",
      "health_check",
    ],
  };
}
export async function POST(request) {
  return handler(await request.json());
}