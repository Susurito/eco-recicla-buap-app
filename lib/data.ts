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

export interface Prize {
  id: string
  name: string
  description: string
  cost: number
  icon: string
  category: "internet" | "academic" | "cafeteria"
}

export interface PolygonArea {
  id: string
  name: string
  points: [number, number][]
  color: string
}

// Facultad de Computacion BUAP, Puebla coordinates
export const BUAP_CENTER: [number, number] = [19.0048, -98.2046]
export const BUAP_ZOOM = 17

export const initialTrashPoints: TrashPoint[] = [
  {
    id: "tp-1",
    name: "Contenedor Entrada Principal",
    lat: 19.0052,
    lng: -98.2050,
    detectedObject: "Botella de refresco",
    detectedImage: "/images/bottle.jpg",
    category: null,
    fillLevel: 72,
    lastCollected: "Hoy 08:30",
    alert: null,
    todayStats: { plastico: 23, papel: 8, organico: 5, general: 12 },
  },
  {
    id: "tp-2",
    name: "Contenedor Laboratorio A",
    lat: 19.0045,
    lng: -98.2040,
    detectedObject: "Hoja de cuaderno",
    detectedImage: "/images/paper.jpg",
    category: null,
    fillLevel: 45,
    lastCollected: "Hoy 10:15",
    alert: null,
    todayStats: { plastico: 5, papel: 31, organico: 2, general: 7 },
  },
  {
    id: "tp-3",
    name: "Contenedor Cafeteria",
    lat: 19.0050,
    lng: -98.2035,
    detectedObject: "Cascara de platano",
    detectedImage: "/images/organic.jpg",
    category: null,
    fillLevel: 88,
    lastCollected: "Ayer 17:00",
    alert: "Nivel critico de llenado",
    todayStats: { plastico: 10, papel: 3, organico: 42, general: 18 },
  },
  {
    id: "tp-4",
    name: "Contenedor Biblioteca",
    lat: 19.0042,
    lng: -98.2052,
    detectedObject: "Vaso de plastico",
    detectedImage: "/images/cup.jpg",
    category: null,
    fillLevel: 30,
    lastCollected: "Hoy 12:00",
    alert: null,
    todayStats: { plastico: 15, papel: 22, organico: 1, general: 9 },
  },
  {
    id: "tp-5",
    name: "Contenedor Estacionamiento",
    lat: 19.0055,
    lng: -98.2042,
    detectedObject: "Bolsa de papas",
    detectedImage: "/images/bag.jpg",
    category: null,
    fillLevel: 60,
    lastCollected: "Hoy 09:45",
    alert: "Requiere mantenimiento",
    todayStats: { plastico: 18, papel: 6, organico: 8, general: 25 },
  },
]

export const studentData: Student = {
  boleta: "202145678",
  name: "Carlos Mendoza",
  ecoPoints: 1250,
  classifications: 87,
  level: "Eco-Guardian",
}

export const prizes: Prize[] = [
  {
    id: "p-1",
    name: "30 min Internet",
    description: "30 minutos de acceso a internet en laboratorios",
    cost: 100,
    icon: "wifi",
    category: "internet",
  },
  {
    id: "p-2",
    name: "1 hora Internet",
    description: "1 hora de acceso a internet premium",
    cost: 200,
    icon: "wifi",
    category: "internet",
  },
  {
    id: "p-3",
    name: "+0.5 Puntos Extra",
    description: "0.5 puntos extra en tu proxima evaluacion parcial",
    cost: 500,
    icon: "graduation-cap",
    category: "academic",
  },
  {
    id: "p-4",
    name: "+1.0 Puntos Extra",
    description: "1.0 punto extra en tu proxima evaluacion parcial",
    cost: 900,
    icon: "graduation-cap",
    category: "academic",
  },
  {
    id: "p-5",
    name: "Cafe Gratis",
    description: "Un cafe de cortesia en la cafeteria de la facultad",
    cost: 150,
    icon: "coffee",
    category: "cafeteria",
  },
  {
    id: "p-6",
    name: "Combo Almuerzo",
    description: "Un combo de almuerzo en la cafeteria",
    cost: 400,
    icon: "utensils",
    category: "cafeteria",
  },
]

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
