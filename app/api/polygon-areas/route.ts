import { getSession } from "@/lib/dal"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/polygon-areas
 * Create a new polygon area (Admin only)
 *
 * Request body:
 * {
 *   "name": string,
 *   "description"?: string,
 *   "color": string (hex color),
 *   "points": Array<{lat: number, lng: number}>
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
    if (!body.name || !body.color || !body.points || !Array.isArray(body.points)) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: "name, color, and points array are required",
        },
        { status: 400 }
      )
    }

    if (body.points.length < 3) {
      return NextResponse.json(
        {
          error: "Invalid polygon",
          details: "Polygon must have at least 3 points",
        },
        { status: 400 }
      )
    }

    // Check if polygon area with same name already exists
    const existingByName = await prisma.polygonArea.findFirst({
      where: {
        name: {
          equals: body.name,
          mode: "insensitive",
        },
      },
    })

    if (existingByName) {
      return NextResponse.json(
        { error: "Ya existe un área con este nombre" },
        { status: 409 }
      )
    }

    // Create polygon area with generated ID
    const polygonAreaId = `PA${Date.now()}`

    const polygonArea = await prisma.polygonArea.create({
      data: {
        id: polygonAreaId,
        name: body.name,
        description: body.description || null,
        color: body.color,
        points: {
          create: body.points.map((point: any) => ({
            lat: point.lat,
            lng: point.lng,
          })),
        },
      },
      include: {
        points: true,
      },
    })

    return NextResponse.json(
      {
        message: "Polygon area created successfully",
        polygonArea,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[polygon-areas POST] Error:", error)
    return NextResponse.json(
      { error: "Failed to create polygon area" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/polygon-areas
 * List all polygon areas with pagination
 *
 * Query parameters:
 * - limit?: number (default: 100, max: 1000)
 * - offset?: number (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 1000)
    const offset = parseInt(searchParams.get("offset") || "0")

    // Get total count
    const total = await prisma.polygonArea.count()

    // Get polygon areas with pagination
    const polygonAreas = await prisma.polygonArea.findMany({
      include: {
        points: true,
      },
      take: limit,
      skip: offset,
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(
      {
        data: polygonAreas,
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
    console.error("[polygon-areas GET] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch polygon areas" },
      { status: 500 }
    )
  }
}
