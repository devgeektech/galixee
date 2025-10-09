import getSession from "@/utilities/getSession";
import sql from "@/db";
import { NextResponse } from "next/server";
async function handler({ messageId }) {
  const session = await getSession();
  if (!session?.user?.id) {
  return NextResponse.json({ error: "Unauthorized" });
  }

  try {
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

  
    return NextResponse.json({
      success: true,
      data: messages || [],
    });
  } catch (error) {
    console.error("Error in test-message-status:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch message status",
      details: error.message,
      data: [],
    });
  }
}
export async function POST(request) {
  return handler(await request.json());
}