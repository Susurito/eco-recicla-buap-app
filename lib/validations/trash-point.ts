/**
 * Validation schemas and helper functions for TrashPoint operations
 */

export enum TrashPointCategory {
  PLASTICO = "plastico",
  PAPEL = "papel",
  ORGANICO = "organico",
  GENERAL = "general",
}

export interface CreateTrashPointInput {
  name: string
  lat: number
  lng: number
  detectedObject: string
  detectedImage: string
  category?: TrashPointCategory | string
  fillLevel?: number
  lastCollected?: string
  alert?: string
}

export interface UpdateTrashPointInput {
  name?: string
  lat?: number
  lng?: number
  detectedObject?: string
  detectedImage?: string
  category?: TrashPointCategory | string
  fillLevel?: number
  lastCollected?: string
  alert?: string | null
}

export interface TrashPointResponse {
  id: string
  name: string
  lat: number
  lng: number
  detectedObject: string
  detectedImage: string
  category: string | null
  fillLevel: number
  lastCollected: string
  alert: string | null
  todayStats?: {
    id: number
    plastico: number
    papel: number
    organico: number
    general: number
  }
  createdAt?: string
  updatedAt?: string
}

/**
 * Validate coordinates
 */
export function validateCoordinates(lat: number, lng: number): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  )
}

/**
 * Validate trash point category
 */
export function validateCategory(category?: string): boolean {
  if (!category) return true
  return Object.values(TrashPointCategory).includes(category as TrashPointCategory)
}

/**
 * Validate fill level (0-100)
 */
export function validateFillLevel(fillLevel?: number): boolean {
  if (fillLevel === undefined) return true
  return typeof fillLevel === "number" && fillLevel >= 0 && fillLevel <= 100
}

/**
 * Validate create trash point input
 */
export function validateCreateInput(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Name validation
  if (!data.name || typeof data.name !== "string" || data.name.trim().length === 0) {
    errors.push("name is required and must be a non-empty string")
  }

  // Coordinates validation
  if (typeof data.lat !== "number" || typeof data.lng !== "number") {
    errors.push("lat and lng are required and must be numbers")
  } else if (!validateCoordinates(data.lat, data.lng)) {
    errors.push("lat must be between -90 and 90, lng must be between -180 and 180")
  }

  // Detected object validation
  if (!data.detectedObject || typeof data.detectedObject !== "string") {
    errors.push("detectedObject is required and must be a string")
  }

  // Detected image validation
  if (!data.detectedImage || typeof data.detectedImage !== "string") {
    errors.push("detectedImage is required and must be a string")
  }

  // Category validation (optional)
  if (data.category && !validateCategory(data.category)) {
    errors.push(`category must be one of: ${Object.values(TrashPointCategory).join(", ")}`)
  }

  // Fill level validation (optional)
  if (!validateFillLevel(data.fillLevel)) {
    errors.push("fillLevel must be a number between 0 and 100")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validate update trash point input
 */
export function validateUpdateInput(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Name validation
  if (data.name !== undefined) {
    if (typeof data.name !== "string" || data.name.trim().length === 0) {
      errors.push("name must be a non-empty string")
    }
  }

  // Coordinates validation
  if (data.lat !== undefined || data.lng !== undefined) {
    const lat = data.lat !== undefined ? data.lat : 0
    const lng = data.lng !== undefined ? data.lng : 0
    if (typeof lat !== "number" || typeof lng !== "number") {
      errors.push("lat and lng must be numbers")
    } else if (data.lat !== undefined && data.lng !== undefined && !validateCoordinates(lat, lng)) {
      errors.push("lat must be between -90 and 90, lng must be between -180 and 180")
    }
  }

  // Detected object validation
  if (data.detectedObject !== undefined && typeof data.detectedObject !== "string") {
    errors.push("detectedObject must be a string")
  }

  // Detected image validation
  if (data.detectedImage !== undefined && typeof data.detectedImage !== "string") {
    errors.push("detectedImage must be a string")
  }

  // Category validation
  if (data.category !== undefined && !validateCategory(data.category)) {
    errors.push(`category must be one of: ${Object.values(TrashPointCategory).join(", ")}`)
  }

  // Fill level validation
  if (data.fillLevel !== undefined && !validateFillLevel(data.fillLevel)) {
    errors.push("fillLevel must be a number between 0 and 100")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
