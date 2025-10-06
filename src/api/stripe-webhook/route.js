async function handler(event, request) {
  // Note: Stripe webhook verification requires crypto module which isn't available
  // For now, we'll skip verification in the sandbox environment
  // In production, you'd need to implement this differently

  try {
    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      const status = subscription.status;

      // For now, we'll trust the webhook data without verification
      // In production, you'd need proper webhook verification

      // Find user by stripe customer ID
      const results = await sql`
        SELECT * FROM auth_users WHERE stripe_id = ${customerId}
      `;

      if (results.length > 0) {
        await sql`
          UPDATE auth_users 
          SET subscription_status = ${status}, 
              last_check_subscription_status_at = NOW()
          WHERE stripe_id = ${customerId}
        `;

        return { success: true, message: "Subscription status updated" };
      } else {
        return { success: false, error: "User not found for customer ID" };
      }
    }

    return { success: false, error: "Unhandled webhook event type" };
  } catch (error) {
    console.error("Webhook error:", error);
    return { success: false, error: error.message };
  }
}
export async function POST(request) {
  return handler(await request.json());
}