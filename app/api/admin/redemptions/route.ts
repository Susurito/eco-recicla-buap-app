import { getSession } from "@/lib/dal"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/admin/redemptions/validate
 * Validate and claim a prize redemption (admin scans QR)
 * 
 * Request body:
 * {
 *   "qrCode": string // The redemption code from QR
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Get current user session
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - no active session" },
        { status: 401 }
      )
    }

    // Check if user is admin
    if (session.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - admin access required" },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json().catch(() => ({}))

    if (!body.qrCode || typeof body.qrCode !== "string") {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: "qrCode is required and must be a string",
        },
        { status: 400 }
      )
    }

    // Find redemption by QR code
    const redemption = await prisma.prizeRedemption.findUnique({
      where: { qrCode: body.qrCode },
      include: {
        prize: true,
        student: {
          select: {
            boleta: true,
          },
        },
      },
    })

    if (!redemption) {
      return NextResponse.json(
        { error: "Redemption not found" },
        { status: 404 }
      )
    }

    // Check if already claimed
    if (redemption.status === "claimed") {
      return NextResponse.json(
        {
          error: "Redemption already claimed",
          details: `This prize was already claimed on ${redemption.claimedAt?.toISOString()}`,
        },
        { status: 409 }
      )
    }

    // Check if expired
    const now = new Date()
    if (now > redemption.expiresAt) {
      // Mark as expired
      await prisma.prizeRedemption.update({
        where: { id: redemption.id },
        data: { status: "expired" },
      })

      return NextResponse.json(
        {
          error: "Redemption expired",
          details: `This redemption expired on ${redemption.expiresAt.toISOString()}`,
        },
        { status: 410 } // Gone
      )
    }

    // Mark as claimed
    const claimedRedemption = await prisma.prizeRedemption.update({
      where: { id: redemption.id },
      data: {
        status: "claimed",
        claimedAt: now,
      },
    })

    console.log(
      `[admin redemptions POST] Admin validated redemption: ${body.qrCode}, student: ${redemption.student.boleta}, prize: ${redemption.prize.name}`
    )

    return NextResponse.json(
      {
        message: "Redemption validated successfully",
        data: {
          redemptionId: claimedRedemption.id,
          prizeId: redemption.prize.id,
          prizeName: redemption.prize.name,
          studentId: redemption.student.boleta,
          claimedAt: claimedRedemption.claimedAt?.toISOString(),
          status: claimedRedemption.status,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[admin redemptions POST] Error:", error)
    return NextResponse.json(
      { error: "Failed to validate redemption" },
      { status: 500 }
    )
  }
}
