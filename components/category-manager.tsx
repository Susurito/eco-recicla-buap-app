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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit2, Trash, Layers, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface Category {
  id: string
  name: string
  description?: string
  color: string
  _count?: {
    prizes: number
  }
}

export default function CategoryManager() {
  // Category Management States
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [categoryModalMode, setCategoryModalMode] = useState<"create" | "edit">("create")
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>()
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | undefined>()
  const [isDeletingCategory, setIsDeletingCategory] = useState(false)
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
  })

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories()
  }, [])

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

  const handleAddCategoryClick = () => {
    setCategoryModalMode("create")
    setSelectedCategory(undefined)
    setCategoryFormData({
      name: "",
      description: "",
      color: "#3b82f6",
    })
    setFormErrors([])
    setCategoryModalOpen(true)
  }

  const handleEditCategory = (category: Category) => {
    setCategoryModalMode("edit")
    setSelectedCategory(category)
    setCategoryFormData({
      name: category.name,
      description: category.description || "",
      color: category.color,
    })
    setFormErrors([])
    setCategoryModalOpen(true)
  }

  const handleDeleteCategoryClick = (category: Category) => {
    setCategoryToDelete(category)
    setDeleteCategoryDialogOpen(true)
  }

  const handleDeleteCategoryConfirm = async () => {
    if (!categoryToDelete) return

    setIsDeletingCategory(true)
    try {
      const response = await fetch(`/api/categories/${categoryToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al eliminar")
      }

      toast.success("Categoría eliminada exitosamente")
      setDeleteCategoryDialogOpen(false)
      setCategoryToDelete(undefined)
      fetchCategories()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      toast.error(`Error: ${errorMessage}`)
    } finally {
      setIsDeletingCategory(false)
    }
  }

  const handleCreateOrUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormErrors([])

    // Validation
    if (!categoryFormData.name.trim()) {
      setFormErrors(["El nombre es requerido"])
      return
    }

    if (!categoryFormData.color.trim() || !/^#[0-9A-F]{6}$/i.test(categoryFormData.color)) {
      setFormErrors(["El color debe ser un código hexadecimal válido (ej: #3b82f6)"])
      return
    }

    try {
      const url = categoryModalMode === "create" ? "/api/categories" : `/api/categories/${selectedCategory?.id}`
      const method = categoryModalMode === "create" ? "POST" : "PUT"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: categoryFormData.name.trim(),
          description: categoryFormData.description.trim() || undefined,
          color: categoryFormData.color.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errors = errorData.details || [errorData.error]
        setFormErrors(Array.isArray(errors) ? errors : [errorData.error])
        toast.error(errorData.error || "Error al guardar la categoría")
        return
      }

      toast.success(
        categoryModalMode === "create"
          ? "Categoría creada exitosamente"
          : "Categoría actualizada exitosamente"
      )
      setCategoryModalOpen(false)
      fetchCategories()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      setFormErrors([errorMessage])
      toast.error(`Error: ${errorMessage}`)
    }
  }

  return (
    <>
      {/* Category Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold">
                Gestionar Categorías ({categories.length})
              </CardTitle>
            </div>
            <Button
              onClick={handleAddCategoryClick}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Agregar Categoría
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingCategories ? (
            <div className="flex items-center justify-center py-4">
              <p className="text-sm text-muted-foreground">Cargando categorías...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">No hay categorías creadas aún</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Premios</TableHead>
                    <TableHead className="w-24">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                        {category.description || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-6 w-6 rounded border"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-xs font-mono">{category.color}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {category._count?.prizes || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCategory(category)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCategoryClick(category)}
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

      {/* Category Modal Dialog */}
      <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {categoryModalMode === "create" ? "Crear Nueva Categoría" : "Editar Categoría"}
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

          <form onSubmit={handleCreateOrUpdateCategory} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Nombre de la Categoría</Label>
              <Input
                id="category-name"
                placeholder="ej: Internet, Académico, Cafetería"
                value={categoryFormData.name}
                onChange={(e) =>
                  setCategoryFormData({ ...categoryFormData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-description">Descripción (Opcional)</Label>
              <Textarea
                id="category-description"
                placeholder="Describe la categoría..."
                value={categoryFormData.description}
                onChange={(e) =>
                  setCategoryFormData({ ...categoryFormData, description: e.target.value })
                }
                className="resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-color">Color (Código Hexadecimal)</Label>
              <div className="flex gap-2">
                <Input
                  id="category-color"
                  type="text"
                  placeholder="#3b82f6"
                  value={categoryFormData.color}
                  onChange={(e) =>
                    setCategoryFormData({ ...categoryFormData, color: e.target.value })
                  }
                />
                <div
                  className="h-10 w-20 rounded border"
                  style={{ backgroundColor: categoryFormData.color }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Formato: #RRGGBB (ej: #3b82f6, #ef4444, #10b981)
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCategoryModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {categoryModalMode === "create" ? "Crear Categoría" : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Delete Confirmation Dialog */}
      <AlertDialog open={deleteCategoryDialogOpen} onOpenChange={setDeleteCategoryDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Categoría</AlertDialogTitle>
            <AlertDialogDescription>
              {categoryToDelete && categoryToDelete._count && categoryToDelete._count.prizes > 0 ? (
                <div className="space-y-2">
                  <p>
                    No se puede eliminar "{categoryToDelete.name}" porque tiene{" "}
                    <strong>{categoryToDelete._count.prizes} premio(s)</strong> asociado(s).
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Elimine los premios primero antes de eliminar la categoría.
                  </p>
                </div>
              ) : (
                <p>
                  ¿Está seguro de que desea eliminar "{categoryToDelete?.name}"?
                  Esta acción no se puede deshacer.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            {categoryToDelete && categoryToDelete._count && categoryToDelete._count.prizes === 0 && (
              <AlertDialogAction
                onClick={handleDeleteCategoryConfirm}
                disabled={isDeletingCategory}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeletingCategory ? "Eliminando..." : "Eliminar"}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
