async function handler() {
  try {
    const testEmail = "test@example.com";
    const testPassword = "password123";

    console.log("Starting password verification for:", testEmail);

    // First, let's check if the user exists at all
    console.log("Step 1: Checking if user exists...");
    const userExists = await sql`
      SELECT id, email, name FROM auth_users 
      WHERE email = ${testEmail}
    `;

    console.log("User exists check:", userExists);

    if (userExists.length === 0) {
      return {
        success: false,
        error: "Test user not found in auth_users table",
        email: testEmail,
        suggestion: "Run the create-test-user function first",
        debug: {
          userTableCheck: "No user found with this email",
        },
      };
    }

    const userId = userExists[0].id;
    console.log("Found user with ID:", userId);

    // Check if account exists
    console.log("Step 2: Checking if credentials account exists...");
    const accountExists = await sql`
      SELECT id, "userId", provider, "providerAccountId", 
             CASE WHEN password IS NOT NULL THEN 'has_password' ELSE 'no_password' END as password_status,
             LENGTH(password) as password_length
      FROM auth_accounts 
      WHERE "userId" = ${userId} AND provider = 'credentials'
    `;

    console.log("Account exists check:", accountExists);

    if (accountExists.length === 0) {
      return {
        success: false,
        error: "No credentials account found for test user",
        email: testEmail,
        userId: userId,
        suggestion: "The user exists but has no credentials account",
        debug: {
          userExists: true,
          accountExists: false,
        },
      };
    }

    // Get the user and account info with password
    console.log("Step 3: Getting full user and account info...");
    const userAccount = await sql`
      SELECT u.id as user_id, u.email, u.name,
             a.id as account_id, a.password, a.provider, a."providerAccountId"
      FROM auth_users u
      JOIN auth_accounts a ON u.id = a."userId"
      WHERE u.email = ${testEmail} AND a.provider = 'credentials'
    `;

    if (userAccount.length === 0) {
      return {
        success: false,
        error: "Test user not found in JOIN query",
        email: testEmail,
        suggestion: "Run the create-test-user function first",
        debug: {
          userExists: userExists.length > 0,
          accountExists: accountExists.length > 0,
          joinFailed: true,
        },
      };
    }

    const account = userAccount[0];
    const storedHash = account.password;

    console.log("Account details:", {
      userId: account.user_id,
      accountId: account.account_id,
      hasPassword: !!storedHash,
      passwordLength: storedHash ? storedHash.length : 0,
    });

    if (!storedHash) {
      return {
        success: false,
        error: "No password hash stored",
        userId: account.user_id,
        email: testEmail,
        debug: {
          accountFound: true,
          passwordStored: false,
        },
      };
    }

    // The create-test-user function uses a custom hash format: salt:hash
    // Let's verify using the same method
    const [salt, hash] = storedHash.split(":");

    if (!salt || !hash) {
      return {
        success: false,
        error: "Invalid hash format",
        storedHash: storedHash.substring(0, 20) + "...",
        expectedFormat: "salt:hash",
        debug: {
          hashFormat: "invalid",
          hasSalt: !!salt,
          hasHash: !!hash,
          fullLength: storedHash.length,
        },
      };
    }

    console.log("Hash format check passed:", {
      saltLength: salt.length,
      hashLength: hash.length,
      totalLength: storedHash.length,
    });

    // Verify password using the same method as create-test-user
    console.log("Step 4: Verifying password...");
    const crypto = require("crypto");

    // Convert salt from hex string to buffer (same as create function)
    const saltBuffer = Buffer.from(salt, "hex");

    // Use same PBKDF2 parameters as create function: 100000 iterations, sha256
    const verifyHash = crypto
      .pbkdf2Sync(testPassword, saltBuffer, 100000, 64, "sha256")
      .toString("hex");

    const isValid = verifyHash === hash;

    console.log("Password verification result:", {
      isValid,
      computedHashLength: verifyHash.length,
      storedHashLength: hash.length,
      match: isValid,
    });

    return {
      success: true,
      testEmail,
      testPassword,
      userId: account.user_id,
      accountId: account.account_id,
      passwordValid: isValid,
      hashInfo: {
        saltLength: salt.length,
        hashLength: hash.length,
        fullHashLength: storedHash.length,
        format: "custom_pbkdf2",
      },
      debug: {
        storedSalt: salt.substring(0, 8) + "...",
        storedHash: hash.substring(0, 8) + "...",
        computedHash: verifyHash.substring(0, 8) + "...",
        match: isValid,
        userFound: true,
        accountFound: true,
        passwordStored: true,
        hashFormatValid: true,
      },
    };
  } catch (error) {
    console.error("Password verification error:", error);
    return {
      success: false,
      error: "Verification error",
      details: error.message,
      stack: error.stack,
    };
  }
}
export async function POST(request) {
  return handler(await request.json());
}