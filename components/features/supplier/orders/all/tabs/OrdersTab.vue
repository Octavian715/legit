<template>
    <OrdersTable
        :orders="orders"
        :meta="ordersMeta"
        :loading="isLoading"
        :show-pagination="true"
        :current-page="currentPage"
        :items-per-page="itemsPerPage"
        :sort-by="sortBy"
        :sort-direction="sortDirection"
        :view-as="viewAs"
        :active-tab="activeTabKey"
        @page-change="handlePageChange"
        @items-per-page-change="handleItemsPerPageChange"
        @sort-change="handleSortChange"
        @download="handleDownload"
        @delete="handleDelete"
        @confirm="handleConfirm"
        @reject="handleReject"
        @edit="handleEdit"
        @request-feedback="handleRequestFeedback"
        @reset="handleReset"
        @update-status="handleUpdateStatus"
    />
</template>

<script setup lang="ts">
    import { ref, watch, onMounted, nextTick, computed } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useDebounceFn } from '@vueuse/core'
    import { useToastNotification } from '~/composables/useToastNotification'
    import { useOrderTableDashboard } from '~/composables/useOrderTableDashboard'
    import type { OrderTableFilters, OrderTableSortField } from '~/types/orderTableDashboard'
    import type { SortDirection } from '~/types/ui/table'

    interface Props {
        filters: OrderTableFilters
        refreshKey: number
        viewAs?: 'supplier' | 'buyer' | null
        activeTabKey?: string
    }

    const props = withDefaults(defineProps<Props>(), {
        filters: () => ({
            type: 'order',
            search: '',
            status_ids: [],
            payment_status_ids: [],
            currency_ids: [],
            amount_min: undefined,
            amount_max: undefined,
            date_from: undefined,
            date_to: undefined,
        }),
        refreshKey: 0,
        viewAs: null,
        activeTabKey: 'all',
    })

    const emit = defineEmits<{
        'open-filters': []
        'update-count': [payload: { tabKey: string; count: number; meta: any }]
        'meta-updated': [meta: any]
        download: [orderId: number, orderData: any]
        delete: [orderId: number, orderData: any]
        confirm: [orderId: number, orderData: any]
        reject: [orderId: number, orderData: any]
        edit: [orderId: number, orderData: any]
        'request-feedback': [orderId: number, orderData: any]
        reset: [orderId: number, orderData: any]
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
    const toast = useToastNotification()

    const { orders, ordersMeta, isLoading, error, getSupplierOrders, getBuyerOrders, resetError } =
        useOrderTableDashboard()

    const totalItems = computed(() => ordersMeta.value?.total || 0)
    const totalPages = computed(() => {
        if (totalItems.value === 0 || itemsPerPage.value === 0) return 1
        return Math.ceil(totalItems.value / itemsPerPage.value)
    })

    const currentPage = ref(1)
    const itemsPerPage = ref(10)
    const sortBy = ref<OrderTableSortField | undefined>(undefined)
    const sortDirection = ref<SortDirection | undefined>(undefined)
    const isFetching = ref(false)

    let currentRequestId = 0

    const fetchAllOrders = async (): Promise<boolean> => {
        if (isFetching.value) {
            return false
        }

        if (!props.viewAs) {
            console.warn('[OrdersTab] viewAs prop is null/undefined, cannot fetch orders')
            return false
        }

        const requestId = ++currentRequestId

        try {
            isFetching.value = true
            resetError()

            if (requestId !== currentRequestId) return false

            if (currentPage.value > totalPages.value && totalPages.value > 0) {
                currentPage.value = totalPages.value
            }

            const filters: OrderTableFilters = {
                ...props.filters,
                page: currentPage.value,
                per_page: itemsPerPage.value,
                sort_by: sortBy.value,
                sort_order: sortDirection.value,
                type: 'invoice',
            }

            let success = false

            if (props.viewAs === 'supplier') {
                success = await getSupplierOrders(filters)
            } else if (props.viewAs === 'buyer') {
                success = await getBuyerOrders(filters)
            }

            if (requestId !== currentRequestId) return false

            if (success && ordersMeta.value) {
                emit('update-count', {
                    tabKey: props.activeTabKey,
                    count: ordersMeta.value.total || 0,
                    meta: ordersMeta.value,
                })

                emit('meta-updated', ordersMeta.value)

                const newTotalPages =
                    Math.ceil((ordersMeta.value.total || 0) / itemsPerPage.value) || 1
                if (currentPage.value > newTotalPages && newTotalPages > 0) {
                    currentPage.value = newTotalPages
                    return fetchAllOrders()
                }
            }

            return success
        } catch (error: any) {
            if (requestId !== currentRequestId) return false
            console.error('[OrdersTab] Failed to fetch orders:', error)
            toast.error(error.message || t('ordersDashboard.errors.fetchFailed'))
            return false
        } finally {
            if (requestId === currentRequestId) {
                isFetching.value = false
            }
        }
    }

    const debouncedFetch = useDebounceFn(fetchAllOrders, 300)

    const handlePageChange = (page: number) => {
        if (currentPage.value === page || isFetching.value) return
        const maxPage = Math.max(1, totalPages.value)
        const validPage = Math.max(1, Math.min(page, maxPage))
        currentPage.value = validPage
        nextTick(() => fetchAllOrders())
    }

    const handleItemsPerPageChange = (newItemsPerPage: number) => {
        if (itemsPerPage.value === newItemsPerPage || isFetching.value) return
        itemsPerPage.value = newItemsPerPage
        currentPage.value = 1
        nextTick(() => fetchAllOrders())
    }

    const handleSortChange = (
        field: OrderTableSortField | undefined,
        direction: 'asc' | 'desc' | undefined
    ) => {
        if (isFetching.value) return
        sortBy.value = field || undefined
        sortDirection.value = direction
        currentPage.value = 1
        nextTick(() => fetchAllOrders())
    }

    const handleDownload = (orderId: number, orderData: any) => {
        emit('download', orderId, orderData)
    }

    const handleDelete = (orderId: number, orderData: any) => {
        emit('delete', orderId, orderData)
    }

    const handleConfirm = (orderId: number, orderData: any) => {
        emit('confirm', orderId, orderData)
    }

    const handleReject = (orderId: number, orderData: any) => {
        emit('reject', orderId, orderData)
    }

    const handleEdit = (orderId: number, orderData: any) => {
        emit('edit', orderId, orderData)
    }

    const handleRequestFeedback = (orderId: number, orderData: any) => {
        emit('request-feedback', orderId, orderData)
    }

    const handleReset = (orderId: number, orderData: any) => {
        emit('reset', orderId, orderData)
    }

    const handleUpdateStatus = (payload: {
        orderId: number
        statusId?: number
        paymentStatusId?: number
        orderData: any
    }) => {
        emit('update-status', payload)
    }

    watch(
        () => props.filters,
        () => {
            currentPage.value = 1
            debouncedFetch()
        },
        { deep: true, immediate: false }
    )

    watch(
        () => props.refreshKey,
        (newKey, oldKey) => {
            if (newKey !== oldKey) fetchAllOrders()
        }
    )

    watch(
        () => props.viewAs,
        (newViewAs, oldViewAs) => {
            if (newViewAs) {
                fetchAllOrders()
            }
        },
        { immediate: true }
    )

    watch(error, (newError) => {
        if (newError?.message) {
            toast.error(newError.message)
            resetError()
        }
    })

    onMounted(() => {
        nextTick(() => {
            fetchAllOrders()
        })
    })
</script>
