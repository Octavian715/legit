<!-- ~/components/features/ecommerce/settings/tabs/ProductionTab.vue -->
<template>
    <div class="w-full space-y-3 mb-20">
        <!-- Production Details Section -->
        <section>
            <h2 class="text-subtitle3 text-gray-800 mb-3">
                {{ $t('register.production', 'Production Details') }}
            </h2>

            <div>
                <!-- Loading State -->
                <div v-if="isLoading" class="flex justify-center items-center py-12">
                    <div
                        class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"
                    ></div>
                </div>

                <!-- Empty State -->

                <NoDataPage
                    v-else-if="productionDetails.length === 0"
                    image="/images/register/no-productions.webp"
                    image-width="350px"
                    image-height="240px"
                    :title="$t('factory.noProductionFound', 'No Production found')"
                    :description="
                        $t(
                            'factory.noProductionDescription',
                            'You haven\'t set up any production processes yet. To manage your production lines, start by creating one.'
                        )
                    "
                    button-color="blue"
                    :button-label="
                        $t(
                            'addATemplate',
                            { template: $t('factory.factory', 'Production') },
                            'Add a Production'
                        )
                    "
                    @action="handleAddProduction"
                />

                <!-- Production Details List -->
                <div v-else class="space-y-3">
                    <Collapse
                        v-for="(detail, index) in productionDetails"
                        :key="detail.id || `production-${index}`"
                        :edit="true"
                        :close="true"
                        @edit="handleEditProduction(index, detail)"
                        @delete="handleDeleteProduction(index)"
                    >
                        <template #title>
                            <div class="flex items-center gap-2 flex-1">
                                <h3 class="font-medium text-gray-950 text-subtitle3">
                                    {{ detail.name }}
                                </h3>
                                <svg
                                    v-if="!detail.userFactorySizeId || !detail.countryId"
                                    class="w-5 h-5 text-amber-500"
                                    title="Missing required fields"
                                >
                                    <use :xlink:href="`/sprite.svg#warning`" />
                                </svg>
                            </div>
                        </template>

                        <div class="space-y-3">
                            <div
                                v-if="!detail.userFactorySizeId || !detail.countryId"
                                class="bg-amber-50 border border-amber-200 rounded p-3 text-amber-800 text-caption1"
                            >
                                {{
                                    $t(
                                        'factory.incompleteDetails',
                                        'This production detail is missing required information. Please edit to add factory size and country.'
                                    )
                                }}
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <FieldDisplay
                                    :label="$t('factory.chooseFactorySize', 'Factory size')"
                                    :value="getFactorySizeName(detail.userFactorySizeId)"
                                    :class="{
                                        'text-amber-600': !detail.userFactorySizeId,
                                    }"
                                />
                                <FieldDisplay
                                    :label="$t('company.chooseCountryOfRegistration', 'Country')"
                                    :value="getCountryName(detail.countryId)"
                                    :class="{ 'text-amber-600': !detail.countryId }"
                                />
                                <FieldDisplay
                                    v-if="detail.stateName"
                                    :label="$t('company.chooseState', 'State')"
                                    :value="detail.stateName"
                                />
                                <FieldDisplay
                                    :label="$t('company.city', 'City')"
                                    :value="detail.cityName"
                                />
                                <FieldDisplay
                                    :label="$t('company.street', 'Street')"
                                    :value="`${detail.streetName} ${detail.streetNumber}`"
                                />
                                <FieldDisplay
                                    :label="$t('company.postalCode', 'Postal Code')"
                                    :value="detail.postalCode"
                                />
                                <FieldDisplay
                                    v-if="detail.phoneNumber"
                                    :label="$t('company.phoneNumber', 'Phone')"
                                    :value="detail.phoneNumber"
                                />
                            </div>
                        </div>
                    </Collapse>

                    <!-- Add Another Production Button -->
                    <div class="flex justify-center">
                        <Button
                            variant="filled"
                            color="blue"
                            size="lg"
                            :label="
                                $t(
                                    'addATemplate',
                                    { template: $t('factory.factory', 'Production') },
                                    'Add a Production'
                                )
                            "
                            @click="handleAddProduction"
                        />
                    </div>
                </div>
            </div>
        </section>

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
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, watch, nextTick, onMounted } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useUserStore } from '~/stores/user'
    import { useToastNotification } from '~/composables/useToastNotification'
    import { useStaticData } from '~/composables/useStaticData'
    import type { ProductionDetailsFormData } from '~/utils/validator/schemas/auth/registerSchema'

    const { t } = useI18n()
    const userStore = useUserStore()
    const { error: showError } = useToastNotification()
    const { countries, factorySizes } = useStaticData()

    // Loading states
    const isLoading = ref(false)
    const isSubmittingModal = ref(false)
    const isInitializing = ref(false) // Prevent watch during load

    // Modal state
    const showModal = ref(false)
    const editingIndex = ref<number | null>(null)
    const editingDetail = ref<Partial<ProductionDetailsFormData> | null>(null)

    // Production details data
    const productionDetails = ref<ProductionDetailsFormData[]>([])

    // Original data for change detection
    const originalData = ref<ProductionDetailsFormData[]>([])

    // Session storage keys
    const PRODUCTION_STORAGE_KEY = 'productionTab_unsavedProductions'
    const ORIGINAL_STORAGE_KEY = 'productionTab_originalProductions'

    // Modal title
    const modalTitle = computed(() => {
        return editingIndex.value !== null
            ? t('modal.editfactoryAccount', 'Edit Production Details')
            : t('modal.addfactoryAccount', 'Add Production Details')
    })

    // Computed: Check if form is dirty (has unsaved changes)
    const isDirty = computed(() => {
        const currentData = JSON.stringify(productionDetails.value)
        const original = JSON.stringify(originalData.value)
        return currentData !== original
    })

    /**
     * Get factory size name from ID
     */
    const getFactorySizeName = (id: number | null) => {
        if (!id) return t('factory.notSet', 'Not set')
        const size = factorySizes.value.find((s) => s.id === id)
        return size?.name || '-'
    }

    /**
     * Get country name from ID
     */
    const getCountryName = (id: number | null) => {
        if (!id) return t('factory.notSet', 'Not set')
        const country = countries.value.find((c) => c.id === id)
        return country?.name || '-'
    }

    /**
     * Restore production details from sessionStorage
     */
    const restoreProductionsFromSession = (): boolean => {
        try {
            const savedProductions = sessionStorage.getItem(PRODUCTION_STORAGE_KEY)
            const savedOriginal = sessionStorage.getItem(ORIGINAL_STORAGE_KEY)

            if (savedProductions && savedOriginal) {
                isInitializing.value = true // Block watch

                productionDetails.value = JSON.parse(savedProductions)
                originalData.value = JSON.parse(savedOriginal)

                // Unblock watch on next tick
                nextTick(() => {
                    isInitializing.value = false
                })

                return true
            }
        } catch (error) {
            isInitializing.value = false
            // Silent fail
        }
        return false
    }

    /**
     * Save production details to sessionStorage
     */
    const saveProductionsToSession = () => {
        try {
            sessionStorage.setItem(PRODUCTION_STORAGE_KEY, JSON.stringify(productionDetails.value))
            sessionStorage.setItem(ORIGINAL_STORAGE_KEY, JSON.stringify(originalData.value))
        } catch (error) {
            // Silent fail
        }
    }

    /**
     * Clear production details from sessionStorage
     */
    const clearProductionsFromSession = () => {
        try {
            sessionStorage.removeItem(PRODUCTION_STORAGE_KEY)
            sessionStorage.removeItem(ORIGINAL_STORAGE_KEY)
        } catch (error) {
            // Silent fail
        }
    }

    /**
     * Load production details from user store
     */
    const loadProductionDetails = () => {
        // Check if we have cached data in session
        if (restoreProductionsFromSession()) {
            return
        }

        try {
            isLoading.value = true
            isInitializing.value = true // Block watch

            // Get factory_details from user store
            const factoryDetails = userStore.user?.factory_details || []

            // Transform backend data to frontend format
            productionDetails.value = factoryDetails.map((detail: any) => ({
                id: detail.id,
                name: detail.name,
                userFactorySizeId: detail.size?.id || null, // <-- CORECTAT
                countryId: detail.country?.id || null, // <-- CORECTAT
                stateName: detail.state_name || '',
                cityName: detail.city_name,
                streetName: detail.street_name,
                streetNumber: detail.street_number,
                postalCode: detail.postal_code,
                phoneNumber: detail.phone_number || '',
            }))

            originalData.value = JSON.parse(JSON.stringify(productionDetails.value))

            // Wait for next tick to save to session (after watch has been skipped)
            nextTick(() => {
                saveProductionsToSession()
                isInitializing.value = false // Unblock watch
            })
        } catch (error: any) {
            isInitializing.value = false
            showError(
                error.message ||
                    t('factory.errorLoadingProductions', 'Error loading production details'),
                t('error', 'Error')
            )
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Handle add production
     */
    const handleAddProduction = () => {
        editingIndex.value = null
        editingDetail.value = null
        showModal.value = true
    }

    /**
     * Handle edit production
     */
    const handleEditProduction = (index: number, detail: ProductionDetailsFormData) => {
        editingIndex.value = index
        editingDetail.value = { ...detail }
        showModal.value = true
    }

    /**
     * Handle save production (from modal)
     */
    const handleSaveProduction = async (productionData: ProductionDetailsFormData) => {
        try {
            isSubmittingModal.value = true

            if (editingIndex.value !== null) {
                // Update existing production
                productionDetails.value[editingIndex.value] = productionData
            } else {
                // Add new production
                productionDetails.value.push(productionData)
            }

            // Watch will auto-save to session

            // Close modal
            handleCloseModal()
        } catch (error: any) {
            showError(
                error.message || t('factory.errorSavingProduction', 'Error saving production'),
                t('error', 'Error')
            )
        } finally {
            isSubmittingModal.value = false
        }
    }

    /**
     * Handle delete production
     */
    const handleDeleteProduction = (index: number) => {
        productionDetails.value.splice(index, 1)

        // Watch will auto-save to session
    }

    /**
     * Handle close modal
     */
    const handleCloseModal = () => {
        showModal.value = false
        editingIndex.value = null
        editingDetail.value = null
    }

    /**
     * Validate form
     */
    const validate = () => {
        // Check if all production details have required fields
        const invalidProductions = productionDetails.value.filter(
            (detail) => !detail.userFactorySizeId || !detail.countryId
        )

        if (invalidProductions.length > 0) {
            showError(
                t(
                    'factory.missingRequiredFields',
                    'Some production details are missing required fields (factory size or country)'
                ),
                t('error', 'Error')
            )
            return { isValid: false, errors: [] }
        }

        return { isValid: true, errors: [] }
    }

    /**
     * Save production details to backend
     */
    const save = async (): Promise<boolean> => {
        try {
            // Validate first
            const validation = validate()
            if (!validation.isValid) {
                return false
            }

            // Filter only complete production details (with required fields)
            const completeProductions = productionDetails.value.filter(
                (detail) => detail.userFactorySizeId && detail.countryId
            )

            if (completeProductions.length === 0) {
                showError(
                    t(
                        'factory.noValidProductions',
                        'No valid production details to save. Please add factory size and country.'
                    ),
                    t('error', 'Error')
                )
                return false
            }

            // Transform frontend data to backend format
            const factoryDetailsPayload = completeProductions.map((detail) => ({
                id: detail.id || undefined,
                name: detail.name,
                user_factory_size_id: detail.userFactorySizeId,
                country_id: detail.countryId,
                state_name: detail.stateName || undefined,
                city_name: detail.cityName,
                street_name: detail.streetName,
                street_number: detail.streetNumber,
                postal_code: detail.postalCode,
                phone_number: detail.phoneNumber || undefined,
            }))

            // Use userStore.updateProfile with factory_details
            await userStore.updateProfile({
                factory_details: factoryDetailsPayload,
            })

            // Update original data after successful save
            originalData.value = JSON.parse(JSON.stringify(productionDetails.value))

            // Clear session storage
            clearProductionsFromSession()

            return true
        } catch (error: any) {
            showError(
                error.message || t('settings.errorSavingChanges', 'Error saving changes'),
                t('error', 'Error')
            )
            return false
        }
    }

    /**
     * Reset form to original data
     */
    const reset = () => {
        productionDetails.value = JSON.parse(JSON.stringify(originalData.value))

        // Clear session storage
        clearProductionsFromSession()
    }

    // Watch production details changes to auto-save to sessionStorage
    watch(
        productionDetails,
        () => {
            // Skip if initializing to prevent infinite loop
            if (isInitializing.value) {
                return
            }

            // Only save if there are actual changes
            if (isDirty.value) {
                saveProductionsToSession()
            }
        },
        { deep: true }
    )

    // Load production details on mount
    onMounted(() => {
        loadProductionDetails()
    })

    // Expose methods to parent
    defineExpose({
        validate,
        save,
        reset,
        isDirty,
    })
</script>
