import { getSession } from "@/lib/dal"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

// Points awarded by category (based on rarity analysis)
const POINTS_BY_CATEGORY = {
  papel: 10,
  plastico: 12,
  organico: 15,
  general: 20,
}

/**
 * POST /api/classifications
 * Save a classification and award eco points
 * 
 * Request body:
 * {
 *   "category": "papel" | "plastico" | "organico" | "general",
 *   "isCorrect": boolean,
 *   "predictedAs"?: string,
 *   "selectedAs"?: string,
 *   "confidence"?: number,
 *   "trashPointId"?: string
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

    // Validate category
    const validCategories = ["papel", "plastico", "organico", "general"]
    if (!body.category || !validCategories.includes(body.category)) {
      return NextResponse.json(
        {
          error: "Invalid category",
          details: `Category must be one of: ${validCategories.join(", ")}`,
        },
        { status: 400 }
      )
    }

    // Validate isCorrect
    if (typeof body.isCorrect !== "boolean") {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: "isCorrect must be a boolean",
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
        classifications: true,
      },
    })

    if (!student) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      )
    }

    // Only award points if classification is correct
    let pointsAwarded = 0
    if (body.isCorrect) {
      pointsAwarded = POINTS_BY_CATEGORY[body.category as keyof typeof POINTS_BY_CATEGORY] || 10
    }

    // Start transaction: Create classification record + update student points
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create classification record
      const classification = await tx.classificationRecord.create({
        data: {
          studentId: student.boleta,
          category: body.category,
          isCorrect: body.isCorrect,
          predictedAs: body.predictedAs || null,
          selectedAs: body.selectedAs || null,
          confidence: body.confidence || null,
          trashPointId: body.trashPointId || null,
        },
      })

      // 2. Create eco point transaction record
      const newBalance = student.ecoPoints + pointsAwarded
      const transaction = await tx.ecoPointTransaction.create({
        data: {
          studentId: student.boleta,
          type: "classification",
          amount: pointsAwarded,
          source: classification.id,
          balanceBefore: student.ecoPoints,
          balanceAfter: newBalance,
        },
      })

      // 3. Update student eco points and classifications count
      const updatedStudent = await tx.student.update({
        where: { boleta: student.boleta },
        data: {
          ecoPoints: newBalance,
          classifications: student.classifications + 1,
        },
        select: {
          ecoPoints: true,
          classifications: true,
          level: true,
        },
      })

      return {
        classification,
        transaction,
        student: updatedStudent,
        pointsAwarded,
      }
    })

    console.log(
      `[classifications POST] Student ${student.boleta} classified correctly: ${body.category}, awarded ${pointsAwarded} points`
    )

    return NextResponse.json(
      {
        message: "Classification recorded successfully",
        data: {
          classificationId: result.classification.id,
          pointsAwarded: result.pointsAwarded,
          studentEcoPoints: result.student.ecoPoints,
          studentClassifications: result.student.classifications,
          studentLevel: result.student.level,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[classifications POST] Error:", error)
    return NextResponse.json(
      { error: "Failed to save classification" },
      { status: 500 }
    )
  }
}
