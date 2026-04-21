import { getSession } from "@/lib/dal"
import { prisma } from "@/lib/prisma"
import { validateCreatePrizeInput } from "@/lib/validations/prize"
import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/prizes
 * Create a new prize (Admin only)
 *
 * Request body:
 * {
 *   "name": string,
 *   "description": string,
 *   "cost": number (positive integer),
 *   "icon": string (lucide-react icon name),
 *   "categoryId": string (ID of the category)
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

    console.log("[prizes POST] Request body:", JSON.stringify(body))

    // Validate input
    const validation = validateCreatePrizeInput(body)
    if (!validation.valid) {
      console.error("[prizes POST] Validation errors:", validation.errors)
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validation.errors,
        },
        { status: 400 }
      )
    }

    // Check if category exists
    const category = await prisma.prizeCategory.findUnique({
      where: { id: body.categoryId },
    })

    if (!category) {
      console.error("[prizes POST] Category not found:", body.categoryId)
      return NextResponse.json(
        { error: "La categoría especificada no existe" },
        { status: 404 }
      )
    }

    // Check if prize with same name already exists
    const existingByName = await prisma.prize.findUnique({
      where: { name: body.name.trim() },
    })

    if (existingByName) {
      console.error("[prizes POST] Prize with same name already exists:", body.name)
      return NextResponse.json(
        { error: "Ya existe un premio con este nombre" },
        { status: 409 }
      )
    }

    // Generate ID
    const prizeId = `p-${Date.now()}`

    // Create prize
    const prize = await prisma.prize.create({
      data: {
        id: prizeId,
        name: body.name.trim(),
        description: body.description.trim(),
        cost: body.cost,
        icon: body.icon.trim(),
        categoryId: body.categoryId,
      },
      include: {
        category: true,
      },
    })

    console.log(`[prizes POST] Created prize: ${prize.id}`)

    return NextResponse.json(
      {
        message: "Prize created successfully",
        data: prize,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[prizes POST] Error:", error)
    console.error("[prizes POST] Error message:", error instanceof Error ? error.message : String(error))
    console.error("[prizes POST] Stack:", error instanceof Error ? error.stack : "No stack available")
    return NextResponse.json(
      { 
        error: "Failed to create prize",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/prizes
 * List all prizes
 *
 * Query parameters:
 * - categoryId?: string (filter by category ID)
 * - limit?: number (default: 100, max: 100)
 * - offset?: number (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get("categoryId")
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 100)
    const offset = parseInt(searchParams.get("offset") || "0")

    // Build where clause
    const where: any = {}
    if (categoryId) {
      where.categoryId = categoryId
    }

    // Get total count
    const total = await prisma.prize.count({ where })

    // Get prizes with pagination
    const prizes = await prisma.prize.findMany({
      where,
      include: {
        category: true,
      },
      take: limit,
      skip: offset,
      orderBy: {
        cost: "asc",
      },
    })

    console.log(`[prizes GET] Retrieved ${prizes.length} prizes from database`)

    return NextResponse.json(
      {
        data: prizes,
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
    console.error("[prizes GET] Error:", error)
    console.error("[prizes GET] Error details:", error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { 
        error: "Failed to fetch prizes",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
