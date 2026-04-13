import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key-change-this-in-production";

/**
 * Generate JWT Access Token (short-lived, 15 minutes)
 */
export function generateAccessToken(userId, email, name) {
  return jwt.sign(
    {
      userId,
      email,
      name,
      type: "access",
    },
    JWT_SECRET,
    { expiresIn: "15m" } // 15 minutes
  );
}

/**
 * Generate JWT Refresh Token (long-lived, 30 days)
 */
export function generateRefreshToken(userId, email) {
  return jwt.sign(
    {
      userId,
      email,
      type: "refresh",
    },
    JWT_REFRESH_SECRET,
    { expiresIn: "30d" } // 30 days
  );
}

/**
 * Verify Access Token
 */
export function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== "access") {
      return null;
    }
    return decoded;
  } catch (error) {
    console.error("Access token verification failed:", error.message);
    return null;
  }
}

/**
 * Verify Refresh Token
 */
export function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    if (decoded.type !== "refresh") {
      return null;
    }
    return decoded;
  } catch (error) {
    console.error("Refresh token verification failed:", error.message);
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(headerValue) {
  if (!headerValue || !headerValue.startsWith("Bearer ")) {
    return null;
  }
  return headerValue.substring(7); // Remove "Bearer " prefix
}
