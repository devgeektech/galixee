/**
 * Authentication Utilities
 * Provides reusable functions for protecting API routes
 * Supports both session tokens and JWT tokens
 */

import { NextResponse } from "next/server";
import getSession from "@/utilities/getSession";
import { verifyAccessToken } from "@/utilities/jwt-utils";

/**
 * Authenticates a request and returns the session
 * Throws error if unauthorized
 */
export async function requireAuth() {
  const session = await getSession();

  if (!session?.user?.id) {
    return null;
  }

  return session;
}

/**
 * Check JWT token from Authorization header
 * Returns decoded token if valid
 */
export function checkJWTToken(request) {
  const authHeader = request.headers.get("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  return verifyAccessToken(token);
}

/**
 * Middleware-like function to check authentication
 * Returns error response if not authenticated
 * Now supports both session tokens and JWT tokens
 */
export async function checkAuth(request = null) {
  // First, try JWT token from Authorization header
  if (request) {
    const jwtDecoded = checkJWTToken(request);
    if (jwtDecoded) {
      return {
        session: {
          user: {
            id: jwtDecoded.userId,
            email: jwtDecoded.email,
            name: jwtDecoded.name,
          },
        },
        error: null,
        tokenType: "jwt",
      };
    }
  }

  // Fall back to session token
  const session = await getSession();

  if (!session?.user?.id) {
    return {
      session: null,
      error: NextResponse.json(
        { error: "Unauthorized", code: "AUTH_REQUIRED" },
        { status: 401 }
      ),
      tokenType: null,
    };
  }

  return { session, error: null, tokenType: "session" };
}

/**
 * Protected route wrapper
 * Usage: const { session, error } = await checkAuth();
 *        if (error) return error;
 */
export function createUnauthorizedResponse(reason = "Unauthorized") {
  return NextResponse.json(
    {
      error: reason,
      code: "UNAUTHORIZED",
    },
    { status: 401 }
  );
}

/**
 * Forbidden response (authenticated but not allowed)
 */
export function createForbiddenResponse(reason = "Forbidden") {
  return NextResponse.json(
    {
      error: reason,
      code: "FORBIDDEN",
    },
    { status: 403 }
  );
}

/**
 * Bad request response
 */
export function createBadRequestResponse(reason = "Bad Request") {
  return NextResponse.json(
    {
      error: reason,
      code: "BAD_REQUEST",
    },
    { status: 400 }
  );
}

/**
 * Server error response
 */
export function createServerErrorResponse(reason = "Internal Server Error") {
  return NextResponse.json(
    {
      error: reason,
      code: "SERVER_ERROR",
    },
    { status: 500 }
  );
}
