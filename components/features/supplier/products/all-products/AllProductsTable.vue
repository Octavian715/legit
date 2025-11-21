<template>
    <div class="products-table-wrapper">
        <Table
            :columns="tableColumns"
            :rows="tableRows"
            :loading="loading"
            pagination
            :pagination-config="paginationConfig"
            :actions="allActions"
            fixed-layout
            :sort-by="sortBy"
            extended-row
            :sort-direction="sortDirection"
            background="bg-white"
            test="all-products-table"
            @actions="handleTableAction"
            @update-product="handleEditAction"
            @edit="handleEditAction"
            @delete="handleDeleteAction"
            @sort="handleSort"
            @update:current-page="handlePageChange"
            @update:items-per-page="handleItemsPerPageChange"
            @page-changed="handlePageChanged"
            @items-per-page-changed="handleItemsPerPageChanged"
        >
            <template #row-expansion="{ item }">
                <div class="flex items-center justify-end gap-2 px-4 py-2 bg-gray-50">
                    <!-- Action Buttons -->
                    <div class="flex items-center gap-2">
                        <!-- ✅ Status Select - CORECT cu productStatusOptions -->
                        <div class="status-select-wrapper">
                            <Select
                                :id="`status-select-${item.id}`"
                                :name="`status-${item.id}`"
                                :options="productStatusOptions"
                                :model-value="item?.originalData?.status?.id"
                                label="Status"
                                select-label="label"
                                :reduce="(option) => option.value"
                                size="sm"
                                :searchable="false"
                                :clearable="false"
                                background="bg-white"
                                @update:modelValue="(value) => handleStatusChange(item, value)"
                            />
                        </div>

                        <!-- Edit Button -->
                        <NuxtLink
                            :to="
                                localePath(
                                    `/supplier/products/new?step=basic-info&product=${item.id}`
                                )
                            "
                        >
                            <Button variant="filled" color="blue" size="sm" font-weight="normal">
                                <div class="flex gap-1 items-center">
                                    <svg class="w-4 h-4">
                                        <use xlink:href="/sprite.svg#edit2"></use>
                                    </svg>
                                    {{ t('edit') }} {{ t('sku', { n: 0 }) }}
                                </div>
                            </Button>
                        </NuxtLink>

                        <!-- Delete Button -->
                        <Button
                            variant="filled"
                            color="red"
                            size="sm"
                            icon="close"
                            font-weight="normal"
                            @click="
                                $emit('action', {
                                    type: 'delete',
                                    row: item,
                                })
                            "
                        >
                            <div class="flex gap-1 items-center">
                                <svg class="w-4 h-4">
                                    <use xlink:href="/sprite.svg#delete"></use>
                                </svg>
                                {{ t('delete') }}
                            </div>
                        </Button>
                    </div>
                </div>
            </template>
        </Table>
    </div>
</template>

<script setup lang="ts">
    import { computed, watch, onMounted, ref } from 'vue'
    import { useI18n } from 'vue-i18n'
    import type { TableColumn, TableRow, SortState } from '~/types/ui/table'
    import type { ProductWithFeatures, ProductFeaturesSort } from '~/types/dashboardProduct'
    import { useLocalePath } from '#imports'

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
        itemsPerPage: 20,
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
    const localePath = useLocalePath()

    const internalCurrentPage = ref(props.currentPage)
    const internalItemsPerPage = ref(props.itemsPerPage)

    // ✅ CORRECT: Use productStatusOptions DIRECT from useProductStaticData
    const { productStatusOptions, isLoading, refetch } = useProductStaticData()
    const { formatCurrency } = useFormatters()

    // Initialize product static data when component mounts
    onMounted(async () => {
        if (!productStatusOptions.value?.length) {
            await refetch(true)
        }
    })

    const allActions = []

    watch(
        () => props.currentPage,
        (newPage) => {
            if (newPage !== internalCurrentPage.value) {
                internalCurrentPage.value = newPage
            }
        },
        { immediate: true }
    )

    watch(
        () => props.itemsPerPage,
        (newItemsPerPage) => {
            if (newItemsPerPage !== internalItemsPerPage.value) {
                internalItemsPerPage.value = newItemsPerPage
            }
        },
        { immediate: true }
    )

    // ✅ CORRECT: Handle status change with value from Select
    const handleStatusChange = (item: TableRow, newStatusValue: number): void => {
        // Find the full status option from productStatusOptions
        const statusOption = productStatusOptions.value.find((opt) => opt.value === newStatusValue)

        emit('action', {
            type: 'update-status',
            row: item.id,
            value: {
                id: newStatusValue,
                name: statusOption?.label || '',
                code: statusOption?.code || '',
            },
        })
    }

    // ✅ Helper function using productStatusOptions
    const getStatusLabel = (statusValue: number): string => {
        const option = productStatusOptions.value.find((opt) => opt.value === statusValue)
        return option ? option.label : String(statusValue)
    }

    const tableColumns = computed<TableColumn[]>(() => [
        {
            key: 'product_id',
            label: t('table.productId'),
            sortable: true,
            view: 'TableCellText',
            width: '100px',
            align: 'left',
        },
        {
            key: 'brand_name',
            label: t('table.brandName'),
            sortable: true,
            view: 'TableCellText',
            width: '150px',
            align: 'left',
        },
        {
            key: 'product_original_name',
            label: t('table.productName'),
            sortable: true,
            view: 'TableCellText',
            width: '200px',
            align: 'left',
        },
        {
            key: 'article_number',
            label: t('table.articleNumber'),
            sortable: true,
            view: 'TableCellText',
            width: '130px',
            align: 'left',
        },
        {
            key: 'weight',
            label: t('table.weight'),
            sortable: true,
            view: 'TableCellText',
            width: '100px',
            align: 'left',
        },
        {
            key: 'sold_units',
            label: t('table.soldUnits'),
            sortable: true,
            view: 'TableCellText',
            width: '100px',
            align: 'left',
        },
        {
            key: 'vat',
            label: t('table.vat'),
            sortable: true,
            view: 'TableCellText',
            width: '80px',
            align: 'left',
        },
        {
            key: 'total_amount',
            label: t('table.totalAmount'),
            sortable: true,
            view: 'TableCellText',
            cellOptions: { classes: 'font-bold' },
            width: '130px',
            align: 'right',
        },
    ])

    const formatWeight = (weight: { value: number; unit: string } | null): string => {
        if (!weight) return t('table.noWeight')
        return `${weight.value}${weight.unit}`
    }

    const formatVAT = (vat: number): string => {
        return `${vat}%`
    }

    const calculateTotalAmount = (product: ProductWithFeatures): number => {
        const basePrice = product.local_price || 0
        const vat = product.local_vat || 0
        const soldUnits = product.sold_units || 0

        const priceWithVat = basePrice * (1 + vat / 100)
        return priceWithVat * soldUnits
    }

    const formatSoldUnits = (units: number): string => {
        if (units === null || units === undefined) return '0'
        return Math.round(Number(units)).toLocaleString()
    }

    const tableRows = computed<TableRow[]>(() => {
        const products = props.products || []

        if (!Array.isArray(products) || products.length === 0) {
            return []
        }

        return products.map((product, index) => {
            const totalAmount = calculateTotalAmount(product)

            return {
                id: product.product_id?.toString() || `product-${index}`,
                row: [
                    product.product_id?.toString() || t('table.unknownId'),
                    product.brand_name || t('table.notSpecified'),
                    product.product_original_name || t('table.unknownName'),
                    product.article_number || t('table.notSpecified'),
                    formatWeight(product.weight),
                    formatSoldUnits(product.sold_units || 0),
                    formatVAT(product.local_vat || 0),
                    formatCurrency(totalAmount),
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

    const handleEditAction = (payload: { row: TableRow }) => {
        emit('action', {
            type: 'edit',
            row: payload.row.originalData,
        })
    }

    const handleDeleteAction = (payload: { row: TableRow }) => {
        emit('action', {
            type: 'delete',
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
            product_id: 'name',
            brand_name: 'brand_name',
            product_original_name: 'name',
            article_number: 'article_number',
            weight: 'weight',
            sold_units: 'units',
            vat: 'local_vat',
            total_amount: 'amount',
        }

        const sortField = sortableFields[sortState.columnKey || '']
        if (sortField) {
            emit('sort-change', sortField, sortState.direction)
        }
    }
</script>

<style scoped>
    .products-table-wrapper {
        @apply w-full;
    }

    /* ✅ Status Select styling */
    .status-select-wrapper {
        min-width: 180px;
        width: 180px;
        position: relative;
    }

    /* ✅ Force dropdown width */
    .status-select-wrapper :deep(.vs__dropdown-menu) {
        min-width: 220px !important;
        max-width: 300px !important;
        width: auto !important;
    }

    /* ✅ No text truncation */
    .status-select-wrapper :deep(.vs__dropdown-option) {
        white-space: nowrap !important;
        overflow: visible !important;
        text-overflow: clip !important;
        padding: 10px 16px !important;
    }

    /* ✅ Selected value no truncation */
    .status-select-wrapper :deep(.vs__selected) {
        white-space: nowrap !important;
        overflow: visible !important;
        text-overflow: clip !important;
        max-width: none !important;
    }

    /* ✅ Hover & selected states */
    .status-select-wrapper :deep(.vs__dropdown-option:hover) {
        background-color: #f3f4f6;
    }

    .status-select-wrapper :deep(.vs__dropdown-option--highlight) {
        background-color: #dbeafe !important;
        color: #1e40af !important;
    }

    .status-select-wrapper :deep(.vs__dropdown-option--selected) {
        background-color: #eff6ff !important;
        color: #2563eb !important;
        font-weight: 500;
    }
</style>
