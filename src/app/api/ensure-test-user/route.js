async function handler() {
  const testEmail = "test@example.com";
  const testPassword = "password123";

  try {
    // Check if test user already exists
    const existingUser = await sql`
      SELECT u.id, u.name, u.email, a.password
      FROM auth_users u
      LEFT JOIN auth_accounts a ON u.id = a."userId" AND a.provider = 'credentials'
      WHERE u.email = ${testEmail}
    `;

    if (existingUser.length > 0 && existingUser[0].password) {
      return {
        success: true,
        message: "Test user already exists with credentials",
        user: {
          id: existingUser[0].id,
          name: existingUser[0].name,
          email: existingUser[0].email,
        },
        hasCredentials: true,
      };
    }

    let userId;

    if (existingUser.length > 0) {
      // User exists but no credentials
      userId = existingUser[0].id;
    } else {
      // Create new user
      const newUserResult = await sql`
        INSERT INTO auth_users (name, email, "emailVerified")
        VALUES ('Test User', ${testEmail}, NOW())
        RETURNING id, name, email
      `;
      userId = newUserResult[0].id;
    }

    // Create password hash using the same method as signup
    const crypto = require("crypto");
    const salt = crypto.randomBytes(32);
    const hash = crypto.pbkdf2Sync(testPassword, salt, 100000, 64, "sha256");
    const hashedPassword = salt.toString("hex") + ":" + hash.toString("hex");

    // Create or update credentials account
    await sql`
      INSERT INTO auth_accounts (
        "userId", 
        type, 
        provider, 
        "providerAccountId", 
        password
      )
      VALUES (
        ${userId}, 
        'credentials', 
        'credentials', 
        ${testEmail}, 
        ${hashedPassword}
      )
      ON CONFLICT ("provider", "providerAccountId")
      DO UPDATE SET password = EXCLUDED.password
    `;

    // Get the final user data
    const finalUser = await sql`
      SELECT id, name, email FROM auth_users WHERE id = ${userId}
    `;

    return {
      success: true,
      message: "Test user created/updated successfully",
      user: finalUser[0],
      credentials: {
        email: testEmail,
        password: testPassword,
      },
      created: true,
    };
  } catch (error) {
    console.error("Error ensuring test user:", error);
    return {
      success: false,
      error: "Failed to ensure test user exists",
      step: "database_operation",
    };
  }
}
export async function POST(request) {
  let body = {};
  try {
    const text = await request.text();
    body = text ? JSON.parse(text) : {};
  } catch (e) {
    // ignore malformed/empty JSON
  }
  const result = await handler(body);
  return Response.json(result || {});
}