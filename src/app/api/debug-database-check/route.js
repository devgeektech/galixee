async function handler() {
  const session = getSession();

  if (!session || !session.user) {
    return { error: "Not authenticated" };
  }

  try {
    const authUsers =
      await sql`SELECT id, name, email, subscription_status, stripe_id FROM auth_users ORDER BY id DESC LIMIT 10`;

    const authAccounts =
      await sql`SELECT id, "userId", type, provider, "providerAccountId" FROM auth_accounts ORDER BY id DESC LIMIT 10`;

    const betaUsers =
      await sql`SELECT id, user_id, beta_group, invited_at, first_login_at, is_active FROM beta_users ORDER BY id DESC LIMIT 10`;

    const userCount = await sql`SELECT COUNT(*) as count FROM auth_users`;
    const accountCount = await sql`SELECT COUNT(*) as count FROM auth_accounts`;
    const betaCount = await sql`SELECT COUNT(*) as count FROM beta_users`;

    const recentUsers = await sql`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.subscription_status,
        a.provider,
        a.type,
        b.beta_group,
        b.is_active as beta_active
      FROM auth_users u
      LEFT JOIN auth_accounts a ON u.id = a."userId"
      LEFT JOIN beta_users b ON u.id = b.user_id
      ORDER BY u.id DESC 
      LIMIT 5
    `;

    return {
      counts: {
        auth_users: userCount[0].count,
        auth_accounts: accountCount[0].count,
        beta_users: betaCount[0].count,
      },
      auth_users: authUsers,
      auth_accounts: authAccounts,
      beta_users: betaUsers,
      recent_users_with_details: recentUsers,
      current_session_user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
    };
  } catch (error) {
    return {
      error: "Database query failed",
      details: error.message,
    };
  }
}
export async function POST(request) {
  return handler(await request.json());
}