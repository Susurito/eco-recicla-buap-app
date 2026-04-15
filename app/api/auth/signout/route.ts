import { signOut } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/signout
 * Signs out the current user and clears all sessions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { redirect = "/" } = body;

    // Sign out user - this clears the session
    await signOut({
      redirectTo: redirect,
    });

    return NextResponse.json(
      { message: "Signed out successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[auth/signout] Error:", error);
    return NextResponse.json(
      { error: "Failed to sign out" },
      { status: 500 }
    );
  }
}
