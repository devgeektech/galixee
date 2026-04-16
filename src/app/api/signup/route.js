import sql from "@/db";
import { NextResponse } from "next/server";
import {
  generateAccessToken,
  generateRefreshToken,
} from "@/utilities/jwt-utils";

const crypto = require("crypto");

function hashPassword(password) {
  const salt = crypto.randomBytes(32);
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha256");

  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function POST(request) {
  try {
    const body = await request.json();

    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const name = body.name?.trim();

    /* ---------------- VALIDATION ---------------- */

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    /* ---------------- CHECK DUPLICATE ---------------- */

    const existing = await sql`
      SELECT id FROM auth_users WHERE email = ${email}
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }

    /* ---------------- CREATE USER ---------------- */

    const newUser = await sql`
      INSERT INTO auth_users (name, email, "emailVerified")
      VALUES (${name}, ${email}, NOW())
      RETURNING id, name, email
    `;

    const user = newUser[0];

    /* ---------------- HASH PASSWORD ---------------- */

    const hashedPassword = hashPassword(password);

    /* ---------------- CREATE ACCOUNT ---------------- */

    await sql`
      INSERT INTO auth_accounts (
        "userId",
        type,
        provider,
        "providerAccountId",
        password
      )
      VALUES (
        ${user.id},
        'credentials',
        'credentials',
        ${email},
        ${hashedPassword}
      )
    `;

    /* ---------------- CREATE PROFILE ---------------- */

    await sql`
      INSERT INTO user_profiles (
        user_id,
        first_name
      )
      VALUES (
        ${user.id},
        ${name}
      )
    `;

    /* ---------------- CREATE SESSION ---------------- */

    const sessionToken = crypto.randomBytes(32).toString("hex");

    const expiresDate = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
      // Date.now()+ 2 * 60 * 1000
    );

    const expiresISO = expiresDate.toISOString();

    await sql`
      INSERT INTO auth_sessions (
        "userId",
        expires,
        "sessionToken"
      )
      VALUES (
        ${user.id},
        ${expiresISO},
        ${sessionToken}
      )
    `;

    /* ---------------- JWT TOKENS ---------------- */

    const accessToken = generateAccessToken(
      user.id,
      user.email,
      user.name
    );

    const refreshToken = generateRefreshToken(
      user.id,
      user.email
    );

    /* ---------------- GLOBAL SESSION ---------------- */

    global.currentSession = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      sessionToken,
      expires: expiresISO,
    };

    /* ---------------- RESPONSE ---------------- */

    const response = NextResponse.json({
      success: true,
      message: "Account created successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },

      sessionToken,
      expires: expiresISO,
      sessionCreated: true,

      accessToken,
      refreshToken,
      tokenType: "Bearer",

      sessionData: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        sessionToken,
        expires: expiresISO,
      },
    });

    /* ---------------- COOKIES ---------------- */

    response.cookies.set(
      "galixee_session_token",
      sessionToken,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60,
        // maxAge: 2 * 60,
        path: "/",
      }
    );

    response.cookies.set("session_expires", expiresISO, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    response.cookies.set("sessionToken", sessionToken, {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
        // maxAge: 2 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Signup error:", error);

    return NextResponse.json(
      {
        error: "Signup failed",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
