# WebView Token-Based Authentication Guide

## Overview
Users can now authenticate with JWT tokens passed via URL and use those tokens to access protected pages and APIs without re-logging in.

---

## 🔄 Authentication Flow

### Step 1: User Logs In
```javascript
// POST /api/signin-with-cookies
{
  "email": "user@example.com",
  "password": "password123"
}

// Response includes JWT token:
{
  "success": true,
  "sessionToken": "jwt-token-here...",
  "user": { "id": "1", "email": "...", "name": "..." }
}
```

### Step 2: Generate WebView URL with Token
```javascript
const jwtToken = responseData.sessionToken;

// Simple - just token, auto-redirects to /welcome
const webviewUrl = `https://yourdomain.com/webview?token=${jwtToken}`;

// Send this URL to mobile app or external client
```

**URL Parameters:**
- `token` (required) - JWT token from login response
- Automatically redirects to `/welcome` after token validation

### Step 3: WebView Validates Token & Redirects
- User opens URL in browser/WebView
- Token is validated at `/api/webview-auth?token=...`
- Token is stored in `localStorage` using token manager
- User is automatically redirected to `/welcome` page with valid token

### Step 4: Access Protected Pages/APIs with Token
Token is automatically sent in `Authorization` header for all requests

---

## 📱 Using Token-Based Auth in Frontend

### Option 1: Protect Pages with Hook
```jsx
"use client";

import { useTokenAuth } from "@/hooks/useTokenAuth";

export default function ProtectedPage() {
  const { user, loading, error } = useTokenAuth();

  if (loading) return <div>Loading...</div>;
  if (error || !user) return <div>Unauthorized</div>;

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      {/* Your protected content */}
    </div>
  );
}
```

### Option 2: Protect Pages with HOC
```jsx
"use client";

import { withTokenAuth } from "@/hooks/useTokenAuth";

function MyPage({ user }) {
  return (
    <div>
      <h1>Welcome, {user.name}</h1>
    </div>
  );
}

export default withTokenAuth(MyPage);
```

---

## 🌐 Making API Requests with Token

### Option 1: Use authenticatedFetch
```javascript
import { authenticatedFetch } from "@/utilities/token-manager";

// Token is automatically added to Authorization header
const response = await authenticatedFetch("/api/profile/get-data", {
  method: "GET",
});

const data = await response.json();
```

### Option 2: Manual Authorization Header
```javascript
import { getAuthHeader } from "@/utilities/token-manager";

const response = await fetch("/api/protected-endpoint", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": getAuthHeader(), // Returns "Bearer TOKEN..."
  },
  body: JSON.stringify({ /* data */ }),
});
```

### Option 3: Add Auth to Fetch Options
```javascript
import { addAuthToFetch } from "@/utilities/token-manager";

const options = addAuthToFetch({
  method: "POST",
  body: JSON.stringify({ data: "value" }),
});

const response = await fetch("/api/endpoint", options);
```

---

## 🔒 Protecting API Routes

### Update API Route to Accept JWT Tokens

```javascript
// src/app/api/protected-endpoint/route.js

import { NextResponse } from "next/server";
import { checkAuth } from "@/utilities/auth";

export async function GET(request) {
  // Now accepts both session tokens and JWT tokens in Authorization header
  const { session, error, tokenType } = await checkAuth(request);

  if (error) {
    return error; // Returns 401 Unauthorized
  }

  const userId = session.user.id;
  const tokenUsed = tokenType; // "jwt" or "session"

  console.log(`Request from user ${userId} using ${tokenUsed} token`);

  // Your API logic here
  return NextResponse.json({
    success: true,
    data: { /* your data */ },
  });
}
```

---

## 🧰 Token Manager API

### `storeToken(token, tokenType, user, expiresAt)`
Stores token and user data locally
```javascript
import { storeToken } from "@/utilities/token-manager";

storeToken(jwtToken, "jwt", userData, expiryDate);
```

### `getToken()`
Retrieves stored token
```javascript
import { getToken } from "@/utilities/token-manager";

const token = getToken();
```

### `getStoredUser()`
Retrieves user data
```javascript
import { getStoredUser } from "@/utilities/token-manager";

const user = getStoredUser();
```

### `isTokenValid()`
Checks if token is not expired
```javascript
import { isTokenValid } from "@/utilities/token-manager";

if (isTokenValid()) {
  // Token can be used
}
```

### `clearToken()`
Clears all stored tokens and user data
```javascript
import { clearToken } from "@/utilities/token-manager";

clearToken(); // Call on logout
```

### `getAuthHeader()`
Returns formatted Authorization header value
```javascript
import { getAuthHeader } from "@/utilities/token-manager";

const authValue = getAuthHeader(); // Returns "Bearer TOKEN..."
```

### `authenticatedFetch(url, options)`
Fetch wrapper that automatically adds Authorization header
```javascript
import { authenticatedFetch } from "@/utilities/token-manager";

const response = await authenticatedFetch("/api/data", {
  method: "GET",
});
```

---

## 📋 URL Examples

### WebView with JWT Token (Auto-Redirects to Welcome)
```
http://localhost:3000/webview?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsIm5hbWUiOiJKb2huIERvZSIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NzYxNDM0NDEsImV4cCI6MTc3NjE0NDM0MX0.RriufSaxLXq-sEUdI8TCbodYE5Yts-cVlrR1wHB3L2U
```
Validates token and automatically redirects to `/welcome` page.

### How It Works
1. Open URL with JWT token
2. Token is validated in 500ms
3. Token stored in localStorage
4. Auto-redirected to `/welcome`
5. User can now access all protected pages

### Access Protected Page with Token
```
http://localhost:3000/welcome (auto-accessed via redirect)
http://localhost:3000/chat (protected, requires valid token)
http://localhost:3000/profile (protected, requires valid token)
```

---

## 🔐 Token Types & Expiry

| Token Type | Expiry | Use Case |
|-----------|--------|----------|
| JWT (Access Token) | 15 minutes | WebView, API calls, short-lived sessions |
| Session Token | 30 days | Regular login, persistent sessions |

**Note:** JWT tokens expire faster for security. For long sessions, use session tokens.

---

## ✅ Testing

### Test WebView Authentication
```bash
# Get JWT token from login
curl -X POST http://localhost:3000/api/signin-with-cookies \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Open URL in browser
# http://localhost:3000/webview?token=YOUR_JWT_TOKEN
```

### Test API with JWT Token
```bash
curl http://localhost:3000/api/protected-endpoint \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🐛 Troubleshooting

### Token Not Persisting
- Check that localStorage is enabled in browser
- Check browser console for errors
- Verify token validation succeeded

### API Returns 401 Unauthorized
- Check token is being sent in Authorization header
- Verify token hasn't expired
- Check Authorization header format: `Bearer TOKEN...`

### Page Redirects to Login
- Token may have expired
- Token might not be stored properly
- Check middleware.js allows the route

---

## 📚 File Locations

| File | Purpose |
|------|---------|
| `/src/utilities/token-manager.js` | Token storage & retrieval |
| `/src/hooks/useTokenAuth.js` | Hook for protecting pages |
| `/src/utilities/auth.js` | API auth checking (updated) |
| `/src/middleware.js` | JWT token validation (updated) |
| `/src/app/api/webview-auth/route.js` | Token validation endpoint |
| `/src/app/webview/page.jsx` | WebView landing page |
