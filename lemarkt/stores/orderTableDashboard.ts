import { defineStore, acceptHMRUpdate } from 'pinia'
import { OrderTableDashboardService } from '~/services/orderTableDashboard'
import type {
    OrderTableData,
    OrderTableListResponse,
    OrderTableFilters,
    OrderTableFilterOptions,
    OrderTableMeta,
    ApiError,
} from '~/types/orderTableDashboard'

export const useOrderTableDashboardStore = defineStore('orderTableDashboard', () => {
    const orderTableService = new OrderTableDashboardService()

    const ordersListRefreshKey = ref(0)
    const orders = ref<OrderTableData[]>([])
    const ordersMeta = ref<OrderTableMeta | null>(null)
    const filterOptions = ref<OrderTableFilterOptions | null>(null)

    const isLoading = ref<boolean>(false)
    const error = ref<ApiError | null>(null)

    const lastFetchedFilters = ref<OrderTableFilters>({})
    const lastFetchedTabKey = ref<string | null>(null)
    const currentViewAs = ref<'supplier' | 'buyer' | null>(null)

    const totalOrders = computed<number>(() => {
        return ordersMeta.value?.total || 0
    })

    const currentPage = computed<number>(() => {
        return ordersMeta.value?.current_page || 1
    })

    const totalPages = computed<number>(() => {
        return ordersMeta.value?.last_page || 1
    })

    const hasOrders = computed<boolean>(() => {
        return Array.isArray(orders.value) && orders.value.length > 0
    })

    const statusCounts = computed<Record<string, number>>(() => {
        if (!ordersMeta.value?.status_counts) return {}
        return ordersMeta.value.status_counts.reduce(
            (acc, status) => {
                acc[status.code] = status.count
                return acc
            },
            {} as Record<string, number>
        )
    })

    const paymentStatusCounts = computed<Record<string, number>>(() => {
        if (!ordersMeta.value?.payment_status_counts) return {}
        return ordersMeta.value.payment_status_counts.reduce(
            (acc, status) => {
                acc[status.code] = status.count
                return acc
            },
            {} as Record<string, number>
        )
    })

    const appliedFilters = computed(() => ordersMeta.value?.applied_filters)

    const viewAs = computed<'supplier' | 'buyer' | null>(() => {
        return ordersMeta.value?.view_as || currentViewAs.value
    })

    const isSupplierView = computed<boolean>(() => {
        return viewAs.value === 'supplier'
    })

    const isBuyerView = computed<boolean>(() => {
        return viewAs.value === 'buyer'
    })

    const getOrderById = computed(() => {
        return (orderId: number) => {
            if (!Array.isArray(orders.value)) return undefined
            return orders.value.find((order) => order.id === orderId)
        }
    })

    const resetError = (): void => {
        error.value = null
    }

    const handleError = (e: any): void => {
        const apiError: ApiError = {
            message: e.data?.message || e.message || 'An error occurred',
            errors: e.data?.errors,
            statusCode: e.statusCode || 500,
            code: e.code,
        }
        error.value = apiError
        console.error('Order table error:', apiError)
        throw apiError
    }

    const fetchSupplierOrders = async (
        filters: OrderTableFilters = {},
        tabKey?: string
    ): Promise<OrderTableListResponse | undefined> => {
        if (isLoading.value) return

        isLoading.value = true
        resetError()

        try {
            const cleanFilters: OrderTableFilters = {}

            if (filters.search?.trim()) cleanFilters.search = filters.search.trim()
            if (filters.type) cleanFilters.type = filters.type
            if (filters.status_ids?.length) cleanFilters.status_ids = filters.status_ids
            if (filters.payment_status_ids?.length)
                cleanFilters.payment_status_ids = filters.payment_status_ids
            if (filters.currency_ids?.length) cleanFilters.currency_ids = filters.currency_ids
            if (filters.amount_min !== undefined) cleanFilters.amount_min = filters.amount_min
            if (filters.amount_max !== undefined) cleanFilters.amount_max = filters.amount_max
            if (filters.date_from) cleanFilters.date_from = filters.date_from
            if (filters.date_to) cleanFilters.date_to = filters.date_to
            if (filters.page && filters.page > 0) cleanFilters.page = filters.page
            if (filters.per_page && filters.per_page > 0) cleanFilters.per_page = filters.per_page
            if (filters.sort_by) cleanFilters.sort_by = filters.sort_by
            if (filters.sort_order) cleanFilters.sort_order = filters.sort_order

            const response = await orderTableService.fetchSupplierOrders(cleanFilters, tabKey)

            orders.value = Array.isArray(response.data) ? response.data : []
            ordersMeta.value = response.meta
            lastFetchedFilters.value = cleanFilters
            lastFetchedTabKey.value = tabKey || null
            currentViewAs.value = 'supplier'

            return response
        } catch (e) {
            handleError(e)
            orders.value = []
            ordersMeta.value = null
            return undefined
        } finally {
            isLoading.value = false
        }
    }

    const fetchBuyerOrders = async (
        filters: OrderTableFilters = {},
        tabKey?: string
    ): Promise<OrderTableListResponse | undefined> => {
        if (isLoading.value) return

        isLoading.value = true
        resetError()

        try {
            const cleanFilters: OrderTableFilters = {}

            if (filters.search?.trim()) cleanFilters.search = filters.search.trim()
            if (filters.type) cleanFilters.type = filters.type
            if (filters.status_ids?.length) cleanFilters.status_ids = filters.status_ids
            if (filters.payment_status_ids?.length)
                cleanFilters.payment_status_ids = filters.payment_status_ids
            if (filters.currency_ids?.length) cleanFilters.currency_ids = filters.currency_ids
            if (filters.amount_min !== undefined) cleanFilters.amount_min = filters.amount_min
            if (filters.amount_max !== undefined) cleanFilters.amount_max = filters.amount_max
            if (filters.date_from) cleanFilters.date_from = filters.date_from
            if (filters.date_to) cleanFilters.date_to = filters.date_to
            if (filters.page && filters.page > 0) cleanFilters.page = filters.page
            if (filters.per_page && filters.per_page > 0) cleanFilters.per_page = filters.per_page
            if (filters.sort_by) cleanFilters.sort_by = filters.sort_by
            if (filters.sort_order) cleanFilters.sort_order = filters.sort_order

            const response = await orderTableService.fetchBuyerOrders(cleanFilters, tabKey)

            orders.value = Array.isArray(response.data) ? response.data : []
            ordersMeta.value = response.meta
            lastFetchedFilters.value = cleanFilters
            lastFetchedTabKey.value = tabKey || null
            currentViewAs.value = 'buyer'

            return response
        } catch (e) {
            handleError(e)
            orders.value = []
            ordersMeta.value = null
            return undefined
        } finally {
            isLoading.value = false
        }
    }

    const fetchSupplierFilters = async (): Promise<OrderTableFilterOptions | null> => {
        if (isLoading.value) return filterOptions.value

        isLoading.value = true
        resetError()

        try {
            const response = await orderTableService.fetchSupplierFilters()
            filterOptions.value = response
            return filterOptions.value
        } catch (e) {
            handleError(e)
            filterOptions.value = null
            return null
        } finally {
            isLoading.value = false
        }
    }

    const fetchBuyerFilters = async (): Promise<OrderTableFilterOptions | null> => {
        if (isLoading.value) return filterOptions.value

        isLoading.value = true
        resetError()

        try {
            const response = await orderTableService.fetchBuyerFilters()
            filterOptions.value = response
            return filterOptions.value
        } catch (e) {
            handleError(e)
            filterOptions.value = null
            return null
        } finally {
            isLoading.value = false
        }
    }

    const updateOrder = (orderId: number, updates: Partial<OrderTableData>): void => {
        const index = orders.value.findIndex((order) => order.id === orderId)
        if (index !== -1) {
            orders.value[index] = { ...orders.value[index], ...updates }
        }
    }

    const removeOrder = (orderId: number): void => {
        orders.value = orders.value.filter((order) => order.id !== orderId)
        if (ordersMeta.value) {
            ordersMeta.value.total = Math.max(0, ordersMeta.value.total - 1)
        }
    }

    const clearOrders = (): void => {
        orders.value = []
        ordersMeta.value = null
    }

    const clearFilters = (): void => {
        filterOptions.value = null
        lastFetchedFilters.value = {}
        lastFetchedTabKey.value = null
    }

    const clearCache = (): void => {
        clearOrders()
        clearFilters()
        currentViewAs.value = null
    }

    const refresh = async (): Promise<void> => {
        if (!Object.keys(lastFetchedFilters.value).length) return

        if (currentViewAs.value === 'supplier') {
            await fetchSupplierOrders(
                lastFetchedFilters.value,
                lastFetchedTabKey.value || undefined
            )
        } else if (currentViewAs.value === 'buyer') {
            await fetchBuyerOrders(lastFetchedFilters.value, lastFetchedTabKey.value || undefined)
        }
    }

    const getActiveFilters = computed((): number => {
        const filters = { ...lastFetchedFilters.value }

        delete filters.page
        delete filters.per_page
        delete filters.sort_by
        delete filters.sort_order

        return Object.keys(filters).filter((key) => {
            const value = filters[key as keyof OrderTableFilters]
            return (
                value !== undefined &&
                value !== null &&
                value !== '' &&
                !(Array.isArray(value) && value.length === 0)
            )
        }).length
    })

    return {
        // State
        ordersListRefreshKey,
        orders: computed(() => (Array.isArray(orders.value) ? orders.value : [])),
        ordersMeta,
        filterOptions,
        isLoading,
        error,
        lastFetchedFilters,
        lastFetchedTabKey,
        currentViewAs,

        // Computed
        totalOrders,
        currentPage,
        totalPages,
        hasOrders,
        statusCounts,
        paymentStatusCounts,
        appliedFilters,
        viewAs,
        isSupplierView,
        isBuyerView,
        getOrderById,
        getActiveFilters,

        // Actions
        fetchSupplierOrders,
        fetchBuyerOrders,
        fetchSupplierFilters,
        fetchBuyerFilters,
        updateOrder,
        removeOrder,
        clearOrders,
        clearFilters,
        clearCache,
        refresh,
        resetError,
    }
})

if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useOrderTableDashboardStore, import.meta.hot))
}
