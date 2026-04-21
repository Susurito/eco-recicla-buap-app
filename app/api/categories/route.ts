import { getSession } from "@/lib/dal"
import { prisma } from "@/lib/prisma"
import { validateCreateCategoryInput } from "@/lib/validations/category"
import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/categories
 * Create a new prize category (Admin only)
 *
 * Request body:
 * {
 *   "name": string,
 *   "description"?: string,
 *   "color"?: string (hex color code)
 * }
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json().catch(() => ({}))

    // Validate input
    const validation = validateCreateCategoryInput(body)
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validation.errors,
        },
        { status: 400 }
      )
    }

    // Check if category with same name already exists
    const existingByName = await prisma.prizeCategory.findUnique({
      where: { name: body.name.trim() },
    })

    if (existingByName) {
      return NextResponse.json(
        { error: "Ya existe una categoría con este nombre" },
        { status: 409 }
      )
    }

    // Create category
    const category = await prisma.prizeCategory.create({
      data: {
        name: body.name.trim(),
        description: body.description ? body.description.trim() : undefined,
        color: body.color || "#3b82f6",
      },
    })

    console.log(`[categories POST] Created category: ${category.id}`)

    return NextResponse.json(
      {
        message: "Category created successfully",
        data: category,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[categories POST] Error:", error)
    console.error("[categories POST] Error details:", error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { 
        error: "Failed to create category",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/categories
 * List all prize categories
 *
 * Query parameters:
 * - limit?: number (default: 100, max: 100)
 * - offset?: number (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 100)
    const offset = parseInt(searchParams.get("offset") || "0")

    // Get total count
    const total = await prisma.prizeCategory.count()

    // Get categories with pagination
    const categories = await prisma.prizeCategory.findMany({
      take: limit,
      skip: offset,
      orderBy: {
        createdAt: "asc",
      },
    })

    console.log(`[categories GET] Retrieved ${categories.length} categories from database`)

    return NextResponse.json(
      {
        data: categories,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[categories GET] Error:", error)
    console.error("[categories GET] Error details:", error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { 
        error: "Failed to fetch categories",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
