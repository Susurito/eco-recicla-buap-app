# Eco-Recicla BUAP - Session & Authentication Architecture

## Overview

This document explains how session persistence, authentication, and data fetching work in the application.

## Key Components

### 1. SessionProvider (`lib/session-context.tsx`)
- **Purpose**: Manages session state globally across the app
- **Location**: Wraps entire app in `app/layout.tsx`
- **Behavior**:
  - Fetches `/api/session` on initial page load
  - Auto-refreshes every 5 minutes
  - Listens for logout signals via StorageEvent (cross-tab sync)
  - Provides `useSession()` hook for client components
  - Returns: `{ session, loading, refetch }`

### 2. Session Endpoint (`app/api/session/route.ts`)
- **Purpose**: Public endpoint to check if user is logged in
- **Returns**: 
  - `SessionData` object if user is authenticated
  - `null` (200 OK) if not authenticated
- **Security**: Only returns session data from authenticated requests

### 3. Home Page (`/`)
- **Type**: Server-rendered with client-side enhancements
- **Route**: Protected by SessionProvider (not by proxy.ts)
- **Features**:
  - Public map visible to everyone
  - User profile section only shows for authenticated users
  - Dashboard link only appears for authenticated users
  - Shows loading spinner while verifying session

### 4. Dashboard (`/dashboard`)
- **Type**: Server-rendered (async page)
- **Protection**: Server-side check with `getSession()` → redirect to `/login` if not authenticated
- **Benefits**: Cannot be bypassed, works without JavaScript

### 5. Login Page (`/login`)
- **Type**: Server-rendered
- **Route**: Accessible by everyone
- **Behavior**: Uses NextAuth for Google OAuth

## Data Flow

### Public Visitor (Unauthenticated)
```
1. Visit home page → SessionProvider loads
2. SessionProvider calls /api/session
3. Returns: null (user not authenticated)
4. UI shows: Map + "Iniciar sesión" button
5. NO /api/students/me fetch (important!)
```

### Authenticated User on Home Page
```
1. Visit home page → SessionProvider loads
2. SessionProvider calls /api/session
3. Returns: SessionData with user info
4. eco-recicla-app detects session exists
5. Fetches /api/students/me for ecoPoints
6. UI shows: Map + User profile + Dashboard link
```

### User Navigating to Dashboard
```
1. Click "Panel" or navigate /dashboard
2. Server checks getSession() (server-side)
3. If authenticated: Render dashboard
4. If not: Redirect to /login (no client-side surprise)
```

### User Logging Out
```
1. Click logout button on dashboard
2. POST /api/auth/signout
3. Session deleted from database
4. Session cookies cleared
5. localStorage "auth-logout-signal" set
6. SessionProvider detects storage change
7. Session cleared in all tabs
8. UI updates across all open tabs
```

## Important Design Decisions

### ✅ SessionProvider fetches on every page load
**Why**: Necessary for session persistence across browser restarts

### ✅ /api/students/me ONLY fetched for logged-in users
**Why**: 
- Reduces API load
- Improves performance for public visitors
- Respects user privacy

### ✅ Dashboard protected server-side
**Why**: 
- Cannot be bypassed with JavaScript disabled
- Better security
- Cleaner redirect logic

### ✅ Home page NOT protected in proxy.ts
**Why**: 
- Page is genuinely public for map viewing
- Authentication is handled by SessionProvider conditionally
- Allows public + authenticated users same entry point

### ✅ LogoutButton signals other tabs
**Why**:
- StorageEvent for browser compatibility
- BroadcastChannel for better performance
- Ensures logout is synchronized everywhere

## File Structure

```
lib/
├── session-context.tsx       # SessionProvider + useSession hook
├── dal.ts                    # getSession(), verifySession() functions
└── prisma.ts                # Database client

app/
├── layout.tsx               # Wraps with SessionProvider
├── page.tsx                 # Home page component
├── dashboard/
│   └── page.tsx            # Server-side auth check
└── api/
    ├── session/route.ts    # Check session endpoint
    ├── students/me/route.ts # Get user student data
    └── auth/
        └── signout/route.ts # Logout endpoint

components/
├── eco-recicla-app.tsx      # Home page (uses useSession hook)
└── dashboard-client.tsx     # Dashboard UI (with LogoutButton)

auth.ts                       # NextAuth configuration
```

## Cookie Configuration

**Session Cookie** (`next-auth.session-token`)
- `httpOnly: true` - Cannot be accessed by JavaScript (prevents XSS)
- `sameSite: "lax"` - Protection against CSRF
- `secure: true` (production only) - Only sent over HTTPS
- `maxAge: 30 days` - Session validity period

## Debugging

### Browser Console Logs
- `[SessionProvider] User session verified` - User logged in
- `[SessionProvider] Public visitor - no session` - Anonymous user
- `[EcoReciclaBUAP] User logged in, fetching student data` - Fetching user data
- `[EcoReciclaBUAP] Public visitor - no session` - Public page without login

### Network Tab
- **Public visitor**: 1 API call (/api/session)
- **Logged-in user**: 2 API calls (/api/session + /api/students/me)

### Session Verification
To check current session in browser console:
```javascript
const response = await fetch('/api/session');
const session = await response.json();
console.log(session); // null or SessionData object
```

## Security Considerations

1. ✅ No sensitive data exposed in URLs
2. ✅ Sessions stored server-side (database)
3. ✅ Cookies httpOnly (cannot be stolen by JavaScript)
4. ✅ CSRF protection via sameSite
5. ✅ Logout properly clears all sessions
6. ✅ Dashboard protected on server (not client-side only)

## Performance Optimizations

1. ✅ SessionProvider auto-refreshes only every 5 minutes (not every request)
2. ✅ Public visitors don't fetch user data
3. ✅ BroadcastChannel for instant cross-tab updates
4. ✅ Conditional rendering prevents unnecessary component mounts
5. ✅ Lazy loading of map component

## Future Improvements

- [ ] Add session expiry toast notification
- [ ] Add "remember me" option
- [ ] Session activity tracking
- [ ] Two-factor authentication
- [ ] Session management page (see active sessions)
- [ ] Rate limiting on /api/session endpoint
