async function handler() {
  const testEmail = "test@example.com";
  const testPassword = "password123";

  try {
    // First ensure test user exists
    const ensureResponse = await fetch("/api/ensure-test-user", {
      method: "POST",
    });

    if (!ensureResponse.ok) {
      throw new Error("Failed to ensure test user exists");
    }

    const ensureResult = await ensureResponse.json();

    if (!ensureResult.success) {
      throw new Error(ensureResult.error || "Failed to create test user");
    }
    // Now authenticate using the credentials auth handler
    const authResponse = await fetch("/api/credentials-auth-handler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });
    
    if (!authResponse.ok) {
      throw new Error("Authentication request failed");
    }

    const authResult = await authResponse.json();

    if (!authResult.success) {
      throw new Error(authResult.error || "Authentication failed");
    }

    // Return success with session info
    return {
      success: true,
      sessionToken: authResult.sessionToken,
      user: authResult.user,
      expires: authResult.expires,
      message: "Auto sign-in successful",
    };
  } catch (error) {
    console.error("Auto sign-in error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
export async function POST(request) {
  return handler(await request.json());
}