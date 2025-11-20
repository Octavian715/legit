/**
 * Composable for input validation utilities
 * Provides reusable validation logic for different input types
 */

export interface NumberValidationOptions {
    min?: number
    max?: number
    decimalPlaces?: number
    allowNegative?: boolean
    strictNumber?: boolean
}

export interface ValidationResult {
    isValid: boolean
    sanitizedValue: string
    numericValue: number | null
}

export const useInputValidation = () => {
    /**
     * Validates and sanitizes numeric input
     * Prevents invalid characters like 'e', '+', scientific notation
     * Enforces decimal places limit
     */
    const validateNumberInput = (
        value: string,
        options: NumberValidationOptions = {}
    ): ValidationResult => {
        const { min, max, decimalPlaces = 2, allowNegative = false, strictNumber = true } = options

        // Empty value is valid (allows clearing the field)
        if (value === '' || value === null || value === undefined) {
            return {
                isValid: true,
                sanitizedValue: '',
                numericValue: null,
            }
        }

        let sanitized = String(value)

        // Strict number mode: block 'e', 'E', '+' characters
        if (strictNumber) {
            // Remove any 'e', 'E', '+' characters
            if (/[eE+]/.test(sanitized)) {
                // Return last valid state by removing invalid chars
                sanitized = sanitized.replace(/[eE+]/g, '')
            }
        }

        // Handle negative sign
        if (!allowNegative && sanitized.includes('-')) {
            sanitized = sanitized.replace(/-/g, '')
        } else if (allowNegative) {
            // Only allow one minus sign at the beginning
            const hasMinusAtStart = sanitized.startsWith('-')
            sanitized = sanitized.replace(/-/g, '')
            if (hasMinusAtStart) {
                sanitized = '-' + sanitized
            }
        }

        // Handle decimal places
        if (decimalPlaces !== undefined && decimalPlaces >= 0) {
            const parts = sanitized.split('.')

            if (parts.length > 2) {
                // Multiple decimal points - keep only first one
                sanitized = parts[0] + '.' + parts.slice(1).join('')
            }

            if (parts.length === 2 && parts[1].length > decimalPlaces) {
                // Truncate to allowed decimal places
                sanitized = parts[0] + '.' + parts[1].substring(0, decimalPlaces)
            }

            // Don't allow decimal point if decimalPlaces is 0
            if (decimalPlaces === 0 && sanitized.includes('.')) {
                sanitized = sanitized.replace('.', '')
            }
        }

        // Remove any non-numeric characters except minus and decimal
        sanitized = sanitized.replace(/[^\d.-]/g, '')

        // Parse to number
        const numericValue = sanitized === '' || sanitized === '-' ? null : parseFloat(sanitized)

        // Validate numeric value
        if (numericValue !== null && !isNaN(numericValue)) {
            // Check min/max bounds
            if (min !== undefined && numericValue < min) {
                return {
                    isValid: false,
                    sanitizedValue: sanitized,
                    numericValue,
                }
            }

            if (max !== undefined && numericValue > max) {
                return {
                    isValid: false,
                    sanitizedValue: sanitized,
                    numericValue,
                }
            }
        }

        return {
            isValid: true,
            sanitizedValue: sanitized,
            numericValue,
        }
    }

    /**
     * Clamps a numeric value between min and max
     */
    const clampNumber = (value: number, min?: number, max?: number): number => {
        let clamped = value

        if (min !== undefined && clamped < min) {
            clamped = min
        }

        if (max !== undefined && clamped > max) {
            clamped = max
        }

        return clamped
    }

    /**
     * Formats a number to specific decimal places
     */
    const formatDecimal = (value: number | null | undefined, decimalPlaces: number = 2): string => {
        if (value === null || value === undefined || isNaN(value)) {
            return ''
        }

        return value.toFixed(decimalPlaces)
    }

    /**
     * Validates discount percentage (0.01 - 100, max 2 decimals)
     */
    const validateDiscountPercentage = (value: string): ValidationResult => {
        return validateNumberInput(value, {
            min: 0.01,
            max: 100,
            decimalPlaces: 2,
            allowNegative: false,
            strictNumber: true,
        })
    }

    return {
        validateNumberInput,
        clampNumber,
        formatDecimal,
        validateDiscountPercentage,
    }
}
