async function handler() {
  try {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = "TestPassword123!";
    const testName = "Test User";

    console.log("Starting signup debug process...");
    console.log("Test credentials:", { email: testEmail, name: testName });

    const existingUser = await sql`
      SELECT id, email, name FROM auth_users 
      WHERE email = ${testEmail}
    `;

    console.log("Existing user check:", existingUser);

    if (existingUser.length > 0) {
      return {
        status: "user_exists",
        message: "User already exists",
        user: existingUser[0],
      };
    }

    const newUser = await sql`
      INSERT INTO auth_users (email, name, "emailVerified")
      VALUES (${testEmail}, ${testName}, NOW())
      RETURNING id, email, name, "emailVerified"
    `;

    console.log("New user created:", newUser);

    const accountResult = await sql`
      INSERT INTO auth_accounts ("userId", type, provider, "providerAccountId", password)
      VALUES (${newUser[0].id}, 'credentials', 'credentials', ${testEmail}, ${testPassword})
      RETURNING id, "userId", provider
    `;

    console.log("Account created:", accountResult);

    const profileResult = await sql`
      INSERT INTO user_profiles (user_id, first_name)
      VALUES (${newUser[0].id}, ${testName})
      RETURNING id, user_id, first_name
    `;

    console.log("Profile created:", profileResult);

    return {
      status: "success",
      message: "Signup process completed successfully",
      user: newUser[0],
      account: accountResult[0],
      profile: profileResult[0],
      testCredentials: {
        email: testEmail,
        password: testPassword,
      },
    };
  } catch (error) {
    console.error("Signup debug error:", error);

    return {
      status: "error",
      message: error.message,
      stack: error.stack,
      details: {
        name: error.name,
        code: error.code,
      },
    };
  }
}
export async function POST(request) {
  return handler(await request.json());
}