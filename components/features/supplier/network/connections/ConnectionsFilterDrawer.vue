<!-- ConnectionsFilterDrawer.vue - FIXED VERSION -->
<template>
    <Drawer
        :is-open="open"
        position="right"
        :title="t('filters.title')"
        :sub-title="
            activeFiltersCount > 0
                ? t('filters.appliedCount', { count: activeFiltersCount })
                : t('filters.noFiltersApplied')
        "
        :width="'400px'"
        :show-default-footer="false"
        @update:is-open="$emit('update:open', $event)"
    >
        <template #default>
            <div v-if="isInitializing" class="flex items-center justify-center mx-auto h-full">
                <div class="flex justify-center items-center p-8 rotate-90">
                    <span class="loader"></span>
                </div>
            </div>

            <div v-else-if="initializationError" class="p-4 bg-red-50 rounded-lg">
                <div class="flex">
                    <svg
                        class="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clip-rule="evenodd"
                        />
                    </svg>
                    <div>
                        <p class="text-sm font-medium text-red-800">{{ t('error') }}</p>
                        <p class="text-sm text-red-700 mt-1">{{ initializationError }}</p>
                        <Button
                            variant="outline"
                            color="red"
                            size="sm"
                            class="mt-2"
                            @click="initializeFilterData"
                        >
                            {{ t('retry') }}
                        </Button>
                    </div>
                </div>
            </div>

            <div v-else class="filters-container">
                <div class="mb-4">
                    <InputSearch
                        v-model="searchQuery"
                        :placeholder="t('filters.searchPlaceholder')"
                        size="lg"
                        background="bg-gray-150 text-gray-600"
                        container-classes="rounded-sm"
                        @search="handleSearch"
                        @clear="handleClearSearch"
                    />
                </div>

                <Collapse>
                    <template #title>
                        <span class="text-subtitle font-medium">{{ t('filters.dateRange') }}</span>
                    </template>
                    <div class="filter-section">
                        <DatePicker
                            v-model="dateRangeModel"
                            :label="t('filters.chooseDateRange')"
                            :placeholder="t('filters.selectDateRange')"
                            :is-range-mode="true"
                            size="md"
                            date-format="yyyy-MM-dd"
                            @range-selected="onDateRangeSelect"
                        />
                    </div>
                </Collapse>

                <!-- FIXED: Added null guards and proper validation -->
                <Collapse v-if="businessTypeOptions && businessTypeOptions.length > 0">
                    <template #title>
                        <span class="text-subtitle font-medium">{{
                            t('filters.businessType')
                        }}</span>
                    </template>
                    <div class="filter-section">
                        <div class="checkbox-group">
                            <div class="checkbox-grid">
                                <Checkbox
                                    v-for="businessType in businessTypeOptions"
                                    :key="`business-type-${businessType.id}`"
                                    :model-value="selectedBusinessTypeIds.includes(businessType.id)"
                                    :label="businessType.name || t('common.unknown')"
                                    :name="`business-type-${businessType.id}`"
                                    @update:model-value="
                                        (checked) => toggleBusinessType(businessType.id, checked)
                                    "
                                />
                            </div>
                        </div>
                    </div>
                </Collapse>

                <Collapse v-if="languageOptions && languageOptions.length > 0">
                    <template #title>
                        <span class="text-subtitle font-medium">{{
                            t('filters.spokenLanguages')
                        }}</span>
                    </template>
                    <div class="filter-section">
                        <div class="checkbox-group">
                            <div class="checkbox-grid">
                                <Checkbox
                                    v-for="language in languageOptions"
                                    :key="`language-${language.id}`"
                                    :model-value="selectedLanguageIds.includes(language.id)"
                                    :label="language.name || t('common.unknown')"
                                    :name="`language-${language.id}`"
                                    @update:model-value="
                                        (checked) => toggleLanguage(language.id, checked)
                                    "
                                />
                            </div>
                        </div>
                    </div>
                </Collapse>

                <Collapse v-if="countryOptions && countryOptions.length > 0">
                    <template #title>
                        <span class="text-subtitle font-medium">{{
                            t('filters.countryRegion')
                        }}</span>
                    </template>
                    <div class="filter-section">
                        <div class="checkbox-group">
                            <div class="checkbox-grid">
                                <Checkbox
                                    v-for="country in countryOptions"
                                    :key="`country-${country.id}`"
                                    :model-value="selectedCountryIds.includes(country.id)"
                                    :label="country.name || t('common.unknown')"
                                    :name="`country-${country.id}`"
                                    @update:model-value="
                                        (checked) => toggleCountry(country.id, checked)
                                    "
                                />
                            </div>
                        </div>
                    </div>
                </Collapse>
            </div>
        </template>

        <template #footer>
            <div class="filter-footer">
                <Button
                    variant="outline"
                    color="gray"
                    size="lg"
                    class="flex-1"
                    @click="resetFilters"
                >
                    <svg class="w-4 h-4 mr-2">
                        <use xlink:href="/sprite.svg#reset" />
                    </svg>
                    {{ t('filters.reset') }}
                </Button>
                <Button
                    variant="filled"
                    color="blue"
                    size="lg"
                    class="flex-1"
                    @click="applyFilters"
                >
                    <svg class="w-4 h-4 mr-2">
                        <use xlink:href="/sprite.svg#check" />
                    </svg>
                    {{ t('filters.apply') }}
                </Button>
            </div>
        </template>
    </Drawer>
</template>

<script setup lang="ts">
    import { ref, computed, watch, onMounted } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useNetworkStore } from '~/stores/network'
    import type { ConnectionFilters, NetworkFilters } from '~/types/network'
    import type { DateRange } from '~/types/ui/datePicker'

    interface Props {
        open: boolean
        activeFilters?: NetworkFilters
        activeTab?: string
    }

    const props = withDefaults(defineProps<Props>(), {
        activeFilters: () => ({
            search: '',
            business_type_ids: [],
            country_ids: [],
            spoken_language_ids: [],
            start_date: undefined,
            end_date: undefined,
        }),
        activeTab: 'connections',
    })

    const emit = defineEmits<{
        'update:open': [value: boolean]
        'apply-filters': [filters: NetworkFilters]
        'reset-filters': []
    }>()

    const { t } = useI18n()
    const networkStore = useNetworkStore()

    const initializationError = ref<string | null>(null)
    const isInitializing = ref(false)
    const searchQuery = ref('')
    const selectedBusinessTypeIds = ref<number[]>([])
    const selectedLanguageIds = ref<number[]>([])
    const selectedCountryIds = ref<number[]>([])
    const dateRangeModel = ref<DateRange | null>(null)

    const defaultFilters: ConnectionFilters = {
        search: '',
        businessTypeIds: [],
        countryIds: [],
        spokenLanguageIds: [],
        dateRange: undefined,
    }

    const localFilters = ref<ConnectionFilters>({ ...defaultFilters })

    // FIXED: Added null checks and proper fallback values
    const businessTypeOptions = computed(() => {
        return (
            networkStore.connectionFilters?.business_types?.filter(
                (item) => item && typeof item.id === 'number'
            ) || []
        )
    })

    const languageOptions = computed(() => {
        return (
            networkStore.connectionFilters?.spoken_languages?.filter(
                (item) => item && typeof item.id === 'number'
            ) || []
        )
    })

    const countryOptions = computed(() => {
        return (
            networkStore.connectionFilters?.countries?.filter(
                (item) => item && typeof item.id === 'number'
            ) || []
        )
    })

    const activeFiltersCount = computed(() => {
        let count = 0

        if (searchQuery.value?.trim()) count++
        if (selectedBusinessTypeIds.value?.length > 0) count++
        if (selectedLanguageIds.value?.length > 0) count++
        if (selectedCountryIds.value?.length > 0) count++
        if (dateRangeModel.value?.start && dateRangeModel.value?.end) count++

        return count
    })

    const initializeFilterData = async (): Promise<void> => {
        isInitializing.value = true
        initializationError.value = null

        try {
            await networkStore.fetchConnectionFilters(true)
        } catch (error: any) {
            console.error('Failed to initialize filter data:', error)
            initializationError.value = error.message || t('filters.loadError')
        } finally {
            isInitializing.value = false
        }
    }

    const handleSearch = (value: string) => {
        searchQuery.value = value?.trim() || ''
    }

    const handleClearSearch = () => {
        searchQuery.value = ''
    }

    // FIXED: Added validation for inputs
    const toggleCountry = (countryId: number, checked: boolean) => {
        if (typeof countryId !== 'number' || countryId <= 0) return

        if (checked) {
            if (!selectedCountryIds.value.includes(countryId)) {
                selectedCountryIds.value.push(countryId)
            }
        } else {
            const index = selectedCountryIds.value.indexOf(countryId)
            if (index > -1) {
                selectedCountryIds.value.splice(index, 1)
            }
        }
    }

    const toggleBusinessType = (businessTypeId: number, checked: boolean) => {
        if (typeof businessTypeId !== 'number' || businessTypeId <= 0) return

        if (checked) {
            if (!selectedBusinessTypeIds.value.includes(businessTypeId)) {
                selectedBusinessTypeIds.value.push(businessTypeId)
            }
        } else {
            const index = selectedBusinessTypeIds.value.indexOf(businessTypeId)
            if (index > -1) {
                selectedBusinessTypeIds.value.splice(index, 1)
            }
        }
    }

    const toggleLanguage = (languageId: number, checked: boolean) => {
        if (typeof languageId !== 'number' || languageId <= 0) return

        if (checked) {
            if (!selectedLanguageIds.value.includes(languageId)) {
                selectedLanguageIds.value.push(languageId)
            }
        } else {
            const index = selectedLanguageIds.value.indexOf(languageId)
            if (index > -1) {
                selectedLanguageIds.value.splice(index, 1)
            }
        }
    }

    const onDateRangeSelect = (range: DateRange) => {
        dateRangeModel.value = range
        if (range && range.start && range.end) {
            localFilters.value.dateRange = {
                startDate: range.start,
                endDate: range.end,
            }
        } else {
            localFilters.value.dateRange = undefined
        }
    }

    const applyFilters = () => {
        const networkFilters: NetworkFilters = {}

        if (searchQuery.value?.trim()) {
            networkFilters.search = searchQuery.value.trim()
        }

        if (selectedBusinessTypeIds.value?.length > 0) {
            networkFilters.business_type_ids = [...selectedBusinessTypeIds.value]
        }

        if (selectedCountryIds.value?.length > 0) {
            networkFilters.country_ids = [...selectedCountryIds.value]
        }

        if (selectedLanguageIds.value?.length > 0) {
            networkFilters.spoken_language_ids = [...selectedLanguageIds.value]
        }

        if (localFilters.value.dateRange) {
            networkFilters.start_date = localFilters.value.dateRange.startDate
            networkFilters.end_date = localFilters.value.dateRange.endDate
        }

        emit('apply-filters', networkFilters)
        emit('update:open', false)
    }

    const resetFilters = () => {
        searchQuery.value = ''
        selectedBusinessTypeIds.value = []
        selectedCountryIds.value = []
        selectedLanguageIds.value = []
        dateRangeModel.value = null
        localFilters.value = { ...defaultFilters }

        emit('reset-filters')

        const emptyFilters: NetworkFilters = {}
        emit('apply-filters', emptyFilters)
        emit('update:open', false)
    }

    const syncFiltersFromProps = () => {
        if (props.activeFilters) {
            // Transform NetworkFilters (snake_case) to local format
            searchQuery.value = props.activeFilters.search || ''
            selectedBusinessTypeIds.value = [...(props.activeFilters.business_type_ids || [])]
            selectedLanguageIds.value = [...(props.activeFilters.spoken_language_ids || [])]
            selectedCountryIds.value = [...(props.activeFilters.country_ids || [])]

            if (props.activeFilters.start_date && props.activeFilters.end_date) {
                dateRangeModel.value = {
                    start: props.activeFilters.start_date,
                    end: props.activeFilters.end_date,
                }
                localFilters.value.dateRange = {
                    startDate: props.activeFilters.start_date,
                    endDate: props.activeFilters.end_date,
                }
            } else {
                dateRangeModel.value = null
                localFilters.value.dateRange = undefined
            }
        }
    }

    watch(
        () => props.activeFilters,
        () => syncFiltersFromProps(),
        { immediate: true, deep: true }
    )

    watch(
        () => props.activeTab,
        (newTab, oldTab) => {
            if (newTab !== oldTab && oldTab !== undefined) {
                resetFilters()
            }
        }
    )

    watch(
        () => props.open,
        async (val) => {
            if (val) await initializeFilterData()
        }
    )
</script>

<style scoped lang="scss">
    .filters-container {
        @apply space-y-2;
    }

    .filter-section {
        @apply py-2;
    }

    .checkbox-grid {
        @apply grid grid-cols-2 gap-2;
    }

    .filter-footer {
        @apply flex gap-3 px-4;
    }
</style>
