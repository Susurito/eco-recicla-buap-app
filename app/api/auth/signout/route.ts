import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/signout
 * Signs out the current user and clears the session
 * Does NOT redirect - let client handle the redirect
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { message: "No active session" },
        { status: 200 }
      );
    }

    // Delete the session from database
    await prisma.session.deleteMany({
      where: {
        userId: session.user.id,
      },
    });

    // Clear the session cookie by setting maxAge to 0
    const response = NextResponse.json(
      { message: "Signed out successfully" },
      { status: 200 }
    );

    // Clear session cookie
    response.cookies.set("next-auth.session-token", "", {
      maxAge: 0,
      path: "/",
    });

    // Also clear secure version if in production
    response.cookies.set("__Secure-next-auth.session-token", "", {
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[auth/signout] Error:", error);
    return NextResponse.json(
      { error: "Failed to sign out" },
      { status: 500 }
    );
  }
}

