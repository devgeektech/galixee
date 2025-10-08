function handler(params) {
  const session = getSession();

  return {
    success: true,
    debug: {
      // Check what we actually receive
      paramsType: typeof params,
      paramsKeys: params ? Object.keys(params) : null,
      paramsValue: params,

      // Try different ways to access parameters
      directMethod: params?.method,
      directBody: params?.body,
      directHeaders: params?.headers,

      // Check arguments object
      argumentsLength: arguments.length,
      firstArg: arguments[0],
      secondArg: arguments[1],
      thirdArg: arguments[2],

      // Session info
      hasSession: !!session,
      userId: session?.user?.id || null,
      timestamp: new Date().toISOString(),

      // Safe header access
      contentType: params?.headers?.["content-type"] || "none",
    },
  };
}
export async function POST(request) {
  return handler(await request.json());
}