function handler() {
  const session = getSession();

  if (!session) {
    return {
      error: "No session found",
      authenticated: false,
    };
  }

  return {
    success: true,
    message: "Test endpoint working correctly",
    authenticated: true,
    user: {
      id: session.user?.id,
      name: session.user?.name,
      email: session.user?.email,
    },
    timestamp: new Date().toISOString(),
  };
}
export async function POST(request) {
  return handler(await request.json());
}