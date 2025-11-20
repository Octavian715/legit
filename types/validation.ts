export interface ValidationError {
    path: string
    message: string
    code: string
}

export interface ValidationResult {
    isValid: boolean
    errors: ValidationError[]
}

export interface ValidationService {
    validate: (schemaName: string, data: any) => ValidationResult
    getSchema: (schemaName: string) => any
    ajv: Ajv
}

export type AjvErrorObject = {
    keyword: string
    instancePath: string
    schemaPath: string
    params: Record<string, any>
    message?: string
}
