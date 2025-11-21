<template>
    <div class="orders-table-wrapper">
        <Table
            :columns="tableColumns"
            :rows="tableRows"
            :loading="loading"
            :pagination="showPagination"
            :pagination-config="paginationConfig"
            :show-column-borders="false"
            :fixed-layout="true"
            :sort-by="sortBy"
            :sort-direction="sortDirection"
            :selectable="false"
            :extended-row="true"
            :editable-columns="editableColumns"
            background="bg-white"
            test="orders-table"
            @sort="handleSort"
            @update:current-page="handlePageChange"
            @update:items-per-page="handleItemsPerPageChange"
            @page-changed="handlePageChanged"
            @items-per-page-changed="handleItemsPerPageChanged"
            @selection-changed="handleSelectionChanged"
            @cell-edit="handleCellEdit"
        >
            <template #row-expansion="{ item }">
                <div
                    class="px-4 py-3 flex items-center justify-end gap-3 bg-white border-t border-gray-400"
                >
                    <div v-if="isRowBeingEdited(item)" class="flex items-center gap-2">
                        <Button
                            size="sm"
                            color="red"
                            variant="filled"
                            @click="handleSaveEdit(item)"
                        >
                            <div class="flex items-center gap-2">
                                <svg class="w-4 h-4">
                                    <use xlink:href="/sprite.svg#check" />
                                </svg>
                                <span>{{ t('save') }}</span>
                            </div>
                        </Button>

                        <Button
                            size="sm"
                            color="gray"
                            variant="filled"
                            @click="handleCancelEdit(item)"
                        >
                            <div class="flex items-center gap-2">
                                <span>{{ t('cancel') }}</span>
                            </div>
                        </Button>

                        <div class="w-px h-8 bg-gray-400 mx-2"></div>
                    </div>

                    <div class="flex items-center gap-2">
                        <Button
                            v-if="showExtendedAction(item, 'confirm')"
                            v-tooltip="t('table.actions.confirm')"
                            size="sm"
                            font-weight="normal"
                            color="blue"
                            variant="outline"
                            container-classes="!border-blue-50 !bg-blue-50"
                            @click="handleConfirmOrder({ row: item })"
                        >
                            <div class="flex items-center gap-2">
                                <svg class="w-4 h-4">
                                    <use xlink:href="/sprite.svg#check" />
                                </svg>
                            </div>
                        </Button>

                        <Button
                            v-if="showExtendedAction(item, 'reject')"
                            v-tooltip="t('table.actions.reject')"
                            size="sm"
                            font-weight="normal"
                            color="red"
                            variant="outline"
                            container-classes="!border-red-50 !bg-red-50"
                            @click="handleRejectOrder({ row: item })"
                        >
                            <div class="flex items-center gap-2">
                                <svg class="w-5 h-5">
                                    <use xlink:href="/sprite.svg#close" />
                                </svg>
                            </div>
                        </Button>

                        <Button
                            v-if="showExtendedAction(item, 'download')"
                            size="sm"
                            font-weight="normal"
                            color="blue"
                            variant="filled"
                            @click="handleDownloadOrder({ row: item })"
                        >
                            <div class="flex items-center gap-2">
                                <svg class="w-4 h-4">
                                    <use xlink:href="/sprite.svg#save" />
                                </svg>
                                <span>{{ t('table.actions.downloadPDF') }}</span>
                            </div>
                        </Button>

                        <Button
                            v-if="showExtendedAction(item, 'edit')"
                            size="sm"
                            color="blue"
                            font-weight="normal"
                            variant="filled"
                            @click="handleEditOrder({ row: item })"
                        >
                            <div class="flex items-center gap-2">
                                <svg class="w-4 h-4">
                                    <use xlink:href="/sprite.svg#edit2" />
                                </svg>
                                <span>{{ t('table.actions.editOrder') }}</span>
                            </div>
                        </Button>

                        <Button
                            v-if="showExtendedAction(item, 'reset')"
                            size="sm"
                            color="blue"
                            font-weight="normal"
                            variant="filled"
                            @click="handleResetOrder({ row: item })"
                        >
                            <div class="flex items-center gap-2">
                                <svg class="w-4 h-4">
                                    <use xlink:href="/sprite.svg#rotate-ccw" />
                                </svg>
                                <span>{{ t('table.actions.reset') }}</span>
                            </div>
                        </Button>
                    </div>
                </div>
            </template>
        </Table>
    </div>
</template>
<script setup lang="ts">
    import { ref, computed, watch } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useDate } from '~/composables/useDate'
    import { useFormatters } from '~/composables/useFormatters'
    import { useStaticData } from '~/composables/useStaticData'
    import type { TableColumn, TableRow, SortState } from '~/types/ui/table'
    import type { OrderTableData, OrderTableSortField, UserRole } from '~/types/orderTableDashboard'

    interface Props {
        orders?: OrderTableData[]
        meta?: any
        currentPage?: number
        itemsPerPage?: number
        loading?: boolean
        showPagination?: boolean
        sortBy?: OrderTableSortField
        sortDirection?: 'asc' | 'desc' | undefined
        viewAs?: UserRole
        activeTab?: string
    }

    const props = withDefaults(defineProps<Props>(), {
        orders: () => [],
        meta: () => ({}),
        currentPage: 1,
        itemsPerPage: 20,
        loading: false,
        showPagination: true,
        sortBy: undefined,
        sortDirection: undefined,
        viewAs: 'supplier',
        activeTab: 'all',
    })

    const emit = defineEmits<{
        'page-change': [page: number]
        'items-per-page-change': [itemsPerPage: number]
        'sort-change': [
            field: OrderTableSortField | undefined,
            direction: 'asc' | 'desc' | undefined,
        ]
        download: [orderId: number, orderData: any]
        delete: [orderId: number, orderData: any]
        confirm: [orderId: number, orderData: any]
        reject: [orderId: number, orderData: any]
        edit: [orderId: number, orderData: any]
        'request-feedback': [orderId: number, orderData: any]
        reset: [orderId: number, orderData: any]
        'update:current-page': [page: number]
        'update:items-per-page': [itemsPerPage: number]
        'selection-changed': [selectedRows: TableRow[]]
        'update-status': [
            payload: {
                orderId: number
                statusId?: number
                paymentStatusId?: number
                orderData: any
            },
        ]
    }>()

    const { t } = useI18n()
    const { formatDate } = useDate()
    const { formatCurrency } = useFormatters()
    const { documentStatusOptions, documentPaymentStatusOptions, documentStatuses } =
        useStaticData()

    const internalCurrentPage = ref(props.currentPage)
    const internalItemsPerPage = ref(props.itemsPerPage)
    const selectedRows = ref<TableRow[]>([])

    const editingState = ref<{
        rowId: string | null
        originalPaymentStatusId: number | null
        originalOrderStatusId: number | null
        newPaymentStatusId: number | null
        newOrderStatusId: number | null
    }>({
        rowId: null,
        originalPaymentStatusId: null,
        originalOrderStatusId: null,
        newPaymentStatusId: null,
        newOrderStatusId: null,
    })

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

    const editableColumns = computed(() => {
        return ['payment_status', 'order_status']
    })

    const canEditOrderStatus = (order: any): boolean => {
        const statusCode = order.status?.code?.toLowerCase()

        if (props.viewAs === 'buyer') {
            return false
        }

        if (props.viewAs === 'supplier') {
            if (statusCode === 'pending') {
                return false
            }
            return true
        }

        return false
    }

    const filteredStatusOptions = computed(() => {
        return documentStatusOptions.value.filter((status) => {
            const code = documentStatuses.value.find((s) => s.id === status.value)?.code
            return !['pending', 'confirmed', 'rejected'].includes(code || '')
        })
    })

    const tableColumns = computed<TableColumn[]>(() => [
        {
            key: 'company_id',
            label: t('table.companyId'),
            sortable: true,
            view: 'TableCellText',
            width: '120px',
            align: 'left',
        },
        {
            key: 'company_name',
            label: t('table.companyName'),
            sortable: true,
            view: 'TableCellText',
            width: '180px',
            align: 'left',
        },
        {
            key: 'order_number',
            label: t('table.orderNumber'),
            sortable: true,
            view: 'TableCellText',
            width: '140px',
            align: 'left',
        },
        {
            key: 'country',
            label: t('table.country'),
            sortable: true,
            view: 'TableCellCountry',
            width: '110px',
            align: 'left',
        },
        {
            key: 'date',
            label: t('table.date'),
            sortable: true,
            view: 'TableCellDate',
            width: '110px',
            align: 'left',
        },
        {
            key: 'payment_status',
            label: t('table.paymentStatus'),
            sortable: true,
            view: 'TableCellEditableSelect',
            width: '150px',
            align: 'center',
            cellOptions: {
                editable: props.viewAs === 'supplier',
                options: documentPaymentStatusOptions.value,
                searchable: false,
                placeholder: t('filters.selectPaymentStatus'),
                showCode: false,
                showSymbol: false,
            },
        },
        {
            key: 'order_status',
            label: t('table.orderStatus'),
            sortable: true,
            view: 'TableCellEditableSelect',
            width: '150px',
            align: 'center',
            cellOptions: {
                editable: props.viewAs === 'supplier',
                classes: 'border border-gray-400',
                options: filteredStatusOptions.value,
                searchable: false,
                placeholder: t('filters.selectOrderStatus'),
                showCode: false,
                showSymbol: false,
            },
        },
        {
            key: 'number_of_skus',
            label: t('table.numberOfSkus'),
            sortable: true,
            view: 'TableCellText',
            width: '100px',
            align: 'center',
        },
        {
            key: 'total_amount',
            label: t('table.totalAmount'),
            sortable: true,
            view: 'TableCellText',
            width: '130px',
            align: 'right',
            classes: 'font-bold',
        },
    ])

    const getExtendedActions = (item: TableRow): string[] => {
        const order = item.originalData
        const statusCode = order.status?.code?.toLowerCase()
        const actions: string[] = []

        actions.push('download')

        if (props.viewAs === 'supplier') {
            if (statusCode === 'pending') {
                actions.push('confirm', 'reject', 'edit')
            }
        }

        if (props.viewAs === 'buyer') {
            if (statusCode === 'pending') {
                actions.push('edit')
            }
        }

        actions.push('delete')

        if (statusCode === 'deleted') {
            actions.push('reset')
        }

        return actions
    }

    const showExtendedAction = (item: TableRow, actionType: string): boolean => {
        const extendedActions = getExtendedActions(item)
        return extendedActions.includes(actionType)
    }

    const isRowBeingEdited = (item: TableRow): boolean => {
        return editingState.value.rowId === item.id
    }

    const tableRows = computed<TableRow[]>(() => {
        const orders = props.orders || []

        if (!Array.isArray(orders) || orders.length === 0) {
            return []
        }

        return orders.map((order, index) => {
            const counterparty = props.viewAs === 'supplier' ? order.buyer : order.supplier

            const orderId = order.id || index + 1
            const orderNumber = order.number || `#${orderId}`
            const counterpartyName =
                counterparty?.name || counterparty?.email || t('common.unknown')
            const counterpartyCountry = counterparty?.country?.name || t('common.unknown')
            const countryFlagUrl = counterparty?.country?.flag_url || null
            const orderDate = order.date

            const defaultStatusId = documentStatusOptions.value?.[0]?.value || 1
            const defaultPaymentStatusId = documentPaymentStatusOptions.value?.[0]?.value || 1

            const paymentStatusId =
                editingState.value.rowId === orderId.toString() &&
                editingState.value.newPaymentStatusId !== null
                    ? editingState.value.newPaymentStatusId
                    : (order.payment_status?.id ?? defaultPaymentStatusId)

            const orderStatusId =
                editingState.value.rowId === orderId.toString() &&
                editingState.value.newOrderStatusId !== null
                    ? editingState.value.newOrderStatusId
                    : (order.status?.id ?? defaultStatusId)

            const totalAmount = parseFloat(order.total || '0')
            const currencySymbol = order.currency?.symbol || '€'
            const formattedTotal = formatCurrency(totalAmount, currencySymbol)

            return {
                id: orderId.toString(),
                row: [
                    orderId,
                    counterpartyName,
                    orderNumber,
                    {
                        name: counterpartyCountry,
                        icon: countryFlagUrl,
                        code: counterparty.country?.code,
                    },
                    orderDate,
                    paymentStatusId,
                    orderStatusId,
                    (order.items_count || 0).toString(),
                    formattedTotal,
                ],
                originalData: order,
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

        const columnKey = sortState.columnKey || ''
        let sortField: OrderTableSortField | undefined

        switch (columnKey) {
            case 'company_id':
                sortField = props.viewAs === 'supplier' ? 'buyer_id' : 'supplier_id'
                break
            case 'company_name':
                sortField = props.viewAs === 'supplier' ? 'buyer_name' : 'supplier_name'
                break
            case 'order_number':
                sortField = 'number'
                break
            case 'country':
                sortField = props.viewAs === 'supplier' ? 'buyer_country' : 'supplier_country'
                break
            case 'date':
                sortField = 'date'
                break
            case 'total_amount':
                sortField = 'total'
                break
            case 'number_of_skus':
                sortField = 'number_of_skus'
                break
            case 'payment_status':
                sortField = 'payment_status'
                break
            case 'order_status':
                sortField = 'status'
                break
            default:
                sortField = 'date'
        }

        emit('sort-change', sortField, sortState.direction)
    }

    const handleDownloadOrder = (payload: { row: TableRow }) => {
        const order = payload.row.originalData
        if (!order?.id) return
        emit('download', order.id, order)
    }

    const handleDeleteOrder = (payload: { row: TableRow }) => {
        const order = payload.row.originalData
        if (!order?.id) return
        emit('delete', order.id, order)
    }

    const handleConfirmOrder = (payload: { row: TableRow }) => {
        const order = payload.row.originalData
        if (!order?.id) return
        emit('confirm', order.id, order)
    }

    const handleRejectOrder = (payload: { row: TableRow }) => {
        const order = payload.row.originalData
        if (!order?.id) return
        emit('reject', order.id, order)
    }

    const handleEditOrder = (payload: { row: TableRow }) => {
        const order = payload.row.originalData
        if (!order?.id) return
        emit('edit', order.id, order)
    }

    const handleRequestFeedback = (payload: { row: TableRow }) => {
        const order = payload.row.originalData
        if (!order?.id) return
        emit('request-feedback', order.id, order)
    }

    const handleResetOrder = (payload: { row: TableRow }) => {
        const order = payload.row.originalData
        if (!order?.id) return
        emit('reset', order.id, order)
    }

    const handleSelectionChanged = (selected: TableRow[]) => {
        selectedRows.value = selected
        emit('selection-changed', selected)
    }

    const handleCellEdit = (payload: {
        rowId: string
        column: string
        value: any
        row: TableRow
    }) => {
        const order = payload.row.originalData

        if (!canEditOrderStatus(order) && payload.column === 'order_status') {
            return
        }

        if (editingState.value.rowId !== payload.rowId) {
            editingState.value = {
                rowId: payload.rowId,
                originalPaymentStatusId: order.payment_status?.id || null,
                originalOrderStatusId: order.status?.id || null,
                newPaymentStatusId:
                    payload.column === 'payment_status'
                        ? payload.value
                        : order.payment_status?.id || null,
                newOrderStatusId:
                    payload.column === 'order_status' ? payload.value : order.status?.id || null,
            }
        } else {
            if (payload.column === 'payment_status') {
                editingState.value.newPaymentStatusId = payload.value
            } else if (payload.column === 'order_status') {
                editingState.value.newOrderStatusId = payload.value
            }
        }
    }

    const handleSaveEdit = (item: TableRow) => {
        const order = item.originalData
        if (!order?.id) return

        const hasPaymentStatusChanged =
            editingState.value.newPaymentStatusId !== null &&
            editingState.value.newPaymentStatusId !== editingState.value.originalPaymentStatusId

        const hasOrderStatusChanged =
            editingState.value.newOrderStatusId !== null &&
            editingState.value.newOrderStatusId !== editingState.value.originalOrderStatusId

        if (hasPaymentStatusChanged || hasOrderStatusChanged) {
            emit('update-status', {
                orderId: order.id,
                statusId: hasOrderStatusChanged ? editingState.value.newOrderStatusId! : undefined,
                paymentStatusId: hasPaymentStatusChanged
                    ? editingState.value.newPaymentStatusId!
                    : undefined,
                orderData: order,
            })
        }

        editingState.value = {
            rowId: null,
            originalPaymentStatusId: null,
            originalOrderStatusId: null,
            newPaymentStatusId: null,
            newOrderStatusId: null,
        }
    }

    const handleCancelEdit = (item: TableRow) => {
        editingState.value = {
            rowId: null,
            originalPaymentStatusId: null,
            originalOrderStatusId: null,
            newPaymentStatusId: null,
            newOrderStatusId: null,
        }
    }
</script>

<style scoped lang="scss">
    .orders-table-wrapper {
        @apply w-full;
    }
</style>
