/**
 * Validation schemas and helper functions for Prize operations
 */

export interface CreatePrizeInput {
  name: string
  description: string
  cost: number
  icon: string
  categoryId: string
}

export interface UpdatePrizeInput {
  name?: string
  description?: string
  cost?: number
  icon?: string
  categoryId?: string
}

export interface PrizeResponse {
  id: string
  name: string
  description: string
  cost: number
  icon: string
  categoryId: string
}

/**
 * Validate category ID (must be non-empty string)
 */
export function validateCategoryId(categoryId?: string): boolean {
  if (!categoryId) return false
  return typeof categoryId === "string" && categoryId.trim().length > 0
}

/**
 * Validate cost (must be positive)
 */
export function validatePrizeCost(cost?: number): boolean {
  if (cost === undefined) return false
  return typeof cost === "number" && cost > 0 && Number.isInteger(cost)
}

/**
 * Validate name
 */
export function validatePrizeName(name?: string): boolean {
  if (!name) return false
  return typeof name === "string" && name.trim().length > 0 && name.trim().length <= 100
}

/**
 * Validate description
 */
export function validatePrizeDescription(description?: string): boolean {
  if (!description) return false
  return typeof description === "string" && description.trim().length > 0 && description.trim().length <= 500
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
    errors.push("name is required and must be a non-empty string (max 100 characters)")
  }

  // Description validation
  if (!validatePrizeDescription(data.description)) {
    errors.push("description is required and must be a non-empty string (max 500 characters)")
  }

  // Cost validation
  if (!validatePrizeCost(data.cost)) {
    errors.push("cost is required and must be a positive integer")
  }

  // Icon validation
  if (!validatePrizeIcon(data.icon)) {
    errors.push("icon is required and must be a non-empty string (lucide-react icon name)")
  }

  // Category ID validation
  if (!validateCategoryId(data.categoryId)) {
    errors.push("categoryId is required and must be a valid category")
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
    errors.push("name must be a non-empty string (max 100 characters)")
  }

  // Description validation (optional)
  if (data.description !== undefined && !validatePrizeDescription(data.description)) {
    errors.push("description must be a non-empty string (max 500 characters)")
  }

  // Cost validation (optional)
  if (data.cost !== undefined && !validatePrizeCost(data.cost)) {
    errors.push("cost must be a positive integer")
  }

  // Icon validation (optional)
  if (data.icon !== undefined && !validatePrizeIcon(data.icon)) {
    errors.push("icon must be a non-empty string (lucide-react icon name)")
  }

  // Category ID validation (optional)
  if (data.categoryId !== undefined && !validateCategoryId(data.categoryId)) {
    errors.push("categoryId must be a valid category")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
