async function handler() {
  const session = getSession();

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const existingBetaUsers =
      await sql`SELECT COUNT(*) as count FROM beta_users`;

    if (existingBetaUsers[0].count > 0) {
      return { message: "Beta users already exist, skipping seed" };
    }

    const testUsers = [
      {
        name: "Alice Johnson",
        email: "alice.test@example.com",
        beta_group: "early_access",
      },
      {
        name: "Bob Smith",
        email: "bob.test@example.com",
        beta_group: "general",
      },
      {
        name: "Carol Davis",
        email: "carol.test@example.com",
        beta_group: "power_user",
      },
      {
        name: "David Wilson",
        email: "david.test@example.com",
        beta_group: "general",
      },
    ];

    const createdUsers = [];

    for (const userData of testUsers) {
      const [user] = await sql`
        INSERT INTO auth_users (name, email, "emailVerified")
        VALUES (${userData.name}, ${userData.email}, NOW())
        RETURNING id, name, email
      `;

      const [betaUser] = await sql`
        INSERT INTO beta_users (user_id, beta_group, invited_at, first_login_at, is_active)
        VALUES (${user.id}, ${userData.beta_group}, NOW(), NOW(), true)
        RETURNING id, user_id, beta_group
      `;

      await sql`
        INSERT INTO beta_activity_logs (user_id, action, details)
        VALUES (${user.id}, 'account_created', ${'{"source": "seed_script"}'})
      `;

      createdUsers.push({
        user_id: user.id,
        name: user.name,
        email: user.email,
        beta_group: betaUser.beta_group,
      });
    }

    return {
      success: true,
      message: `Created ${createdUsers.length} test beta users`,
      users: createdUsers,
    };
  } catch (error) {
    console.error("Error seeding beta users:", error);
    return { error: "Failed to seed beta users" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}