export interface TrashPoint {
  id: string
  name: string
  lat: number
  lng: number
  detectedObject: string
  detectedImage: string
  category: "plastico" | "papel" | "organico" | "general" | null
  fillLevel: number
  lastCollected: string
  alert: string | null
  todayStats: {
    plastico: number
    papel: number
    organico: number
    general: number
  }
}

export interface Student {
  boleta: string
  name: string
  ecoPoints: number
  classifications: number
  level: string
}

export interface PolygonArea {
  id: string
  name: string
  description?: string
  points: [number, number][]
  color: string
}

// Facultad de Computacion BUAP, Puebla coordinates
export const BUAP_CENTER: [number, number] = [19.0048, -98.2046]
export const BUAP_ZOOM = 17

export const CATEGORY_COLORS: Record<string, string> = {
  plastico: "#eab308",
  papel: "#3b82f6",
  organico: "#10b981",
  general: "#6b7280",
}

export const CATEGORY_LABELS: Record<string, string> = {
  plastico: "Plastico",
  papel: "Papel",
  organico: "Organico",
  general: "General",
}
