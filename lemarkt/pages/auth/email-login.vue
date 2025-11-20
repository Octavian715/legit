<template>
    <AuthContainer class="bg-gray-150" :full-height="true" content-class="max-w-md mx-auto">
        <div class="flex flex-col items-center justify-center min-h-[400px]">
            <!-- Loading State -->
            <div v-if="verificationState === 'verifying'" class="text-center">
                <div class="mb-6">
                    <div
                        class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 animate-pulse"
                    >
                        <svg
                            class="w-8 h-8 text-red-500 animate-spin"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                class="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                stroke-width="4"
                            ></circle>
                            <path
                                class="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                        </svg>
                    </div>
                </div>
                <h2 class="text-h6 font-semibold text-gray-950 mb-2">
                    {{ $t('auth.verifyingLogin', 'Verifying your login...') }}
                </h2>
                <p class="text-body2 text-gray-700">
                    {{
                        $t(
                            'auth.pleaseWaitVerifying',
                            'Please wait while we verify your login link'
                        )
                    }}
                </p>
            </div>

            <!-- Success State -->
            <div v-else-if="verificationState === 'success'" class="text-center">
                <div class="mb-6">
                    <div
                        class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100"
                    >
                        <svg
                            class="w-8 h-8 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M5 13l4 4L19 7"
                            ></path>
                        </svg>
                    </div>
                </div>
                <h2 class="text-h6 font-semibold text-gray-950 mb-2">
                    {{ $t('auth.loginSuccess', 'Welcome back!') }}
                </h2>
                <p class="text-body2 text-gray-700 mb-6">
                    {{ $t('auth.redirectingDashboard', 'Redirecting to your dashboard...') }}
                </p>
                <div class="flex items-center justify-center gap-2 text-caption text-gray-600">
                    <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle
                            class="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            stroke-width="4"
                        ></circle>
                        <path
                            class="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        ></path>
                    </svg>
                    <span>{{ countdown }}s</span>
                </div>
            </div>

            <!-- Error State -->
            <div v-else-if="verificationState === 'error'" class="text-center">
                <div class="mb-6">
                    <div
                        class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100"
                    >
                        <svg
                            class="w-8 h-8 text-red-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M6 18L18 6M6 6l12 12"
                            ></path>
                        </svg>
                    </div>
                </div>
                <h2 class="text-h6 font-semibold text-gray-950 mb-2">
                    {{ errorTitle }}
                </h2>
                <p class="text-body2 text-gray-700 mb-6">
                    {{ errorMessage }}
                </p>
                <div class="flex flex-col gap-3">
                    <Button
                        v-if="canRetry"
                        color="red"
                        size="lg"
                        class="w-full"
                        :label="$t('auth.tryAgain', 'Try Again')"
                        @click="handleRetry"
                    />
                    <NuxtLink :to="localePath('/login')" class="block w-full">
                        <Button
                            color="gray"
                            size="lg"
                            class="w-full"
                            :label="$t('auth.backToLogin', 'Back to Login')"
                        />
                    </NuxtLink>
                </div>
            </div>

            <!-- Invalid Token State (No token provided) -->
            <div v-else class="text-center">
                <div class="mb-6">
                    <div
                        class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100"
                    >
                        <svg
                            class="w-8 h-8 text-orange-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            ></path>
                        </svg>
                    </div>
                </div>
                <h2 class="text-h6 font-semibold text-gray-950 mb-2">
                    {{ $t('auth.invalidLink', 'Invalid Login Link') }}
                </h2>
                <p class="text-body2 text-gray-700 mb-6">
                    {{
                        $t(
                            'auth.invalidLinkDescription',
                            'The login link is invalid or incomplete. Please request a new one.'
                        )
                    }}
                </p>
                <NuxtLink :to="localePath('/login')" class="block w-full">
                    <Button
                        color="red"
                        size="lg"
                        class="w-full"
                        :label="$t('auth.backToLogin', 'Back to Login')"
                    />
                </NuxtLink>
            </div>
        </div>
    </AuthContainer>
</template>

<script setup lang="ts">
    import { ref, onMounted, computed } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useRoute, useRouter, useLocalePath, navigateTo } from '#imports'
    import { useToastNotification } from '~/composables/useToastNotification'

    interface BackendError {
        message?: string
        errors?: Record<string, string | string[]>
    }

    definePageMeta({
        middleware: 'guest',
        layout: 'auth',
    })

    const route = useRoute()
    const router = useRouter()
    const localePath = useLocalePath()
    const { t } = useI18n()
    const toast = useToastNotification()
    const userStore = useUserStore()

    type VerificationState = 'idle' | 'verifying' | 'success' | 'error'

    const verificationState = ref<VerificationState>('idle')
    const errorTitle = ref('')
    const errorMessage = ref('')
    const canRetry = ref(false)
    const countdown = ref(2)

    const token = computed(() => route.query.token as string | undefined)

    const verifyToken = async (tokenValue: string) => {
        verificationState.value = 'verifying'

        try {
            await userStore.verifyEmailLogin(tokenValue)

            verificationState.value = 'success'
            toast.success(t('auth.loginSuccess'))

            // Start countdown
            const countdownInterval = setInterval(() => {
                countdown.value--
                if (countdown.value <= 0) {
                    clearInterval(countdownInterval)
                    redirectToDashboard()
                }
            }, 1000)

            // Also redirect after 3 seconds
            setTimeout(() => {
                redirectToDashboard()
            }, 3000)
        } catch (error: any) {
            handleVerificationError(error)
        }
    }

    const handleVerificationError = (error: any) => {
        verificationState.value = 'error'

        const status = error.response?.status || error.statusCode
        const responseData: BackendError | undefined = error.response?.data || error.data

        switch (status) {
            case 400:
                errorTitle.value = t('auth.invalidToken', 'Invalid Token')
                errorMessage.value = t(
                    'auth.invalidOrUsedToken',
                    'This login link is invalid or has already been used. Please request a new one.'
                )
                canRetry.value = false
                break

            case 410:
                errorTitle.value = t('auth.tokenExpired', 'Link Expired')
                errorMessage.value = t(
                    'auth.tokenExpiredDescription',
                    'This login link has expired. Please request a new one from the login page.'
                )
                canRetry.value = false
                break

            case 422:
                errorTitle.value = t('auth.validationError', 'Validation Error')
                errorMessage.value =
                    responseData?.message ||
                    t(
                        'auth.tokenValidationFailed',
                        'The login link format is invalid. Please request a new one.'
                    )
                canRetry.value = false
                break

            case 429:
                errorTitle.value = t('auth.tooManyAttempts', 'Too Many Attempts')
                errorMessage.value = t(
                    'auth.tooManyVerificationAttempts',
                    'Too many verification attempts. Please wait a few minutes and request a new link.'
                )
                canRetry.value = false
                break

            case 500:
            case 502:
            case 503:
                errorTitle.value = t('auth.serverError', 'Server Error')
                errorMessage.value = t(
                    'auth.serverErrorDescription',
                    'A server error occurred. Please try again in a few moments.'
                )
                canRetry.value = true
                break

            default:
                errorTitle.value = t('auth.verificationFailed', 'Verification Failed')
                errorMessage.value =
                    responseData?.message ||
                    t(
                        'auth.verificationFailedDescription',
                        'We could not verify your login link. Please try again or request a new one.'
                    )
                canRetry.value = true
        }

        // Show error toast
        toast.error(errorMessage.value, errorTitle.value)
    }

    const handleRetry = () => {
        if (token.value) {
            verifyToken(token.value)
        }
    }

    const redirectToDashboard = () => {
        if (!userStore.isRegistrationComplete) {
            const registrationPath = userStore.getRegistrationRedirectPath()
            navigateTo(registrationPath, { replace: true })
            return
        }

        if (userStore.isVerified) {
            // Check if there's a 'next' parameter in the URL
            const nextParam = route.query.next as string | undefined

            if (nextParam && isValidRedirectUrl(nextParam)) {
                window.location.href = nextParam
                return
            }

            // Default redirect based on role
            window.location.href = '/'
        } else if (userStore.isPending) {
            toast.warning(t('auth.verificationPending'))
            navigateTo(localePath('/'), { replace: true })
        } else if (userStore.isRejected) {
            toast.error(t('auth.verificationRejected'))
            navigateTo(localePath('/'), { replace: true })
        } else {
            toast.info(t('auth.verificationRequired'))
            navigateTo(localePath('/'), { replace: true })
        }
    }

    const isValidRedirectUrl = (url: string): boolean => {
        try {
            if (url.startsWith('/')) {
                const blockedPaths = ['/login', '/register', '/auth/']
                return !blockedPaths.some((path) => url.startsWith(path))
            }
            return false
        } catch {
            return false
        }
    }

    onMounted(() => {
        const tokenValue = token.value

        if (!tokenValue) {
            // No token provided - show invalid link state
            verificationState.value = 'idle'
            return
        }

        // Verify token
        verifyToken(tokenValue)
    })
</script>
