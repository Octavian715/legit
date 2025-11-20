<!-- pages/register/company-details/profile.vue -->
<template>
    <AuthContainer
        class="bg-gray-150"
        :full-height="false"
        content-class="max-w-4xl mx-auto"
        class-container="w-full"
        spacing
    >
        <template #header>
            <h2 class="font-bold text-gray-950 text-subtitle1 text-center">
                {{ $t('company.details', 'Company details') }}
            </h2>
            <p class="text-subtitle3 text-gray-700 text-center mt-2">
                {{ $t('stepOf', { n: '1/6' }, `Step 1/6`) }}
            </p>
        </template>

        <div class="mt-3">
            <!-- Loading State -->
            <div v-if="isLoading" class="flex justify-center items-center p-8">
                <span class="loader"></span>
            </div>

            <!-- Company Profile Form -->
            <form
                v-else
                class="flex flex-col gap-3 w-full md:w-1/2 mx-auto"
                novalidate
                @submit.prevent="handleSubmit"
            >
                <!-- Company Legal Name -->
                <Input
                    v-model="form.legalName"
                    :label="$t('company.legalName', 'Company Legal Name')"
                    name="legalName"
                    background="bg-white"
                    :error="errors.legalName"
                    autocomplete="organization"
                    required
                    :explain="
                        $t('company.legalNameHint', 'The official registered name of your company')
                    "
                    @input="clearFieldError('legalName')"
                />

                <!-- Company Username -->
                <Input
                    v-model="form.username"
                    :label="$t('company.userName', 'Username (@your_username)')"
                    name="userName"
                    background="bg-white"
                    :error="errors.username"
                    required
                    :explain="
                        $t('company.userNameHint', 'Unique username for your company profile')
                    "
                    @input="clearFieldError('username')"
                />

                <!-- Business Type -->
                <Select
                    v-model="form.businessTypeId"
                    :label="$t('company.businessType', 'Business Type')"
                    name="businessType"
                    background="bg-white"
                    :error="errors.businessTypeId"
                    required
                    size="lg"
                    :options="businessTypeOptions"
                    @update:model-value="clearFieldError('businessTypeId')"
                />

                <!-- Registration Number -->
                <Input
                    v-model="form.registrationNumber"
                    :label="$t('company.registrationNumber', 'Registration Number')"
                    name="registrationNumber"
                    background="bg-white"
                    :error="errors.registrationNumber"
                    required
                    @input="clearFieldError('registrationNumber')"
                />

                <!-- VAT Number -->
                <Input
                    v-model="form.vatNumber"
                    :label="$t('company.vatNumber', 'VAT Number')"
                    name="vatNumber"
                    background="bg-white"
                    :error="errors.vatNumber"
                    required
                    @input="clearFieldError('vatNumber')"
                />

                <!-- Year of Registration -->
                <Select
                    v-model="form.registrationYear"
                    :label="$t('company.yearOfRegistration', 'Year of Registration')"
                    name="registrationYear"
                    background="bg-white"
                    size="lg"
                    :error="errors.registrationYear"
                    required
                    :options="yearOptions"
                    @update:model-value="clearFieldError('registrationYear')"
                />

                <!-- Navigation Buttons -->
                <div class="flex flex-col sm:flex-row gap-3 justify-between mt-3">
                    <Button
                        type="button"
                        variant="filled"
                        color="gray"
                        :label="$t('prevStep', 'Previous Step')"
                        class="w-full"
                        :disabled="true"
                        @click="handleGoBack"
                    />

                    <Button
                        type="submit"
                        variant="filled"
                        color="red"
                        :label="$t('nextStep', 'Next Step')"
                        class="w-full"
                        :loading="isSubmitting"
                        :disabled="!canSubmit"
                    />
                </div>
            </form>
        </div>
    </AuthContainer>
</template>

<script setup lang="ts">
    import { ref, reactive, computed, onMounted, watch } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useLocalePath } from '#imports'
    import { useRouter } from 'vue-router'
    import { validateData } from '~/utils/validator'
    import {
        companyProfileSchema,
        type CompanyProfileFormData,
    } from '~/utils/validator/schemas/auth/registerSchema'
    import { useRegistrationNavigation } from '~/useRegistrationNavigation'
    import { useToastNotification } from '~/composables/useToastNotification'
    import { useStaticData } from '~/composables/useStaticData'

    definePageMeta({ middleware: ['registration'], layout: 'auth' })

    // Composables
    const { t } = useI18n({ useScope: 'global' })
    const localePath = useLocalePath()
    const router = useRouter()
    const {
        getStepData,
        updateStepData,
        completeCompanyProfile, // Use specific method instead of generic
        initializeStep,
        isSavingCompanyDetails,
        goBack,
        canGoBack,
        getError,
        getFieldErrors,
        hasFieldErrors,
        clearError,
        loadAndPopulateFieldRegistration,
    } = useRegistrationNavigation()
    const { businessTypeOptions } = useStaticData()
    const toast = useToastNotification()

    // State
    const isLoading = ref(true)

    // Get current data
    const companyData = getStepData('companyDetails') as any

    // Form data - using existing data or defaults
    const form = reactive<CompanyProfileFormData>({
        legalName: companyData?.profile?.legalName || companyData?.legalName || '',
        username: companyData?.profile?.username || companyData?.username || '',
        businessTypeId: companyData?.profile?.businessTypeId || companyData?.businessTypeId || '',
        registrationNumber:
            companyData?.profile?.registrationNumber || companyData?.registrationNumber || '',
        vatNumber: companyData?.profile?.vatNumber || companyData?.vatNumber || '',
        registrationYear:
            companyData?.profile?.registrationYear || companyData?.registrationYear || '',
    })

    // Field errors only - according to blueprint
    const errors = reactive({
        legalName: '',
        username: '',
        businessTypeId: '',
        registrationNumber: '',
        vatNumber: '',
        registrationYear: '',
    })

    // Enhanced backend error mapping - covering all possible API field names
    const fieldMapping: Record<string, keyof typeof errors> = {
        // Snake case (API response)
        legal_name: 'legalName',
        user_name: 'username',
        username: 'username',
        business_type_id: 'businessTypeId',
        registration_number: 'registrationNumber',
        vat_number: 'vatNumber',
        registration_year: 'registrationYear',

        // Camel case (fallback)
        legalName: 'legalName',
        userName: 'username',
        businessTypeId: 'businessTypeId',
        registrationNumber: 'registrationNumber',
        vatNumber: 'vatNumber',
        registrationYear: 'registrationYear',
    }

    // Computed Properties
    const isSubmitting = computed(() => isSavingCompanyDetails.value)

    const canSubmit = computed(() => {
        return (
            form.legalName &&
            form.legalName.length > 0 &&
            form.username &&
            form.username.length > 0 &&
            form.businessTypeId &&
            form.registrationNumber &&
            form.registrationNumber.length > 0 &&
            form.vatNumber &&
            form.vatNumber.length > 0 &&
            form.registrationYear &&
            form.registrationYear.length > 0 &&
            !Object.values(errors).some((error) => error) &&
            !isSubmitting.value
        )
    })

    const yearOptions = computed(() => {
        const currentYear = new Date().getFullYear()
        const years = []
        for (let year = currentYear; year >= currentYear - 50; year--) {
            years.push({ value: year.toString(), label: year.toString() })
        }
        return years
    })

    // Enhanced backend error mapping function
    const mapBackendErrorsToFields = (backendErrors: Record<string, string | string[]>) => {
        Object.entries(backendErrors).forEach(([backendField, messages]) => {
            const message = Array.isArray(messages) ? messages[0] : messages
            const frontendField = fieldMapping[backendField]

            if (frontendField && frontendField in errors) {
                errors[frontendField] = message as string
            }
        })
    }

    // Enhanced store error sync - handles both direct store errors and field errors
    const syncStoreErrorsToFields = () => {
        const storeError = getError()
        const fieldErrors = getFieldErrors()

        // Priority 1: Check for field-specific errors from store
        if (hasFieldErrors() && fieldErrors) {
            mapBackendErrorsToFields(fieldErrors)
            return // Don't process general errors if we have field errors
        }

        // Priority 2: Check for 422 validation errors in store error
        if (storeError?.status === 422 && storeError.errors) {
            mapBackendErrorsToFields(storeError.errors)
            return
        }

        // Priority 3: Handle other error types with toasts
        if (storeError?.status === 409) {
            // Conflict errors (409): toast only - NO field display
            let conflictMessage = t('errors.generalSubmit', 'Operation failed. Please try again.')

            if (storeError.errors?.general) {
                conflictMessage = Array.isArray(storeError.errors.general)
                    ? storeError.errors.general[0]
                    : storeError.errors.general
            } else if (storeError.message) {
                conflictMessage = storeError.message
            }

            toast.error(conflictMessage, t('error', 'Error'))
        } else if (storeError && !hasFieldErrors()) {
            // Other general errors: toast only when no field errors
            const errorMessage =
                storeError.message ||
                t('errors.generalSubmit', 'Failed to save company profile. Please try again.')
            toast.error(errorMessage, t('error', 'Error'))
        }
    }

    // Form validation
    const validateForm = (): boolean => {
        clearAllErrors()

        const validationResult = validateData('companyProfile', companyProfileSchema, form)

        if (!validationResult.isValid) {
            validationResult.errors.forEach((error) => {
                if (error.field in errors) {
                    errors[error.field as keyof typeof errors] = error.message
                }
            })
        }

        return validationResult.isValid
    }

    // Clear field error on user input - blueprint pattern
    const clearFieldError = (field: keyof typeof errors) => {
        if (errors[field]) {
            errors[field] = ''
        }
        clearError() // Clear store errors when user starts typing
        updateCompanyProfileData()
    }

    // Clear all field errors - blueprint pattern
    const clearAllErrors = () => {
        Object.keys(errors).forEach((key) => {
            errors[key as keyof typeof errors] = ''
        })
        clearError()
    }

    // Update store
    const updateCompanyProfileData = () => {
        updateStepData('companyDetails', {
            section: 'profile',
            data: { ...form },
        })
    }

    // Enhanced submit handler with proper error handling
    const handleSubmit = async () => {
        clearAllErrors()

        // Validate form locally first
        if (!validateForm()) {
            return // Show validation errors on fields only
        }

        try {
            // Use specific method for company profile
            const { success } = await completeCompanyProfile({ ...form })

            if (success) {
                toast.success(
                    t('register.companyProfileSaved', 'Company profile saved successfully!'),
                    t('success', 'Success')
                )

                await router.push(localePath(`/register/company-details/detailed`))
            } else {
                syncStoreErrorsToFields()
            }
        } catch (error) {
            // Unexpected error - should not happen with proper store implementation
            console.error('[CompanyProfile] Unexpected error:', error)
            toast.error(
                t('errors.generalSubmit', 'Failed to save company profile. Please try again.'),
                t('error', 'Error')
            )
        }
    }

    // Go back handler
    const handleGoBack = async () => {
        updateCompanyProfileData()

        if (canGoBack.value) {
            await goBack()
        } else {
            await router.push(localePath('/register/confirm'))
        }
    }

    const loadUserCompanyData = async () => {
        try {
            const userCompanyDetails = await loadAndPopulateFieldRegistration('company_details')

            if (userCompanyDetails) {
                // Update form with user data if not already set
                form.legalName = form.legalName || userCompanyDetails.legal_name || ''
                form.username = form.username || userCompanyDetails.username || ''
                form.businessTypeId =
                    form.businessTypeId || userCompanyDetails.business_type?.id || ''
                form.registrationNumber =
                    form.registrationNumber || userCompanyDetails.registration_number || ''
                form.vatNumber = form.vatNumber || userCompanyDetails.vat_number || ''
                form.registrationYear =
                    form.registrationYear || userCompanyDetails.registration_year || ''
            }
        } catch (error) {
            console.error('[CompanyForm] Error loading user company data:', error)
        }
    }

    // Watch store errors and sync them to fields - enhanced pattern
    watch(
        () => [getError(), getFieldErrors(), hasFieldErrors()],
        ([newError, newFieldErrors, hasErrors]) => {
            if (newError || hasErrors) {
                syncStoreErrorsToFields()
            }
        },
        { immediate: true, deep: true }
    )

    // Watch form changes to update store - for consistency only
    watch(
        () => ({ ...form }),
        (newForm) => {
            updateStepData('companyDetails', {
                section: 'profile',
                data: newForm,
            })
        },
        { deep: true }
    )

    // Lifecycle
    onMounted(async () => {
        await loadUserCompanyData()
        initializeStep('companyDetails')
        isLoading.value = false

        // Check for any existing store errors
        syncStoreErrorsToFields()
    })
</script>
