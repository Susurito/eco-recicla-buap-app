"use client"

import { useState, useCallback } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import {
  type TrashPoint,
  type PolygonArea,
  initialTrashPoints,
  studentData,
} from "@/lib/data"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  Clock,
  Globe,
  Phone,
  ExternalLink,
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const handlePointClick = useCallback((point: TrashPoint) => {
    setSelectedPoint(point)
    setSidebarCollapsed(false)
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

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-card shadow-lg transition-all duration-300 ease-in-out md:relative ${
          sidebarCollapsed ? "w-0 md:w-0 overflow-hidden border-r-0" : "w-[380px]"
        } ${
          mobileMenuOpen
            ? "translate-x-0 pt-14"
            : "-translate-x-full pt-14 md:translate-x-0 md:pt-0"
        }`}
      >
        <div className="flex min-w-[380px] flex-col h-full">
          {/* Reference image at top - like Google Maps place photo */}
          <div className="relative h-48 w-full shrink-0 overflow-hidden">
            <img
              src="/images/referencia.jpg"
              alt="Facultad de Cultura Fisica BUAP - Vista de referencia"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
          </div>

          {/* Location info (like Google Maps) */}
          <div className="flex flex-col gap-1 border-b px-4 py-3">
            <h1 className="text-lg font-bold text-foreground leading-tight">
              Eco-Recicla BUAP
            </h1>
            <p className="text-sm text-muted-foreground">
              Facultad de Computacion
            </p>

            {/* Role toggle */}
            <div className="mt-2 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
              <div className="flex items-center gap-2">
                {isAdmin ? (
                  <Shield className="h-4 w-4 text-primary" />
                ) : (
                  <Star className="h-4 w-4 text-primary" />
                )}
                <span className="text-sm font-medium text-foreground">
                  {isAdmin ? "Administrador" : "Estudiante"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {isAdmin ? "Admin" : "Demo"}
                </span>
                <Switch checked={isAdmin} onCheckedChange={handleRoleToggle} />
              </div>
            </div>

            {/* Eco-Points for student */}
            {!isAdmin && (
              <div className="mt-1 flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    Eco-Points
                  </span>
                </div>
                <span className="text-lg font-bold text-primary">
                  {student.ecoPoints.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Action buttons row like Google Maps */}
          <div className="flex items-center justify-around border-b px-4 py-3">
            <Link
              href="/dashboard"
              className="flex flex-col items-center gap-1.5 group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors group-hover:bg-primary/90">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-primary">
                Dashboard
              </span>
            </Link>
            {isAdmin && (
              <>
                <button
                  onClick={handleAddPoint}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                    isAddingPoint
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground group-hover:bg-secondary/80"
                  }`}>
                    {isAddingPoint ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Plus className="h-5 w-5" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-foreground">
                    {isAddingPoint ? "Colocando" : "Agregar"}
                  </span>
                </button>
                <button
                  onClick={handleDrawPolygon}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                    isDrawingPolygon
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground group-hover:bg-secondary/80"
                  }`}>
                    {isDrawingPolygon ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Pentagon className="h-5 w-5" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-foreground">
                    {isDrawingPolygon ? "Dibujando" : "Area"}
                  </span>
                </button>
              </>
            )}
          </div>

          {/* Location details like Google Maps */}
          <ScrollArea className="flex-1">
            {selectedPoint ? (
              <TrashPointPanel
                point={selectedPoint}
                onClose={handleClosePanel}
                onClassify={handleClassify}
                isAdmin={isAdmin}
              />
            ) : (
              <div className="flex flex-col">
                {/* Info rows like Google Maps */}
                <div className="flex items-start gap-4 px-4 py-3 border-b">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground leading-relaxed">
                      Cd Universitaria, 72592 Heroica Puebla de Zaragoza, Pue.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 px-4 py-3 border-b">
                  <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-primary">Abierto</span>
                    <span className="text-sm text-muted-foreground">{" "}Cierra a las 9 PM</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 px-4 py-3 border-b">
                  <Globe className="h-5 w-5 text-muted-foreground shrink-0" />
                  <p className="text-sm text-primary flex-1">buap.mx</p>
                </div>
                <div className="flex items-center gap-4 px-4 py-3 border-b">
                  <Phone className="h-5 w-5 text-muted-foreground shrink-0" />
                  <p className="text-sm text-foreground flex-1">222 229 5500</p>
                </div>

                {/* Container list */}
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-foreground">
                      Contenedores ({trashPoints.length})
                    </h3>
                    <Link href="/dashboard" className="flex items-center gap-1 text-xs text-primary hover:underline">
                      Ver estadisticas
                      <ExternalLink className="h-3 w-3" />
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
          </ScrollArea>
        </div>
      </aside>

      {/* Collapse/expand toggle button (like Google Maps arrow) */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className={`fixed z-50 top-1/2 -translate-y-1/2 hidden md:flex items-center justify-center h-8 w-6 bg-card border border-l-0 border-border rounded-r-md shadow-md transition-all duration-300 ease-in-out hover:bg-muted ${
          sidebarCollapsed ? "left-0" : "left-[380px]"
        }`}
        aria-label={sidebarCollapsed ? "Expandir panel lateral" : "Colapsar panel lateral"}
      >
        {sidebarCollapsed ? (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Map area */}
      <main className="relative flex-1 pt-14 md:pt-0">
        {/* Floating Eco-Points badge on map for student - desktop */}
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
