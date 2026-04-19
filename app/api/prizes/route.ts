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
 *   "category": "internet" | "academic" | "cafeteria"
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
    const validation = validateCreatePrizeInput(body)
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validation.errors,
        },
        { status: 400 }
      )
    }

    // Check if prize with same name already exists
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

    // Generate ID
    const prizeId = `p-${Date.now()}`

    // Create prize
    const prize = await prisma.prize.create({
      data: {
        id: prizeId,
        name: body.name,
        description: body.description,
        cost: body.cost,
        icon: body.icon,
        category: body.category,
      },
    })

    console.log(`[prizes POST] Created prize: ${prize.id}`)

    return NextResponse.json(
      {
        message: "Prize created successfully",
        prize,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[prizes POST] Error:", error)
    return NextResponse.json(
      { error: "Failed to create prize" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/prizes
 * List all prizes
 *
 * Query parameters:
 * - category?: string (filter by category: internet, academic, cafeteria)
 * - limit?: number (default: 100, max: 100)
 * - offset?: number (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 100)
    const offset = parseInt(searchParams.get("offset") || "0")

    // Build where clause
    const where: any = {}
    if (category) {
      where.category = category
    }

    // Get total count
    const total = await prisma.prize.count({ where })

    // Get prizes with pagination
    const prizes = await prisma.prize.findMany({
      where,
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
    return NextResponse.json(
      { error: "Failed to fetch prizes" },
      { status: 500 }
    )
  }
}
