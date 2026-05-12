import { getSession } from "@/lib/dal"
import {
  nextEcoPointsMilestone,
  progressPercentWithinTier,
} from "@/lib/eco-levels"
import { prisma } from "@/lib/prisma"
import {
  consecutiveCorrectDaysStreak,
  datesWithCorrectClassifications,
} from "@/lib/streak"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/students/me
 * Perfil de estudiante, ranking y racha de días con clasificación correcta.
 */
export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let student = await prisma.student.findFirst({
      where: { userId: session.user.id },
    })

    if (!student) {
      const boleta = `EST${Date.now()}`
      student = await prisma.student.create({
        data: {
          boleta,
          userId: session.user.id,
          ecoPoints: 0,
          classifications: 0,
          level: "Principiante",
        },
      })
    }

    const totalStudents = await prisma.student.count()

    const rank =
      1 +
      (await prisma.student.count({
        where: { ecoPoints: { gt: student.ecoPoints } },
      }))

    const correctDates = await prisma.classificationRecord.findMany({
      where: { studentId: student.boleta, isCorrect: true },
      select: { createdAt: true },
    })

    const activityDates = datesWithCorrectClassifications(
      correctDates.map((r) => r.createdAt)
    )
    const consecutiveDays = consecutiveCorrectDaysStreak(activityDates)

    const nextMilestone = nextEcoPointsMilestone(student.ecoPoints)
    const tierProgress = progressPercentWithinTier(student.ecoPoints)

    return NextResponse.json(
      {
        student: {
          boleta: student.boleta,
          ecoPoints: student.ecoPoints,
          classifications: student.classifications,
          level: student.level,
          createdAt: student.createdAt,
          updatedAt: student.updatedAt,
        },
        ranking: {
          position: rank,
          totalStudents,
        },
        streak: {
          consecutiveCorrectDays: consecutiveDays,
        },
        levelProgress: {
          nextMilestoneEcoPoints: nextMilestone,
          percentTowardNextMilestone: tierProgress,
        },
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[students/me GET] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch student profile" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/students/me
 * Updates the current authenticated user's student profile
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { ecoPoints, classifications, level } = body

    if (ecoPoints !== undefined && (typeof ecoPoints !== "number" || ecoPoints < 0)) {
      return NextResponse.json(
        { error: "ecoPoints must be a non-negative number" },
        { status: 400 }
      )
    }

    if (
      classifications !== undefined &&
      (typeof classifications !== "number" || classifications < 0)
    ) {
      return NextResponse.json(
        { error: "classifications must be a non-negative number" },
        { status: 400 }
      )
    }

    if (level !== undefined && typeof level !== "string") {
      return NextResponse.json({ error: "level must be a string" }, { status: 400 })
    }

    const student = await prisma.student.findFirst({
      where: { userId: session.user.id },
    })

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}

    if (ecoPoints !== undefined) {
      updateData.ecoPoints = ecoPoints
    }

    if (classifications !== undefined) {
      updateData.classifications = classifications
    }

    if (level !== undefined) {
      updateData.level = level
    }

    const updatedStudent = await prisma.student.update({
      where: { boleta: student.boleta },
      data: updateData,
    })

    return NextResponse.json(
      {
        message: "Student profile updated successfully",
        student: {
          boleta: updatedStudent.boleta,
          ecoPoints: updatedStudent.ecoPoints,
          classifications: updatedStudent.classifications,
          level: updatedStudent.level,
          createdAt: updatedStudent.createdAt,
          updatedAt: updatedStudent.updatedAt,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[students/me PATCH] Error:", error)
    return NextResponse.json(
      { error: "Failed to update student profile" },
      { status: 500 }
    )
  }
}
