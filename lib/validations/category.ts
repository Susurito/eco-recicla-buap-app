/**
 * Validation schemas and helper functions for PrizeCategory operations
 */

export interface CreateCategoryInput {
  name: string
  description?: string
  color?: string
}

export interface UpdateCategoryInput {
  name?: string
  description?: string
  color?: string
}

/**
 * Validate category name
 */
export function validateCategoryName(name?: string): boolean {
  if (!name) return false
  return typeof name === "string" && name.trim().length > 0 && name.trim().length <= 100
}

/**
 * Validate category description
 */
export function validateCategoryDescription(description?: string): boolean {
  if (!description) return true // Optional
  return typeof description === "string" && description.trim().length <= 500
}

/**
 * Validate category color (hex color code)
 */
export function validateCategoryColor(color?: string): boolean {
  if (!color) return true // Optional, will use default
  if (typeof color !== "string") return false
  // Check if valid hex color
  return /^#[0-9A-F]{6}$/i.test(color.trim())
}

/**
 * Validate create category input
 */
export function validateCreateCategoryInput(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Name validation
  if (!validateCategoryName(data.name)) {
    errors.push("name is required and must be a non-empty string (max 100 characters)")
  }

  // Description validation (optional)
  if (data.description !== undefined && !validateCategoryDescription(data.description)) {
    errors.push("description must be a string with max 500 characters")
  }

  // Color validation (optional)
  if (data.color !== undefined && !validateCategoryColor(data.color)) {
    errors.push("color must be a valid hex color code (e.g., #3b82f6)")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validate update category input
 */
export function validateUpdateCategoryInput(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Name validation (optional)
  if (data.name !== undefined && !validateCategoryName(data.name)) {
    errors.push("name must be a non-empty string (max 100 characters)")
  }

  // Description validation (optional)
  if (data.description !== undefined && !validateCategoryDescription(data.description)) {
    errors.push("description must be a string with max 500 characters")
  }

  // Color validation (optional)
  if (data.color !== undefined && !validateCategoryColor(data.color)) {
    errors.push("color must be a valid hex color code (e.g., #3b82f6)")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
