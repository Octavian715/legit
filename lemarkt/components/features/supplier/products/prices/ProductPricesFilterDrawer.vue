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
                        :placeholder="t('productPricesFilterDrawer.searchPlaceholder')"
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
                            t('productPricesFilterDrawer.brands')
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
                                </template>
                            </Checkbox>
                        </div>
                    </div>
                </Collapse>

                <Collapse v-if="priceRanges?.local_price">
                    <template #title>
                        <span class="text-subtitle font-medium">{{
                            t('productPricesFilterDrawer.localPriceRange')
                        }}</span>
                    </template>
                    <div class="filter-section">
                        <RangeSlider
                            v-model="localPriceRangeModel"
                            :min="priceRanges.local_price.min"
                            :max="priceRanges.local_price.max"
                            :step="getSliderStep(priceRanges.local_price)"
                            :show-inputs="true"
                            :show-range="false"
                            :show-selected-range="false"
                            :format-type="'currency'"
                            :currency="currencyCode"
                            :min-placeholder="t('productPricesFilterDrawer.minPrice')"
                            :max-placeholder="t('productPricesFilterDrawer.maxPrice')"
                            input-size="md"
                            @change="handleLocalPriceChange"
                        />
                    </div>
                </Collapse>

                <Collapse v-if="priceRanges?.export_price">
                    <template #title>
                        <span class="text-subtitle font-medium">{{
                            t('productPricesFilterDrawer.exportPriceRange')
                        }}</span>
                    </template>
                    <div class="filter-section">
                        <RangeSlider
                            v-model="exportPriceRangeModel"
                            :min="priceRanges.export_price.min"
                            :max="priceRanges.export_price.max"
                            :step="getSliderStep(priceRanges.export_price)"
                            :show-inputs="true"
                            :show-range="false"
                            :show-selected-range="false"
                            :format-type="'currency'"
                            :currency="currencyCode"
                            :min-placeholder="t('productPricesFilterDrawer.minPrice')"
                            :max-placeholder="t('productPricesFilterDrawer.maxPrice')"
                            input-size="md"
                            @change="handleExportPriceChange"
                        />
                    </div>
                </Collapse>

                <Collapse v-if="priceRanges?.local_discount_price">
                    <template #title>
                        <span class="text-subtitle font-medium">{{
                            t('productPricesFilterDrawer.localDiscountPriceRange')
                        }}</span>
                    </template>
                    <div class="filter-section">
                        <RangeSlider
                            v-model="localDiscountPriceRangeModel"
                            :min="priceRanges.local_discount_price.min"
                            :max="priceRanges.local_discount_price.max"
                            :step="getSliderStep(priceRanges.local_discount_price)"
                            :show-inputs="true"
                            :show-range="false"
                            :show-selected-range="false"
                            :format-type="'currency'"
                            :currency="currencyCode"
                            :min-placeholder="t('productPricesFilterDrawer.minPrice')"
                            :max-placeholder="t('productPricesFilterDrawer.maxPrice')"
                            input-size="md"
                            @change="handleLocalDiscountPriceChange"
                        />
                    </div>
                </Collapse>

                <Collapse v-if="priceRanges?.export_discount_price">
                    <template #title>
                        <span class="text-subtitle font-medium">{{
                            t('productPricesFilterDrawer.exportDiscountPriceRange')
                        }}</span>
                    </template>
                    <div class="filter-section">
                        <RangeSlider
                            v-model="exportDiscountPriceRangeModel"
                            :min="priceRanges.export_discount_price.min"
                            :max="priceRanges.export_discount_price.max"
                            :step="getSliderStep(priceRanges.export_discount_price)"
                            :show-inputs="true"
                            :show-range="false"
                            :show-selected-range="false"
                            :format-type="'currency'"
                            :currency="currencyCode"
                            :min-placeholder="t('productPricesFilterDrawer.minPrice')"
                            :max-placeholder="t('productPricesFilterDrawer.maxPrice')"
                            input-size="md"
                            @change="handleExportDiscountPriceChange"
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
    import type { ProductPricesFilters } from '~/types/dashboardProduct'

    interface Props {
        isOpen: boolean
        filters?: ProductPricesFilters
    }

    const props = withDefaults(defineProps<Props>(), {
        filters: () => ({
            search: '',
            brand_names: [],
            local_price_from: undefined,
            local_price_to: undefined,
            export_price_from: undefined,
            export_price_to: undefined,
            local_discount_price_from: undefined,
            local_discount_price_to: undefined,
            export_discount_price_from: undefined,
            export_discount_price_to: undefined,
        }),
    })

    const emit = defineEmits<{
        'update:isOpen': [value: boolean]
        apply: [filters: ProductPricesFilters]
        reset: []
    }>()

    const { t } = useI18n()
    const dashboardProductStore = useDashboardProductStore()

    const initializationError = ref<string | null>(null)
    const isInitializing = ref(false)
    const searchQuery = ref('')
    const selectedBrands = ref<string[]>([])
    const localPriceRangeModel = ref<{ min: number | null; max: number | null }>({
        min: null,
        max: null,
    })
    const exportPriceRangeModel = ref<{ min: number | null; max: number | null }>({
        min: null,
        max: null,
    })
    const localDiscountPriceRangeModel = ref<{ min: number | null; max: number | null }>({
        min: null,
        max: null,
    })
    const exportDiscountPriceRangeModel = ref<{ min: number | null; max: number | null }>({
        min: null,
        max: null,
    })

    const defaultFilters: ProductPricesFilters = {
        search: '',
        brand_names: [],
        local_price_from: undefined,
        local_price_to: undefined,
        export_price_from: undefined,
        export_price_to: undefined,
        local_discount_price_from: undefined,
        local_discount_price_to: undefined,
        export_discount_price_from: undefined,
        export_discount_price_to: undefined,
    }

    const localFilters = ref<ProductPricesFilters>({ ...defaultFilters })

    const brandOptions = computed(() => {
        const brandNames = dashboardProductStore.priceFilters?.brand_names
        if (!Array.isArray(brandNames)) return []

        return brandNames.map((name) => ({
            name: name,
        }))
    })

    const priceRanges = computed(() => {
        return dashboardProductStore.priceFilters?.price_ranges || null
    })

    const currencyInfo = computed(() => {
        return dashboardProductStore.priceFilters?.user_currency || null
    })

    const currencyCode = computed(() => {
        return currencyInfo.value?.code || 'EUR'
    })

    const activeFiltersCount = computed(() => {
        let count = 0

        if (searchQuery.value?.trim()) count++
        if (selectedBrands.value.length > 0) count++
        if (localPriceRangeModel.value.min !== null || localPriceRangeModel.value.max !== null)
            count++
        if (exportPriceRangeModel.value.min !== null || exportPriceRangeModel.value.max !== null)
            count++
        if (
            localDiscountPriceRangeModel.value.min !== null ||
            localDiscountPriceRangeModel.value.max !== null
        )
            count++
        if (
            exportDiscountPriceRangeModel.value.min !== null ||
            exportDiscountPriceRangeModel.value.max !== null
        )
            count++

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
            await dashboardProductStore.fetchPriceFilters()
        } catch (error: any) {
            console.error('Failed to initialize price filter data:', error)
            initializationError.value = error.message || t('productPricesFilterDrawer.loadError')
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

    const handleLocalPriceChange = (value: { min: number | null; max: number | null }) => {
        localPriceRangeModel.value = value
    }

    const handleExportPriceChange = (value: { min: number | null; max: number | null }) => {
        exportPriceRangeModel.value = value
    }

    const handleLocalDiscountPriceChange = (value: { min: number | null; max: number | null }) => {
        localDiscountPriceRangeModel.value = value
    }

    const handleExportDiscountPriceChange = (value: { min: number | null; max: number | null }) => {
        exportDiscountPriceRangeModel.value = value
    }

    const applyFilters = () => {
        const productFilters: ProductPricesFilters = {}

        if (searchQuery.value?.trim()) {
            productFilters.search = searchQuery.value.trim()
        }

        if (selectedBrands.value.length > 0) {
            productFilters.brand_names = [...selectedBrands.value]
        }

        if (localPriceRangeModel.value.min !== null) {
            productFilters.local_price_from = localPriceRangeModel.value.min
        }

        if (localPriceRangeModel.value.max !== null) {
            productFilters.local_price_to = localPriceRangeModel.value.max
        }

        if (exportPriceRangeModel.value.min !== null) {
            productFilters.export_price_from = exportPriceRangeModel.value.min
        }

        if (exportPriceRangeModel.value.max !== null) {
            productFilters.export_price_to = exportPriceRangeModel.value.max
        }

        if (localDiscountPriceRangeModel.value.min !== null) {
            productFilters.local_discount_price_from = localDiscountPriceRangeModel.value.min
        }

        if (localDiscountPriceRangeModel.value.max !== null) {
            productFilters.local_discount_price_to = localDiscountPriceRangeModel.value.max
        }

        if (exportDiscountPriceRangeModel.value.min !== null) {
            productFilters.export_discount_price_from = exportDiscountPriceRangeModel.value.min
        }

        if (exportDiscountPriceRangeModel.value.max !== null) {
            productFilters.export_discount_price_to = exportDiscountPriceRangeModel.value.max
        }

        emit('apply', productFilters)
        emit('update:isOpen', false)
    }

    const resetFilters = () => {
        searchQuery.value = ''
        selectedBrands.value = []
        localPriceRangeModel.value = { min: null, max: null }
        exportPriceRangeModel.value = { min: null, max: null }
        localDiscountPriceRangeModel.value = { min: null, max: null }
        exportDiscountPriceRangeModel.value = { min: null, max: null }
        localFilters.value = { ...defaultFilters }

        emit('reset')

        const emptyFilters: ProductPricesFilters = { ...defaultFilters }
        emit('apply', emptyFilters)
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

            localPriceRangeModel.value = {
                min: props.filters.local_price_from ?? null,
                max: props.filters.local_price_to ?? null,
            }

            exportPriceRangeModel.value = {
                min: props.filters.export_price_from ?? null,
                max: props.filters.export_price_to ?? null,
            }

            localDiscountPriceRangeModel.value = {
                min: props.filters.local_discount_price_from ?? null,
                max: props.filters.local_discount_price_to ?? null,
            }

            exportDiscountPriceRangeModel.value = {
                min: props.filters.export_discount_price_from ?? null,
                max: props.filters.export_discount_price_to ?? null,
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
