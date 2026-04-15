import { signIn } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/signin
 * Initiates Google OAuth sign-in flow
 * Redirects to Google login page
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { provider = "google", redirect = "/dashboard" } = body;

    if (!provider) {
      return NextResponse.json(
        { error: "Provider is required (e.g., 'google')" },
        { status: 400 }
      );
    }

    // Trigger NextAuth sign-in flow
    // This will redirect to the provider's login page
    await signIn(provider, {
      redirectTo: redirect,
    });

    return NextResponse.json(
      { message: "Redirecting to sign-in page..." },
      { status: 200 }
    );
  } catch (error) {
    console.error("[auth/signin] Error:", error);
    return NextResponse.json(
      { error: "Failed to initiate sign-in" },
      { status: 500 }
    );
  }
}
