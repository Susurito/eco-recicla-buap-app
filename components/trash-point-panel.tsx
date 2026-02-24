"use client"

import { type TrashPoint, CATEGORY_COLORS, CATEGORY_LABELS } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, MapPin, AlertTriangle, CheckCircle } from "lucide-react"
import { useState } from "react"

interface TrashPointPanelProps {
  point: TrashPoint
  onClose: () => void
  onClassify: (pointId: string, category: string) => void
  isAdmin: boolean
}

export default function TrashPointPanel({
  point,
  onClose,
  onClassify,
  isAdmin,
}: TrashPointPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [classified, setClassified] = useState(false)

  const categories = ["plastico", "papel", "organico", "general"]

  const handleConfirm = () => {
    if (!selectedCategory) return
    onClassify(point.id, selectedCategory)
    setClassified(true)
    setTimeout(() => {
      setClassified(false)
      setSelectedCategory(null)
    }, 2000)
  }

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header like Google Maps place card */}
      <div className="relative">
        <div className="h-40 w-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold"
              style={{
                backgroundColor:
                  point.fillLevel > 80
                    ? "#ef4444"
                    : point.fillLevel > 50
                      ? "#eab308"
                      : "#10b981",
                color: "white",
              }}
            >
              {point.fillLevel}%
            </div>
            <span className="text-xs text-muted-foreground">
              Nivel de llenado
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className="absolute top-2 right-2 bg-card/80 hover:bg-card"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 p-4">
          {/* Point name & location */}
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {point.name}
            </h3>
            <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>
                {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
              </span>
            </div>
          </div>

          {/* Alert if any */}
          {point.alert && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">
                {point.alert}
              </span>
            </div>
          )}

          {/* Detected object */}
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Objeto detectado
            </p>
            <p className="text-sm font-semibold text-foreground">
              {point.detectedObject}
            </p>
          </div>

          {/* Classification for students */}
          {!isAdmin && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Clasificar residuo
              </p>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex items-center gap-2 rounded-lg border-2 p-3 text-left text-sm font-medium transition-all ${
                      selectedCategory === cat
                        ? "border-current shadow-sm"
                        : "border-transparent bg-muted/50 hover:bg-muted"
                    }`}
                    style={{
                      color:
                        selectedCategory === cat
                          ? CATEGORY_COLORS[cat]
                          : undefined,
                      borderColor:
                        selectedCategory === cat
                          ? CATEGORY_COLORS[cat]
                          : undefined,
                      backgroundColor:
                        selectedCategory === cat
                          ? `${CATEGORY_COLORS[cat]}10`
                          : undefined,
                    }}
                  >
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                    />
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>

              {classified ? (
                <div className="flex items-center justify-center gap-2 rounded-lg bg-primary/10 p-3 text-primary">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    +10 Eco-Points ganados
                  </span>
                </div>
              ) : (
                <Button
                  onClick={handleConfirm}
                  disabled={!selectedCategory}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Confirmar Clasificacion
                </Button>
              )}
            </div>
          )}

          {/* Admin stats */}
          {isAdmin && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Estadisticas de hoy
              </p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(point.todayStats).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center gap-2 rounded-lg bg-muted/50 p-3"
                  >
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          CATEGORY_COLORS[key] || CATEGORY_COLORS.general,
                      }}
                    />
                    <div>
                      <p className="text-lg font-bold text-foreground leading-none">
                        {value}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {CATEGORY_LABELS[key] || key}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3 text-sm">
                <span className="text-muted-foreground">
                  Ultima recoleccion
                </span>
                <span className="font-medium text-foreground">
                  {point.lastCollected}
                </span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
