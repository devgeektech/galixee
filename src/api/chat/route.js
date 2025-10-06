async function handler({ message }) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + process.env.OPENAI_API_KEY,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant providing educational content about life skills topics.",
        },
        {
          role: "user",
          content: message,
        },
      ],
    }),
  });

  const data = await response.json();

  return {
    response: data.choices[0].message.content,
  };
}
export async function POST(request) {
  return handler(await request.json());
}