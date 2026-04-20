"use client"

import { useState } from "react"
import {
  type TrashPoint,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
} from "@/lib/data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
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
} from "recharts"
import {
  Trash2,
  AlertTriangle,
  TrendingUp,
  Users,
  MapPin,
  Plus,
  Pentagon,
  CheckCircle,
} from "lucide-react"
import TrashPointModal from "./trash-point-modal"
import DeleteConfirmDialog from "./delete-confirm-dialog"
import { toast } from "sonner"

interface AdminDashboardProps {
  trashPoints: TrashPoint[]
  onAddPoint: () => void
  onDrawPolygon: () => void
  isAddingPoint: boolean
  isDrawingPolygon: boolean
  onPointsUpdate?: () => void
}

export default function AdminDashboard({
  trashPoints,
  onAddPoint,
  onDrawPolygon,
  isAddingPoint,
  isDrawingPolygon,
  onPointsUpdate,
}: AdminDashboardProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [selectedPoint, setSelectedPoint] = useState<TrashPoint | undefined>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pointToDelete, setPointToDelete] = useState<TrashPoint | undefined>()
  const [isDeleting, setIsDeleting] = useState(false)

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
    trashPoints.length > 0
      ? trashPoints.reduce((acc, p) => acc + p.fillLevel, 0) / trashPoints.length
      : 0
  const alertCount = trashPoints.filter((p) => p.alert).length
  const criticalPoints = trashPoints.filter((p) => p.fillLevel > 80)

  // Bar chart data
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

  // Pie chart data
  const pieData = barData.map((d) => ({ name: d.name, value: d.value, fill: d.fill }))

  const handleAddClick = () => {
    setModalMode("create")
    setSelectedPoint(undefined)
    setModalOpen(true)
  }

  const handleEditPoint = (point: TrashPoint) => {
    setModalMode("edit")
    setSelectedPoint(point)
    setModalOpen(true)
  }

  const handleDeleteClick = (point: TrashPoint) => {
    setPointToDelete(point)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!pointToDelete) return
    
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/trash-points/${pointToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al eliminar")
      }

      toast.success("Contenedor eliminado exitosamente")
      setDeleteDialogOpen(false)
      setPointToDelete(undefined)
      onPointsUpdate?.()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      toast.error(`Error: ${errorMessage}`)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <ScrollArea className="h-full">
        <div className="flex flex-col gap-4 p-4">
          {/* Admin Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Panel de Control
              </h2>
              <p className="text-sm text-muted-foreground">
                Monitoreo en tiempo real
              </p>
            </div>
            <Badge variant="outline" className="text-primary border-primary/30">
              Admin
            </Badge>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="flex items-center gap-3 p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Trash2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground leading-none">
                    {totalCollected}
                  </p>
                  <p className="text-xs text-muted-foreground">Residuos hoy</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                  <TrendingUp className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground leading-none">
                    {avgFill.toFixed(0)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Llenado prom.</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground leading-none">
                    {alertCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Alertas</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                  <MapPin className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground leading-none">
                    {trashPoints.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Contenedores</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Admin actions */}
          <div className="flex flex-col gap-2">
            <Button
              variant={isAddingPoint ? "default" : "outline"}
              className={
                isAddingPoint
                  ? "bg-primary text-primary-foreground"
                  : "border-primary/30 text-primary hover:bg-primary/10"
              }
              onClick={isAddingPoint ? onAddPoint : handleAddClick}
            >
              {isAddingPoint ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Click en el mapa para colocar
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Agregar Contenedor
                </>
              )}
            </Button>
            <Button
              variant={isDrawingPolygon ? "default" : "outline"}
              className={
                isDrawingPolygon
                  ? "bg-primary text-primary-foreground"
                  : "border-primary/30 text-primary hover:bg-primary/10"
              }
              onClick={onDrawPolygon}
            >
              {isDrawingPolygon ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Dibujando area... (Click para terminar)
                </>
              ) : (
                <>
                  <Pentagon className="h-4 w-4" />
                  Definir Area de Optimizacion
                </>
              )}
            </Button>
          </div>

          {/* Bar Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                Recoleccion por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                id="admin-bar-chart"
                config={{
                  value: { label: "Cantidad" },
                }}
                className="h-[200px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                Distribucion de Residuos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                id="admin-pie-chart"
                config={{
                  value: { label: "Cantidad" },
                }}
                className="h-[200px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
                {barData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
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

          {/* Critical Points */}
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
                      className="flex items-center justify-between rounded-lg bg-destructive/5 p-2"
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
                          className="h-1.5 w-16"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Container List */}
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
                    className="flex items-center justify-between rounded-lg bg-muted/50 p-2"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            point.fillLevel > 80
                              ? "#ef4444"
                              : point.fillLevel > 50
                                ? "#eab308"
                                : "#10b981",
                        }}
                      />
                      <span className="text-sm text-foreground">{point.name}</span>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      {point.fillLevel}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      {/* Modals */}
      <TrashPointModal
        isOpen={modalOpen}
        mode={modalMode}
        point={selectedPoint}
        trashPoints={trashPoints}
        onClose={() => {
          setModalOpen(false)
          setSelectedPoint(undefined)
        }}
        onSuccess={onPointsUpdate}
      />

      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        pointName={pointToDelete?.name || ""}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteDialogOpen(false)
          setPointToDelete(undefined)
        }}
        isLoading={isDeleting}
      />
    </>
  )
}
