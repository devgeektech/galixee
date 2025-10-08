async function handler({ messages }) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const userProfile = await sql`
    SELECT * FROM user_profiles 
    WHERE user_id = ${session.user.id}
  `;

  const profile = userProfile[0] || {};

  const contextMessage = {
    role: "system",
    content: `You are talking to ${
      profile.first_name || "someone"
    }. Some details about them:
      ${profile.birthdate ? `They were born on ${profile.birthdate}` : ""}
      ${
        profile.current_city
          ? `They live in ${profile.current_city}, ${profile.current_state}`
          : ""
      }
      ${
        profile.favorite_hobbies ? `They enjoy ${profile.favorite_hobbies}` : ""
      }
    `,
  };

  const response = await fetch("/integrations/google-gemini-1-5/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [contextMessage, ...messages],
    }),
  });

  return response;
}
export async function POST(request) {
  return handler(await request.json());
}