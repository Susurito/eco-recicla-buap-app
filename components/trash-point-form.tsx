"use client"

import { useState, useRef } from "react"
import { type TrashPoint } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AlertCircle, Upload, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

const CATEGORIES = [
  { value: "plastico", label: "Plástico" },
  { value: "papel", label: "Papel" },
  { value: "organico", label: "Orgánico" },
  { value: "general", label: "General" },
]

const VALID_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

interface TrashPointFormProps {
  mode: "create" | "edit"
  initialData?: TrashPoint
  trashPoints: TrashPoint[]
  onSubmit: (data: any) => Promise<void>
  isLoading: boolean
}

export default function TrashPointForm({
  mode,
  initialData,
  trashPoints,
  onSubmit,
  isLoading,
}: TrashPointFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    lat: initialData?.lat || 0,
    lng: initialData?.lng || 0,
    category: (initialData?.category || "general") as "plastico" | "papel" | "organico" | "general",
    fillLevel: initialData?.fillLevel || 0,
    detectedObject: initialData?.detectedObject || "",
    detectedImage: initialData?.detectedImage || "",
    alert: initialData?.alert || "",
  })

  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.detectedImage || null
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido"
    } else if (formData.name.trim().length > 455) {
      newErrors.name = "El nombre no puede exceder 455 caracteres"
    } else {
      // Check for unique name (exclude current point in edit mode)
      const isDuplicate = trashPoints.some(
        (p) =>
          p.name.toLowerCase() === formData.name.toLowerCase() &&
          (mode === "create" || p.id !== initialData?.id)
      )
      if (isDuplicate) {
        newErrors.name = "Ya existe un punto con este nombre"
      }
    }

    // Validate coordinates
    if (typeof formData.lat !== "number" || formData.lat < -90 || formData.lat > 90) {
      newErrors.lat = "La latitud debe estar entre -90 y 90"
    }
    if (typeof formData.lng !== "number" || formData.lng < -180 || formData.lng > 180) {
      newErrors.lng = "La longitud debe estar entre -180 y 180"
    } else {
      // Check for unique location (exact match, no tolerance)
      const isDuplicateLocation = trashPoints.some(
        (p) =>
          p.lat === formData.lat &&
          p.lng === formData.lng &&
          (mode === "create" || p.id !== initialData?.id)
      )
      if (isDuplicateLocation) {
        newErrors.location = "Ya existe un punto en esta ubicación"
      }
    }

    // Validate detected object
    if (!formData.detectedObject.trim()) {
      newErrors.detectedObject = "La descripción del objeto es requerida"
    }

    // Validate image
    if (!formData.detectedImage) {
      newErrors.detectedImage = "La imagen es requerida"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        detectedImage: "Solo se permiten formatos JPG, PNG y WebP",
      }))
      return
    }

    // Validate file size
    if (file.size > MAX_IMAGE_SIZE) {
      setErrors((prev) => ({
        ...prev,
        detectedImage: "La imagen no puede exceder 5MB",
      }))
      return
    }

    // Create preview and convert to base64
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setImagePreview(base64)
      setFormData((prev) => ({
        ...prev,
        detectedImage: base64,
      }))
      setErrors((prev) => {
        const { detectedImage, ...rest } = prev
        return rest
      })
    }
    reader.readAsDataURL(file)
  }

  const handleImageUrlChange = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      detectedImage: url,
    }))
    if (url) {
      setImagePreview(url)
      setErrors((prev) => {
        const { detectedImage, ...rest } = prev
        return rest
      })
    }
  }

  const handleClearImage = () => {
    setImagePreview(null)
    setFormData((prev) => ({
      ...prev,
      detectedImage: "",
    }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      await onSubmit(formData)
    } catch (error) {
      console.error("Form submission error:", error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Name Field */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nombre del Contenedor</Label>
        <Input
          id="name"
          type="text"
          placeholder="Ej: Contenedor Campus Central"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          className={errors.name ? "border-destructive" : ""}
          disabled={isLoading}
        />
        {errors.name && (
          <Alert variant="destructive" className="p-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{errors.name}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Location Error (applies to both lat and lng) */}
      {errors.location && (
        <Alert variant="destructive" className="p-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{errors.location}</AlertDescription>
        </Alert>
      )}

      {/* Coordinates */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="lat">Latitud</Label>
          <Input
            id="lat"
            type="number"
            step="0.0001"
            placeholder="-90 a 90"
            value={formData.lat}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, lat: parseFloat(e.target.value) }))
            }
            className={errors.lat ? "border-destructive" : ""}
            disabled={isLoading}
          />
          {errors.lat && (
            <Alert variant="destructive" className="p-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">{errors.lat}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="lng">Longitud</Label>
          <Input
            id="lng"
            type="number"
            step="0.0001"
            placeholder="-180 a 180"
            value={formData.lng}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, lng: parseFloat(e.target.value) }))
            }
            className={errors.lng ? "border-destructive" : ""}
            disabled={isLoading}
          />
          {errors.lng && (
            <Alert variant="destructive" className="p-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">{errors.lng}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Category */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="category">Categoría</Label>
        <Select
          value={formData.category || "general"}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, category: value as "plastico" | "papel" | "organico" | "general" }))
          }
          disabled={isLoading}
        >
          <SelectTrigger id="category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Fill Level */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>Nivel de Llenado</Label>
          <span className="text-sm font-semibold text-primary">
            {formData.fillLevel}%
          </span>
        </div>
        <Slider
          value={[formData.fillLevel]}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, fillLevel: value[0] }))
          }
          min={0}
          max={100}
          step={1}
          disabled={isLoading}
          className="w-full"
        />
      </div>

      {/* Detected Object */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="detectedObject">Descripción del Objeto</Label>
        <Textarea
          id="detectedObject"
          placeholder="Describe el objeto detectado..."
          value={formData.detectedObject}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, detectedObject: e.target.value }))
          }
          className={errors.detectedObject ? "border-destructive" : ""}
          disabled={isLoading}
          rows={3}
        />
        {errors.detectedObject && (
          <Alert variant="destructive" className="p-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {errors.detectedObject}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Image Upload */}
      <div className="flex flex-col gap-2">
        <Label>Imagen</Label>
        
        {imagePreview ? (
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="h-40 w-full rounded-lg border border-border object-cover"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 bg-background/80 hover:bg-background"
              onClick={handleClearImage}
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-8 hover:bg-muted/50"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-6 w-6 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium">Haz clic para subir imagen</p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG o WebP (máx 5MB)
                </p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              className="hidden"
              disabled={isLoading}
            />
          </div>
        )}
        
        {errors.detectedImage && (
          <Alert variant="destructive" className="p-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {errors.detectedImage}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Alert (Optional) */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="alert">Alerta (Opcional)</Label>
        <Input
          id="alert"
          type="text"
          placeholder="Ej: Contenedor dañado"
          value={formData.alert}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, alert: e.target.value }))
          }
          disabled={isLoading}
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? "Guardando..." : mode === "create" ? "Crear Contenedor" : "Actualizar Contenedor"}
      </Button>
    </form>
  )
}
