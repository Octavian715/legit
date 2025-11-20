import { defineNuxtPlugin, useCookie, useRuntimeConfig, useRoute } from '#app'
import axios from 'axios'
import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ref, watch } from 'vue'
import type { ApiResponse, ApiError } from '~/types/axios'
import { useUserStore } from '~/stores/user'

const createTokenCookie = (name: string, maxAge?: number) => {
    return useCookie<string | null>(name, {
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: false,
        maxAge: maxAge || (name === 'auth.refresh' ? 60 * 60 * 24 * 30 : 60 * 60 * 24),
    })
}

const clearAllTokens = () => {
    const authToken = createTokenCookie('auth.token')
    const refreshToken = createTokenCookie('auth.refresh')
    const registrationToken = createTokenCookie('registration.token')
    const userCookie = createTokenCookie('user')

    authToken.value = null
    refreshToken.value = null
    registrationToken.value = null
    userCookie.value = null
}

const getActiveToken = (
    isRegistrationRequest = false,
    isRegistrationContinuation = false
): string | null => {
    const authToken = createTokenCookie('auth.token')
    const registrationToken = createTokenCookie('registration.token')

    // Priority logic for token selection
    if (isRegistrationRequest) {
        // Initial registration requests (before email confirmation)
        return registrationToken.value || authToken.value
    }

    if (isRegistrationContinuation) {
        // Registration continuation after email confirmation
        return authToken.value || registrationToken.value
    }

    // Regular authenticated requests - PREFER AUTH TOKEN
    return authToken.value || registrationToken.value
}

const isRegistrationEndpoint = (url?: string): boolean => {
    if (!url) return false
    const endpoints = ['/register/request', '/register/confirm', '/register/resend']
    return endpoints.some((endpoint) => url.includes(endpoint))
}

const isRegistrationContinuationEndpoint = (url?: string): boolean => {
    if (!url) return false
    const endpoints = ['auth/register/confirm']
    return endpoints.some((endpoint) => url.includes(endpoint))
}

const isPublicEndpoint = (url?: string): boolean => {
    if (!url) return false
    const endpoints = ['/login', '/terms', '/status']
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

const handleApiError = (error: AxiosError<ApiError>, t: Function, toast?: any) => {
    const { response } = error

    if (!response && (error.code === 'ERR_NETWORK' || error.message.includes('CORS'))) {
        const message = t('errors.networkError', 'Network connection failed')
        if (toast) toast.error(message)
        return { message, status: 0 }
    }

    if (!response) {
        const message = t('errors.unknownError', 'An unexpected error occurred')
        return { message, status: 0 }
    }

    const { status, data: errorData } = response
    let errorMessage = errorData?.message || t('errors.default', 'An error occurred')

    const statusMessages: Record<number, string> = {
        400: t('errors.badRequest', 'Invalid request'),
        401: t('errors.unauthorized', 'Authentication required'),
        403: t('errors.forbidden', 'Access denied'),
        404: t('errors.notFound', 'Resource not found'),
        422: t('errors.validationError', 'Validation failed'),
        429: t('errors.tooManyRequests', 'Too many requests'),
        500: t('errors.serverError', 'Server error'),
    }

    errorMessage = statusMessages[status] || errorMessage

    if (toast) {
        toast.error(errorMessage)

        if (status === 422 && errorData?.errors) {
            const validationErrors = errorData.errors
            if (typeof validationErrors === 'object' && !Array.isArray(validationErrors)) {
                Object.entries(validationErrors).forEach(([field, messages]) => {
                    const errorList = Array.isArray(messages) ? messages : [messages]
                    errorList.forEach((msg: string) => toast.error(msg))
                })
            }
        }
    }

    return { message: errorMessage, status }
}

export default defineNuxtPlugin((nuxtApp) => {
    const userStore = useUserStore()
    const {
        public: { apiBaseURL },
    } = useRuntimeConfig()
    const { t } = nuxtApp.$i18n
    const toast = process.client ? nuxtApp.$toast : undefined
    const currentLocale = nuxtApp.$i18n.locale
    const i18n = nuxtApp.$i18n

    // Create axios instance
    const api: AxiosInstance = axios.create({
        baseURL: apiBaseURL,
        timeout: 30000,
        withCredentials: false,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'Accept-Language': currentLocale.value,
        },
    })

    // Keep Accept-Language header in sync with locale changes
    watch(i18n.locale, (newLocale) => {
        api.defaults.headers.common['Accept-Language'] = newLocale
    })

    if (process.server) {
        const forward = useRequestHeaders(['cookie', 'user-agent', 'accept-language'])
        api.defaults.headers.common = {
            ...api.defaults.headers.common,
            ...forward,
        }
    }

    api.interceptors.request.use((config) => {
        const isRegistrationReq = isRegistrationEndpoint(config.url)
        const isRegistrationContinuation = isRegistrationContinuationEndpoint(config.url)
        const isPublicReq = isPublicEndpoint(config.url)

        //Add token for ALL non-public requests
        if (!isPublicReq && !config.url?.includes('/login')) {
            const token = getActiveToken(isRegistrationReq, isRegistrationContinuation)

            if (token) {
                config.headers = {
                    ...config.headers,
                    Authorization: `Bearer ${token}`,
                }
            } else {
                console.warn('[Auth] âŒ No token available for request:', config.url)
            }
        }

        return config
    })

    // Response interceptor with refresh token logic
    const refreshing = ref<Promise<string> | null>(null)

    const refreshAuthToken = async (): Promise<string> => {
        const refreshToken = createTokenCookie('auth.refresh')

        if (!refreshToken.value) {
            throw new Error('No refresh token available')
        }

        const httpApiBaseURL = apiBaseURL.replace('https://', 'http://')

        try {
            const { data } = await axios.post<{ token: string; refresh?: string }>(
                `${httpApiBaseURL}/auth/refresh`,
                { refresh_token: refreshToken.value }
            )

            // Update tokens
            const authToken = createTokenCookie('auth.token')
            authToken.value = data.token

            if (data.refresh) {
                const newRefreshToken = createTokenCookie('auth.refresh')
                newRefreshToken.value = data.refresh
            }

            // Clear registration token when we have fresh auth token
            const registrationToken = createTokenCookie('registration.token')
            registrationToken.value = null

            return data.token
        } catch (error) {
            console.error('[Auth] Token refresh failed:', error)
            throw error
        }
    }

    api.interceptors.response.use(
        (response: AxiosResponse<ApiResponse<any>>) => {
            const url = response.config.url || ''

            if (url.includes('/auth/register/confirm') && response.data?.token) {
                const authToken = createTokenCookie('auth.token')
                authToken.value = response.data.token

                // Clear registration token
                const registrationToken = createTokenCookie('registration.token')
                registrationToken.value = null
            }

            // Handle login
            if (url.includes('/login') && response.data?.token) {
                const authToken = createTokenCookie('auth.token')
                authToken.value = response.data.token

                // if (response.data?.refresh) {
                //     const refreshToken = createTokenCookie('auth.refresh')
                //     refreshToken.value = response.data.refresh
                // }
            }

            return response
        },
        async (error: AxiosError<ApiError>) => {
            const { response, config } = error
            const original = config as AxiosRequestConfig & { _retry?: boolean }

            // Don't handle logout errors
            if (original?.url?.includes('/auth/logout')) {
                return Promise.reject(error)
            }

            // Handle token expiration with refresh
            if (
                response?.status === 401 &&
                error.response?.data?.message?.toLowerCase().includes('token expired') &&
                !original._retry &&
                !isRegistrationEndpoint(original?.url)
            ) {
                original._retry = true

                try {
                    if (!refreshing.value) {
                        refreshing.value = refreshAuthToken()
                    }

                    const newToken = await refreshing.value
                    refreshing.value = null

                    if (newToken && original) {
                        original.headers = {
                            ...original.headers,
                            Authorization: `Bearer ${newToken}`,
                        }
                        return api(original)
                    }
                } catch (refreshError) {
                    refreshing.value = null
                    console.error('[Auth] Token refresh failed, logging out user')

                    const userStore = useUserStore()
                    await userStore.logoutExpired(useRoute().fullPath)

                    return Promise.reject(error)
                }
            }

            // Handle other 401s
            if (
                response?.status === 401 &&
                !original?.url?.includes('/login') &&
                !original?.url?.includes('/logout')
            ) {
                await userStore.logoutExpired(useRoute().fullPath)
            }

            // Retry for server errors
            if ([502, 503, 504].includes(response?.status ?? 0)) {
                return retryWithBackoff(() => api(original))
            }

            // Handle and display errors
            if (process.client && toast && response) {
                const errorDetails = handleApiError(error, t, toast)
                return Promise.reject({ ...error, errorDetails })
            }

            return Promise.reject(error)
        }
    )

    // Provide API instance and helpers
    nuxtApp.provide('api', api)
    nuxtApp.provide('clearAllTokens', clearAllTokens)
    nuxtApp.provide('getActiveToken', getActiveToken)
})
