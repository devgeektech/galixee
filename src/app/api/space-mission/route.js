async function handler({
  method,
  name,
  email,
  phone,
  message,
  preferred_contact,
}) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Authentication required" };
  }

  if (method === "POST") {
    try {
      // Store the reservation in the database
      const result = await sql`
        INSERT INTO space_mission_reservations 
        (user_id, contact_name, contact_email, contact_phone, notes)
        VALUES 
        (${session.user.id}, ${name}, ${email}, ${phone}, ${message})
        RETURNING id
      `;

      // Send email notification
      const emailBody = `
New Space Memorial Service Information Request:

Name: ${name}
Email: ${email}
Phone: ${phone}
Preferred Contact Method: ${preferred_contact}
Message: ${message}

This request was submitted by user ID: ${session.user.id}
      `;

      await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: "GalixeeMIS@gmail.com" }],
            },
          ],
          from: { email: "noreply@galixee.com" },
          subject: "New Space Memorial Service Information Request",
          content: [
            {
              type: "text/plain",
              value: emailBody,
            },
          ],
        }),
      });

      return { success: true, id: result[0].id };
    } catch (error) {
      console.error("Error processing space mission request:", error);
      return { error: "Failed to process request" };
    }
  }

  return { error: "Method not allowed" };
}
export async function POST(request) {
  return handler(await request.json());
}