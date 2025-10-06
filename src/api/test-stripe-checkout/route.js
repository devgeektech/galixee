function handler() {
  return {
    success: true,
    message: "Stripe checkout test function is working",
    timestamp: new Date().toISOString(),
    environment: "test",
  };
}
export async function POST(request) {
  return handler(await request.json());
}