import { useOrderTableDashboardStore } from '~/stores/orderTableDashboard'
import type { OrderTableFilters, OrderTableMeta } from '~/types/orderTableDashboard'

export const useOrderTableDashboard = () => {
    const orderTableStore = useOrderTableDashboardStore()
    const { t } = useI18n()
    const toast = useToastNotification()

    const validateOrderFilters = (
        filters: OrderTableFilters
    ): { isValid: boolean; errors: string[] } => {
        const errors: string[] = []

        if (filters.search) {
            const trimmedSearch = filters.search.trim()
            if (trimmedSearch.length > 0 && trimmedSearch.length < 2) {
                errors.push(t('ordersDashboard.filters.searchTooShort'))
            }
            if (trimmedSearch.length > 255) {
                errors.push(t('ordersDashboard.filters.searchTooLong'))
            }
        }

        if (filters.amount_min !== undefined && filters.amount_min < 0) {
            errors.push(t('ordersDashboard.filters.invalidMinAmount'))
        }

        if (filters.amount_max !== undefined && filters.amount_max < 0) {
            errors.push(t('ordersDashboard.filters.invalidMaxAmount'))
        }

        if (
            filters.amount_min !== undefined &&
            filters.amount_max !== undefined &&
            filters.amount_max < filters.amount_min
        ) {
            errors.push(t('ordersDashboard.filters.invalidAmountRange'))
        }

        if (filters.date_from && filters.date_to) {
            const dateFrom = new Date(filters.date_from)
            const dateTo = new Date(filters.date_to)

            if (isNaN(dateFrom.getTime()) || isNaN(dateTo.getTime())) {
                errors.push(t('ordersDashboard.filters.invalidDates'))
            } else if (dateFrom > dateTo) {
                errors.push(t('ordersDashboard.filters.invalidDateRange'))
            }
        }

        if (filters.page !== undefined && filters.page < 1) {
            errors.push(t('ordersDashboard.filters.invalidPage'))
        }

        if (filters.per_page !== undefined && (filters.per_page < 1 || filters.per_page > 100)) {
            errors.push(t('ordersDashboard.filters.invalidPerPage'))
        }

        return {
            isValid: errors.length === 0,
            errors,
        }
    }
    const mapMetaCountsToTabs = (meta: OrderTableMeta): Record<string, number> => {
        const tabCounts: Record<string, number> = {}

        // Use total_type_documents for "all" tab if available, otherwise fallback to total
        tabCounts.all = meta.total_type_documents ?? meta.total ?? 0

        if (Array.isArray(meta.status_counts)) {
            meta.status_counts.forEach((statusCount) => {
                if (statusCount.code && typeof statusCount.count === 'number') {
                    tabCounts[statusCount.code] = statusCount.count
                }
            })
        }

        if (Array.isArray(meta.payment_status_counts)) {
            meta.payment_status_counts.forEach((paymentCount) => {
                if (paymentCount.code && typeof paymentCount.count === 'number') {
                    tabCounts[`payment_${paymentCount.code}`] = paymentCount.count
                }
            })
        }

        return tabCounts
    }
    const getSupplierOrders = async (
        filters: OrderTableFilters = {},
        tabKey?: string
    ): Promise<boolean> => {
        try {
            const validation = validateOrderFilters(filters)
            if (!validation.isValid) {
                console.error('[useOrderTableDashboard] Validation failed:', validation.errors)
                validation.errors.forEach((error) => toast.error(error))
                return false
            }

            const result = await orderTableStore.fetchSupplierOrders(filters, tabKey)

            return !!result
        } catch (error: any) {
            console.error('[useOrderTableDashboard] getSupplierOrders error:', error)
            const message =
                error.statusCode === 422
                    ? t('ordersDashboard.validationError')
                    : t('ordersDashboard.ordersError')
            toast.error(error.message || message)
            return false
        }
    }

    const getBuyerOrders = async (
        filters: OrderTableFilters = {},
        tabKey?: string
    ): Promise<boolean> => {
        try {
            const validation = validateOrderFilters(filters)
            if (!validation.isValid) {
                console.error('[useOrderTableDashboard] Validation failed:', validation.errors)
                validation.errors.forEach((error) => toast.error(error))
                return false
            }

            const result = await orderTableStore.fetchBuyerOrders(filters, tabKey)

            return !!result
        } catch (error: any) {
            console.error('[useOrderTableDashboard] getBuyerOrders error:', error)
            const message =
                error.statusCode === 422
                    ? t('ordersDashboard.validationError')
                    : t('ordersDashboard.ordersError')
            toast.error(error.message || message)
            return false
        }
    }

    const getSupplierFilters = async (): Promise<boolean> => {
        try {
            const result = await orderTableStore.fetchSupplierFilters()

            return !!result
        } catch (error: any) {
            console.error('[useOrderTableDashboard] getSupplierFilters error:', error)
            toast.error(error.message || t('ordersDashboard.filtersError'))
            return false
        }
    }

    const getBuyerFilters = async (): Promise<boolean> => {
        try {
            const result = await orderTableStore.fetchBuyerFilters()

            return !!result
        } catch (error: any) {
            console.error('[useOrderTableDashboard] getBuyerFilters error:', error)
            toast.error(error.message || t('ordersDashboard.filtersError'))
            return false
        }
    }

    const buildFilters = (
        search?: string,
        type?: 'order' | 'offer' | 'delivery_note' | 'invoice' | 'correction_invoice',
        statusIds?: number[],
        paymentStatusIds?: number[],
        currencyIds?: number[],
        amountRange?: { min?: number; max?: number },
        dateRange?: { from?: string; to?: string },
        pagination?: { page: number; perPage: number },
        sort?: { sortBy: string; sortOrder: 'asc' | 'desc' }
    ): OrderTableFilters => {
        return {
            ...(search?.trim() && { search: search.trim() }),
            ...(type && { type }),
            ...(statusIds?.length && { status_ids: statusIds }),
            ...(paymentStatusIds?.length && { payment_status_ids: paymentStatusIds }),
            ...(currencyIds?.length && { currency_ids: currencyIds }),
            ...(amountRange?.min !== undefined && { amount_min: amountRange.min }),
            ...(amountRange?.max !== undefined && { amount_max: amountRange.max }),
            ...(dateRange?.from && { date_from: dateRange.from }),
            ...(dateRange?.to && { date_to: dateRange.to }),
            ...(pagination && {
                page: pagination.page,
                per_page: pagination.perPage,
            }),
            ...(sort && {
                sort_by: sort.sortBy,
                sort_order: sort.sortOrder,
            }),
        }
    }

    const formatOrderStatus = (status: string): string => {
        const statusMap: Record<string, string> = {
            draft: t('ordersDashboard.status.draft'),
            sent: t('ordersDashboard.status.sent'),
            not_delivered: t('ordersDashboard.status.notDelivered'),
            delivered: t('ordersDashboard.status.delivered'),
            accepted: t('ordersDashboard.status.accepted'),
            rejected: t('ordersDashboard.status.rejected'),
            cancelled: t('ordersDashboard.status.cancelled'),
            completed: t('ordersDashboard.status.completed'),
            pending: t('ordersDashboard.status.pending'),
            approved: t('ordersDashboard.status.approved'),
            declined: t('ordersDashboard.status.declined'),
            incoming: t('ordersDashboard.status.incoming'),
        }

        return (
            statusMap[status] || status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
        )
    }

    const formatPaymentStatus = (status: string): string => {
        const paymentStatusMap: Record<string, string> = {
            unpaid: t('ordersDashboard.paymentStatus.unpaid'),
            partially_paid: t('ordersDashboard.paymentStatus.partiallyPaid'),
            paid: t('ordersDashboard.paymentStatus.paid'),
            overdue: t('ordersDashboard.paymentStatus.overdue'),
            pending: t('ordersDashboard.paymentStatus.pending'),
            cancelled: t('ordersDashboard.paymentStatus.cancelled'),
            refunded: t('ordersDashboard.paymentStatus.refunded'),
        }

        return (
            paymentStatusMap[status] ||
            status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
        )
    }

    const formatCurrency = (amount: number, currencySymbol: string): string => {
        return (
            new Intl.NumberFormat('en-US', {
                style: 'decimal',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(amount) +
            ' ' +
            currencySymbol
        )
    }

    const isOrderPending = (order: any): boolean => {
        return ['pending', 'submitted', 'received'].includes(order?.status?.code)
    }

    const isOrderApproved = (order: any): boolean => {
        return ['approved', 'confirmed', 'accepted'].includes(order?.status?.code)
    }

    const isOrderDelivered = (order: any): boolean => {
        return ['delivered', 'completed', 'fulfilled'].includes(order?.status?.code)
    }

    const isOrderDeclined = (order: any): boolean => {
        return ['declined', 'rejected', 'cancelled_by_supplier'].includes(order?.status?.code)
    }

    const isPaymentPaid = (order: any): boolean => {
        return ['paid', 'completed'].includes(order?.payment_status?.code)
    }

    const isPaymentUnpaid = (order: any): boolean => {
        return ['unpaid', 'pending', 'awaiting_payment'].includes(order?.payment_status?.code)
    }

    const updateOrderStatus = (orderId: number, statusCode: string): void => {
        const availableStatuses = orderTableStore.filterOptions?.statuses || []
        const status = availableStatuses.find((s) => s.code === statusCode)
        if (status) {
            orderTableStore.updateOrder(orderId, { status })
        }
    }

    const updatePaymentStatus = (orderId: number, paymentStatusCode: string): void => {
        const availablePaymentStatuses = orderTableStore.filterOptions?.payment_statuses || []
        const paymentStatus = availablePaymentStatuses.find((s) => s.code === paymentStatusCode)
        if (paymentStatus) {
            orderTableStore.updateOrder(orderId, { payment_status: paymentStatus })
        }
    }

    const canLoadMore = computed(() => {
        const meta = orderTableStore.ordersMeta
        return meta ? meta.current_page < meta.last_page : false
    })

    const getOrdersCount = computed(() => {
        return orderTableStore.totalOrders
    })

    const totalTypeDocuments = computed(() => {
        return orderTableStore.totalTypeDocuments
    })

    return {
        // State
        isLoading: computed(() => orderTableStore.isLoading),
        error: computed(() => orderTableStore.error),
        orders: computed(() => orderTableStore.orders),
        ordersMeta: computed(() => orderTableStore.ordersMeta),
        filterOptions: computed(() => orderTableStore.filterOptions),
        totalOrders: computed(() => orderTableStore.totalOrders),
        totalTypeDocuments,
        currentPage: computed(() => orderTableStore.currentPage),
        totalPages: computed(() => orderTableStore.totalPages),
        hasOrders: computed(() => orderTableStore.hasOrders),
        statusCounts: computed(() => orderTableStore.statusCounts),
        paymentStatusCounts: computed(() => orderTableStore.paymentStatusCounts),
        appliedFilters: computed(() => orderTableStore.appliedFilters),
        viewAs: computed(() => orderTableStore.viewAs),
        isSupplierView: computed(() => orderTableStore.isSupplierView),
        isBuyerView: computed(() => orderTableStore.isBuyerView),
        getActiveFilters: computed(() => orderTableStore.getActiveFilters),
        triggerRefresh: computed(() => orderTableStore.ordersListRefreshKey),
        // Computed
        canLoadMore,
        getOrdersCount,

        // Methods
        getSupplierOrders,
        getBuyerOrders,
        getSupplierFilters,
        getBuyerFilters,
        buildFilters,
        formatOrderStatus,
        formatPaymentStatus,
        formatCurrency,
        isOrderPending,
        isOrderApproved,
        isOrderDelivered,
        isOrderDeclined,
        isPaymentPaid,
        isPaymentUnpaid,
        updateOrderStatus,
        updatePaymentStatus,
        validateOrderFilters,
        mapMetaCountsToTabs,

        // Store actions
        clearOrders: orderTableStore.clearOrders,
        clearFilters: orderTableStore.clearFilters,
        clearCache: orderTableStore.clearCache,
        refresh: orderTableStore.refresh,
        resetError: orderTableStore.resetError,
        clearError: orderTableStore.resetError, // Alias for backward compatibility
    }
}
