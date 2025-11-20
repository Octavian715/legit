<template>
    <div class="delivery-tab space-y-3">
        <h2 class="text-subtitle2 text-gray-800 py-1">
            {{ t('settings.delivery.deliveryLocations') }}
        </h2>

        <!-- Loading State -->
        <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            <div v-for="n in 3" :key="n" class="animate-pulse">
                <div class="bg-white border border-gray-400 rounded-sm p-4">
                    <div class="flex justify-between items-start mb-3">
                        <div class="h-5 bg-gray-300 rounded w-32"></div>
                        <div v-if="n === 1" class="h-5 bg-blue-100 rounded w-16"></div>
                    </div>
                    <div class="space-y-2 mt-4">
                        <div class="h-3 bg-gray-300 rounded w-full"></div>
                        <div class="h-3 bg-gray-300 rounded w-3/4"></div>
                        <div class="h-3 bg-gray-300 rounded w-2/3"></div>
                    </div>
                    <div class="pt-3 mt-3 border-t border-gray-400">
                        <div class="h-3 bg-gray-300 rounded w-32"></div>
                    </div>
                    <div class="flex gap-2 mt-4">
                        <div class="h-8 bg-gray-300 rounded flex-1"></div>
                        <div class="h-8 bg-gray-300 rounded flex-1"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Empty State -->
        <!-- <div
            v-else-if="localLocations.length === 0"
            class="flex flex-col items-center justify-center py-16 px-5"
        >
            <div class="w-48 h-48 mb-6">
                <svg
                    viewBox="0 0 200 200"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-full h-full"
                >
                    <circle cx="100" cy="100" r="80" fill="#E1ECFF" opacity="0.5" />
                    <rect x="60" y="70" width="80" height="60" rx="4" fill="#C8DBFF" />
                    <rect x="70" y="80" width="60" height="5" rx="2" fill="#0057FF" />
                    <rect x="70" y="90" width="40" height="5" rx="2" fill="#96BAFF" />
                    <rect x="70" y="100" width="50" height="5" rx="2" fill="#96BAFF" />
                    <rect x="70" y="110" width="35" height="5" rx="2" fill="#96BAFF" />
                    <circle cx="150" cy="140" r="25" fill="#FFF9DD" />
                    <path
                        d="M145 140L148 143L155 136"
                        stroke="#FFD400"
                        stroke-width="3"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>
            </div>

            <h3 class="text-title2 font-semibold text-gray-900 mb-2">
                {{ t('settings.delivery.noDeliveryFound') }}
            </h3>
            <p class="text-body text-gray-700 mb-6 text-center max-w-sm">
                {{ t('settings.delivery.noDeliveryDescription') }}
            </p>

            <Button
                color="blue"
                variant="filled"
                size="lg"
                :label="t('settings.delivery.addDeliveryLocation')"
                @click="openAddModal"
            />
        </div> -->

        <NoDataPage
            v-else-if="localLocations.length === 0"
            image="/images/content/no-address.svg"
            image-width="350px"
            image-height="240px"
            :title="t('settings.delivery.noDeliveryFound')"
            :description="t('settings.delivery.noDeliveryDescription')"
            button-color="blue"
            :button-label="t('settings.delivery.addDeliveryLocation')"
            @action="openAddModal"
        />
        <!-- Grid Layout -->
        <div v-else class="space-y-3">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div
                    v-for="(location, index) in localLocations"
                    :key="location.id || `temp-${index}`"
                    class="bg-white border border-gray-600 rounded-sm overflow-hidden hover:border-gray-400 transition-colors"
                >
                    <div class="p-3">
                        <div class="flex justify-between items-center mb-3">
                            <h4 class="text-subtitle1 font-bold text-gray-950">
                                {{
                                    t('settings.delivery.deliveryAddressNumber', {
                                        number: index + 1,
                                    })
                                }}
                            </h4>
                            <span
                                v-if="location.is_default"
                                class="bg-blue-500 text-white text-caption1 p-2 rounded-lg"
                                >{{ t('default') }}
                            </span>
                        </div>

                        <div class="space-y-3 text-body text-gray-950">
                            <p>{{ location.contact_name }}</p>
                            <p>{{ location.street_number }}, {{ location.street_name }}</p>
                            <p>{{ location.city_name }}, {{ location.postal_code }}</p>
                            <p>{{ getCountryName(location.country_id) }}</p>
                            <p>{{ location.phone_number }}</p>

                            <div class="flex gap-2">
                                <Button
                                    variant="filled"
                                    size="sm"
                                    color="blue"
                                    font-weight="normal"
                                    @click="openEditModal(location, index)"
                                >
                                    <div class="flex justify-center gap-1">
                                        <svg class="w-4 h-4 transition-all duration-200">
                                            <use xlink:href="/sprite.svg#edit2"></use>
                                        </svg>
                                        {{ t('edit') }}
                                    </div>
                                </Button>
                                <Button
                                    v-if="!location.is_default"
                                    variant="filled"
                                    size="sm"
                                    color="red"
                                    font-weight="normal"
                                    @click="confirmDelete(location, index)"
                                >
                                    <div class="flex gap-1 justify-center flex-shrink-0">
                                        <svg class="w-4 h-4 transition-all duration-200">
                                            <use xlink:href="/sprite.svg#delete"></use>
                                        </svg>
                                        {{ t('delete') }}
                                    </div>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Button
                color="blue"
                variant="filled"
                size="lg"
                :label="t('settings.delivery.addDeliveryLocation')"
                class="mx-auto"
                @click="openAddModal"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
    import { useI18n } from 'vue-i18n'
    import { useToastNotification } from '~/composables/useToastNotification'
    import { useStaticData } from '~/composables/useStaticData'
    import { useModalStore } from '~/stores/modal'
    import { camelToSnake } from '~/utils/case-converter'
    import type { DeliveryLocation, DeliveryLocationFormData } from '~/types/auth'

    const { t } = useI18n()
    const { success, error: showError } = useToastNotification()
    const { countryOptions } = useStaticData()
    const userStore = useUserStore()
    const modalStore = useModalStore()
    const { user } = storeToRefs(userStore)

    // Local state management
    const localLocations = ref<DeliveryLocation[]>([])
    const originalLocations = ref<DeliveryLocation[]>([])
    const isLoading = ref(true)
    const isDirty = ref(false)

    const getCountryName = (countryId: number): string => {
        const country = countryOptions.value.find((c) => c.value === countryId)
        return country?.label || ''
    }

    const normalizeLocation = (location: any): DeliveryLocation => {
        const countryId = location.country?.id || location.country_id

        let phoneCountryId = location.phone_country_id

        if (!phoneCountryId && location.phone_country) {
            phoneCountryId = location.phone_country.id
        }

        if (!phoneCountryId) {
            phoneCountryId = countryId
        }
        return {
            id: location.id,
            contact_name: location.contact_name,
            phone_number: location.phone_number,
            phone_country_id: phoneCountryId,
            country_id: countryId,
            state_name: location.state_name || '',
            city_name: location.city_name,
            street_name: location.street_name,
            street_number: location.street_number,
            postal_code: location.postal_code,
            is_default: location.is_default || false,
        }
    }

    const loadLocations = async () => {
        try {
            isLoading.value = true

            if (!user.value?.delivery_locations) {
                localLocations.value = []
                originalLocations.value = []
                return
            }

            const locations = user.value.delivery_locations.map(normalizeLocation).sort((a, b) => {
                if (a.is_default) return -1
                if (b.is_default) return 1
                return 0
            })

            localLocations.value = [...locations]
            originalLocations.value = [...locations]
        } catch (error) {
            console.error('Error loading delivery locations:', error)
            showError(t('settings.delivery.errorLoadingLocations'))
        } finally {
            isLoading.value = false
        }
    }

    const generateTempId = (): number => {
        return Date.now() + Math.floor(Math.random() * 1000)
    }

    const markDirty = () => {
        isDirty.value = true
    }

    const openAddModal = async () => {
        try {
            const DeliveryAddressModal = await import(
                '~/components/features/ecommerce/settings/modals/DeliveryAddressModal.vue'
            ).then((m) => m.default)

            // Check if this is the first location
            const isFirstLocation = localLocations.value.length === 0

            modalStore.openModal(
                DeliveryAddressModal,
                'deliveryForm',
                {
                    // Pre-fill with is_default: true if first location
                    initialData: isFirstLocation
                        ? ({ is_default: true } as DeliveryLocation)
                        : undefined,
                    onSubmit: (data: DeliveryLocationFormData) => {
                        handleAdd(data)
                        modalStore.closeModal()
                    },
                    // Disable checkbox if first location (must be default)
                    disableDefaultCheckbox: isFirstLocation,
                },
                {
                    title: t('settings.delivery.addDeliveryAddress'),
                    contentWidth: 'max-w-2xl',
                    hideFooter: true,
                }
            )
        } catch (error) {
            console.error('Error loading form:', error)
            showError(t('settings.delivery.errorLoadingForm'))
        }
    }

    const openEditModal = async (location: DeliveryLocation, index: number) => {
        try {
            const DeliveryAddressModal = await import(
                '~/components/features/ecommerce/settings/modals/DeliveryAddressModal.vue'
            ).then((m) => m.default)

            // Check if this is the only default location
            const isOnlyDefaultLocation = localLocations.value.length === 1 && location.is_default

            modalStore.openModal(
                DeliveryAddressModal,
                'deliveryForm',
                {
                    initialData: location,
                    onSubmit: (data: DeliveryLocationFormData) => {
                        handleEdit(index, data)
                        modalStore.closeModal()
                    },
                    disableDefaultCheckbox: isOnlyDefaultLocation,
                },
                {
                    title: t('settings.delivery.editDeliveryAddress'),
                    contentWidth: 'max-w-2xl',
                    hideFooter: true,
                }
            )
        } catch (error) {
            console.error('Error loading form:', error)
            showError(t('settings.delivery.errorLoadingForm'))
        }
    }

    const handleAdd = (formData: DeliveryLocationFormData) => {
        // If this is the first location, it MUST be default
        const isFirstLocation = localLocations.value.length === 0

        const newLocation: DeliveryLocation = {
            ...formData,
            id: generateTempId(),
            phone_country_id: formData.phone_country_id || 1,
            // Force first location to be default, regardless of form value
            is_default: isFirstLocation ? true : formData.is_default,
        }

        let updatedLocations = [...localLocations.value]

        // If new location is default, unset all others
        if (newLocation.is_default) {
            updatedLocations = updatedLocations.map((loc) => ({
                ...loc,
                is_default: false,
            }))
        }

        updatedLocations.push(newLocation)
        localLocations.value = updatedLocations
        markDirty()
    }

    const handleEdit = (index: number, formData: DeliveryLocationFormData) => {
        let updatedLocations = [...localLocations.value]
        const locationId = updatedLocations[index].id

        updatedLocations[index] = {
            ...formData,
            id: locationId,
            phone_country_id: formData.phone_country_id || 1,
        }

        if (formData.is_default) {
            updatedLocations = updatedLocations.map((loc, i) => ({
                ...loc,
                is_default: i === index,
            }))
        }

        localLocations.value = updatedLocations
        markDirty()
    }

    const confirmDelete = async (location: DeliveryLocation, index: number) => {
        try {
            const ConfirmModal = await import('~/components/modals/ConfirmModal.vue').then(
                (m) => m.default
            )

            modalStore.openModal(
                ConfirmModal,
                'deleteConfirmation',
                {
                    message: t('settings.delivery.confirmDeleteLocation'),
                    warningText: t('settings.delivery.areYouSureDeleteLocation'),
                    showIcon: false,
                    // iconType: 'danger',
                    // showIcon: true,
                },
                {
                    title: t('settings.delivery.confirmDeleteLocation'),
                    contentWidth: 'max-w-md',
                    hideHeader: false,
                    okText: t('delete'),
                    okColor: 'red',
                    onOk: () => {
                        handleDelete(index)
                    },
                }
            )
        } catch (error) {
            console.error('Error loading confirmation dialog:', error)
            showError(t('settings.delivery.errorLoadingDialog'))
        }
    }

    const handleDelete = (index: number) => {
        localLocations.value = localLocations.value.filter((_, i) => i !== index)
        markDirty()
    }

    // Validation
    const validate = (): { isValid: boolean; errors: string[] } => {
        const errors: string[] = []

        // It's valid to have no delivery locations
        if (localLocations.value.length === 0) {
            return { isValid: true, errors: [] }
        }

        // Check if at least one default location exists when there are locations
        const hasDefault = localLocations.value.some((loc) => loc.is_default)
        if (localLocations.value.length > 0 && !hasDefault) {
            errors.push(t('settings.delivery.atLeastOneDefaultRequired'))
        }

        return {
            isValid: errors.length === 0,
            errors,
        }
    }

    // Save functionality
    const prepareLocationsForAPI = (locations: DeliveryLocation[]): any[] => {
        return locations.map((loc) => ({
            ...(loc.id && loc.id < 1000000000 ? { id: loc.id } : {}),
            contact_name: loc.contact_name,
            phone_number: loc.phone_number,
            phone_country_id: loc.phone_country_id || 1,
            country_id: loc.country_id,
            state_name: loc.state_name || '',
            city_name: loc.city_name,
            street_name: loc.street_name,
            street_number: loc.street_number,
            postal_code: loc.postal_code,
            is_default: loc.is_default || false,
        }))
    }

    const save = async (): Promise<boolean> => {
        const validation = validate()

        if (!validation.isValid) {
            return false
        }

        try {
            const preparedLocations = prepareLocationsForAPI(localLocations.value)
            const payload = camelToSnake({ delivery_locations: preparedLocations })

            await userStore.updateDeliveryLocation(payload.delivery_locations)
            // await userStore.fetchUser(true)

            originalLocations.value = [...localLocations.value]
            isDirty.value = false

            return true
        } catch (error) {
            console.error('Error saving delivery locations:', error)
            showError(t('settings.delivery.errorSavingLocation'))
            return false
        }
    }

    // Reset to original state
    const reset = () => {
        localLocations.value = [...originalLocations.value]
        isDirty.value = false
    }

    // Get tab name
    const getTabName = () => t('settings.delivery.tabName')

    onMounted(() => {
        loadLocations()
    })

    watch(
        () => user.value?.delivery_locations,
        () => {
            if (!isDirty.value) {
                loadLocations()
            }
        },
        { deep: true }
    )

    // Expose methods to parent
    defineExpose({
        save,
        validate,
        reset,
        isDirty,
        getTabName,
    })
</script>

<style scoped>
    .delivery-tab {
        min-height: 400px;
    }
</style>
