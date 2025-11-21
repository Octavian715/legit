<!-- pages/register/company-details/address.vue -->
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
                {{ $t('register.companyAddress', 'Company Address') }}
            </h2>
            <p class="text-subtitle3 text-gray-700 text-center mt-2">
                {{ $t('stepOf', { n: '3/6' }, `Step 3/6`) }}
            </p>
        </template>

        <div class="mt-3">
            <!-- Loading State -->
            <div v-if="isLoading" class="flex justify-center items-center p-8">
                <span class="loader"></span>
            </div>

            <!-- Company Address Form -->
            <form
                v-else
                class="flex flex-col gap-4 w-full max-w-md mx-auto"
                novalidate
                @submit.prevent="handleSubmit"
            >
                <!-- Country -->
                <Select
                    v-model="form.countryId"
                    :label="$t('company.chooseCountry', 'Choose country')"
                    name="countryId"
                    background="bg-white"
                    :error="!!errors.countryId"
                    :error-message="errors.countryId"
                    required
                    clearable
                    size="lg"
                    :options="countryOptions"
                    @update:model-value="clearFieldError('countryId')"
                />

                <Input
                    v-model="form.stateName"
                    :label="$t('company.chooseState', 'Choose state')"
                    name="stateName"
                    background="bg-white"
                    :error="!!errors.stateName"
                    :error-message="errors.stateName"
                    @input="clearFieldError('stateName')"
                />

                <!-- City -->
                <Input
                    v-model="form.cityName"
                    :label="$t('company.enterYourCity', 'Enter your city')"
                    name="cityName"
                    background="bg-white"
                    :error="!!errors.cityName"
                    :error-message="errors.cityName"
                    required
                    @input="clearFieldError('cityName')"
                />

                <!-- Street Name -->
                <Input
                    v-model="form.streetName"
                    :label="$t('company.street', 'Street')"
                    name="streetName"
                    background="bg-white"
                    :error="!!errors.streetName"
                    :error-message="errors.streetName"
                    required
                    @input="clearFieldError('streetName')"
                />

                <!-- Street Number and Postal Code - Side by Side -->
                <div class="flex gap-3">
                    <!-- Street Number -->
                    <div class="flex-1">
                        <Input
                            v-model="form.streetNumber"
                            :label="$t('company.number', 'Number')"
                            name="streetNumber"
                            background="bg-white"
                            :error="!!errors.streetNumber"
                            :error-message="errors.streetNumber"
                            required
                            @input="clearFieldError('streetNumber')"
                        />
                    </div>

                    <!-- Postal Code -->
                    <div class="flex-1">
                        <Input
                            v-model="form.postalCode"
                            :label="$t('company.postalCode', 'Postal code')"
                            name="postalCode"
                            background="bg-white"
                            :error="!!errors.postalCode"
                            :error-message="errors.postalCode"
                            required
                            @input="clearFieldError('postalCode')"
                        />
                    </div>
                </div>

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
    import { validateData } from '~/utils/validator'
    import { useRegistrationNavigation } from '~/useRegistrationNavigation'
    import { useToastNotification } from '~/composables/useToastNotification'
    import { useStaticData } from '~/composables/useStaticData'

    // Import the schema from your registerSchema.ts
    import {
        companyAddressSchema,
        type CompanyAddressFormData,
    } from '~/utils/validator/schemas/auth/registerSchema'

    definePageMeta({ middleware: ['registration'], layout: 'auth' })

    // Composables
    const { t } = useI18n({ useScope: 'global' })
    const localePath = useLocalePath()
    const router = useRouter()
    const { countryOptions } = useStaticData()

    const {
        getStepData,
        updateStepData,
        initializeStep,
        isSavingCompanyDetails,
        getError,
        getFieldErrors,
        hasFieldErrors,
        clearError,
        completeCompanyAddress,
        loadAndPopulateFieldRegistration,
    } = useRegistrationNavigation()
    const toast = useToastNotification()

    // State
    const isLoading = ref(true)

    // Get current data
    const companyData = getStepData('companyDetails') as any

    // Form data - using exact schema field names
    const form = reactive<CompanyAddressFormData>({
        countryId: companyData?.address?.countryId || 0,
        stateName: companyData?.address?.stateName,
        cityName: companyData?.address?.cityName || '',
        streetName: companyData?.address?.streetName || '',
        streetNumber: companyData?.address?.streetNumber || '',
        postalCode: companyData?.address?.postalCode || '',
    })

    // Field errors only - according to blueprint
    const errors = reactive({
        countryId: '',
        stateName: '',
        cityName: '',
        streetName: '',
        streetNumber: '',
        postalCode: '',
    })

    // Enhanced backend error mapping
    const fieldMapping: Record<string, keyof typeof errors> = {
        // Snake case (API response)
        country_id: 'countryId',
        state_name: 'stateName',
        city_name: 'cityName',
        street_name: 'streetName',
        street_number: 'streetNumber',
        postal_code: 'postalCode',

        // Camel case (fallback)
        countryId: 'countryId',
        stateName: 'stateName',
        cityName: 'cityName',
        streetName: 'streetName',
        streetNumber: 'streetNumber',
        postalCode: 'postalCode',
    }

    // Computed Properties
    const isSubmitting = computed(() => isSavingCompanyDetails.value)

    const canSubmit = computed(() => {
        return (
            form.countryId > 0 &&
            form.cityName.length > 0 &&
            form.streetName.length > 0 &&
            form.streetNumber.length > 0 &&
            form.postalCode.length > 0 &&
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
                t('errors.generalSubmit', 'Failed to save address details. Please try again.')
            toast.error(errorMessage, t('error', 'Error'))
        }
    }

    // Form validation
    const validateForm = (): boolean => {
        const validationResult = validateData('companyAddress', companyAddressSchema, form)

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
        updateCompanyAddressData()
    }

    // Clear all field errors
    const clearAllErrors = () => {
        Object.keys(errors).forEach((key) => {
            errors[key as keyof typeof errors] = ''
        })
        clearError()
    }

    // Update store
    const updateCompanyAddressData = () => {
        updateStepData('companyDetails', {
            section: 'address',
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
            // Use specific method for address details (substep 3)
            const { success } = await completeCompanyAddress({ ...form })

            if (success) {
                toast.success(
                    t('register.companyAddressSaved', 'Company address saved successfully!'),
                    t('success', 'Success')
                )

                // Continue to next substep
                await router.push(localePath('/register/company-details/topics'))
            } else {
                syncStoreErrorsToFields()
            }
        } catch (error) {
            toast.error(
                t('errors.generalSubmit', 'Failed to save address details. Please try again.'),
                t('error', 'Error')
            )
        }
    }

    // Go back handler
    const handleGoBack = async () => {
        updateCompanyAddressData()

        router.push(localePath('/register/company-details/detailed'))
    }

    const loadUserCompanyAddressData = async () => {
        try {
            const userCompanyDetails = await loadAndPopulateFieldRegistration('company_details')

            if (userCompanyDetails) {
                // Update form with user data if not already set
                form.countryId =
                    companyData?.address?.countryId || userCompanyDetails?.country?.id || 0
                form.stateName = companyData?.address?.stateName || userCompanyDetails?.state_name
                form.cityName = companyData?.address?.cityName || userCompanyDetails.city_name || ''
                form.streetName =
                    companyData?.address?.streetName || userCompanyDetails.street_name || ''
                form.streetNumber =
                    companyData?.address?.streetNumber || userCompanyDetails.street_number || ''
                form.postalCode =
                    companyData?.address?.postalCode || userCompanyDetails.postal_code || ''
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
                section: 'address',
                data: newForm,
            })
        },
        { deep: true }
    )

    // Reset dependent fields when parent selection changes
    watch(
        () => form.countryId,
        (newCountryId, oldCountryId) => {
            if (newCountryId !== oldCountryId && oldCountryId !== 0) {
                form.stateName = 0
            }
        }
    )

    // Lifecycle
    onMounted(async () => {
        await loadUserCompanyAddressData()
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
