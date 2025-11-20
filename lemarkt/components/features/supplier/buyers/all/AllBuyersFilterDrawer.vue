<template>
    <Drawer
        :is-open="isOpen"
        position="right"
        :title="t('filters.title')"
        :sub-title="
            activeFiltersCount > 0
                ? t('filters.appliedCount', { count: activeFiltersCount })
                : t('filters.noFiltersApplied')
        "
        :width="'400px'"
        :show-default-footer="false"
        @update:is-open="$emit('update:isOpen', $event)"
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

                <Collapse v-if="businessTypeOptions && businessTypeOptions.length > 0">
                    <template #title>
                        <span class="text-subtitle font-medium">{{
                            t('company.businessType')
                        }}</span>
                    </template>
                    <div class="filter-section">
                        <div class="filter-options">
                            <Checkbox
                                v-for="businessType in businessTypeOptions"
                                :key="`businessType-${businessType.id}`"
                                :model-value="isBusinessTypeSelected(businessType.id)"
                                :name="`businessType-${businessType.id}`"
                                size="md"
                                @update:model-value="
                                    (value) => toggleBusinessType(businessType.id, value)
                                "
                            >
                                <template #default>
                                    <span class="text-body">{{ businessType.name }}</span>
                                </template>
                            </Checkbox>
                        </div>
                    </div>
                </Collapse>

                <Collapse v-if="countryOptions && countryOptions.length > 0">
                    <template #title>
                        <span class="text-subtitle font-medium">{{ t('filters.country') }}</span>
                    </template>
                    <div class="filter-section">
                        <div class="filter-options">
                            <Checkbox
                                v-for="country in countryOptions"
                                :key="`country-${country.id}`"
                                :model-value="isCountrySelected(country.id)"
                                :name="`country-${country.id}`"
                                size="md"
                                @update:model-value="(value) => toggleCountry(country.id, value)"
                            >
                                <template #default>
                                    <span class="text-body">{{ country.name }}</span>
                                </template>
                            </Checkbox>
                        </div>
                    </div>
                </Collapse>

                <Collapse v-if="false">
                    <template #title>
                        <span class="text-subtitle font-medium">{{
                            t('filters.totalAmount')
                        }}</span>
                    </template>
                    <div class="filter-options gap-3">
                        <Input
                            v-model.number="minAmount"
                            type="number"
                            :label="t('filters.minimum')"
                            size="md"
                            :min="0"
                            :step="100"
                            @update:model-value="updateMinAmount"
                        />
                        <Input
                            v-model.number="maxAmount"
                            type="number"
                            :label="t('filters.maximum')"
                            size="md"
                            :min="0"
                            :step="100"
                            @update:model-value="updateMaxAmount"
                        />
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
    import { ref, computed, watch } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useUserDashboardStore } from '~/stores/userDashboard'
    import type { DashboardFilters } from '~/types/userDashboard'
    import type { DateRange } from '~/types/ui/datePicker'

    interface Props {
        isOpen: boolean
        filters?: DashboardFilters
    }

    const props = withDefaults(defineProps<Props>(), {
        filters: () => ({
            search: '',
            business_type_ids: [],
            country_ids: [],
            start_date: '',
            end_date: '',
        }),
    })

    const emit = defineEmits<{
        'update:isOpen': [value: boolean]
        apply: [filters: DashboardFilters]
        reset: []
    }>()

    const { t } = useI18n()
    const userDashboardStore = useUserDashboardStore()

    const initializationError = ref<string | null>(null)
    const isInitializing = ref(false)
    const searchQuery = ref('')
    const selectedBusinessTypes = ref<number[]>([])
    const selectedCountries = ref<number[]>([])
    const selectedPeriod = ref<string | null>(null)
    const dateRangeModel = ref<DateRange | null>(null)
    const minAmount = ref<number | null>(null)
    const maxAmount = ref<number | null>(null)

    const defaultFilters: DashboardFilters = {
        search: '',
        business_type_ids: [],
        country_ids: [],
        start_date: '',
        end_date: '',
        min_total_amount: undefined,
        max_total_amount: undefined,
        period: undefined,
    }

    const localFilters = ref<DashboardFilters>({ ...defaultFilters })

    const periodOptions = computed(() => [
        { value: 'today', label: t('filters.today') },
        { value: 'last_month', label: t('filters.lastMonth') },
        { value: 'last_year', label: t('filters.lastYear') },
    ])

    const businessTypeOptions = computed(() => {
        return userDashboardStore.buyersFilterOptions?.business_types || []
    })

    const countryOptions = computed(() => {
        return userDashboardStore.buyersFilterOptions?.countries || []
    })

    const activeFiltersCount = computed(() => {
        let count = 0

        if (searchQuery.value?.trim()) count++
        if (selectedBusinessTypes.value.length > 0) count++
        if (selectedCountries.value.length > 0) count++
        if (selectedPeriod.value) count++
        if (dateRangeModel.value?.start && dateRangeModel.value?.end) count++
        if (minAmount.value !== null || maxAmount.value !== null) count++

        return count
    })

    const initializeFilterData = async (): Promise<void> => {
        isInitializing.value = true
        initializationError.value = null

        try {
            await userDashboardStore.fetchAllBuyersFilters()
        } catch (error: any) {
            console.error('Failed to initialize buyers filter data:', error)
            initializationError.value = error.message || t('userDashboard.filters.loadError')
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

    const onDateRangeSelect = (range: DateRange) => {
        dateRangeModel.value = range
        if (range && range.start && range.end) {
            localFilters.value.start_date = range.start
            localFilters.value.end_date = range.end
        } else {
            localFilters.value.start_date = ''
            localFilters.value.end_date = ''
        }
        selectedPeriod.value = null
    }

    const togglePeriod = (period: string, isSelected: boolean) => {
        if (isSelected) {
            selectedPeriod.value = period
            dateRangeModel.value = null
            localFilters.value.start_date = ''
            localFilters.value.end_date = ''
        } else {
            selectedPeriod.value = null
        }
    }

    const isBusinessTypeSelected = (businessTypeId: number): boolean => {
        return selectedBusinessTypes.value.includes(businessTypeId)
    }

    const toggleBusinessType = (businessTypeId: number, isSelected: boolean) => {
        if (isSelected) {
            if (!selectedBusinessTypes.value.includes(businessTypeId)) {
                selectedBusinessTypes.value.push(businessTypeId)
            }
        } else {
            selectedBusinessTypes.value = selectedBusinessTypes.value.filter(
                (id) => id !== businessTypeId
            )
        }
    }

    const isCountrySelected = (countryId: number): boolean => {
        return selectedCountries.value.includes(countryId)
    }

    const toggleCountry = (countryId: number, isSelected: boolean) => {
        if (isSelected) {
            if (!selectedCountries.value.includes(countryId)) {
                selectedCountries.value.push(countryId)
            }
        } else {
            selectedCountries.value = selectedCountries.value.filter((id) => id !== countryId)
        }
    }

    const updateMinAmount = (value: number | null) => {
        minAmount.value = value
        localFilters.value.min_total_amount = value || undefined
    }

    const updateMaxAmount = (value: number | null) => {
        maxAmount.value = value
        localFilters.value.max_total_amount = value || undefined
    }

    const applyFilters = () => {
        const dashboardFilters: DashboardFilters = {}

        if (searchQuery.value?.trim()) {
            dashboardFilters.search = searchQuery.value.trim()
        }

        if (selectedBusinessTypes.value.length > 0) {
            dashboardFilters.business_type_ids = [...selectedBusinessTypes.value]
        }

        if (selectedCountries.value.length > 0) {
            dashboardFilters.country_ids = [...selectedCountries.value]
        }

        if (selectedPeriod.value) {
            dashboardFilters.period = selectedPeriod.value as 'today' | 'last_month' | 'last_year'
        }

        if (localFilters.value.start_date && localFilters.value.end_date) {
            dashboardFilters.start_date = localFilters.value.start_date
            dashboardFilters.end_date = localFilters.value.end_date
        }

        if (localFilters.value.min_total_amount !== undefined) {
            dashboardFilters.min_total_amount = localFilters.value.min_total_amount
        }

        if (localFilters.value.max_total_amount !== undefined) {
            dashboardFilters.max_total_amount = localFilters.value.max_total_amount
        }

        emit('apply', dashboardFilters)
        emit('update:isOpen', false)
    }

    const resetFilters = () => {
        searchQuery.value = ''
        selectedBusinessTypes.value = []
        selectedCountries.value = []
        selectedPeriod.value = null
        dateRangeModel.value = null
        minAmount.value = null
        maxAmount.value = null
        localFilters.value = { ...defaultFilters }

        emit('reset')

        const emptyFilters: DashboardFilters = { ...defaultFilters }
        emit('apply', emptyFilters)
        emit('update:isOpen', false)
    }

    const normalizeFilterValue = <T,>(value: T | T[]): T[] => {
        if (Array.isArray(value)) {
            return value.filter(Boolean)
        }
        if (value && typeof value === 'number') {
            return [value]
        }
        return []
    }

    const syncFiltersFromProps = () => {
        if (props.filters) {
            localFilters.value = {
                ...defaultFilters,
                ...props.filters,
            }

            searchQuery.value = props.filters.search || ''
            selectedBusinessTypes.value = normalizeFilterValue(props.filters.business_type_ids)
            selectedCountries.value = normalizeFilterValue(props.filters.country_ids)
            selectedPeriod.value = props.filters.period || null
            minAmount.value = props.filters.min_total_amount || null
            maxAmount.value = props.filters.max_total_amount || null

            if (props.filters.start_date && props.filters.end_date) {
                dateRangeModel.value = {
                    start: props.filters.start_date,
                    end: props.filters.end_date,
                }
            } else {
                dateRangeModel.value = null
            }
        }
    }

    watch(
        () => props.filters,
        () => syncFiltersFromProps(),
        { immediate: true, deep: true }
    )

    watch(
        () => props.isOpen,
        async (val) => {
            if (val) {
                await initializeFilterData()
                syncFiltersFromProps()
            }
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

    .filter-options {
        @apply grid grid-cols-2 gap-2;
    }

    .filter-footer {
        @apply flex gap-3 px-4;
    }
</style>
