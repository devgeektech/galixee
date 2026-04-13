import { NextResponse } from "next/server";
import { verifyRefreshToken, generateAccessToken } from "@/utilities/jwt-utils";
import sql from "@/db";

export async function POST(request) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token is required" },
        { status: 400 }
      );
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid or expired refresh token" },
        { status: 401 }
      );
    }

    // Fetch user data from database
    const users = await sql`
      SELECT id, email, name
      FROM auth_users
      WHERE id = ${decoded.userId}
    `;

    if (users.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const user = users[0];

    // Generate new access token
    const newAccessToken = generateAccessToken(user.id, user.email, user.name);

    return NextResponse.json({
      success: true,
      accessToken: newAccessToken,
      tokenType: "Bearer",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    return NextResponse.json(
      { error: "Failed to refresh token" },
      { status: 500 }
    );
  }
}
