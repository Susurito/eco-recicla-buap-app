import { getSession } from "@/lib/dal"
import { prisma } from "@/lib/prisma"
import { validateUpdateCategoryInput } from "@/lib/validations/category"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/categories/[id]
 * Get a specific category by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      )
    }

    const category = await prisma.prizeCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { prizes: true }
        }
      }
    })

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      )
    }

    console.log(`[categories GET by ID] Retrieved category: ${category.id}`)

    return NextResponse.json(
      {
        data: category,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[categories GET by ID] Error:", error)
    console.error("[categories GET by ID] Error details:", error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { 
        error: "Failed to fetch category",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/categories/[id]
 * Update a specific category (Admin only)
 *
 * Request body:
 * {
 *   "name"?: string,
 *   "description"?: string,
 *   "color"?: string (hex color code)
 * }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      )
    }

    // Check if category exists
    const existingCategory = await prisma.prizeCategory.findUnique({
      where: { id },
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json().catch(() => ({}))

    // Validate input
    const validation = validateUpdateCategoryInput(body)
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
    if (body.name && body.name.trim() !== existingCategory.name) {
      const existingByName = await prisma.prizeCategory.findUnique({
        where: { name: body.name.trim() },
      })

      if (existingByName) {
        return NextResponse.json(
          { error: "Ya existe una categoría con este nombre" },
          { status: 409 }
        )
      }
    }

    // Update category
    const updatedCategory = await prisma.prizeCategory.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.description !== undefined && { description: body.description.trim() || null }),
        ...(body.color !== undefined && { color: body.color.trim() }),
      },
      include: {
        _count: {
          select: { prizes: true }
        }
      }
    })

    console.log(`[categories PUT] Updated category: ${updatedCategory.id}`)

    return NextResponse.json(
      {
        message: "Category updated successfully",
        data: updatedCategory,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[categories PUT] Error:", error)
    console.error("[categories PUT] Error details:", error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { 
        error: "Failed to update category",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/categories/[id]
 * Delete a specific category (Admin only)
 * 
 * Note: Cannot delete if category has prizes associated with it
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      )
    }

    // Check if category exists
    const existingCategory = await prisma.prizeCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { prizes: true }
        }
      }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      )
    }

    // Check if category has prizes
    if (existingCategory._count.prizes > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete category with associated prizes",
          details: `Esta categoría tiene ${existingCategory._count.prizes} premio(s) asociado(s). Elimine los premios primero.`
        },
        { status: 409 }
      )
    }

    // Delete category
    await prisma.prizeCategory.delete({
      where: { id },
    })

    console.log(`[categories DELETE] Deleted category: ${id}`)

    return NextResponse.json(
      { message: "Category deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("[categories DELETE] Error:", error)
    console.error("[categories DELETE] Error details:", error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { 
        error: "Failed to delete category",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
