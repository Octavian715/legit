<template>
    <div class="products-table-wrapper">
        <Table
            :columns="tableColumns"
            :rows="tableRows"
            :loading="loading"
            pagination
            :pagination-config="paginationConfig"
            fixed-layout
            :sort-by="sortBy"
            :sort-direction="sortDirection"
            background="bg-white"
            test="buyer-all-products-table"
            @sort="handleSort"
            @update:current-page="handlePageChange"
            @update:items-per-page="handleItemsPerPageChange"
            @page-changed="handlePageChanged"
            @items-per-page-changed="handleItemsPerPageChanged"
        />
    </div>
</template>

<script setup lang="ts">
    import { computed, watch } from 'vue'
    import { useI18n } from 'vue-i18n'
    import type { TableColumn, TableRow, SortState } from '~/types/ui/table'
    import type { AllProductsItem } from '~/types/dashboardProduct'

    interface Props {
        products?: AllProductsItem[]
        meta?: any
        currentPage?: number
        itemsPerPage?: number
        loading?: boolean
        showPagination?: boolean
        sortBy?: string
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
        'sort-change': [field: string | undefined, direction: 'asc' | 'desc' | undefined]
        'update:current-page': [page: number]
        'update:items-per-page': [itemsPerPage: number]
    }>()

    const { t } = useI18n()
    const { formatCurrency } = useFormatters()

    const internalCurrentPage = ref(props.currentPage)
    const internalItemsPerPage = ref(props.itemsPerPage)

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
            key: 'bought_units',
            label: t('table.boughtUnits'),
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

    const formatBoughtUnits = (units: number): string => {
        if (units === null || units === undefined) return '0'
        return Math.round(Number(units)).toLocaleString()
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
                    product.product_id?.toString() || t('table.unknownId'),
                    product.brand_name || t('table.notSpecified'),
                    product.product_original_name || t('table.unknownName'),
                    product.article_number || t('table.notSpecified'),
                    formatWeight(product.weight),
                    formatBoughtUnits(product.bought_units || 0),
                    formatVAT(product.vat_local || 0),
                    formatCurrency(product.total_amount || 0),
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

        const sortableFields: Record<string, string> = {
            product_id: 'id',
            brand_name: 'brand_name',
            product_original_name: 'name',
            article_number: 'article_number',
            weight: 'weight',
            bought_units: 'units',
            vat: 'local_vat',
            total_amount: 'amount',
        }

        const sortField = sortableFields[sortState.columnKey || '']
        if (sortField) {
            emit('sort-change', sortField, sortState.direction)
        }
    }
</script>
