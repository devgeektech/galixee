/**
 * Helper function to extract session token from request
 * Checks Authorization header, cookies, and custom headers
 * This enables client-based session management
 */
export function getSessionTokenFromRequest(request) {
  // 1. Check Authorization header (Bearer token format)
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // 2. Check for session token in cookies
  const cookies = request.headers.get("cookie");
  if (cookies) {
    const cookieMatch = cookies.match(/galixee_session_token=([^;]+)/);
    if (cookieMatch && cookieMatch[1]) {
      return cookieMatch[1];
    }
  }

  // 3. Check for custom header
  const customHeader = request.headers.get("x-session-token");
  if (customHeader) {
    return customHeader;
  }

  // 4. Try to get from request body (for POST requests)
  // Note: This requires the body to be parsed first
  if (request.body && typeof request.body === 'object' && request.body.sessionToken) {
    return request.body.sessionToken;
  }

  return null;
}
