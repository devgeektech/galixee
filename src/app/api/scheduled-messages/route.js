async function handler({
  method,
  id,
  message_type,
  delivery_method,
  recipient_name,
  recipient_email,
  recipient_phone,
  scheduled_date,
  subject,
  message_content,
  media_url,
  timezone,
}) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Authentication required" };
  }

  const userId = session.user.id;

  try {
    switch (method) {
      case "GET": {
        const messages = await sql`
          SELECT * FROM scheduled_messages 
          WHERE user_id = ${userId}
          ORDER BY scheduled_date DESC
        `;
        return { data: messages };
      }

      case "POST": {
        if (
          !recipient_name ||
          !scheduled_date ||
          !message_type ||
          !delivery_method ||
          (delivery_method === "email" && !recipient_email) ||
          (delivery_method === "sms" && !recipient_phone)
        ) {
          return { error: "Missing required fields" };
        }

        // Store the date as is - it will be displayed in the selected timezone on the frontend
        const message = await sql`
          INSERT INTO scheduled_messages (
            user_id, recipient_name, recipient_email, recipient_phone,
            message_type, delivery_method, scheduled_date, subject,
            message_content, media_url, status, timezone
          ) VALUES (
            ${userId}, ${recipient_name}, ${recipient_email}, ${recipient_phone},
            ${message_type}, ${delivery_method}, ${scheduled_date}, ${subject},
            ${message_content}, ${media_url}, 'pending', ${timezone}
          )
          RETURNING *
        `;
        return { data: message[0] };
      }

      case "PUT": {
        if (!id) {
          return { error: "Message ID required" };
        }

        const existingMessage = await sql`
          SELECT * FROM scheduled_messages 
          WHERE id = ${id} AND user_id = ${userId}
        `;

        if (!existingMessage.length) {
          return { error: "Message not found or unauthorized" };
        }

        const delivery_method_value =
          message_type === "email" ? "email" : "sms";

        if (delivery_method_value === "email" && !recipient_email) {
          return { error: "Email address required for email messages" };
        }

        if (delivery_method_value === "sms" && !recipient_phone) {
          return { error: "Phone number required for SMS messages" };
        }

        const message = await sql`
          UPDATE scheduled_messages 
          SET recipient_name = ${recipient_name},
              recipient_email = ${recipient_email},
              recipient_phone = ${recipient_phone},
              message_type = ${message_type},
              delivery_method = ${delivery_method_value},
              scheduled_date = ${scheduled_date},
              subject = ${subject},
              message_content = ${message_content},
              media_url = ${media_url},
              timezone = ${timezone},
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${id} AND user_id = ${userId}
          RETURNING *
        `;

        return { data: message[0] };
      }

      case "DELETE": {
        if (!id) {
          return { error: "Message ID required" };
        }

        const existingMessage = await sql`
          SELECT * FROM scheduled_messages 
          WHERE id = ${id} AND user_id = ${userId}
        `;

        if (!existingMessage.length) {
          return { error: "Message not found or unauthorized" };
        }

        await sql`
          DELETE FROM scheduled_messages 
          WHERE id = ${id} AND user_id = ${userId}
        `;
        return { success: true };
      }

      default:
        return { error: "Method not allowed" };
    }
  } catch (error) {
    console.error("Scheduled messages handler error:", error);
    return { error: "An error occurred processing your request" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}