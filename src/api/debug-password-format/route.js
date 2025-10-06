async function handler() {
  try {
    const testUsers = await sql`
      SELECT 
        id,
        email,
        name,
        password
      FROM auth_accounts 
      WHERE provider = 'credentials' 
      AND "providerAccountId" LIKE '%test%'
      ORDER BY id DESC
      LIMIT 5
    `;

    if (testUsers.length === 0) {
      return {
        message: "No test users found",
        searchCriteria:
          "Looking for credentials provider with 'test' in providerAccountId",
      };
    }

    const passwordAnalysis = testUsers.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      passwordExists: !!user.password,
      passwordLength: user.password ? user.password.length : 0,
      passwordPrefix: user.password
        ? user.password.substring(0, 10) + "..."
        : null,
      isBcryptHash: user.password ? user.password.startsWith("$2") : false,
      isArgon2Hash: user.password ? user.password.startsWith("$argon2") : false,
      isPlainText: user.password ? !user.password.startsWith("$") : false,
    }));

    return {
      message: "Password format analysis for test users",
      userCount: testUsers.length,
      users: passwordAnalysis,
    };
  } catch (error) {
    return {
      error: "Failed to check password format",
      details: error.message,
    };
  }
}
export async function POST(request) {
  return handler(await request.json());
}