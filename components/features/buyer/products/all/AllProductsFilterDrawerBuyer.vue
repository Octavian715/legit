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
                        :placeholder="t('allProductsFilterDrawer.searchPlaceholder')"
                        size="lg"
                        background="bg-gray-150 text-gray-600"
                        container-classes="rounded-sm"
                        @search="handleSearch"
                        @clear="handleClearSearch"
                    />
                </div>

                <Collapse v-if="brandOptions && brandOptions.length > 0">
                    <template #title>
                        <span class="text-subtitle font-medium">{{
                            t('allProductsFilterDrawer.brands')
                        }}</span>
                    </template>
                    <div class="filter-section">
                        <div class="filter-options">
                            <Checkbox
                                v-for="brand in brandOptions"
                                :key="`brand-${brand.name}`"
                                :model-value="isBrandSelected(brand.name)"
                                :name="`brand-${brand.name}`"
                                size="md"
                                @update:model-value="(value) => toggleBrand(brand.name, value)"
                            >
                                <template #default>
                                    <span class="text-body">{{ brand.name }}</span>
                                    <span
                                        v-if="brand.products_count"
                                        class="text-xs text-gray-500 ml-1"
                                    >
                                        ({{ brand.products_count }})
                                    </span>
                                </template>
                            </Checkbox>
                        </div>
                    </div>
                </Collapse>

                <Collapse v-if="categoryOptions && categoryOptions.length > 0">
                    <template #title>
                        <span class="text-subtitle font-medium">{{
                            t('allProductsFilterDrawer.categories')
                        }}</span>
                    </template>
                    <div class="filter-section">
                        <div class="filter-options">
                            <Checkbox
                                v-for="category in categoryOptions"
                                :key="`category-${category.id}`"
                                :model-value="isCategorySelected(category.id)"
                                :name="`category-${category.id}`"
                                size="md"
                                @update:model-value="(value) => toggleCategory(category.id, value)"
                            >
                                <template #default>
                                    <span class="text-body">{{ category.name }}</span>
                                    <span
                                        v-if="category.products_count"
                                        class="text-xs text-gray-500 ml-1"
                                    >
                                        ({{ category.products_count }})
                                    </span>
                                </template>
                            </Checkbox>
                        </div>
                    </div>
                </Collapse>

                <Collapse v-if="statusOptions && statusOptions.length > 0">
                    <template #title>
                        <span class="text-subtitle font-medium">{{
                            t('allProductsFilterDrawer.status')
                        }}</span>
                    </template>
                    <div class="filter-section">
                        <div class="filter-options">
                            <Checkbox
                                v-for="status in statusOptions"
                                :key="`status-${status.id}`"
                                :model-value="isStatusSelected(status.id)"
                                :name="`status-${status.id}`"
                                size="md"
                                @update:model-value="(value) => toggleStatus(status.id, value)"
                            >
                                <template #default>
                                    <span class="text-body">{{ status.name }}</span>
                                    <span
                                        v-if="status.products_count"
                                        class="text-xs text-gray-500 ml-1"
                                    >
                                        ({{ status.products_count }})
                                    </span>
                                </template>
                            </Checkbox>
                        </div>
                    </div>
                </Collapse>

                <Collapse v-if="amountRange">
                    <template #title>
                        <span class="text-subtitle font-medium">{{
                            t('allProductsFilterDrawer.priceRange')
                        }}</span>
                    </template>
                    <div class="filter-section">
                        <RangeSlider
                            v-model="amountRangeModel"
                            :min="amountRange.min"
                            :max="amountRange.max"
                            :step="getSliderStep(amountRange)"
                            :show-inputs="true"
                            :show-range="false"
                            :show-selected-range="false"
                            :format-type="'currency'"
                            :currency="currencyCode"
                            :min-placeholder="t('allProductsFilterDrawer.minPrice')"
                            :max-placeholder="t('allProductsFilterDrawer.maxPrice')"
                            input-size="md"
                            @change="handleAmountRangeChange"
                        />
                    </div>
                </Collapse>

                <Collapse>
                    <template #title>
                        <span class="text-subtitle font-medium">{{
                            t('buyerProducts.purchaseDateRange')
                        }}</span>
                    </template>
                    <div class="filter-section">
                        <DatePicker
                            v-model="dateRangeModel"
                            :label="t('buyerProducts.purchaseDateRange')"
                            :placeholder="t('buyerProducts.selectDateRange')"
                            :is-range-mode="true"
                            size="md"
                            date-format="yyyy-MM-dd"
                            @range-selected="onDateRangeSelect"
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
    import { useDashboardProductStore } from '~/stores/dashboardProduct'
    import type { AllProductsFilters } from '~/types/dashboardProduct'
    import type { DateRange } from '~/types/ui/datePicker'

    interface Props {
        isOpen: boolean
        filters?: AllProductsFilters
    }

    const props = withDefaults(defineProps<Props>(), {
        filters: () => ({
            search: '',
            brand_names: [],
            category_ids: [],
            status_ids: [],
            start_date: undefined,
            end_date: undefined,
            amount_from: undefined,
            amount_to: undefined,
        }),
    })

    const emit = defineEmits<{
        'update:isOpen': [value: boolean]
        apply: [filters: AllProductsFilters]
        reset: []
    }>()

    const { t } = useI18n()
    const dashboardProductStore = useDashboardProductStore()

    const initializationError = ref<string | null>(null)
    const isInitializing = ref(false)
    const searchQuery = ref('')
    const selectedBrands = ref<string[]>([])
    const selectedCategories = ref<number[]>([])
    const selectedStatuses = ref<number[]>([])
    const dateRangeModel = ref<DateRange | null>(null)
    const amountRangeModel = ref<{ min: number | null; max: number | null }>({
        min: null,
        max: null,
    })

    const defaultFilters: AllProductsFilters = {
        search: '',
        brand_names: [],
        category_ids: [],
        status_ids: [],
        start_date: undefined,
        end_date: undefined,
        amount_from: undefined,
        amount_to: undefined,
    }

    const localFilters = ref<AllProductsFilters>({ ...defaultFilters })

    const brandOptions = computed(() => {
        return (
            dashboardProductStore.buyerProductFilters?.brands?.map((brand) => ({
                name: brand.name,
                products_count: brand.products_count,
            })) || []
        )
    })

    const categoryOptions = computed(() => {
        return dashboardProductStore.buyerProductFilters?.categories || []
    })

    const statusOptions = computed(() => {
        return dashboardProductStore.buyerProductFilters?.statuses || []
    })

    const amountRange = computed(() => {
        return dashboardProductStore.buyerProductFilters?.amount_range || null
    })

    const currencyCode = computed(() => {
        return dashboardProductStore.buyerProductFilters?.amount_range?.currency || 'EUR'
    })

    const activeFiltersCount = computed(() => {
        let count = 0
        if (searchQuery.value?.trim()) count++
        if (selectedBrands.value.length > 0) count++
        if (selectedCategories.value.length > 0) count++
        if (selectedStatuses.value.length > 0) count++
        if (dateRangeModel.value?.start && dateRangeModel.value?.end) count++
        if (amountRangeModel.value.min !== null || amountRangeModel.value.max !== null) count++
        return count
    })

    const getSliderStep = (range: { min: number; max: number }): number => {
        if (!range) return 0.01
        const rangeValue = range.max - range.min
        if (rangeValue <= 10) return 0.01
        if (rangeValue <= 100) return 0.1
        if (rangeValue <= 1000) return 1
        return Math.max(1, Math.floor(rangeValue / 100))
    }

    const initializeFilterData = async (): Promise<void> => {
        isInitializing.value = true
        initializationError.value = null

        try {
            await dashboardProductStore.fetchBuyerProductFilters()
        } catch (error: any) {
            console.error('Failed to initialize buyer product filter data:', error)
            initializationError.value = error.message || t('allProductsFilterDrawer.loadError')
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

    const isBrandSelected = (brandName: string): boolean => {
        return selectedBrands.value.includes(brandName)
    }

    const toggleBrand = (brandName: string, isSelected: boolean) => {
        if (isSelected) {
            if (!selectedBrands.value.includes(brandName)) {
                selectedBrands.value.push(brandName)
            }
        } else {
            selectedBrands.value = selectedBrands.value.filter((brand) => brand !== brandName)
        }
    }

    const isCategorySelected = (categoryId: number): boolean => {
        return selectedCategories.value.includes(categoryId)
    }

    const toggleCategory = (categoryId: number, isSelected: boolean) => {
        if (isSelected) {
            if (!selectedCategories.value.includes(categoryId)) {
                selectedCategories.value.push(categoryId)
            }
        } else {
            selectedCategories.value = selectedCategories.value.filter((id) => id !== categoryId)
        }
    }

    const isStatusSelected = (statusId: number): boolean => {
        return selectedStatuses.value.includes(statusId)
    }

    const toggleStatus = (statusId: number, isSelected: boolean) => {
        if (isSelected) {
            if (!selectedStatuses.value.includes(statusId)) {
                selectedStatuses.value.push(statusId)
            }
        } else {
            selectedStatuses.value = selectedStatuses.value.filter((id) => id !== statusId)
        }
    }

    const handleAmountRangeChange = (value: { min: number | null; max: number | null }) => {
        amountRangeModel.value = value
    }

    const onDateRangeSelect = (range: DateRange) => {
        dateRangeModel.value = range
    }

    const applyFilters = () => {
        const productFilters: AllProductsFilters = {}

        if (searchQuery.value?.trim()) {
            productFilters.search = searchQuery.value.trim()
        }

        if (selectedBrands.value.length > 0) {
            productFilters.brand_names = [...selectedBrands.value]
        }

        if (selectedCategories.value.length > 0) {
            productFilters.category_ids = [...selectedCategories.value]
        }

        if (selectedStatuses.value.length > 0) {
            productFilters.status_ids = [...selectedStatuses.value]
        }

        if (dateRangeModel.value?.start && dateRangeModel.value?.end) {
            productFilters.start_date = dateRangeModel.value.start
            productFilters.end_date = dateRangeModel.value.end
        }

        if (amountRangeModel.value.min !== null) {
            productFilters.amount_from = amountRangeModel.value.min
        }

        if (amountRangeModel.value.max !== null) {
            productFilters.amount_to = amountRangeModel.value.max
        }

        emit('apply', productFilters)
        emit('update:isOpen', false)
    }

    const resetFilters = () => {
        searchQuery.value = ''
        selectedBrands.value = []
        selectedCategories.value = []
        selectedStatuses.value = []
        dateRangeModel.value = null
        amountRangeModel.value = { min: null, max: null }
        localFilters.value = { ...defaultFilters }

        emit('reset')

        const emptyFilters: AllProductsFilters = { ...defaultFilters }
        emit('apply', emptyFilters)
        emit('update:isOpen', false)
    }

    const normalizeFilterValue = <T,>(value: T | T[]): T[] => {
        if (Array.isArray(value)) {
            return value.filter(Boolean)
        }
        if (value && (typeof value === 'string' || typeof value === 'number')) {
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
            selectedBrands.value = normalizeFilterValue(props.filters.brand_names)
            selectedCategories.value = normalizeFilterValue(props.filters.category_ids)
            selectedStatuses.value = normalizeFilterValue(props.filters.status_ids)

            if (props.filters.start_date && props.filters.end_date) {
                dateRangeModel.value = {
                    start: props.filters.start_date,
                    end: props.filters.end_date,
                }
            } else {
                dateRangeModel.value = null
            }

            amountRangeModel.value = {
                min: props.filters.amount_from ?? null,
                max: props.filters.amount_to ?? null,
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

    .loader {
        @apply border-2 border-gray-300 border-t-blue-600 rounded-full w-4 h-4 animate-spin;
    }
</style>
