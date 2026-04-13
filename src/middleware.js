import { NextResponse } from "next/server";

export const config = {
  matcher: [
    // Match API routes and protected pages, exclude public routes
    "/((?!account|_next|favicon|static|public|terms|privacy|copyright|trademark|patent).*)",
    "/api/:path*",
  ],
};

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  "/account/signin",
  "/account/signup",
  "/account/logout",
  "/legal/terms",
  "/legal/privacy",
  "/legal/copyright",
  "/legal/trademark",
  "/legal/patent",
  "/debug-auth",
];

// Routes that require authentication
const PROTECTED_ROUTES = [
  "/welcome",
  "/profile",
  "/chat",
  "/messages",
  "/creations",
  "/family-tree",
  "/digital-vault",
  "/education",
  "/health",
  "/financial",
  "/life-skills",
  "/employment",
  "/pictures",
  "/videos",
  "/journal",
  "/quotes",
  "/weather",
  "/social-media",
  "/my-creations",
  "/subscription",
  "/beta-admin-dashboard",
];

// API routes that require authentication
const PROTECTED_API_ROUTES = [
  "/api/profile",
  "/api/photos",
  "/api/videos",
  "/api/creations",
  "/api/chat",
  "/api/messages",
  "/api/journal",
  "/api/quotes",
  "/api/digital-vault",
  "/api/personal-data-query",
  "/api/get-subscription-status",
];

function isProtectedRoute(pathname) {
  // Check if it's a protected API route
  for (const route of PROTECTED_API_ROUTES) {
    if (pathname.startsWith(route)) {
      return true;
    }
  }

  // Check if it's a protected page route
  for (const route of PROTECTED_ROUTES) {
    if (pathname === route || pathname.startsWith(route + "/")) {
      return true;
    }
  }

  return false;
}

function isPublicRoute(pathname) {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Handle integrations rewrite (existing functionality)
  if (pathname.startsWith("/integrations")) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(
      "x-createxyz-project-id",
      "f9e152d3-2ce4-4586-bbc2-00ebca08c5e1"
    );
    requestHeaders.set(
      "x-createxyz-project-group-id",
      "8ee0268e-8b28-4ed0-a840-9fa7927e6f54"
    );

    request.nextUrl.href = `https://www.create.xyz/${request.nextUrl.pathname}`;

    return NextResponse.rewrite(request.nextUrl, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Skip auth check for public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Check if route requires authentication
  if (isProtectedRoute(pathname)) {
    // Check for session
    const sessionToken =
      request.cookies.get("galixee_session_token")?.value ||
      request.cookies.get("sessionToken")?.value;

    if (!sessionToken) {
      // Redirect to login page with callback URL
      const loginUrl = new URL("/account/signin", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // For API routes, you can add additional validation here
    if (pathname.startsWith("/api/")) {
      // Session token exists, allow the request
      // The API route handler will do detailed validation with getSession()
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}