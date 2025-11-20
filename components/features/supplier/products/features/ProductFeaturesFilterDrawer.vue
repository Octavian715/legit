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
                        :placeholder="t('productFeaturesFilterDrawer.searchPlaceholder')"
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
                            t('productFeaturesFilterDrawer.brands')
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

                <Collapse v-if="categoryOptions && categoryOptions.length > 0">
                    <template #title>
                        <span class="text-subtitle font-medium">{{
                            t('productFeaturesFilterDrawer.categories')
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
                                </template>
                            </Checkbox>
                        </div>
                    </div>
                </Collapse>

                <Collapse v-if="featureOptions && featureOptions.length > 0">
                    <template #title>
                        <span class="text-subtitle font-medium">{{
                            t('productFeaturesFilterDrawer.features')
                        }}</span>
                    </template>
                    <div class="filter-section">
                        <div class="filter-options">
                            <Checkbox
                                v-for="feature in featureOptions"
                                :key="`feature-${feature.id}`"
                                :model-value="isFeatureSelected(feature.id)"
                                :name="`feature-${feature.id}`"
                                size="md"
                                @update:model-value="(value) => toggleFeature(feature.id, value)"
                            >
                                <template #default>
                                    <span class="text-body">{{ feature.name }}</span>
                                </template>
                            </Checkbox>
                        </div>
                    </div>
                </Collapse>

                <Collapse>
                    <template #title>
                        <span class="text-subtitle font-medium">{{
                            t('productFeaturesFilterDrawer.featuresFilter')
                        }}</span>
                    </template>
                    <div class="filter-section">
                        <div class="space-y-2">
                            <Radiobox
                                :model-value="hasFeatures"
                                :value="null"
                                name="has-features"
                                @update:model-value="updateHasFeatures"
                            >
                                {{ t('productFeaturesFilterDrawer.allProducts') }}
                            </Radiobox>
                            <Radiobox
                                :model-value="hasFeatures"
                                :value="true"
                                name="has-features"
                                @update:model-value="updateHasFeatures"
                            >
                                {{ t('productFeaturesFilterDrawer.withFeatures') }}
                            </Radiobox>
                            <Radiobox
                                :model-value="hasFeatures"
                                :value="false"
                                name="has-features"
                                @update:model-value="updateHasFeatures"
                            >
                                {{ t('productFeaturesFilterDrawer.withoutFeatures') }}
                            </Radiobox>
                        </div>
                    </div>
                </Collapse>

                <Collapse v-if="salesDateRange">
                    <template #title>
                        <span class="text-subtitle font-medium">{{
                            t('productFeaturesFilterDrawer.salesDateRange')
                        }}</span>
                    </template>
                    <div class="filter-section">
                        <div class="space-y-3">
                            <DatePicker
                                v-model="dateRange"
                                :label="t('productFeaturesFilterDrawer.salesDateRange')"
                                :placeholder="t('productFeaturesFilterDrawer.selectDateRange')"
                                :is-range-mode="true"
                                date-format="yyyy-MM-dd"
                                size="md"
                            />
                            <p v-if="salesDateRange" class="text-xs text-gray-500">
                                {{
                                    t('productFeaturesFilterDrawer.availableDateRange', {
                                        start: formatDate(salesDateRange.earliest_sale),
                                        end: formatDate(salesDateRange.latest_sale),
                                    })
                                }}
                            </p>
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
    import { ref, computed, watch } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useDashboardProductStore } from '~/stores/dashboardProduct'
    import type { ProductFeaturesFilters } from '~/types/dashboardProduct'
    import { useDate } from '~/composables/useDate'
    import type { DateRange } from '~/types/ui/datePicker'

    interface Props {
        isOpen: boolean
        filters?: ProductFeaturesFilters
    }

    const props = withDefaults(defineProps<Props>(), {
        filters: () => ({
            search: '',
            brand_names: [],
            category_ids: [],
            feature_ids: [],
            has_features: undefined,
            start_date: undefined,
            end_date: undefined,
        }),
    })

    const emit = defineEmits<{
        'update:isOpen': [value: boolean]
        apply: [filters: ProductFeaturesFilters]
        reset: []
    }>()

    const { t } = useI18n()
    const { formatDate } = useDate()
    const dashboardProductStore = useDashboardProductStore()

    const initializationError = ref<string | null>(null)
    const isInitializing = ref(false)
    const searchQuery = ref('')
    const selectedBrands = ref<string[]>([])
    const selectedCategories = ref<number[]>([])
    const selectedFeatures = ref<number[]>([])
    const hasFeatures = ref<boolean | undefined>(undefined)
    const dateRange = ref<DateRange>({ start: '', end: '' })

    const defaultFilters: ProductFeaturesFilters = {
        search: '',
        brand_names: [],
        category_ids: [],
        feature_ids: [],
        has_features: undefined,
        start_date: undefined,
        end_date: undefined,
    }

    const localFilters = ref<ProductFeaturesFilters>({ ...defaultFilters })

    const brandOptions = computed(() => {
        const brands = dashboardProductStore.featureFilters?.brands
        if (!Array.isArray(brands)) return []

        return brands.map((brand) => ({
            name: brand.name,
            products_count: brand.products_count,
        }))
    })

    const categoryOptions = computed(() => {
        const categories = dashboardProductStore.featureFilters?.categories
        if (!Array.isArray(categories)) return []

        return categories.map((category) => ({
            id: category.id,
            name: category.name,
            products_count: category.products_count,
        }))
    })

    const featureOptions = computed(() => {
        const features = dashboardProductStore.featureFilters?.features
        if (!Array.isArray(features)) return []

        return features.map((feature) => ({
            id: feature.id,
            name: feature.name,
            products_count: feature.products_count,
        }))
    })

    const salesDateRange = computed(() => {
        return dashboardProductStore.featureFilters?.sales_date_range || null
    })

    const activeFiltersCount = computed(() => {
        let count = 0

        if (searchQuery.value?.trim()) count++
        if (selectedBrands.value.length > 0) count++
        if (selectedCategories.value.length > 0) count++
        if (selectedFeatures.value.length > 0) count++
        if (hasFeatures.value !== undefined) count++
        if (dateRange.value.start || dateRange.value.end) count++

        return count
    })

    const initializeFilterData = async (): Promise<void> => {
        isInitializing.value = true
        initializationError.value = null

        try {
            await dashboardProductStore.fetchFeatureFilters()

            // Ensure dateRange is properly initialized
            if (!dateRange.value || typeof dateRange.value !== 'object') {
                dateRange.value = { start: '', end: '' }
            }
        } catch (error: any) {
            console.error('Failed to initialize feature filter data:', error)
            initializationError.value = error.message || t('productFeaturesFilterDrawer.loadError')
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

    const isFeatureSelected = (featureId: number): boolean => {
        return selectedFeatures.value.includes(featureId)
    }

    const toggleFeature = (featureId: number, isSelected: boolean) => {
        if (isSelected) {
            if (!selectedFeatures.value.includes(featureId)) {
                selectedFeatures.value.push(featureId)
            }
        } else {
            selectedFeatures.value = selectedFeatures.value.filter((id) => id !== featureId)
        }
    }

    const updateHasFeatures = (value: boolean | undefined) => {
        hasFeatures.value = value
    }

    const applyFilters = () => {
        const productFilters: ProductFeaturesFilters = {}

        if (searchQuery.value?.trim()) {
            productFilters.search = searchQuery.value.trim()
        }

        if (selectedBrands.value.length > 0) {
            productFilters.brand_names = [...selectedBrands.value]
        }

        if (selectedCategories.value.length > 0) {
            productFilters.category_ids = [...selectedCategories.value]
        }

        if (selectedFeatures.value.length > 0) {
            productFilters.feature_ids = [...selectedFeatures.value]
        }

        if (hasFeatures.value !== undefined) {
            productFilters.has_features = hasFeatures.value
        }

        if (dateRange.value.start) {
            productFilters.start_date = dateRange.value.start
        }

        if (dateRange.value.end) {
            productFilters.end_date = dateRange.value.end
        }

        emit('apply', productFilters)
        emit('update:isOpen', false)
    }

    const resetFilters = () => {
        searchQuery.value = ''
        selectedBrands.value = []
        selectedCategories.value = []
        selectedFeatures.value = []
        hasFeatures.value = undefined
        dateRange.value = { start: '', end: '' }
        localFilters.value = { ...defaultFilters }

        emit('reset')

        const emptyFilters: ProductFeaturesFilters = { ...defaultFilters }
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
            selectedFeatures.value = normalizeFilterValue(props.filters.feature_ids)
            hasFeatures.value = props.filters.has_features
            dateRange.value = {
                start: props.filters.start_date || '',
                end: props.filters.end_date || '',
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
        @apply grid grid-cols-1 gap-2;
    }

    .filter-footer {
        @apply flex gap-3 px-4;
    }
</style>
