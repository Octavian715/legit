<!-- pages/register/company-details/detailed.vue -->
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
                {{ $t('company.details', 'Company Details') }}
            </h2>
            <p class="text-subtitle3 text-gray-700 text-center mt-2">
                {{ $t('stepOf', { n: '2/6' }, `Step 2/6`) }}
            </p>
        </template>

        <div class="mt-3">
            <!-- Loading State -->
            <div v-if="isLoading" class="flex justify-center items-center p-8">
                <span class="loader"></span>
            </div>

            <!-- Other Details Form -->
            <form
                v-else
                class="flex flex-col gap-3 w-full md:w-1/2 mx-auto"
                novalidate
                @submit.prevent="handleSubmit"
            >
                <!-- Spoken Languages -->

                <MultiSelect
                    v-model="form.spokenLanguages"
                    :label="$t('company.chooseSpokenLanguages', 'Choose spoken languages')"
                    name="spokenLanguages"
                    background="bg-white"
                    :error="!!errors.spokenLanguages"
                    :error-message="errors.spokenLanguages"
                    required
                    size="lg"
                    multiple
                    :options="languageOptions"
                    @update:model-value="clearFieldError('spokenLanguages')"
                />

                <!-- Revenue Range -->
                <Select
                    v-model="form.revenueRangeId"
                    :label="$t('company.totalAnnualRevenue', 'Total annual revenue')"
                    name="revenueRangeId"
                    background="bg-white"
                    :error="!!errors.revenueRangeId"
                    :error-message="errors.revenueRangeId"
                    required
                    size="lg"
                    :options="revenueRangeOptions"
                    @update:model-value="clearFieldError('revenueRangeId')"
                />

                <!-- Total No. of employees -->
                <Select
                    v-model="form.employeeCountRangeId"
                    :label="$t('company.totalNumberOfEmployees', 'Total No. of employees')"
                    name="employeeCountRangeId"
                    background="bg-white"
                    :error="!!errors.employeeCountRangeId"
                    :error-message="errors.employeeCountRangeId"
                    required
                    size="lg"
                    :options="employeeRangeOptions"
                    @update:model-value="clearFieldError('employeeCountRangeId')"
                />

                <!-- Website URL -->
                <Input
                    v-model="form.websiteUrl"
                    :label="$t('company.website', 'Website URL')"
                    name="websiteUrl"
                    background="bg-white"
                    :error="!!errors.websiteUrl"
                    :error-message="errors.websiteUrl"
                    autocomplete="url"
                    type="url"
                    @input="clearFieldError('websiteUrl')"
                />

                <!-- Company Description -->
                <Textarea
                    v-model="form.description"
                    :label="$t('company.description', 'Company description')"
                    name="description"
                    background="bg-white"
                    :maxlength="1000"
                    :error="!!errors.description"
                    :error-message="errors.description"
                    @input="clearFieldError('description')"
                />

                <!-- Navigation Buttons -->
                <div class="flex flex-col sm:flex-row gap-3 justify-between mt-3">
                    <Button
                        type="button"
                        variant="filled"
                        color="gray"
                        :label="$t('prevStep', 'Previous Step')"
                        class="w-full"
                        :disabled="isSubmitting"
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
    import { validateData } from '~/utils/validator/index'
    import { useRegistrationNavigation } from '~/composables/useRegistrationNavigation'
    import { useToastNotification } from '~/composables/useToastNotification'
    import { useStaticData } from '~/composables/useStaticData'

    // Import the schema from your registerSchema.ts
    import {
        companyDetailedSchema,
        type CompanyDetailedFormData,
    } from '~/utils/validator/schemas/auth/registerSchema'

    definePageMeta({ middleware: ['registration'], layout: 'auth' })

    // Composables
    const { t } = useI18n({ useScope: 'global' })
    const localePath = useLocalePath()
    const { languageOptions, employeeRangeOptions, revenueRangeOptions } = useStaticData()
    const router = useRouter()
    const {
        getStepData,
        updateStepData,
        initializeStep,
        isSavingCompanyDetails,

        getError,
        getFieldErrors,
        hasFieldErrors,
        clearError,
        completeDetailedDetails,
        loadAndPopulateFieldRegistration,
    } = useRegistrationNavigation()
    const toast = useToastNotification()

    // State
    const isLoading = ref(true)

    // Get current data
    const companyData = getStepData('companyDetails') as any

    // Form data - using exact schema field names
    const form = reactive<CompanyDetailedFormData>({
        spokenLanguages: companyData?.detailed?.spokenLanguages || [],
        revenueRangeId: companyData?.detailed?.revenueRangeId || 0,
        employeeCountRangeId: companyData?.detailed?.employeeCountRangeId || 0,
        websiteUrl: companyData?.detailed?.websiteUrl || '',
        description: companyData?.detailed?.description || '',
    })

    // Field errors only - according to blueprint
    const errors = reactive({
        spokenLanguages: '',
        revenueRangeId: '',
        employeeCountRangeId: '',
        websiteUrl: '',
        description: '',
    })

    // Enhanced backend error mapping
    const fieldMapping: Record<string, keyof typeof errors> = {
        // Snake case (API response)
        spoken_languages: 'spokenLanguages',
        revenue_range_id: 'revenueRangeId',
        employee_count_range_id: 'employeeCountRangeId',
        website_url: 'websiteUrl',
        company_description: 'description',

        // Camel case (fallback)
        spokenLanguages: 'spokenLanguages',
        revenueRangeId: 'revenueRangeId',
        employeeCountRangeId: 'employeeCountRangeId',
        websiteUrl: 'websiteUrl',
        description: 'description',
    }

    // Computed Properties
    const isSubmitting = computed(() => isSavingCompanyDetails.value)

    const canSubmit = computed(() => {
        return (
            form.spokenLanguages &&
            form.spokenLanguages.length > 0 &&
            form.revenueRangeId > 0 &&
            form.employeeCountRangeId > 0 &&
            !Object.values(errors).some((error) => error) &&
            !isSubmitting.value
        )
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

    // Enhanced store error sync
    const syncStoreErrorsToFields = () => {
        const storeError = getError()
        const fieldErrors = getFieldErrors()

        // Priority 1: Check for field-specific errors from store
        if (hasFieldErrors() && fieldErrors) {
            mapBackendErrorsToFields(fieldErrors)
            return
        }

        // Priority 2: Check for 422 validation errors in store error
        if (storeError?.status === 422 && storeError.errors) {
            mapBackendErrorsToFields(storeError.errors)
            return
        }

        // Priority 3: Handle other error types with toasts
        if (storeError && !hasFieldErrors()) {
            const errorMessage =
                storeError.message ||
                t('errors.generalSubmit', 'Failed to save other details. Please try again.')
            toast.error(errorMessage, t('error', 'Error'))
        }
    }

    // Form validation
    const validateForm = (): boolean => {
        const validationResult = validateData('companyDetailed', companyDetailedSchema, form)

        if (!validationResult.isValid) {
            validationResult.errors.forEach((error) => {
                if (error.field in errors) {
                    errors[error.field as keyof typeof errors] = error.message
                }
            })
        }

        return validationResult.isValid
    }

    // Clear field error on user input
    const clearFieldError = (field: keyof typeof errors) => {
        if (errors[field]) {
            errors[field] = ''
        }
        clearError()
        updateCompanyDetailedData()
    }

    // Clear all field errors
    const clearAllErrors = () => {
        Object.keys(errors).forEach((key) => {
            errors[key as keyof typeof errors] = ''
        })
        clearError()
    }

    // Update store
    const updateCompanyDetailedData = () => {
        updateStepData('companyDetails', {
            section: 'detailed',
            data: { ...form },
        })
    }

    // Enhanced submit handler
    const handleSubmit = async () => {
        clearAllErrors()

        // Validate form locally first
        if (!validateForm()) {
            return
        }

        try {
            // Use specific method for other details (substep 2)
            const { success, nextStep } = await completeDetailedDetails({ ...form })

            if (success) {
                toast.success(
                    t('register.companyDetailedSaved', 'Other details saved successfully!'),
                    t('success', 'Success')
                )

                await router.push(localePath('/register/company-details/address'))
            } else {
                syncStoreErrorsToFields()
            }
        } catch (error) {
            toast.error(
                t('errors.generalSubmit', 'Failed to save other details. Please try again.'),
                t('error', 'Error')
            )
        }
    }

    // Go back handler
    const handleGoBack = async () => {
        router.push(localePath('/register/company-details/profile'))
    }

    const loadUserCompanyDetailsData = async () => {
        try {
            const userCompanyDetails = await loadAndPopulateFieldRegistration('company_details')
            const spokenLanguages = await loadAndPopulateFieldRegistration('spoken_languages')

            if (userCompanyDetails || spokenLanguages) {
                // Update form with user data if not already set
                // Note: Use length check for arrays since empty arrays are truthy
                form.spokenLanguages =
                    form.spokenLanguages?.length > 0
                        ? form.spokenLanguages
                        : spokenLanguages?.map((item: any) => item.id) || []
                form.revenueRangeId =
                    form.revenueRangeId || userCompanyDetails?.revenue_range?.id || 0
                form.employeeCountRangeId =
                    form.employeeCountRangeId || userCompanyDetails?.employee_count_range?.id || 0
                form.websiteUrl = form.websiteUrl || userCompanyDetails?.website_url || ''
                form.description = form.description || userCompanyDetails?.description || ''
            }
        } catch (error) {
            console.error('[CompanyForm] Error loading user company data:', error)
        }
    }

    // Watch store errors and sync them to fields
    watch(
        () => [getError(), getFieldErrors(), hasFieldErrors()],
        ([newError, newFieldErrors, hasErrors]) => {
            if (newError || hasErrors) {
                syncStoreErrorsToFields()
            }
        },
        { immediate: true, deep: true }
    )

    // Watch form changes to update store
    watch(
        () => ({ ...form }),
        (newForm) => {
            updateStepData('companyDetails', {
                section: 'detailed',
                data: newForm,
            })
        },
        { deep: true }
    )

    // Lifecycle
    onMounted(async () => {
        await loadUserCompanyDetailsData()
        initializeStep('companyDetails')
        isLoading.value = false

        // Check for any existing store errors
        syncStoreErrorsToFields()
    })
</script>

<style scoped>
    .space-y-4 > * + * {
        margin-top: 1rem;
    }
</style>
