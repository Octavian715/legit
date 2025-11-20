import Ajv, { type JSONSchemaType, type ValidateFunction, type ErrorObject } from 'ajv'
import addFormats from 'ajv-formats'
import addErrors from 'ajv-errors'

export interface ValidationError {
    field: string
    message: string
    code: string
    params?: Record<string, any>
}

export interface ValidationResult {
    isValid: boolean
    errors: ValidationError[]
    data?: any
}

class ValidationSystem {
    private ajv: Ajv
    private compiledSchemas: Map<string, ValidateFunction> = new Map()

    constructor() {
        this.ajv = new Ajv({
            allErrors: true,
            removeAdditional: true,
            useDefaults: true,
            coerceTypes: false,
            $data: true,
            verbose: true,
        })

        addFormats(this.ajv)
        addErrors(this.ajv)
        this.addCustomFormats()
        this.addCustomUrl()
        this.addFlexibleUrl()
    }

    private validateEANFormat(ean: string): boolean {
        return /^[0-9]{8}$|^[0-9]{12}$|^[0-9]{13}$|^[0-9]{14}$/.test(ean)
    }

    private addCustomFormats() {
        this.ajv.addFormat('ean', {
            type: 'string',
            validate: (data: string) => {
                return /^[0-9]{8}$|^[0-9]{12}$|^[0-9]{13}$|^[0-9]{14}$/.test(data)
            },
        })
    }

    private addCustomUrl() {
        this.ajv.addFormat('url-without-protocol', {
            type: 'string',
            validate: (value: string) => {
                if (value.includes('http://') || value.includes('https://')) {
                    return false
                }

                const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i
                return domainRegex.test(value)
            },
        })
    }

    private addFlexibleUrl() {
        this.ajv.addFormat('flexible-url', {
            type: 'string',
            validate: (value: string) => {
                if (!value || typeof value !== 'string') {
                    return false
                }

                const trimmedValue = value.trim()

                if (trimmedValue.length === 0) {
                    return false
                }

                const protocolPattern = /^https?:\/\/|^http?:\/\//i
                const hasProtocol = protocolPattern.test(trimmedValue)

                let urlToValidate = trimmedValue
                if (hasProtocol) {
                    urlToValidate = trimmedValue.replace(protocolPattern, '')
                }

                const wwwPattern = /^www\./i
                const hasWww = wwwPattern.test(urlToValidate)
                if (hasWww) {
                    urlToValidate = urlToValidate.replace(wwwPattern, '')
                }

                const domainPattern =
                    /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.([a-z0-9]([a-z0-9-]*[a-z0-9])?))*\.[a-z]{2,}(:\d+)?(\/[^\s]*)?$/i

                return domainPattern.test(urlToValidate)
            },
        })
    }

    private getI18nInstance() {
        try {
            if (process.client && typeof window !== 'undefined') {
                const nuxtApp = (window as any).$nuxt
                if (nuxtApp?.$i18n) {
                    return nuxtApp.$i18n
                }

                if ((window as any).__NUXT__?.nuxtApp?.$i18n) {
                    return (window as any).__NUXT__.nuxtApp.$i18n
                }
            }

            if (typeof useNuxtApp === 'function') {
                try {
                    const nuxtApp = useNuxtApp()
                    if (nuxtApp.$i18n) {
                        return nuxtApp.$i18n
                    }
                } catch {}
            }

            return null
        } catch {
            return null
        }
    }

    private getTranslation(key: string, params?: Record<string, any>): string {
        const i18n = this.getI18nInstance()

        try {
            const translated = i18n.t(`validation.${key}`, params || {})

            if (translated === `validation.${key}`) {
                const fallback = i18n.t(key, params || {})
                if (fallback !== key) {
                    return fallback
                }
                return this.simpleFormat(key, params)
            }

            return translated
        } catch (error) {
            return this.simpleFormat(key, params)
        }
    }

    private simpleFormat(key: string, params?: Record<string, any>): string {
        return (
            key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, (str) => str.toUpperCase())
                .trim() || 'Invalid input'
        )
    }

    private looksLikeTranslationKey(message: string): boolean {
        return message.includes('.') && !message.includes(' ') && message.length > 5
    }

    private getFieldDataType(
        error: ErrorObject
    ): 'string' | 'number' | 'array' | 'object' | 'unknown' {
        if (error.schemaPath) {
            if (
                error.schemaPath.includes('/minLength') ||
                error.schemaPath.includes('/maxLength')
            ) {
                return 'string'
            }
            if (error.schemaPath.includes('/minimum') || error.schemaPath.includes('/maximum')) {
                return 'number'
            }
            if (error.schemaPath.includes('/minItems') || error.schemaPath.includes('/maxItems')) {
                return 'array'
            }
        }

        if (error.params?.type === 'string') return 'string'
        if (error.params?.type === 'number' || error.params?.type === 'integer') return 'number'
        if (error.params?.type === 'array') return 'array'
        if (error.params?.type === 'object') return 'object'

        if (typeof error.data === 'string') return 'string'
        if (typeof error.data === 'number') return 'number'
        if (Array.isArray(error.data)) return 'array'
        if (typeof error.data === 'object') return 'object'

        return 'unknown'
    }

    private transformAjvErrors(errors: ErrorObject[], data: any): ValidationError[] {
        if (!errors) return []

        return errors.map((error) => {
            let field = 'root'
            if (error.instancePath) {
                field = error.instancePath.slice(1).replace(/\//g, '.')
            } else if (error.params?.missingProperty) {
                field = error.params.missingProperty
            }

            // PRIORITY 1: Check if ajv-errors has already set a custom message
            // This happens when errorMessage is defined in the schema
            if (error.message && this.looksLikeTranslationKey(error.message)) {
                const i18n = this.getI18nInstance()
                if (i18n) {
                    const translated = i18n.t(error.message, {
                        field,
                        value: error.data,
                        ...error.params,
                    })
                    // If translation succeeded, use it
                    if (translated !== error.message) {
                        return {
                            field,
                            message: translated,
                            code: error.keyword,
                            params: error.params,
                        }
                    }
                }
            }

            // PRIORITY 2: Process based on keyword
            const keyword = error.keyword
            const dataType = this.getFieldDataType(error)
            let errorCode = keyword
            let params = { ...error.params, field }

            switch (keyword) {
                case 'required':
                    errorCode = 'required'
                    field = error.params?.missingProperty || field
                    break

                case 'format':
                    const format = error.params?.format
                    if (format === 'email') {
                        errorCode = 'formatEmail'
                    } else if (format === 'phone') {
                        errorCode = 'formatPhone'
                    } else if (format === 'ean') {
                        errorCode = 'formatEan'
                    } else if (format === 'date') {
                        errorCode = 'formatDate'
                    } else if (
                        format === 'uri' ||
                        format === 'url' ||
                        format === 'url-without-protocol' ||
                        format === 'flexible-url'
                    ) {
                        errorCode = 'formatUrl'
                    } else {
                        errorCode = `format${format.charAt(0).toUpperCase() + format.slice(1)}`
                    }
                    break

                case 'minLength':
                    errorCode = 'stringMinLength'
                    params = {
                        ...params,
                        min: error.params?.limit,
                        limit: error.params?.limit,
                    }
                    break

                case 'maxLength':
                    errorCode = 'stringMaxLength'
                    params = {
                        ...params,
                        max: error.params?.limit,
                        limit: error.params?.limit,
                    }
                    break

                case 'minimum':
                    // For integer fields (like selects), if value is null/undefined/0
                    // treat it as a "required" error instead of "minimum" error
                    if (
                        (error.params?.type === 'integer' || dataType === 'number') &&
                        (error.data === null || error.data === undefined || error.data === 0)
                    ) {
                        errorCode = 'required'
                    } else {
                        errorCode = dataType === 'number' ? 'numberMinimum' : 'minimum'
                        params = {
                            ...params,
                            min: error.params?.limit,
                            limit: error.params?.limit,
                        }
                    }
                    break

                case 'maximum':
                    errorCode = dataType === 'number' ? 'numberMaximum' : 'maximum'
                    params = {
                        ...params,
                        max: error.params?.limit,
                        limit: error.params?.limit,
                    }
                    break

                case 'minItems':
                    errorCode = 'arrayMinItems'
                    params = {
                        ...params,
                        min: error.params?.limit,
                        limit: error.params?.limit,
                    }
                    break

                case 'maxItems':
                    errorCode = 'arrayMaxItems'
                    params = {
                        ...params,
                        max: error.params?.limit,
                        limit: error.params?.limit,
                    }
                    break

                case 'pattern':
                    if (
                        error.params?.pattern?.includes('[0-9]{8}') ||
                        error.params?.pattern?.includes('[0-9]{13}')
                    ) {
                        errorCode = 'formatEan'
                    } else {
                        errorCode = 'invalidPattern'
                    }
                    params = {
                        ...params,
                        pattern: error.params?.pattern,
                    }
                    break

                case 'enum':
                    errorCode = 'invalidEnum'
                    params = {
                        ...params,
                        allowedValues: error.params?.allowedValues?.join(', '),
                    }
                    break

                case 'const':
                    errorCode = 'invalidConst'
                    break

                case 'type':
                    if (
                        error.params?.type === 'string' &&
                        (error.data === null || error.data === undefined || error.data === '')
                    ) {
                        errorCode = 'required'
                    } else if (
                        (error.params?.type === 'integer' || error.params?.type === 'number') &&
                        (error.data === null || error.data === undefined)
                    ) {
                        // For integer/number types (selects), treat as required
                        errorCode = 'required'
                    } else {
                        errorCode = 'invalidType'
                        params = {
                            ...params,
                            expectedType: error.params?.type,
                        }
                    }
                    break

                case 'additionalProperties':
                    errorCode = 'noAdditionalProperties'
                    params = {
                        ...params,
                        additionalProperty: error.params?.additionalProperty,
                    }
                    break

                case 'oneOf':
                case 'anyOf':
                case 'allOf':
                    errorCode = 'invalidSchema'
                    break

                default:
                    errorCode = 'invalidField'
            }

            const message = this.getTranslation(errorCode, {
                field: field,
                value: error.data,
                ...params,
            })

            return {
                field,
                message,
                code: errorCode,
                params: error.params,
            }
        })
    }

    public compileSchema<T>(schemaId: string, schema: JSONSchemaType<T>): ValidateFunction<T> {
        if (this.compiledSchemas.has(schemaId)) {
            return this.compiledSchemas.get(schemaId) as ValidateFunction<T>
        }

        const validate = this.ajv.compile<T>(schema)
        this.compiledSchemas.set(schemaId, validate)
        return validate
    }

    public validate<T>(
        schemaId: string,
        schema: JSONSchemaType<T>,
        data: unknown
    ): ValidationResult {
        try {
            const validateFn = this.compileSchema(schemaId, schema)
            const isValid = validateFn(data)

            if (isValid) {
                return {
                    isValid: true,
                    errors: [],
                    data: data as T,
                }
            }

            const errors = this.transformAjvErrors(validateFn.errors || [], data)

            return {
                isValid: false,
                errors,
                data: undefined,
            }
        } catch (error) {
            console.error('Validation error:', error)
            return {
                isValid: false,
                errors: [
                    {
                        field: 'root',
                        message: this.getTranslation('validationFailed'),
                        code: 'validation_error',
                    },
                ],
                data: undefined,
            }
        }
    }

    public async validateAsync<T>(
        schemaId: string,
        schema: JSONSchemaType<T>,
        data: unknown
    ): Promise<ValidationResult> {
        return new Promise((resolve) => {
            const result = this.validate(schemaId, schema, data)
            resolve(result)
        })
    }

    public createVeeValidateRule<T>(schemaId: string, schema: JSONSchemaType<T>) {
        return (value: unknown) => {
            const result = this.validate(schemaId, schema, value)

            if (result.isValid) {
                return true
            }

            return result.errors[0]?.message || this.getTranslation('invalidField')
        }
    }

    public validateField<T>(
        schemaId: string,
        schema: JSONSchemaType<T>,
        fieldName: string,
        value: unknown
    ): ValidationResult {
        const fieldData = { [fieldName]: value }

        const fieldSchema = {
            type: 'object' as const,
            properties: {
                [fieldName]: schema.properties?.[fieldName as keyof T] || {
                    type: 'string' as const,
                },
            },
            required: schema.required?.includes(fieldName as keyof T) ? [fieldName] : [],
            additionalProperties: false,
        }

        const result = this.validate(`${schemaId}_${fieldName}`, fieldSchema as any, fieldData)

        if (!result.isValid) {
            result.errors = result.errors.map((error) => ({
                ...error,
                field: fieldName,
            }))
        }

        return result
    }

    public validateEAN(ean: string): boolean {
        return this.validateEANFormat(ean)
    }
}

export const validator = new ValidationSystem()

export type { JSONSchemaType, ValidateFunction }

export const validateData = <T>(
    schemaId: string,
    schema: JSONSchemaType<T>,
    data: unknown
): ValidationResult => {
    return validator.validate(schemaId, schema, data)
}

export const validateField = <T>(
    schemaId: string,
    schema: JSONSchemaType<T>,
    fieldName: string,
    value: unknown
): ValidationResult => {
    return validator.validateField(schemaId, schema, fieldName, value)
}

export const createValidationRule = <T>(schemaId: string, schema: JSONSchemaType<T>) => {
    return validator.createVeeValidateRule(schemaId, schema)
}

export const validateEAN = (ean: string): boolean => {
    return validator.validateEAN(ean)
}
