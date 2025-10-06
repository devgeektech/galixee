async function handler({ redirectURL }) {
  console.log("Stripe checkout handler called with:", { redirectURL });

  try {
    const session = getSession();
    console.log("Session data:", session);

    const email = session?.user?.email;
    const userId = session?.user?.id;

    if (!email || !userId) {
      console.error("No user session found for checkout");
      return {
        success: false,
        error: "Please sign in to subscribe",
      };
    }

    console.log("Creating checkout session for user:", { email, userId });

    // For demo purposes, simulate successful subscription activation
    // Update user subscription status
    const updateResult = await sql`
      UPDATE auth_users 
      SET subscription_status = 'active',
          last_check_subscription_status_at = NOW()
      WHERE id = ${userId}
    `;

    console.log("User subscription activated for:", userId, updateResult);

    // Verify the update worked
    const verifyResult = await sql`
      SELECT subscription_status 
      FROM auth_users 
      WHERE id = ${userId}
    `;

    console.log("Verification result:", verifyResult);

    // Return success and redirect to welcome page
    const response = {
      success: true,
      checkoutUrl: redirectURL || "/welcome",
      message: "Subscription activated successfully",
    };

    console.log("Returning response:", response);
    return response;

    // TODO: Replace with actual Stripe implementation when ready:
    /*
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    // Get current user's stripe_id
    const [user] = await sql`
      SELECT stripe_id FROM auth_users 
      WHERE id = ${userId}
    `;

    let stripeCustomerId = user?.stripe_id;

    if (!stripeCustomerId) {
      // Create new customer in Stripe
      const customer = await stripe.customers.create({ email });
      stripeCustomerId = customer.id;

      // Update user with stripe_id
      await sql`
        UPDATE auth_users 
        SET stripe_id = ${stripeCustomerId}
        WHERE id = ${userId}
      `;
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Galixee Subscription",
              description: "Access to all Galixee features",
            },
            recurring: { interval: "month" },
            unit_amount: 499, // $4.99
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${redirectURL}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: redirectURL,
    });

    return { success: true, checkoutUrl: checkoutSession.url };
    */
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return {
      success: false,
      error: error.message,
    };
  }

  {
    /* Debug: Test password verification */
  }
  <button
    type="button"
    onClick={async () => {
      try {
        console.log("Testing password verification...");
        const response = await fetch("/api/test-password-verification", {
          method: "POST",
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Response error:", errorText);
          alert(`HTTP Error ${response.status}: ${errorText}`);
          return;
        }

        const result = await response.json();
        console.log(
          "Password verification result:",
          JSON.stringify(result, null, 2)
        );

        if (result.success) {
          const status = result.passwordValid ? "✅ VALID" : "❌ INVALID";
          alert(
            `Password Verification: ${status}\n\n` +
              `Email: ${result.testEmail}\n` +
              `Password: ${result.testPassword}\n` +
              `User ID: ${result.userId}\n` +
              `Hash Format: ${result.hashInfo.format}\n` +
              `Match: ${result.debug.match}`
          );
        } else {
          alert(
            `❌ Error: ${result.error}\n\nDetails: ${
              result.details || "No details"
            }`
          );
        }
      } catch (error) {
        console.error("Network/Parse error:", error);
        alert(`❌ Network Error: ${error.message}`);
      }
    }}
    className="text-xs text-gray-400 hover:text-gray-300 underline ml-4"
  >
    🔍 Test password verification
  </button>;

  {
    /* Debug: Check password format */
  }
  <button
    type="button"
    onClick={async () => {
      try {
        console.log("Checking password format...");
        const response = await fetch("/api/debug-password-format", {
          method: "POST",
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Response error:", errorText);
          alert(`HTTP Error ${response.status}: ${errorText}`);
          return;
        }

        const result = await response.json();
        console.log("Password format result:", JSON.stringify(result, null, 2));

        if (result.users && result.users.length > 0) {
          const user = result.users[0];
          alert(
            `Password Format Analysis:\n\n` +
              `Email: ${user.email}\n` +
              `Password Length: ${user.passwordLength}\n` +
              `Password Prefix: ${user.passwordPrefix}\n` +
              `Is Bcrypt: ${user.isBcryptHash}\n` +
              `Is Argon2: ${user.isArgon2Hash}\n` +
              `Is Plain Text: ${user.isPlainText}\n` +
              `Expected Length: 192 (64 salt + 128 hash)`
          );
        } else {
          alert(`No test users found: ${result.message}`);
        }
      } catch (error) {
        console.error("Network/Parse error:", error);
        alert(`❌ Network Error: ${error.message}`);
      }
    }}
    className="text-xs text-gray-400 hover:text-gray-300 underline ml-4"
  >
    🔍 Check password format
  </button>;
}
export async function POST(request) {
  return handler(await request.json());
}