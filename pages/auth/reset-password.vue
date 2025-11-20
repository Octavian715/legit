<!-- pages/auth/reset-password.vue -->
<template>
    <AuthContainer class="bg-gray-150" :full-height="false" content-class="max-w-2xl mx-auto">
        <template #header>
            <div class="text-center md:w-1/2 mx-auto">
                <h1 class="text-h6 font-semibold text-gray-950 mb-1">
                    {{ $t('auth.setNewPassword', 'Set your new password') }}
                </h1>
            </div>
        </template>

        <form
            class="flex flex-col gap-6 w-full md:w-1/2 mx-auto"
            novalidate
            @submit.prevent="handleSubmit"
        >
            <div class="flex flex-col gap-3">
                <Input
                    v-model="form.password"
                    type="password"
                    name="password"
                    :label="$t('auth.newPassword', 'New password')"
                    :error="errors.password"
                    :required="true"
                    background="bg-white"
                    autocomplete="new-password"
                    show-password-toggle
                    @input="updateFormValues('password', $event)"
                />

                <Input
                    v-model="form.confirmPassword"
                    type="password"
                    name="confirmPassword"
                    :label="$t('auth.confirmNewPassword', 'Confirm new password')"
                    :error="errors.confirmPassword"
                    :required="true"
                    background="bg-white"
                    autocomplete="new-password"
                    show-password-toggle
                    @input="updateFormValues('confirmPassword', $event)"
                />
            </div>

            <Button
                type="submit"
                color="red"
                class="w-full"
                size="lg"
                :loading="isLoading"
                :disabled="!canSubmit"
                :label="$t('auth.confirmPassword', 'Confirm password')"
            />
        </form>

        <!-- Success Message -->
        <div
            v-if="success"
            class="bg-green-50 border border-green-200 rounded-lg p-4 w-full md:w-1/2 mx-auto mt-6"
        >
            <p class="text-green-800 text-sm text-center">
                {{
                    $t(
                        'auth.passwordResetSuccess',
                        'Password has been successfully reset. You can now log in with your new password.'
                    )
                }}
            </p>
        </div>
    </AuthContainer>
</template>

<script setup lang="ts">
    import { ref, reactive, computed, watch, onMounted } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useLocalePath } from '#imports'
    import { useRouter } from 'vue-router'
    import { validateData } from '~/utils/validator'
    import {
        resetPasswordSchema,
        type ResetPasswordFormData,
    } from '~/utils/validator/schemas/auth/passwordResetSchemas'
    import { usePasswordReset } from '~/composables/usePasswordReset'
    import { usePasswordResetNavigation } from '~/composables/usePasswordResetNavigation'
    import { useToastNotification } from '~/composables/useToastNotification'

    definePageMeta({ middleware: 'guest', layout: 'auth' })

    const { t } = useI18n()
    const localePath = useLocalePath()
    const router = useRouter()
    const route = useRoute()
    const {
        resetPassword,
        isLoading: composableLoading,
        error: resetError,
        clearError: clearComposableError,
        passwordResetState,
    } = usePasswordReset()
    const { handleStepSuccess } = usePasswordResetNavigation()
    const toast = useToastNotification()

    // State
    const isLoading = ref(false)
    const success = ref(false)

    // Form data
    const form = reactive<ResetPasswordFormData>({
        token: '',
        password: '',
        confirmPassword: '',
    })

    // Field-specific errors only
    const errors = reactive({
        password: '',
        confirmPassword: '',
    })

    // Get token from route query or store
    const token = computed(() => {
        return (route.query.token as string) || passwordResetState.value.token || ''
    })

    const hasMinLength = computed(() => {
        return form.password.length >= 8
    })

    const passwordsMatch = computed(() => {
        return form.password && form.confirmPassword && form.password === form.confirmPassword
    })

    const updateFormValues = (field: 'password' | 'confirmPassword', value: string) => {
        form[field] = value

        // Clear specific field error when user types
        if (field === 'password') {
            errors.password = ''
        }
        if (field === 'confirmPassword') {
            errors.confirmPassword = ''
        }
    }

    // Simple validation function
    const validateForm = (): boolean => {
        errors.password = ''
        errors.confirmPassword = ''

        // Set token before validation
        form.token = token.value

        const validationResult = validateData('resetPassword', resetPasswordSchema, form)

        if (!validationResult.isValid) {
            validationResult.errors.forEach((error) => {
                if (error.field === 'password') {
                    errors.password = error.message
                }
                if (error.field === 'confirmPassword') {
                    errors.confirmPassword = error.message
                }
            })
            return false
        }

        // Additional password match validation
        if (form.password !== form.confirmPassword) {
            errors.confirmPassword = t('validation.passwordsMustMatch', 'Passwords must match')
            return false
        }

        return true
    }

    // Computed properties
    const canSubmit = computed(() => {
        return (
            form.password.length > 0 &&
            form.confirmPassword.length > 0 &&
            !errors.password &&
            !errors.confirmPassword &&
            !isLoading.value &&
            !composableLoading.value &&
            token.value.length > 0
        )
    })

    const handleSubmit = async () => {
        clearComposableError()

        if (!token.value) {
            const errorMessage = t(
                'auth.invalidResetToken',
                'Invalid reset token. Please request a new password reset.'
            )
            toast.error(errorMessage, t('error', 'Error'))
            return
        }

        if (!validateForm()) {
            return
        }

        isLoading.value = true

        try {
            const resetSuccess = await resetPassword(token.value, form.password)

            if (resetSuccess) {
                success.value = true
                toast.success(
                    t('auth.passwordResetSuccess', 'Password has been successfully reset.'),
                    t('success', 'Success')
                )

                // Navigate to login after 2 seconds using the navigation composable
                setTimeout(async () => {
                    await handleStepSuccess('reset-password')
                }, 2000)
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
        password: 'password',
        password_confirmation: 'confirmPassword',
        confirmPassword: 'confirmPassword',
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

            if (error?.response?.status === 400) {
                errorMessage = t('auth.invalidOrUsedToken', 'Invalid or already used token.')
            } else if (error?.response?.status === 410) {
                errorMessage = t('auth.tokenExpired', 'Token has expired.')
            } else {
                errorMessage =
                    error?.response?.data?.message ||
                    error?.message ||
                    t('auth.passwordResetFailed', 'Failed to reset password. Please try again.')
            }

            toast.error(errorMessage, t('error', 'Error'))
        }
    }

    // Watch form values for real-time validation feedback
    watch(
        () => route.query,
        (newQuery) => {
            if (newQuery.token && typeof newQuery.token === 'string') {
                form.token = newQuery.token
            }
        },
        { immediate: true }
    )

    // Redirect if no token available
    onMounted(() => {
        if (!token.value) {
            router.push('/auth/forgot-password')
        } else {
            form.token = token.value
        }
    })

    useHead({
        title: computed(() => t('auth.resetPassword', 'Reset Password')),
    })
</script>
