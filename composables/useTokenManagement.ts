// composables/useTokenManagement.ts
export const useTokenManagement = () => {
    // Cookie references
    const authTokenCookie = useCookie<string | null>('auth.token', {
        path: '/',
        sameSite: 'lax',
        secure: process.client,
    })

    const refreshTokenCookie = useCookie<string | null>('auth.refresh', {
        path: '/',
        sameSite: 'lax',
        secure: process.client,
        maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    const registrationTokenCookie = useCookie<string | null>('registration.token', {
        path: '/',
        sameSite: 'lax',
        secure: process.client,
        maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    // Token state getters
    const hasAuthToken = computed(() => !!authTokenCookie.value)
    const hasRegistrationToken = computed(() => !!registrationTokenCookie.value)
    const hasRefreshToken = computed(() => !!refreshTokenCookie.value)

    // Token management methods
    const setAuthTokens = (accessToken: string, refreshToken?: string) => {
        authTokenCookie.value = accessToken
        if (refreshToken) {
            refreshTokenCookie.value = refreshToken
        }

        // Clear registration token when setting auth tokens
        registrationTokenCookie.value = null
    }

    const setRegistrationToken = (token: string) => {
        registrationTokenCookie.value = token
    }

    const clearAllTokens = () => {
        authTokenCookie.value = null
        refreshTokenCookie.value = null
        registrationTokenCookie.value = null
    }

    const clearAuthTokens = () => {
        authTokenCookie.value = null
        refreshTokenCookie.value = null
        // Keep registration token if exists
    }

    const clearRegistrationToken = () => {
        registrationTokenCookie.value = null
    }

    // Get appropriate token for request
    const getTokenForRequest = (
        isInitialRegistration = false,
        isRegistrationContinuation = false
    ): string | null => {
        // For initial registration (before login)
        if (isInitialRegistration && registrationTokenCookie.value) {
            return registrationTokenCookie.value
        }

        // For registration continuation after login
        if (isRegistrationContinuation && authTokenCookie.value) {
            return authTokenCookie.value
        }

        // For regular authenticated requests
        if (!isInitialRegistration && !isRegistrationContinuation && authTokenCookie.value) {
            return authTokenCookie.value
        }

        // Fallback to any available token
        return authTokenCookie.value || registrationTokenCookie.value
    }

    // Token validation
    const isTokenExpired = (token: string): boolean => {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]))
            const currentTime = Math.floor(Date.now() / 1000)
            return payload.exp < currentTime
        } catch {
            return true
        }
    }

    const validateCurrentTokens = () => {
        const authToken = authTokenCookie.value
        const registrationToken = registrationTokenCookie.value

        const result = {
            authToken: {
                exists: !!authToken,
                valid: authToken ? !isTokenExpired(authToken) : false,
            },
            registrationToken: {
                exists: !!registrationToken,
                valid: registrationToken ? !isTokenExpired(registrationToken) : false,
            },
        }

        return result
    }

    // Cleanup expired tokens
    const cleanupExpiredTokens = () => {
        const validation = validateCurrentTokens()

        if (validation.authToken.exists && !validation.authToken.valid) {
            clearAuthTokens()
        }

        if (validation.registrationToken.exists && !validation.registrationToken.valid) {
            clearRegistrationToken()
        }
    }

    // Token transition (from registration to auth)
    const transitionToAuthTokens = (accessToken: string, refreshToken?: string) => {
        // Clear registration token and set auth tokens
        clearRegistrationToken()
        setAuthTokens(accessToken, refreshToken)
    }

    // Session validation for registration
    const hasValidRegistrationSession = (): boolean => {
        const userStore = useUserStore()

        // Either authenticated user OR valid registration token
        return userStore.isAuthenticated || !!registrationTokenCookie.value
    }

    return {
        // State
        hasAuthToken,
        hasRegistrationToken,
        hasRefreshToken,

        // Auth token management
        setAuthTokens,
        clearAuthTokens,

        // Registration token management
        setRegistrationToken,
        clearRegistrationToken,

        // General token management
        clearAllTokens,
        getTokenForRequest,

        // Token validation
        isTokenExpired,
        validateCurrentTokens,
        cleanupExpiredTokens,

        // Token transition
        transitionToAuthTokens,

        // Session validation
        hasValidRegistrationSession,
    }
}
