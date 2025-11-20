<!-- pages/auth/confirm-code.vue -->
<template>
    <AuthContainer class="bg-gray-150" :full-height="false" content-class="max-w-2xl mx-auto">
        <template #header>
            <div class="text-center mb-6 md:w-1/3 mx-auto">
                <h1 class="text-h6 font-semibold text-gray-950 mb-1">
                    {{ $t('auth.confirmCode', 'Confirm code') }}
                </h1>
                <p class="text-gray-800 text-subtitle2">
                    {{
                        $t(
                            'auth.confirmCodeDescription',
                            'Enter the 6-digit code sent to your email.'
                        )
                    }}
                </p>
            </div>
        </template>

        <form
            class="flex flex-col gap-6 w-full md:w-1/2 mx-auto"
            novalidate
            @submit.prevent="handleSubmit"
        >
            <!-- OTP Input Component -->
            <div class="flex justify-center">
                <OTPInput
                    v-model="fullCode"
                    :total-digits="6"
                    :error="errors.code"
                    @update:model-value="onCodeChange"
                />
            </div>

            <!-- Resend Link -->
            <div class="text-center space-y-2">
                <p class="text-sm text-gray-600">
                    {{ $t('auth.didntReceiveCode', "Didn't receive the code?") }}
                </p>
                <Button
                    color="gray"
                    size="sm"
                    :loading="isResending"
                    :disabled="isResending || !canResend"
                    :label="$t('auth.resend', 'Resend') + (!canResend ? ` (${countdown}s)` : '')"
                    @click="resendCode"
                />
            </div>

            <Button
                type="submit"
                color="red"
                class="w-full"
                size="lg"
                :loading="isLoading"
                :disabled="!canSubmit"
                :label="$t('auth.confirmCode', 'Confirm code')"
            />
        </form>

        <template #footer>
            <div class="text-center md:w-1/2 mx-auto">
                <p class="text-gray-800 text-subtitle2 my-4">
                    {{ $t('auth.wrongEmail', 'Wrong email address?') }}
                </p>
                <NuxtLink :to="localePath('/auth/forgot-password')" class="block w-full">
                    <Button
                        color="green"
                        size="lg"
                        class="w-full"
                        :label="$t('auth.changeEmail', 'Change Email')"
                    />
                </NuxtLink>
            </div>
        </template>
    </AuthContainer>
</template>

<script setup lang="ts">
    import { ref, reactive, computed, nextTick, onMounted, onUnmounted } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useLocalePath } from '#imports'
    import { validateData } from '~/utils/validator'
    import {
        confirmCodeSchema,
        type ConfirmCodeFormData,
    } from '~/utils/validator/schemas/auth/passwordResetSchemas'
    import { usePasswordReset } from '~/composables/usePasswordReset'
    import { usePasswordResetNavigation } from '~/composables/usePasswordResetNavigation'
    import { useToastNotification } from '~/composables/useToastNotification'
    import OTPInput from '~/components/ui/OTPInput.vue'

    definePageMeta({ middleware: 'guest', layout: 'auth' })

    const { t } = useI18n()
    const localePath = useLocalePath()
    const router = useRouter()
    const {
        verifyResetCode,
        isLoading: composableLoading,
        error: resetError,
        clearError: clearComposableError,
        passwordResetState,
        requestPasswordReset,
    } = usePasswordReset()
    const { handleStepSuccess } = usePasswordResetNavigation()
    const toast = useToastNotification()

    // State
    const isLoading = ref(false)
    const fullCode = ref('')
    const isResending = ref(false)
    const countdown = ref(60)
    const canResend = ref(true)
    let countdownInterval: NodeJS.Timeout | null = null

    // Field-specific errors only
    const errors = reactive({
        code: '',
    })

    const isComplete = computed(() => fullCode.value.length === 6)

    // Simple validation function
    const validateForm = (): boolean => {
        errors.code = ''

        const formData = { code: fullCode.value }
        const validationResult = validateData('confirmCode', confirmCodeSchema, formData)

        if (!validationResult.isValid) {
            validationResult.errors.forEach((error) => {
                if (error.field === 'code') {
                    errors.code = error.message
                }
            })
            return false
        }

        return true
    }

    // Computed properties
    const canSubmit = computed(() => {
        return isComplete.value && !errors.code && !isLoading.value && !composableLoading.value
    })

    const onCodeChange = (value: string) => {
        fullCode.value = value
        clearError()
    }

    const clearError = () => {
        errors.code = ''
    }

    const handleSubmit = async () => {
        clearError()
        clearComposableError()

        if (!validateForm()) {
            return
        }

        isLoading.value = true

        try {
            const success = await verifyResetCode(fullCode.value)
            if (success) {
                // Navigate to reset password page
                await handleStepSuccess('confirm-code')
            } else {
                handleError(resetError.value)
                clearCodeInputs()
            }
        } catch (err: any) {
            handleError(err)
            clearCodeInputs()
        } finally {
            isLoading.value = false
        }
    }

    // Backend error mapping (only for 422 field errors)
    const fieldMapping: Record<string, keyof typeof errors> = {
        code: 'code',
    }

    const mapBackendErrorsToFields = (backendErrors: Record<string, string | string[]>) => {
        Object.entries(backendErrors).forEach(([backendField, messages]) => {
            const message = Array.isArray(messages) ? messages[0] : messages
            const frontendField = fieldMapping[backendField]

            if (frontendField && frontendField in errors) {
                errors[frontendField] = message
            }
        })
    }

    const handleError = (error: any) => {
        if (error?.response?.status === 422 && error.response?.data?.errors) {
            // Field errors: show on form only
            mapBackendErrorsToFields(error.response.data.errors)
        } else {
            // General errors: toast only
            let errorMessage = ''

            if (error?.response?.status === 410) {
                errorMessage = t('auth.codeExpired', 'Code has expired.')
            } else {
                errorMessage =
                    error?.response?.data?.message ||
                    error?.message ||
                    t('auth.codeVerificationFailed', 'Code verification failed. Please try again.')
            }

            toast.error(errorMessage, t('error', 'Error'))
        }
    }

    const clearCodeInputs = () => {
        fullCode.value = ''
    }

    const resendCode = async () => {
        if (!canResend.value) return

        try {
            isResending.value = true
            clearError()
            clearComposableError()

            const email = passwordResetState.value.email
            if (!email) {
                const errorMessage = t('auth.emailNotFound', 'Email not found. Please try again.')
                toast.error(errorMessage, t('error', 'Error'))
                return
            }

            const success = await requestPasswordReset(email)
            if (success) {
                startCountdown()
                clearCodeInputs()
                toast.success(
                    t('auth.codeResent', 'Code resent successfully.'),
                    t('success', 'Success')
                )
            } else {
                handleError(resetError.value)
            }
        } catch (err: any) {
            handleError(err)
        } finally {
            isResending.value = false
        }
    }

    const startCountdown = () => {
        canResend.value = false
        countdown.value = 60

        if (countdownInterval) {
            clearInterval(countdownInterval)
        }

        countdownInterval = setInterval(() => {
            countdown.value--
            if (countdown.value <= 0) {
                canResend.value = true
                if (countdownInterval) {
                    clearInterval(countdownInterval)
                    countdownInterval = null
                }
            }
        }, 1000)
    }

    onMounted(() => {
        // Check if we have a password reset in progress
        if (!passwordResetState.value.email) {
            // Redirect to forgot password if no email is found
            router.push(localePath('/auth/forgot-password'))
            return
        }

        startCountdown()
    })

    onUnmounted(() => {
        if (countdownInterval) {
            clearInterval(countdownInterval)
        }
    })

    useHead({
        title: computed(() => t('auth.confirmCode', 'Confirm Code')),
    })
</script>
