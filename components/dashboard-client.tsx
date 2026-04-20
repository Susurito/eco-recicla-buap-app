"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  type TrashPoint,
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
  LogOut,
} from "lucide-react"
import { useRouter } from "next/navigation"

interface Prize {
  id: string
  name: string
  description: string
  cost: number
  icon: string
  category: "internet" | "academic" | "cafeteria"
}

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

function LogoutButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      // Call sign out endpoint
      const response = await fetch("/api/auth/signout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        // Signal other tabs about logout via localStorage
        localStorage.setItem("auth-logout-signal", Date.now().toString())
        
        // Wait a moment for cleanup
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // Redirect to login
        router.push("/login")
      } else {
        console.error("Logout failed:", await response.text())
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Logout failed:", error)
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="icon-sm"
      onClick={handleLogout}
      disabled={isLoading}
      title="Cerrar sesión"
    >
      <LogOut className="h-4 w-4" />
    </Button>
  )
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

export default function DashboardClient({ 
  isAdmin, 
  userId,
  userName,
  userImage
}: { 
  isAdmin: boolean
  userId: string
  userName: string
  userImage?: string | null
}) {
  const [isAdminToggle, setIsAdminToggle] = useState(isAdmin)
  const [trashPoints, setTrashPoints] = useState<TrashPoint[]>([])
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [weeklyTrend, setWeeklyTrend] = useState([
    { day: "Lun", plastico: 0, papel: 0, organico: 0, general: 0 },
    { day: "Mar", plastico: 0, papel: 0, organico: 0, general: 0 },
    { day: "Mie", plastico: 0, papel: 0, organico: 0, general: 0 },
    { day: "Jue", plastico: 0, papel: 0, organico: 0, general: 0 },
    { day: "Vie", plastico: 0, papel: 0, organico: 0, general: 0 },
    { day: "Sab", plastico: 0, papel: 0, organico: 0, general: 0 },
    { day: "Dom", plastico: 0, papel: 0, organico: 0, general: 0 },
  ])
  const [loading, setLoading] = useState(true)

  // Crear objeto student desde props
  const student = {
    boleta: userId || "",
    name: userName || "Usuario",
    ecoPoints: 0,
    classifications: 0,
    level: "Principiante",
  }
  useEffect(() => {
    if (!isAdmin) {
      setLoading(false)
      return
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true)

        // Fetch trash points
        const pointsRes = await fetch("/api/trash-points?limit=100")
        const pointsData = await pointsRes.json()
        
        if (pointsData.data && Array.isArray(pointsData.data)) {
          setTrashPoints(pointsData.data)
        }

        // Fetch prizes
        const prizesRes = await fetch("/api/prizes?limit=100")
        const prizesData = await prizesRes.json()
        
        if (prizesData.data && Array.isArray(prizesData.data)) {
          setPrizes(prizesData.data)
        }

        // Fetch trends
        const trendsRes = await fetch("/api/dashboard/trends")
        const trendsData = await trendsRes.json()
        
        if (trendsData.weeklyTrend && Array.isArray(trendsData.weeklyTrend)) {
          setWeeklyTrend(trendsData.weeklyTrend)
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
        // Keep using mock data on error
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [isAdmin])

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
    <div className="flex h-dvh flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b bg-card px-4 lg:px-6">
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
          <LogoutButton />
        </div>
      </header>

      {/* Main content - scrollable */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
          {/* Page title */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground text-balance">
              {isAdminToggle ? "Panel de Control" : "Mi Progreso Ecologico"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isAdminToggle
                ? "Monitoreo en tiempo real del sistema de reciclaje"
                : "Tu contribucion al reciclaje en la Facultad de Computacion"}
            </p>
          </div>

          {isAdminToggle ? (
            <>
              {/* Loading indicator for admin */}
              {loading && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
                  <span>Cargando datos del panel...</span>
                </div>
              )}

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
                      id="dashboard-bar-chart"
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
                      id="dashboard-pie-chart"
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
                      id="dashboard-area-chart"
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
              <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
                {/* Student profile card - Hero design */}
                <Card className="lg:col-span-1 overflow-hidden row-span-3">
                   <CardContent className="p-0 h-full">
                     <div className="relative bg-gradient-to-br from-emerald-500 via-emerald-400 to-emerald-500 text-white h-full flex flex-col">
                       {/* Background pattern */}
                       <div className="absolute inset-0 opacity-10">
                         <div className="absolute inset-0" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"}} />
                       </div>
                       
                       {/* Content */}
                       <div className="relative z-10 flex flex-col h-full p-8">
                         {/* Top section */}
                         <div className="flex items-center gap-4 mb-8">
                           <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 overflow-hidden border-3 border-white/30 backdrop-blur-sm flex-shrink-0">
                             {userImage ? (
                               <img 
                                 src={userImage} 
                                 alt={userName}
                                 className="h-full w-full object-cover"
                               />
                             ) : (
                               <Leaf className="h-10 w-10 text-white" />
                             )}
                           </div>
                           <div className="flex-1 min-w-0">
                             <h2 className="text-3xl font-bold leading-tight">{userName}</h2>
                             <p className="text-white/80 text-sm mt-1">
                               Boleta: {student.boleta}
                             </p>
                           </div>
                         </div>
                         
                         {/* Level and classifications */}
                         <div className="flex items-center gap-2 mb-8 flex-wrap">
                           <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-4 py-2 text-sm">
                             {student.level}
                           </Badge>
                           <span className="text-white/80 text-sm font-medium">
                             {student.classifications} clasificaciones
                           </span>
                         </div>
                         
                         {/* Divider */}
                         <div className="h-px bg-white/20 mb-8" />
                         
                         {/* Eco-Points section - grow to fill space */}
                         <div className="flex-1 flex flex-col justify-between">
                           <div>
                             <div className="flex items-baseline gap-2 mb-3">
                               <Star className="h-5 w-5 text-white flex-shrink-0" />
                               <span className="text-white/90 text-sm font-medium">Eco-Points</span>
                             </div>
                             <p className="text-5xl font-bold text-white mb-6">
                               {student.ecoPoints.toLocaleString()}
                             </p>
                           </div>
                           
                           <div className="space-y-3">
                             <div>
                               <div className="flex items-center justify-between mb-3">
                                 <span className="text-white/80 text-xs font-medium">Progreso hacia siguiente nivel</span>
                                 <span className="text-white/80 text-xs font-medium">
                                   {Math.round((student.ecoPoints / nextLevel) * 100)}%
                                 </span>
                               </div>
                               <Progress value={progress} className="h-4" />
                               <div className="mt-2 flex items-center justify-between text-xs text-white/70">
                                 <span>Actual: {student.ecoPoints} pts</span>
                                 <span>Meta: {nextLevel} pts</span>
                               </div>
                             </div>
                           </div>
                         </div>
                       </div>
                     </div>
                  </CardContent>
                </Card>

                {/* Stats grid - 3 columns with colors */}
                <div className="grid gap-6 grid-cols-1 auto-rows-max lg:col-span-1">
                  {/* Clasificaciones - Verde/Emerald */}
                  <Card className="overflow-hidden transition-all hover:shadow-lg hover:scale-105 duration-300">
                    <CardContent className="flex items-center gap-4 p-6">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/15 flex-shrink-0">
                        <Recycle className="h-7 w-7 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-4xl font-bold text-emerald-600 leading-none">
                          {student.classifications}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground font-medium">
                          Clasificaciones totales
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Ranking - Amarillo/Amber */}
                  <Card className="overflow-hidden transition-all hover:shadow-lg hover:scale-105 duration-300">
                    <CardContent className="flex items-center gap-4 p-6">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500/15 flex-shrink-0">
                        <TrendingUp className="h-7 w-7 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-4xl font-bold text-amber-600 leading-none">
                          #12
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground font-medium">
                          Ranking general
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Días Consecutivos - Azul/Sky */}
                  <Card className="overflow-hidden transition-all hover:shadow-lg hover:scale-105 duration-300">
                    <CardContent className="flex items-center gap-4 p-6">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-sky-500/15 flex-shrink-0">
                        <CalendarDays className="h-7 w-7 text-sky-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-4xl font-bold text-sky-600 leading-none">
                          14
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground font-medium">
                          Días consecutivos
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
