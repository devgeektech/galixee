// Rate limiting setup
const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 20; // Maximum requests per minute
const CLEANUP_INTERVAL = 300000; // Clean up every 5 minutes

// Cleanup function for rate limits
setInterval(() => {
  const now = Date.now();
  for (const [ip, limit] of rateLimits.entries()) {
    if (limit.resetTime < now) {
      rateLimits.delete(ip);
    }
  }
}, CLEANUP_INTERVAL);

async function handler(params, request) {
  // Get client IP for rate limiting
  const clientIp = request?.headers?.["x-forwarded-for"] || "unknown";

  // Rate limiting check
  const now = Date.now();
  const rateLimit = rateLimits.get(clientIp) || {
    count: 0,
    resetTime: now + RATE_LIMIT_WINDOW,
  };

  if (rateLimit.resetTime < now) {
    // Reset if window has expired
    rateLimit.count = 1;
    rateLimit.resetTime = now + RATE_LIMIT_WINDOW;
  } else if (rateLimit.count >= MAX_REQUESTS) {
    // Calculate time until reset
    const waitSeconds = Math.ceil((rateLimit.resetTime - now) / 1000);
    return {
      error: "Too many requests. Please try again later.",
      status: 429,
      headers: {
        "Retry-After": waitSeconds.toString(),
      },
    };
  } else {
    // Increment counter
    rateLimit.count++;
  }

  // Update rate limit tracking
  rateLimits.set(clientIp, rateLimit);

  try {
    // First check if the tables exist
    const tablesExist = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'auth_users'
      ) as has_users,
      EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'auth_accounts'
      ) as has_accounts;
    `;

    if (!tablesExist[0].has_users || !tablesExist[0].has_accounts) {
      return {
        success: false,
        error: "Authentication tables not properly initialized",
        status: "Database tables not found",
      };
    }

    // Check if we have any users in the database
    const [userCount] = await sql`SELECT COUNT(*) as count FROM auth_users`;

    // Check if we have any accounts in the database
    const [accountCount] =
      await sql`SELECT COUNT(*) as count FROM auth_accounts`;

    // Even if there are no users yet, we should allow the first signup
    return {
      success: true,
      config: {
        hasUsers: userCount?.count > 0,
        hasAccounts: accountCount?.count > 0,
      },
    };
  } catch (error) {
    console.error("Error checking auth configuration:", error);
    return {
      error: "Failed to check authentication configuration",
      status: 500,
    };
  }
}
export async function POST(request) {
  return handler(await request.json());
}