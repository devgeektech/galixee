async function handler() {
  try {
    const users =
      await sql`SELECT id, name, email, "emailVerified", image FROM auth_users ORDER BY id`;

    const accounts =
      await sql`SELECT id, "userId", type, provider, "providerAccountId" FROM auth_accounts ORDER BY "userId"`;

    const sessions =
      await sql`SELECT id, "userId", expires, "sessionToken" FROM auth_sessions WHERE expires > NOW() ORDER BY "userId"`;

    return {
      success: true,
      data: {
        users: users,
        accounts: accounts,
        activeSessions: sessions,
        userCount: users.length,
        accountCount: accounts.length,
        activeSessionCount: sessions.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
export async function POST(request) {
  return handler(await request.json());
}