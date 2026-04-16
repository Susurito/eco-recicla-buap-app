"use client"

import { useState } from "react"
import { type TrashPoint } from "@/lib/data"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import TrashPointForm from "./trash-point-form"
import { toast } from "sonner"

interface TrashPointModalProps {
  isOpen: boolean
  mode: "create" | "edit"
  point?: TrashPoint
  trashPoints: TrashPoint[]
  onClose: () => void
  onSuccess?: () => void
}

export default function TrashPointModal({
  isOpen,
  mode,
  point,
  trashPoints,
  onClose,
  onSuccess,
}: TrashPointModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (formData: any) => {
    setIsLoading(true)
    try {
      const url =
        mode === "create"
          ? "/api/trash-points"
          : `/api/trash-points/${point?.id}`
      const method = mode === "create" ? "POST" : "PATCH"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.error || `Error ${response.status}: ${response.statusText}`
        )
      }

      const result = await response.json()
      
      toast.success(
        mode === "create"
          ? "Contenedor creado exitosamente"
          : "Contenedor actualizado exitosamente"
      )
      
      onClose()
      onSuccess?.()
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido"
      toast.error(`Error: ${errorMessage}`)
      console.error("Submit error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] w-full max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? "Crear Nuevo Contenedor"
              : "Editar Contenedor"}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[calc(90vh-120px)]">
          <div className="pr-4">
            <TrashPointForm
              mode={mode}
              initialData={point}
              trashPoints={trashPoints}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
