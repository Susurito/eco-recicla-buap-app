import { getSession } from "@/lib/dal"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

/**
 * GET /api/dashboard/trends
 * Obtener tendencias semanales de residuos
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

    // Obtener datos de los últimos 7 días
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const historicalData = await prisma.historicalStats.findMany({
      where: {
        date: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: {
        date: "asc",
      },
    })

    // Agrupar por día de la semana
    const dayNames = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"]
    const dailyTotals = new Map<
      string,
      {
        day: string
        plastico: number
        papel: number
        organico: number
        general: number
      }
    >()

    historicalData.forEach((stat) => {
      const dateStr = stat.date.toISOString().split("T")[0]
      const dayOfWeek = dayNames[stat.date.getDay()]
      const key = `${dateStr}`

      if (!dailyTotals.has(key)) {
        dailyTotals.set(key, {
          day: dayOfWeek,
          plastico: 0,
          papel: 0,
          organico: 0,
          general: 0,
        })
      }

      const daily = dailyTotals.get(key)!
      daily.plastico += stat.plastico
      daily.papel += stat.papel
      daily.organico += stat.organico
      daily.general += stat.general
    })

    // Convertir a array y ordenar cronológicamente
    const weeklyTrend = Array.from(dailyTotals.values()).sort((a, b) => {
      const dateA = new Date(a.day)
      const dateB = new Date(b.day)
      return dateA.getTime() - dateB.getTime()
    })

    // Si no hay datos históricos, devolver tendencia semanal con ceros
    if (weeklyTrend.length === 0) {
      const defaultTrend = [
        { day: "Lun", plastico: 0, papel: 0, organico: 0, general: 0 },
        { day: "Mar", plastico: 0, papel: 0, organico: 0, general: 0 },
        { day: "Mie", plastico: 0, papel: 0, organico: 0, general: 0 },
        { day: "Jue", plastico: 0, papel: 0, organico: 0, general: 0 },
        { day: "Vie", plastico: 0, papel: 0, organico: 0, general: 0 },
        { day: "Sab", plastico: 0, papel: 0, organico: 0, general: 0 },
        { day: "Dom", plastico: 0, papel: 0, organico: 0, general: 0 },
      ]
      return NextResponse.json({ weeklyTrend: defaultTrend }, { status: 200 })
    }

    return NextResponse.json({ weeklyTrend }, { status: 200 })
  } catch (error) {
    console.error("[dashboard/trends GET] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard trends" },
      { status: 500 }
    )
  }
}
