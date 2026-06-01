import getSession from "@/utilities/getSession";
import sql from "@/db";
import nodemailer from "nodemailer";

  const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

(async () => {
  try {
    await transporter.verify();
    console.log("SMTP connection successful");
  } catch (err) {
    console.log("SMTP verify failed:", err);
  }
})();

async function handler({
  method,
  name,
  email,
  phone,
  message,
  preferred_contact,
}) {



  const session = await getSession();

  if (!session?.user?.id) {
    return { error: "Authentication required" };
  }

  if (method === "POST") {
    try {
      const result = await sql`
        INSERT INTO space_mission_reservations
(user_id, contact_name, contact_email, contact_phone, preferred_contact, notes)
VALUES
(${session.user.id}, ${name}, ${email}, ${phone}, ${preferred_contact}, ${message})
RETURNING id
      `;

const reservationId = result[0].id;

      /* ---------------- ADMIN EMAIL ---------------- */
const adminEmailBody = `
New Space Memorial Service Information Request:

Reservation ID: ${reservationId}

Name: ${name}
Email: ${email}
Phone: ${phone}
Preferred Contact Method: ${preferred_contact}
Message: ${message}

Submitted by User ID: ${session.user.id}
      `;

  await transporter.sendMail({
  from: process.env.MAIL_FROM,
  to: "GalixeeMIS@gmail.com",
  subject: "New Space Memorial Service Information Request",
  text: adminEmailBody,
});

      // console.log("Admin email status:", adminResponse.status);
      // console.log("Admin email response:", await adminResponse.text());

      /* ---------------- USER CONFIRMATION EMAIL ---------------- */
 const userEmailBody = `
Hello ${name},

Thank you for contacting Galixee.

We have successfully received your Space Memorial Service request.

Reservation ID: ${reservationId}

Our team will review your request and contact you soon through your preferred method: ${preferred_contact}.

Submitted Details:
Name: ${name}
Email: ${email}
Phone: ${phone}

Thank you,
Galixee Team
      `;

  await transporter.sendMail({
  from: process.env.MAIL_FROM,
  to: email,
  subject: "We Received Your Request - Galixee",
  text: userEmailBody,
});
      // console.log("User email status:", userResponse.status);
      // console.log("User email response:", await userResponse.text());

      return { success: true, id: reservationId };
    } catch (error) {
      console.error("Error processing space mission request:", error);
      return { error: "Failed to process request" };
    }
  }

  return { error: "Method not allowed" };
}

export async function POST(request) {
  const body = await request.json();
  return Response.json(await handler({ method: "POST", ...body }));
}