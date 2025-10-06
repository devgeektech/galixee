async function handler({ phone, content, scheduledDate, recipientName }) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  if (!phone || !content) {
    return { error: "Phone number and message content are required" };
  }

  // Validate phone number format (E.164)
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  if (!phoneRegex.test(phone)) {
    return {
      error:
        "Invalid phone number format. Must be E.164 format (e.g. +1234567890)",
    };
  }

  try {
    // Determine if this is an immediate or scheduled message
    const messageDate = scheduledDate ? new Date(scheduledDate) : new Date();
    const isScheduled = scheduledDate && messageDate > new Date();

    // Save the message to our database
    const [savedMessage] = await sql`
      INSERT INTO scheduled_messages (
        user_id,
        recipient_name,
        recipient_phone,
        message_type,
        delivery_method,
        scheduled_date,
        message_content,
        status
      ) VALUES (
        ${session.user.id},
        ${recipientName || "Test Recipient"},
        ${phone},
        'text',
        'sms',
        ${messageDate},
        ${content},
        ${isScheduled ? "pending" : "test_pending"}
      )
      RETURNING *
    `;

    console.log("Debug - Saved message:", savedMessage);

    // For sandbox environment, we'll simulate SMS sending
    // In production, you'd integrate with a real SMS service
    if (!isScheduled) {
      try {
        // Simulate SMS sending delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mark as sent (simulated)
        await sql`
          UPDATE scheduled_messages 
          SET 
            status = 'sent'
          WHERE id = ${savedMessage.id}
        `;

        return {
          message: "Message sent successfully! (Simulated in sandbox)",
          data: savedMessage,
        };
      } catch (smsError) {
        const errorMessage = smsError.message || "Unknown SMS error";
        await sql`
          UPDATE scheduled_messages 
          SET 
            status = 'failed',
            message_content = ${content + "\n\nError: " + errorMessage}
          WHERE id = ${savedMessage.id}
        `;

        console.error("SMS Error:", smsError);
        return {
          error: "Failed to send SMS: " + errorMessage,
          data: savedMessage,
        };
      }
    } else {
      // For scheduled messages, just return success
      return {
        message: "Message scheduled successfully!",
        data: savedMessage,
      };
    }
  } catch (error) {
    console.error("Database Error:", error);
    return { error: "Failed to process message: " + error.message };
  }
}
export async function POST(request) {
  return handler(await request.json());
}