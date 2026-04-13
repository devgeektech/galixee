import getSession from "@/utilities/getSession";
import sql from "@/db";
import { NextResponse } from "next/server";
import next from "next";
async function handler({ action, sessionData, userId, email }) {
  const session = await getSession();

  if (action === "validate") {
    // First try: use sessionToken from request body
    if (sessionData?.sessionToken) {
      try {
        // First, check if session exists (regardless of expiry)
        const allSessions = await sql`
          SELECT s."userId", s.expires, u.id, u.email, u.name, s."sessionToken"
          FROM auth_sessions s
          JOIN auth_users u ON s."userId" = u.id
          WHERE s."sessionToken" = ${sessionData.sessionToken}
        `;

        if (allSessions.length > 0) {
          const session = allSessions[0];
          const expiresDate = new Date(session.expires);
          const now = new Date();
          const isExpired = expiresDate < now;

          console.log("Session validation check:", {
            tokenProvided: sessionData.sessionToken.substring(0, 10) + "...",
            expiresDate: expiresDate.toISOString(),
            now: now.toISOString(),
            isExpired,
            expiresInSeconds: Math.floor((expiresDate - now) / 1000),
          });

          if (isExpired) {
            return NextResponse.json({
              valid: false,
              error: "Session expired",
              needsReauth: true,
              expiresDate: expiresDate.toISOString(),
              currentDate: now.toISOString(),
            });
          }

          // Session is valid
          return NextResponse.json({
            valid: true,
            user: {
              id: session.id,
              email: session.email,
              name: session.name,
            },
            sessionId: session.userId,
          });
        } else {
          // No session found with this token
          return NextResponse.json({
            valid: false,
            error: "Session not found in database",
            needsReauth: true,
            tokenSearched: sessionData.sessionToken.substring(0, 10) + "...",
          });
        }
      } catch (error) {
        console.error("Session validation database error:", error);
        return NextResponse.json({
          valid: false,
          error: "Database validation failed",
          details: error.message,
          needsReauth: true,
        });
      }
    }

    // Second try: use session from getSession() (cookie-based)
    if (!session || !session.user) {
      return NextResponse.json({ 
        valid: false,
        needsReauth: true,
        message: "No active session found",
      });
    }

    try {
      const user = await sql`
        SELECT id, email, name
        FROM auth_users 
        WHERE id = ${session.user.id}
      `;

      if (user.length === 0) {
        return NextResponse.json( {
          valid: false,
          needsReauth: true,
          message: "User not found in database",
        });
      }

      return NextResponse.json({
        valid: true,
        user: user[0],
        sessionId: session.user.id,
      });
    } catch (error) {
      return NextResponse.json({
        valid: false,
        error: "Database validation failed",
        needsReauth: true,
      });
    }
  }

  if (action === "persist") {
    if (!session || !session.user) {
      return NextResponse.json({
        success: false,
        message: "No session to persist",
      });
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

      return NextResponse.json({
        success: true,
        sessionToken,
        expiresAt: expiresAt.toISOString(),
        userId: session.user.id,
      });
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: "Failed to persist session",
      });
    }
  }

  if (action === "restore") {
    if (!sessionData || !sessionData.sessionToken) {
      return NextResponse.json({
        success: false,
        message: "No session data provided",
      });
    }

    try {
      const sessionRecord = await sql`
        SELECT s."userId", s.expires, u.id, u.email, u.name
        FROM auth_sessions s
        JOIN auth_users u ON s."userId" = u.id
        WHERE s."sessionToken" = ${sessionData.sessionToken}
        AND s.expires > NOW()
      `;

      if (sessionRecord.length === 0) {
        return NextResponse.json({
          success: false,
          message: "Session expired or not found",
          needsReauth: true,
        });
      }

      const user = sessionRecord[0];
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        sessionValid: true,
      });
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: "Failed to restore session",
      });
    }
  }

  if (action === "cleanup") {
    try {
      const deletedCount = await sql`
        DELETE FROM auth_sessions 
        WHERE expires < NOW()
      `;

      return NextResponse.json({
        success: true,
        cleanedSessions: deletedCount.length,
        message: "Expired sessions cleaned up",
      });
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: "Failed to cleanup sessions",
      });
    }
  }

  if (action === "sandbox_auth") {
    if (!userId && !email) {
      return NextResponse.json({
        success: false,
        message: "User ID or email required for sandbox authentication",
      });
    }

    try {
      let user;
      if (userId) {
        const result = await sql`
          SELECT id, email, name
          FROM auth_users 
          WHERE id = ${userId}
        `;
        user = result[0];
      } else {
        const result = await sql`
          SELECT id, email, name
          FROM auth_users 
          WHERE email = ${email}
        `;
        user = result[0];
      }

      if (!user) {
        return NextResponse.json({
          success: false,
          message: "User not found for sandbox authentication",
        });
      }

      const sessionToken =
        Math.random().toString(36).substring(2) + Date.now().toString(36);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await sql`
        INSERT INTO auth_sessions ("userId", expires, "sessionToken")
        VALUES (${user.id}, ${expiresAt}, ${sessionToken})
      `;

      return NextResponse.json({
        success: true,
        user,
        sessionToken,
        expiresAt: expiresAt.toISOString(),
        message: "Sandbox session created",
      });
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: "Failed to create sandbox session",
      });
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

      return NextResponse.json({
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
      });
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: "Health check failed",
      });
    }
  }

  return NextResponse.json({
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
  });
}
export async function POST(request) {
  return handler(await request.json());
}