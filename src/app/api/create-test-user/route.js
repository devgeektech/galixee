async function handler() {
  try {
    const email = "test@example.com";
    const password = "password123";

    console.log("Starting test user creation...");

    // First, delete any existing test user to start fresh
    console.log("Deleting existing test user...");

    // Get existing user ID first
    const existingUsers = await sql`
      SELECT u.id 
      FROM auth_users u
      WHERE u.email = ${email}
    `;

    if (existingUsers.length > 0) {
      const userId = existingUsers[0].id;

      // Delete from beta_users first (foreign key constraint)
      await sql`DELETE FROM beta_users WHERE user_id = ${userId}`;

      // Delete from auth_accounts
      await sql`DELETE FROM auth_accounts WHERE "userId" = ${userId}`;

      // Delete from auth_sessions
      await sql`DELETE FROM auth_sessions WHERE "userId" = ${userId}`;

      // Delete from auth_users
      await sql`DELETE FROM auth_users WHERE id = ${userId}`;

      console.log("Deleted existing test user");
    }

    console.log("Creating new test user...");

    // Create the user first
    const userResult = await sql`
      INSERT INTO auth_users (name, email, "emailVerified")
      VALUES (${"Test User"}, ${email}, ${new Date()})
      RETURNING id
    `;

    const userId = userResult[0].id;
    console.log("Created user with ID:", userId);

    // Hash the password using the same format as test-password-verification
    const crypto = require("crypto");
    const salt = crypto.randomBytes(32); // 32 bytes = 256 bits
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha256"); // 64 bytes = 512 bits
    const hashedPassword = salt.toString("hex") + ":" + hash.toString("hex"); // Use colon separator

    console.log("Password hash details:", {
      saltLength: salt.length,
      hashLength: hash.length,
      saltHex: salt.toString("hex").length,
      hashHex: hash.toString("hex").length,
      totalLength: hashedPassword.length,
      format: "salt:hash",
    });

    // Create the account record
    const accountResult = await sql`
      INSERT INTO auth_accounts ("userId", type, provider, "providerAccountId", password)
      VALUES (${userId}, ${"credentials"}, ${"credentials"}, ${email}, ${hashedPassword})
      RETURNING id
    `;

    console.log("Created credentials account:", accountResult[0].id);

    // Create beta user record
    await sql`
      INSERT INTO beta_users (user_id, beta_group, invited_at, is_active)
      VALUES (${userId}, ${"general"}, ${new Date()}, ${true})
    `;
    console.log("Created beta user record");

    return {
      success: true,
      message: "Test user created successfully (fresh)",
      userExists: false,
      credentials: {
        email: email,
        password: password,
      },
      user: {
        id: userId,
        name: name,
        email: email,
        emailVerified: new Date(),
        hasCredentialsAccount: true,
      },
      created: {
        user: true,
        account: true,
        betaUser: true,
      },
      passwordHash: {
        length: hashedPassword.length,
        format: "salt(64hex) + hash(128hex)",
        expected: 192,
      },
    };
  } catch (error) {
    console.error("Error creating test user:", error);
    return {
      success: false,
      error: error.message,
      details: error.stack,
      step: "unknown",
    };
  }
}
export async function POST(request) {
  return handler(await request.json());
}