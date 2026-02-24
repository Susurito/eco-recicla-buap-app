"use client"

import { useEffect, useRef, useCallback } from "react"
import L from "leaflet"
import {
  type TrashPoint,
  type PolygonArea,
  BUAP_CENTER,
  BUAP_ZOOM,
  CATEGORY_COLORS,
} from "@/lib/data"

// Fix for default marker icons in Leaflet with webpack
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function createTrashIcon(fillLevel: number, alert: string | null) {
  const color =
    alert || fillLevel > 80
      ? "#ef4444"
      : fillLevel > 50
        ? "#eab308"
        : "#10b981"

  return L.divIcon({
    className: "custom-trash-marker",
    html: `
      <div style="
        width: 36px; height: 36px; border-radius: 50%;
        background: ${color}; border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
        color: white; font-weight: bold; font-size: 11px;
        cursor: pointer; transition: transform 0.2s;
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
  const markersRef = useRef<L.Marker[]>([])
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
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 20,
    }).addTo(map)

    L.control.zoom({ position: "bottomright" }).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Handle map clicks
  const handleMapClickRef = useRef(onMapClick)
  handleMapClickRef.current = onMapClick

  const isAddingPointRef = useRef(isAddingPoint)
  isAddingPointRef.current = isAddingPoint

  const isDrawingPolygonRef = useRef(isDrawingPolygon)
  isDrawingPolygonRef.current = isDrawingPolygon

  useEffect(() => {
    if (!mapRef.current) return

    const handler = (e: L.LeafletMouseEvent) => {
      if (
        (isAddingPointRef.current || isDrawingPolygonRef.current) &&
        handleMapClickRef.current
      ) {
        handleMapClickRef.current(e.latlng.lat, e.latlng.lng)
      }
    }

    mapRef.current.on("click", handler)
    return () => {
      mapRef.current?.off("click", handler)
    }
  }, [])

  // Update cursor style
  useEffect(() => {
    if (!mapContainerRef.current) return
    if (isAddingPoint || isDrawingPolygon) {
      mapContainerRef.current.style.cursor = "crosshair"
    } else {
      mapContainerRef.current.style.cursor = ""
    }
  }, [isAddingPoint, isDrawingPolygon])

  // Update markers
  useEffect(() => {
    if (!mapRef.current) return

    // Clear old markers
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    trashPoints.forEach((point) => {
      const icon = createTrashIcon(point.fillLevel, point.alert)
      const marker = L.marker([point.lat, point.lng], { icon })
        .addTo(mapRef.current!)
        .bindTooltip(point.name, {
          direction: "top",
          offset: [0, -20],
          className: "custom-tooltip",
        })

      marker.on("click", () => onPointClick(point))

      if (selectedPointId === point.id) {
        marker.getElement()?.style.setProperty("transform", "scale(1.2)")
        marker.getElement()?.style.setProperty("z-index", "1000")
      }

      markersRef.current.push(marker)
    })
  }, [trashPoints, selectedPointId, onPointClick])

  // Update polygons
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
      })
        .addTo(mapRef.current!)
        .bindTooltip(area.name, {
          direction: "center",
          className: "custom-tooltip",
        })

      polygonsRef.current.push(polygon)
    })
  }, [polygonAreas])

  // Update drawing preview
  useEffect(() => {
    if (!mapRef.current) return

    // Clear old drawing elements
    drawingPolylineRef.current?.remove()
    drawingMarkersRef.current.forEach((m) => m.remove())
    drawingMarkersRef.current = []

    if (drawingPoints.length > 0) {
      // Draw the polyline
      drawingPolylineRef.current = L.polyline(drawingPoints, {
        color: "#8b5cf6",
        weight: 2,
        dashArray: "4 4",
      }).addTo(mapRef.current)

      // Draw corner markers
      drawingPoints.forEach((point) => {
        const marker = L.circleMarker(point, {
          radius: 5,
          color: "#8b5cf6",
          fillColor: "#8b5cf6",
          fillOpacity: 1,
        }).addTo(mapRef.current!)
        drawingMarkersRef.current.push(marker)
      })
    }
  }, [drawingPoints])

  return (
    <div
      ref={mapContainerRef}
      className="h-full w-full"
      style={{ minHeight: "100%" }}
    />
  )
}
