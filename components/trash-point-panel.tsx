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
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

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

    // Limpiar cámara al desmontar
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  // Normalizar texto para comparación
  const normalizeText = (text: string): string => {
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  }

  // Configurar video cuando la cámara se activa
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      const video = videoRef.current
      video.srcObject = streamRef.current
      video.onloadedmetadata = () => {
        video.play().catch((error) => {
          console.error("Error reproduciendo video:", error)
        })
      }
    }
  }, [cameraActive])

  // Iniciar cámara
  const startCamera = async () => {
    try {
      setCameraError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Cámara trasera en móviles
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      streamRef.current = stream
      setCameraActive(true)
    } catch (error) {
      console.error("Error accediendo a la cámara:", error)
      setCameraError("No se pudo acceder a la cámara. Verifica los permisos.")
      setCameraActive(false)
    }
  }

  // Detener cámara
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }

  // Capturar foto desde el video
  const capturePhotoFromCamera = async () => {
    if (!videoRef.current || !canvasRef.current || !model) return

    try {
      setAnalyzing(true)

      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext("2d")

      if (!context) return

      // Esperar a que el video esté listo
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        await new Promise((resolve) => {
          setTimeout(() => resolve(null), 500)
        })
      }

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Dibujar frame actual del video
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convertir canvas a imagen
      const imageUrl = canvas.toDataURL("image/jpeg", 0.95)
      setCapturedImage(imageUrl)
      setAiPrediction(null)

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
      }

      // Cerrar cámara después de capturar
      stopCamera()
    } catch (error) {
      console.error("Error capturando foto:", error)
    } finally {
      setAnalyzing(false)
    }
  }

  // Manejar subida de imagen desde archivo
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
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="file-input"
              />

              {cameraError && (
                <div className="rounded-lg bg-red-100 p-3 text-red-700 text-sm">
                  {cameraError}
                </div>
              )}

              {cameraActive ? (
                <>
                  <div className="relative w-full rounded-lg overflow-hidden bg-black border">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      style={{
                        display: "block",
                        width: "100%",
                        height: "auto",
                        aspectRatio: "16/9",
                        objectFit: "cover",
                      }}
                    />
                    <canvas
                      ref={canvasRef}
                      className="hidden"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={capturePhotoFromCamera}
                      disabled={analyzing}
                      className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                    >
                      📸 Capturar foto
                    </Button>
                    <Button
                      onClick={stopCamera}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={startCamera}
                    disabled={!modelAvailable}
                    className="flex-1 gap-2 bg-primary"
                  >
                    📷 Abrir cámara
                  </Button>
                  <Button
                    onClick={() => document.getElementById("file-input")?.click()}
                    variant="outline"
                    className="flex-1"
                  >
                    📁 Subir foto
                  </Button>
                </div>
              )}

              {/* Mostrar imagen capturada */}
              {capturedImage && (
                <div className="flex flex-col items-center gap-2 rounded-lg bg-muted/30 p-4">
                  <img
                    src={capturedImage}
                    alt="Foto capturada"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "300px",
                      width: "auto",
                      height: "auto",
                    }}
                    className="rounded-lg border"
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
