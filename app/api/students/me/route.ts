import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { protectRoute, errorResponse, successResponse } from "@/lib/auth-utils";

/**
 * GET /api/students/me
 * Retrieves the current authenticated user's student profile
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await protectRoute();
    if (!session || !session.user?.email) {
      return errorResponse("Unauthorized - No active session", 401);
    }

    // Get user from database by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return errorResponse("User not found", 404);
    }

    // Get student profile
    let student = await prisma.student.findFirst({
      where: { userId: user.id },
    });

    // If student profile doesn't exist, create one
    if (!student) {
      // Generate a default boleta (student ID) from timestamp
      const boleta = `EST${Date.now()}`;

      student = await prisma.student.create({
        data: {
          boleta,
          userId: user.id,
          ecoPoints: 0,
          classifications: 0,
          level: "Principiante",
        },
      });
    }

    return successResponse(
      {
        student: {
          boleta: student.boleta,
          userId: student.userId,
          ecoPoints: student.ecoPoints,
          classifications: student.classifications,
          level: student.level,
          createdAt: student.createdAt,
          updatedAt: student.updatedAt,
        },
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
      },
      200
    );
  } catch (error) {
    console.error("[students/me GET] Error:", error);
    return errorResponse("Failed to fetch student profile", 500);
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
    // Check authentication
    const session = await protectRoute();
    if (!session || !session.user?.email) {
      return errorResponse("Unauthorized - No active session", 401);
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { ecoPoints, classifications, level } = body;

    // Validate input
    if (
      ecoPoints !== undefined &&
      (typeof ecoPoints !== "number" || ecoPoints < 0)
    ) {
      return errorResponse("ecoPoints must be a non-negative number", 400);
    }

    if (
      classifications !== undefined &&
      (typeof classifications !== "number" || classifications < 0)
    ) {
      return errorResponse("classifications must be a non-negative number", 400);
    }

    if (level !== undefined && typeof level !== "string") {
      return errorResponse("level must be a string", 400);
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return errorResponse("User not found", 404);
    }

    // Get student profile
    const student = await prisma.student.findFirst({
      where: { userId: user.id },
    });

    if (!student) {
      return errorResponse("Student profile not found", 404);
    }

    // Prepare update data
    const updateData: any = {};

    if (ecoPoints !== undefined) {
      updateData.ecoPoints = ecoPoints;
    }

    if (classifications !== undefined) {
      updateData.classifications = classifications;
    }

    if (level !== undefined) {
      updateData.level = level;
    }

    // Update student profile
    const updatedStudent = await prisma.student.update({
      where: { boleta: student.boleta },
      data: updateData,
    });

    return successResponse(
      {
        message: "Student profile updated successfully",
        student: {
          boleta: updatedStudent.boleta,
          userId: updatedStudent.userId,
          ecoPoints: updatedStudent.ecoPoints,
          classifications: updatedStudent.classifications,
          level: updatedStudent.level,
          createdAt: updatedStudent.createdAt,
          updatedAt: updatedStudent.updatedAt,
        },
      },
      200
    );
  } catch (error) {
    console.error("[students/me PATCH] Error:", error);
    return errorResponse("Failed to update student profile", 500);
  }
}
