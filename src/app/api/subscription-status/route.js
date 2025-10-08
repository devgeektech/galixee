async function handler({ action, session_id }) {
  const session = getSession();

  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    // Handle demo activation
    if (action === "demo_activate" && session_id) {
      console.log("Demo activation requested for user:", session.user.email);

      const updateResult = await sql`
        UPDATE auth_users 
        SET subscription_status = 'active',
            last_check_subscription_status_at = NOW()
        WHERE id = ${session.user.id}
      `;

      console.log("Demo subscription activated successfully");

      return {
        status: "active",
        message: "Demo subscription activated",
        demo: true,
        isActive: true,
      };
    }

    // Regular subscription check
    const user = await sql`
      SELECT subscription_status, stripe_id 
      FROM auth_users 
      WHERE id = ${session.user.id}
    `;

    if (user.length === 0) {
      return { error: "User not found" };
    }

    const userData = user[0];

    return {
      subscriptionStatus: userData.subscription_status || "inactive",
      stripeId: userData.stripe_id,
      isActive: userData.subscription_status === "active",
      status: userData.subscription_status || "inactive",
    };
  } catch (error) {
    console.error("Error checking subscription status:", error);
    return { error: "Failed to check subscription status" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}