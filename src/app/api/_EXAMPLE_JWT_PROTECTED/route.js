/**
 * Example API Route with JWT Token Support
 * Shows how to update existing protected routes to accept JWT tokens
 * 
 * Features:
 * - Accepts both session tokens (from cookies) and JWT tokens (from Authorization header)
 * - Works with the new token-based WebView authentication
 * - Backwards compatible with existing session-based auth
 * 
 * Usage:
 * - Traditional: /api/example (with session cookie)
 * - WebView: /api/example (with Authorization: Bearer JWT_TOKEN)
 */

import { NextResponse } from "next/server";
import { checkAuth } from "@/utilities/auth";

async function handler({ userId, action, data }) {
  // Your handler logic here
  return {
    success: true,
    message: "Operation completed",
    userId,
    action,
  };
}

export async function GET(request) {
  // Check authentication (supports both session + JWT tokens)
  const { session, error, tokenType } = await checkAuth(request);

  if (error) {
    return error; // Returns 401 Unauthorized
  }

  console.log(`✅ Authenticated with ${tokenType} token`);
  console.log(`   User ID: ${session.user.id}`);

  // Your GET logic here
  const result = await handler({
    userId: session.user.id,
    action: "get",
  });

  return NextResponse.json(result);
}

export async function POST(request) {
  // Check authentication
  const { session, error, tokenType } = await checkAuth(request);

  if (error) {
    return error;
  }

  try {
    const body = await request.json();

    const result = await handler({
      userId: session.user.id,
      action: body.action,
      data: body.data,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Handler error:", error);
    return NextResponse.json(
      { error: "Request failed" },
      { status: 400 }
    );
  }
}
