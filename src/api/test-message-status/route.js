async function handler({ messageId }) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    console.log("Debug - Fetching messages for user:", session.user.id);

    // Get messages for the current user
    const messages = await sql`
      SELECT 
        id,
        recipient_name,
        recipient_phone,
        message_type,
        delivery_method,
        scheduled_date,
        message_content,
        status,
        created_at
      FROM scheduled_messages
      WHERE user_id = ${session.user.id}
      ORDER BY created_at DESC
      LIMIT 50
    `;

    console.log("Debug - Retrieved messages count:", messages?.length);
    console.log("Debug - First message (if any):", messages?.[0]);

    return {
      success: true,
      data: messages || [],
    };
  } catch (error) {
    console.error("Error in test-message-status:", error);
    return {
      success: false,
      error: "Failed to fetch message status",
      details: error.message,
      data: [],
    };
  }
}
export async function POST(request) {
  return handler(await request.json());
}