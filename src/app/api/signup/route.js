import sql from "@/db";
import { NextResponse } from "next/server";
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

    // Validation
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

    // Check duplicate email
    const existing = await sql`
      SELECT id FROM auth_users WHERE email = ${email}
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }

    // Create user
    const newUser = await sql`
      INSERT INTO auth_users (name, email, "emailVerified")
      VALUES (${name}, ${email}, NOW())
      RETURNING id, name, email
    `;

    const user = newUser[0];

    // Hash password
    const hashedPassword = hashPassword(password);

    // Create credentials account
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

    // Create profile
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

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

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