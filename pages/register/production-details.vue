<!-- pages/register/production-details.vue -->
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
                {{ $t('register.production', 'Production') }}
            </h2>
        </template>

        <div>
            <!-- Loading State -->
            <div v-if="isLoading" class="flex justify-center items-center p-8">
                <span class="loader"></span>
            </div>

            <!-- Production Details Management -->
            <div v-else class="w-full max-w-2xl mx-auto">
                <!-- Empty State -->
                <div v-if="form.productionDetails.length === 0" class="text-center">
                    <!-- <NuxtImg
                        src="/public/images/register/no-productions.webp"
                        :alt="$t('factory.factory', 'production')"
                        class="max-h-64 w-full h-full object-contain transition-transform duration-200"
                        loading="lazy"
                    /> -->
                    <img
                        src="/public/images/register/no-productions.webp"
                        :alt="$t('factory.factory', 'production')"
                        class="max-h-64 w-full h-full object-contain transition-transform duration-200"
                        loading="lazy"
                    />
                    <!-- Add Production Button -->
                    <Button
                        variant="filled"
                        color="blue"
                        size="lg"
                        :label="
                            $t(
                                'addATemplate',
                                { template: t('factory.factory', 'Production') },
                                'Add a Production'
                            )
                        "
                        :disabled="isSubmitting"
                        class="w-full max-w-md mx-auto"
                        @click="handleAddProduction"
                    />
                </div>

                <!-- Production Details List -->
                <div v-else class="space-y-4 pt-3">
                    <div
                        v-for="(detail, index) in form.productionDetails"
                        :key="detail.id || index"
                    >
                        <ProductionDetailItem
                            :detail="detail"
                            :index="index"
                            :is-editing="editingIndex === index"
                            @edit="handleEditProduction(index, detail)"
                            @delete="handleDeleteProduction(index)"
                            @save="handleSaveProduction"
                            @cancel="handleCancelEdit"
                        />
                    </div>

                    <!-- Add Another Production Button -->
                    <div class="flex w-full max-w-md mx-auto">
                        <Button
                            variant="filled"
                            color="blue"
                            size="lg"
                            :label="
                                $t(
                                    'addATemplate',
                                    { template: t('factory.factory', 'Production') },
                                    'Add a Production'
                                )
                            "
                            :disabled="isSubmitting"
                            class="w-full"
                            @click="handleAddProduction"
                        />
                    </div>
                </div>

                <!-- Error Display -->
                <div v-if="errors.productionDetails" class="text-center mt-4">
                    <p class="text-caption1 text-red-500" role="alert">
                        {{ errors.productionDetails }}
                    </p>
                </div>

                <!-- Navigation Buttons -->
                <div class="flex flex-col mt-6 w-full max-w-md mx-auto gap-6">
                    <div class="flex flex-col sm:flex-row gap-3 justify-between">
                        <Button
                            type="button"
                            variant="filled"
                            color="gray"
                            font-weight="normal"
                            :label="$t('prevStep', 'Previous step')"
                            class="w-full"
                            :disabled="isSubmitting"
                            @click="handleGoBack"
                        />

                        <Button
                            type="button"
                            variant="filled"
                            color="red"
                            :label="$t('nextStep', 'Next step')"
                            class="w-full"
                            :loading="isSubmitting"
                            :disabled="!canSubmit"
                            @click="handleSubmit"
                        />
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        font-weight="normal"
                        color="blue"
                        :label="$t('skip', 'Skip')"
                        class="w-full"
                        :disabled="isSubmitting"
                        @click="handleSkip"
                    />
                </div>
            </div>
        </div>

        <!-- Add/Edit Production Modal -->
        <Modal
            v-model:is-open="showModal"
            :title="modalTitle"
            content-width="sm:max-w-md"
            hide-footer
            @close="handleCloseModal"
        >
            <ProductionDetailForm
                :initial-data="editingDetail"
                :is-submitting="isSubmittingModal"
                show-actions
                @save="handleSaveProduction"
                @cancel="handleCloseModal"
            />
        </Modal>
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
    import { NuxtImg } from '#components'

    import {
        productionDetailsSchema,
        type ProductionDetailsFormData,
    } from '~/utils/validator/schemas/auth/registerSchema'

    definePageMeta({ middleware: ['registration'], layout: 'auth' })

    // Composables
    const { t } = useI18n({ useScope: 'global' })
    const localePath = useLocalePath()
    const router = useRouter()
    const {
        getStepData,
        updateStepData,
        initializeStep,
        isSavingProductionDetails,
        goBack,
        canGoBack,
        getError,
        getFieldErrors,
        hasFieldErrors,
        clearError,
        completeProductionDetails,
        accountTypeData,
        loadAndPopulateFieldRegistration,
    } = useRegistrationNavigation()

    const toast = useToastNotification()
    const registerStore = useRegistrationStore()

    // State
    const isLoading = ref(true)
    const showModal = ref(false)
    const editingIndex = ref<number | null>(null)
    const editingDetail = ref<Partial<ProductionDetailsFormData> | null>(null)
    const isSubmittingModal = ref(false)

    // Get current data
    const productionData = getStepData('productionDetails') as any
    // Form data - array of production details
    const form = reactive({
        productionDetails:
            (productionData && Array.isArray(productionData) ? productionData : []) || [],
    })

    // Field errors
    const errors = reactive({
        productionDetails: '',
    })

    // Enhanced backend error mapping
    const fieldMapping: Record<string, keyof typeof errors> = {
        production_details: 'productionDetails',
        productionDetails: 'productionDetails',
    }

    // Computed Properties
    const isSubmitting = computed(() => isSavingProductionDetails.value)

    const canSubmit = computed(() => {
        return (
            form.productionDetails.length > 0 &&
            !Object.values(errors).some((error) => error) &&
            !isSubmitting.value
        )
    })

    const modalTitle = computed(() => {
        return editingIndex.value !== null
            ? t('modal.editProduct', 'Edit Production Details')
            : t('modal.addfactoryAccount', 'Add Production Details')
    })

    // Methods
    const handleAddProduction = () => {
        editingIndex.value = null
        editingDetail.value = null
        showModal.value = true
    }

    const handleSkip = async () => {
        try {
            // Clear any existing errors
            clearAllErrors()

            // const productionDetailsData = form.productionDetails.map((detail) => ({
            //     name: detail.name,
            //     user_factory_size_id: detail.userFactorySizeId,
            //     country_id: detail.countryId,
            //     state_name: detail.stateName,
            //     city_name: detail.cityName,
            //     street_name: detail.streetName,
            //     street_number: detail.streetNumber,
            //     postal_code: detail.postalCode,
            // }))

            const { success } = await registerStore.completeProductionDetails(
                1,
                {}, //{ factory_details: productionDetailsData },
                'export-details',
                1
            )

            if (!success) {
                toast.error(
                    t('error.navigationFailed', 'Failed to navigate. Please try again.'),
                    t('error', 'Error')
                )
                return
            }

            // Show confirmation toast
            toast.info(
                t(
                    'production.productionDetailsSkipped',
                    'Production details skipped. You can add them later from settings.'
                ),
                t('info', 'Info')
            )

            await router.push(localePath('/register/export-details'))
        } catch (error) {
            toast.error(
                t('error.navigationFailed', 'Failed to navigate. Please try again.'),
                t('error', 'Error')
            )
        }
    }

    const handleEditProduction = (index: number, detail: ProductionDetailsFormData) => {
        editingIndex.value = index
        editingDetail.value = { ...detail }
        showModal.value = true
    }

    const handleDeleteProduction = (index: number) => {
        form.productionDetails.splice(index, 1)
        clearFieldError('productionDetails')
        updateProductionData()

        toast.success(
            t('production.detailRemoved', 'Production detail removed successfully'),
            t('success', 'Success')
        )
    }

    const handleSaveProduction = async (detailData: ProductionDetailsFormData) => {
        isSubmittingModal.value = true

        try {
            if (editingIndex.value !== null) {
                form.productionDetails[editingIndex.value] = { ...detailData }
                toast.success(
                    t('production.detailUpdated', 'Production detail updated successfully'),
                    t('success', 'Success')
                )
            } else {
                form.productionDetails.push({ ...detailData })
                toast.success(
                    t('production.detailAdded', 'Production detail added successfully'),
                    t('success', 'Success')
                )
            }

            clearFieldError('productionDetails')
            updateProductionData()
            handleCloseModal()
        } catch (error) {
            toast.error(
                t('errors.generalSubmit', 'Failed to save production detail. Please try again.'),
                t('error', 'Error')
            )
        } finally {
            isSubmittingModal.value = false
        }
    }

    const handleCancelEdit = () => {
        editingIndex.value = null
    }

    const handleCloseModal = () => {
        showModal.value = false
        editingIndex.value = null
        editingDetail.value = null
        isSubmittingModal.value = false
    }

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

        if (hasFieldErrors() && fieldErrors) {
            mapBackendErrorsToFields(fieldErrors)
            return
        }

        if (storeError?.status === 422 && storeError.errors) {
            mapBackendErrorsToFields(storeError.errors)
            return
        }

        if (storeError && !hasFieldErrors()) {
            const errorMessage =
                storeError.message ||
                t('errors.generalSubmit', 'Failed to save production details. Please try again.')
            toast.error(errorMessage, t('error', 'Error'))
        }
    }

    // Form validation - validate individual production details
    const validateForm = (): boolean => {
        clearAllErrors()

        // Check if we have at least one production detail
        if (form.productionDetails.length === 0) {
            errors.productionDetails = t(
                'validation.productionDetailRequired',
                'At least one production detail is required'
            )
            return false
        }

        // Validate each production detail
        let allValid = true
        for (const detail of form.productionDetails) {
            const validationResult = validateData(
                'productionDetails',
                productionDetailsSchema,
                detail
            )
            if (!validationResult.isValid) {
                allValid = false
                errors.productionDetails = t(
                    'validation.invalidProductionDetails',
                    'Please check all production detail information'
                )
                break
            }
        }

        return allValid
    }

    // Clear field error
    const clearFieldError = (field: keyof typeof errors) => {
        if (errors[field]) {
            errors[field] = ''
        }
        clearError()
    }

    // Clear all field errors
    const clearAllErrors = () => {
        Object.keys(errors).forEach((key) => {
            errors[key as keyof typeof errors] = ''
        })
        clearError()
    }

    // Update store
    const updateProductionData = () => {
        updateStepData('productionDetails', [...form.productionDetails])
    }

    // Enhanced submit handler
    const handleSubmit = async () => {
        clearAllErrors()

        if (!validateForm()) {
            return
        }

        try {
            // Prepare production details data for backend
            const productionDetailsData = form.productionDetails.map((detail) => ({
                name: detail.name,
                user_factory_size_id: detail.userFactorySizeId,
                country_id: detail.countryId,
                state_name: detail.stateName,
                city_name: detail.cityName,
                street_name: detail.streetName,
                street_number: detail.streetNumber,
                postal_code: detail.postalCode,
            }))

            const { success, nextStep } = await completeProductionDetails(1, productionDetailsData)

            if (success) {
                toast.success(
                    t('register.productionDetailsSaved', 'Production details saved successfully!'),
                    t('success', 'Success')
                )

                // Navigate based on account type and next step
                if (nextStep && nextStep !== 'production-details') {
                    const stepRoutes = {
                        'export-details': 'export-details',
                        certificates: 'certificates',
                        'public-profile': 'public-profile',
                    }

                    const route = stepRoutes[nextStep as keyof typeof stepRoutes]
                    if (route) {
                        await router.push(localePath(`/register/${route}`))
                    } else {
                        await router.push(localePath('/marketplace'))
                    }
                } else {
                    // Default next step for suppliers
                    if (accountTypeData?.value.type === 'supplier') {
                        await router.push(localePath('/register/export-details'))
                    } else {
                        await router.push(localePath('/register/company-certificates'))
                    }
                }
            } else {
                syncStoreErrorsToFields()
            }
        } catch (error) {
            toast.error(
                t('errors.generalSubmit', 'Failed to save production details. Please try again.'),
                t('error', 'Error')
            )
        }
    }

    // Go back handler
    const handleGoBack = async () => {
        updateProductionData()

        await router.push(localePath('/register/company-details/banks'))
    }

    // Fixed: Load production details from user data without API call
    const loadProductionDetails = async () => {
        try {
            // Check if we can load from the existing composable function
            const existingData = await loadAndPopulateFieldRegistration('factory_details')

            if (existingData?.length) {
                form.productionDetails = existingData.map((factory: any) => ({
                    id: factory.id || null,
                    name: factory.name,
                    userFactorySizeId: factory?.size?.id || null,
                    countryId: factory?.country?.id || null,
                    stateName: factory?.stateName || null,
                    cityName: factory?.city_name,
                    streetName: factory?.street_name,
                    postalCode: factory?.postal_code,
                    streetNumber: factory?.street_number,
                }))
            }
        } catch (error) {
            console.error('[ProductionDetails] Error loading production details:', error)
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
            updateStepData('productionDetails', newForm.productionDetails)
        },
        { deep: true }
    )

    // Lifecycle
    onMounted(async () => {
        // Load production details from user data
        await loadProductionDetails()

        // Initialize step
        initializeStep('productionDetails')

        // Set loading to false
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
