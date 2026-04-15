import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { protectRoute, errorResponse, successResponse } from "@/lib/auth-utils";

/**
 * POST /api/auth/refresh
 * Refreshes the user's session and token
 * NextAuth handles token refresh automatically, but this endpoint
 * allows explicit refresh requests and returns current session info
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await protectRoute();
    if (!session) {
      return errorResponse("Unauthorized - No active session", 401);
    }

    // Get fresh session data
    const freshSession = await auth();

    if (!freshSession) {
      return errorResponse("Failed to refresh session", 401);
    }

    // Return refreshed session information
    return successResponse(
      {
        message: "Session refreshed successfully",
        session: {
          user: {
            id: freshSession.user?.id,
            name: freshSession.user?.name,
            email: freshSession.user?.email,
            image: freshSession.user?.image,
          },
          expires: freshSession.expires,
        },
      },
      200
    );
  } catch (error) {
    console.error("[auth/refresh] Error:", error);
    return errorResponse("Failed to refresh session", 500);
  }
}

/**
 * GET /api/auth/refresh
 * Optional: Get current session without refreshing
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return errorResponse("No active session", 401);
    }

    return successResponse(
      {
        session: {
          user: {
            id: session.user?.id,
            name: session.user?.name,
            email: session.user?.email,
            image: session.user?.image,
          },
          expires: session.expires,
        },
      },
      200
    );
  } catch (error) {
    console.error("[auth/refresh GET] Error:", error);
    return errorResponse("Failed to fetch session", 500);
  }
}
