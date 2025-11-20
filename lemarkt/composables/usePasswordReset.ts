// composables/usePasswordReset.ts
import { ref } from 'vue'

interface PasswordResetState {
    email: string | null
    token: string | null
    isEmailSent: boolean
}

export const usePasswordReset = () => {
    const { $api } = useNuxtApp()

    // State management
    const isLoading = ref(false)
    const error = ref<any>(null)

    // Password reset state
    const passwordResetState = useState<PasswordResetState>('password-reset-state', () => ({
        email: null,
        token: null,
        isEmailSent: false,
    }))

    // Track last request time to prevent rapid successive calls
    const lastRequestTime = ref<number>(0)
    const MIN_REQUEST_INTERVAL = 3000 // 3 seconds between requests

    // Clear error
    const clearError = () => {
        error.value = null
    }

    // Request password reset (sends email with reset link)
    const requestPasswordReset = async (email: string): Promise<boolean> => {
        // Prevent rapid successive requests
        const now = Date.now()
        if (now - lastRequestTime.value < MIN_REQUEST_INTERVAL) {
            console.warn('Password reset request throttled. Please wait before trying again.')
            error.value = {
                message: 'Please wait a few seconds before trying again.',
                code: 'THROTTLED',
            }
            return false
        }

        // Prevent duplicate requests if already loading
        if (isLoading.value) {
            console.warn('Password reset request already in progress')
            return false
        }

        try {
            isLoading.value = true
            clearError()
            lastRequestTime.value = now

            const response = await $api.post('/auth/password/forgot', {
                email,
            })

            if (response.data?.success) {
                // Store email and mark as sent
                passwordResetState.value = {
                    email,
                    token: response.data?.temp_token || null,
                    isEmailSent: true,
                }

                return true
            }

            return false
        } catch (err: any) {
            console.error('Password reset request error:', err)

            // Handle 429 rate limit error specifically
            if (err.response?.status === 429) {
                error.value = {
                    message: 'Too many requests. Please wait a few minutes before trying again.',
                    code: 'RATE_LIMIT_EXCEEDED',
                    retryAfter: err.response?.headers?.['retry-after'] || 60,
                }
            } else {
                error.value = err
            }

            return false
        } finally {
            isLoading.value = false
        }
    }

    // Reset password using token from email link
    const resetPassword = async (token: string, newPassword: string): Promise<boolean> => {
        // Prevent duplicate requests if already loading
        if (isLoading.value) {
            console.warn('Password reset already in progress')
            return false
        }

        try {
            isLoading.value = true
            clearError()

            const response = await $api.post('/auth/password/reset', {
                token,
                password: newPassword,
                password_confirmation: newPassword,
            })

            if (response.data?.success) {
                // Clear the password reset state
                passwordResetState.value = {
                    email: null,
                    token: null,
                    isEmailSent: false,
                }

                return true
            }

            return false
        } catch (err: any) {
            console.error('Password reset error:', err)

            // Handle 429 rate limit error
            if (err.response?.status === 429) {
                error.value = {
                    message: 'Too many requests. Please wait before trying again.',
                    code: 'RATE_LIMIT_EXCEEDED',
                }
            } else {
                error.value = err
            }

            return false
        } finally {
            isLoading.value = false
        }
    }

    // Verify if a reset token is valid (optional check)
    const verifyResetToken = async (token: string): Promise<boolean> => {
        try {
            const response = await $api.post('/auth/password/verify-token', {
                token,
            })

            return response.data?.valid || false
        } catch (err: any) {
            console.error('Token verification error:', err)
            return false
        }
    }

    // Clear password reset state
    const clearPasswordResetState = () => {
        passwordResetState.value = {
            email: null,
            token: null,
            isEmailSent: false,
        }
        error.value = null
        lastRequestTime.value = 0
    }

    return {
        // State
        isLoading,
        error,
        passwordResetState,

        // Methods
        requestPasswordReset,
        resetPassword,
        verifyResetToken,
        clearError,
        clearPasswordResetState,
    }
}
