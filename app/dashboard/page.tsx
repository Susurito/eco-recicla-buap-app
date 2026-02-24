"use client"

import { useState } from "react"
import Link from "next/link"
import {
  initialTrashPoints,
  studentData,
  prizes,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
} from "@/lib/data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"
import {
  ArrowLeft,
  Trash2,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Leaf,
  Star,
  Shield,
  Recycle,
  Trophy,
  Wifi,
  GraduationCap,
  Coffee,
  Utensils,
  Users,
  CalendarDays,
  BarChart3,
} from "lucide-react"

function getPrizeIcon(iconName: string) {
  switch (iconName) {
    case "wifi":
      return <Wifi className="h-5 w-5" />
    case "graduation-cap":
      return <GraduationCap className="h-5 w-5" />
    case "coffee":
      return <Coffee className="h-5 w-5" />
    case "utensils":
      return <Utensils className="h-5 w-5" />
    default:
      return <Star className="h-5 w-5" />
  }
}

function getCategoryColor(category: string) {
  switch (category) {
    case "internet":
      return "bg-blue-500/10 text-blue-700 border-blue-200"
    case "academic":
      return "bg-amber-500/10 text-amber-700 border-amber-200"
    case "cafeteria":
      return "bg-primary/10 text-primary border-primary/20"
    default:
      return ""
  }
}

// Weekly trend mock data
const weeklyTrend = [
  { day: "Lun", plastico: 45, papel: 32, organico: 28, general: 20 },
  { day: "Mar", plastico: 52, papel: 28, organico: 35, general: 18 },
  { day: "Mie", plastico: 38, papel: 40, organico: 22, general: 25 },
  { day: "Jue", plastico: 60, papel: 35, organico: 30, general: 22 },
  { day: "Vie", plastico: 48, papel: 42, organico: 38, general: 28 },
  { day: "Sab", plastico: 20, papel: 15, organico: 12, general: 10 },
  { day: "Dom", plastico: 10, papel: 8, organico: 5, general: 6 },
]

export default function DashboardPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const trashPoints = initialTrashPoints
  const student = studentData

  // Aggregate stats
  const totalCollected = trashPoints.reduce(
    (acc, p) =>
      acc +
      p.todayStats.plastico +
      p.todayStats.papel +
      p.todayStats.organico +
      p.todayStats.general,
    0
  )
  const avgFill =
    trashPoints.reduce((acc, p) => acc + p.fillLevel, 0) / trashPoints.length
  const alertCount = trashPoints.filter((p) => p.alert).length
  const criticalPoints = trashPoints.filter((p) => p.fillLevel > 80)

  // Category bar data
  const barData = [
    {
      name: "Plastico",
      value: trashPoints.reduce((acc, p) => acc + p.todayStats.plastico, 0),
      fill: CATEGORY_COLORS.plastico,
    },
    {
      name: "Papel",
      value: trashPoints.reduce((acc, p) => acc + p.todayStats.papel, 0),
      fill: CATEGORY_COLORS.papel,
    },
    {
      name: "Organico",
      value: trashPoints.reduce((acc, p) => acc + p.todayStats.organico, 0),
      fill: CATEGORY_COLORS.organico,
    },
    {
      name: "General",
      value: trashPoints.reduce((acc, p) => acc + p.todayStats.general, 0),
      fill: CATEGORY_COLORS.general,
    },
  ]

  const pieData = barData.map((d) => ({
    name: d.name,
    value: d.value,
    fill: d.fill,
  }))

  const nextLevel = 2000
  const progress = (student.ecoPoints / nextLevel) * 100

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-card px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Volver al mapa</span>
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Leaf className="h-4 w-4" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-foreground leading-none">
                Eco-Recicla BUAP
              </h1>
              <p className="text-xs text-muted-foreground">
                Dashboard de Estadisticas
              </p>
            </div>
            <h1 className="text-sm font-bold text-foreground sm:hidden">
              Dashboard
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isAdmin && (
            <Badge className="hidden bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 sm:flex">
              <Star className="mr-1 h-3 w-3" />
              {student.ecoPoints} pts
            </Badge>
          )}
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5">
            <div className="flex items-center gap-1.5">
              {isAdmin ? (
                <Shield className="h-3.5 w-3.5 text-primary" />
              ) : (
                <Star className="h-3.5 w-3.5 text-primary" />
              )}
              <span className="text-xs font-medium text-foreground">
                {isAdmin ? "Admin" : "Estudiante"}
              </span>
            </div>
            <Switch checked={isAdmin} onCheckedChange={setIsAdmin} />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
          {/* Page title */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground text-balance">
              {isAdmin ? "Panel de Control" : "Mi Progreso Ecologico"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isAdmin
                ? "Monitoreo en tiempo real del sistema de reciclaje"
                : "Tu contribucion al reciclaje en la Facultad de Computacion"}
            </p>
          </div>

          {isAdmin ? (
            <>
              {/* Admin KPIs */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Card>
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Trash2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground leading-none">
                        {totalCollected}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Residuos hoy
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                      <TrendingUp className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground leading-none">
                        {avgFill.toFixed(0)}%
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Llenado promedio
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground leading-none">
                        {alertCount}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Alertas activas
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                      <MapPin className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground leading-none">
                        {trashPoints.length}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Contenedores
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts row */}
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {/* Bar chart */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      Recoleccion por Categoria
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{ value: { label: "Cantidad" } }}
                      className="h-[260px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData}>
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                            {barData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Pie chart */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">
                      Distribucion de Residuos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{ value: { label: "Cantidad" } }}
                      className="h-[220px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.fill}
                              />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                    <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
                      {barData.map((d) => (
                        <div
                          key={d.name}
                          className="flex items-center gap-1.5"
                        >
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: d.fill }}
                          />
                          <span className="text-xs text-muted-foreground">
                            {d.name} ({d.value})
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Weekly trend */}
              <div className="mt-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      Tendencia Semanal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        plastico: { label: "Plastico", color: CATEGORY_COLORS.plastico },
                        papel: { label: "Papel", color: CATEGORY_COLORS.papel },
                        organico: { label: "Organico", color: CATEGORY_COLORS.organico },
                        general: { label: "General", color: CATEGORY_COLORS.general },
                      }}
                      className="h-[260px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={weeklyTrend}>
                          <XAxis
                            dataKey="day"
                            tick={{ fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Area
                            type="monotone"
                            dataKey="plastico"
                            stackId="1"
                            stroke={CATEGORY_COLORS.plastico}
                            fill={CATEGORY_COLORS.plastico}
                            fillOpacity={0.3}
                          />
                          <Area
                            type="monotone"
                            dataKey="papel"
                            stackId="1"
                            stroke={CATEGORY_COLORS.papel}
                            fill={CATEGORY_COLORS.papel}
                            fillOpacity={0.3}
                          />
                          <Area
                            type="monotone"
                            dataKey="organico"
                            stackId="1"
                            stroke={CATEGORY_COLORS.organico}
                            fill={CATEGORY_COLORS.organico}
                            fillOpacity={0.3}
                          />
                          <Area
                            type="monotone"
                            dataKey="general"
                            stackId="1"
                            stroke={CATEGORY_COLORS.general}
                            fill={CATEGORY_COLORS.general}
                            fillOpacity={0.3}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Critical containers + All containers */}
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {/* Critical */}
                {criticalPoints.length > 0 && (
                  <Card className="border-destructive/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm font-semibold text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        Contenedores Criticos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-2">
                        {criticalPoints.map((point) => (
                          <div
                            key={point.id}
                            className="flex items-center justify-between rounded-lg bg-destructive/5 p-3"
                          >
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {point.name}
                              </p>
                              {point.alert && (
                                <p className="text-xs text-destructive">
                                  {point.alert}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-sm font-bold text-destructive">
                                {point.fillLevel}%
                              </span>
                              <Progress
                                value={point.fillLevel}
                                className="h-1.5 w-20"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* All containers */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">
                      Todos los Contenedores
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-2">
                      {trashPoints.map((point) => (
                        <div
                          key={point.id}
                          className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{
                                backgroundColor:
                                  point.fillLevel > 80
                                    ? "#ef4444"
                                    : point.fillLevel > 50
                                      ? "#eab308"
                                      : "#10b981",
                              }}
                            />
                            <div>
                              <span className="text-sm font-medium text-foreground">
                                {point.name}
                              </span>
                              <p className="text-xs text-muted-foreground">
                                Ultima recoleccion: {point.lastCollected}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-muted-foreground">
                            {point.fillLevel}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <>
              {/* Student view */}
              <div className="grid gap-4 lg:grid-cols-3">
                {/* Student profile card */}
                <Card className="lg:col-span-1">
                  <CardContent className="p-0">
                    <div className="rounded-t-xl bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground">
                      <div className="flex items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-foreground/20">
                          <Leaf className="h-7 w-7" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold">{student.name}</h3>
                          <p className="text-sm text-primary-foreground/80">
                            Boleta: {student.boleta}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-3">
                        <Badge className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30">
                          {student.level}
                        </Badge>
                        <span className="text-sm text-primary-foreground/80">
                          {student.classifications} clasificaciones
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 p-5">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Star className="h-4 w-4 text-primary" />
                            Eco-Points
                          </span>
                          <span className="text-2xl font-bold text-primary">
                            {student.ecoPoints.toLocaleString()}
                          </span>
                        </div>
                        <Progress value={progress} className="h-2.5" />
                        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                          <span>Nivel actual</span>
                          <span>
                            {student.ecoPoints} / {nextLevel} pts
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Stats grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
                  <Card>
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <Recycle className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-foreground leading-none">
                          {student.classifications}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Clasificaciones totales
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                        <TrendingUp className="h-6 w-6 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-foreground leading-none">
                          #12
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Ranking general
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-foreground leading-none">
                          234
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Estudiantes activos
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <CalendarDays className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-foreground leading-none">
                          14
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Dias consecutivos
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Prizes Section */}
              <div className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Trophy className="h-5 w-5 text-primary" />
                      Canjear Premios
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {prizes.map((prize) => {
                        const canAfford = student.ecoPoints >= prize.cost
                        return (
                          <div
                            key={prize.id}
                            className={`flex items-center gap-3 rounded-xl border p-4 transition-all ${
                              canAfford
                                ? "hover:border-primary/40 hover:shadow-sm"
                                : "opacity-60"
                            }`}
                          >
                            <div
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${getCategoryColor(prize.category)}`}
                            >
                              {getPrizeIcon(prize.icon)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground truncate">
                                {prize.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {prize.description}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant={canAfford ? "default" : "outline"}
                              disabled={!canAfford}
                              className={
                                canAfford
                                  ? "bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
                                  : "shrink-0"
                              }
                            >
                              {prize.cost}
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
