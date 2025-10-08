import sql from "@/db";
import { randomUUID } from "crypto";

async function handler({ email, forceRepair }) {
  // Try to derive a current session from DB (latest active), since getSession() isn't available here
  let currentSession = null;
  try {
    const rows = await sql`
      SELECT 
        s."userId",
        s.expires,
        u.name,
        u.email
      FROM auth_sessions s
      JOIN auth_users u ON s."userId" = u.id
      WHERE s.expires > NOW()
      ORDER BY s.expires DESC
      LIMIT 1
    `;
    if (rows.length > 0) {
      const r = rows[0];
      currentSession = {
        user: {
          id: r.userId,
          email: r.email,
          name: r.name,
        },
        expires: r.expires,
      };
    }
  } catch (e) {
    // ignore; we'll proceed without a current session
  }

  const diagnostics = {
    timestamp: new Date().toISOString(),
    sessionExists: !!currentSession,
    sessionUser: currentSession?.user || null,
    requestedEmail: email || null,
    forceRepair: !!forceRepair,
  };

  // If we have a working session and not forcing repair, return success
  if (currentSession?.user && !forceRepair) {
    return {
      success: true,
      action: "session_already_valid",
      user: currentSession.user,
      message: "Session is already working",
      diagnostics,
    };
  }

  // If no session and no email provided, can't help
  if (!currentSession && !email) {
    return {
      success: false,
      error: "No session found and no email provided for repair",
      action: "redirect_to_login",
      diagnostics,
    };
  }

  try {
    let targetUser = null;

    // If we have a session, use that user
    if (currentSession?.user?.id) {
      const userCheck = await sql`
        SELECT id, email, name 
        FROM auth_users 
        WHERE id = ${currentSession.user.id}
      `;

      if (userCheck.length > 0) {
        targetUser = { ...userCheck[0], subscription_status: null };
        diagnostics.userFoundById = true;
      }
    }

    // If no user found by session but email provided, try email lookup
    if (!targetUser && email) {
      const userByEmail = await sql`
        SELECT id, email, name 
        FROM auth_users 
        WHERE email = ${email}
      `;

      if (userByEmail.length > 0) {
        targetUser = { ...userByEmail[0], subscription_status: null };
        diagnostics.userFoundByEmail = true;
      }
    }

    if (!targetUser) {
      return {
        success: false,
        error: "User not found in database",
        action: "redirect_to_login",
        diagnostics,
      };
    }

    // Check existing sessions for this user
    const existingSessions = await sql`
      SELECT id, "sessionToken", expires, "userId"
      FROM auth_sessions 
      WHERE "userId" = ${targetUser.id}
      AND expires > NOW()
      ORDER BY expires DESC
    `;

    diagnostics.existingSessionsCount = existingSessions.length;

    // Clean up old sessions if too many
    if (existingSessions.length > 3) {
      const sessionsToDelete = existingSessions.slice(3);
      const tokensToDelete = sessionsToDelete.map((s) => s.sessionToken);

      await sql`
        DELETE FROM auth_sessions 
        WHERE "sessionToken" = ANY(${tokensToDelete})
      `;

      diagnostics.cleanedOldSessions = sessionsToDelete.length;
    }

    // Create a new session regardless (this ensures fresh session)
    const newSessionToken = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await sql`
      INSERT INTO auth_sessions ("userId", "sessionToken", expires)
      VALUES (${targetUser.id}, ${newSessionToken}, ${expiresAt})
    `;

    diagnostics.newSessionCreated = true;
    diagnostics.newSessionToken = newSessionToken.substring(0, 8) + "...";

    // The key insight: we need to tell the user to refresh the page
    // because session retrieval is server-side and will pick up
    // the new session on the next page load
    return {
      success: true,
      action: "session_repaired_refresh_needed",
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        subscription_status: targetUser.subscription_status ?? null,
      },
      sessionToken: newSessionToken,
      expires: expiresAt.toISOString(),
      message:
        "Session successfully repaired. Page refresh needed to activate.",
      refreshRequired: true,
      diagnostics,
    };
  } catch (error) {
    diagnostics.error = error.message;

    return {
      success: false,
      error: "Database error during session repair",
      details: error.message,
      action: "retry_later",
    };
  }
}
export async function POST(request) {
  let body = {};
  try {
    const text = await request.text();
    body = text ? JSON.parse(text) : {};
  } catch (e) {
    // ignore malformed/empty JSON; proceed with defaults
  }
  const result = await handler(body);
  return Response.json(result || {});
}