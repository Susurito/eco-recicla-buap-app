import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware to check if user is authenticated
 * @param request NextRequest object
 * @returns { user, session } if authenticated, null otherwise
 */
export async function getAuthSession(request?: NextRequest) {
  const session = await auth();
  return session;
}

/**
 * Middleware to protect API routes - requires authentication
 * Usage in route.ts: 
 * const session = await protectRoute();
 * if (!session) return NextResponse.json(..., { status: 401 });
 */
export async function protectRoute() {
  const session = await auth();
  
  if (!session || !session.user?.email) {
    return null;
  }
  
  return session;
}

/**
 * Helper to get current user's email
 */
export async function getCurrentUserEmail() {
  const session = await auth();
  return session?.user?.email || null;
}

/**
 * Helper to get current user's ID (from User model)
 */
export async function getCurrentUserId() {
  const session = await auth();
  // Note: NextAuth doesn't expose userId by default
  // We need to fetch it from the User model using email
  if (!session?.user?.email) return null;
  return session.user.id || null;
}

/**
 * Error response helper
 */
export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Success response helper
 */
export function successResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status });
}
