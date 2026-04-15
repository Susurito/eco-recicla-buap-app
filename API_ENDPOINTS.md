# API Endpoints Documentation - Student & Auth

## Overview

This branch (`Valerdi`) implements the **Student Authentication & Session Management** endpoints for the Eco-Recicla BUAP application. All endpoints handle Google OAuth sessions via NextAuth.js and enforce user authentication.

---

## Architecture Changes

### Database Schema Updates

The `Student` model has been **linked to the `User` model** for proper authentication integration:

```prisma
model Student {
  boleta          String @id              // Student ID (e.g., "EST1234567890")
  userId          String @unique          // Foreign key to User
  user            User   @relation(...)   // Navigation property
  ecoPoints       Int    @default(0)      // Environmental points
  classifications Int    @default(0)      // Count of waste classifications
  level           String @default("Principiante")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model User {
  id              String
  email           String @unique
  name            String?
  image           String?
  student         Student?                // One-to-one relationship
  sessions        Session[]               // NextAuth sessions
  // ... other fields
}
```

**Key changes:**
- ✅ Student is now linked to User (1:1 relationship)
- ✅ Cascading deletes: deleting User also deletes Student
- ✅ Default values for eco-points and level
- ✅ Timestamps for audit trail

---

## Endpoints

### 1. Sign In (Google OAuth)

**Endpoint:** `POST /api/auth/signin`

**Description:** Initiates Google OAuth sign-in flow. Redirects user to Google login page.

**Request:**
```json
{
  "provider": "google",        // Optional, defaults to "google"
  "redirect": "/dashboard"     // Optional, URL to redirect after login
}
```

**Response (Success - 200):**
```json
{
  "message": "Redirecting to sign-in page..."
}
```

**Response (Error - 400/500):**
```json
{
  "error": "Provider is required (e.g., 'google')"
}
```

**Usage:**
```javascript
// Client-side (React)
const handleSignIn = async () => {
  const response = await fetch('/api/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'google', redirect: '/dashboard' })
  });
  // NextAuth handles the redirect automatically
};
```

---

### 2. Sign Out

**Endpoint:** `POST /api/auth/signout`

**Description:** Signs out the current user and clears all sessions.

**Request:**
```json
{
  "redirect": "/"  // Optional, URL to redirect after logout
}
```

**Response (Success - 200):**
```json
{
  "message": "Signed out successfully"
}
```

**Usage:**
```javascript
// Client-side
const handleSignOut = async () => {
  await fetch('/api/auth/signout', { method: 'POST' });
};
```

---

### 3. Refresh Session

**Endpoint:** `POST /api/auth/refresh`  
**Alternative:** `GET /api/auth/refresh`

**Description:** Refreshes the user's session token and returns current session info. Useful for keeping sessions alive and validating authentication.

**Request (POST):**
```json
{
  // Empty body - session is checked from cookies/headers
}
```

**Response (Success - 200):**
```json
{
  "message": "Session refreshed successfully",
  "session": {
    "user": {
      "id": "cuid_12345",
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "image": "https://..."
    },
    "expires": "2025-01-01T12:00:00Z"
  }
}
```

**Response (Unauthorized - 401):**
```json
{
  "error": "Unauthorized - No active session"
}
```

**Usage:**
```javascript
// Refresh session periodically
const refreshSession = async () => {
  const response = await fetch('/api/auth/refresh', { method: 'POST' });
  const data = await response.json();
  if (response.ok) {
    console.log('Session refreshed:', data.session);
  }
};

// Or just check current session
const getSession = async () => {
  const response = await fetch('/api/auth/refresh');
  return await response.json();
};
```

---

### 4. Get Current Student Profile

**Endpoint:** `GET /api/students/me`

**Description:** Fetches the current authenticated user's student profile. Auto-creates profile if it doesn't exist.

**Request:**
```
Authorization: Bearer <session-token>  // Handled automatically by NextAuth
```

**Response (Success - 200):**
```json
{
  "student": {
    "boleta": "EST1234567890",
    "userId": "cuid_12345",
    "ecoPoints": 250,
    "classifications": 42,
    "level": "Intermedio",
    "createdAt": "2025-04-14T22:00:00Z",
    "updatedAt": "2025-04-15T10:30:00Z"
  },
  "user": {
    "id": "cuid_12345",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "image": "https://..."
  }
}
```

**Response (Unauthorized - 401):**
```json
{
  "error": "Unauthorized - No active session"
}
```

**Response (User not found - 404):**
```json
{
  "error": "User not found"
}
```

**Usage:**
```javascript
// Fetch student profile
const getStudentProfile = async () => {
  const response = await fetch('/api/students/me');
  if (response.ok) {
    const data = await response.json();
    console.log('Student:', data.student);
  }
};
```

---

### 5. Update Student Profile

**Endpoint:** `PATCH /api/students/me`

**Description:** Updates the current user's student profile (eco-points, classifications, level).

**Request:**
```json
{
  "ecoPoints": 300,           // Optional: new eco-points value
  "classifications": 50,      // Optional: new classifications count
  "level": "Avanzado"         // Optional: new level name
}
```

**Response (Success - 200):**
```json
{
  "message": "Student profile updated successfully",
  "student": {
    "boleta": "EST1234567890",
    "userId": "cuid_12345",
    "ecoPoints": 300,
    "classifications": 50,
    "level": "Avanzado",
    "createdAt": "2025-04-14T22:00:00Z",
    "updatedAt": "2025-04-15T11:00:00Z"
  }
}
```

**Response (Validation Error - 400):**
```json
{
  "error": "ecoPoints must be a non-negative number"
}
```

**Response (Unauthorized - 401):**
```json
{
  "error": "Unauthorized - No active session"
}
```

**Usage:**
```javascript
// Update eco-points
const addEcoPoints = async (points) => {
  const response = await fetch('/api/students/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ecoPoints: points })
  });
  return await response.json();
};

// Update multiple fields
const updateStudent = async (updates) => {
  const response = await fetch('/api/students/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  return await response.json();
};
```

---

## Auth Utilities

All protected endpoints use the `lib/auth-utils.ts` helper functions:

```typescript
// Check if user is authenticated and get session
const session = await protectRoute();
if (!session) {
  return errorResponse("Unauthorized", 401);
}

// Get current user's email
const email = await getCurrentUserEmail();

// Send error response
return errorResponse("Invalid input", 400);

// Send success response
return successResponse({ data: {...} }, 200);
```

---

## Security

- ✅ All endpoints require active NextAuth session
- ✅ Session tokens are stored in httpOnly cookies (secure by default)
- ✅ Google OAuth handles password security
- ✅ Cascading deletes prevent orphaned data
- ✅ User email is the primary identifier for lookups
- ✅ CSRF protection via NextAuth

---

## Testing

### Prerequisites
- Database running and migrated
- NextAuth configured with Google OAuth
- Valid `.env.local` with `NEXTAUTH_SECRET`, `DATABASE_URL`, and Google OAuth keys

### Test with cURL

```bash
# 1. Check if you have a session (before login, this will fail)
curl -X GET http://localhost:3000/api/students/me

# 2. After logging in via UI, refresh the session
curl -X POST http://localhost:3000/api/auth/refresh

# 3. Get student profile
curl -X GET http://localhost:3000/api/students/me

# 4. Update eco-points
curl -X PATCH http://localhost:3000/api/students/me \
  -H "Content-Type: application/json" \
  -d '{"ecoPoints": 500}'

# 5. Sign out
curl -X POST http://localhost:3000/api/auth/signout
```

### Test with JavaScript/Fetch

```javascript
// In browser console after login
const response = await fetch('/api/students/me');
const data = await response.json();
console.log(data);
```

---

## Frontend Integration

The endpoints are ready to be consumed by React components. Update the components to use these endpoints:

### Example: StudentDashboard Component

```typescript
import { useEffect, useState } from 'react';

export function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch student profile
    fetch('/api/students/me')
      .then(res => res.json())
      .then(data => setStudent(data.student))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!student) return <div>No student found</div>;

  return (
    <div>
      <h1>{student.boleta}</h1>
      <p>Eco-Points: {student.ecoPoints}</p>
      <p>Classifications: {student.classifications}</p>
      <p>Level: {student.level}</p>
    </div>
  );
}
```

---

## Next Steps

Once this branch is reviewed and merged:

1. **Remove mock data** from `lib/data.ts` and component state
2. **Connect components** to these endpoints
3. **Implement classification endpoints** (`/api/classifications`)
4. **Implement prize endpoints** (`/api/prizes`)
5. **Implement trash point endpoints** (`/api/trash-points`)
6. **Add error handling** and loading states in UI

---

## Files Created/Modified

```
✨ New Files:
  - app/api/auth/signin/route.ts
  - app/api/auth/signout/route.ts
  - app/api/auth/refresh/route.ts
  - app/api/students/me/route.ts
  - lib/auth-utils.ts
  - prisma/migrations/20260414_link_student_to_user/migration.sql

📝 Modified Files:
  - prisma/schema.prisma (Student model linked to User)
```

---

## Questions?

For issues or questions about these endpoints, check:
- `auth.ts` for NextAuth configuration
- `lib/prisma.ts` for database client setup
- `.env.example` for required environment variables
