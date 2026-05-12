import { getSession } from "@/lib/dal"
import { ecoLevelTitleFromPoints } from "@/lib/eco-levels"
import { prisma } from "@/lib/prisma"
import type { Category } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"

const FILL_INCREMENT_PER_CORRECT = 5

// Points awarded by category (based on rarity analysis)
const POINTS_BY_CATEGORY = {
  papel: 10,
  plastico: 12,
  organico: 15,
  general: 20,
  carton: 11,
  vidrio: 18,
  metal: 25,
  basura: 5,
}

const validCategories = [
  "plastico",
  "papel",
  "organico",
  "general",
  "carton",
  "vidrio",
  "metal",
  "basura",
] as const

/**
 * POST /api/classifications
 * Save a classification and award eco points when correct.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - no active session" },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))

    const category =
      typeof body.category === "string" ? body.category.trim().toLowerCase() : ""
    if (!category || !validCategories.includes(category as (typeof validCategories)[number])) {
      return NextResponse.json(
        {
          error: "Invalid category",
          details: `Category must be one of: ${validCategories.join(", ")}`,
        },
        { status: 400 }
      )
    }

    if (typeof body.isCorrect !== "boolean") {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: "isCorrect must be a boolean",
        },
        { status: 400 }
      )
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      select: {
        boleta: true,
        ecoPoints: true,
        classifications: true,
      },
    })

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 })
    }

    let pointsAwarded = 0
    if (body.isCorrect) {
      pointsAwarded =
        POINTS_BY_CATEGORY[category as keyof typeof POINTS_BY_CATEGORY] || 10
    }

    const trashPointId =
      typeof body.trashPointId === "string" && body.trashPointId.length > 0
        ? body.trashPointId
        : null

    const result = await prisma.$transaction(async (tx) => {
      const classification = await tx.classificationRecord.create({
        data: {
          studentId: student.boleta,
          category: category as Category,
          isCorrect: body.isCorrect,
          predictedAs: body.predictedAs || null,
          selectedAs: body.selectedAs || null,
          confidence:
            typeof body.confidence === "number" && !Number.isNaN(body.confidence)
              ? body.confidence
              : null,
          trashPointId,
        },
      })

      const newEcoPoints = student.ecoPoints + pointsAwarded
      const newClassifications = student.classifications + (body.isCorrect ? 1 : 0)
      const newLevel = ecoLevelTitleFromPoints(newEcoPoints)

      if (pointsAwarded > 0) {
        await tx.ecoPointTransaction.create({
          data: {
            studentId: student.boleta,
            type: "classification",
            amount: pointsAwarded,
            source: classification.id,
            balanceBefore: student.ecoPoints,
            balanceAfter: newEcoPoints,
          },
        })
      }

      const updatedStudent = await tx.student.update({
        where: { boleta: student.boleta },
        data: {
          ecoPoints: newEcoPoints,
          classifications: newClassifications,
          level: newLevel,
        },
        select: {
          ecoPoints: true,
          classifications: true,
          level: true,
        },
      })

      let trashPointFillLevel: number | undefined

      if (body.isCorrect && trashPointId) {
        const tp = await tx.trashPoint.findUnique({
          where: { id: trashPointId },
          include: { todayStats: true },
        })
        if (tp) {
          const nextFill = Math.min(100, tp.fillLevel + FILL_INCREMENT_PER_CORRECT)
          await tx.trashPoint.update({
            where: { id: trashPointId },
            data: { fillLevel: nextFill },
          })
          trashPointFillLevel = nextFill

          const cat = category as Category
          const inc = {
            [cat]: { increment: 1 },
          } as Record<string, { increment: number }>

          if (tp.todayStats) {
            await tx.todayStats.update({
              where: { trashPointId },
              data: inc as object,
            })
          } else {
            await tx.todayStats.create({
              data: {
                trashPointId,
                plastico: cat === "plastico" ? 1 : 0,
                papel: cat === "papel" ? 1 : 0,
                organico: cat === "organico" ? 1 : 0,
                general: cat === "general" ? 1 : 0,
                carton: cat === "carton" ? 1 : 0,
                vidrio: cat === "vidrio" ? 1 : 0,
                metal: cat === "metal" ? 1 : 0,
                basura: cat === "basura" ? 1 : 0,
              },
            })
          }
        }
      }

      return {
        classification,
        student: updatedStudent,
        pointsAwarded,
        trashPointFillLevel,
      }
    })

    console.log(
      `[classifications POST] Student ${student.boleta} category=${category} correct=${body.isCorrect} +${result.pointsAwarded} pts`
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
          trashPointFillLevel: result.trashPointFillLevel,
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
