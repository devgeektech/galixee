import { NextResponse } from "next/server";
import sql from "@/db";
import { verifyAccessToken } from "@/utilities/jwt-utils";

/**
 * WebView Authentication Endpoint
 * Validates both JWT tokens and session tokens via URL query parameter
 * 
 * Usage:
 * - JWT Token: /api/webview-auth?token=JWT_TOKEN
 * - Session Token: /api/webview-auth?token=SESSION_TOKEN
 * 
 * Returns user data and token type if valid
 */
async function handler({ token }) {
  if (!token) {
    return {
      error: "Token required",
      code: "TOKEN_MISSING",
    };
  }

  try {
    // First, try to verify as JWT token
    const jwtDecoded = verifyAccessToken(token);
    if (jwtDecoded) {
      console.log("WebView: JWT token validated for user", jwtDecoded.userId);
      return {
        success: true,
        tokenType: "jwt",
        user: {
          id: jwtDecoded.userId,
          email: jwtDecoded.email,
          name: jwtDecoded.name,
        },
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // JWT expires in 15 minutes
      };
    }

    // If JWT validation failed, try session token
   console.log("Incoming token:", token);

const sessions = await sql`
  SELECT s."userId", u.id, u.email, u.name, s.expires, s."sessionToken"
  FROM auth_sessions s
  JOIN auth_users u ON u.id = s."userId"
  WHERE s."sessionToken" = ${token}
  AND s.expires > NOW()
  LIMIT 1
`;

console.log("DB sessions result:", sessions);

    if (sessions.length === 0) {
      console.log("WebView: Token validation failed - no valid JWT or session token");
      return {
        error: "Invalid or expired token",
        code: "INVALID_TOKEN",
      };
    }

    const session = sessions[0];
    console.log("WebView: Session token validated for user", session.userId);

    return {
      success: true,
      tokenType: "session",
      user: {
        id: session.userId,
        email: session.email,
        name: session.name,
      },
      expiresAt: session.expires,
    };
  } catch (error) {
    console.error("WebView auth error:", error);
    return {
      error: "Authentication failed",
      code: "AUTH_ERROR",
    };
  }
}

/**
 * GET: Validate token from query parameters
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  const result = await handler({ token });

  if (result.error) {
    return NextResponse.json(result, {
      status: result.code === "TOKEN_MISSING" ? 400 : 401,
    });
  }

  return NextResponse.json(result);
}

/**
 * POST: Validate token from request body (alternative method)
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const result = await handler({ token: body.token });

    if (result.error) {
      return NextResponse.json(result, {
        status: result.code === "TOKEN_MISSING" ? 400 : 401,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("WebView POST auth error:", error);
    return NextResponse.json(
      {
        error: "Invalid request",
        code: "INVALID_REQUEST",
      },
      { status: 400 }
    );
  }
}
