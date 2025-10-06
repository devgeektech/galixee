import { NextResponse } from "next/server";

export const config = {
  matcher: "/integrations/:path*",
};

export function middleware(request) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-createxyz-project-id", "f9e152d3-2ce4-4586-bbc2-00ebca08c5e1");
  requestHeaders.set("x-createxyz-project-group-id", "8ee0268e-8b28-4ed0-a840-9fa7927e6f54");


  request.nextUrl.href = `https://www.create.xyz/${request.nextUrl.pathname}`;

  return NextResponse.rewrite(request.nextUrl, {
    request: {
      headers: requestHeaders,
    },
  });
}