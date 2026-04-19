/**
 * Validation schemas and helper functions for Prize operations
 */

export enum PrizeCategoryEnum {
  INTERNET = "internet",
  ACADEMIC = "academic",
  CAFETERIA = "cafeteria",
}

export interface CreatePrizeInput {
  name: string
  description: string
  cost: number
  icon: string
  category: PrizeCategoryEnum | string
}

export interface UpdatePrizeInput {
  name?: string
  description?: string
  cost?: number
  icon?: string
  category?: PrizeCategoryEnum | string
}

export interface PrizeResponse {
  id: string
  name: string
  description: string
  cost: number
  icon: string
  category: string
}

/**
 * Validate prize category
 */
export function validatePrizeCategory(category?: string): boolean {
  if (!category) return false
  return Object.values(PrizeCategoryEnum).includes(category as PrizeCategoryEnum)
}

/**
 * Validate cost (must be positive)
 */
export function validatePrizeCost(cost?: number): boolean {
  if (cost === undefined) return false
  return typeof cost === "number" && cost > 0
}

/**
 * Validate name
 */
export function validatePrizeName(name?: string): boolean {
  if (!name) return false
  return typeof name === "string" && name.trim().length > 0
}

/**
 * Validate description
 */
export function validatePrizeDescription(description?: string): boolean {
  if (!description) return false
  return typeof description === "string" && description.trim().length > 0
}

/**
 * Validate icon name
 */
export function validatePrizeIcon(icon?: string): boolean {
  if (!icon) return false
  return typeof icon === "string" && icon.trim().length > 0
}

/**
 * Validate create prize input
 */
export function validateCreatePrizeInput(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Name validation
  if (!validatePrizeName(data.name)) {
    errors.push("name is required and must be a non-empty string")
  }

  // Description validation
  if (!validatePrizeDescription(data.description)) {
    errors.push("description is required and must be a non-empty string")
  }

  // Cost validation
  if (!validatePrizeCost(data.cost)) {
    errors.push("cost is required and must be a positive number")
  }

  // Icon validation
  if (!validatePrizeIcon(data.icon)) {
    errors.push("icon is required and must be a non-empty string")
  }

  // Category validation
  if (!validatePrizeCategory(data.category)) {
    errors.push(`category is required and must be one of: ${Object.values(PrizeCategoryEnum).join(", ")}`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validate update prize input
 */
export function validateUpdatePrizeInput(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Name validation (optional)
  if (data.name !== undefined && !validatePrizeName(data.name)) {
    errors.push("name must be a non-empty string")
  }

  // Description validation (optional)
  if (data.description !== undefined && !validatePrizeDescription(data.description)) {
    errors.push("description must be a non-empty string")
  }

  // Cost validation (optional)
  if (data.cost !== undefined && !validatePrizeCost(data.cost)) {
    errors.push("cost must be a positive number")
  }

  // Icon validation (optional)
  if (data.icon !== undefined && !validatePrizeIcon(data.icon)) {
    errors.push("icon must be a non-empty string")
  }

  // Category validation (optional)
  if (data.category !== undefined && !validatePrizeCategory(data.category)) {
    errors.push(`category must be one of: ${Object.values(PrizeCategoryEnum).join(", ")}`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
