import { getSession } from "@/lib/dal"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/polygon-areas/[id]
 * Get a single polygon area
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const polygonArea = await prisma.polygonArea.findUnique({
      where: { id },
      include: {
        points: true,
      },
    })

    if (!polygonArea) {
      return NextResponse.json(
        { error: "Polygon area not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        data: polygonArea,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[polygon-areas GET] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch polygon area" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/polygon-areas/[id]
 * Update a polygon area (Admin only)
 *
 * Request body:
 * {
 *   "name"?: string,
 *   "description"?: string,
 *   "color"?: string
 * }
 *
 * Note: Points cannot be updated, only created/deleted
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
    const body = await request.json().catch(() => ({}))

    // Check if polygon area exists
    const existingArea = await prisma.polygonArea.findUnique({
      where: { id },
    })

    if (!existingArea) {
      return NextResponse.json(
        { error: "Polygon area not found" },
        { status: 404 }
      )
    }

    // If updating name, check for duplicates
    if (body.name && body.name !== existingArea.name) {
      const duplicateName = await prisma.polygonArea.findFirst({
        where: {
          AND: [
            { name: { equals: body.name, mode: "insensitive" } },
            { id: { not: id } },
          ],
        },
      })

      if (duplicateName) {
        return NextResponse.json(
          { error: "Ya existe un área con este nombre" },
          { status: 409 }
        )
      }
    }

    // Build update data with only provided fields
    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.color !== undefined) updateData.color = body.color
    if (body.description !== undefined) updateData.description = body.description

    // Update polygon area
    const updatedArea = await prisma.polygonArea.update({
      where: { id },
      data: updateData,
      include: {
        points: true,
      },
    })

    return NextResponse.json(
      {
        message: "Polygon area updated successfully",
        polygonArea: updatedArea,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[polygon-areas PATCH] Error:", error)
    return NextResponse.json(
      { error: "Failed to update polygon area" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/polygon-areas/[id]
 * Delete a polygon area (Admin only)
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

    // Check if polygon area exists
    const existingArea = await prisma.polygonArea.findUnique({
      where: { id },
    })

    if (!existingArea) {
      return NextResponse.json(
        { error: "Polygon area not found" },
        { status: 404 }
      )
    }

    // Delete polygon area (cascade delete will handle points)
    await prisma.polygonArea.delete({
      where: { id },
    })

    return NextResponse.json(
      {
        message: "Polygon area deleted successfully",
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[polygon-areas DELETE] Error:", error)
    return NextResponse.json(
      { error: "Failed to delete polygon area" },
      { status: 500 }
    )
  }
}
