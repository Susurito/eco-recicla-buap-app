"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import Link from "next/link"
import Image from "next/image"
import {
  type TrashPoint,
  type PolygonArea,
  initialTrashPoints,
  studentData,
} from "@/lib/data"
import { useSession } from "@/lib/session-context"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import TrashPointPanel from "@/components/trash-point-panel"
import {
  Leaf,
  LayoutDashboard,
  Star,
  Shield,
  Menu,
  X,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pentagon,
  CheckCircle,
  Globe,
  Phone,
  User,
} from "lucide-react"

const MapView = dynamic(() => import("@/components/map-view"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-muted/30">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground">Cargando mapa...</span>
      </div>
    </div>
  ),
})

export default function EcoReciclaBUAP() {
  const router = useRouter()
  const { session, loading } = useSession()
  const [isAdmin, setIsAdmin] = useState(false)
  const [trashPoints, setTrashPoints] =
    useState<TrashPoint[]>(initialTrashPoints)
  const [selectedPoint, setSelectedPoint] = useState<TrashPoint | null>(null)
  const [polygonAreas, setPolygonAreas] = useState<PolygonArea[]>([])
  const [isAddingPoint, setIsAddingPoint] = useState(false)
  const [isDrawingPolygon, setIsDrawingPolygon] = useState(false)
  const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([])
  const [student, setStudent] = useState(studentData)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [studentData_local, setStudentData_local] = useState<{
    name: string
    email: string
    image: string | null
  } | null>(null)

  // Load additional student data when session is available
  // NOTE: This only runs if session exists (logged in)
  // Public visitors won't trigger the /api/students/me fetch
  useEffect(() => {
    if (!loading && session) {
      console.log("[EcoReciclaBUAP] User logged in, fetching student data")
      // Use session data directly
      setStudentData_local({
        name: session.user.name || "Usuario",
        email: session.user.email || "",
        image: session.user.image || null,
      })

      // Fetch student profile for ecoPoints and other stats
      // Only runs when user is authenticated
      const fetchStudentData = async () => {
        try {
          const response = await fetch("/api/students/me")
          if (response.ok) {
            const data = await response.json()
            console.log("[EcoReciclaBUAP] Student data loaded successfully")
            // Update student data with fetched values
            setStudent((prev) => ({
              ...prev,
              ...data.student,
            }))
          } else if (response.status === 401) {
            console.log("[EcoReciclaBUAP] Session invalid, clearing user data")
            // Session is invalid, clear it
            setStudentData_local(null)
            setStudent(studentData)
          }
        } catch (error) {
          console.error("[EcoReciclaBUAP] Error fetching student data:", error)
        }
      }

      fetchStudentData()
    } else if (!loading && !session) {
      console.log("[EcoReciclaBUAP] Public visitor - no session")
      // No session, show public map without fetching user data
      setStudentData_local(null)
      setStudent(studentData)
    }
  }, [session, loading])

  const handlePointClick = useCallback((point: TrashPoint) => {
    setSelectedPoint(point)
    setSidebarOpen(true)
  }, [])

  const handleClosePanel = useCallback(() => {
    setSelectedPoint(null)
  }, [])

  const handleClassify = useCallback(
    (pointId: string, category: string) => {
      setTrashPoints((prev) =>
        prev.map((p) =>
          p.id === pointId
            ? {
                ...p,
                category: category as TrashPoint["category"],
                todayStats: {
                  ...p.todayStats,
                  [category]:
                    p.todayStats[category as keyof typeof p.todayStats] + 1,
                },
              }
            : p
        )
      )
      setStudent((prev) => ({
        ...prev,
        ecoPoints: prev.ecoPoints + 10,
        classifications: prev.classifications + 1,
      }))
    },
    []
  )

  const handleAddPoint = useCallback(() => {
    setIsAddingPoint((prev) => !prev)
    setIsDrawingPolygon(false)
    setDrawingPoints([])
  }, [])

  const handleDrawPolygon = useCallback(() => {
    if (isDrawingPolygon && drawingPoints.length >= 3) {
      const newPolygon: PolygonArea = {
        id: `area-${Date.now()}`,
        name: `Area de Optimizacion ${polygonAreas.length + 1}`,
        points: drawingPoints,
        color: "#8b5cf6",
      }
      setPolygonAreas((prev) => [...prev, newPolygon])
      setDrawingPoints([])
      setIsDrawingPolygon(false)
    } else if (isDrawingPolygon) {
      setDrawingPoints([])
      setIsDrawingPolygon(false)
    } else {
      setIsDrawingPolygon(true)
      setIsAddingPoint(false)
      setDrawingPoints([])
    }
  }, [isDrawingPolygon, drawingPoints, polygonAreas.length])

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (isAddingPoint) {
        const newPoint: TrashPoint = {
          id: `tp-${Date.now()}`,
          name: `Contenedor Nuevo ${trashPoints.length + 1}`,
          lat,
          lng,
          detectedObject: "Sin deteccion",
          detectedImage: "",
          category: null,
          fillLevel: 0,
          lastCollected: "Nuevo",
          alert: null,
          todayStats: { plastico: 0, papel: 0, organico: 0, general: 0 },
        }
        setTrashPoints((prev) => [...prev, newPoint])
        setIsAddingPoint(false)
      } else if (isDrawingPolygon) {
        setDrawingPoints((prev) => [...prev, [lat, lng]])
      }
    },
    [isAddingPoint, isDrawingPolygon, trashPoints.length]
  )

  const handleRoleToggle = useCallback(() => {
    setIsAdmin((prev) => !prev)
    setSelectedPoint(null)
    setIsAddingPoint(false)
    setIsDrawingPolygon(false)
    setDrawingPoints([])
  }, [])

  // Show loading while verifying session
  if (loading) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Verificando sesión...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-dvh w-full overflow-hidden">
      {/* Mobile header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b bg-card px-4 md:hidden">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
          <Leaf className="h-5 w-5 text-primary" />
          <span className="text-sm font-bold text-foreground">
            Eco-Recicla
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!isAdmin && (
            <Badge className="bg-primary/10 text-primary border-primary/30 hover:bg-primary/20">
              <Star className="mr-1 h-3 w-3" />
              {student.ecoPoints}
            </Badge>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Admin</span>
            <Switch checked={isAdmin} onCheckedChange={handleRoleToggle} />
          </div>
        </div>
      </header>

      {/* Sidebar panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-card shadow-xl transition-all duration-300 ease-in-out md:relative ${
          sidebarOpen ? "w-[380px]" : "w-0 overflow-hidden"
        } ${
          mobileMenuOpen
            ? "translate-x-0 pt-14"
            : "-translate-x-full pt-14 md:translate-x-0 md:pt-0"
        }`}
      >
        <div className="flex min-w-[380px] h-full flex-col overflow-y-auto overflow-x-hidden">
          {/* Hero reference image */}
          <div className="relative h-52 w-full shrink-0 overflow-hidden">
            <Image
              src="/images/campus-buap.jpg"
              alt="Campus Universitario BUAP - Facultad de Computacion"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4">
              <h1 className="text-xl font-bold text-foreground leading-tight text-balance">
                Eco-Recicla BUAP
              </h1>
              <p className="text-sm text-muted-foreground">
                Facultad de Computacion
              </p>
            </div>
          </div>

          {/* Session status bar */}
          <div className="border-b px-4 py-3">
            {/* User profile section */}
            {studentData_local ? (
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
                  {studentData_local.image ? (
                    <img
                      src={studentData_local.image}
                      alt={studentData_local.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {studentData_local.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    Sesión iniciada
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground shrink-0">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    Sin sesión
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Inicia sesión para continuar
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons - Navigation */}
          <div className="flex items-center justify-center border-b px-4 py-3">
            {studentData_local ? (
              <Link
                href="/dashboard"
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-105">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-primary">
                  Panel
                </span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-105">
                  <User className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-primary">
                  Iniciar sesión
                </span>
              </Link>
            )}
          </div>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto">
            {selectedPoint ? (
              <TrashPointPanel
                point={selectedPoint}
                onClose={handleClosePanel}
                onClassify={handleClassify}
                isAdmin={isAdmin}
              />
            ) : (
              <div className="flex flex-col">
                {/* Second reference image */}
                <div className="relative h-40 w-full overflow-hidden border-b">
                  <Image
                    src="/images/contenedor-reciclaje.jpg"
                    alt="Contenedores de reciclaje en el campus"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card/60 to-transparent" />
                  <div className="absolute bottom-2 left-3">
                    <span className="text-xs font-medium text-foreground bg-card/80 rounded px-2 py-0.5">
                      Puntos de reciclaje del campus
                    </span>
                  </div>
                </div>

                {/* Location info */}
                <div className="flex items-start gap-4 px-4 py-3 border-b">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground leading-relaxed">
                    Cd Universitaria, 72592 Heroica Puebla de Zaragoza, Pue.
                  </p>
                </div>
                <div className="flex items-center gap-4 px-4 py-3 border-b">
                  <Globe className="h-5 w-5 text-muted-foreground shrink-0" />
                  <p className="text-sm text-primary">buap.mx</p>
                </div>
                <div className="flex items-center gap-4 px-4 py-3 border-b">
                  <Phone className="h-5 w-5 text-muted-foreground shrink-0" />
                  <p className="text-sm text-foreground">222 229 5500</p>
                </div>

                {/* Container list */}
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-foreground">
                      Contenedores ({trashPoints.length})
                    </h3>
                    <Link
                      href="/dashboard"
                      className="text-xs text-primary hover:underline"
                    >
                      Ver estadisticas
                    </Link>
                  </div>
                  <div className="flex flex-col gap-2">
                    {trashPoints.map((point) => (
                      <button
                        key={point.id}
                        onClick={() => handlePointClick(point)}
                        className="flex items-center justify-between rounded-lg bg-muted/50 p-3 text-left transition-colors hover:bg-muted"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="h-3 w-3 rounded-full shrink-0"
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
                            <p className="text-sm font-medium text-foreground">
                              {point.name}
                            </p>
                            {point.alert && (
                              <p className="text-xs text-destructive">
                                {point.alert}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-muted-foreground shrink-0 ml-2">
                          {point.fillLevel}%
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Desktop sidebar toggle button - hamburger menu */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`fixed z-[999] top-4 left-4 items-center justify-center h-10 w-10 bg-card border border-border rounded-lg shadow-md transition-all duration-300 ease-in-out hover:bg-muted cursor-pointer ${
          sidebarOpen ? "hidden md:flex" : "md:flex flex"
        }`}
        aria-label={
          sidebarOpen ? "Colapsar panel lateral" : "Expandir panel lateral"
        }
      >
        {sidebarOpen ? (
          <X className="h-5 w-5 text-foreground" />
        ) : (
          <Menu className="h-5 w-5 text-foreground" />
        )}
      </button>

      {/* Map area */}
      <main className="relative flex-1 pt-14 md:pt-0">
        {/* Floating Eco-Points badge on map - student desktop */}
        {!isAdmin && (
          <div className="absolute top-4 left-4 z-30 hidden md:flex">
            <div className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 shadow-lg">
              <Star className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-primary">
                {student.ecoPoints.toLocaleString()} pts
              </span>
              <span className="text-xs text-muted-foreground">
                | {student.boleta}
              </span>
            </div>
          </div>
        )}

        {/* Admin mode indicator on map */}
        {isAdmin && (isAddingPoint || isDrawingPolygon) && (
          <div className="absolute top-4 left-4 z-30">
            <div className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 shadow-lg">
              <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              <span className="text-sm font-medium text-foreground">
                {isAddingPoint
                  ? "Click para colocar contenedor"
                  : `Dibujando area (${drawingPoints.length} puntos)`}
              </span>
              {isDrawingPolygon && drawingPoints.length >= 3 && (
                <Button
                  size="sm"
                  className="ml-2 h-7 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handleDrawPolygon}
                >
                  Finalizar
                </Button>
              )}
            </div>
          </div>
        )}

        <MapView
          trashPoints={trashPoints}
          polygonAreas={polygonAreas}
          selectedPointId={selectedPoint?.id || null}
          onPointClick={handlePointClick}
          isAdmin={isAdmin}
          isAddingPoint={isAddingPoint}
          isDrawingPolygon={isDrawingPolygon}
          drawingPoints={drawingPoints}
          onMapClick={handleMapClick}
        />
      </main>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/20 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  )
}
