"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import Link from "next/link"
import Image from "next/image"
import {
  type TrashPoint,
  type PolygonArea,
  BUAP_CENTER,
  BUAP_ZOOM,
} from "@/lib/data"
import { useSession } from "@/lib/session-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import TrashPointPanel from "@/components/trash-point-panel"
import TrashPointModal from "@/components/trash-point-modal"
import PolygonPanel from "@/components/polygon-panel"
import PolygonModal from "@/components/polygon-modal"
import DeleteConfirmDialog from "@/components/delete-confirm-dialog"
import { toast } from "sonner"
import {
  Leaf,
  LayoutDashboard,
  Star,
  Menu,
  X,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pentagon,
  CheckCircle,
  Globe,
  Phone,
  User,
} from "lucide-react"

const MapView = dynamic(() => import("@/components/map-view"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-muted/30">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground">Cargando mapa...</span>
      </div>
    </div>
  ),
})

export default function EcoReciclaBUAP() {
  const router = useRouter()
  const { session, loading } = useSession()
  // Derive isAdmin from session.user.role (from database)
  const isAdmin = session?.user?.role === "admin"
  const [trashPoints, setTrashPoints] =
    useState<TrashPoint[]>([])
  const [selectedPoint, setSelectedPoint] = useState<TrashPoint | null>(null)
  const [polygonAreas, setPolygonAreas] = useState<PolygonArea[]>([])
  const [isAddingPoint, setIsAddingPoint] = useState(false)
  const [isDrawingPolygon, setIsDrawingPolygon] = useState(false)
  const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([])
  const [student, setStudent] = useState({
    boleta: "",
    name: "",
    ecoPoints: 0,
    classifications: 0,
    level: "Principiante",
  })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [studentData_local, setStudentData_local] = useState<{
    name: string
    email: string
    image: string | null
  } | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [selectedPointForModal, setSelectedPointForModal] = useState<TrashPoint | undefined>()
  
  // Estado para eliminación de contenedores
  const [deletePointConfirmOpen, setDeletePointConfirmOpen] = useState(false)
  const [pointToDelete, setPointToDelete] = useState<TrashPoint | null>(null)
  
  // Estado para gestión de polígonos/áreas
  const [selectedPolygon, setSelectedPolygon] = useState<PolygonArea | null>(null)
  const [polygonModalOpen, setPolygonModalOpen] = useState(false)
  const [selectedPolygonForModal, setSelectedPolygonForModal] = useState<PolygonArea | undefined>()
   const [deletePolygonConfirmOpen, setDeletePolygonConfirmOpen] = useState(false)
   const [polygonToDelete, setPolygonToDelete] = useState<PolygonArea | null>(null)
   const [showPolygonNameDialog, setShowPolygonNameDialog] = useState(false)
   const [polygonNameInput, setPolygonNameInput] = useState("")
   const [polygonDescInput, setPolygonDescInput] = useState("")
   
   // Estado para editar forma del polígono (MOD 3B)
   const [polygonBeingEdited, setPolygonBeingEdited] = useState<PolygonArea | null>(null)
   const [polygonOriginalCoordinates, setPolygonOriginalCoordinates] = useState<[number, number][] | null>(null)

  // Load additional student data when session is available
  // NOTE: This only runs if session exists (logged in)
  // Public visitors won't trigger the /api/students/me fetch
  useEffect(() => {
    if (!loading && session) {
      console.log("[EcoReciclaBUAP] User logged in, fetching student data")
      // Use session data directly
      setStudentData_local({
        name: session.user.name || "Usuario",
        email: session.user.email || "",
        image: session.user.image || null,
      })

      // Fetch student profile for ecoPoints and other stats
      // Only runs when user is authenticated
      const fetchStudentData = async () => {
        try {
          const response = await fetch("/api/students/me")
          if (response.ok) {
            const data = await response.json()
            console.log("[EcoReciclaBUAP] Student data loaded successfully")
            // Update student data with fetched values
            setStudent((prev) => ({
              ...prev,
              ...data.student,
            }))
          } else if (response.status === 401) {
            console.log("[EcoReciclaBUAP] Session invalid, clearing user data")
            // Session is invalid, clear it
            setStudentData_local(null)
            setStudent({
              boleta: "",
              name: "",
              ecoPoints: 0,
              classifications: 0,
              level: "Principiante",
            })
          }
        } catch (error) {
          console.error("[EcoReciclaBUAP] Error fetching student data:", error)
        }
      }

      fetchStudentData()
    } else if (!loading && !session) {
      console.log("[EcoReciclaBUAP] Public visitor - no session")
      // No session, show public map without fetching user data
      setStudentData_local(null)
      setStudent({
        boleta: "",
        name: "",
        ecoPoints: 0,
        classifications: 0,
        level: "Principiante",
      })
    }
  }, [session, loading])

  // Fetch trash points from database
  useEffect(() => {
    if (loading) return

    console.log("[EcoReciclaBUAP] Fetching trash points from database...")
    const fetchTrashPoints = async () => {
      try {
        const response = await fetch("/api/trash-points?limit=100")
        console.log("[EcoReciclaBUAP] API Response status:", response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log(`[EcoReciclaBUAP] API returned ${data.data.length} trash points`)
          console.log("[EcoReciclaBUAP] First point:", data.data[0])
          
           // Map BD response to TrashPoint format with coordinate validation
           const mappedPoints = data.data.map((point: any) => {
             // Validate and provide defaults for coordinates
             const lat = typeof point.lat === 'number' && !isNaN(point.lat) ? point.lat : BUAP_CENTER[0]
             const lng = typeof point.lng === 'number' && !isNaN(point.lng) ? point.lng : BUAP_CENTER[1]
             
             // Log warning if coordinates were invalid
             if (typeof point.lat !== 'number' || isNaN(point.lat) || typeof point.lng !== 'number' || isNaN(point.lng)) {
               console.warn(
                 `[MOD4] Punto "${point.name}" tiene coordenadas inválidas (lat: ${point.lat}, lng: ${point.lng}). Usando centro de BUAP como default.`
               )
             }
             
             return {
               id: point.id,
               name: point.name,
               lat: lat,
               lng: lng,
               detectedObject: point.detectedObject,
               detectedImage: point.detectedImage,
               category: point.category || null,
               fillLevel: point.fillLevel || 0,
               lastCollected: point.lastCollected,
               alert: point.alert || null,
               todayStats: point.todayStats || { plastico: 0, papel: 0, organico: 0, general: 0 },
             }
           })
           
           console.log("[EcoReciclaBUAP] Mapped points:", mappedPoints)
           console.log(`[MOD4] Total valid coordinates: ${mappedPoints.length}`)
           setTrashPoints(mappedPoints)
        } else {
          console.error("[EcoReciclaBUAP] Failed to fetch trash points:", response.status)
          const errorData = await response.json().catch(() => ({}))
          console.error("[EcoReciclaBUAP] Error data:", errorData)
        }
      } catch (error) {
        console.error("[EcoReciclaBUAP] Error fetching trash points:", error)
      }
    }

    fetchTrashPoints()
  }, [loading])

  // Fetch polygon areas from database
  useEffect(() => {
    if (loading) return

    console.log("[EcoReciclaBUAP] Fetching polygon areas from database...")
    const fetchPolygonAreas = async () => {
      try {
        const response = await fetch("/api/polygon-areas?limit=100")
        if (response.ok) {
          const data = await response.json()
          console.log(`[EcoReciclaBUAP] Loaded ${data.data.length} polygon areas`)
          // Transform API response to component format
          const transformedAreas = data.data.map((area: any) => ({
            id: area.id,
            name: area.name,
            description: area.description || "",
            color: area.color,
            points: area.points.map((p: any) => [p.lat, p.lng] as [number, number]),
          }))
          setPolygonAreas(transformedAreas)
        } else {
          console.error("[EcoReciclaBUAP] Failed to fetch polygon areas:", response.status)
          // Keep empty array as fallback
        }
      } catch (error) {
        console.error("[EcoReciclaBUAP] Error fetching polygon areas:", error)
        // Keep empty array as fallback
      }
    }

    fetchPolygonAreas()
  }, [loading])

  const handlePointClick = useCallback((point: TrashPoint) => {
    setSelectedPoint(point)
    setSidebarOpen(true)
  }, [])

  const handleClosePanel = useCallback(() => {
    setSelectedPoint(null)
  }, [])

  const handleClassify = useCallback(
    (pointId: string, category: string) => {
      setTrashPoints((prev) =>
        prev.map((p) =>
          p.id === pointId
            ? {
                ...p,
                category: category as TrashPoint["category"],
                todayStats: {
                  ...p.todayStats,
                  [category]:
                    p.todayStats[category as keyof typeof p.todayStats] + 1,
                },
              }
            : p
        )
      )
      setStudent((prev) => ({
        ...prev,
        ecoPoints: prev.ecoPoints + 10,
        classifications: prev.classifications + 1,
      }))
    },
    []
  )

  const handleEditPoint = useCallback((point: TrashPoint) => {
    setSelectedPointForModal(point)
    setModalMode("edit")
    setModalOpen(true)
  }, [])

  const handleDeletePointClick = useCallback((point: TrashPoint) => {
    setPointToDelete(point)
    setDeletePointConfirmOpen(true)
  }, [])

  const confirmDeletePoint = useCallback(() => {
    if (!pointToDelete) return
    // Make DELETE request to API
    const deleteTrashPoint = async () => {
      try {
        const response = await fetch(`/api/trash-points/${pointToDelete.id}`, {
          method: "DELETE",
        })
        if (response.ok) {
          setTrashPoints(prev => prev.filter(p => p.id !== pointToDelete.id))
          setSelectedPoint(null)
          toast.success("Contenedor eliminado correctamente")
        } else {
          toast.error("Error al eliminar el contenedor")
        }
      } catch (error) {
        console.error("[EcoReciclaBUAP] Error deleting trash point:", error)
        toast.error("Error al eliminar el contenedor")
      }
    }
    deleteTrashPoint()
    setDeletePointConfirmOpen(false)
    setPointToDelete(null)
  }, [pointToDelete])

  const handleDeletePoint = useCallback((point: TrashPoint) => {
    // The delete dialog will be opened from TrashPointPanel
    // We just need to handle the refetch after deletion
  }, [])

   const handlePointsUpdate = useCallback(() => {
     // Refetch trash points after create/edit
     const refetchTrashPoints = async () => {
       try {
         const response = await fetch("/api/trash-points?limit=100")
         if (response.ok) {
           const data = await response.json()
           // Map BD response to TrashPoint format with coordinate validation (MOD4)
           const mappedPoints = data.data.map((point: any) => {
             // Validate and provide defaults for coordinates
             const lat = typeof point.lat === 'number' && !isNaN(point.lat) ? point.lat : BUAP_CENTER[0]
             const lng = typeof point.lng === 'number' && !isNaN(point.lng) ? point.lng : BUAP_CENTER[1]
             
             // Log warning if coordinates were invalid
             if (typeof point.lat !== 'number' || isNaN(point.lat) || typeof point.lng !== 'number' || isNaN(point.lng)) {
               console.warn(
                 `[MOD4] Punto "${point.name}" tiene coordenadas inválidas (lat: ${point.lat}, lng: ${point.lng}). Usando centro de BUAP como default.`
               )
             }
             
             return {
               id: point.id,
               name: point.name,
               lat: lat,
               lng: lng,
               detectedObject: point.detectedObject,
               detectedImage: point.detectedImage,
               category: point.category || null,
               fillLevel: point.fillLevel || 0,
               lastCollected: point.lastCollected,
               alert: point.alert || null,
               todayStats: point.todayStats || { plastico: 0, papel: 0, organico: 0, general: 0 },
             }
           })
           setTrashPoints(mappedPoints)
           
           // Update selectedPoint if it was being edited
           if (selectedPoint) {
             const updatedPoint = mappedPoints.find((p: TrashPoint) => p.id === selectedPoint.id)
             if (updatedPoint) {
               setSelectedPoint(updatedPoint)
             }
           }
           
           console.log("[EcoReciclaBUAP] Trash points refetched after edit/create")
         }
       } catch (error) {
         console.error("[EcoReciclaBUAP] Error refetching trash points:", error)
       }
     }
     refetchTrashPoints()
     setModalOpen(false)
   }, [selectedPoint])

  const handleAddPoint = useCallback(() => {
    setIsAddingPoint((prev) => !prev)
    setIsDrawingPolygon(false)
    setDrawingPoints([])
  }, [])

   const handleDrawPolygon = useCallback(() => {
     if (isDrawingPolygon && drawingPoints.length >= 3) {
       handleCompletePolygonDrawing()
     } else if (isDrawingPolygon) {
       // Si estamos editando y cancelas, restaurar forma anterior
       if (polygonBeingEdited && polygonOriginalCoordinates) {
         setDrawingPoints(polygonOriginalCoordinates)
         setPolygonBeingEdited(null)
         setPolygonOriginalCoordinates(null)
         toast.info("Edición cancelada. Se restauró la forma anterior del polígono.")
       } else {
         setDrawingPoints([])
       }
       setIsDrawingPolygon(false)
     } else {
       setIsDrawingPolygon(true)
       setIsAddingPoint(false)
       setDrawingPoints([])
     }
   }, [isDrawingPolygon, drawingPoints, polygonAreas.length, polygonBeingEdited, polygonOriginalCoordinates])

   const handleCompletePolygonDrawing = () => {
     if (drawingPoints.length >= 3) {
       // Si estamos editando un polígono, guardar la nueva forma directamente
       if (polygonBeingEdited) {
         updatePolygonShape()
       } else {
         // Si estamos creando uno nuevo, mostrar diálogo de nombre
         setShowPolygonNameDialog(true)
         setPolygonNameInput(`Área de Optimización ${polygonAreas.length + 1}`)
         setPolygonDescInput("")
       }
     }
   }

   // Helper para guardar cambios de forma del polígono (MOD 3B)
   const updatePolygonShape = async () => {
     if (!polygonBeingEdited || drawingPoints.length < 3) return

     try {
       const response = await fetch(`/api/polygon-areas/${polygonBeingEdited.id}`, {
         method: "PATCH",
         headers: {
           "Content-Type": "application/json",
         },
         body: JSON.stringify({
           name: polygonBeingEdited.name,
           description: polygonBeingEdited.description,
           color: polygonBeingEdited.color,
           points: drawingPoints.map(([lat, lng]) => ({ lat, lng })),
         }),
       })

       if (response.ok) {
         // Actualizar el polígono en el estado
         const updatedPolygon: PolygonArea = {
           ...polygonBeingEdited,
           points: drawingPoints,
         }
         setPolygonAreas(prev =>
           prev.map(p => p.id === polygonBeingEdited.id ? updatedPolygon : p)
         )
         setSelectedPolygon(updatedPolygon)
         
         // Limpiar estado de edición
         setPolygonBeingEdited(null)
         setPolygonOriginalCoordinates(null)
         setIsDrawingPolygon(false)
         setDrawingPoints([])

         toast.success("Forma del polígono actualizada correctamente")
       } else {
         throw new Error("Error updating polygon shape")
       }
     } catch (error) {
       console.error("[MOD3B] Error updating polygon shape:", error)
       toast.error("Error al actualizar la forma del polígono")
       
       // Restaurar forma anterior si hay error
       if (polygonOriginalCoordinates) {
         setDrawingPoints(polygonOriginalCoordinates)
         toast.info("Cambios descartados. Se restauró la forma anterior.")
       }
     }
   }

  const handlePolygonClick = (polygon: PolygonArea) => {
    setSelectedPolygon(polygon)
    setSidebarOpen(true)
  }

  const handleEditPolygon = (polygon: PolygonArea) => {
    setSelectedPolygonForModal(polygon)
    setPolygonModalOpen(true)
  }

  const handleDeletePolygonClick = (polygon: PolygonArea) => {
    setPolygonToDelete(polygon)
    setDeletePolygonConfirmOpen(true)
  }

  const confirmDeletePolygon = useCallback(() => {
    if (!polygonToDelete) return
    // Make DELETE request to API
    const deletePolygon = async () => {
      try {
        const response = await fetch(`/api/polygon-areas/${polygonToDelete.id}`, {
          method: "DELETE",
        })
        if (response.ok) {
          setPolygonAreas(prev => prev.filter(p => p.id !== polygonToDelete.id))
          setSelectedPolygon(null)
          toast.success("Área eliminada correctamente")
        } else {
          toast.error("Error al eliminar el área")
        }
      } catch (error) {
        console.error("[EcoReciclaBUAP] Error deleting polygon:", error)
        toast.error("Error al eliminar el área")
      }
    }
    deletePolygon()
    setDeletePolygonConfirmOpen(false)
    setPolygonToDelete(null)
  }, [polygonToDelete])

  const handleUpdatePolygon = (updatedPolygon: PolygonArea) => {
    // Make PATCH request to API
    const updatePolygonAPI = async () => {
      try {
        const response = await fetch(`/api/polygon-areas/${updatedPolygon.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: updatedPolygon.name,
            description: updatedPolygon.description,
            color: updatedPolygon.color,
          }),
        })
        if (response.ok) {
          setPolygonAreas(prev =>
            prev.map(p => p.id === updatedPolygon.id ? updatedPolygon : p)
          )
          setPolygonModalOpen(false)
          setSelectedPolygon(null)
          toast.success("Área actualizada correctamente")
        } else {
          toast.error("Error al actualizar el área")
        }
      } catch (error) {
        console.error("[EcoReciclaBUAP] Error updating polygon:", error)
        toast.error("Error al actualizar el área")
      }
    }
     updatePolygonAPI()
   }

   // Handler para editar forma del polígono (MOD 3B)
   const handleEditPolygonShape = (polygon: PolygonArea) => {
     // Guardar coordenadas originales en caso de cancelación
     setPolygonOriginalCoordinates(polygon.points)
     setPolygonBeingEdited(polygon)
     
     // Entrar en modo dibujo
     setIsDrawingPolygon(true)
     setDrawingPoints(polygon.points)
     setIsAddingPoint(false)
     
     // Cerrar modal de edición
     setPolygonModalOpen(false)
     
     toast.info("Modo de edición de polígono: dibuja la nueva forma. Usa el botón 'Completar' para guardar o 'Cancelar' para deshacer cambios.")
   }

   const confirmCreatePolygon = () => {
    // Make POST request to API
    const createPolygonAPI = async () => {
      try {
        const response = await fetch("/api/polygon-areas", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: polygonNameInput || `Área ${polygonAreas.length + 1}`,
            description: polygonDescInput,
            color: "#8b5cf6",
            points: drawingPoints.map(([lat, lng]) => ({ lat, lng })),
          }),
        })
        if (response.ok) {
          const data = await response.json()
          // Transform response to component format
          const newPolygon: PolygonArea = {
            id: data.polygonArea.id,
            name: data.polygonArea.name,
            description: data.polygonArea.description || "",
            color: data.polygonArea.color,
            points: data.polygonArea.points.map((p: any) => [p.lat, p.lng] as [number, number]),
          }
          setPolygonAreas(prev => [...prev, newPolygon])
          setDrawingPoints([])
          setIsDrawingPolygon(false)
          setShowPolygonNameDialog(false)
          setPolygonNameInput("")
          setPolygonDescInput("")
          toast.success("Área creada correctamente")
        } else {
          const error = await response.json()
          toast.error(error.error || "Error al crear el área")
        }
      } catch (error) {
        console.error("[EcoReciclaBUAP] Error creating polygon:", error)
        toast.error("Error al crear el área")
      }
    }
    createPolygonAPI()
  }

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (isAddingPoint) {
        // Create trash point via API
        const createTrashPoint = async () => {
          try {
            const response = await fetch("/api/trash-points", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name: `Contenedor Nuevo ${trashPoints.length + 1}`,
                lat,
                lng,
                detectedObject: "Sin deteccion",
                detectedImage: "/images/trash-default.jpg",
                fillLevel: 0,
                lastCollected: new Date().toISOString(),
              }),
            })
            if (response.ok) {
              const data = await response.json()
              setTrashPoints((prev) => [...prev, data.trashPoint])
              setIsAddingPoint(false)
              toast.success("Contenedor creado correctamente")
            } else {
              const error = await response.json()
              console.error("[EcoReciclaBUAP] Error response:", error)
              toast.error(error.error || "Error al crear el contenedor")
            }
          } catch (error) {
            console.error("[EcoReciclaBUAP] Error creating trash point:", error)
            toast.error("Error al crear el contenedor")
          }
        }
        createTrashPoint()
      } else if (isDrawingPolygon) {
         setDrawingPoints((prev) => [...prev, [lat, lng]])
       }
     },
     [isAddingPoint, isDrawingPolygon, trashPoints.length]
   )

  // Show loading while verifying session
  if (loading) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Verificando sesión...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-dvh w-full overflow-visible">
      {/* Mobile header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b bg-card px-4 md:hidden">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
          <Leaf className="h-5 w-5 text-primary" />
          <span className="text-sm font-bold text-foreground">
            Eco-Recicla
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!isAdmin && (
            <Badge className="bg-primary/10 text-primary border-primary/30 hover:bg-primary/20">
              <Star className="mr-1 h-3 w-3" />
              {student.ecoPoints}
            </Badge>
          )}
        </div>
      </header>

      {/* Sidebar panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-card shadow-xl transition-all duration-300 ease-in-out md:relative ${
          sidebarOpen ? "w-[380px]" : "w-0 overflow-hidden"
        } ${
          mobileMenuOpen
            ? "translate-x-0 pt-14"
            : "-translate-x-full pt-14 md:translate-x-0 md:pt-0"
        }`}
      >
        <div className="flex min-w-[380px] h-full flex-col overflow-y-auto overflow-x-hidden">
          {/* Hero reference image */}
          <div className="relative h-52 w-full shrink-0 overflow-hidden">
            <Image
              src="/images/campus-buap.jpg"
              alt="Campus Universitario BUAP - Facultad de Computacion"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4">
              <h1 className="text-xl font-bold text-foreground leading-tight text-balance">
                Eco-Recicla BUAP
              </h1>
              <p className="text-sm text-muted-foreground">
                Facultad de Computacion
              </p>
            </div>
          </div>

          {/* Session status bar */}
          <div className="border-b px-4 py-3 space-y-3">
            {/* User profile section */}
            {studentData_local ? (
              <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
                  {studentData_local.image ? (
                    <img
                      src={studentData_local.image}
                      alt={studentData_local.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {studentData_local.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant="secondary" 
                      className="text-xs"
                    >
                      {isAdmin ? "🔐 Administrador" : "👤 Estudiante"}
                    </Badge>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground shrink-0">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    Sin sesión
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Inicia sesión para continuar
                   </p>
                 </div>
               </div>
             )}
           </div>

           {/* Action buttons - Navigation */}
          <div className="flex items-center justify-center border-b px-4 py-3">
            {studentData_local ? (
              <Link
                href="/dashboard"
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-105">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-primary">
                  Panel
                </span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-105">
                  <User className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-primary">
                  Iniciar sesión
                </span>
              </Link>
            )}
          </div>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto">
            {selectedPoint ? (
              <TrashPointPanel
                point={selectedPoint}
                onClose={handleClosePanel}
                onClassify={handleClassify}
                isAdmin={isAdmin}
                onEdit={handleEditPoint}
                onDelete={handleDeletePointClick}
              />
            ) : selectedPolygon && isAdmin ? (
              <PolygonPanel
                polygon={selectedPolygon}
                onClose={() => setSelectedPolygon(null)}
                isAdmin={isAdmin}
                onEdit={handleEditPolygon}
                onDelete={handleDeletePolygonClick}
              />
            ) : (
              <div className="flex flex-col">
                {/* Second reference image */}
                <div className="relative h-40 w-full overflow-hidden border-b">
                  <Image
                    src="/images/contenedor-reciclaje.jpg"
                    alt="Contenedores de reciclaje en el campus"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card/60 to-transparent" />
                  <div className="absolute bottom-2 left-3">
                    <span className="text-xs font-medium text-foreground bg-card/80 rounded px-2 py-0.5">
                      Puntos de reciclaje del campus
                    </span>
                  </div>
                </div>

                {/* Location info */}
                <div className="flex items-start gap-4 px-4 py-3 border-b">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground leading-relaxed">
                    {/* TODO: Obtener ubicación desde configuración */}
                    Benemérita Universidad Autónoma de Puebla
                  </p>
                </div>
                <div className="flex items-center gap-4 px-4 py-3 border-b">
                  <Globe className="h-5 w-5 text-muted-foreground shrink-0" />
                  <p className="text-sm text-primary">
                    {/* TODO: Obtener website desde configuración */}
                    https://www.cs.buap.mx/
                  </p>
                </div>
                <div className="flex items-center gap-4 px-4 py-3 border-b">
                  <Phone className="h-5 w-5 text-muted-foreground shrink-0" />
                  <p className="text-sm text-foreground">
                    {/* TODO: Obtener teléfono desde configuración */}
                    +52 (222) 2295500
                  </p>
                </div>

                {/* Container list */}
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-foreground">
                      Contenedores ({trashPoints.length})
                    </h3>
                    {isAdmin && (
                      <Link
                        href="/dashboard"
                        className="text-xs text-primary hover:underline"
                      >
                        Ver estadisticas
                      </Link>
                    )}
                  </div>

                  {/* Admin actions */}
                  {isAdmin && (
                    <div className="flex flex-col gap-2 mb-4 pb-3 border-b">
                      <Button
                        onClick={handleAddPoint}
                        variant={isAddingPoint ? "default" : "outline"}
                        className="w-full gap-2"
                        size="sm"
                      >
                        {isAddingPoint ? (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Click en el mapa
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            Agregar Contenedor
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleDrawPolygon}
                        variant={isDrawingPolygon ? "default" : "outline"}
                        className="w-full gap-2"
                        size="sm"
                      >
                        {isDrawingPolygon ? (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Dibujando...
                          </>
                        ) : (
                          <>
                            <Pentagon className="h-4 w-4" />
                            Definir Área
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                   <div className="flex flex-col gap-2">
                     {trashPoints.map((point) => (
                       <button
                         key={point.id}
                         onClick={() => handlePointClick(point)}
                         className="flex items-center justify-between rounded-lg bg-muted/50 p-3 text-left transition-colors hover:bg-muted"
                       >
                         <div className="flex items-center gap-2.5">
                           <div
                             className="h-3 w-3 rounded-full shrink-0"
                             style={{
                               backgroundColor:
                                 point.fillLevel > 80
                                   ? "#ef4444"
                                   : point.fillLevel > 50
                                     ? "#eab308"
                                     : "#10b981",
                             }}
                           />
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
                         </div>
                         <span className="text-sm font-semibold text-muted-foreground shrink-0 ml-2">
                           {point.fillLevel}%
                         </span>
                       </button>
                     ))}
                   </div>
                 </div>

                 {/* Áreas de Optimización */}
                 {isAdmin && polygonAreas.length > 0 && (
                   <div className="px-4 py-3 border-t">
                     <h3 className="text-sm font-semibold text-foreground mb-3">
                       Áreas de Optimización ({polygonAreas.length})
                     </h3>
                     <div className="flex flex-col gap-2">
                       {polygonAreas.map((area) => (
                         <button
                           key={area.id}
                           onClick={() => handlePolygonClick(area)}
                           className="flex items-center justify-between rounded-lg bg-muted/50 p-3 text-left transition-colors hover:bg-muted"
                         >
                           <div className="flex items-center gap-2.5">
                             <div
                               className="h-3 w-3 rounded-full shrink-0"
                               style={{ backgroundColor: area.color }}
                             />
                             <div>
                               <p className="text-sm font-medium text-foreground">
                                 {area.name}
                               </p>
                               {area.description && (
                                 <p className="text-xs text-muted-foreground truncate">
                                   {area.description}
                                 </p>
                               )}
                             </div>
                           </div>
                           <span className="text-xs text-muted-foreground shrink-0 ml-2">
                             {area.points.length}p
                           </span>
                         </button>
                       ))}
                     </div>
                   </div>
                 )}
               </div>
            )}
          </div>
        </div>
      </aside>

      {/* Desktop sidebar toggle button - hamburger menu */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`fixed z-[999] top-4 left-4 items-center justify-center h-10 w-10 bg-card border border-border rounded-lg shadow-md transition-all duration-300 ease-in-out hover:bg-muted cursor-pointer ${
          sidebarOpen ? "hidden md:flex" : "md:flex flex"
        }`}
        aria-label={
          sidebarOpen ? "Colapsar panel lateral" : "Expandir panel lateral"
        }
      >
        {sidebarOpen ? (
          <X className="h-5 w-5 text-foreground" />
        ) : (
          <Menu className="h-5 w-5 text-foreground" />
        )}
      </button>

      {/* Map area */}
      <main className="relative flex-1 pt-14 md:pt-0">
        {/* Floating Eco-Points badge on map - student desktop */}
        {!isAdmin && (
          <div className="absolute top-4 left-4 z-30 hidden md:flex">
            <div className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 shadow-lg">
              <Star className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-primary">
                {student.ecoPoints.toLocaleString()} pts
              </span>
              <span className="text-xs text-muted-foreground">
                | {student.boleta}
              </span>
            </div>
          </div>
        )}

        {/* Admin mode indicator on map */}
        {isAdmin && (isAddingPoint || isDrawingPolygon) && (
          <div className="absolute top-4 left-4 z-30">
            <div className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 shadow-lg">
              <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              <span className="text-sm font-medium text-foreground">
                {isAddingPoint
                  ? "Click para colocar contenedor"
                  : `Dibujando area (${drawingPoints.length} puntos)`}
              </span>
              {isDrawingPolygon && drawingPoints.length >= 3 && (
                <Button
                  size="sm"
                  className="ml-2 h-7 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handleDrawPolygon}
                >
                  Finalizar
                </Button>
              )}
            </div>
          </div>
        )}

        <MapView
          trashPoints={trashPoints}
          polygonAreas={polygonAreas}
          selectedPointId={selectedPoint?.id || null}
          onPointClick={handlePointClick}
          onPolygonClick={handlePolygonClick}
          isAdmin={isAdmin}
          isAddingPoint={isAddingPoint}
          isDrawingPolygon={isDrawingPolygon}
          drawingPoints={drawingPoints}
          onMapClick={handleMapClick}
        />
      </main>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/20 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

       {/* Modals for admin */}
       {isAdmin && (
         <>
           <TrashPointModal
              isOpen={modalOpen}
              mode={modalMode}
              point={selectedPointForModal}
              trashPoints={trashPoints}
              onClose={() => {
                setModalOpen(false)
                setSelectedPointForModal(undefined)
              }}
              onSuccess={handlePointsUpdate}
            />
           
           {/* Delete Confirm Dialog for Trash Points */}
           <DeleteConfirmDialog
             isOpen={deletePointConfirmOpen}
             pointName={pointToDelete?.name || ""}
             onConfirm={confirmDeletePoint}
             onCancel={() => {
               setDeletePointConfirmOpen(false)
               setPointToDelete(null)
             }}
              isLoading={false}
            />

            {/* Dialog para crear nueva área con nombre */}
            <Dialog open={showPolygonNameDialog} onOpenChange={setShowPolygonNameDialog}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Crear Nueva Área</DialogTitle>
                  <DialogDescription>
                    Proporciona un nombre y descripción para el área de optimización
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="polygon-name">Nombre del Área *</Label>
                    <Input
                      id="polygon-name"
                      value={polygonNameInput}
                      onChange={(e) => setPolygonNameInput(e.target.value)}
                      placeholder="Ej: Sector de Cafetería"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="polygon-desc">Descripción</Label>
                    <Input
                      id="polygon-desc"
                      value={polygonDescInput}
                      onChange={(e) => setPolygonDescInput(e.target.value)}
                      placeholder="Ej: Zona con mayor concentración de residuos"
                      className="mt-1"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPolygonNameDialog(false)
                      setDrawingPoints([])
                      setIsDrawingPolygon(false)
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={confirmCreatePolygon}
                    disabled={!polygonNameInput.trim()}
                  >
                    Crear Área
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Delete confirmation dialog para áreas */}
            <DeleteConfirmDialog
              isOpen={deletePolygonConfirmOpen}
              pointName={polygonToDelete?.name || ""}
              onConfirm={confirmDeletePolygon}
              onCancel={() => {
                setDeletePolygonConfirmOpen(false)
                setPolygonToDelete(null)
              }}
              isLoading={false}
            />

             {/* Modal para editar área */}
             <PolygonModal
               isOpen={polygonModalOpen}
               polygon={selectedPolygonForModal}
               onClose={() => setPolygonModalOpen(false)}
               onSave={handleUpdatePolygon}
               onEditShape={handleEditPolygonShape}
             />
          </>
        )}
    </div>
  )
}
