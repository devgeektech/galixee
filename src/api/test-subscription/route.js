async function handler() {
  const session = getSession();

  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    const user = await sql`
      SELECT id, subscription_status, stripe_id, last_check_subscription_status_at
      FROM auth_users 
      WHERE id = ${session.user.id}
    `;

    if (user.length === 0) {
      return { error: "User not found" };
    }

    const userData = user[0];

    return {
      success: true,
      user_id: userData.id,
      subscription_status: userData.subscription_status,
      stripe_id: userData.stripe_id,
      last_check: userData.last_check_subscription_status_at,
      test_timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      error: "Database error",
      details: error.message,
    };
  }
}
export async function POST(request) {
  return handler(await request.json());
}