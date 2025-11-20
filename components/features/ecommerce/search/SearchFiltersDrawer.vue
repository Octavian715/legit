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
            </div>
            <div v-else-if="initializationError" class="p-4 bg-red-50 rounded-lg"> </div>

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

                <template v-if="isProductTab">
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
                                    @update:model-value="
                                        (value) => toggleCategory(category.id, value)
                                    "
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
                                    :key="`brand-${brand.value}`"
                                    :model-value="isBrandSelected(brand.value)"
                                    :name="`brand-${brand.value}`"
                                    size="md"
                                    @update:model-value="(value) => toggleBrand(brand.value, value)"
                                >
                                    <template #default>
                                        <span class="text-body">{{ brand.name }}</span>
                                    </template>
                                </Checkbox>
                            </div>
                        </div>
                    </Collapse>

                    <Collapse v-if="priceRange">
                        <template #title>
                            <span class="text-subtitle font-medium">{{
                                t('allProductsFilterDrawer.priceRange')
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
                                currency="EUR"
                                :min-placeholder="t('allProductsFilterDrawer.minPrice')"
                                :max-placeholder="t('allProductsFilterDrawer.maxPrice')"
                                input-size="md"
                                @change="handlePriceRangeChange"
                            />
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
                                    @update:model-value="
                                        (value) => toggleFeature(feature.id, value)
                                    "
                                >
                                    <template #default>
                                        <span class="text-body">{{ feature.name }}</span>
                                    </template>
                                </Checkbox>
                                <Checkbox v-model="hasDiscount" name="has_discount" size="md">
                                    <template #default>
                                        <span class="text-body">{{
                                            t('allProductsFilterDrawer.hasDiscount')
                                        }}</span>
                                    </template>
                                </Checkbox>
                                <Checkbox v-model="onlyFavorites" name="only_favorites" size="md">
                                    <template #default>
                                        <span class="text-body">{{
                                            t('allProductsFilterDrawer.onlyFavorites')
                                        }}</span>
                                    </template>
                                </Checkbox>
                                <Checkbox v-model="myProducts" name="my_products" size="md">
                                    <template #default>
                                        <span class="text-body">{{
                                            t('allProductsFilterDrawer.myProducts')
                                        }}</span>
                                    </template>
                                </Checkbox>
                            </div>
                        </div>
                    </Collapse>

                    <Collapse
                        v-if="additionalFeaturesOptions && additionalFeaturesOptions.length > 0"
                    >
                        <template #title>
                            <span class="text-subtitle font-medium">{{
                                t('allProductsFilterDrawer.additionalFeatures')
                            }}</span>
                        </template>
                        <div class="filter-section">
                            <div class="filter-options">
                                <Checkbox
                                    v-for="feature in additionalFeaturesOptions"
                                    :key="`additional-${feature.id}`"
                                    :model-value="isAdditionalFeatureSelected(feature.id)"
                                    :name="`additional-${feature.id}`"
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

                    <Collapse
                        v-if="storageConditionsOptions && storageConditionsOptions.length > 0"
                    >
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

                    <Collapse
                        v-if="supplierCountriesOptions && supplierCountriesOptions.length > 0"
                    >
                        <template #title>
                            <span class="text-subtitle font-medium">{{
                                t('allProductsFilterDrawer.supplierCountries')
                            }}</span>
                        </template>
                        <div class="filter-section">
                            <div class="filter-options">
                                <Checkbox
                                    v-for="country in supplierCountriesOptions"
                                    :key="`supplier-${country.id}`"
                                    :model-value="isSupplierCountrySelected(country.id)"
                                    :name="`supplier-${country.id}`"
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
                        v-if="
                            availabilityCountriesOptions && availabilityCountriesOptions.length > 0
                        "
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
                                    :key="`availability-${country.id}`"
                                    :model-value="isAvailabilityCountrySelected(country.id)"
                                    :name="`availability-${country.id}`"
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
                </template>

                <template v-else>
                    <Collapse v-if="businessTypesOptions && businessTypesOptions.length > 0">
                        <template #title>
                            <span class="text-subtitle font-medium">{{
                                t('table.businessType')
                            }}</span>
                        </template>
                        <div class="filter-section">
                            <Select
                                v-model="selectedBusinessType"
                                :options="businessTypesOptions"
                                :label="t('table.businessType')"
                                select-label="name"
                                :reduce="(option) => option.id"
                                :clearable="true"
                                name="business_type"
                                size="lg"
                                background="bg-gray-150"
                            />
                        </div>
                    </Collapse>
                    <Collapse v-if="companyCountriesOptions && companyCountriesOptions.length > 0">
                        <template #title>
                            <span class="text-subtitle font-medium">{{ t('table.country') }}</span>
                        </template>
                        <div class="filter-section">
                            <Select
                                v-model="selectedCountry"
                                :options="companyCountriesOptions"
                                :label="t('table.country')"
                                select-label="name"
                                :reduce="(option) => option.id"
                                :clearable="true"
                                name="country"
                                size="lg"
                                background="bg-gray-150"
                            />
                        </div>
                    </Collapse>
                </template>
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
    import { ref, computed, watch, nextTick } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useSearchStore } from '~/stores/search'
    import type { SearchProductFilters, SearchCompanyFilters } from '~/types/search'

    interface Props {
        isOpen: boolean
        tab: 'all' | 'products' | 'companies'
        activeFilters?: any
    }

    const props = withDefaults(defineProps<Props>(), {
        isOpen: false,
        tab: 'all',
    })

    const emit = defineEmits<{
        'update:isOpen': [value: boolean]
        apply: [filters: any]
        reset: []
    }>()

    const { t } = useI18n()
    const searchStore = useSearchStore()

    // State
    const isInitializing = ref(false)
    const initializationError = ref<string | null>(null)
    const isSubmitting = ref(false)

    // CRITICAL FIX: Include 'all' in product tabs
    const isProductTab = computed(() => props.tab === 'all' || props.tab === 'products')

    // Local filter state
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
    const myProducts = ref(false)

    // Company filters
    const selectedBusinessType = ref<number | null>(null)
    const selectedCountry = ref<number | null>(null)

    // Filter options from store
    const categoriesOptions = computed(() => {
        return searchStore.filterOptions?.categories || []
    })

    const subcategoriesOptions = computed(() => {
        return searchStore.filterOptions?.subcategories || []
    })

    const brandOptions = computed(() => {
        return searchStore.filterOptions?.brands || []
    })

    const supplierCountriesOptions = computed(() => {
        return searchStore.filterOptions?.countries || []
    })

    const availabilityCountriesOptions = computed(() => {
        return searchStore.filterOptions?.countries || []
    })

    const featuresOptions = computed(() => {
        return searchStore.filterOptions?.features || []
    })

    const additionalFeaturesOptions = computed(() => {
        return searchStore.filterOptions?.additional_features || []
    })

    const storageConditionsOptions = computed(() => {
        return searchStore.filterOptions?.storage_conditions || []
    })

    const priceRange = computed(() => {
        return searchStore.filterOptions?.price_range || null
    })

    // Company filter options
    const businessTypesOptions = computed(() => {
        return searchStore.companyFilterOptions?.business_types || []
    })

    const companyCountriesOptions = computed(() => {
        return searchStore.companyFilterOptions?.countries || []
    })

    // Active filters count
    const activeFiltersCount = computed(() => {
        let count = 0

        if (isProductTab.value) {
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
            if (myProducts.value) count++
        } else {
            if (selectedBusinessType.value) count++
            if (selectedCountry.value) count++
        }

        return count
    })

    // Helper functions to get current filters
    const getCurrentProductFilters = (): Partial<SearchProductFilters> => {
        const filters: Partial<SearchProductFilters> = {
            search: searchQuery.value || undefined,
            categories: selectedCategories.value.length > 0 ? selectedCategories.value : undefined,
            subcategories:
                selectedSubcategories.value.length > 0 ? selectedSubcategories.value : undefined,
            brands: selectedBrands.value.length > 0 ? selectedBrands.value : undefined,
            supplier_countries:
                selectedSupplierCountries.value.length > 0
                    ? selectedSupplierCountries.value
                    : undefined,
            availability_countries:
                selectedAvailabilityCountries.value.length > 0
                    ? selectedAvailabilityCountries.value
                    : undefined,
            features: selectedFeatures.value.length > 0 ? selectedFeatures.value : undefined,
            additional_features:
                selectedAdditionalFeatures.value.length > 0
                    ? selectedAdditionalFeatures.value
                    : undefined,
            conditions: selectedConditions.value.length > 0 ? selectedConditions.value : undefined,
            price_min: priceRangeModel.value.min ?? undefined,
            price_max: priceRangeModel.value.max ?? undefined,
            has_discount: hasDiscount.value || undefined,
            only_favorites: onlyFavorites.value || undefined,
            my_products: myProducts.value || undefined,
        }
        // Clean undefined values
        Object.keys(filters).forEach((key) => {
            if (filters[key as keyof typeof filters] === undefined) {
                delete filters[key as keyof typeof filters]
            }
        })
        return filters
    }

    const getCurrentCompanyFilters = (): Partial<SearchCompanyFilters> => {
        const filters: Partial<SearchCompanyFilters> = {
            business_type_id: selectedBusinessType.value ?? undefined,
            country_id: selectedCountry.value ?? undefined,
        }
        // Clean undefined values
        Object.keys(filters).forEach((key) => {
            if (filters[key as keyof typeof filters] === undefined) {
                delete filters[key as keyof typeof filters]
            }
        })
        return filters
    }

    // Helper functions
    const getSliderStep = (range: { min: number; max: number }): number => {
        if (!range) return 0.01
        const rangeValue = range.max - range.min
        if (rangeValue <= 10) return 0.01
        if (rangeValue <= 100) return 0.1
        if (rangeValue <= 1000) return 1
        return Math.max(1, Math.floor(rangeValue / 100))
    }

    // Selection check functions
    const isCategorySelected = (categoryId: number): boolean => {
        return selectedCategories.value.includes(categoryId)
    }

    const isSubcategorySelected = (subcategoryId: number): boolean => {
        return selectedSubcategories.value.includes(subcategoryId)
    }

    const isBrandSelected = (brandValue: string): boolean => {
        return selectedBrands.value.includes(brandValue)
    }

    const isSupplierCountrySelected = (countryId: number): boolean => {
        return selectedSupplierCountries.value.includes(countryId)
    }

    const isAvailabilityCountrySelected = (countryId: number): boolean => {
        return selectedAvailabilityCountries.value.includes(countryId)
    }

    const isFeatureSelected = (featureId: number): boolean => {
        return selectedFeatures.value.includes(featureId)
    }

    const isAdditionalFeatureSelected = (featureId: number): boolean => {
        return selectedAdditionalFeatures.value.includes(featureId)
    }

    const isConditionSelected = (conditionId: number): boolean => {
        return selectedConditions.value.includes(conditionId)
    }

    // Toggle functions
    const toggleCategory = (categoryId: number, value: boolean): void => {
        if (value && !selectedCategories.value.includes(categoryId)) {
            selectedCategories.value.push(categoryId)
        } else if (!value) {
            const index = selectedCategories.value.indexOf(categoryId)
            if (index > -1) {
                selectedCategories.value.splice(index, 1)
            }
        }
    }

    const toggleSubcategory = (subcategoryId: number, value: boolean): void => {
        if (value && !selectedSubcategories.value.includes(subcategoryId)) {
            selectedSubcategories.value.push(subcategoryId)
        } else if (!value) {
            const index = selectedSubcategories.value.indexOf(subcategoryId)
            if (index > -1) {
                selectedSubcategories.value.splice(index, 1)
            }
        }
    }

    const toggleBrand = (brandValue: string, value: boolean): void => {
        if (value && !selectedBrands.value.includes(brandValue)) {
            selectedBrands.value.push(brandValue)
        } else if (!value) {
            const index = selectedBrands.value.indexOf(brandValue)
            if (index > -1) {
                selectedBrands.value.splice(index, 1)
            }
        }
    }

    const toggleSupplierCountry = (countryId: number, value: boolean): void => {
        if (value && !selectedSupplierCountries.value.includes(countryId)) {
            selectedSupplierCountries.value.push(countryId)
        } else if (!value) {
            const index = selectedSupplierCountries.value.indexOf(countryId)
            if (index > -1) {
                selectedSupplierCountries.value.splice(index, 1)
            }
        }
    }

    const toggleAvailabilityCountry = (countryId: number, value: boolean): void => {
        if (value && !selectedAvailabilityCountries.value.includes(countryId)) {
            selectedAvailabilityCountries.value.push(countryId)
        } else if (!value) {
            const index = selectedAvailabilityCountries.value.indexOf(countryId)
            if (index > -1) {
                selectedAvailabilityCountries.value.splice(index, 1)
            }
        }
    }

    const toggleFeature = (featureId: number, value: boolean): void => {
        if (value && !selectedFeatures.value.includes(featureId)) {
            selectedFeatures.value.push(featureId)
        } else if (!value) {
            const index = selectedFeatures.value.indexOf(featureId)
            if (index > -1) {
                selectedFeatures.value.splice(index, 1)
            }
        }
    }

    const toggleAdditionalFeature = (featureId: number, value: boolean): void => {
        if (value && !selectedAdditionalFeatures.value.includes(featureId)) {
            selectedAdditionalFeatures.value.push(featureId)
        } else if (!value) {
            const index = selectedAdditionalFeatures.value.indexOf(featureId)
            if (index > -1) {
                selectedAdditionalFeatures.value.splice(index, 1)
            }
        }
    }

    const toggleCondition = (conditionId: number, value: boolean): void => {
        if (value && !selectedConditions.value.includes(conditionId)) {
            selectedConditions.value.push(conditionId)
        } else if (!value) {
            const index = selectedConditions.value.indexOf(conditionId)
            if (index > -1) {
                selectedConditions.value.splice(index, 1)
            }
        }
    }

    const handlePriceRangeChange = (value: { min: number | null; max: number | null }): void => {
        priceRangeModel.value = value
    }

    const handleSearch = (): void => {
        // Handle search
    }

    const handleClearSearch = (): void => {
        searchQuery.value = ''
    }

    const initializeFilterData = async (): Promise<void> => {
        isInitializing.value = true
        initializationError.value = null

        try {
            if (isProductTab.value) {
                // Fetch product filter options - API returns {data: {categories: [], ...}}
                const currentFilters = getCurrentProductFilters()
                await searchStore.getFilterOptions(currentFilters)
            } else {
                // Fetch company filter options
                const currentFilters = getCurrentCompanyFilters()
                await searchStore.getCompanyFilterOptions(currentFilters)
            }

            // Initialize local filters from store
            if (isProductTab.value) {
                const current = searchStore.productFilters
                selectedCategories.value = Array.isArray(current.categories)
                    ? [...current.categories]
                    : []
                selectedSubcategories.value = Array.isArray(current.subcategories)
                    ? [...current.subcategories]
                    : []
                selectedBrands.value = Array.isArray(current.brands) ? [...current.brands] : []
                selectedSupplierCountries.value = Array.isArray(current.supplier_countries)
                    ? [...current.supplier_countries]
                    : []
                selectedAvailabilityCountries.value = Array.isArray(current.availability_countries)
                    ? [...current.availability_countries]
                    : []
                selectedFeatures.value = Array.isArray(current.features)
                    ? [...current.features]
                    : []
                selectedAdditionalFeatures.value = Array.isArray(current.additional_features)
                    ? [...current.additional_features]
                    : []
                selectedConditions.value = Array.isArray(current.conditions)
                    ? [...current.conditions]
                    : []
                priceRangeModel.value = {
                    min: current.price_min ?? null,
                    max: current.price_max ?? null,
                }
                hasDiscount.value = current.has_discount || false
                onlyFavorites.value = current.only_favorites || false
                myProducts.value = current.my_products || false
            } else {
                const current = searchStore.companyFilters
                selectedBusinessType.value = current.business_type_id ?? null
                selectedCountry.value = current.country_id ?? null
            }
        } catch (error: any) {
            console.error('Failed to initialize filter data:', error)
            initializationError.value = error.message || t('allProductsFilterDrawer.loadError')
        } finally {
            isInitializing.value = false
        }
    }

    const applyFilters = (): void => {
        isSubmitting.value = true

        let filters: any

        if (isProductTab.value) {
            filters = getCurrentProductFilters()
        } else {
            filters = getCurrentCompanyFilters()
        }

        emit('apply', filters)
        emit('update:isOpen', false)

        isSubmitting.value = false
    }

    const resetFilters = (): void => {
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
        myProducts.value = false
        selectedBusinessType.value = null
        selectedCountry.value = null

        emit('reset')

        let emptyFilters: any
        if (isProductTab.value) {
            emptyFilters = getCurrentProductFilters()
        } else {
            emptyFilters = getCurrentCompanyFilters()
        }

        emit('apply', emptyFilters)

        emit('update:isOpen', false) // <-- LINIA ȘTEARSĂ
    }

    watch(
        () => props.isOpen,
        async (newVal) => {
            if (newVal) {
                await nextTick()
                await initializeFilterData()
            }
        }
    )

    // Watch for tab change
    watch(
        () => props.tab,
        async (newTab, oldTab) => {
            if (newTab !== oldTab && props.isOpen) {
                resetFilters()
                await nextTick()
                await initializeFilterData()
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
