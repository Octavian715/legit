// ~/types/api.ts
// API Types for LeMarkt B2B Platform

/* ---------- CORE API TYPES ------------------------------------------------ */

/**
 * Standard API response wrapper
 * Used for all successful API responses
 */
export interface ApiResponse<T = any> {
    data: T
    message?: string
    meta?: {
        current_page?: number
        total?: number
        per_page?: number
        last_page?: number
        from?: number
        to?: number
    }
}

/**
 * Standard API error structure
 * Used for all error responses
 */
export interface ApiError {
    statusCode: number
    statusMessage: string
    data?: any
    errors?: Record<string, string[]> | string[]
}

/**
 * Request configuration options
 * Extended options for API requests
 */
export interface RequestOptions {
    headers?: Record<string, string>
    query?: Record<string, any>
    params?: Record<string, any>
    retry?: boolean | number
    timeout?: number
    signal?: AbortSignal
}

export interface RequestOptions {
    headers?: Record<string, string>
    query?: Record<string, any>
    params?: Record<string, any>
    retry?: boolean | number
    timeout?: number
    signal?: AbortSignal
    responseType?: 'json' | 'blob' | 'arrayBuffer' | 'text' // ✅ Added
}

/* ---------- UPLOAD TYPES -------------------------------------------------- */

/**
 * Upload progress tracking
 */
export interface UploadProgress {
    loaded: number
    total: number
    percentage: number
    speed?: number
    remainingTime?: number
}

/**
 * Upload options for file uploads
 */
export interface UploadOptions {
    onProgress?: (progress: UploadProgress) => void
    onSuccess?: (response: any) => void
    onError?: (error: Error) => void
    headers?: Record<string, string>
    maxSize?: number
    acceptedTypes?: string[]
}

/**
 * Upload response structure
 */
export interface UploadResponse {
    id: string | number
    url: string
    filename: string
    size: number
    type: string
    created_at: string
}

/* ---------- BATCH REQUEST TYPES ------------------------------------------- */

/**
 * Single batch request configuration
 */
export interface BatchRequest {
    id: string
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    url: string
    body?: any
    headers?: Record<string, string>
}

/**
 * Single batch response
 */
export interface BatchResponse {
    id: string
    status: number
    data: any
    error?: ApiError
}

/* ---------- PAGINATION TYPES ---------------------------------------------- */

/**
 * Pagination parameters for list requests
 */
export interface PaginationParams {
    page?: number
    per_page?: number
    sort_by?: string
    sort_direction?: 'asc' | 'desc'
}

/**
 * Pagination meta information
 */
export interface PaginationMeta {
    current_page: number
    from: number
    last_page: number
    per_page: number
    to: number
    total: number
}

/* ---------- FILTER TYPES -------------------------------------------------- */

/**
 * Common filter parameters
 */
export interface FilterParams extends PaginationParams {
    search?: string
    status?: string | string[]
    date_from?: string
    date_to?: string
    [key: string]: any
}

/* ---------- VALIDATION TYPES ---------------------------------------------- */

/**
 * Field validation errors
 */
export interface ValidationErrors {
    [field: string]: string | string[]
}

/**
 * Validation error response
 */
export interface ValidationErrorResponse extends ApiError {
    statusCode: 422
    errors: ValidationErrors
}

/* ---------- AUTH TYPES ---------------------------------------------------- */

/**
 * Token refresh request
 */
export interface RefreshTokenRequest {
    refresh_token: string
}

/**
 * Token refresh response
 */
export interface RefreshTokenResponse {
    token: string
    refresh?: string
}

/* ---------- HTTP METHOD TYPES --------------------------------------------- */

/**
 * HTTP methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

/**
 * Request configuration for fetch
 */
export interface FetchOptions extends RequestOptions {
    method?: HttpMethod
    body?: any
    baseURL?: string
}

/* ---------- RESPONSE HELPERS ---------------------------------------------- */

/**
 * Success response helper type
 */
export interface SuccessResponse<T = any> extends ApiResponse<T> {
    success: true
}

/**
 * Error response helper type
 */
export interface ErrorResponse extends ApiError {
    success: false
}

/**
 * Generic API result type
 */
export type ApiResult<T = any> = SuccessResponse<T> | ErrorResponse

/* ---------- FILE TYPES ---------------------------------------------------- */

/**
 * File validation configuration
 */
export interface FileValidation {
    maxSize: number
    acceptedTypes: string[]
    multiple?: boolean
}

/**
 * File upload configuration
 */
export interface FileUploadConfig extends FileValidation {
    endpoint: string
    fieldName?: string
}

/* ---------- CACHE TYPES --------------------------------------------------- */

/**
 * Cache configuration
 */
export interface CacheConfig {
    ttl?: number // Time to live in seconds
    key?: string
    storage?: 'memory' | 'session' | 'local'
}

/* ---------- RETRY TYPES --------------------------------------------------- */

/**
 * Retry configuration
 */
export interface RetryConfig {
    limit?: number
    delay?: number
    statusCodes?: number[]
    methods?: HttpMethod[]
}

/* ---------- INTERCEPTOR TYPES --------------------------------------------- */

/**
 * Request interceptor context
 */
export interface RequestInterceptorContext {
    url: string
    method: HttpMethod
    headers: Record<string, string>
    params?: any
    body?: any
}

/**
 * Response interceptor context
 */
export interface ResponseInterceptorContext<T = any> {
    data: T
    status: number
    statusText: string
    headers: Record<string, string>
    config: RequestInterceptorContext
}

/* ---------- TYPE GUARDS --------------------------------------------------- */

/**
 * Check if response is an API error
 */
export const isApiError = (obj: any): obj is ApiError => {
    return obj && typeof obj.statusCode === 'number' && typeof obj.statusMessage === 'string'
}

/**
 * Check if response is a validation error
 */
export const isValidationError = (obj: any): obj is ValidationErrorResponse => {
    return isApiError(obj) && obj.statusCode === 422 && obj.errors && typeof obj.errors === 'object'
}

/**
 * Check if response is successful
 */
export const isSuccessResponse = <T = any>(obj: any): obj is SuccessResponse<T> => {
    return obj && obj.success === true && 'data' in obj
}

/**
 * Check if response is an error
 */
export const isErrorResponse = (obj: any): obj is ErrorResponse => {
    return obj && obj.success === false
}

/* ---------- UTILITY TYPES ------------------------------------------------- */

/**
 * Extract data type from API response
 */
export type ExtractData<T> = T extends ApiResponse<infer U> ? U : never

/**
 * Make all properties optional recursively
 */
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * Omit multiple properties from type
 */
export type OmitMultiple<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

/**
 * API endpoint configuration
 */
export interface EndpointConfig {
    url: string
    method: HttpMethod
    requiresAuth?: boolean
    cache?: CacheConfig
    retry?: RetryConfig
}

/* ---------- CONSTANTS ----------------------------------------------------- */

/**
 * Common HTTP status codes
 */
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504,
} as const

/**
 * Default retry status codes
 */
export const DEFAULT_RETRY_STATUS_CODES = [
    HTTP_STATUS.BAD_GATEWAY,
    HTTP_STATUS.SERVICE_UNAVAILABLE,
    HTTP_STATUS.GATEWAY_TIMEOUT,
    HTTP_STATUS.TOO_MANY_REQUESTS,
    408, // Request Timeout
    409, // Conflict
    425, // Too Early
] as const

/**
 * Content types
 */
export const CONTENT_TYPES = {
    JSON: 'application/json',
    FORM_DATA: 'multipart/form-data',
    URL_ENCODED: 'application/x-www-form-urlencoded',
    TEXT: 'text/plain',
    HTML: 'text/html',
} as const

/* ---------- ERROR MESSAGES ------------------------------------------------ */

/**
 * Default error messages
 */
export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
    TIMEOUT_ERROR: 'Request timed out. Please try again.',
    VALIDATION_ERROR: 'Please check your input and try again.',
    UNAUTHORIZED: 'You need to be logged in to perform this action.',
    FORBIDDEN: 'You do not have permission to perform this action.',
    NOT_FOUND: 'The requested resource was not found.',
    SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
    UNKNOWN_ERROR: 'An unknown error occurred.',
} as const

/* ---------- EXPORT ALL TYPES ---------------------------------------------- */

export type {
    HttpMethod as Method,
    PaginationParams as Pagination,
    PaginationMeta as Meta,
    FilterParams as Filters,
}
