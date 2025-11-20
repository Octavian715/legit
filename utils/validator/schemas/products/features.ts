// ~/utils/validator/schemas/products/features.ts
import type { JSONSchemaType } from 'ajv'

export interface DiscountData {
    percentage: number
    start_date: string | null
    end_date: string | null
}

export interface ProductDiscountsPayload {
    local?: DiscountData
    export?: DiscountData
}

const discountDataSchema: JSONSchemaType<DiscountData> = {
    type: 'object',
    properties: {
        percentage: {
            type: 'number',
            minimum: 0,
            maximum: 100,
            errorMessage: {
                minimum: 'validation.discountPercentageMin',
                maximum: 'validation.discountPercentageMax',
                type: 'validation.discountPercentageType',
            },
        },
        start_date: {
            type: ['string', 'null'],
            format: 'date',
            nullable: true,
            errorMessage: {
                format: 'validation.invalidDate',
            },
        },
        end_date: {
            type: ['string', 'null'],
            format: 'date',
            nullable: true,
            errorMessage: {
                format: 'validation.invalidDate',
            },
        },
    },
    required: ['percentage'],
    additionalProperties: false,
    errorMessage: {
        required: {
            percentage: 'validation.discountPercentageRequired',
        },
        additionalProperties: 'validation.noAdditionalProperties',
    },
}

export const productDiscountsSchema: JSONSchemaType<ProductDiscountsPayload> = {
    type: 'object',
    properties: {
        local: {
            ...discountDataSchema,
            nullable: true,
        },
        export: {
            ...discountDataSchema,
            nullable: true,
        },
    },
    additionalProperties: false,
    anyOf: [
        {
            required: ['local'],
            properties: {
                local: { not: { type: 'null' } },
            },
        },
        {
            required: ['export'],
            properties: {
                export: { not: { type: 'null' } },
            },
        },
    ],
    errorMessage: {
        anyOf: 'validation.atLeastOneDiscountRequired',
        additionalProperties: 'validation.noAdditionalProperties',
    },
}

// Custom validation for date range logic
export const validateDateRange = (
    discountData: DiscountData
): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (discountData.start_date && discountData.end_date) {
        const startDate = new Date(discountData.start_date)
        const endDate = new Date(discountData.end_date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Check if start date is not in the past
        if (startDate < today) {
            errors.push('validation.startDateNotInPast')
        }

        // Check if end date is after start date
        if (endDate <= startDate) {
            errors.push('validation.endDateAfterStartDate')
        }

        // Check if date range is not too long (e.g., max 2 years)
        const maxDays = 2 * 365 // 2 years in days
        const daysDifference = Math.ceil(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        )

        if (daysDifference > maxDays) {
            errors.push('validation.discountPeriodTooLong')
        }
    }

    // If only start_date is provided, ensure it's not in the past
    if (discountData.start_date && !discountData.end_date) {
        const startDate = new Date(discountData.start_date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        if (startDate < today) {
            errors.push('validation.startDateNotInPast')
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
    }
}

// Comprehensive validation function that combines AJV and custom validation
export const validateProductDiscounts = (
    data: unknown
): { isValid: boolean; errors: Array<{ field: string; message: string; code: string }> } => {
    const { validator } = require('~/utils/validator/index')

    // First, validate with AJV schema
    const ajvResult = validator.validate('productDiscounts', productDiscountsSchema, data)

    if (!ajvResult.isValid) {
        return {
            isValid: false,
            errors: ajvResult.errors,
        }
    }

    const validatedData = ajvResult.data as ProductDiscountsPayload
    const customErrors: Array<{ field: string; message: string; code: string }> = []

    // Custom validation for date ranges
    if (validatedData.local) {
        const localValidation = validateDateRange(validatedData.local)
        if (!localValidation.isValid) {
            customErrors.push(
                ...localValidation.errors.map((error) => ({
                    field: 'local',
                    message: error,
                    code: 'custom_validation',
                }))
            )
        }
    }

    if (validatedData.export) {
        const exportValidation = validateDateRange(validatedData.export)
        if (!exportValidation.isValid) {
            customErrors.push(
                ...exportValidation.errors.map((error) => ({
                    field: 'export',
                    message: error,
                    code: 'custom_validation',
                }))
            )
        }
    }

    return {
        isValid: customErrors.length === 0,
        errors: customErrors,
    }
}
