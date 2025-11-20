<!-- pages/auth/forgot-password.vue -->
<template>
    <AuthContainer class="bg-gray-150" :full-height="false" content-class="max-w-2xl mx-auto">
        <template #header>
            <div class="text-center md:w-1/2 mx-auto">
                <h1 class="text-h5 text-gray-950 mb-1">
                    {{ $t('auth.recoverPassword', 'Recover password') }}
                </h1>
            </div>
        </template>

        <form
            class="flex flex-col gap-6 w-full md:w-1/2 mx-auto"
            novalidate
            @submit.prevent="handleSubmit"
        >
            <Input
                v-model="form.email"
                type="email"
                name="email"
                :label="$t('auth.emailAddress', 'E-Mail address')"
                :error="errors.email"
                :required="true"
                background="bg-white"
                autocomplete="email"
                @input="clearFieldError('email')"
            />

            <Button
                type="submit"
                color="red"
                class="w-full"
                size="lg"
                :loading="isLoading"
                :disabled="!canSubmit"
                :label="$t('auth.sendRecoverLink', 'Send recover link')"
            />

            <!-- Alternative Reset Option -->
            <!-- <div class="text-center mt-4">
                <Link
                    color="danger"
                    :to="localePath('/auth/reset-phone')"
                    :title="$t('auth.resetPasswordViaPhone', 'Reset Password via Phone number')"
                />
            </div> -->
        </form>

        <!-- Success Message - Simplified without resend -->
        <div v-if="emailSent" class="text-center space-y-4 w-full md:w-1/2 mx-auto mt-6">
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <p class="text-green-800 text-sm">
                    {{
                        $t(
                            'auth.passwordResetEmailSent',
                            'Password reset link has been sent to your email. Redirecting...'
                        )
                    }}
                </p>
            </div>
        </div>
    </AuthContainer>
</template>

<script setup lang="ts">
    import { ref, reactive, computed, onUnmounted } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useLocalePath } from '#imports'
    import { validateData } from '~/utils/validator'
    import {
        forgotPasswordSchema,
        type ForgotPasswordFormData,
    } from '~/utils/validator/schemas/auth/passwordResetSchemas'
    import { usePasswordReset } from '~/composables/usePasswordReset'
    import { useToastNotification } from '~/composables/useToastNotification'
    import { usePasswordResetNavigation } from '~/composables/usePasswordResetNavigation'
    // import Link from '~/components/ui/Link.vue'

    definePageMeta({ middleware: 'guest', layout: 'auth' })

    const { t } = useI18n()
    const localePath = useLocalePath()
    const {
        requestPasswordReset,
        isLoading: composableLoading,
        error: resetError,
        clearError: clearComposableError,
    } = usePasswordReset()
    const { handleStepSuccess } = usePasswordResetNavigation()
    const toast = useToastNotification()

    // State
    const isLoading = ref(false)
    const emailSent = ref(false)

    // Form data
    const form = reactive<ForgotPasswordFormData>({
        email: '',
    })

    // Field-specific errors only
    const errors = reactive({
        email: '',
    })

    // Validation function
    const validateForm = (): boolean => {
        errors.email = ''

        const validationResult = validateData('forgotPassword', forgotPasswordSchema, form)

        if (!validationResult.isValid) {
            validationResult.errors.forEach((error) => {
                if (error.field === 'email') {
                    errors.email = error.message
                }
            })
            return false
        }

        return true
    }

    // Clear field error when user types
    const clearFieldError = (field: 'email') => {
        errors[field] = ''
    }

    // Computed properties
    const canSubmit = computed(() => {
        return (
            form.email.length > 0 && !errors.email && !isLoading.value && !composableLoading.value
        )
    })

    const handleSubmit = async () => {
        clearComposableError()

        if (!validateForm()) {
            return
        }

        isLoading.value = true

        try {
            const success = await requestPasswordReset(form.email)
            if (success) {
                emailSent.value = true
                toast.success(
                    t(
                        'auth.passwordResetEmailSent',
                        'Password reset link has been sent to your email.'
                    ),
                    t('success', 'Success')
                )

                // Navigate directly to reset password page after showing success
                setTimeout(async () => {
                    await handleStepSuccess('forgot-password')
                }, 1500)
            } else {
                handleError(resetError.value)
            }
        } catch (err: any) {
            handleError(err)
        } finally {
            isLoading.value = false
        }
    }

    // Backend error mapping (only for 422 field errors)
    const fieldMapping: Record<string, keyof typeof errors> = {
        email: 'email',
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

            if (error?.response?.status === 404) {
                errorMessage = t('auth.userNotFound', 'User with this email does not exist.')
            } else if (error?.response?.status === 429) {
                errorMessage = t(
                    'auth.tooManyRequests',
                    'Please wait at least 5 minutes before requesting another password reset email.'
                )
            } else {
                errorMessage =
                    error?.response?.data?.message ||
                    error?.message ||
                    t(
                        'auth.passwordResetFailed',
                        'Failed to send password reset email. Please try again.'
                    )
            }

            toast.error(errorMessage, t('error', 'Error'))
        }
    }

    useHead({
        title: computed(() => t('auth.recoverPassword', 'Recover Password')),
    })
</script>
