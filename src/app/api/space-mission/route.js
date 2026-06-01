import getSession from "@/utilities/getSession";
import sql from "@/db";

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

     const adminResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    // "api-key": process.env.BREVO_TEST_API_KEY,
    "api-key": process.env.BREVO_API_KEY
  },
  body: JSON.stringify({
    sender: {
      email: process.env.MAIL_FROM,
      // email: process.env.MAIL_FROM_TEST,
      name: "Galixee",
    },
    to: [
      {
        email: "GalixeeMIS@gmail.com",
      },
    ],
    subject: "New Space Memorial Service Information Request",
    textContent: adminEmailBody,
  }),
});
            console.log("Admin status:", adminResponse.status);
console.log("Admin body:", await adminResponse.text());
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

     const userResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    // "api-key": process.env.BREVO_TEST_API_KEY,
    "api-key": process.env.BREVO_API_KEY
  },
  body: JSON.stringify({
    sender: {
      email: process.env.MAIL_FROM,
        // email: process.env.MAIL_FROM_TEST,
      name: "Galixee",
    },
    to: [
      {
        email: email,
      },
    ],
    subject: "We Received Your Request - Galixee",
    textContent: userEmailBody,
  }),
});
console.log("User status:", userResponse.status);
console.log("User body:", await userResponse.text());

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