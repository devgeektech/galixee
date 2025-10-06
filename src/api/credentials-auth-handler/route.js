async function handler({ email, password }) {
  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    // Get the user account with credentials provider
    const accounts = await sql`
      SELECT a.id as account_id, a."userId", a.password, u.id, u.name, u.email, u.image
      FROM auth_accounts a
      JOIN auth_users u ON a."userId" = u.id
      WHERE a.provider = 'credentials' AND a."providerAccountId" = ${email}
    `;

    if (accounts.length === 0) {
      return { error: "Invalid credentials" };
    }

    const account = accounts[0];

    if (!account.password) {
      return { error: "Invalid credentials" };
    }

    // Verify password using the same method as test-password-verification
    const crypto = require("crypto");
    const storedPassword = account.password;

    // Check if password uses colon format (salt:hash) or old format (salthash)
    let storedSalt, storedHash;

    if (storedPassword.includes(":")) {
      // New format: salt:hash
      const parts = storedPassword.split(":");
      if (parts.length !== 2) {
        return { error: "Invalid password format" };
      }
      storedSalt = parts[0];
      storedHash = parts[1];

      // Validate lengths
      if (storedSalt.length !== 64 || storedHash.length !== 128) {
        return { error: "Invalid password format" };
      }
    } else {
      // Old format: concatenated salt + hash
      if (storedPassword.length !== 192) {
        return { error: "Invalid password format" };
      }
      storedSalt = storedPassword.substring(0, 64);
      storedHash = storedPassword.substring(64);
    }

    // Convert salt from hex to buffer
    const saltBuffer = Buffer.from(storedSalt, "hex");

    // Compute hash for provided password
    const computedHash = crypto.pbkdf2Sync(
      password,
      saltBuffer,
      100000,
      64,
      "sha256"
    );
    const computedHashHex = computedHash.toString("hex");

    // Compare hashes
    const isValidPassword = computedHashHex === storedHash;

    if (!isValidPassword) {
      return { error: "Invalid credentials" };
    }

    // Clean up old sessions for this user
    await sql`
      DELETE FROM auth_sessions 
      WHERE "userId" = ${account.userId} 
      AND expires < NOW()
    `;

    // Create new session with proper format
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Insert the session
    await sql`
      INSERT INTO auth_sessions ("userId", expires, "sessionToken")
      VALUES (${account.userId}, ${expires}, ${sessionToken})
    `;

    // Verify the session was created
    const sessionCheck = await sql`
      SELECT s."userId", s.expires, s."sessionToken", u.id, u.name, u.email, u.image
      FROM auth_sessions s
      JOIN auth_users u ON s."userId" = u.id
      WHERE s."sessionToken" = ${sessionToken}
    `;

    if (sessionCheck.length === 0) {
      return { error: "Failed to create session" };
    }

    const sessionData = sessionCheck[0];

    // Store session in a global variable that getSession() can access
    global.currentSession = {
      user: {
        id: sessionData.id,
        name: sessionData.name,
        email: sessionData.email,
        image: sessionData.image,
      },
      sessionToken,
      expires: expires.toISOString(),
    };

    return {
      success: true,
      user: {
        id: sessionData.id,
        name: sessionData.name,
        email: sessionData.email,
        image: sessionData.image,
      },
      sessionToken,
      expires: expires.toISOString(),
      sessionCreated: true,
      userId: account.userId,
      // Return session data that can be stored in localStorage
      sessionData: {
        user: {
          id: sessionData.id,
          name: sessionData.name,
          email: sessionData.email,
          image: sessionData.image,
        },
        sessionToken,
        expires: expires.toISOString(),
      },
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return { error: "Authentication failed", details: error.message };
  }
}
export async function POST(request) {
  return handler(await request.json());
}