// types/page.ts
export interface PageState {
    isLoading: boolean
    isInitialLoad: boolean
    isRefreshing: boolean
    error: ApiError | null
    lastUpdated: Date | null
    retryCount: number
}

export interface PageMeta {
    title?: string
    description?: string
    requiresAuth?: boolean
    cacheKey?: string
    refreshInterval?: number
    maxRetries?: number
    skeleton?: boolean
}

export interface ApiError {
    message: string
    errors?: Record<string, string[] | string> | string[]
}
