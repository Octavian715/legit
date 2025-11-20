<template>
    <div class="products-features-table-wrapper">
        <Table
            :columns="tableColumns"
            :rows="tableRows"
            :loading="loading"
            pagination
            :pagination-config="paginationConfig"
            :actions="allActions"
            fixed-layout
            :sort-by="sortBy"
            expandable
            :sort-direction="sortDirection"
            background="bg-white"
            test="product-features-table"
            @actions="handleTableAction"
            @sort="handleSort"
            @update:current-page="handlePageChange"
            @update:items-per-page="handleItemsPerPageChange"
            @page-changed="handlePageChanged"
            @items-per-page-changed="handleItemsPerPageChanged"
        >
            <template #row-expansion="{ item }">
                <div class="flex flex-col gap-3 p-3 bg-gray-150">
                    <!-- Local Discount Section -->
                    <div class="grid grid-cols-12 gap-3 items-center">
                        <div class="col-span-2">
                            <div
                                class="border border-gray-600 px-3 flex flex-1 items-center justify-between gap-2 h-12"
                            >
                                <div class="flex gap-2">
                                    <svg
                                        class="w-5 h-4 bg-red-50 text-red-500 rounded-lg px-1 py-0.5"
                                    >
                                        <use :xlink:href="`/sprite.svg#discount`"></use>
                                    </svg>
                                    <p class="text-subtitle2 text-gray-950">{{
                                        t('product.discount')
                                    }}</p>
                                </div>
                                <Checkbox
                                    :model-value="getDiscountEnabled('local', item.id)"
                                    @update:model-value="
                                        (value) => updateLocalDiscountEnabled(item.id, value)
                                    "
                                />
                            </div>
                        </div>

                        <div class="col-span-2">
                            <Input
                                :model-value="getDiscountPercentage('local', item.id)"
                                :label="t('productFeaturesTable.localDiscountPercentage')"
                                type="number"
                                :step="0.01"
                                :min="0"
                                :max="100"
                                :disabled="!getDiscountEnabled('local', item.id)"
                                background="bg-white"
                                class="flex-1"
                                size="lg"
                                @update:model-value="
                                    (value) => updateLocalDiscountPercentage(item.id, value)
                                "
                            />
                        </div>

                        <div class="col-span-2">
                            <Input
                                :model-value="
                                    calculateDiscountedPrice(
                                        item.originalData.local_price,
                                        getDiscountPercentage('local', item.id)
                                    )
                                "
                                :label="t('productFeaturesTable.finalPrice')"
                                :readonly="true"
                                background="bg-gray-100"
                                class="flex-1"
                                size="lg"
                            />
                        </div>
                        <div class="col-span-3">
                            <DatePicker
                                :key="`local-${item.id}-${localDatePickerKey[item.id] || 0}`"
                                :model-value="getDiscountDateValue('local', item.id)"
                                :label="
                                    getDiscountUnlimited('local', item.id)
                                        ? t('productFeaturesTable.startDate')
                                        : t('filters.startEndDate')
                                "
                                :placeholder="
                                    getDiscountUnlimited('local', item.id)
                                        ? t('productFeaturesTable.selectStartDate')
                                        : t('filters.selectDateRange')
                                "
                                :disabled="!getDiscountEnabled('local', item.id)"
                                :min-date="minDateToday"
                                :is-range-mode="!getDiscountUnlimited('local', item.id)"
                                future-ranges
                                date-format="yyyy-MM-dd"
                                size="md"
                                @update:model-value="
                                    (value) => updateLocalDiscountDateRange(item.id, value)
                                "
                            />
                        </div>

                        <div class="col-span-1">
                            <Checkbox
                                :model-value="getDiscountUnlimited('local', item.id)"
                                :disabled="!getDiscountEnabled('local', item.id)"
                                @update:model-value="
                                    (value) => updateLocalDiscountUnlimited(item.id, value)
                                "
                            >
                                {{ t('productFeaturesTable.unlimited') }}
                            </Checkbox>
                        </div>

                        <div class="flex justify-end"> </div>
                    </div>

                    <!-- Export Discount Section -->
                    <div class="grid grid-cols-12 gap-3 items-center">
                        <div class="col-span-2">
                            <div
                                class="border border-gray-600 px-3 flex flex-1 items-center justify-between gap-2 h-12"
                            >
                                <div class="flex gap-2">
                                    <svg
                                        class="w-5 h-4 bg-red-50 text-red-500 rounded-lg px-1 py-0.5"
                                    >
                                        <use :xlink:href="`/sprite.svg#discount`"></use>
                                    </svg>
                                    <p class="text-subtitle2 text-gray-950">{{
                                        t('product.discount')
                                    }}</p>
                                </div>
                                <Checkbox
                                    :model-value="getDiscountEnabled('export', item.id)"
                                    @update:model-value="
                                        (value) => updateExportDiscountEnabled(item.id, value)
                                    "
                                />
                            </div>
                        </div>

                        <div class="col-span-4 flex gap-3">
                            <Input
                                :model-value="getDiscountPercentage('export', item.id)"
                                :label="t('productFeaturesTable.exportDiscountPercentage')"
                                type="number"
                                :step="0.01"
                                :min="0"
                                :max="100"
                                :disabled="!getDiscountEnabled('export', item.id)"
                                background="bg-white"
                                class="flex-1"
                                size="lg"
                                @update:model-value="
                                    (value) => updateExportDiscountPercentage(item.id, value)
                                "
                            />

                            <Input
                                :model-value="
                                    calculateDiscountedPrice(
                                        item.originalData.export_price,
                                        getDiscountPercentage('export', item.id)
                                    )
                                "
                                :label="t('productFeaturesTable.finalPrice')"
                                :readonly="true"
                                background="bg-gray-100"
                                class="flex-1"
                                size="lg"
                            />
                        </div>
                        <div class="col-span-3">
                            <DatePicker
                                :key="`export-${item.id}-${exportDatePickerKey[item.id] || 0}`"
                                :model-value="getDiscountDateValue('export', item.id)"
                                :label="
                                    getDiscountUnlimited('export', item.id)
                                        ? t('productFeaturesTable.startDate')
                                        : t('filters.startEndDate')
                                "
                                :placeholder="
                                    getDiscountUnlimited('export', item.id)
                                        ? t('productFeaturesTable.selectStartDate')
                                        : t('filters.selectDateRange')
                                "
                                :disabled="!getDiscountEnabled('export', item.id)"
                                :min-date="minDateToday"
                                :is-range-mode="!getDiscountUnlimited('export', item.id)"
                                future-ranges
                                date-format="yyyy-MM-dd"
                                size="md"
                                @update:model-value="
                                    (value) => updateExportDiscountDateRange(item.id, value)
                                "
                            />
                        </div>

                        <div class="col-span-1">
                            <Checkbox
                                :model-value="getDiscountUnlimited('export', item.id)"
                                :disabled="!getDiscountEnabled('export', item.id)"
                                @update:model-value="
                                    (value) => updateExportDiscountUnlimited(item.id, value)
                                "
                            >
                                {{ t('productFeaturesTable.unlimited') }}
                            </Checkbox>
                        </div>
                        <div class="col-span-2">
                            <Button
                                variant="filled"
                                color="red"
                                size="sm"
                                :disabled="!hasAnyDiscountChanges(item.id)"
                                class="w-full"
                                @click="saveDiscounts(item)"
                            >
                                {{ t('saveChanges') }}
                            </Button>
                        </div>
                    </div>
                </div>
            </template>
        </Table>
    </div>
</template>

<script setup lang="ts">
    import { computed, ref, watch } from 'vue'
    import { useI18n } from 'vue-i18n'
    import type { TableColumn, TableRow, SortState } from '~/types/ui/table'
    import type { ProductWithFeatures, ProductFeaturesSort } from '~/types/dashboardProduct'

    interface DateRange {
        start: string
        end: string
    }

    interface Props {
        products?: ProductWithFeatures[]
        meta?: any
        currentPage?: number
        itemsPerPage?: number
        loading?: boolean
        showPagination?: boolean
        sortBy?: ProductFeaturesSort
        sortDirection?: 'asc' | 'desc' | undefined
    }

    const props = withDefaults(defineProps<Props>(), {
        products: () => [],
        meta: () => ({}),
        currentPage: 1,
        itemsPerPage: 10,
        loading: false,
        showPagination: true,
        sortBy: undefined,
        sortDirection: undefined,
    })

    const emit = defineEmits<{
        'page-change': [page: number]
        'items-per-page-change': [itemsPerPage: number]
        'sort-change': [
            field: ProductFeaturesSort | undefined,
            direction: 'asc' | 'desc' | undefined,
        ]
        action: [action: { type: string; row: any; value?: any }]
        'update:current-page': [page: number]
        'update:items-per-page': [itemsPerPage: number]
    }>()

    const { t } = useI18n()
    const toast = useToastNotification()

    const internalCurrentPage = ref(props.currentPage)
    const internalItemsPerPage = ref(props.itemsPerPage)

    // Discount tracking refs
    const localDiscountEnabled = ref<Record<string, boolean>>({})
    const localDiscountDateRange = ref<Record<string, DateRange>>({})
    const localDiscountUnlimited = ref<Record<string, boolean>>({})
    const localDiscountPercentage = ref<Record<string, string>>({})

    const exportDiscountEnabled = ref<Record<string, boolean>>({})
    const exportDiscountDateRange = ref<Record<string, DateRange>>({})
    const exportDiscountUnlimited = ref<Record<string, boolean>>({})
    const exportDiscountPercentage = ref<Record<string, string>>({})

    // DatePicker reactive keys for forcing re-render
    const localDatePickerKey = ref<Record<string, number>>({})
    const exportDatePickerKey = ref<Record<string, number>>({})

    // Initialize discount state from existing data
    const initializeDiscountState = () => {
        const products = props.products || []

        products.forEach((product) => {
            const itemId = product.product_id?.toString() || `product-${products.indexOf(product)}`

            // Initialize local discount if exists
            if (product.local_discount && product.local_discount.is_active) {
                localDiscountEnabled.value[itemId] = true
                localDiscountPercentage.value[itemId] = product.local_discount.percentage || ''

                const startDate = product.local_discount.start_date || ''
                const endDate = product.local_discount.end_date || ''

                // Check if unlimited (no end date)
                const isUnlimited = !endDate
                localDiscountUnlimited.value[itemId] = isUnlimited

                localDiscountDateRange.value[itemId] = {
                    start: startDate,
                    end: endDate,
                }
            }

            // Initialize export discount if exists
            if (product.export_discount && product.export_discount.is_active) {
                exportDiscountEnabled.value[itemId] = true
                exportDiscountPercentage.value[itemId] = product.export_discount.percentage || ''

                const startDate = product.export_discount.start_date || ''
                const endDate = product.export_discount.end_date || ''

                // Check if unlimited (no end date)
                const isUnlimited = !endDate
                exportDiscountUnlimited.value[itemId] = isUnlimited

                exportDiscountDateRange.value[itemId] = {
                    start: startDate,
                    end: endDate,
                }
            }
        })
    }

    // Initialize on mount and when products change
    watch(
        () => props.products,
        () => {
            initializeDiscountState()
        },
        { immediate: true }
    )

    const allActions = []

    // Computed for today's date
    const minDateToday = computed(() => {
        const today = new Date()
        return today.toISOString().split('T')[0]
    })

    // Helper to force DatePicker component refresh
    const forceRefreshDatePicker = (type: 'local' | 'export', itemId: string) => {
        const keyRef = type === 'local' ? localDatePickerKey : exportDatePickerKey
        keyRef.value[itemId] = (keyRef.value[itemId] || 0) + 1
    }

    // Helper functions to safely get values with fallbacks
    const getDiscountEnabled = (type: 'local' | 'export', itemId: string): boolean => {
        return type === 'local'
            ? (localDiscountEnabled.value[itemId] ?? false)
            : (exportDiscountEnabled.value[itemId] ?? false)
    }

    const getDiscountDateRange = (type: 'local' | 'export', itemId: string): DateRange => {
        return type === 'local'
            ? (localDiscountDateRange.value[itemId] ?? { start: '', end: '' })
            : (exportDiscountDateRange.value[itemId] ?? { start: '', end: '' })
    }

    // Enhanced date value getter that returns null for empty states
    const getDiscountDateValue = (
        type: 'local' | 'export',
        itemId: string
    ): DateRange | string | null => {
        const dateRange = getDiscountDateRange(type, itemId)
        const isUnlimited = getDiscountUnlimited(type, itemId)

        // If unlimited mode and we have a start date, return it as string
        if (isUnlimited) {
            return dateRange.start || null
        }

        // If not unlimited and we have both dates, return range
        if (!isUnlimited && (dateRange.start || dateRange.end)) {
            return dateRange
        }

        // Return null for empty state to ensure DatePicker clears
        return null
    }

    const getDiscountUnlimited = (type: 'local' | 'export', itemId: string): boolean => {
        return type === 'local'
            ? (localDiscountUnlimited.value[itemId] ?? false)
            : (exportDiscountUnlimited.value[itemId] ?? false)
    }

    const getDiscountPercentage = (type: 'local' | 'export', itemId: string): string => {
        return type === 'local'
            ? (localDiscountPercentage.value[itemId] ?? '')
            : (exportDiscountPercentage.value[itemId] ?? '')
    }

    // Helper function to safely get values with fallbacks
    const getDiscountValue = (ref: any, itemId: string, fallback: any = '') => {
        return ref.value?.[itemId] ?? fallback
    }

    // Validation helpers for discount requirements (used only for save validation)
    const validateDiscountRequirements = (type: 'local' | 'export', itemId: string): boolean => {
        const dateRange = getDiscountDateRange(type, itemId)
        const percentage = getDiscountPercentage(type, itemId)
        const unlimited = getDiscountUnlimited(type, itemId)

        // Check if percentage is valid
        const hasValidPercentage =
            percentage && parseFloat(percentage) > 0 && parseFloat(percentage) <= 100

        // Check if date requirements are met
        const hasValidDate = unlimited ? !!dateRange.start : !!(dateRange.start && dateRange.end)

        return hasValidPercentage && hasValidDate
    }

    // Local discount update methods - FIXED VERSION
    const updateLocalDiscountEnabled = (itemId: string, value: boolean) => {
        localDiscountEnabled.value[itemId] = value

        if (value) {
            // Show helpful toast when enabling discount
            toast.info(t('validation.discountEnabledHelp'), t('validation.localDiscountEnabled'))
        } else {
            // Reset all values when disabling
            localDiscountDateRange.value[itemId] = { start: '', end: '' }
            localDiscountUnlimited.value[itemId] = false
            localDiscountPercentage.value[itemId] = ''
            forceRefreshDatePicker('local', itemId)
        }
    }

    const updateLocalDiscountDateRange = (itemId: string, value: DateRange | string | null) => {
        const isUnlimited = getDiscountUnlimited('local', itemId)

        if (isUnlimited && typeof value === 'string') {
            // Single date mode (unlimited) - store as start date
            localDiscountDateRange.value[itemId] = { start: value || '', end: '' }
        } else if (!isUnlimited && value && typeof value === 'object' && 'start' in value) {
            // Range mode (not unlimited) - store full range
            localDiscountDateRange.value[itemId] = {
                start: value.start || '',
                end: value.end || '',
            }
        } else if (value === null || value === '') {
            // Handle null/empty values - clear everything
            localDiscountDateRange.value[itemId] = { start: '', end: '' }
        }
    }

    const updateLocalDiscountUnlimited = (itemId: string, value: boolean) => {
        localDiscountUnlimited.value[itemId] = value

        // Always reset the date range when unlimited state changes
        localDiscountDateRange.value[itemId] = { start: '', end: '' }

        // Force DatePicker to refresh and clear its internal state
        forceRefreshDatePicker('local', itemId)
    }

    const updateLocalDiscountPercentage = (itemId: string, value: string) => {
        localDiscountPercentage.value[itemId] = value
    }

    // Export discount update methods - FIXED VERSION
    const updateExportDiscountEnabled = (itemId: string, value: boolean) => {
        exportDiscountEnabled.value[itemId] = value

        if (value) {
            // Show helpful toast when enabling discount
            toast.info(t('validation.discountEnabledHelp'), t('validation.exportDiscountEnabled'))
        } else {
            // Reset all values when disabling
            exportDiscountDateRange.value[itemId] = { start: '', end: '' }
            exportDiscountUnlimited.value[itemId] = false
            exportDiscountPercentage.value[itemId] = ''
            forceRefreshDatePicker('export', itemId)
        }
    }

    const updateExportDiscountDateRange = (itemId: string, value: DateRange | string | null) => {
        const isUnlimited = getDiscountUnlimited('export', itemId)

        if (isUnlimited && typeof value === 'string') {
            // Single date mode (unlimited) - store as start date
            exportDiscountDateRange.value[itemId] = { start: value || '', end: '' }
        } else if (!isUnlimited && value && typeof value === 'object' && 'start' in value) {
            // Range mode (not unlimited) - store full range
            exportDiscountDateRange.value[itemId] = {
                start: value.start || '',
                end: value.end || '',
            }
        } else if (value === null || value === '') {
            // Handle null/empty values - clear everything
            exportDiscountDateRange.value[itemId] = { start: '', end: '' }
        }
    }

    const updateExportDiscountUnlimited = (itemId: string, value: boolean) => {
        exportDiscountUnlimited.value[itemId] = value

        // Always reset the date range when unlimited state changes
        exportDiscountDateRange.value[itemId] = { start: '', end: '' }

        // Force DatePicker to refresh and clear its internal state
        forceRefreshDatePicker('export', itemId)
    }

    const updateExportDiscountPercentage = (itemId: string, value: string) => {
        exportDiscountPercentage.value[itemId] = value
    }

    const calculateDiscountedPrice = (
        originalPrice: number,
        discountPercentage: string
    ): string => {
        if (!originalPrice || !discountPercentage) return originalPrice?.toFixed(2) || '0.00'

        const discount = parseFloat(discountPercentage)
        if (isNaN(discount) || discount <= 0) return originalPrice.toFixed(2)

        const discountedPrice = originalPrice - (originalPrice * discount) / 100
        return discountedPrice.toFixed(2)
    }

    const hasLocalDiscountChanges = (itemId: string): boolean => {
        const enabled = getDiscountValue(localDiscountEnabled, itemId, false)
        const dateRange = getDiscountValue(localDiscountDateRange, itemId, { start: '', end: '' })
        const unlimited = getDiscountValue(localDiscountUnlimited, itemId, false)
        const percentage = getDiscountValue(localDiscountPercentage, itemId, '')

        return !!(enabled || dateRange.start || dateRange.end || unlimited || percentage)
    }

    const hasExportDiscountChanges = (itemId: string): boolean => {
        const enabled = getDiscountValue(exportDiscountEnabled, itemId, false)
        const dateRange = getDiscountValue(exportDiscountDateRange, itemId, { start: '', end: '' })
        const unlimited = getDiscountValue(exportDiscountUnlimited, itemId, false)
        const percentage = getDiscountValue(exportDiscountPercentage, itemId, '')

        return !!(enabled || dateRange.start || dateRange.end || unlimited || percentage)
    }

    const hasAnyDiscountChanges = (itemId: string): boolean => {
        return hasLocalDiscountChanges(itemId) || hasExportDiscountChanges(itemId)
    }

    const saveDiscounts = (item: TableRow) => {
        const discountsData: any = {}
        let hasErrors = false

        // Validate and prepare local discount data
        if (getDiscountValue(localDiscountEnabled, item.id, false)) {
            const hasValidData = validateDiscountRequirements('local', item.id)

            if (!hasValidData) {
                toast.error(t('validation.invalidLocalDiscount'))
                hasErrors = true
            } else {
                const dateRange = getDiscountValue(localDiscountDateRange, item.id, {
                    start: '',
                    end: '',
                })
                discountsData.local = {
                    percentage: parseFloat(getDiscountValue(localDiscountPercentage, item.id, '0')),
                    start_date: dateRange.start,
                    end_date: getDiscountValue(localDiscountUnlimited, item.id, false)
                        ? null
                        : dateRange.end,
                }
            }
        }

        // Validate and prepare export discount data
        if (getDiscountValue(exportDiscountEnabled, item.id, false)) {
            const hasValidData = validateDiscountRequirements('export', item.id)

            if (!hasValidData) {
                toast.error(t('validation.invalidExportDiscount'))
                hasErrors = true
            } else {
                const dateRange = getDiscountValue(exportDiscountDateRange, item.id, {
                    start: '',
                    end: '',
                })
                discountsData.export = {
                    percentage: parseFloat(
                        getDiscountValue(exportDiscountPercentage, item.id, '0')
                    ),
                    start_date: dateRange.start,
                    end_date: getDiscountValue(exportDiscountUnlimited, item.id, false)
                        ? null
                        : dateRange.end,
                }
            }
        }

        if (hasErrors) {
            return
        }

        emit('action', {
            type: 'update-discounts',
            row: item.originalData,
            value: discountsData,
        })

        toast.success(t('validation.discountsSaved'))
    }

    const tableColumns = computed<TableColumn[]>(() => [
        {
            key: 'product_id',
            label: t('productFeaturesTable.productId'),
            sortable: false,
            view: 'TableCellText',
            width: '100px',
            align: 'left',
        },
        {
            key: 'brand_name',
            label: t('productFeaturesTable.brandName'),
            sortable: true,
            view: 'TableCellText',
            width: '150px',
            align: 'left',
        },
        {
            key: 'product_original_name',
            label: t('productFeaturesTable.productName'),
            sortable: true,
            view: 'TableCellText',
            width: '200px',
            align: 'left',
        },
        {
            key: 'article_number',
            label: t('productFeaturesTable.articleNumber'),
            sortable: true,
            view: 'TableCellText',
            width: '130px',
            align: 'left',
        },
        {
            key: 'weight',
            label: t('productFeaturesTable.weight'),
            sortable: true,
            view: 'TableCellText',
            width: '100px',
            align: 'left',
        },
        {
            key: 'category',
            label: t('productFeaturesTable.category'),
            sortable: true,
            view: 'TableCellText',
            width: '120px',
            align: 'left',
        },
        {
            key: 'local_vat',
            label: t('productFeaturesTable.localVat'),
            sortable: true,
            view: 'TableCellText',
            width: '80px',
            align: 'right',
        },
        {
            key: 'export_vat',
            label: t('productFeaturesTable.exportVat'),
            sortable: true,
            view: 'TableCellText',
            width: '80px',
            align: 'right',
        },
        {
            key: 'price_per_unit',
            label: t('productFeaturesTable.pricePerUnit'),
            sortable: true,
            view: 'TableCellText',
            width: '120px',
            align: 'right',
        },
    ])

    const formatWeight = (weight: { value: number; unit: string } | null): string => {
        if (!weight) return t('productFeaturesTable.noWeight')
        return `${weight.value}${weight.unit}`
    }

    const formatVAT = (vat: number): string => {
        return `${vat}%`
    }

    const formatPrice = (price: number, currency?: string): string => {
        if (!price) return '0.00'
        const formattedPrice = price.toFixed(2)
        return currency ? `${formattedPrice} ${currency}` : formattedPrice
    }

    const tableRows = computed<TableRow[]>(() => {
        const products = props.products || []

        if (!Array.isArray(products) || products.length === 0) {
            return []
        }

        return products.map((product, index) => {
            return {
                id: product.product_id?.toString() || `product-${index}`,
                row: [
                    product.product_id?.toString() || t('productFeaturesTable.unknownId'),
                    product.brand_name || t('productFeaturesTable.notSpecified'),
                    product.product_original_name || t('productFeaturesTable.unknownName'),
                    product.article_number || t('productFeaturesTable.notSpecified'),
                    formatWeight(product.weight),
                    product.category?.name || t('productFeaturesTable.noCategory'),
                    formatVAT(product.local_vat || 0),
                    formatVAT(product.export_vat || 0),
                    formatPrice(product.local_price, props.meta?.currency?.symbol),
                ],
                originalData: product,
                index: index,
            }
        })
    })

    const paginationConfig = computed(() => ({
        currentPage: internalCurrentPage.value,
        itemsPerPage: internalItemsPerPage.value,
        totalItems: props.meta?.total || 0,
    }))

    const handleTableAction = (payload: { type: string; row: TableRow }) => {
        emit('action', {
            type: payload.type,
            row: payload.row.originalData,
        })
    }

    const handlePageChange = (page: number) => {
        internalCurrentPage.value = page
        emit('page-change', page)
        emit('update:current-page', page)
    }

    const handleItemsPerPageChange = (itemsPerPage: number) => {
        internalItemsPerPage.value = itemsPerPage
        internalCurrentPage.value = 1
        emit('items-per-page-change', itemsPerPage)
        emit('update:items-per-page', itemsPerPage)
        emit('update:current-page', 1)
    }

    const handlePageChanged = (page: number) => {
        internalCurrentPage.value = page
        emit('page-change', page)
        emit('update:current-page', page)
    }

    const handleItemsPerPageChanged = (itemsPerPage: number) => {
        internalItemsPerPage.value = itemsPerPage
        internalCurrentPage.value = 1
        emit('items-per-page-change', itemsPerPage)
        emit('update:items-per-page', itemsPerPage)
        emit('update:current-page', 1)
    }

    const handleSort = (sortState: SortState) => {
        if (sortState.direction === undefined) {
            emit('sort-change', undefined, undefined)
            return
        }

        const sortableFields: Record<string, ProductFeaturesSort> = {
            brand_name: 'brand_name',
            product_original_name: 'name_original',
            article_number: 'article_number',
            weight: 'weight',
            category: 'category',
            local_vat: 'local_vat',
            export_vat: 'export_vat',
            price_per_unit: 'local_price',
        }

        const sortField = sortableFields[sortState.columnKey || '']
        if (sortField) {
            emit('sort-change', sortField, sortState.direction)
        }
    }
</script>
