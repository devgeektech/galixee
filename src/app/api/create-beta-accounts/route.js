async function handler() {
  const session = getSession();

  if (!session || !session.user) {
    return { error: "Authentication required" };
  }

  const adminEmails = [
    "admin@galixee.com",
    "test@galixee.com",
    "beta@galixee.com",
  ];
  if (!adminEmails.includes(session.user.email)) {
    return { error: "Admin access required" };
  }

  const betaAccounts = [
    { email: "beta1@test.com", password: "BetaTest123!", name: "Beta User 1" },
    { email: "beta2@test.com", password: "BetaTest123!", name: "Beta User 2" },
    { email: "beta3@test.com", password: "BetaTest123!", name: "Beta User 3" },
    { email: "beta4@test.com", password: "BetaTest123!", name: "Beta User 4" },
    { email: "beta5@test.com", password: "BetaTest123!", name: "Beta User 5" },
    { email: "beta6@test.com", password: "BetaTest123!", name: "Beta User 6" },
    { email: "beta7@test.com", password: "BetaTest123!", name: "Beta User 7" },
    { email: "beta8@test.com", password: "BetaTest123!", name: "Beta User 8" },
    { email: "beta9@test.com", password: "BetaTest123!", name: "Beta User 9" },
    {
      email: "beta10@test.com",
      password: "BetaTest123!",
      name: "Beta User 10",
    },
    {
      email: "beta11@test.com",
      password: "BetaTest123!",
      name: "Beta User 11",
    },
    {
      email: "beta12@test.com",
      password: "BetaTest123!",
      name: "Beta User 12",
    },
    {
      email: "beta13@test.com",
      password: "BetaTest123!",
      name: "Beta User 13",
    },
    {
      email: "beta14@test.com",
      password: "BetaTest123!",
      name: "Beta User 14",
    },
    {
      email: "beta15@test.com",
      password: "BetaTest123!",
      name: "Beta User 15",
    },
    {
      email: "beta16@test.com",
      password: "BetaTest123!",
      name: "Beta User 16",
    },
    {
      email: "beta17@test.com",
      password: "BetaTest123!",
      name: "Beta User 17",
    },
    {
      email: "beta18@test.com",
      password: "BetaTest123!",
      name: "Beta User 18",
    },
    {
      email: "beta19@test.com",
      password: "BetaTest123!",
      name: "Beta User 19",
    },
    {
      email: "beta20@test.com",
      password: "BetaTest123!",
      name: "Beta User 20",
    },
  ];

  const createdAccounts = [];
  const errors = [];

  for (const account of betaAccounts) {
    try {
      const existingUser = await sql`
        SELECT id FROM auth_users WHERE email = ${account.email}
      `;

      if (existingUser.length > 0) {
        errors.push(`Account ${account.email} already exists`);
        continue;
      }

      const userResult = await sql`
        INSERT INTO auth_users (name, email, "emailVerified")
        VALUES (${account.name}, ${account.email}, NOW())
        RETURNING id
      `;

      const userId = userResult[0].id;

      await sql`
        INSERT INTO auth_accounts ("userId", type, provider, "providerAccountId", password)
        VALUES (${userId}, 'credentials', 'credentials', ${account.email}, ${account.password})
      `;

      await sql`
        INSERT INTO beta_users (user_id, beta_group, invited_at, is_active, notes)
        VALUES (${userId}, 'testing', NOW(), true, 'Auto-generated beta test account')
      `;

      createdAccounts.push({
        id: userId,
        email: account.email,
        name: account.name,
      });
    } catch (error) {
      errors.push(`Failed to create ${account.email}: ${error.message}`);
    }
  }

  return {
    success: true,
    created: createdAccounts.length,
    accounts: createdAccounts,
    errors: errors.length > 0 ? errors : undefined,
    message: `Successfully created ${createdAccounts.length} beta test accounts`,
  };
}
export async function POST(request) {
  return handler(await request.json());
}