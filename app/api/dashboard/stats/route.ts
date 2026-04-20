import { getSession } from "@/lib/dal"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

/**
 * GET /api/dashboard/stats
 * Obtener estadísticas principales del panel de control
 * Admin only
 */
export async function GET() {
  try {
    const session = await getSession()

    // Verificar que sea admin
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - admin access required" },
        { status: 403 }
      )
    }

    // Obtener todos los puntos de basura con stats del día
    const trashPoints = await prisma.trashPoint.findMany({
      include: {
        todayStats: true,
      },
    })

    // Calcular total de residuos recolectados hoy
    const totalCollected = trashPoints.reduce(
      (sum, tp) =>
        sum +
        (tp.todayStats?.plastico || 0) +
        (tp.todayStats?.papel || 0) +
        (tp.todayStats?.organico || 0) +
        (tp.todayStats?.general || 0),
      0
    )

    // Calcular promedio de llenado
    const avgFillLevel =
      trashPoints.length > 0
        ? Math.round(
            trashPoints.reduce((sum, tp) => sum + tp.fillLevel, 0) /
              trashPoints.length
          )
        : 0

    // Contar alertas activas
    const activeAlerts = trashPoints.filter((tp) => tp.alert).length

    // Total de contenedores
    const totalContainers = trashPoints.length

    // Desglose por categoría
    const categoryBreakdown = {
      plastico: trashPoints.reduce((sum, tp) => sum + (tp.todayStats?.plastico || 0), 0),
      papel: trashPoints.reduce((sum, tp) => sum + (tp.todayStats?.papel || 0), 0),
      organico: trashPoints.reduce((sum, tp) => sum + (tp.todayStats?.organico || 0), 0),
      general: trashPoints.reduce((sum, tp) => sum + (tp.todayStats?.general || 0), 0),
    }

    return NextResponse.json(
      {
        totalCollected,
        avgFillLevel,
        activeAlerts,
        totalContainers,
        categoryBreakdown,
        timestamp: new Date(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[dashboard/stats GET] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    )
  }
}
