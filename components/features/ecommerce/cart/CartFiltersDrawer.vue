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
            <!-- Loading state -->
            <div v-if="isInitializing" class="flex items-center justify-center mx-auto h-full">
                <div class="flex justify-center items-center p-8 rotate-90">
                    <span class="loader"></span>
                </div>
            </div>

            <!-- Error state -->
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

            <!-- Main content -->
            <div v-else class="filters-container">
                <!-- Search Input -->
                <div class="mb-4">
                    <InputSearch
                        v-model="searchQuery"
                        :placeholder="t('filters.search')"
                        size="lg"
                        @search="handleSearch"
                        @clear="handleClearSearch"
                    />
                </div>

                <!-- Supplier Filter -->
                <Collapse v-if="showSupplierFilter">
                    <template #title>
                        <span class="text-subtitle font-medium">{{ t('filters.supplier') }}</span>
                    </template>
                    <div class="filter-section">
                        <div class="filter-options">
                            <Checkbox
                                v-for="supplier in availableSuppliers"
                                :key="supplier.id"
                                :model-value="isSupplierSelected(supplier.id)"
                                :name="`supplier-${supplier.id}`"
                                size="md"
                                @update:model-value="(value) => toggleSupplier(supplier.id, value)"
                            >
                                <template #default>
                                    <span class="text-body">{{ supplier.name }}</span>
                                </template>
                            </Checkbox>
                        </div>
                    </div>
                </Collapse>

                <!-- Categories Filter -->
                <Collapse v-if="showCategoryFilter">
                    <template #title>
                        <span class="text-subtitle font-medium">{{ t('filters.categories') }}</span>
                    </template>
                    <div class="filter-section">
                        <div class="filter-options">
                            <Checkbox
                                v-for="category in filterOptions?.categories"
                                :key="category.id"
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

                <!-- Price Range Filter -->
                <Collapse v-if="showPriceFilter">
                    <template #title>
                        <span class="text-subtitle font-medium">{{ t('filters.price') }}</span>
                    </template>
                    <div class="filter-section">
                        <div class="price-range">
                            <div class="range-slider mb-4">
                                <input
                                    v-model.number="localFilters.priceMin"
                                    type="range"
                                    :min="0"
                                    :max="maxPrice"
                                    class="slider"
                                    @input="validatePriceRange"
                                />
                                <input
                                    v-model.number="localFilters.priceMax"
                                    type="range"
                                    :min="0"
                                    :max="maxPrice"
                                    class="slider"
                                    @input="validatePriceRange"
                                />
                            </div>
                            <div class="price-inputs">
                                <Input
                                    v-model="localFilters.priceMin"
                                    type="number"
                                    :label="t('filters.min')"
                                    :min="0"
                                    :max="localFilters.priceMax || maxPrice"
                                    size="md"
                                    name="price-min"
                                    @input="validatePriceRange"
                                />
                                <span class="text-body mx-2 mt-2">-</span>
                                <Input
                                    v-model="localFilters.priceMax"
                                    type="number"
                                    :label="t('filters.max')"
                                    :min="localFilters.priceMin || 0"
                                    :max="maxPrice"
                                    size="md"
                                    name="price-max"
                                    @input="validatePriceRange"
                                />
                            </div>
                            <div v-if="priceRangeError" class="text-red-500 text-sm mt-2">
                                {{ t('filters.priceRangeError') }}
                            </div>
                        </div>
                    </div>
                </Collapse>

                <!-- Status Filter (for order history) -->
                <Collapse v-if="showStatusFilter">
                    <template #title>
                        <span class="text-subtitle font-medium">{{ t('filters.status') }}</span>
                    </template>
                    <div class="filter-section">
                        <div class="filter-options">
                            <Checkbox
                                v-for="status in availableStatuses"
                                :key="status.value"
                                :model-value="isStatusSelected(status.value)"
                                :name="`status-${status.value}`"
                                size="md"
                                @update:model-value="(value) => toggleStatus(status.value, value)"
                            >
                                <template #default>
                                    <span class="text-body">{{ t(status.label) }}</span>
                                </template>
                            </Checkbox>
                        </div>
                    </div>
                </Collapse>

                <!-- Date Range Filter (for order history) -->
                <Collapse v-if="showDateFilter">
                    <template #title>
                        <span class="text-subtitle font-medium">{{ t('filters.dateRange') }}</span>
                    </template>
                    <div class="filter-section">
                        <div class="space-y-3">
                            <div>
                                <Input
                                    v-model="localFilters.dateRange.from"
                                    type="date"
                                    :label="t('filters.fromDate')"
                                    size="md"
                                    name="date-from"
                                    @change="emitChange"
                                />
                            </div>
                            <div>
                                <Input
                                    v-model="localFilters.dateRange.to"
                                    type="date"
                                    :label="t('filters.toDate')"
                                    size="md"
                                    name="date-to"
                                    @change="emitChange"
                                />
                            </div>
                        </div>
                    </div>
                </Collapse>

                <!-- Stock Availability Filter -->
                <Collapse v-if="showStockFilter">
                    <template #title>
                        <span class="text-subtitle font-medium">{{
                            t('filters.availability')
                        }}</span>
                    </template>
                    <div class="filter-section">
                        <div class="filter-options">
                            <Checkbox
                                v-model="localFilters.inStock"
                                :name="'in-stock'"
                                size="md"
                                @update:model-value="emitChange"
                            >
                                <template #default>
                                    <span class="text-body">{{ t('filters.inStock') }}</span>
                                </template>
                            </Checkbox>
                            <Checkbox
                                v-model="localFilters.onSale"
                                :name="'on-sale'"
                                size="md"
                                @update:model-value="emitChange"
                            >
                                <template #default>
                                    <span class="text-body">{{ t('filters.onSale') }}</span>
                                </template>
                            </Checkbox>
                            <Checkbox
                                v-model="localFilters.hasDiscount"
                                :name="'has-discount'"
                                size="md"
                                @update:model-value="emitChange"
                            >
                                <template #default>
                                    <span class="text-body">{{ t('filters.hasDiscount') }}</span>
                                </template>
                            </Checkbox>
                            <Checkbox
                                v-model="localFilters.privateLabelAvailable"
                                :name="'private-label-available'"
                                size="md"
                                @update:model-value="emitChange"
                            >
                                <template #default>
                                    <span class="text-body">{{
                                        t('filters.privateLabelAvailable')
                                    }}</span>
                                </template>
                            </Checkbox>
                        </div>
                    </div>
                </Collapse>

                <!-- Quick Filter Presets -->
                <Collapse v-if="showQuickFilters">
                    <template #title>
                        <span class="text-subtitle font-medium">{{
                            t('filters.quickFilters')
                        }}</span>
                    </template>
                    <div class="filter-section">
                        <div class="grid grid-cols-2 gap-2">
                            <Button
                                v-for="preset in quickFilterPresets"
                                :key="preset.key"
                                :color="activePreset === preset.key ? 'red' : 'gray'"
                                :variant="activePreset === preset.key ? 'filled' : 'outline'"
                                size="sm"
                                class="text-xs"
                                @click="applyPreset(preset)"
                            >
                                {{ t(preset.label) }}
                            </Button>
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
                <Button variant="filled" color="red" size="lg" class="flex-1" @click="applyFilters">
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
    import Drawer from '~/components/ui/Drawer.vue'
    import Collapse from '~/components/ui/Collapse.vue'
    import Button from '~/components/ui/Button.vue'
    import Checkbox from '~/components/ui/Checkbox.vue'
    import Input from '~/components/ui/Input.vue'
    import InputSearch from '~/components/ui/InputSearch.vue'

    interface FilterValues {
        suppliers: number[]
        categories: number[]
        priceMin: number
        priceMax: number
        status: string[]
        dateRange: {
            from: string
            to: string
        }
        inStock: boolean
        onSale: boolean
        hasDiscount: boolean
        privateLabelAvailable: boolean
    }

    interface FilterOption {
        id: number
        name: string
    }

    interface StatusOption {
        value: string
        label: string
    }

    interface QuickFilterPreset {
        key: string
        label: string
        filters: Partial<FilterValues>
    }

    const props = defineProps({
        isOpen: {
            type: Boolean,
            required: true,
        },
        filters: {
            type: Object,
            default: () => ({}),
        },
        filterOptions: {
            type: Object,
            default: () => ({}),
        },
        counts: {
            type: Object,
            default: () => ({}),
        },
        // Control which filters to show
        showSupplierFilter: {
            type: Boolean,
            default: true,
        },
        showCategoryFilter: {
            type: Boolean,
            default: true,
        },
        showPriceFilter: {
            type: Boolean,
            default: true,
        },
        showStatusFilter: {
            type: Boolean,
            default: false,
        },
        showDateFilter: {
            type: Boolean,
            default: false,
        },
        showStockFilter: {
            type: Boolean,
            default: true,
        },
        showQuickFilters: {
            type: Boolean,
            default: true,
        },
    })

    const emit = defineEmits(['update:isOpen', 'apply', 'reset'])

    const { t } = useI18n()

    // Local state
    const isInitializing = ref(false)
    const initializationError = ref<string | null>(null)
    const searchQuery = ref('')
    const priceRangeError = ref(false)
    const activePreset = ref<string>('')

    const defaultFilters: FilterValues = {
        suppliers: [],
        categories: [],
        priceMin: 0,
        priceMax: props.filterOptions?.maxPrice || 1000,
        status: [],
        dateRange: {
            from: '',
            to: '',
        },
        inStock: false,
        onSale: false,
        hasDiscount: false,
        privateLabelAvailable: false,
    }

    const localFilters = ref<FilterValues>({ ...defaultFilters })

    // Available options
    const availableSuppliers = computed(() => props.filterOptions?.suppliers || [])
    const maxPrice = computed(() => props.filterOptions?.maxPrice || 1000)

    const availableStatuses: StatusOption[] = [
        { value: 'pending', label: 'orderHistory.status.pending' },
        { value: 'confirmed', label: 'orderHistory.status.confirmed' },
        { value: 'delivered', label: 'orderHistory.status.delivered' },
        { value: 'cancelled', label: 'orderHistory.status.cancelled' },
    ]

    // Quick filter presets
    const quickFilterPresets: QuickFilterPreset[] = [
        {
            key: 'recent',
            label: 'filters.presets.recent',
            filters: {
                dateRange: {
                    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                        .toISOString()
                        .split('T')[0],
                    to: new Date().toISOString().split('T')[0],
                },
            },
        },
        {
            key: 'lowPrice',
            label: 'filters.presets.lowPrice',
            filters: {
                priceMax: Math.floor(maxPrice.value * 0.3),
            },
        },
        {
            key: 'onSale',
            label: 'filters.presets.onSale',
            filters: {
                onSale: true,
                hasDiscount: true,
            },
        },
        {
            key: 'inStock',
            label: 'filters.presets.inStock',
            filters: {
                inStock: true,
            },
        },
    ]

    // Computed properties
    const activeFiltersCount = computed(() => {
        let count = 0

        if (searchQuery.value.trim()) count++
        if (localFilters.value.suppliers.length > 0) count++
        if (localFilters.value.categories.length > 0) count++
        if (localFilters.value.status.length > 0) count++
        if (localFilters.value.dateRange.from || localFilters.value.dateRange.to) count++
        if (localFilters.value.inStock) count++
        if (localFilters.value.onSale) count++
        if (localFilters.value.hasDiscount) count++
        if (localFilters.value.privateLabelAvailable) count++
        if (localFilters.value.priceMin > 0 || localFilters.value.priceMax < maxPrice.value) count++

        return count
    })

    // Selection check methods
    const isSupplierSelected = (supplierId: number): boolean => {
        return localFilters.value.suppliers.includes(supplierId)
    }

    const isCategorySelected = (categoryId: number): boolean => {
        return localFilters.value.categories.includes(categoryId)
    }

    const isStatusSelected = (status: string): boolean => {
        return localFilters.value.status.includes(status)
    }

    // Toggle methods
    const toggleSupplier = (supplierId: number, isSelected: boolean) => {
        if (isSelected) {
            if (!localFilters.value.suppliers.includes(supplierId)) {
                localFilters.value.suppliers.push(supplierId)
            }
        } else {
            localFilters.value.suppliers = localFilters.value.suppliers.filter(
                (id) => id !== supplierId
            )
        }
    }

    const toggleCategory = (categoryId: number, isSelected: boolean) => {
        if (isSelected) {
            if (!localFilters.value.categories.includes(categoryId)) {
                localFilters.value.categories.push(categoryId)
            }
        } else {
            localFilters.value.categories = localFilters.value.categories.filter(
                (id) => id !== categoryId
            )
        }
    }

    const toggleStatus = (status: string, isSelected: boolean) => {
        if (isSelected) {
            if (!localFilters.value.status.includes(status)) {
                localFilters.value.status.push(status)
            }
        } else {
            localFilters.value.status = localFilters.value.status.filter((s) => s !== status)
        }
    }

    // Methods
    const handleSearch = (value: string) => {
        searchQuery.value = value
    }

    const handleClearSearch = () => {
        searchQuery.value = ''
    }

    const validatePriceRange = () => {
        const min = Number(localFilters.value.priceMin) || 0
        const max = Number(localFilters.value.priceMax) || maxPrice.value

        if (min > max) {
            priceRangeError.value = true
            localFilters.value.priceMax = min
        } else {
            priceRangeError.value = false
        }
    }

    const applyPreset = (preset: QuickFilterPreset) => {
        if (activePreset.value === preset.key) {
            // If already active, reset
            resetFilters()
            return
        }

        // Apply preset filters
        Object.assign(localFilters.value, preset.filters)
        activePreset.value = preset.key
    }

    const emitChange = () => {
        // This is used for internal changes, but we don't auto-apply in drawer mode
    }

    const applyFilters = () => {
        validatePriceRange()

        if (priceRangeError.value) {
            return
        }

        const filtersToApply = {
            search: searchQuery.value.trim() || undefined,
            suppliers:
                localFilters.value.suppliers.length > 0 ? localFilters.value.suppliers : undefined,
            categories:
                localFilters.value.categories.length > 0
                    ? localFilters.value.categories
                    : undefined,
            price_min:
                localFilters.value.priceMin && localFilters.value.priceMin > 0
                    ? localFilters.value.priceMin
                    : undefined,
            price_max:
                localFilters.value.priceMax && localFilters.value.priceMax < maxPrice.value
                    ? localFilters.value.priceMax
                    : undefined,
            status: localFilters.value.status.length > 0 ? localFilters.value.status : undefined,
            date_from: localFilters.value.dateRange.from || undefined,
            date_to: localFilters.value.dateRange.to || undefined,
            in_stock: localFilters.value.inStock || undefined,
            on_sale: localFilters.value.onSale || undefined,
            has_discount: localFilters.value.hasDiscount || undefined,
            private_label_available: localFilters.value.privateLabelAvailable || undefined,
        }

        emit('apply', filtersToApply)
        emit('update:isOpen', false)
    }

    const resetFilters = () => {
        searchQuery.value = ''
        localFilters.value = { ...defaultFilters }
        activePreset.value = ''
        priceRangeError.value = false
        emit('reset')
        emit('update:isOpen', false)
    }

    const initializeFilterData = async (): Promise<void> => {
        isInitializing.value = true
        initializationError.value = null

        try {
            // Initialize any required data here
            await new Promise((resolve) => setTimeout(resolve, 500)) // Simulated load
        } catch (error: any) {
            console.error('Failed to initialize filter data:', error)
            initializationError.value = error.message || 'Failed to load filter data'
        } finally {
            isInitializing.value = false
        }
    }

    // Initialize with provided filters
    onMounted(() => {
        if (props.filters) {
            localFilters.value = {
                suppliers: props.filters.suppliers || [],
                categories: props.filters.categories || [],
                priceMin: props.filters.price_min || 0,
                priceMax: props.filters.price_max || maxPrice.value,
                status: props.filters.status || [],
                dateRange: {
                    from: props.filters.date_from || '',
                    to: props.filters.date_to || '',
                },
                inStock: props.filters.in_stock || false,
                onSale: props.filters.on_sale || false,
                hasDiscount: props.filters.has_discount || false,
                privateLabelAvailable: props.filters.private_label_available || false,
            }
            if (props.filters.search) {
                searchQuery.value = props.filters.search
            }
        }
        initializeFilterData()
    })

    // Watch for external filter changes
    watch(
        () => props.filters,
        (newFilters) => {
            if (newFilters) {
                localFilters.value = {
                    suppliers: newFilters.suppliers || [],
                    categories: newFilters.categories || [],
                    priceMin: newFilters.price_min || 0,
                    priceMax: newFilters.price_max || maxPrice.value,
                    status: newFilters.status || [],
                    dateRange: {
                        from: newFilters.date_from || '',
                        to: newFilters.date_to || '',
                    },
                    inStock: newFilters.in_stock || false,
                    onSale: newFilters.on_sale || false,
                    hasDiscount: newFilters.has_discount || false,
                    privateLabelAvailable: newFilters.private_label_available || false,
                }
                if (newFilters.search) {
                    searchQuery.value = newFilters.search
                }
            }
        },
        { deep: true }
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
        @apply space-y-2;
    }

    .price-range {
        @apply space-y-4;
    }

    .range-slider {
        @apply relative;

        .slider {
            @apply w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer;

            &::-webkit-slider-thumb {
                appearance: none;
                height: 20px;
                width: 20px;
                border-radius: 50%;
                background: #ef4444;
                cursor: pointer;
                box-shadow:
                    0 0 0 1px #ffffff,
                    0 0 0 2px #ef4444;
            }

            &::-moz-range-thumb {
                height: 20px;
                width: 20px;
                border-radius: 50%;
                background: #ef4444;
                cursor: pointer;
                border: 2px solid #ffffff;
                box-shadow: 0 0 0 1px #ef4444;
            }
        }
    }

    .price-inputs {
        @apply flex items-center gap-2;
    }

    .filter-footer {
        @apply flex gap-3 px-4;
    }

    .loader {
        @apply w-6 h-6 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin;
    }

    @media (max-width: 640px) {
        .grid-cols-2 {
            grid-template-columns: 1fr;
        }
    }
</style>
