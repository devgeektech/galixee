function handler({ method, body, headers, query }) {
  const session = getSession();

  return {
    debug_info: {
      timestamp: new Date().toISOString(),
      method: method,
      has_session: !!session,
      user_id: session?.user?.id || null,
      user_email: session?.user?.email || null,
      headers: {
        content_type: headers?.["content-type"] || null,
        user_agent: headers?.["user-agent"] || null,
      },
      query_params: query || {},
      body_received: body || null,
      body_type: typeof body,
      body_keys: body && typeof body === "object" ? Object.keys(body) : null,
      raw_body_string: typeof body === "string" ? body : null,
    },
  };
}
export async function POST(request) {
  return handler(await request.json());
}