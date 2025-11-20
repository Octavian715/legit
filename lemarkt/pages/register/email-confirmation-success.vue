<template>
    <AuthContainer
        class="bg-gray-150"
        :full-height="true"
        content-class="max-w-2xl mx-auto flex flex-col justify-center"
        class-container="w-full"
    >
        <!-- Main Content -->
        <div class="text-center px-6 py-8">
            <!-- Success Message -->
            <div class="space-y-2">
                <h2 class="text-subtitle1 font-bold text-gray-950">
                    {{
                        $t(
                            'register.thankYouForRegistering',
                            'Thank you for registering on our platform!'
                        )
                    }}
                </h2>

                <div class="space-y-4 text-subtitle2 text-gray-850 leading-relaxed">
                    <p>
                        {{
                            t(
                                'register.confirmationEmailSent',
                                'A confirmation E-Mail has been sent to your inbox.'
                            )
                        }}
                        <br />
                        {{
                            t(
                                'register.confirmationEmailConfirm',
                                'Please check your E-Mail and click the confirmation link to complete your registration.'
                            )
                        }}
                    </p>

                    <!-- <p>
                        {{
                            t(
                                'register.confirmInfo',
                                'We will let you know when you can complete your profile!'
                            )
                        }}
                    </p> -->
                    <p>
                        {{
                            t(
                                'register.checkSpamFolder',
                                "If you don't see the message in your inbox, please check your Spam or Promotions folder."
                            )
                        }}
                    </p>
                </div>

                <!-- Email Address Display -->
                <div v-if="userEmail" class="p-6">
                    <p class="text-subtitle2 text-gray-850 mb-1">
                        {{ $t('register.confirmationSentTo', 'Confirmation link sent to:') }}
                    </p>
                    <p class="text-subtitle3 font-medium text-gray-950">
                        {{ userEmail }}
                    </p>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="space-y-6">
                <!-- Main Page Button -->
                <Button
                    variant="filled"
                    color="red"
                    size="lg"
                    :label="$t('register.goToMainPage', 'Main Page')"
                    class="w-full max-w-xs mx-auto"
                    @click="goToMainPage"
                />

                <!-- Resend Email -->
                <div class="text-center">
                    <p class="text-subtitle3 text-gray-800 mb-2">
                        {{ $t('register.didntReceiveEmail', "Didn't receive the email?") }}
                        <button
                            class="text-blue-600 hover:text-blue-800 hover:underline transition-colors ml-1"
                            :class="{
                                'opacity-50 cursor-not-allowed':
                                    isResendingEmail || isResendDisabled,
                                'hover:no-underline': isResendingEmail || isResendDisabled,
                            }"
                            :disabled="isResendingEmail || isResendDisabled"
                            @click="handleResendEmail"
                        >
                            <span v-if="isResendingEmail">
                                {{ $t('register.resending', 'Resending...') }}
                            </span>
                            <span v-else-if="isResendDisabled">
                                {{
                                    $t(
                                        'register.pleaseWaitBeforeResending',
                                        'Please wait before resending'
                                    )
                                }}
                            </span>
                            <span v-else>
                                {{ $t('register.resend', 'Resend') }}
                            </span>
                        </button>
                    </p>
                </div>
            </div>
        </div>
    </AuthContainer>
</template>

<script setup lang="ts">
    import { ref, onMounted } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useLocalePath } from '#imports'
    import { useRouter } from 'vue-router'
    import { useRegistrationNavigation } from '~/composables/useRegistrationNavigation'
    import { useToastNotification } from '~/composables/useToastNotification'

    definePageMeta({
        layout: 'auth',
        auth: false,
    })

    // Composables
    const { t } = useI18n({ useScope: 'global' })
    const localePath = useLocalePath()
    const router = useRouter()
    const { getStepData, resendConfirmationEmail } = useRegistrationNavigation()
    const toast = useToastNotification()

    // Simple state - NO computed properties, NO timers, NO reactivity loops
    const isResendingEmail = ref(false)
    const isResendDisabled = ref(false)
    const userEmail = ref('')

    const goToMainPage = () => {
        router.push(localePath('/login'))
    }

    const handleResendEmail = async () => {
        // Simple check - if disabled or already resending, do nothing
        if (isResendDisabled.value || isResendingEmail.value) {
            return
        }

        if (!userEmail.value) {
            toast.error(t('register.noEmailFound', 'No email address found'), t('error', 'Error'))
            return
        }

        try {
            // Set loading state
            isResendingEmail.value = true

            // Make API call
            const success = await resendConfirmationEmail(userEmail.value)

            if (success) {
                toast.success(
                    t('register.confirmationEmailResent', 'Confirmation email has been resent'),
                    t('success', 'Success')
                )

                // Disable resend button for 60 seconds - NO TIMERS
                isResendDisabled.value = true

                // Re-enable after 60 seconds using simple setTimeout (not a loop)
                setTimeout(() => {
                    isResendDisabled.value = false
                }, 60000)
            } else {
                toast.error(
                    t('register.resendFailed', 'Failed to resend confirmation email'),
                    t('error', 'Error')
                )
            }
        } catch (error: any) {
            console.error('[EmailConfirmation] Resend error:', error)

            let errorMessage = t('register.resendFailed', 'Failed to resend confirmation email')

            if (error.response?.status === 429 || error.message?.includes('too many')) {
                errorMessage = t(
                    'register.tooManyResendAttempts',
                    'Too many resend attempts. Please wait before trying again.'
                )
                // Also disable on rate limit
                isResendDisabled.value = true
                setTimeout(() => {
                    isResendDisabled.value = false
                }, 120000) // 2 minutes for rate limit
            }

            toast.error(errorMessage, t('error', 'Error'))
        } finally {
            // Always clear loading state
            isResendingEmail.value = false
        }
    }

    // Initialize on mount - get email once and never update
    onMounted(() => {
        const personalInfoData = getStepData('personalInfo') as any
        const email = personalInfoData?.email || ''

        const userType = useCookie('account_type')
        if (userType.value) {
            userType.value = null
        }

        if (!email) {
            console.warn('[EmailConfirmation] No email found, redirecting to personal-info')
            router.push(localePath('/register/personal-info'))
            return
        }

        // Set email once - never changes
        userEmail.value = email
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
</style>
