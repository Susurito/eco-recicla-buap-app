import { getSession } from "@/lib/dal"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/students/me/redemptions
 * Get student's prize redemption history
 * 
 * Query params:
 * - status: "all" | "active" | "claimed" | "expired" (default: "all")
 * - limit: number (default: 20)
 * - offset: number (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user session
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - no active session" },
        { status: 401 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status") || "all"
    const limit = parseInt(searchParams.get("limit") || "20", 10)
    const offset = parseInt(searchParams.get("offset") || "0", 10)

    // Validate limit and offset
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Invalid limit (must be between 1 and 100)" },
        { status: 400 }
      )
    }

    if (offset < 0) {
      return NextResponse.json(
        { error: "Invalid offset (must be >= 0)" },
        { status: 400 }
      )
    }

    // Get student
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      select: { boleta: true },
    })

    if (!student) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      )
    }

    // Build query filter
    const whereFilter: any = {
      studentId: student.boleta,
    }

    if (status !== "all") {
      const validStatuses = ["active", "claimed", "expired"]
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
          { status: 400 }
        )
      }
      whereFilter.status = status
    }

    // Get total count
    const total = await prisma.prizeRedemption.count({
      where: whereFilter,
    })

    // Get redemptions with prize details
    const redemptions = await prisma.prizeRedemption.findMany({
      where: whereFilter,
      include: {
        prize: {
          select: {
            id: true,
            name: true,
            description: true,
            cost: true,
            icon: true,
            category: {
              select: {
                name: true,
                color: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    })

    // Format response
    const formattedRedemptions = redemptions.map((r) => ({
      id: r.id,
      prize: r.prize,
      qrCode: r.qrCode,
      // Only return QR image if not yet claimed (for security)
      qrImageUrl: r.status === "active" && !r.claimedAt ? r.qrImageUrl : null,
      status: r.status,
      expiresAt: r.expiresAt.toISOString(),
      claimedAt: r.claimedAt?.toISOString() || null,
      createdAt: r.createdAt.toISOString(),
    }))

    console.log(
      `[redemptions GET] Student ${student.boleta} retrieved ${redemptions.length} redemptions`
    )

    return NextResponse.json(
      {
        data: formattedRedemptions,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[redemptions GET] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch redemptions" },
      { status: 500 }
    )
  }
}
