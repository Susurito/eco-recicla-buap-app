import { getSession } from "@/lib/dal"
import { prisma } from "@/lib/prisma"
import { validateCreateInput } from "@/lib/validations/trash-point"
import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/trash-points
 * Create a new trash point (Admin only)
 *
 * Request body:
 * {
 *   "name": string,
 *   "lat": number,
 *   "lng": number,
 *   "detectedObject": string,
 *   "detectedImage": string,
 *   "category"?: "plastico" | "papel" | "organico" | "general",
 *   "fillLevel"?: number (0-100),
 *   "lastCollected"?: string,
 *   "alert"?: string
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
    const validation = validateCreateInput(body)
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validation.errors,
        },
        { status: 400 }
      )
    }

    // Check if trash point with same name already exists
    const existingTrashPoint = await prisma.trashPoint.findUnique({
      where: { id: body.name }, // Using name as identifier
    })

    if (existingTrashPoint) {
      return NextResponse.json(
        { error: "Trash point with this name already exists" },
        { status: 409 }
      )
    }

    // Create trash point with generated ID
    const trashPointId = `TP${Date.now()}`

    const trashPoint = await prisma.trashPoint.create({
      data: {
        id: trashPointId,
        name: body.name,
        lat: body.lat,
        lng: body.lng,
        detectedObject: body.detectedObject,
        detectedImage: body.detectedImage,
        category: body.category || null,
        fillLevel: body.fillLevel ?? 0,
        lastCollected: body.lastCollected || new Date().toISOString(),
        alert: body.alert || null,
        // Create TodayStats automatically
        todayStats: {
          create: {
            plastico: 0,
            papel: 0,
            organico: 0,
            general: 0,
          },
        },
      },
      include: {
        todayStats: true,
      },
    })

    return NextResponse.json(
      {
        message: "Trash point created successfully",
        trashPoint,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[trash-points POST] Error:", error)
    return NextResponse.json(
      { error: "Failed to create trash point" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/trash-points
 * List all trash points with pagination and filters
 *
 * Query parameters:
 * - limit?: number (default: 10, max: 100)
 * - offset?: number (default: 0)
 * - category?: string (filter by category)
 * - search?: string (search by name)
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100)
    const offset = parseInt(searchParams.get("offset") || "0")
    const category = searchParams.get("category")
    const search = searchParams.get("search")

    // Build where clause
    const where: any = {}
    if (category) {
      where.category = category
    }
    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive",
      }
    }

    // Get total count
    const total = await prisma.trashPoint.count({ where })

    // Get trash points with pagination
    const trashPoints = await prisma.trashPoint.findMany({
      where,
      include: {
        todayStats: true,
      },
      take: limit,
      skip: offset,
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(
      {
        data: trashPoints,
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
    console.error("[trash-points GET] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch trash points" },
      { status: 500 }
    )
  }
}
