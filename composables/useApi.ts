import type {
    ApiError,
    RequestOptions,
    ApiResponse,
    BatchRequest,
    BatchResponse,
} from '~/types/api'

interface CacheItem {
    data: any
    timestamp: number
    ttl: number
}

export const useApi = () => {
    const config = useRuntimeConfig()
    const { $i18n } = useNuxtApp()

    const cache = new Map<string, CacheItem>()
    const defaultCacheTTL = 5 * 60 * 1000

    const createTokenCookie = (name: string, maxAge?: number) => {
        return useCookie<string | null>(name, {
            path: '/',
            sameSite: 'lax',
            secure: import.meta.server
                ? false
                : import.meta.client && window.location.protocol === 'https:',
            httpOnly: false,
            maxAge: maxAge || (name === 'auth.refresh' ? 60 * 60 * 24 * 30 : 60 * 60 * 24),
        })
    }

    const clearAllTokens = () => {
        const authToken = createTokenCookie('auth.token')
        const refreshToken = createTokenCookie('auth.refresh')
        const registrationToken = createTokenCookie('registration.token')

        authToken.value = null
        refreshToken.value = null
        registrationToken.value = null
    }

    const getActiveToken = (
        isRegistrationRequest = false,
        isRegistrationContinuation = false
    ): string | null => {
        const authToken = createTokenCookie('auth.token')
        const registrationToken = createTokenCookie('registration.token')

        if (isRegistrationRequest) {
            return registrationToken.value || authToken.value
        }

        if (isRegistrationContinuation) {
            return authToken.value || registrationToken.value
        }

        return authToken.value || registrationToken.value
    }

    const getCacheKey = (url: string, options?: any): string => {
        const cacheData = {
            url,
            method: options?.method || 'GET',
            params: options?.params || {},
            body: options?.method === 'GET' ? undefined : options?.body,
        }
        return btoa(JSON.stringify(cacheData, Object.keys(cacheData).sort()))
    }

    const getFromCache = <T>(key: string): T | null => {
        const cached = cache.get(key)
        if (!cached) return null

        if (Date.now() - cached.timestamp > cached.ttl) {
            cache.delete(key)
            return null
        }

        return cached.data as T
    }

    const setCache = <T>(key: string, data: T, ttl = defaultCacheTTL): void => {
        cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl,
        })
    }

    const clearCache = (): void => {
        cache.clear()
    }

    const clearCacheByPattern = (pattern: string): void => {
        for (const key of cache.keys()) {
            try {
                const decoded = atob(key)
                if (decoded.includes(pattern)) {
                    cache.delete(key)
                }
            } catch {
                continue
            }
        }
    }

    const isRegistrationEndpoint = (url?: string): boolean => {
        if (!url) return false
        const endpoints = [
            '/auth/register/request',
            '/auth/register/confirm',
            '/auth/register/resend',
        ]
        return endpoints.some((endpoint) => url.includes(endpoint))
    }

    const isRegistrationContinuationEndpoint = (url?: string): boolean => {
        if (!url) return false
        const endpoints = ['/user/complete-register']
        return endpoints.some((endpoint) => url.includes(endpoint))
    }

    const isPublicEndpoint = (url?: string): boolean => {
        if (!url) return false
        const endpoints = ['/login', '/terms', '/status', '/countries', '/business-types']
        return endpoints.some((endpoint) => url.includes(endpoint))
    }

    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    const retryWithBackoff = async <T>(
        fn: () => Promise<T>,
        retries = 3,
        baseDelay = 500
    ): Promise<T> => {
        try {
            return await fn()
        } catch (error) {
            if (retries <= 0) throw error
            const delay = baseDelay * Math.pow(2, 3 - retries) + Math.random() * 100
            await wait(delay)
            return retryWithBackoff(fn, retries - 1, baseDelay)
        }
    }

    const refreshing = ref<Promise<string> | null>(null)

    const refreshAuthToken = async (): Promise<string> => {
        const refreshToken = createTokenCookie('auth.refresh')

        if (!refreshToken.value) {
            throw new Error('No refresh token available')
        }

        try {
            const response = await $fetch<{ token: string; refresh?: string }>('/auth/refresh', {
                baseURL: config.public.apiBase,
                method: 'POST',
                body: { refresh_token: refreshToken.value },
            })

            const authToken = createTokenCookie('auth.token')
            authToken.value = response.token

            if (response.refresh) {
                const newRefreshToken = createTokenCookie('auth.refresh')
                newRefreshToken.value = response.refresh
            }

            const registrationToken = createTokenCookie('registration.token')
            registrationToken.value = null

            return response.token
        } catch (error) {
            console.error('[Auth] Token refresh failed:', error)
            clearAllTokens()
            throw error
        }
    }

    const createFetch = () => {
        return $fetch.create({
            baseURL: config.public.apiBaseURL,
            retry: {
                limit: 2,
                delay: 1000,
                statusCodes: [408, 425, 500, 502, 503, 504],
            },
            onRequest({ options, request }) {
                const url = typeof request === 'string' ? request : request.toString()
                const isRegistrationReq = isRegistrationEndpoint(url)
                const isRegistrationContinuation = isRegistrationContinuationEndpoint(url)
                const isPublicReq = isPublicEndpoint(url)

                const headers: HeadersInit = {}

                if (!options.body || !(options.body instanceof FormData)) {
                    if (!options.responseType || options.responseType === 'json') {
                        headers['Accept'] = 'application/json'
                        headers['Content-Type'] = 'application/json'
                    }
                }

                if (options.responseType === 'blob') {
                    headers['Accept'] = 'application/pdf'
                }

                headers['Accept-Language'] = $i18n.locale.value

                if (import.meta.server) {
                    const requestHeaders = useRequestHeaders([
                        'cookie',
                        'user-agent',
                        'accept-language',
                    ])
                    if (requestHeaders.cookie) {
                        headers['Cookie'] = requestHeaders.cookie
                    }
                    if (requestHeaders['user-agent']) {
                        headers['User-Agent'] = requestHeaders['user-agent']
                    }
                }

                if (!isPublicReq && !url?.includes('/login')) {
                    const token = getActiveToken(isRegistrationReq, isRegistrationContinuation)
                    if (token) {
                        headers['Authorization'] = `Bearer ${token}`
                    }
                }

                options.headers = {
                    ...options.headers,
                    ...headers,
                }
            },
            async onResponseError({ response, request, options }) {
                const url = typeof request === 'string' ? request : request.toString()
                const error: ApiError = {
                    statusCode: response.status,
                    statusMessage: response.statusText,
                    data: response._data,
                    errors: response._data?.errors,
                }

                if (url?.includes('/auth/logout')) {
                    return
                }

                if (
                    response.status === 401 &&
                    response._data?.message?.toLowerCase().includes('token expired') &&
                    !isRegistrationEndpoint(url)
                ) {
                    const original = options as any
                    if (!original._retry) {
                        original._retry = true

                        try {
                            if (!refreshing.value) {
                                refreshing.value = refreshAuthToken()
                            }

                            const newToken = await refreshing.value
                            refreshing.value = null

                            if (newToken) {
                                original.headers = {
                                    ...original.headers,
                                    Authorization: `Bearer ${newToken}`,
                                }
                                return await $fetch(url, original)
                            }
                        } catch (refreshError) {
                            refreshing.value = null
                            clearAllTokens()
                            if (import.meta.client) {
                                await navigateTo('/login')
                            }
                        }
                    }
                }

                switch (response.status) {
                    case 401:
                        if (import.meta.client && !url?.includes('/login')) {
                            clearAllTokens()
                            await navigateTo('/login')
                        }
                        break
                    case 403:
                        throw createError({
                            statusCode: 403,
                            statusMessage: $i18n.t('errors.forbidden'),
                        })
                    case 422:
                        throw createError({
                            statusCode: 422,
                            statusMessage: $i18n.t('errors.validationError'),
                            data: error.data,
                        })
                    case 429:
                        console.warn('[API] Rate limit reached for:', url)
                        throw createError({
                            statusCode: 429,
                            statusMessage: $i18n.t('errors.tooManyRequests'),
                            data: error.data,
                        })
                    default:
                        if ([502, 503, 504].includes(response.status)) {
                            return retryWithBackoff(() => $fetch(url, options))
                        }
                        throw error
                }
            },
            onResponse({ response, request }) {
                const url = typeof request === 'string' ? request : request.toString()

                if (url?.includes('/auth/register/confirm') && response._data?.token) {
                    const authToken = createTokenCookie('auth.token')
                    authToken.value = response._data.token

                    const registrationToken = createTokenCookie('registration.token')
                    registrationToken.value = null
                }

                if (url?.includes('/login') && response._data?.token) {
                    const authToken = createTokenCookie('auth.token')
                    authToken.value = response._data.token

                    if (response._data?.refresh) {
                        const refreshToken = createTokenCookie('auth.refresh')
                        refreshToken.value = response._data.refresh
                    }
                }
            },
        })
    }

    const api = createFetch()

    const get = <T = any>(
        url: string,
        options: RequestOptions & { cache?: boolean; cacheTTL?: number } = {}
    ) => {
        const { cache: useCache = false, cacheTTL, responseType, ...requestOptions } = options

        if (responseType === 'blob') {
            return api<Blob>(url, {
                method: 'GET',
                responseType: 'blob',
                ...requestOptions,
            })
        }

        if (useCache) {
            const cacheKey = getCacheKey(url, { method: 'GET', ...requestOptions })
            const cached = getFromCache<ApiResponse<T>>(cacheKey)
            if (cached) {
                return Promise.resolve(cached)
            }

            return api<ApiResponse<T>>(url, {
                method: 'GET',
                ...requestOptions,
            }).then((result) => {
                setCache(cacheKey, result, cacheTTL)
                return result
            })
        }

        return api<ApiResponse<T>>(url, {
            method: 'GET',
            ...requestOptions,
        })
    }

    const post = <T = any>(url: string, body?: any, options?: RequestOptions) => {
        clearCacheByPattern(url.split('?')[0])

        if (options?.responseType === 'blob') {
            return api<Blob>(url, {
                method: 'POST',
                body,
                responseType: 'blob',
                ...options,
            })
        }

        return api<ApiResponse<T>>(url, {
            method: 'POST',
            body,
            ...options,
        })
    }

    const put = <T = any>(url: string, body?: any, options?: RequestOptions) => {
        clearCacheByPattern(url.split('?')[0])

        return api<ApiResponse<T>>(url, {
            method: 'PUT',
            body,
            ...options,
        })
    }

    const patch = <T = any>(url: string, body?: any, options?: RequestOptions) => {
        clearCacheByPattern(url.split('?')[0])

        return api<ApiResponse<T>>(url, {
            method: 'PATCH',
            body,
            ...options,
        })
    }

    const del = <T = any>(url: string, options?: RequestOptions) => {
        clearCacheByPattern(url.split('?')[0])

        return api<ApiResponse<T>>(url, {
            method: 'DELETE',
            ...options,
        })
    }

    const postFormData = <T = any>(url: string, formData: FormData, options?: RequestOptions) => {
        clearCacheByPattern(url.split('?')[0])

        return api<ApiResponse<T>>(url, {
            method: 'POST',
            body: formData,
            ...options,
        })
    }

    const putFormData = <T = any>(url: string, formData: FormData, options?: RequestOptions) => {
        clearCacheByPattern(url.split('?')[0])

        return api<ApiResponse<T>>(url, {
            method: 'PUT',
            body: formData,
            ...options,
        })
    }

    const batch = async (requests: BatchRequest[]): Promise<BatchResponse[]> => {
        const results = await Promise.allSettled(
            requests.map(async (req) => {
                try {
                    const response = await api(req.url, {
                        method: req.method,
                        body: req.body,
                        headers: req.headers,
                    })
                    return {
                        id: req.id,
                        status: 200,
                        data: response,
                    }
                } catch (error: any) {
                    return {
                        id: req.id,
                        status: error.statusCode || 500,
                        data: null,
                        error: {
                            statusCode: error.statusCode || 500,
                            statusMessage: error.statusMessage || 'Request failed',
                            data: error.data,
                        },
                    }
                }
            })
        )

        return results.map((result) => {
            if (result.status === 'fulfilled') {
                return result.value
            }
            return {
                id: '',
                status: 500,
                data: null,
                error: {
                    statusCode: 500,
                    statusMessage: 'Request failed',
                    data: null,
                },
            }
        })
    }

    return {
        get,
        post,
        put,
        patch,
        delete: del,
        postFormData,
        putFormData,
        batch,
        clearAllTokens,
        getActiveToken,
        refreshAuthToken,
        clearCache,
        clearCacheByPattern,
    }
}
