import { verifyStudentSession } from "@/lib/dal"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/students/me
 * Retrieves the current authenticated user's student profile
 */
export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated and is a student
    const session = await verifyStudentSession()

    // Get student profile
    let student = await prisma.student.findFirst({
      where: { userId: session.user.id },
    })

    // If student profile doesn't exist, create one
    if (!student) {
      // Generate a default boleta (student ID) from timestamp
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
 *
 * Request body:
 * {
 *   "ecoPoints"?: number,        // Add eco points
 *   "classifications"?: number,  // Add classifications
 *   "level"?: string             // Update level
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    // Verify user is authenticated and is a student
    const session = await verifyStudentSession()

    // Parse request body
    const body = await request.json().catch(() => ({}))
    const { ecoPoints, classifications, level } = body

    // Validate input
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
      return NextResponse.json(
        { error: "level must be a string" },
        { status: 400 }
      )
    }

    // Get student profile
    const student = await prisma.student.findFirst({
      where: { userId: session.user.id },
    })

    if (!student) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {}

    if (ecoPoints !== undefined) {
      updateData.ecoPoints = ecoPoints
    }

    if (classifications !== undefined) {
      updateData.classifications = classifications
    }

    if (level !== undefined) {
      updateData.level = level
    }

    // Update student profile
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
