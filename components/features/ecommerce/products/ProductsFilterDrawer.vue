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

                <Collapse v-if="categoriesOptions && categoriesOptions.length > 0">
                    <template #title>
                        <span class="text-subtitle font-medium">{{
                            t('allProductsFilterDrawer.categories')
                        }}</span>
                    </template>
                    <div class="filter-section">
                        <div class="filter-options">
                            <Checkbox
                                v-for="category in categoriesOptions"
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

                <Collapse v-if="subcategoriesOptions && subcategoriesOptions.length > 0">
                    <template #title>
                        <span class="text-subtitle font-medium">{{
                            t('allProductsFilterDrawer.subcategories')
                        }}</span>
                    </template>
                    <div class="filter-section">
                        <div class="filter-options">
                            <Checkbox
                                v-for="subcategory in subcategoriesOptions"
                                :key="`subcategory-${subcategory.id}`"
                                :model-value="isSubcategorySelected(subcategory.id)"
                                :name="`subcategory-${subcategory.id}`"
                                size="md"
                                @update:model-value="
                                    (value) => toggleSubcategory(subcategory.id, value)
                                "
                            >
                                <template #default>
                                    <span class="text-body">{{ subcategory.name }}</span>
                                </template>
                            </Checkbox>
                        </div>
                    </div>
                </Collapse>

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
                                </template>
                            </Checkbox>
                        </div>
                    </div>
                </Collapse>

                <Collapse v-if="priceRange && priceRange.max > 0">
                    <template #title>
                        <span class="text-subtitle font-medium">{{
                            t('allProductsFilterDrawer.localPriceRange')
                        }}</span>
                    </template>
                    <div class="filter-section">
                        <RangeSlider
                            v-model="priceRangeModel"
                            :min="priceRange.min"
                            :max="priceRange.max"
                            :step="getSliderStep(priceRange)"
                            :show-inputs="true"
                            :show-range="false"
                            :show-selected-range="false"
                            :format-type="'currency'"
                            :currency="'EUR'"
                            :min-placeholder="t('allProductsFilterDrawer.minPrice')"
                            :max-placeholder="t('allProductsFilterDrawer.maxPrice')"
                            input-size="md"
                            @change="handlePriceChange"
                        />
                    </div>
                </Collapse>

                <Collapse v-if="supplierCountriesOptions && supplierCountriesOptions.length > 0">
                    <template #title>
                        <span class="text-subtitle font-medium">{{
                            t('allProductsFilterDrawer.supplierCountries')
                        }}</span>
                    </template>
                    <div class="filter-section">
                        <div class="filter-options">
                            <Checkbox
                                v-for="country in supplierCountriesOptions"
                                :key="`supplier-country-${country.id}`"
                                :model-value="isSupplierCountrySelected(country.id)"
                                :name="`supplier-country-${country.id}`"
                                size="md"
                                @update:model-value="
                                    (value) => toggleSupplierCountry(country.id, value)
                                "
                            >
                                <template #default>
                                    <span class="text-body">{{ country.name }}</span>
                                </template>
                            </Checkbox>
                        </div>
                    </div>
                </Collapse>

                <Collapse
                    v-if="availabilityCountriesOptions && availabilityCountriesOptions.length > 0"
                >
                    <template #title>
                        <span class="text-subtitle font-medium">{{
                            t('allProductsFilterDrawer.availabilityCountries')
                        }}</span>
                    </template>
                    <div class="filter-section">
                        <div class="filter-options">
                            <Checkbox
                                v-for="country in availabilityCountriesOptions"
                                :key="`availability-country-${country.id}`"
                                :model-value="isAvailabilityCountrySelected(country.id)"
                                :name="`availability-country-${country.id}`"
                                size="md"
                                @update:model-value="
                                    (value) => toggleAvailabilityCountry(country.id, value)
                                "
                            >
                                <template #default>
                                    <span class="text-body">{{ country.name }}</span>
                                </template>
                            </Checkbox>
                        </div>
                    </div>
                </Collapse>

                <Collapse v-if="featuresOptions && featuresOptions.length > 0">
                    <template #title>
                        <span class="text-subtitle font-medium">{{
                            t('allProductsFilterDrawer.features')
                        }}</span>
                    </template>
                    <div class="filter-section">
                        <div class="filter-options">
                            <Checkbox
                                v-for="feature in featuresOptions"
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
                            <Checkbox
                                v-model="hasDiscount"
                                name="has-discount"
                                size="md"
                                @update:model-value="handleDiscountToggle"
                            >
                                <template #default>
                                    <span class="text-body">{{
                                        t('allProductsFilterDrawer.hasDiscount')
                                    }}</span>
                                </template>
                            </Checkbox>

                            <Checkbox
                                v-model="onlyFavorites"
                                name="only-favorites"
                                size="md"
                                @update:model-value="handleFavoritesToggle"
                            >
                                <template #default>
                                    <span class="text-body">{{
                                        t('allProductsFilterDrawer.onlyFavorites')
                                    }}</span>
                                </template>
                            </Checkbox>
                        </div>
                    </div>
                </Collapse>

                <Collapse v-if="additionalFeaturesOptions && additionalFeaturesOptions.length > 0">
                    <template #title>
                        <span class="text-subtitle font-medium">{{
                            t('allProductsFilterDrawer.additionalFeatures')
                        }}</span>
                    </template>
                    <div class="filter-section">
                        <div class="filter-options">
                            <Checkbox
                                v-for="feature in additionalFeaturesOptions"
                                :key="`additional-feature-${feature.id}`"
                                :model-value="isAdditionalFeatureSelected(feature.id)"
                                :name="`additional-feature-${feature.id}`"
                                size="md"
                                @update:model-value="
                                    (value) => toggleAdditionalFeature(feature.id, value)
                                "
                            >
                                <template #default>
                                    <span class="text-body">{{ feature.name }}</span>
                                </template>
                            </Checkbox>
                        </div>
                    </div>
                </Collapse>

                <Collapse v-if="storageConditionsOptions && storageConditionsOptions.length > 0">
                    <template #title>
                        <span class="text-subtitle font-medium">{{
                            t('allProductsFilterDrawer.storageConditions')
                        }}</span>
                    </template>
                    <div class="filter-section">
                        <div class="filter-options">
                            <Checkbox
                                v-for="condition in storageConditionsOptions"
                                :key="`condition-${condition.id}`"
                                :model-value="isConditionSelected(condition.id)"
                                :name="`condition-${condition.id}`"
                                size="md"
                                @update:model-value="
                                    (value) => toggleCondition(condition.id, value)
                                "
                            >
                                <template #default>
                                    <span class="text-body">{{ condition.name }}</span>
                                </template>
                            </Checkbox>
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
    import type { ProductFilters } from '~/types/products'

    interface Props {
        isOpen: boolean
        filters?: Partial<ProductFilters>
        filterOptions?: any
        counts?: any
    }

    const props = withDefaults(defineProps<Props>(), {
        filters: () => ({}),
        filterOptions: () => null,
        counts: () => null,
    })

    const emit = defineEmits<{
        'update:isOpen': [value: boolean]
        apply: [filters: Partial<ProductFilters>]
        reset: []
    }>()

    const { t } = useI18n()
    const productsStore = useProductsStore()

    const initializationError = ref<string | null>(null)
    const isInitializing = ref(false)
    const searchQuery = ref('')
    const selectedCategories = ref<number[]>([])
    const selectedSubcategories = ref<number[]>([])
    const selectedBrands = ref<string[]>([])
    const selectedSupplierCountries = ref<number[]>([])
    const selectedAvailabilityCountries = ref<number[]>([])
    const selectedFeatures = ref<number[]>([])
    const selectedAdditionalFeatures = ref<number[]>([])
    const selectedConditions = ref<number[]>([])
    const priceRangeModel = ref<{ min: number | null; max: number | null }>({
        min: null,
        max: null,
    })
    const hasDiscount = ref(false)
    const onlyFavorites = ref(false)

    const defaultFilters: Partial<ProductFilters> = {
        search: '',
        categories: [],
        subcategories: [],
        brands: [],
        price_min: undefined,
        price_max: undefined,
        supplier_countries: [],
        availability_countries: [],
        features: [],
        additional_features: [],
        conditions: [],
        has_discount: undefined,
        only_favorites: undefined,
    }

    const localFilters = ref<Partial<ProductFilters>>({ ...defaultFilters })

    const categoriesOptions = computed(() => {
        return props.filterOptions?.categories || []
    })

    const subcategoriesOptions = computed(() => {
        return props.filterOptions?.subcategories || []
    })

    const brandOptions = computed(() => {
        return props.filterOptions?.brands || []
    })

    const supplierCountriesOptions = computed(() => {
        return props.filterOptions?.countries || []
    })

    const availabilityCountriesOptions = computed(() => {
        return props.filterOptions?.countries || []
    })

    const featuresOptions = computed(() => {
        return props.filterOptions?.features || []
    })

    const additionalFeaturesOptions = computed(() => {
        return props.filterOptions?.additional_features || []
    })

    const storageConditionsOptions = computed(() => {
        return props.filterOptions?.storage_conditions || []
    })

    const priceRange = computed(() => {
        return props.filterOptions?.price_range || null
    })

    const activeFiltersCount = computed(() => {
        let count = 0

        if (searchQuery.value?.trim()) count++
        if (selectedCategories.value.length > 0) count++
        if (selectedSubcategories.value.length > 0) count++
        if (selectedBrands.value.length > 0) count++
        if (selectedSupplierCountries.value.length > 0) count++
        if (selectedAvailabilityCountries.value.length > 0) count++
        if (selectedFeatures.value.length > 0) count++
        if (selectedAdditionalFeatures.value.length > 0) count++
        if (selectedConditions.value.length > 0) count++
        if (priceRangeModel.value.min !== null || priceRangeModel.value.max !== null) count++
        if (hasDiscount.value) count++
        if (onlyFavorites.value) count++

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
            await productsStore.fetchFilterOptions()
        } catch (error: any) {
            console.error('Failed to initialize filter data:', error)
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

    const isSubcategorySelected = (subcategoryId: number): boolean => {
        return selectedSubcategories.value.includes(subcategoryId)
    }

    const toggleSubcategory = (subcategoryId: number, isSelected: boolean) => {
        if (isSelected) {
            if (!selectedSubcategories.value.includes(subcategoryId)) {
                selectedSubcategories.value.push(subcategoryId)
            }
        } else {
            selectedSubcategories.value = selectedSubcategories.value.filter(
                (id) => id !== subcategoryId
            )
        }
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

    const isSupplierCountrySelected = (countryId: number): boolean => {
        return selectedSupplierCountries.value.includes(countryId)
    }

    const toggleSupplierCountry = (countryId: number, isSelected: boolean) => {
        if (isSelected) {
            if (!selectedSupplierCountries.value.includes(countryId)) {
                selectedSupplierCountries.value.push(countryId)
            }
        } else {
            selectedSupplierCountries.value = selectedSupplierCountries.value.filter(
                (id) => id !== countryId
            )
        }
    }

    const isAvailabilityCountrySelected = (countryId: number): boolean => {
        return selectedAvailabilityCountries.value.includes(countryId)
    }

    const toggleAvailabilityCountry = (countryId: number, isSelected: boolean) => {
        if (isSelected) {
            if (!selectedAvailabilityCountries.value.includes(countryId)) {
                selectedAvailabilityCountries.value.push(countryId)
            }
        } else {
            selectedAvailabilityCountries.value = selectedAvailabilityCountries.value.filter(
                (id) => id !== countryId
            )
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

    const isAdditionalFeatureSelected = (featureId: number): boolean => {
        return selectedAdditionalFeatures.value.includes(featureId)
    }

    const toggleAdditionalFeature = (featureId: number, isSelected: boolean) => {
        if (isSelected) {
            if (!selectedAdditionalFeatures.value.includes(featureId)) {
                selectedAdditionalFeatures.value.push(featureId)
            }
        } else {
            selectedAdditionalFeatures.value = selectedAdditionalFeatures.value.filter(
                (id) => id !== featureId
            )
        }
    }

    const isConditionSelected = (conditionId: number): boolean => {
        return selectedConditions.value.includes(conditionId)
    }

    const toggleCondition = (conditionId: number, isSelected: boolean) => {
        if (isSelected) {
            if (!selectedConditions.value.includes(conditionId)) {
                selectedConditions.value.push(conditionId)
            }
        } else {
            selectedConditions.value = selectedConditions.value.filter((id) => id !== conditionId)
        }
    }

    const handlePriceChange = (value: { min: number | null; max: number | null }) => {
        priceRangeModel.value = value
    }

    const handleDiscountToggle = (value: boolean) => {
        hasDiscount.value = value
    }

    const handleFavoritesToggle = (value: boolean) => {
        onlyFavorites.value = value
    }

    const applyFilters = () => {
        const productFilters: Partial<ProductFilters> = {}

        if (searchQuery.value?.trim()) {
            productFilters.search = searchQuery.value.trim()
        }

        if (selectedCategories.value.length > 0) {
            productFilters.categories = [...selectedCategories.value]
        }

        if (selectedSubcategories.value.length > 0) {
            productFilters.subcategories = [...selectedSubcategories.value]
        }

        if (selectedBrands.value.length > 0) {
            productFilters.brands = [...selectedBrands.value]
        }

        if (priceRangeModel.value.min !== null) {
            productFilters.price_min = priceRangeModel.value.min
        }

        if (priceRangeModel.value.max !== null) {
            productFilters.price_max = priceRangeModel.value.max
        }

        if (selectedSupplierCountries.value.length > 0) {
            productFilters.supplier_countries = [...selectedSupplierCountries.value]
        }

        if (selectedAvailabilityCountries.value.length > 0) {
            productFilters.availability_countries = [...selectedAvailabilityCountries.value]
        }

        if (selectedFeatures.value.length > 0) {
            productFilters.features = [...selectedFeatures.value]
        }

        if (selectedAdditionalFeatures.value.length > 0) {
            productFilters.additional_features = [...selectedAdditionalFeatures.value]
        }

        if (selectedConditions.value.length > 0) {
            productFilters.conditions = [...selectedConditions.value]
        }

        if (hasDiscount.value) {
            productFilters.has_discount = true
        }

        if (onlyFavorites.value) {
            productFilters.only_favorites = true
        }

        emit('apply', productFilters)
        emit('update:isOpen', false)
    }

    const resetFilters = () => {
        searchQuery.value = ''
        selectedCategories.value = []
        selectedSubcategories.value = []
        selectedBrands.value = []
        selectedSupplierCountries.value = []
        selectedAvailabilityCountries.value = []
        selectedFeatures.value = []
        selectedAdditionalFeatures.value = []
        selectedConditions.value = []
        priceRangeModel.value = { min: null, max: null }
        hasDiscount.value = false
        onlyFavorites.value = false
        localFilters.value = { ...defaultFilters }

        emit('reset')

        const emptyFilters: Partial<ProductFilters> = { ...defaultFilters }
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
            selectedCategories.value = normalizeFilterValue(props.filters.categories)
            selectedSubcategories.value = normalizeFilterValue(props.filters.subcategories)
            selectedBrands.value = normalizeFilterValue(props.filters.brands)
            selectedSupplierCountries.value = normalizeFilterValue(props.filters.supplier_countries)
            selectedAvailabilityCountries.value = normalizeFilterValue(
                props.filters.availability_countries
            )
            selectedFeatures.value = normalizeFilterValue(props.filters.features)
            selectedAdditionalFeatures.value = normalizeFilterValue(
                props.filters.additional_features
            )
            selectedConditions.value = normalizeFilterValue(props.filters.conditions)

            priceRangeModel.value = {
                min: props.filters.price_min ?? null,
                max: props.filters.price_max ?? null,
            }

            hasDiscount.value = props.filters.has_discount || false
            onlyFavorites.value = props.filters.only_favorites || false
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
