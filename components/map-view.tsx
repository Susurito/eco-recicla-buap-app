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
  isAdmin,
  isAddingPoint,
  isDrawingPolygon,
  drawingPoints,
  onMapClick,
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  
  // Corregido: Usamos Record para persistencia por ID y que no desaparezcan
  const markersRef = useRef<Record<string, L.Marker>>({})
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

  // Update markers (Función principal corregida)
  useEffect(() => {
    if (!mapRef.current) return

    const currentMarkers = markersRef.current;

    // 1. Eliminar marcadores que ya no existen en los datos
    const currentPointIds = new Set(trashPoints.map(p => p.id));
    Object.keys(currentMarkers).forEach(id => {
      if (!currentPointIds.has(id)) {
        currentMarkers[id].remove();
        delete currentMarkers[id];
      }
    });

    // 2. Crear o Actualizar marcadores
    trashPoints.forEach((point) => {
      const isSelected = selectedPointId === point.id;
      const icon = createTrashIcon(point.fillLevel, point.alert, isSelected);

      if (currentMarkers[point.id]) {
        // Solo actualizamos si ya existe (Evita el parpadeo/desaparición)
        currentMarkers[point.id].setIcon(icon);
        currentMarkers[point.id].setZIndexOffset(isSelected ? 1000 : 0);
      } else {
        // Crear nuevo si no existe
        const marker = L.marker([point.lat, point.lng], { icon })
          .addTo(mapRef.current!)
          .bindTooltip(point.name, {
            direction: "top",
            offset: [0, -20],
            className: "custom-tooltip",
          });

        marker.on("click", (e) => {
          L.DomEvent.stopPropagation(e); // Evita que el clic se propague al mapa
          onPointClick(point);
        });

        currentMarkers[point.id] = marker;
      }
    });
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
      }).addTo(mapRef.current!)
        .bindTooltip(area.name, { direction: "center", className: "custom-tooltip" });
      polygonsRef.current.push(polygon)
    })
  }, [polygonAreas])

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