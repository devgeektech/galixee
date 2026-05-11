import sql from '@/db';
import { NextResponse } from "next/server";
const crypto = require("crypto");

function hashPassword(password) {
  const salt = crypto.randomBytes(32).toString("hex"); // 64 chars
  const hash = crypto.pbkdf2Sync(password, Buffer.from(salt, "hex"), 100000, 64, "sha256").toString("hex"); // 128 chars
  return `${salt}:${hash}`; // salt:hash format
}
async function handler({email, password}) {
  try {
    //const testEmail = `test-${Date.now()}@example.com`;
    console.log('emaial isssssssssss',email)
    console.log('password is',password)
    const testEmail = email||`test@example.com`;
    const testPassword =password|| "TestPassword123!";
    const testName = name?.trim() || "User";


    const existingUser = await sql`
      SELECT id, email, name FROM auth_users 
      WHERE email = ${testEmail}
    `;


    if (existingUser.length > 0) {
            return NextResponse.json({
        status: "user_exists",
        message: "User already exists",
        user: existingUser[0],
      });
    }

    const newUser = await sql`
      INSERT INTO auth_users (email, name, "emailVerified")
      VALUES (${testEmail}, ${testName}, NOW())
      RETURNING id, email, name, "emailVerified"
    `;

    const hashedPassword = hashPassword(testPassword);
    const accountResult = await sql`
      INSERT INTO auth_accounts ("userId", type, provider, "providerAccountId", password)
      VALUES (${newUser[0].id}, 'credentials', 'credentials', ${testEmail}, ${hashedPassword})
      RETURNING id, "userId", provider
    `;


    const profileResult = await sql`
      INSERT INTO user_profiles (user_id, first_name)
      VALUES (${newUser[0].id}, ${testName})
      RETURNING id, user_id, first_name
    `;

       return NextResponse.json({
      status: "success",
      message: "Signup process completed successfully",
      user: newUser[0],
      account: accountResult[0],
      profile: profileResult[0],
      testCredentials: {
        email: testEmail,
        password: testPassword,
      },
    });
  } catch (error) {
    console.error("Signup debug error:", error);

      return NextResponse.json(
      {
        status: "error",
        message: error.message,
        stack: error.stack,
        details: {
          name: error.name,
          code: error.code,
        },
      },
      { status: 500 }
    );
  }
}
export async function POST(request) {
  return handler(await request.json());
}