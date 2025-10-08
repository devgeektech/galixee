async function handler({ email, password, callbackUrl }) {
  if (!email || !password) {
    return {
      error: "Email and password are required",
    };
  }

  try {
    const users = await sql`
      SELECT u.id, u.email, u.name, a.password 
      FROM auth_users u
      JOIN auth_accounts a ON u.id = a."userId"
      WHERE u.email = ${email} AND a.provider = 'credentials'
    `;

    if (users.length === 0) {
      return {
        error: "Invalid email or password",
      };
    }

    const user = users[0];

    if (user.password !== password) {
      return {
        error: "Invalid email or password",
      };
    }

    const sessionToken =
      Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);

    await sql`
      INSERT INTO auth_sessions ("userId", expires, "sessionToken")
      VALUES (${user.id}, ${expires.toISOString()}, ${sessionToken})
    `;

    const redirectUrl = callbackUrl || "/welcome";

    return {
      success: true,
      sessionToken,
      expires: expires.toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      redirectUrl,
    };
  } catch (error) {
    console.error("Sign in error:", error);
    return {
      error: "Authentication failed",
    };
  }
}
export async function POST(request) {
  return handler(await request.json());
}