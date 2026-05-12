import { getSession } from "@/lib/dal"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import QRCode from "qrcode"

/**
 * Generate QR code with embedded image
 * Since server-side image embedding is complex with qrcode library,
 * we'll generate the QR code and embed image on client side
 * This function generates the QR data
 */
async function generateQRCode(data: string): Promise<string> {
  try {
    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "H", // High error correction for logo overlay
    })
    return qrDataUrl
  } catch (error) {
    console.error("Error generating QR code:", error)
    throw error
  }
}

/**
 * Generate unique redemption code
 */
function generateRedemptionCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `ECO-${timestamp}-${random}`
}

/**
 * POST /api/students/me/redeem
 * Redeem a prize with eco points
 * 
 * Request body:
 * {
 *   "prizeId": string
 * }
 * 
 * Response:
 * {
 *   "redemptionId": string,
 *   "qrCode": string (data URL),
 *   "expiresAt": ISO string,
 *   "ecoPointsRemaining": number
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

    // Parse request body
    const body = await request.json().catch(() => ({}))

    if (!body.prizeId || typeof body.prizeId !== "string") {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: "prizeId is required and must be a string",
        },
        { status: 400 }
      )
    }

    // Get student profile
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      select: {
        boleta: true,
        ecoPoints: true,
      },
    })

    if (!student) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      )
    }

    // Get prize details
    const prize = await prisma.prize.findUnique({
      where: { id: body.prizeId },
      select: {
        id: true,
        name: true,
        cost: true,
        icon: true,
      },
    })

    if (!prize) {
      return NextResponse.json(
        { error: "Prize not found" },
        { status: 404 }
      )
    }

    // Check if student has enough eco points
    if (student.ecoPoints < prize.cost) {
      return NextResponse.json(
        {
          error: "Insufficient eco points",
          details: `You need ${prize.cost} points but have ${student.ecoPoints}`,
          ecoPointsNeeded: prize.cost - student.ecoPoints,
        },
        { status: 402 } // Payment Required
      )
    }

    // Generate unique code
    const redemptionCode = generateRedemptionCode()

    // Generate QR code
    const qrDataUrl = await generateQRCode(
      JSON.stringify({
        code: redemptionCode,
        prizeId: prize.id,
        prizeName: prize.name,
        studentId: student.boleta,
      })
    )

    // Calculate expiration (24 hours from now)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    // Start transaction: Create redemption + deduct points
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create redemption record
      const redemption = await tx.prizeRedemption.create({
        data: {
          studentId: student.boleta,
          prizeId: prize.id,
          qrCode: redemptionCode,
          qrImageUrl: qrDataUrl,
          expiresAt,
        },
      })

      // 2. Create eco point transaction record
      const newBalance = student.ecoPoints - prize.cost
      const transaction = await tx.ecoPointTransaction.create({
        data: {
          studentId: student.boleta,
          type: "redemption",
          amount: -prize.cost,
          source: redemption.id,
          balanceBefore: student.ecoPoints,
          balanceAfter: newBalance,
        },
      })

      // 3. Update student eco points
      const updatedStudent = await tx.student.update({
        where: { boleta: student.boleta },
        data: {
          ecoPoints: newBalance,
        },
        select: {
          ecoPoints: true,
        },
      })

      return {
        redemption,
        transaction,
        student: updatedStudent,
      }
    })

    console.log(
      `[redeem POST] Student ${student.boleta} redeemed prize ${prize.name} (${prize.id}), code: ${redemptionCode}`
    )

    return NextResponse.json(
      {
        message: "Prize redeemed successfully",
        data: {
          redemptionId: result.redemption.id,
          prizeId: prize.id,
          prizeName: prize.name,
          qrCode: qrDataUrl,
          redemptionCode,
          expiresAt: expiresAt.toISOString(),
          ecoPointsRemaining: result.student.ecoPoints,
          status: "active",
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[redeem POST] Error:", error)
    return NextResponse.json(
      { error: "Failed to redeem prize" },
      { status: 500 }
    )
  }
}
