import getSession from "@/utilities/getSession";
import { NextResponse } from "next/server";

async function handler({ action, session_id } = {}) {
  try {
    const session = await getSession();

    const debugInfo = {
      hasSession: !!session,
      sessionKeys: session ? Object.keys(session) : null,
      hasUser: !!session?.user,
      userKeys: session?.user ? Object.keys(session.user) : null,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      action,
      timestamp: new Date().toISOString(),
    };

      if (!session || !session.user) {
      return NextResponse.json({
        status: "none",
        message: "User not logged in",
        debug: debugInfo,
      });
    }

    if (!session.user.id && !session.user.email) {
      return NextResponse.json({
        status: "none",
        message: "User session incomplete",
        debug: debugInfo,
      });
    }

    return NextResponse.json({
      status: "active",
      message: "Subscription active (bypass mode)",
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
      bypass: true,
      debug: debugInfo,
    });
  } catch (error) {

    return NextResponse.json({
      status: "active",
      message: "Subscription active (bypass mode - error fallback)",
      bypass: true,
      error:
        process.env.NODE_ENV === "development" ? error.message : undefined,
      debug: {
        error: true,
        errorMessage: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

export async function POST(request) {
  let body = {};

  try {
    // Read the raw body safely to avoid JSON parse errors
    const text = await request.text();
    body = text ? JSON.parse(text) : {};
  } catch (err) {
    body = {};
  }

  // Pass the safely parsed body to handler
  return handler(body);
}
