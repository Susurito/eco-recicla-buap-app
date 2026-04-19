import { getSession } from "@/lib/dal"
import { prisma } from "@/lib/prisma"
import { validateUpdatePrizeInput } from "@/lib/validations/prize"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/prizes/[id]
 * Get a specific prize by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: "Prize ID is required" },
        { status: 400 }
      )
    }

    const prize = await prisma.prize.findUnique({
      where: { id },
    })

    if (!prize) {
      return NextResponse.json(
        { error: "Prize not found" },
        { status: 404 }
      )
    }

    console.log(`[prizes GET] Retrieved prize: ${prize.id}`)

    return NextResponse.json(
      {
        data: prize,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[prizes GET] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch prize" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/prizes/[id]
 * Update a specific prize (Admin only)
 *
 * Request body:
 * {
 *   "name"?: string,
 *   "description"?: string,
 *   "cost"?: number,
 *   "icon"?: string,
 *   "category"?: "internet" | "academic" | "cafeteria"
 * }
 */
export async function PUT(
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

    if (!id) {
      return NextResponse.json(
        { error: "Prize ID is required" },
        { status: 400 }
      )
    }

    // Check if prize exists
    const existingPrize = await prisma.prize.findUnique({
      where: { id },
    })

    if (!existingPrize) {
      return NextResponse.json(
        { error: "Prize not found" },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json().catch(() => ({}))

    // Validate input
    const validation = validateUpdatePrizeInput(body)
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
    if (body.name && body.name !== existingPrize.name) {
      const existingByName = await prisma.prize.findFirst({
        where: {
          name: {
            equals: body.name,
            mode: "insensitive",
          },
        },
      })

      if (existingByName) {
        return NextResponse.json(
          { error: "Ya existe un premio con este nombre" },
          { status: 409 }
        )
      }
    }

    // Update prize
    const updatedPrize = await prisma.prize.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.cost !== undefined && { cost: body.cost }),
        ...(body.icon !== undefined && { icon: body.icon }),
        ...(body.category !== undefined && { category: body.category }),
      },
    })

    console.log(`[prizes PUT] Updated prize: ${updatedPrize.id}`)

    return NextResponse.json(
      {
        message: "Prize updated successfully",
        prize: updatedPrize,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[prizes PUT] Error:", error)
    return NextResponse.json(
      { error: "Failed to update prize" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/prizes/[id]
 * Delete a specific prize (Admin only)
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

    if (!id) {
      return NextResponse.json(
        { error: "Prize ID is required" },
        { status: 400 }
      )
    }

    // Check if prize exists
    const existingPrize = await prisma.prize.findUnique({
      where: { id },
    })

    if (!existingPrize) {
      return NextResponse.json(
        { error: "Prize not found" },
        { status: 404 }
      )
    }

    // Delete prize
    await prisma.prize.delete({
      where: { id },
    })

    console.log(`[prizes DELETE] Deleted prize: ${id}`)

    return NextResponse.json(
      {
        message: "Prize deleted successfully",
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[prizes DELETE] Error:", error)
    return NextResponse.json(
      { error: "Failed to delete prize" },
      { status: 500 }
    )
  }
}
