<template>
    <div class="all-buyers-table-wrapper">
        <Table
            :columns="tableColumns"
            :rows="tableRows"
            :loading="loading"
            :pagination="true"
            :pagination-config="paginationConfig"
            :fixed-layout="true"
            :sort-by="sortBy"
            :actions="['show-profile']"
            :sort-direction="sortDirection"
            background="bg-white"
            test="all-buyers-table"
            @show-profile="handleViewProfile"
            @sort="handleSort"
            @update:current-page="handlePageChange"
            @update:items-per-page="handleItemsPerPageChange"
            @page-changed="handlePageChanged"
            @items-per-page-changed="handleItemsPerPageChanged"
        />
    </div>
</template>

<script setup lang="ts">
    import { computed, watch, ref } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useDate } from '~/composables/useDate'
    import type { TableColumn, TableRow, SortState } from '~/types/ui/table'
    import type { allBuyersTableUser, DashboardSortField } from '~/types/userDashboard'

    interface Props {
        buyers?: allBuyersTableUser[]
        meta?: any
        currentPage?: number
        itemsPerPage?: number
        loading?: boolean
        showPagination?: boolean
        sortBy?: DashboardSortField
        sortDirection?: 'asc' | 'desc' | undefined
    }

    const props = withDefaults(defineProps<Props>(), {
        buyers: () => [],
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
            field: DashboardSortField | undefined,
            direction: 'asc' | 'desc' | undefined,
        ]
        action: [action: { type: string; row: any }]
        'update:current-page': [page: number]
        'update:items-per-page': [itemsPerPage: number]
    }>()

    const { t } = useI18n()
    const { formatDate } = useDate()
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
            key: 'company_id',
            label: t('table.companyId'),
            sortable: true,
            view: 'TableCellText',
            width: '100px',
            align: 'left',
        },
        {
            key: 'company_name',
            label: t('table.companyName'),
            sortable: true,
            view: 'TableCellText',
            width: '200px',
            align: 'left',
        },
        {
            key: 'country',
            label: t('table.country'),
            sortable: true,
            view: 'TableCellCountry',
            width: '150px',
            align: 'left',
        },
        {
            key: 'business_type',
            label: t('table.businessType'),
            sortable: true,
            view: 'TableCellText',
            width: '150px',
            align: 'left',
        },
        {
            key: 'nr_of_skus',
            label: t('table.numberOfSkus'),
            sortable: true,
            view: 'TableCellText',
            width: '120px',
            align: 'center',
        },
        {
            key: 'nr_of_orders',
            label: t('table.numberOfOrders'),
            sortable: true,
            view: 'TableCellText',
            width: '120px',
            align: 'center',
        },
        {
            key: 'total_amount',
            label: t('table.totalAmount'),
            sortable: true,
            cellOptions: { classes: 'font-bold' },
            view: 'TableCellText',
            width: '150px',
            align: 'right',
        },
        {
            key: 'actions',
            label: '',
            sortable: false,
            view: 'TableCellActions',
            width: '120px',
            align: 'right',
        },
    ])

    const tableRows = computed<TableRow[]>(() => {
        if (!props.buyers || props.buyers.length === 0) {
            return []
        }

        return props.buyers.map((buyer, index) => {
            const rowId = `buyer-${buyer.company_id}-${index}`

            return {
                id: rowId,
                row: [
                    buyer.company_id?.toString() || '-',
                    buyer.company_name || '-',
                    buyer.country || '-',
                    buyer.business_type || '-',
                    buyer.nr_of_skus?.toString() || '0',
                    buyer.nr_of_orders?.toString() || '0',
                    formatCurrency(buyer.total_amount),
                ],
                originalData: buyer,
                index,
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
    const handleViewProfile = async (payload: { row: TableRow }) => {
        await navigateTo(`/profile/${payload?.row?.originalData?.company_id}`)
    }

    const handleSort = (sortState: SortState) => {
        if (sortState.direction === undefined) {
            emit('sort-change', undefined, undefined)
            return
        }

        const sortableFields: Record<string, DashboardSortField> = {
            company_id: 'company_id',
            company_name: 'company_name',
            country: 'country',
            business_type: 'business_type',
            nr_of_skus: 'nr_of_skus',
            nr_of_orders: 'nr_of_orders',
            total_amount: 'total_amount',
        }

        const sortField = sortableFields[sortState.columnKey || '']
        if (sortField) {
            emit('sort-change', sortField, sortState.direction)
        }
    }
</script>
