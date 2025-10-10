import getSession from "@/utilities/getSession";
import sql from "@/db";
import { NextResponse } from "next/server";
// Helper to ensure a valid session and return userId
async function requireUser() {
  const session = await getSession();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };
  }
  return { userId: session.user.id };
}

export async function GET() {
  const { userId, error } = await requireUser();
  if (error) return error;

  try {
    const messages = await sql`
      SELECT * FROM scheduled_messages
      WHERE user_id = ${userId}
      ORDER BY scheduled_date DESC
    `;
    return NextResponse.json({ data: messages });
  } catch (e) {
    console.error("Scheduled messages GET error:", e);
    return NextResponse.json({ error: "An error occurred processing your request" }, { status: 500 });
  }
}

export async function POST(request) {
  const { userId, error } = await requireUser();
  if (error) return error;

  const body = await request.json();
  const {
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
  } = body || {};

  if (
    !recipient_name ||
    !scheduled_date ||
    !message_type ||
    !delivery_method ||
    (delivery_method === "email" && !recipient_email) ||
    (delivery_method === "sms" && !recipient_phone)
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
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
    return NextResponse.json({ data: message[0] });
  } catch (e) {
    console.error("Scheduled messages POST error:", e);
    return NextResponse.json({ error: "An error occurred processing your request" }, { status: 500 });
  }
}

export async function PUT(request) {
  const { userId, error } = await requireUser();
  if (error) return error;

  const body = await request.json();
  const {
    id,
    message_type,
    recipient_name,
    recipient_email,
    recipient_phone,
    scheduled_date,
    subject,
    message_content,
    media_url,
    timezone,
  } = body || {};

  if (!id) {
    return NextResponse.json({ error: "Message ID required" }, { status: 400 });
  }

  try {
    const existingMessage = await sql`
      SELECT * FROM scheduled_messages
      WHERE id = ${id} AND user_id = ${userId}
    `;

    if (!existingMessage.length) {
      return NextResponse.json({ error: "Message not found or unauthorized" }, { status: 404 });
    }

    const delivery_method_value = message_type === "email" ? "email" : "sms";

    if (delivery_method_value === "email" && !recipient_email) {
      return NextResponse.json({ error: "Email address required for email messages" }, { status: 400 });
    }

    if (delivery_method_value === "sms" && !recipient_phone) {
      return NextResponse.json({ error: "Phone number required for SMS messages" }, { status: 400 });
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

    return NextResponse.json({ data: message[0] });
  } catch (e) {
    console.error("Scheduled messages PUT error:", e);
    return NextResponse.json({ error: "An error occurred processing your request" }, { status: 500 });
  }
}

export async function DELETE(request) {
  const { userId, error } = await requireUser();
  if (error) return error;

  const body = await request.json();
  const { id } = body || {};

  if (!id) {
    return NextResponse.json({ error: "Message ID required" }, { status: 400 });
  }

  try {
    const existingMessage = await sql`
      SELECT * FROM scheduled_messages
      WHERE id = ${id} AND user_id = ${userId}
    `;

    if (!existingMessage.length) {
      return NextResponse.json({ error: "Message not found or unauthorized" }, { status: 404 });
    }

    await sql`
      DELETE FROM scheduled_messages
      WHERE id = ${id} AND user_id = ${userId}
    `;
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Scheduled messages DELETE error:", e);
    return NextResponse.json({ error: "An error occurred processing your request" }, { status: 500 });
  }
}