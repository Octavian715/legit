<template>
    <AuthContainer
        class="bg-gray-150"
        :full-height="true"
        content-class="max-w-2xl mx-auto flex flex-col justify-center"
        class-container="w-full"
    >
        <!-- Loading State -->
        <div v-if="isVerifying || isCheckingAuth" class="text-center px-6 py-8">
            <div class="space-y-4">
                <div class="flex justify-center">
                    <span class="loader"></span>
                </div>
                <h2 class="text-subtitle1 font-bold text-gray-950">
                    {{ getLoadingMessage() }}
                </h2>
                <p class="text-subtitle2 text-gray-700">
                    {{ getLoadingSubMessage() }}
                </p>
            </div>
        </div>

        <!-- Success State (Development/Staging - Original Flow) -->
        <div
            v-else-if="isVerified && !verificationError && !isProduction"
            class="text-center px-6 py-8"
        >
            <div class="space-y-6">
                <div class="flex justify-center mb-4">
                    <div
                        class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center"
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
                            />
                        </svg>
                    </div>
                </div>

                <div class="space-y-2">
                    <h2 class="text-subtitle1 font-bold text-gray-950">
                        {{ $t('register.emailVerified', 'Email confirmed!') }}
                    </h2>
                    <p class="text-subtitle2 text-gray-700">
                        {{
                            $t(
                                'register.readyToContinue',
                                'Thanks for verifying your email address – your account is now active.'
                            )
                        }}
                    </p>
                    <p class="text-subtitle2 text-gray-700">
                        {{
                            $t(
                                'register.completeProfile',
                                'To start using the platform, please complete your profile setup.'
                            )
                        }}
                    </p>
                    <p class="text-subtitle2 text-gray-700">
                        {{ $t('register.takeMinute', 'This will only take a minute') }}
                    </p>
                </div>

                <Button
                    variant="filled"
                    color="red"
                    size="lg"
                    :label="$t('register.continueRegistration', 'Continue Registration')"
                    class="w-full max-w-xs mx-auto"
                    :loading="isNavigating"
                    :disabled="isNavigating"
                    @click="handleContinue"
                />
            </div>
        </div>

        <!-- Success State (Production - Modal will appear) -->
        <div
            v-else-if="isVerified && !verificationError && isProduction"
            class="text-center px-6 py-8"
        >
            <div class="space-y-4">
                <div class="flex justify-center">
                    <div
                        class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center"
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
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                </div>
                <h2 class="text-subtitle1 font-bold text-gray-950">
                    {{ $t('register.verificationComplete', 'Verification Complete') }}
                </h2>
                <p class="text-subtitle2 text-gray-700">
                    {{ $t('register.preparingNextStep', 'Preparing next steps...') }}
                </p>
            </div>
        </div>

        <!-- Error State -->
        <div v-else-if="verificationError" class="text-center px-6 py-8">
            <div class="space-y-6">
                <div class="flex justify-center mb-4">
                    <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
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
                            />
                        </svg>
                    </div>
                </div>

                <div class="space-y-2">
                    <h2 class="text-subtitle1 font-bold text-gray-950">
                        {{ $t('register.verificationFailed', 'Email verification failed') }}
                    </h2>
                    <p class="text-subtitle2 text-gray-700 leading-relaxed">
                        {{ getErrorMessage() }}
                    </p>
                </div>

                <div class="space-y-4">
                    <Button
                        v-if="token && !isTokenAlreadyUsedError"
                        variant="filled"
                        color="red"
                        size="lg"
                        :label="$t('register.tryAgain', 'Try Again')"
                        class="w-full max-w-xs mx-auto"
                        :loading="isRetrying"
                        :disabled="isRetrying"
                        @click="handleRetry"
                    />

                    <div v-if="isTokenAlreadyUsedError" class="text-center">
                        <Button
                            variant="outline"
                            color="blue"
                            size="lg"
                            :label="$t('register.requestNewLink', 'Request New Verification Link')"
                            class="w-full max-w-xs mx-auto mb-4"
                            :loading="isRequestingNewLink"
                            :disabled="isRequestingNewLink"
                            @click="handleRequestNewLink"
                        />
                    </div>

                    <div class="text-center">
                        <NuxtLink
                            :to="localePath('/register/personal-info')"
                            class="text-blue-600 hover:text-blue-800 hover:underline transition-colors text-subtitle3"
                        >
                            {{ $t('register.backToRegistration', 'Back to Registration') }}
                        </NuxtLink>
                    </div>
                </div>
            </div>
        </div>
    </AuthContainer>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useLocalePath } from '#imports'
    import { useRouter, useRoute } from 'vue-router'
    import { useToastNotification } from '~/composables/useToastNotification'
    import { useUserStore } from '~/stores/user'
    import { useModalStore } from '~/stores/modal'

    definePageMeta({
        layout: 'auth',
        auth: false,
    })

    const { t } = useI18n({ useScope: 'global' })
    const localePath = useLocalePath()
    const router = useRouter()
    const route = useRoute()
    const toast = useToastNotification()
    const userStore = useUserStore()
    const modalStore = useModalStore()
    const config = useRuntimeConfig()

    const isVerifying = ref(false)
    const isVerified = ref(false)
    const isCheckingAuth = ref(false)
    const isNavigating = ref(false)
    const isRetrying = ref(false)
    const isRequestingNewLink = ref(false)
    const verificationError = ref<string | null>(null)
    const verificationToken = ref<string | null>(null)
    const userEmail = ref<string>('')

    const token = computed(() => {
        return (route.query.token as string) || null
    })

    const isAuthenticated = computed(() => {
        return userStore.isAuthenticated
    })

    const isTokenAlreadyUsedError = computed(() => {
        return (
            verificationError.value?.includes('Invalid or already used') ||
            verificationError.value?.includes('already used')
        )
    })

    const isProduction = computed(() => {
        return config.public.env === 'production'
    })

    const getLoadingMessage = (): string => {
        if (isCheckingAuth.value) {
            return t('register.checkingAuth', 'Checking authentication...')
        }
        return t('register.verifyingEmail', 'Verifying your email...')
    }

    const getLoadingSubMessage = (): string => {
        if (isCheckingAuth.value) {
            return t('register.pleaseWaitAuth', 'Please wait while we check your session.')
        }
        return t('register.pleaseWait', 'Please wait while we confirm your registration.')
    }

    const getErrorMessage = (): string => {
        if (!verificationError.value) return ''

        if (verificationError.value.includes('Invalid or already used')) {
            return t(
                'register.tokenInvalidOrUsed',
                'This verification link is invalid or has already been used. Please request a new confirmation email.'
            )
        }

        if (
            verificationError.value.includes('expired') ||
            verificationError.value.includes('not found')
        ) {
            return t(
                'register.tokenExpired',
                'This verification link has expired or is invalid. Please request a new confirmation email.'
            )
        }

        if (verificationError.value.includes('already verified')) {
            return t(
                'register.alreadyVerified',
                'This email has already been verified. You can continue with your registration.'
            )
        }

        if (verificationError.value.includes('Too many')) {
            return t(
                'register.tooManyAttempts',
                'Too many verification attempts. Please wait a moment before trying again.'
            )
        }

        return (
            verificationError.value ||
            t(
                'register.verificationGenericError',
                'Something went wrong during verification. Please try again or contact support.'
            )
        )
    }

    const checkAuthenticationStatus = async (): Promise<boolean> => {
        try {
            isCheckingAuth.value = true

            if (isAuthenticated.value) {
                isVerified.value = true
                return true
            }

            return false
        } catch (error) {
            return false
        } finally {
            isCheckingAuth.value = false
        }
    }

    const verifyEmail = async (tokenValue: string): Promise<void> => {
        if (!tokenValue) {
            verificationError.value = t(
                'register.noTokenProvided',
                'No verification token provided'
            )
            return
        }

        try {
            isVerifying.value = true
            verificationError.value = null

            const { $api } = useNuxtApp()
            const response = await $api.post('/auth/register/confirm', {
                token: tokenValue,
            })

            if (response.data?.token && response.data?.user) {
                isVerified.value = true

                if (isProduction.value) {
                    // Save user and tokens to the user store
                    userStore.setInitialized(true)
                    userStore.setUser(response.data.user)
                    userStore.setTokens(response.data.token)
                }

                // Store user email from API response
                toast.success(
                    t('register.emailVerifiedSuccess', 'Email verified successfully!'),
                    t('success', 'Success')
                )

                if (isProduction.value) {
                    setTimeout(() => {
                        showComingSoonModal()
                    }, 1000)
                }
            } else {
                throw new Error(t('register.unexpectedResponse', 'Unexpected response from server'))
            }
        } catch (error: any) {
            console.error('[EmailConfirm] Verification failed:', error)

            if (error.code === 'ERR_NETWORK' || error.message.includes('CORS') || !error.response) {
                verificationError.value = t(
                    'register.corsError',
                    'Network connection failed. This appears to be a server configuration issue. Please contact support or try again later.'
                )
                isVerified.value = false
                return
            }

            if (error.response?.status === 422) {
                const apiErrors = error.response?.data?.errors
                if (apiErrors?.token) {
                    const tokenError = Array.isArray(apiErrors.token)
                        ? apiErrors.token[0]
                        : apiErrors.token

                    if (tokenError.includes('Invalid or already used')) {
                        verificationError.value = t(
                            'register.tokenInvalidOrUsed',
                            'This verification link is invalid or has already been used. Please request a new confirmation email.'
                        )

                        setTimeout(async () => {
                            const authCheck = await checkAuthenticationStatus()
                            if (authCheck) {
                                verificationError.value = null
                                isVerified.value = true
                                toast.success(
                                    t(
                                        'register.alreadyVerifiedSuccess',
                                        'Your email is already verified!'
                                    ),
                                    t('success', 'Success')
                                )

                                if (isProduction.value) {
                                    setTimeout(() => {
                                        showComingSoonModal()
                                    }, 500)
                                }
                            }
                        }, 1000)
                    } else {
                        verificationError.value = tokenError
                    }
                } else {
                    verificationError.value =
                        error.response?.data?.message ||
                        t('register.verificationFailed', 'Email verification failed')
                }
            } else if (error.response?.status === 404) {
                verificationError.value = t(
                    'register.tokenNotFound',
                    'Verification token not found. The link may have expired.'
                )
            } else if (error.response?.status === 429) {
                verificationError.value = t(
                    'register.tooManyAttempts',
                    'Too many verification attempts. Please try again later.'
                )
            } else {
                verificationError.value =
                    error.message ||
                    t(
                        'register.verificationGenericError',
                        'Something went wrong during verification. Please try again.'
                    )
            }

            isVerified.value = false
        } finally {
            isVerifying.value = false
        }
    }

    const handleContinue = async (): Promise<void> => {
        try {
            isNavigating.value = true
            await router.push(localePath('/register/company-details'))
        } catch (error) {
            console.error('[EmailConfirm] Navigation error:', error)
            toast.error(
                t('register.navigationError', 'Failed to navigate. Please try again.'),
                t('error', 'Error')
            )
        } finally {
            isNavigating.value = false
        }
    }

    const handleRetry = async (): Promise<void> => {
        if (!token.value) {
            await router.push(localePath('/register/personal-info'))
            return
        }

        isRetrying.value = true
        await verifyEmail(token.value)
        isRetrying.value = false
    }

    const handleRequestNewLink = async (): Promise<void> => {
        try {
            isRequestingNewLink.value = true

            const emailForResend = userEmail.value || userStore.user?.email

            if (!emailForResend) {
                toast.error(
                    t('register.noEmailFound', 'No email found. Please start registration again.'),
                    t('error', 'Error')
                )
                await router.push(localePath('/register/personal-info'))
                return
            }

            const { $api } = useNuxtApp()
            await $api.post('/auth/register/resend', {
                email: emailForResend,
            })

            toast.success(
                t('register.newLinkSent', 'A new verification link has been sent to your email.'),
                t('success', 'Success')
            )

            verificationError.value = null

            await router.push(localePath('/register/email-confirmation-success'))
        } catch (error: any) {
            console.error('[EmailConfirm] Failed to request new link:', error)

            if (error.response?.status === 422) {
                const apiErrors = error.response?.data?.errors
                if (apiErrors?.email) {
                    const emailError = Array.isArray(apiErrors.email)
                        ? apiErrors.email[0]
                        : apiErrors.email
                    toast.error(emailError, t('error', 'Error'))
                } else {
                    toast.error(
                        error.response?.data?.message ||
                            t('register.resendFailed', 'Failed to send new verification link.'),
                        t('error', 'Error')
                    )
                }
            } else {
                toast.error(
                    t('register.resendFailed', 'Failed to send new verification link.'),
                    t('error', 'Error')
                )
            }
        } finally {
            isRequestingNewLink.value = false
        }
    }

    const showComingSoonModal = async (): Promise<void> => {
        try {
            const moduleImport = await import('~/components/modals/ComingSoonModal.vue')
            const ComingSoonModal = moduleImport.default

            modalStore.openModal(
                ComingSoonModal,
                'verificationSuccess',
                {
                    message: t(
                        'register.profileSetupComingSoon',
                        'The profile setup feature is coming soon. We will let you know when you can complete your profile!'
                    ),
                    additionalInfo: t('register.completeProfileLater', 'Thank you for joining us!'),
                    showContactSupport: false,
                    closeButtonLabel: t('register.continueToLogin', 'Continue to Login'),
                },
                {
                    title: t('register.emailVerified', 'Email Confirmed!'),
                    contentWidth: 'max-w-sm sm:max-w-md',
                    hideClose: true,
                    persistent: true,
                    okColor: 'blue',
                    onOk: async () => {
                        try {
                            modalStore.closeModal()

                            await nextTick()

                            await navigateTo(localePath('/login'))
                        } catch (error) {
                            console.error('[Modal] Close error:', error)
                            window.location.href = localePath('/login')
                        }
                    },
                }
            )
        } catch (error) {
            console.error('[EmailConfirm] Failed to load modal:', error)

            modalStore.closeModal()
            await navigateTo(localePath('/login'))
        }
    }

    onMounted(async () => {
        const alreadyAuthenticated = await checkAuthenticationStatus()
        if (alreadyAuthenticated) {
            isVerified.value = true

            if (isProduction.value) {
                setTimeout(() => {
                    showComingSoonModal()
                }, 1000)
            } else {
                setTimeout(async () => {
                    if (!isNavigating.value) {
                        await handleContinue()
                    }
                }, 1500)
            }

            return
        }

        if (!token.value) {
            toast.error(
                t('register.noVerificationToken', 'No verification token found'),
                t('error', 'Error')
            )

            await router.push(localePath('/register/personal-info'))
            return
        }

        verificationToken.value = token.value

        await verifyEmail(token.value)
    })

    onBeforeRouteLeave((to, from, next) => {
        if (isVerified.value) {
            next()
            return
        }

        if (isVerifying.value) {
            const confirmed = confirm(
                t(
                    'register.confirmLeaveVerification',
                    'Verification is in progress. Are you sure you want to leave?'
                )
            )
            if (!confirmed) {
                next(false)
                return
            }
        }

        next()
    })
</script>

<style scoped>
    .fade-in {
        animation: fadeIn 0.5s ease-in-out;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .space-y-6 > * + * {
        margin-top: 1.5rem;
    }

    .space-y-4 > * + * {
        margin-top: 1rem;
    }

    .space-y-2 > * + * {
        margin-top: 0.5rem;
    }
</style>
