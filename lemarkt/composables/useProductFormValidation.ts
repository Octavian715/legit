import { ref, computed, shallowRef } from 'vue'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import addErrors from 'ajv-errors'
import { parseISO, isBefore, startOfDay } from 'date-fns'
import type { ValidationError } from '~/utils/validator'
import {
    getProductPricingSchema,
    type ProductPricingFormData,
} from '~/utils/validator/schemas/products/product'

interface StepValidationState {
    isValid: boolean
    errors: Record<string, string | string[]>
    isDirty: boolean
    lastValidated: number | null
}

interface Discount {
    priceType: 'local' | 'export'
    percentage: number
    startDate: string
    endDate?: string
}

export const useProductFormValidation = () => {
    const { t } = useI18n()
    const validationState = shallowRef<Record<string, StepValidationState>>({})

    const initializeStep = (stepKey: string) => {
        if (!validationState.value[stepKey]) {
            validationState.value = {
                ...validationState.value,
                [stepKey]: {
                    isValid: false,
                    errors: {},
                    isDirty: false,
                    lastValidated: null,
                },
            }
        }
    }

    const validateDiscounts = (discounts: any[]): ValidationError[] => {
        const errors: ValidationError[] = []
        const priceTypes = new Set<string>()

        discounts.forEach((discount, index) => {
            // Check duplicate price types
            if (priceTypes.has(discount.priceType)) {
                errors.push({
                    field: `discounts.${index}.priceType`,
                    message: t('validation.duplicatePriceType'),
                    code: 'duplicate',
                })
            }
            priceTypes.add(discount.priceType)

            // ✅ Validate percentage > 0
            if (!discount.percentage || discount.percentage <= 0) {
                errors.push({
                    field: `discounts.${index}.percentage`,
                    message: t('validation.percentageRequired'),
                    code: 'required',
                })
            } else if (discount.percentage < 0.01 || discount.percentage > 100) {
                errors.push({
                    field: `discounts.${index}.percentage`,
                    message: t('validation.percentageRange'),
                    code: 'range',
                })
            }

            // ✅ Validate startDate is required
            if (!discount.startDate || discount.startDate === '') {
                errors.push({
                    field: `discounts.${index}.startDate`,
                    message: t('validation.startDateRequired'),
                    code: 'required',
                })
            }
            // No endDate validation - unlimited discounts have empty endDate
        })

        return errors
    }
    const validateStep = (
        stepKey: string,
        validateFn: () => { isValid: boolean; errors?: ValidationError[]; data?: any }
    ): boolean => {
        initializeStep(stepKey)

        const result = validateFn()

        // Clean empty endDate strings before validation
        if (result.data?.discounts) {
            result.data.discounts = result.data.discounts.map((discount: any) => {
                const cleaned = { ...discount }
                if (cleaned.endDate === '' || cleaned.endDate === null) {
                    delete cleaned.endDate
                }
                return cleaned
            })
        }

        let allErrors: ValidationError[] = result.errors || []

        if (stepKey === 'features' && result.data?.discounts) {
            const discountErrors = validateDiscounts(result.data.discounts)
            allErrors = [...allErrors, ...discountErrors]
        }

        const errors: Record<string, string | string[]> = {}

        if (allErrors.length > 0) {
            allErrors.forEach((error: ValidationError) => {
                if (error.field) {
                    errors[error.field] = error.message
                }
            })
        }

        const isValid = allErrors.length === 0

        validationState.value = {
            ...validationState.value,
            [stepKey]: {
                isValid,
                errors,
                isDirty: true,
                lastValidated: Date.now(),
            },
        }

        return isValid
    }

    const validatePricingStep = (
        data: ProductPricingFormData,
        doExport: boolean = false
    ): { isValid: boolean; errors: ValidationError[] } => {
        const validPrices = data.prices?.filter((p) => p.price > 0) || []

        const hasValidLocal = validPrices.some((p) => p.priceType === 'local')

        const errors: ValidationError[] = []

        if (!hasValidLocal) {
            errors.push({
                field: 'prices.0.price',
                message: t('validation.required'),
                code: 'required',
            })
        }

        if (doExport) {
            const hasValidExport = validPrices.some((p) => p.priceType === 'export')

            if (!hasValidExport) {
                errors.push({
                    field: 'prices.1.price',
                    message: t('validation.required'),
                    code: 'required',
                })
            }
        }

        if (errors.length > 0) {
            return {
                isValid: false,
                errors,
            }
        }

        const dataToValidate = {
            ...data,
            prices: doExport ? validPrices : validPrices.filter((p) => p.priceType === 'local'),
        }

        const ajv = new Ajv({ allErrors: true })
        addFormats(ajv)
        addErrors(ajv)

        const schema = getProductPricingSchema(doExport)

        const validateFn = ajv.compile(schema)
        const isValid = validateFn(dataToValidate)

        if (!isValid && validateFn.errors) {
            validateFn.errors.forEach((error) => {
                const field = error.instancePath.replace(/^\//, '').replace(/\//g, '.')
                errors.push({
                    field,
                    message: error.message || t('validationError'),
                    code: 'validation',
                })
            })
        }

        if (Array.isArray(data.discounts)) {
            const discountErrors = validateDiscounts(data.discounts)
            errors.push(...discountErrors)
        }

        return {
            isValid: errors.length === 0,
            errors,
        }
    }

    const setBackendErrors = (
        stepKey: string,
        backendErrors: Record<string, string | string[]>
    ) => {
        initializeStep(stepKey)

        const currentState = validationState.value[stepKey]

        validationState.value = {
            ...validationState.value,
            [stepKey]: {
                ...currentState,
                isValid: false,
                errors: { ...currentState.errors, ...backendErrors },
                isDirty: true,
            },
        }
    }

    const clearStepErrors = (stepKey: string) => {
        if (validationState.value[stepKey]) {
            validationState.value = {
                ...validationState.value,
                [stepKey]: {
                    ...validationState.value[stepKey],
                    errors: {},
                    isValid: true,
                },
            }
        }
    }

    const clearFieldError = (stepKey: string, fieldName: string) => {
        if (validationState.value[stepKey]?.errors) {
            const newErrors = { ...validationState.value[stepKey].errors }
            delete newErrors[fieldName]

            const snakeCaseField = fieldName.replace(/([A-Z])/g, '_$1').toLowerCase()
            delete newErrors[snakeCaseField]

            validationState.value = {
                ...validationState.value,
                [stepKey]: {
                    ...validationState.value[stepKey],
                    errors: newErrors,
                    isValid: Object.keys(newErrors).length === 0,
                },
            }
        }
    }

    const isStepValid = (stepKey: string): boolean => {
        return validationState.value[stepKey]?.isValid ?? false
    }

    const getStepErrors = (stepKey: string): Record<string, string | string[]> => {
        return validationState.value[stepKey]?.errors ?? {}
    }

    const getFieldError = (stepKey: string, fieldName: string): string | null => {
        const errors = validationState.value[stepKey]?.errors
        if (!errors) return null

        const error = errors[fieldName]
        if (error) {
            return Array.isArray(error) ? error[0] : error
        }

        const snakeCaseField = fieldName.replace(/([A-Z])/g, '_$1').toLowerCase()
        const snakeError = errors[snakeCaseField]
        if (snakeError) {
            return Array.isArray(snakeError) ? snakeError[0] : snakeError
        }

        return null
    }

    const markStepDirty = (stepKey: string) => {
        initializeStep(stepKey)
        validationState.value = {
            ...validationState.value,
            [stepKey]: {
                ...validationState.value[stepKey],
                isDirty: true,
            },
        }
    }

    const resetValidation = () => {
        validationState.value = {}
    }

    const resetStepValidation = (stepKey: string) => {
        if (validationState.value[stepKey]) {
            const newState = { ...validationState.value }
            delete newState[stepKey]
            validationState.value = newState
        }
    }

    return {
        validationState: computed(() => validationState.value),
        validateStep,
        validatePricingStep,
        validateDiscounts,
        setBackendErrors,
        clearStepErrors,
        clearFieldError,
        isStepValid,
        getStepErrors,
        getFieldError,
        markStepDirty,
        resetValidation,
        resetStepValidation,
        initializeStep,
    }
}
