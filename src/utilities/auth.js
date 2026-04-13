/**
 * Authentication Utilities
 * Provides reusable functions for protecting API routes
 */

import { NextResponse } from "next/server";
import getSession from "@/utilities/getSession";

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
 * Middleware-like function to check authentication
 * Returns error response if not authenticated
 */
export async function checkAuth() {
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", code: "AUTH_REQUIRED" },
      { status: 401 }
    );
  }

  return { session, error: null };
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
