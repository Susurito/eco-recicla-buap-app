import { getSession } from "@/lib/dal"
import { prisma } from "@/lib/prisma"
import { validateUpdateInput } from "@/lib/validations/trash-point"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/trash-points/[id]
 * Get a single trash point by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const trashPoint = await prisma.trashPoint.findUnique({
      where: { id },
      include: {
        todayStats: true,
      },
    })

    if (!trashPoint) {
      return NextResponse.json(
        { error: "Trash point not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(trashPoint, { status: 200 })
  } catch (error) {
    console.error("[trash-points GET by ID] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch trash point" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/trash-points/[id]
 * Update a trash point (Admin only)
 *
 * Request body:
 * {
 *   "name"?: string,
 *   "lat"?: number,
 *   "lng"?: number,
 *   "detectedObject"?: string,
 *   "detectedImage"?: string,
 *   "category"?: "plastico" | "papel" | "organico" | "general",
 *   "fillLevel"?: number (0-100),
 *   "lastCollected"?: string,
 *   "alert"?: string | null
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify user is admin
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - no active session" },
        { status: 401 }
      )
    }
    
    if (session.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - admin access required" },
        { status: 403 }
      )
    }

    const { id } = params

    // Check if trash point exists
    const trashPoint = await prisma.trashPoint.findUnique({
      where: { id },
    })

    if (!trashPoint) {
      return NextResponse.json(
        { error: "Trash point not found" },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json().catch(() => ({}))

    // Validate input
    const validation = validateUpdateInput(body)
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validation.errors,
        },
        { status: 400 }
      )
    }

    // Check if new name already exists (if name is being updated)
    if (body.name !== undefined && body.name !== trashPoint.name) {
      const existingByName = await prisma.trashPoint.findFirst({
        where: {
          AND: [
            {
              name: {
                equals: body.name,
                mode: "insensitive",
              },
            },
            {
              id: { not: id },
            },
          ],
        },
      })

      if (existingByName) {
        return NextResponse.json(
          { error: "Ya existe un contenedor con este nombre" },
          { status: 409 }
        )
      }
    }

    // Check if new location already exists (if coordinates are being updated)
    if (
      (body.lat !== undefined || body.lng !== undefined) &&
      (body.lat !== trashPoint.lat || body.lng !== trashPoint.lng)
    ) {
      const newLat = body.lat !== undefined ? body.lat : trashPoint.lat
      const newLng = body.lng !== undefined ? body.lng : trashPoint.lng

      const existingByLocation = await prisma.trashPoint.findFirst({
        where: {
          AND: [
            { lat: newLat },
            { lng: newLng },
            { id: { not: id } },
          ],
        },
      })

      if (existingByLocation) {
        return NextResponse.json(
          { error: "Ya existe un contenedor en esta ubicación" },
          { status: 409 }
        )
      }
    }

    // Prepare update data (only include provided fields)
    const updateData: any = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.lat !== undefined) updateData.lat = body.lat
    if (body.lng !== undefined) updateData.lng = body.lng
    if (body.detectedObject !== undefined) updateData.detectedObject = body.detectedObject
    if (body.detectedImage !== undefined) updateData.detectedImage = body.detectedImage
    if (body.category !== undefined) updateData.category = body.category
    if (body.fillLevel !== undefined) updateData.fillLevel = body.fillLevel
    if (body.lastCollected !== undefined) updateData.lastCollected = body.lastCollected
    if (body.alert !== undefined) updateData.alert = body.alert

    // Update trash point
    const updatedTrashPoint = await prisma.trashPoint.update({
      where: { id },
      data: updateData,
      include: {
        todayStats: true,
      },
    })

    return NextResponse.json(
      {
        message: "Trash point updated successfully",
        trashPoint: updatedTrashPoint,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[trash-points PATCH] Error:", error)
    console.error("[trash-points PATCH] Error message:", error instanceof Error ? error.message : String(error))
    console.error("[trash-points PATCH] Stack:", error instanceof Error ? error.stack : "No stack available")
    return NextResponse.json(
      { error: "Failed to update trash point", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/trash-points/[id]
 * Delete a trash point (Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify user is admin
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - no active session" },
        { status: 401 }
      )
    }
    
    if (session.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - admin access required" },
        { status: 403 }
      )
    }

    const { id } = params

    // Check if trash point exists
    const trashPoint = await prisma.trashPoint.findUnique({
      where: { id },
    })

    if (!trashPoint) {
      return NextResponse.json(
        { error: "Trash point not found" },
        { status: 404 }
      )
    }

    // Delete trash point (TodayStats will be deleted due to onDelete: Cascade)
    await prisma.trashPoint.delete({
      where: { id },
    })

    return NextResponse.json(
      { message: "Trash point deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("[trash-points DELETE] Error:", error)
    return NextResponse.json(
      { error: "Failed to delete trash point" },
      { status: 500 }
    )
  }
}
