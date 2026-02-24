"use client"

import { useState, useCallback } from "react"
import dynamic from "next/dynamic"
import {
  type TrashPoint,
  type PolygonArea,
  initialTrashPoints,
  studentData,
} from "@/lib/data"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import StudentDashboard from "@/components/student-dashboard"
import AdminDashboard from "@/components/admin-dashboard"
import TrashPointPanel from "@/components/trash-point-panel"
import {
  Leaf,
  Map,
  LayoutDashboard,
  Star,
  Shield,
  Menu,
  X,
  MapPin,
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
  const [activeTab, setActiveTab] = useState<string>("map")
  const [trashPoints, setTrashPoints] =
    useState<TrashPoint[]>(initialTrashPoints)
  const [selectedPoint, setSelectedPoint] = useState<TrashPoint | null>(null)
  const [polygonAreas, setPolygonAreas] = useState<PolygonArea[]>([])
  const [isAddingPoint, setIsAddingPoint] = useState(false)
  const [isDrawingPolygon, setIsDrawingPolygon] = useState(false)
  const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([])
  const [student, setStudent] = useState(studentData)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handlePointClick = useCallback((point: TrashPoint) => {
    setSelectedPoint(point)
    setActiveTab("map")
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
        className={`fixed inset-y-0 left-0 z-40 flex w-[380px] flex-col border-r bg-card shadow-lg transition-transform duration-300 md:relative md:translate-x-0 ${
          mobileMenuOpen
            ? "translate-x-0 pt-14"
            : "-translate-x-full pt-14 md:pt-0"
        }`}
      >
        {/* Sidebar header - desktop */}
        <div className="hidden flex-col gap-3 border-b p-4 md:flex">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Leaf className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-base font-bold text-foreground leading-tight">
                  Eco-Recicla BUAP
                </h1>
                <p className="text-xs text-muted-foreground">
                  Facultad de Computacion
                </p>
              </div>
            </div>
          </div>
          {/* Role toggle */}
          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-2">
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
            <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-2">
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

        {/* Tabs */}
        <Tabs
          value={selectedPoint ? "map" : activeTab}
          onValueChange={(val) => {
            setActiveTab(val)
            if (val !== "map") setSelectedPoint(null)
          }}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="border-b px-4 pt-2">
            <TabsList className="w-full">
              <TabsTrigger value="dashboard" className="flex-1 gap-1.5">
                <LayoutDashboard className="h-3.5 w-3.5" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="map" className="flex-1 gap-1.5">
                <Map className="h-3.5 w-3.5" />
                Mapa
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="dashboard"
            className="mt-0 flex-1 overflow-hidden"
          >
            {isAdmin ? (
              <AdminDashboard
                trashPoints={trashPoints}
                onAddPoint={handleAddPoint}
                onDrawPolygon={handleDrawPolygon}
                isAddingPoint={isAddingPoint}
                isDrawingPolygon={isDrawingPolygon}
              />
            ) : (
              <StudentDashboard student={student} />
            )}
          </TabsContent>

          <TabsContent value="map" className="mt-0 flex-1 overflow-hidden">
            {selectedPoint ? (
              <TrashPointPanel
                point={selectedPoint}
                onClose={handleClosePanel}
                onClassify={handleClassify}
                isAdmin={isAdmin}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    Selecciona un punto
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Haz clic en un contenedor del mapa para ver sus detalles
                    {isAdmin ? " y estadisticas" : " y clasificar residuos"}
                  </p>
                </div>
                {isAdmin && (isAddingPoint || isDrawingPolygon) && (
                  <Badge
                    variant="outline"
                    className="border-primary/30 text-primary"
                  >
                    {isAddingPoint
                      ? "Click en el mapa para colocar contenedor"
                      : `Dibujando area (${drawingPoints.length} puntos)`}
                  </Badge>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </aside>

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
