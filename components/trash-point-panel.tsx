"use client"

import { type TrashPoint, CATEGORY_COLORS, CATEGORY_LABELS } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, MapPin, AlertTriangle, CheckCircle, Edit2, Trash2 } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import * as tmImage from "@teachablemachine/image"

interface TrashPointPanelProps {
  point: TrashPoint
  onClose: () => void
  onClassify: (pointId: string, category: string) => void
  isAdmin: boolean
  onEdit?: (point: TrashPoint) => void
  onDelete?: (point: TrashPoint) => void
}

export default function TrashPointPanel({
  point,
  onClose,
  onClassify,
  isAdmin,
  onEdit,
  onDelete,
}: TrashPointPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [classified, setClassified] = useState(false)
  const [classificationResult, setClassificationResult] = useState<{
    type: "correct" | "incorrect"
    message: string
  } | null>(null)
  const [model, setModel] = useState<any>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [aiPrediction, setAiPrediction] = useState<any>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [modelAvailable, setModelAvailable] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cargar modelo al montar el componente
  useEffect(() => {
    const loadModel = async () => {
      try {
        const modelURL = "/modelo/model.json"
        const metadataURL = "/modelo/metadata.json"
        const loadedModel = await tmImage.load(modelURL, metadataURL)
        setModel(loadedModel)
      } catch (error) {
        console.error("Error cargando modelo:", error)
        setModelAvailable(false)
      }
    }
    loadModel()
  }, [])

  // Normalizar texto para comparación
  const normalizeText = (text: string): string => {
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  }

  // Manejar subida de imagen
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !model) return

    const imageUrl = URL.createObjectURL(file)
    setCapturedImage(imageUrl)
    setAiPrediction(null)
    setAnalyzing(true)

    // Predecir con el modelo
    const img = document.createElement("img")
    img.src = imageUrl

    await new Promise((resolve) => (img.onload = resolve))

    try {
      const predictions = await model.predict(img)
      const best = predictions.reduce((a: any, b: any) =>
        a.probability > b.probability ? a : b
      )
      setAiPrediction(best)
    } catch (error) {
      console.error("Error prediciendo imagen:", error)
      setAiPrediction(null)
    } finally {
      setAnalyzing(false)
    }
  }

  // Abrir selector de archivo
  const handleOpenCamera = () => {
    fileInputRef.current?.click()
  }

  const handleConfirm = () => {
    if (!selectedCategory || !capturedImage || !aiPrediction) return

    // Comparar predicción del modelo con selección del usuario
    const modelClass = normalizeText(aiPrediction.className)
    const userSelection = normalizeText(CATEGORY_LABELS[selectedCategory])

    if (modelClass === userSelection) {
      // Clasificación correcta
      onClassify(point.id, selectedCategory)
      setClassificationResult({
        type: "correct",
        message: `✅ Clasificación correcta: '${CATEGORY_LABELS[selectedCategory]}'`,
      })
    } else {
      // Clasificación incorrecta
      setClassificationResult({
        type: "incorrect",
        message: `❌ Clasificación incorrecta. Era: '${aiPrediction.className}'`,
      })
    }

    // Cerrar panel después de 2500ms
    setTimeout(() => {
      onClose()
    }, 2500)
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
              Estado de detección del objeto
            </p>
            <p
              className={`text-sm font-semibold ${
                !capturedImage
                  ? "text-muted-foreground"
                  : aiPrediction && !analyzing
                    ? "text-green-600"
                    : "text-muted-foreground"
              }`}
            >
              {!capturedImage
                ? "Sin detección del objeto"
                : aiPrediction && !analyzing
                  ? "✅ El objeto se analizó correctamente"
                  : "Sin detección del objeto"}
            </p>
          </div>

          {/* Botón para tomar/subir foto (solo estudiantes) */}
          {!isAdmin && (
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                onClick={handleOpenCamera}
                variant="outline"
                className="w-full gap-2"
              >
                📷 Tomar / Subir foto
              </Button>

              {/* Mostrar imagen subida */}
              {capturedImage && (
                <div className="flex flex-col items-center gap-2 rounded-lg bg-muted/30 p-3">
                  <img
                    src={capturedImage}
                    alt="Imagen subida"
                    className="max-w-[200px] h-auto rounded-lg border"
                  />
                </div>
              )}
            </div>
          )}

          {/* Classification for students */}
          {!isAdmin && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Clasificar residuo
              </p>
               <div className="grid grid-cols-2 gap-2">
                 {Object.keys(CATEGORY_LABELS).map((cat) => (
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

              {classificationResult ? (
                <>
                  <div
                    className={`flex items-center justify-center gap-2 rounded-lg p-3 ${
                      classificationResult.type === "correct"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    <span className="text-sm font-medium">
                      {classificationResult.message}
                    </span>
                  </div>
                  {classificationResult.type === "correct" && (
                    <div className="flex items-center justify-center gap-2 rounded-lg bg-primary/10 p-3 text-primary">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        +10 Eco-Points ganados
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <Button
                  onClick={handleConfirm}
                  disabled={
                    !selectedCategory ||
                    !capturedImage ||
                    !aiPrediction ||
                    analyzing
                  }
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

                {/* Admin Actions */}
                <div className="flex gap-2 border-t pt-3">
                  <Button
                    onClick={() => onEdit?.(point)}
                    variant="outline"
                    className="flex-1 gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    onClick={() => onDelete?.(point)}
                    variant="destructive"
                    className="flex-1 gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </Button>
                </div>
             </div>
           )}
        </div>
      </ScrollArea>
    </div>
  )
}
