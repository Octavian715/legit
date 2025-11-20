<template>
    <div class="documents-table-wrapper">
        <Table
            :columns="tableColumns"
            :rows="tableRows"
            :loading="loading"
            :pagination="true"
            :pagination-config="paginationConfig"
            :actions="tableActions"
            :show-column-borders="false"
            :fixed-layout="true"
            :sort-by="sortBy"
            :sort-direction="sortDirection"
            background="bg-white"
            @sort="handleSort"
            @view-pdf="handleViewPdf"
            @page-changed="handlePageChange"
            @items-per-page-changed="handleItemsPerPageChange"
        />
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue'
    import { useI18n } from 'vue-i18n'
    import type { TableColumn, TableRow, SortState } from '~/types/ui/table'
    import type { OrderTableData, OrderTableSortField } from '~/types/orderTableDashboard'
    import { useFormatters } from '~/composables/useFormatters'
    import { useDate } from '~/composables/useDate'

    interface Props {
        documents?: OrderTableData[]
        meta?: any
        currentPage?: number
        itemsPerPage?: number
        loading?: boolean
        sortBy?: OrderTableSortField
        sortDirection?: 'asc' | 'desc' | undefined
        viewAs?: 'supplier' | 'buyer' | null
    }

    const props = withDefaults(defineProps<Props>(), {
        documents: () => [],
        meta: () => ({}),
        currentPage: 1,
        itemsPerPage: 10,
        loading: false,
        sortBy: undefined,
        sortDirection: undefined,
        viewAs: null,
    })

    const emit = defineEmits<{
        'page-change': [page: number]
        'items-per-page-change': [itemsPerPage: number]
        'sort-change': [
            field: OrderTableSortField | undefined,
            direction: 'asc' | 'desc' | undefined,
        ]
        action: [action: { type: string; row: any }]
    }>()

    const { t } = useI18n()
    const { formatCurrency } = useFormatters()
    const { formatDate } = useDate()

    const tableActions = computed(() => ['view-pdf'])

    const tableColumns = computed<TableColumn[]>(() => [
        {
            key: 'type',
            label: t('table.typeOfDocument'),
            sortable: true,
            view: 'TableCellText',
            width: '120px',
            align: 'left',
        },
        {
            key: 'number',
            label: t('table.documentNumber'),
            sortable: true,
            view: 'TableCellText',
            width: '140px',
            align: 'left',
        },
        {
            key: 'date',
            label: t('table.date'),
            sortable: true,
            view: 'TableCellText',
            width: '120px',
            align: 'left',
        },
        {
            key: 'company_id',
            label: t('table.companyId'),
            sortable: false,
            view: 'TableCellText',
            width: '110px',
            align: 'left',
        },
        {
            key: 'company_name',
            label: t('table.companyName'),
            sortable: true,
            view: 'TableCellCompany',
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
            key: 'currency',
            label: t('table.currency'),
            sortable: true,
            view: 'TableCellText',
            width: '90px',
            align: 'center',
        },
        {
            key: 'total',
            label: t('table.totalAmount'),
            sortable: true,
            view: 'TableCellText',
            classes: 'font-bold',
            width: '140px',
            align: 'right',
        },
        {
            key: 'actions',
            label: '',
            sortable: false,
            view: 'TableCellActions',
            width: '130px',
            align: 'right',
        },
    ])

    const tableRows = computed<TableRow[]>(() => {
        const documents = props.documents || []

        if (!Array.isArray(documents) || documents.length === 0) {
            return []
        }
        return documents.map((doc, index) => {
            const company = props.viewAs === 'supplier' ? doc.buyer : doc.supplier

            return {
                id: doc.id?.toString() || `doc-${index}`,
                row: [
                    doc?.type?.label || '-',
                    doc.number || '-',
                    formatDate(doc.date, 'dd.MM.yyyy') || '-',
                    company?.id?.toString() || '-',
                    {
                        id: company?.id,
                        name: company?.name || t('table.unknownName'),
                        email: company?.email || '',
                    },
                    {
                        name: company?.country?.name,

                        code: company.country?.code,
                        flag_url: company.country?.flag_url,
                    },
                    doc.currency?.code || '-',
                    formatCurrency(parseFloat(doc.total?.toString() || '0'), doc.currency?.symbol),
                ],
                originalData: doc,
                index,
            }
        })
    })

    const paginationConfig = computed(() => ({
        currentPage: props.currentPage,
        itemsPerPage: props.itemsPerPage,
        totalItems: props.meta?.total || 0,
    }))

    const handleSort = (sortState: SortState) => {
        if (sortState.direction === undefined) {
            emit('sort-change', undefined, undefined)
            return
        }

        const sortableFields: Record<string, OrderTableSortField> = {
            type: 'type',
            number: 'number',
            date: 'date',
            company_name: props.viewAs === 'supplier' ? 'buyer_name' : 'buyer_name',
            country: props.viewAs === 'supplier' ? 'buyer_country' : 'buyer_country',
            currency: 'currency',
            total: 'total',
        }

        const sortField = sortableFields[sortState.columnKey || '']
        if (sortField) {
            emit('sort-change', sortField, sortState.direction)
        }
    }

    const handleViewPdf = (payload: { row: TableRow }) => {
        emit('action', {
            type: 'view-pdf',
            row: payload.row.originalData,
        })
    }

    const handlePageChange = (page: number) => {
        emit('page-change', page)
    }

    const handleItemsPerPageChange = (itemsPerPage: number) => {
        emit('items-per-page-change', itemsPerPage)
    }
</script>
