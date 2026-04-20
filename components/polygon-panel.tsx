"use client"

import { type PolygonArea } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, Edit2, Trash2 } from "lucide-react"

interface PolygonPanelProps {
  polygon: PolygonArea
  onClose: () => void
  isAdmin: boolean
  onEdit?: (polygon: PolygonArea) => void
  onDelete?: (polygon: PolygonArea) => void
}

export default function PolygonPanel({
  polygon,
  onClose,
  isAdmin,
  onEdit,
  onDelete,
}: PolygonPanelProps) {
  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header */}
      <div className="relative">
        <div
          className="h-40 w-full flex items-center justify-center"
          style={{
            backgroundColor: polygon.color,
            opacity: 0.2,
          }}
        >
          <div className="flex flex-col items-center gap-2">
            <div
              className="h-12 w-12 rounded-full"
              style={{ backgroundColor: polygon.color }}
            />
            <span className="text-xs text-muted-foreground">
              Área de Optimización
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
          {/* Área info */}
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {polygon.name}
            </h3>
            {polygon.description && (
              <p className="mt-2 text-sm text-muted-foreground">
                {polygon.description}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-2xl font-bold text-foreground">
                {polygon.points.length}
              </p>
              <p className="text-xs text-muted-foreground">
                Puntos del polígono
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 flex items-center justify-center">
              <div
                className="h-8 w-8 rounded"
                style={{ backgroundColor: polygon.color }}
              />
            </div>
          </div>

           {/* Admin Actions */}
           {isAdmin && (
             <div className="flex gap-2 border-t pt-3">
               <Button
                 onClick={() => onEdit?.(polygon)}
                 variant="outline"
                 className="flex-1 gap-2"
               >
                 <Edit2 className="h-4 w-4" />
                 Editar
               </Button>
               <Button
                 onClick={() => onDelete?.(polygon)}
                 variant="destructive"
                 className="flex-1 gap-2"
               >
                 <Trash2 className="h-4 w-4" />
                 Eliminar
               </Button>
             </div>
           )}
        </div>
      </ScrollArea>
    </div>
  )
}
