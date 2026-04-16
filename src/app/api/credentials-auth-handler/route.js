import sql from '@/db';
import { NextResponse } from "next/server";
import { generateAccessToken, generateRefreshToken } from "@/utilities/jwt-utils";
const crypto = require("crypto");


async function handler({ email, password }) {
  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    // Get the user account with credentials provider
    const accounts = await sql`
      SELECT a.id as account_id, a."userId", a.password, u.id, u.name, u.email 
      FROM auth_accounts a
      JOIN auth_users u ON a."userId" = u.id
      WHERE a.provider = 'credentials' AND a."providerAccountId" = ${email}
    `;
    if (accounts.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const account = accounts[0];

    if (!account.password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Verify password using the same method as test-password-verification
    const storedPassword = account.password;

    // Check if password uses colon format (salt:hash) or old format (salthash)
    let storedSalt, storedHash;

    if (storedPassword.includes(":")) {
      // New format: salt:hash
      const parts = storedPassword.split(":");
      if (parts.length !== 2) {
        return NextResponse.json({ error: "Invalid password format" }, { status: 500 });
      }
      storedSalt = parts[0];
      storedHash = parts[1];

      // Validate lengths
      if (storedSalt.length !== 64 || storedHash.length !== 128) {
        return  NextResponse.json({ error: "Invalid password format" }, { status: 500 });
      }
    } else {
      // Old format: concatenated salt + hash
      if (storedPassword.length !== 192) {
        return  NextResponse.json({ error: "Invalid password format" }, { status: 500 });
      }
      storedSalt = storedPassword.substring(0, 64);
      storedHash = storedPassword.substring(64);
    }

    // Convert salt from hex to buffer
    const saltBuffer = Buffer.from(storedSalt, "hex");

    // Compute hash for provided password
    const computedHash = crypto.pbkdf2Sync(
      password,
      saltBuffer,
      100000,
      64,
      "sha256"
    );
    const computedHashHex = computedHash.toString("hex");

    // Compare hashes
    const isValidPassword = computedHashHex === storedHash;
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid Password credentials11" }, { status: 401 });
    }

    // Clean up old sessions for this user
   await sql`
  DELETE FROM auth_sessions 
  WHERE "userId" = ${account.userId}
  AND expires < NOW()
`;


    // Also delete any other existing sessions for this user to avoid conflicts
    // (only one active session per user)
    await sql`
      
  DELETE FROM auth_sessions 
  WHERE "userId" = ${account.userId}
  

      
    `;

    // Create new session with proper format
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const sessionLifetimeSeconds = 30 * 24 * 60 * 60;
    const sessionLifetimeMinutes = Math.floor(sessionLifetimeSeconds / 60);

    // Use the database clock for expiry because auth_sessions.expires is a TIMESTAMP column.
    const insertedSessions = await sql`
      INSERT INTO auth_sessions ("userId", expires, "sessionToken")
      VALUES (
        ${account.userId},
        NOW() + (${sessionLifetimeMinutes} * INTERVAL '1 minute'),
        ${sessionToken}
      )
      RETURNING expires
    `;
    const expiresISO =
      insertedSessions[0]?.expires instanceof Date
        ? insertedSessions[0].expires.toISOString()
        : new Date(Date.now() + sessionLifetimeSeconds * 1000).toISOString();

    // Verify the session was created
    const sessionCheck = await sql` 
      SELECT s."userId", s.expires, s."sessionToken", u.id, u.name, u.email
      FROM auth_sessions s
      JOIN auth_users u ON s."userId" = u.id
      WHERE s."sessionToken" = ${sessionToken}
    `;

    if (sessionCheck.length === 0) {
           return NextResponse.json({ error: "Failed to create session" }, { status: 500 });

    }

    const sessionData = sessionCheck[0];

    // Generate JWT tokens for mobile
    const accessToken = generateAccessToken(sessionData.id, sessionData.email, sessionData.name);
    const refreshToken = generateRefreshToken(sessionData.id, sessionData.email);

    // Store session in a global variable that getSession() can access
    global.currentSession = {
      user: {
        id: sessionData.id,
        name: sessionData.name,
        email: sessionData.email,
        // image: sessionData.image,
      },
      sessionToken,
      expires: expiresISO,
    };

    const response = NextResponse.json({
      success: true,
      user: {
        id: sessionData.id,
        name: sessionData.name,
        email: sessionData.email,
      },
      // Session-based (for web/browser)
      sessionToken,
      expires: expiresISO,
      sessionCreated: true,
      userId: account.userId,
      // JWT tokens (for mobile)
      accessToken,
      refreshToken,
      tokenType: "Bearer",
      sessionData: {
        user: {
          id: sessionData.id,
          name: sessionData.name,
          email: sessionData.email,
        },
        sessionToken,
        expires: expiresISO,
      },
    });

    // Clear old cookies first to prevent cross-profile contamination
    response.cookies.delete("galixee_session_token");
    response.cookies.delete("sessionToken");
    response.cookies.delete("session_expires");

    // Set session token as HTTP-only cookie for middleware to read
    response.cookies.set("galixee_session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      // maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
      maxAge: sessionLifetimeSeconds,
      // maxAge: 29 * 24 * 60 * 60, 
      path: "/",
    });
    response.cookies.set("session_expires", expiresISO, {
  httpOnly: false,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: sessionLifetimeSeconds,
  // maxAge: 29 * 24 * 60 * 60, 
  path: "/",
});

    // Also set a non-httpOnly cookie for client-side access
    response.cookies.set("sessionToken", sessionToken, {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      // maxAge: 30 * 24 * 60 * 60,
       maxAge: sessionLifetimeSeconds,
      // maxAge: 29 * 24 * 60 * 60, 
      path: "/",
    });

    return response;

  } catch (error) {
    console.error("Authentication error:", error);
    return NextResponse.json({ error: "Authentication failed", details: error.message }, { status: 500 });
  }
}
export async function POST(request) {
  return handler(await request.json());
}
