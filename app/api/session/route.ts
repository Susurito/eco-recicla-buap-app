import { getSession } from "@/lib/dal"
import { NextResponse } from "next/server"

/**
 * GET /api/session
 * Returns the current session or null if not authenticated
 * Public endpoint used by SessionProvider to verify session state
 */
export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(null, { status: 200 })
    }

    return NextResponse.json(session, { status: 200 })
  } catch (error) {
    console.error("Error fetching session:", error)
    return NextResponse.json(null, { status: 200 })
  }
}
