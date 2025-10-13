import { NextResponse } from "next/server";
import sql from "@/db";
import getSession from "@/utilities/getSession";

async function doLogout() {
  try {
    const session = await getSession();
    if (session?.user?.id) {
      await sql`DELETE FROM auth_sessions WHERE "userId" = ${session.user.id}`;
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({success: false, error: "No active session" });
  } catch (e) {
    console.error("API logout error:", e);
    return NextResponse.json({success: false, error: "Internal error" });
  }
}

export async function POST() {
  const result = await doLogout();
  const status = result.success ? 200 : result.error === "No active session" ? 200 : 500;
  return NextResponse.json(result, { status });
}

export async function GET(request) {
  // Always attempt logout, then redirect to sign-in regardless of result
  await doLogout();
  const location = new URL("/account/signin", request.url);
  return NextResponse.redirect(location);
}
