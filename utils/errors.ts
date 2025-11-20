export type ErrorCode =
    | 'NETWORK_ERROR'
    | 'AUTH_ERROR'
    | 'FORBIDDEN_ERROR'
    | 'VALIDATION_ERROR'
    | 'API_ERROR'
    | 'TOKEN_EXPIRED'
    | 'REFRESH_FAILED'
    | 'UNKNOWN_ERROR'

export interface AppError {
    code: ErrorCode
    message: string
    details?: any
    statusCode?: number
    timestamp: number
}

export const createAppError = (
    code: ErrorCode,
    message: string,
    details?: any,
    statusCode?: number
): AppError => ({
    code,
    message,
    details,
    statusCode,
    timestamp: Date.now(),
})

export const handleApiError = (error: any): AppError => {
    if (error?.statusCode === 401) {
        return createAppError(
            'AUTH_ERROR',
            error.message || 'Authentication failed',
            error.data,
            401
        )
    }

    if (error?.statusCode === 403) {
        return createAppError('FORBIDDEN_ERROR', 'Access forbidden', error.data, 403)
    }

    if (error?.statusCode === 422) {
        return createAppError('VALIDATION_ERROR', 'Validation failed', error.data, 422)
    }

    if (error?.code === 'ERR_NETWORK') {
        return createAppError('NETWORK_ERROR', 'Network connection failed', error)
    }

    return createAppError('UNKNOWN_ERROR', error?.message || 'An unexpected error occurred', error)
}
