"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit2, Trash, Gift, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Prize {
  id: string
  name: string
  description: string
  cost: number
  icon: string
  categoryId: string
  category?: {
    id: string
    name: string
    color: string
  }
}

interface Category {
  id: string
  name: string
  description?: string
  color: string
}

export default function PrizeManager() {
  // Prize Management States
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [prizeModalOpen, setPrizeModalOpen] = useState(false)
  const [prizeModalMode, setPrizeModalMode] = useState<"create" | "edit">("create")
  const [selectedPrize, setSelectedPrize] = useState<Prize | undefined>()
  const [deletePrizeDialogOpen, setDeletePrizeDialogOpen] = useState(false)
  const [prizeToDelete, setPrizeToDelete] = useState<Prize | undefined>()
  const [isDeletingPrize, setIsDeletingPrize] = useState(false)
  const [isLoadingPrizes, setIsLoadingPrizes] = useState(false)
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [isCreatingPrize, setIsCreatingPrize] = useState(false)
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [prizeFormData, setPrizeFormData] = useState({
    name: "",
    description: "",
    cost: "",
    icon: "",
    categoryId: "",
  })

  // Fetch prizes and categories on component mount
  useEffect(() => {
    fetchPrizes()
    fetchCategories()
  }, [])

  const fetchPrizes = async () => {
    try {
      setIsLoadingPrizes(true)
      const response = await fetch("/api/prizes?limit=100")
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to fetch prizes")
      }
      const data = await response.json()
      setPrizes(data.data || [])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      console.error("Error fetching prizes:", error)
      toast.error(`Error al cargar los premios: ${errorMessage}`)
    } finally {
      setIsLoadingPrizes(false)
    }
  }

  const fetchCategories = async () => {
    try {
      setIsLoadingCategories(true)
      const response = await fetch("/api/categories?limit=100")
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to fetch categories")
      }
      const data = await response.json()
      setCategories(data.data || [])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      console.error("Error fetching categories:", error)
      toast.error(`Error al cargar las categorías: ${errorMessage}`)
    } finally {
      setIsLoadingCategories(false)
    }
  }

  const handleAddPrizeClick = () => {
    setPrizeModalMode("create")
    setSelectedPrize(undefined)
    setPrizeFormData({
      name: "",
      description: "",
      cost: "",
      icon: "",
      categoryId: "",
    })
    setFormErrors([])
    setPrizeModalOpen(true)
  }

  const handleEditPrize = (prize: Prize) => {
    setPrizeModalMode("edit")
    setSelectedPrize(prize)
    setPrizeFormData({
      name: prize.name,
      description: prize.description,
      cost: prize.cost.toString(),
      icon: prize.icon,
      categoryId: prize.categoryId,
    })
    setFormErrors([])
    setPrizeModalOpen(true)
  }

  const handleDeletePrizeClick = (prize: Prize) => {
    setPrizeToDelete(prize)
    setDeletePrizeDialogOpen(true)
  }

  const handleDeletePrizeConfirm = async () => {
    if (!prizeToDelete) return

    setIsDeletingPrize(true)
    try {
      const response = await fetch(`/api/prizes/${prizeToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al eliminar")
      }

      toast.success("Premio eliminado exitosamente")
      setDeletePrizeDialogOpen(false)
      setPrizeToDelete(undefined)
      fetchPrizes()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      toast.error(`Error: ${errorMessage}`)
    } finally {
      setIsDeletingPrize(false)
    }
  }

  const handleCreateOrUpdatePrize = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormErrors([])

    // Validation
    if (!prizeFormData.name.trim()) {
      setFormErrors(["El nombre del premio es requerido"])
      return
    }

    if (!prizeFormData.description.trim()) {
      setFormErrors(["La descripción es requerida"])
      return
    }

    if (!prizeFormData.cost) {
      setFormErrors(["El costo es requerido"])
      return
    }

    if (!prizeFormData.icon.trim()) {
      setFormErrors(["El icono es requerido"])
      return
    }

    if (!prizeFormData.categoryId) {
      setFormErrors(["La categoría es requerida"])
      return
    }

    const cost = parseInt(prizeFormData.cost)
    if (isNaN(cost) || cost <= 0) {
      setFormErrors(["El costo debe ser un número positivo"])
      return
    }

    setIsCreatingPrize(true)
    try {
      const url = prizeModalMode === "create" ? "/api/prizes" : `/api/prizes/${selectedPrize?.id}`
      const method = prizeModalMode === "create" ? "POST" : "PUT"

      const requestBody = {
        name: prizeFormData.name.trim(),
        description: prizeFormData.description.trim(),
        cost,
        icon: prizeFormData.icon.trim(),
        categoryId: prizeFormData.categoryId,
      }

      console.log(`[PrizeManager] ${method} request:`, requestBody)

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      const responseData = await response.json()
      console.log(`[PrizeManager] ${method} response:`, responseData)

      if (!response.ok) {
        const errors = responseData.details || [responseData.error]
        setFormErrors(Array.isArray(errors) ? errors : [responseData.error])
        toast.error(responseData.error || `Error al ${prizeModalMode === "create" ? "crear" : "editar"} el premio`)
        return
      }

      toast.success(prizeModalMode === "create" ? "Premio creado exitosamente" : "Premio actualizado exitosamente")
      setPrizeModalOpen(false)
      fetchPrizes()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      console.error(`[PrizeManager] ${prizeModalMode} error:`, error)
      setFormErrors([errorMessage])
      toast.error(`Error: ${errorMessage}`)
    } finally {
      setIsCreatingPrize(false)
    }
  }

  return (
    <>
      {/* Prize Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold">
                Gestionar Premios ({prizes.length})
              </CardTitle>
            </div>
            <Button
              onClick={handleAddPrizeClick}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Agregar Premio
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingPrizes ? (
            <div className="flex items-center justify-center py-4">
              <p className="text-sm text-muted-foreground">Cargando premios...</p>
            </div>
          ) : prizes.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">No hay premios creados aún</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Costo</TableHead>
                    <TableHead className="w-24">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prizes.map((prize) => (
                    <TableRow key={prize.id}>
                      <TableCell className="font-medium">{prize.name}</TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                        {prize.description}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          style={{
                            backgroundColor: prize.category?.color ? `${prize.category.color}15` : undefined,
                            borderColor: prize.category?.color || undefined,
                            color: prize.category?.color || undefined,
                          }}
                        >
                          {prize.category?.name || "Sin categoría"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{prize.cost}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPrize(prize)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePrizeClick(prize)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prize Modal Dialog */}
      <Dialog open={prizeModalOpen} onOpenChange={setPrizeModalOpen}>
        <DialogContent 
          className="sm:max-w-[500px] overflow-visible"
          onPointerDownOutside={(e) => {
            // Prevent dialog from closing when clicking select dropdown
            if ((e.target as HTMLElement).closest('[role="listbox"]') ||
                (e.target as HTMLElement).closest('[role="button"]')?.getAttribute('aria-haspopup') === 'listbox') {
              e.preventDefault()
            }
          }}
          onInteractOutside={(e) => {
            // Prevent dialog from closing when interacting with select
            if ((e.target as HTMLElement).closest('[role="listbox"]') ||
                (e.target as HTMLElement).closest('[role="button"]')?.getAttribute('aria-haspopup') === 'listbox') {
              e.preventDefault()
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {prizeModalMode === "create" ? "Crear Nuevo Premio" : "Editar Premio"}
            </DialogTitle>
          </DialogHeader>

          {formErrors.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
                <div className="flex-1">
                  {formErrors.map((error, idx) => (
                    <p key={idx} className="text-sm text-red-700">
                      {error}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleCreateOrUpdatePrize} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prize-name">Nombre del Premio</Label>
              <Input
                id="prize-name"
                placeholder="ej: Pase de Internet Gratis"
                value={prizeFormData.name}
                onChange={(e) =>
                  setPrizeFormData({ ...prizeFormData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prize-description">Descripción</Label>
              <Textarea
                id="prize-description"
                placeholder="Describe el premio..."
                value={prizeFormData.description}
                onChange={(e) =>
                  setPrizeFormData({ ...prizeFormData, description: e.target.value })
                }
                className="resize-none"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prize-cost">Costo (Eco Puntos)</Label>
                <Input
                  id="prize-cost"
                  type="number"
                  placeholder="100"
                  value={prizeFormData.cost}
                  onChange={(e) =>
                    setPrizeFormData({ ...prizeFormData, cost: e.target.value })
                  }
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prize-icon">Icono (Lucide)</Label>
                <Input
                  id="prize-icon"
                  placeholder="ej: gift, star, crown"
                  value={prizeFormData.icon}
                  onChange={(e) =>
                    setPrizeFormData({ ...prizeFormData, icon: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prize-category">Categoría</Label>
              {isLoadingCategories ? (
                <div className="flex items-center gap-2 rounded border border-dashed p-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Cargando categorías...</span>
                </div>
              ) : categories.length === 0 ? (
                <div className="rounded border border-orange-200 bg-orange-50 p-2">
                  <p className="text-sm text-orange-700">
                    No hay categorías disponibles. Cree una primero.
                  </p>
                </div>
              ) : (
                <div className="relative z-50" onClick={(e) => e.stopPropagation()}>
                  <Select
                     value={prizeFormData.categoryId}
                     onValueChange={(value) =>
                       setPrizeFormData({
                         ...prizeFormData,
                         categoryId: value,
                       })
                     }
                   >
                      <SelectTrigger 
                        id="prize-category"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SelectValue placeholder="Seleccione una categoría" />
                      </SelectTrigger>
                     <SelectContent side="top" className="z-50">
                       {categories.map((category) => (
                         <SelectItem key={category.id} value={category.id}>
                           {category.name}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPrizeModalOpen(false)}
                disabled={isCreatingPrize}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreatingPrize || isLoadingCategories}>
                {isCreatingPrize ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {prizeModalMode === "create" ? "Creando..." : "Guardando..."}
                  </>
                ) : prizeModalMode === "create" ? (
                  "Crear Premio"
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Prize Delete Confirmation Dialog */}
      <AlertDialog open={deletePrizeDialogOpen} onOpenChange={setDeletePrizeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Premio</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de que desea eliminar "{prizeToDelete?.name}"?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePrizeConfirm}
              disabled={isDeletingPrize}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingPrize ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
