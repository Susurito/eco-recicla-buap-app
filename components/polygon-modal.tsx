"use client"

import { useState, useEffect } from "react"
import { type PolygonArea } from "@/lib/data"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface PolygonModalProps {
  isOpen: boolean
  polygon?: PolygonArea
  onClose: () => void
  onSave: (polygon: PolygonArea) => void
  onEditShape?: (polygon: PolygonArea) => void
}

export default function PolygonModal({
  isOpen,
  polygon,
  onClose,
  onSave,
  onEditShape,
}: PolygonModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [color, setColor] = useState("#8b5cf6")

  useEffect(() => {
    if (polygon && isOpen) {
      setName(polygon.name)
      setDescription(polygon.description || "")
      setColor(polygon.color)
    }
  }, [polygon, isOpen])

  const handleSave = () => {
    if (!name.trim()) return
    if (!polygon) return

    const updatedPolygon: PolygonArea = {
      ...polygon,
      name: name.trim(),
      description: description.trim() || undefined,
      color,
    }
    onSave(updatedPolygon)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] w-full">
        <DialogHeader>
          <DialogTitle>Editar Área</DialogTitle>
          <DialogDescription>
            Modifica los detalles del área de optimización
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre del Área *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Sector de Cafetería"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Zona con mayor concentración de residuos"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="color">Color</Label>
            <div className="flex items-center gap-2 mt-1">
              <input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-16 rounded cursor-pointer"
              />
              <span className="text-sm text-muted-foreground">{color}</span>
            </div>
          </div>
        </div>

         <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2">
           <div className="flex gap-2">
             <Button variant="outline" onClick={onClose}>
               Cancelar
             </Button>
             <Button
               onClick={handleSave}
               disabled={!name.trim()}
             >
               Guardar Cambios
             </Button>
           </div>
           {onEditShape && polygon && (
             <Button
               variant="secondary"
               onClick={() => onEditShape(polygon)}
             >
               Editar Forma del Polígono
             </Button>
           )}
         </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
