function handler({ method, body }) {
  const session = getSession();

  if (!session?.user?.id) {
    return {
      error: "Not authenticated",
      status: 401,
    };
  }

  return {
    success: true,
    debug: {
      method: method,
      hasBody: !!body,
      bodyKeys: body ? Object.keys(body) : [],
      bodyContent: body,
      userId: session.user.id,
      timestamp: new Date().toISOString(),
    },
  };
}
export async function POST(request) {
  return handler(await request.json());
}