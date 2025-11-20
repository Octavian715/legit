<template>
    <AuthContainer
        class="bg-gray-150"
        :full-height="false"
        content-class="w-full"
        class-container="w-full"
        spacing
    >
        <template #header>
            <h2 class="font-bold text-gray-950 text-subtitle1 text-center">
                {{ $t('register.personalInfo', 0, 'Personal Information') }}
            </h2>
        </template>

        <div class="mt-6">
            <!-- Loading State -->
            <div v-if="isLoading" class="flex justify-center items-center p-8">
                <span class="loader"></span>
            </div>

            <!-- Personal Information Form -->
            <form
                v-else
                class="flex flex-col gap-3 w-full md:w-1/2 mx-auto"
                novalidate
                @submit.prevent="handleSubmit"
            >
                <Input
                    v-model="form.email"
                    :label="$t('email', 'Email')"
                    type="email"
                    name="email"
                    background="bg-white"
                    :error="errors.email"
                    autocomplete="email"
                    required
                    @input="clearFieldError('email')"
                />

                <Input
                    v-model="form.password"
                    :label="$t('password', 'Password')"
                    type="password"
                    background="bg-white"
                    :error="errors.password"
                    name="password"
                    autocomplete="new-password"
                    required
                    :password-rules="passwordRules"
                    @input="clearFieldError('password')"
                />

                <Input
                    v-model="form.confirmPassword"
                    :label="$t('confirmPassword', 'Confirm Password')"
                    type="password"
                    background="bg-white"
                    :error="errors.confirmPassword"
                    name="confirm-password"
                    autocomplete="new-password"
                    required
                    @input="clearFieldError('confirmPassword')"
                />

                <!-- Destination Type Radio Group -->
                <div class="space-y-3">
                    <label class="block text-sm font-medium text-gray-900">
                        {{ $t('register.destinationType', 'Business Destination') }}
                        <span class="text-red-500">*</span>
                    </label>
                    <div class="flex flex-wrap gap-4 md:gap-6">
                        <Radiobox
                            v-model="form.destinationType"
                            value="both"
                            name="destination_type"
                            :label="$t('register.destinationBoth', 'Both HoReCa & Retail')"
                            @change="clearFieldError('destinationType')"
                        />
                        <Radiobox
                            v-model="form.destinationType"
                            value="horeca"
                            name="destination_type"
                            :label="$t('register.destinationHoreca', 'HoReCa')"
                            @change="clearFieldError('destinationType')"
                        />
                        <Radiobox
                            v-model="form.destinationType"
                            value="retail"
                            name="destination_type"
                            :label="$t('register.destinationRetail', 'Retail')"
                            @change="clearFieldError('destinationType')"
                        />
                    </div>
                    <!-- Error display for destination type -->
                    <p
                        v-if="errors.destinationType"
                        class="text-caption1 text-red-500"
                        role="alert"
                    >
                        {{ errors.destinationType }}
                    </p>
                </div>

                <Checkbox
                    v-model="form.terms"
                    :error="errors.terms"
                    @update:model-value="clearFieldError('terms')"
                >
                    <i18n-t keypath="agreement">
                        <template #link>
                            <NuxtLink
                                :to="localePath('/terms')"
                                class="underline text-subtitle3 hover:text-gray-600 active:scale-95"
                                target="_blank"
                            >
                                {{ $t('register.termsAndConditions', 'Terms and Conditions') }}
                            </NuxtLink>
                        </template>
                    </i18n-t>
                </Checkbox>

                <Checkbox
                    v-model="form.subscribeToNewsletter"
                    :label="$t('register.subscribeNewsletter', 'Subscribe to newsletter')"
                />

                <Button
                    type="submit"
                    variant="filled"
                    color="red"
                    :label="$t('register.next', 'Next')"
                    class="w-full min-w-[200px] mt-6"
                    :loading="isSubmitting"
                    :disabled="!canSubmit"
                />
            </form>
        </div>
    </AuthContainer>
</template>

<script setup lang="ts">
    import { ref, reactive, computed } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useLocalePath } from '#imports'
    import { useRouter } from 'vue-router'
    import { validateData } from '~/utils/validator'
    import {
        registrationSchema,
        type RegistrationFormData,
    } from '~/utils/validator/schemas/auth/registerSchema'
    import { useRegistrationNavigation } from '~/useRegistrationNavigation'
    import { useToastNotification } from '~/composables/useToastNotification'
    import { useTokenManagement } from '~/composables/useTokenManagement'

    definePageMeta({ middleware: ['registration', 'guest'], layout: 'auth' })

    // Composables
    const { t } = useI18n({ useScope: 'global' })
    const localePath = useLocalePath()
    const router = useRouter()
    const {
        getStepData,
        updateStepData,
        submitStep,
        initializeStep,
        getAccountType,
        isSubmitting,
        getError,
        clearError,
        store,
        user,
    } = useRegistrationNavigation()
    const { clearAllTokens } = useTokenManagement()
    const toast = useToastNotification()

    // State
    const isLoading = ref(false)

    // Get current personal info data
    const personalInfoData =
        (getStepData('personalInfo') as RegistrationFormData) || user?.user?.roles[0]

    // Form data
    const form = reactive<RegistrationFormData>({
        email: personalInfoData?.email || '',
        password: personalInfoData?.password || '',
        confirmPassword: personalInfoData?.confirmPassword || '',
        destinationType: personalInfoData?.destinationType || 'both',
        terms: personalInfoData?.terms || false,
        subscribeToNewsletter: personalInfoData?.subscribeToNewsletter || false,
    })

    // Field errors only
    const errors = reactive({
        email: '',
        password: '',
        confirmPassword: '',
        destinationType: '',
        terms: '',
    })

    // Backend error mapping
    const fieldMapping: Record<string, keyof typeof errors> = {
        email: 'email',
        password: 'password',
        confirm_password: 'confirmPassword',
        confirmPassword: 'confirmPassword',
        terms: 'terms',
        terms_accepted: 'terms',
    }

    // Computed Properties
    const passwordRules = computed(() => [
        {
            message: t('validation.passwordLength', 'At least 8 characters'),
            validator: (v: string) => v.length >= 8,
        },
        {
            message: t('validation.passwordNumber', 'Contains a number'),
            validator: /\d/,
        },
        {
            message: t('validation.passwordUppercase', 'Contains uppercase letter'),
            validator: /[A-Z]/,
        },
    ])

    const canSubmit = computed(() => {
        return (
            form.email &&
            form.email.length > 0 &&
            form.password &&
            form.password.length > 0 &&
            form.confirmPassword &&
            form.confirmPassword.length > 0 &&
            form.destinationType &&
            form.terms &&
            !errors.email &&
            !errors.password &&
            !errors.confirmPassword &&
            !errors.destinationType &&
            !errors.terms &&
            !isSubmitting.value
        )
    })

    // Backend error mapping function
    const mapBackendErrorsToFields = (backendErrors: Record<string, string | string[]>) => {
        Object.entries(backendErrors).forEach(([backendField, messages]) => {
            const message = Array.isArray(messages) ? messages[0] : messages
            const frontendField = fieldMapping[backendField]

            if (frontendField && frontendField in errors) {
                errors[frontendField] = message as string
            }
        })
    }

    // Store error sync
    const syncStoreErrorsToFields = () => {
        const storeError = getError()

        if (storeError?.response?.status === 422 && storeError.response?.data?.errors) {
            // Field validation errors (422): show on form only
            mapBackendErrorsToFields(storeError.response.data.errors)
        } else if (storeError?.response?.status === 409) {
            // Conflict errors (409): toast only
            let conflictMessage = t(
                'errors.generalSubmit',
                'Registration failed. Please try again.'
            )

            if (storeError.response?.data?.errors?.general) {
                conflictMessage = Array.isArray(storeError.response.data.errors.general)
                    ? storeError.response.data.errors.general[0]
                    : storeError.response.data.errors.general
            } else if (storeError.response?.data?.message) {
                conflictMessage = storeError.response.data.message
            }

            toast.error(conflictMessage, t('error', 'Error'))
        } else if (storeError) {
            // Other general errors: toast only
            const errorMessage =
                storeError.response?.data?.message ||
                storeError.message ||
                t('errors.generalSubmit', 'Registration failed. Please try again.')
            toast.error(errorMessage, t('error', 'Error'))
        }
    }

    // Clear field error on user input
    const clearFieldError = (field: keyof typeof errors) => {
        if (errors[field]) {
            errors[field] = ''
        }
        clearError()
        updateStepData('personalInfo', { ...form })
    }

    // Clear all field errors
    const clearAllErrors = () => {
        Object.keys(errors).forEach((key) => {
            errors[key as keyof typeof errors] = ''
        })
        clearError()
    }

    // Simple validation function
    const validateForm = (): boolean => {
        clearAllErrors()

        const validationResult = validateData('registration', registrationSchema, form)

        if (!validationResult.isValid) {
            validationResult.errors.forEach((error) => {
                if (error.field === 'email') {
                    errors.email = error.message
                }
                if (error.field === 'password') {
                    errors.password = error.message
                }
                if (error.field === 'confirmPassword') {
                    errors.confirmPassword = error.message
                }
                if (error.field === 'destinationType') {
                    errors.destinationType = error.message
                }
                if (error.field === 'terms') {
                    errors.terms = error.message
                }
            })
        }

        // Custom validation for destination type
        if (!form.destinationType) {
            errors.destinationType = t(
                'validation.destinationTypeRequired',
                'Please select a business destination'
            )
        }

        // Custom password confirmation validation
        if (form.password && form.confirmPassword && form.password !== form.confirmPassword) {
            errors.confirmPassword = t('validation.passwordsDoNotMatch', 'Passwords do not match')
        }

        return (
            validationResult.isValid &&
            form.password === form.confirmPassword &&
            !!form.destinationType
        )
    }

    // Main submit handler with enhanced logging and cookie cleanup
    const handleSubmit = async () => {
        clearAllErrors()
        // Validate form locally first
        if (!validateForm()) {
            return
        }

        try {
            // Get account type info before submission
            const accountTypeInfo = getAccountType()
            // Ensure userRoleId is properly converted to integer
            let userRoleId = accountTypeInfo.id || 1

            if (typeof userRoleId === 'string') {
                userRoleId = parseInt(userRoleId, 10)
            }

            // Validate userRoleId is a valid integer
            if (!Number.isInteger(userRoleId) || userRoleId < 1) {
                console.error('[PersonalInfo] Invalid userRoleId, using default:', userRoleId)
                userRoleId = 1 // Default fallback to supplier
            }

            const stepData = {
                ...form,
                userRoleId, // This will be an integer
                timestamp: new Date().toISOString(),
                completedAt: new Date().toISOString(),
            }

            // Submit using store - this will handle cookie cleanup internally
            const success = await submitStep('personalInfo', stepData)

            if (success) {
                // Navigate to email confirmation page
                await router.push(localePath('/register/email-confirmation-success'))
            } else {
                console.warn('[PersonalInfo] Registration request failed, but no specific error')

                // Check if there's a store error to show
                const currentError = getError()
                if (!currentError) {
                    toast.error(
                        t('errors.generalSubmit', 'Registration failed. Please try again.'),
                        t('error', 'Error')
                    )
                }
            }
        } catch (error) {
            console.error('[PersonalInfo] Unexpected error during submission:', error)
            toast.error(
                t('errors.generalSubmit', 'Registration failed. Please try again later.'),
                t('error', 'Error')
            )
        }
    }

    // Watch store errors and sync them to fields
    watch(
        () => getError(),
        (newError) => {
            if (newError) {
                syncStoreErrorsToFields()
            }
        },
        { immediate: true }
    )

    // Watch form changes to update store
    watch(
        () => ({ ...form }),
        (newForm) => {
            updateStepData('personalInfo', newForm)
        },
        { deep: true }
    )

    // Lifecycle
    onMounted(() => {
        // Clear any existing auth tokens to ensure clean registration
        if (useCookie('auth.token').value) {
            clearAllTokens()
        }

        // Initialize this step
        initializeStep('personalInfo')
        isLoading.value = false

        // Check for any existing store errors
        syncStoreErrorsToFields()
    })
</script>
