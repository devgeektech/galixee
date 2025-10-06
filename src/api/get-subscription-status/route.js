async function handler({ action, session_id }) {
  try {
    const session = getSession();

    // Enhanced debugging with the session structure we now know works
    const debugInfo = {
      hasSession: !!session,
      sessionKeys: session ? Object.keys(session) : null,
      hasUser: !!session?.user,
      userKeys: session?.user ? Object.keys(session.user) : null,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      action: action,
      timestamp: new Date().toISOString(),
    };

    console.log("=== SUBSCRIPTION STATUS DEBUG ===");
    console.log("Session debug info:", JSON.stringify(debugInfo, null, 2));

    // Check if we have a session with user data
    if (!session || !session.user) {
      console.log("❌ No session or user found");
      return {
        status: "none",
        message: "User not logged in",
        debug: debugInfo,
      };
    }

    // Check if we have user identification (ID or email)
    if (!session.user.id && !session.user.email) {
      console.log("❌ No user ID or email in session");
      return {
        status: "none",
        message: "User session incomplete",
        debug: debugInfo,
      };
    }

    // SUCCESS: We have a valid session with user data
    console.log(
      "✅ Valid session found for user:",
      session.user.email || `ID: ${session.user.id}`
    );

    // BYPASS MODE: Return active subscription for all authenticated users
    console.log("🔄 BYPASS MODE: Returning active subscription");
    return {
      status: "active",
      message: "Subscription active (bypass mode)",
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
      bypass: true,
      debug: debugInfo,
    };
  } catch (error) {
    console.error("❌ Error in subscription check:", error);

    // Even on error, try to return something useful
    return {
      status: "active", // Bypass mode - always active
      message: "Subscription active (bypass mode - error fallback)",
      bypass: true,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      debug: {
        error: true,
        errorMessage: error.message,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

<div className="text-center space-y-4">
  <p className="text-sm text-gray-500">
    Don't have an account?{" "}
    <a
      href={`/account/signup${
        typeof window !== "undefined" ? window.location.search : ""
      }`}
      className="text-[#6366F1] hover:text-[#4F46E5]"
    >
      Sign up for $4.99
    </a>
  </p>

  {/* Debug: Create test user button */}
  <button
    type="button"
    onClick={async () => {
      try {
        const response = await fetch("/api/create-test-user", {
          method: "POST",
        });
        const result = await response.json();
        console.log("Test user creation result:", result);
        if (result.success) {
          alert(
            "Test user created! You can now sign in with test@example.com / password123"
          );
        } else {
          alert("Error creating test user: " + result.details);
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Error creating test user");
      }
    }}
    className="text-xs text-gray-400 hover:text-gray-300 underline"
  >
    🔧 Create test user (debug)
  </button>
</div>;
export async function POST(request) {
  return handler(await request.json());
}