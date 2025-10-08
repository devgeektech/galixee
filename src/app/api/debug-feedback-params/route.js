function handler({
  action,
  feedback_type,
  title,
  description,
  page_url,
  browser_info,
  device_info,
  screenshot_url,
  priority,
  status,
  admin_notes,
}) {
  const session = getSession();

  return {
    debug_info: {
      timestamp: new Date().toISOString(),
      session_exists: !!session,
      user_id: session?.user?.id || null,
      received_parameters: {
        action,
        feedback_type,
        title,
        description,
        page_url,
        browser_info,
        device_info,
        screenshot_url,
        priority,
        status,
        admin_notes,
      },
      parameter_types: {
        action: typeof action,
        feedback_type: typeof feedback_type,
        title: typeof title,
        description: typeof description,
        page_url: typeof page_url,
        browser_info: typeof browser_info,
        device_info: typeof device_info,
        screenshot_url: typeof screenshot_url,
        priority: typeof priority,
        status: typeof status,
        admin_notes: typeof admin_notes,
      },
      all_keys: Object.keys(arguments[0] || {}),
      raw_input: arguments[0],
    },
  };
}
export async function POST(request) {
  return handler(await request.json());
}