"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import {
  type TrashPoint,
  type PolygonArea,
  BUAP_CENTER,
  BUAP_ZOOM,
} from "@/lib/data"

// Corregido: Ahora acepta el estado 'isSelected' para el feedback visual
function createTrashIcon(fillLevel: number, alert: string | null, isSelected: boolean) {
  const color =
    alert || fillLevel > 80
      ? "#ef4444"
      : fillLevel > 50
        ? "#eab308"
        : "#10b981"

  // Estilos de feedback visual: Glow azul y escala
  const shadow = isSelected 
    ? "box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 4px 15px rgba(0,0,0,0.5);" 
    : "box-shadow: 0 2px 8px rgba(0,0,0,0.3);"

  return L.divIcon({
    className: "custom-trash-marker",
    html: `
      <div style="
        width: 36px; height: 36px; border-radius: 50%;
        background: ${color}; border: 3px solid white;
        ${shadow}
        display: flex; align-items: center; justify-content: center;
        color: white; font-weight: bold; font-size: 11px;
        cursor: pointer; 
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        transform: ${isSelected ? 'scale(1.3)' : 'scale(1)'};
      ">
        ${fillLevel}%
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  })
}

function createNewPointIcon() {
  return L.divIcon({
    className: "custom-new-marker",
    html: `
      <div style="
        width: 32px; height: 32px; border-radius: 50%;
        background: #8b5cf6; border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
        color: white; font-size: 16px; cursor: pointer;
      ">
        +
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

interface MapViewProps {
  trashPoints: TrashPoint[]
  polygonAreas: PolygonArea[]
  selectedPointId: string | null
  onPointClick: (point: TrashPoint) => void
  onPolygonClick?: (polygon: PolygonArea) => void
  isAdmin: boolean
  isAddingPoint: boolean
  isDrawingPolygon: boolean
  drawingPoints: [number, number][]
  onMapClick?: (lat: number, lng: number) => void
}

export default function MapView({
  trashPoints,
  polygonAreas,
  selectedPointId,
  onPointClick,
  onPolygonClick,
  isAdmin,
  isAddingPoint,
  isDrawingPolygon,
  drawingPoints,
  onMapClick,
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  
  // Usando array en lugar de Record para evitar problemas de sincronización
  // Los marcadores se recrean completamente cada vez, evitando el bug de desaparición
  const markersRef = useRef<Array<{ id: string; marker: L.Marker }>>([])
  const polygonsRef = useRef<L.Polygon[]>([])
  const drawingPolylineRef = useRef<L.Polyline | null>(null)
  const drawingMarkersRef = useRef<L.CircleMarker[]>([])

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: BUAP_CENTER,
      zoom: BUAP_ZOOM,
      zoomControl: false,
    })

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 20,
    }).addTo(map)

    L.control.zoom({ position: "bottomright" }).addTo(map)
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Handle map clicks (Mantenido igual)
  const handleMapClickRef = useRef(onMapClick)
  handleMapClickRef.current = onMapClick
  const isAddingPointRef = useRef(isAddingPoint)
  isAddingPointRef.current = isAddingPoint
  const isDrawingPolygonRef = useRef(isDrawingPolygon)
  isDrawingPolygonRef.current = isDrawingPolygon

  useEffect(() => {
    if (!mapRef.current) return
    const handler = (e: L.LeafletMouseEvent) => {
      if ((isAddingPointRef.current || isDrawingPolygonRef.current) && handleMapClickRef.current) {
        handleMapClickRef.current(e.latlng.lat, e.latlng.lng)
      }
    }
    mapRef.current.on("click", handler)
    return () => { mapRef.current?.off("click", handler) }
  }, [])

   // Update markers - Estrategia de reemplazo total (igual que polygonAreas)
   // Esto evita el bug donde desaparecen los contenedores en la primera carga
   useEffect(() => {
     if (!mapRef.current) return

     console.log("🗺️ MapView - Actualizando marcadores. Puntos recibidos:", trashPoints.length)
     if (trashPoints.length > 0) {
       console.log("📍 Primer punto:", trashPoints[0]?.name, "Coords:", trashPoints[0]?.lat, trashPoints[0]?.lng)
     }

     // 1. Remover todos los marcadores previos
     markersRef.current.forEach(({ marker }) => marker.remove())
     markersRef.current = []

     // 2. Crear nuevos marcadores
     trashPoints.forEach((point) => {
       const isSelected = selectedPointId === point.id
       const icon = createTrashIcon(point.fillLevel, point.alert, isSelected)

       const marker = L.marker([point.lat, point.lng], { icon })
         .addTo(mapRef.current!)
         .bindTooltip(point.name, {
           direction: "top",
           offset: [0, -20],
           className: "custom-tooltip",
         })

       marker.on("click", (e) => {
         L.DomEvent.stopPropagation(e)
         onPointClick(point)
       })

       marker.setZIndexOffset(isSelected ? 1000 : 0)
       markersRef.current.push({ id: point.id, marker })
       console.log("✅ Marcador creado:", point.name)
     })
     
     console.log("📊 Total de marcadores en mapa:", markersRef.current.length)
   }, [trashPoints, selectedPointId, onPointClick])

  // Update polygons & drawing preview (Mantenido igual)
  useEffect(() => {
    if (!mapRef.current) return
    polygonsRef.current.forEach((p) => p.remove())
    polygonsRef.current = []
    polygonAreas.forEach((area) => {
      const polygon = L.polygon(area.points, {
        color: area.color,
        fillColor: area.color,
        fillOpacity: 0.15,
        weight: 2,
        dashArray: "6 4",
        interactive: true,
      }).addTo(mapRef.current!)
        .bindTooltip(area.name, { 
          direction: "center", 
          className: "custom-tooltip" 
        })

      // Agregar click handler para polígonos
      polygon.on("click", (e) => {
        L.DomEvent.stopPropagation(e)
        onPolygonClick?.(area)
      })

      polygonsRef.current.push(polygon)
    })
  }, [polygonAreas, onPolygonClick])

  useEffect(() => {
    if (!mapRef.current) return
    drawingPolylineRef.current?.remove()
    drawingMarkersRef.current.forEach((m) => m.remove())
    drawingMarkersRef.current = []
    if (drawingPoints.length > 0) {
      drawingPolylineRef.current = L.polyline(drawingPoints, { color: "#8b5cf6", weight: 2, dashArray: "4 4" }).addTo(mapRef.current)
      drawingPoints.forEach((point) => {
        const marker = L.circleMarker(point, { radius: 5, color: "#8b5cf6", fillColor: "#8b5cf6", fillOpacity: 1 }).addTo(mapRef.current!)
        drawingMarkersRef.current.push(marker)
      })
    }
  }, [drawingPoints])

  return (
    <div ref={mapContainerRef} className="h-full w-full" style={{ minHeight: "100%" }} />
  )
}