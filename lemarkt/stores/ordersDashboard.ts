import { defineStore, acceptHMRUpdate } from 'pinia'
import { OrdersDashboardService } from '~/services/ordersDashboard'
import type {
    BuyerOrdersChart,
    SupplierOrdersChart,
    BuyerSpentCategoryChart,
    BuyerSpentSupplierChart,
    SupplierOrdersByCountryChart,
    SupplierAverageCartChart,
    OrderStats,
    CategoryTableItem,
    SupplierTableItem,
    CountryTableItem,
    CategoryFilterOptions,
    SupplierFilterOptions,
    CountryFilterOptions,
    TableResponse,
    OrdersChartFilters,
    OrdersTableFilters,
    OrdersApiError,
} from '~/types/ordersDashboard'

export const useOrdersDashboardStore = defineStore('ordersDashboard', () => {
    const ordersDashboardService = new OrdersDashboardService()

    // Buyer state
    const buyerOrdersChart = ref<BuyerOrdersChart | null>(null)
    const buyerOrdersStats = ref<OrderStats[]>([])
    const buyerSpentCategoryChart = ref<BuyerSpentCategoryChart | null>(null)
    const buyerSpentCategoryTable = ref<CategoryTableItem[]>([])
    const buyerSpentCategoryMeta = ref<TableResponse<CategoryTableItem>['meta'] | null>(null)
    const buyerSpentCategoryFilters = ref<CategoryFilterOptions | null>(null)
    const buyerSpentSupplierChart = ref<BuyerSpentSupplierChart | null>(null)
    const buyerSpentSupplierTable = ref<SupplierTableItem[]>([])
    const buyerSpentSupplierMeta = ref<TableResponse<SupplierTableItem>['meta'] | null>(null)
    const buyerSpentSupplierFilters = ref<SupplierFilterOptions | null>(null)

    // Supplier state
    const supplierOrdersChart = ref<SupplierOrdersChart | null>(null)
    const supplierOrdersTimelineChart = ref<SupplierOrdersChart | null>(null)
    const supplierOrdersStats = ref<OrderStats[]>([])
    const supplierOrdersByCountryChart = ref<SupplierOrdersByCountryChart | null>(null)
    const supplierOrdersByCountryTable = ref<CountryTableItem[]>([])
    const supplierOrdersByCountryMeta = ref<TableResponse<CountryTableItem>['meta'] | null>(null)
    const supplierOrdersByCountryFilters = ref<CountryFilterOptions | null>(null)
    const supplierAverageCartChart = ref<SupplierAverageCartChart | null>(null)

    // Loading states
    const isLoading = ref<boolean>(false)
    const isBuyerLoading = ref<boolean>(false)
    const isSupplierLoading = ref<boolean>(false)

    // Error state
    const error = ref<OrdersApiError | null>(null)

    // Current filters for caching
    const currentChartFilters = ref<OrdersChartFilters>({})
    const currentTableFilters = ref<OrdersTableFilters>({})

    // Computed properties
    const hasBuyerData = computed<boolean>(() => {
        return (
            !!buyerOrdersChart.value ||
            !!buyerSpentCategoryChart.value ||
            !!buyerSpentSupplierChart.value ||
            buyerOrdersStats.value.length > 0
        )
    })

    const hasSupplierData = computed<boolean>(() => {
        return (
            !!supplierOrdersChart.value ||
            !!supplierOrdersByCountryChart.value ||
            !!supplierAverageCartChart.value ||
            supplierOrdersStats.value.length > 0
        )
    })

    const totalBuyerOrders = computed<number>(() => {
        return buyerOrdersChart.value?.total || 0
    })

    const totalSupplierOrders = computed<number>(() => {
        return supplierOrdersChart.value?.total || 0
    })

    const totalSupplierOrdersTimeline = computed<number>(() => {
        return supplierOrdersTimelineChart.value?.total || 0
    })

    const buyerSpentTotal = computed<number>(() => {
        return buyerSpentCategoryChart.value?.total || buyerSpentSupplierChart.value?.total || 0
    })

    const supplierAverageCart = computed<number>(() => {
        return supplierAverageCartChart.value?.average_cart || 0
    })

    // Utility actions
    const resetError = (): void => {
        error.value = null
    }

    const handleError = (e: any): void => {
        const apiError: OrdersApiError = {
            message: e.data?.message || e.message || 'An error occurred',
            errors: e.data?.errors,
            statusCode: e.statusCode || 500,
        }
        error.value = apiError
        console.error('Orders dashboard error:', apiError)
        throw apiError
    }

    // Buyer actions
    const fetchBuyerOrdersChart = async (
        filters: OrdersChartFilters = {}
    ): Promise<BuyerOrdersChart | null> => {
        if (isBuyerLoading.value) return buyerOrdersChart.value

        isBuyerLoading.value = true
        resetError()

        try {
            buyerOrdersChart.value = await ordersDashboardService.fetchBuyerOrdersChart(filters)
            currentChartFilters.value = { ...filters }
            return buyerOrdersChart.value
        } catch (e) {
            handleError(e)
            buyerOrdersChart.value = null
            return null
        } finally {
            isBuyerLoading.value = false
        }
    }

    const fetchBuyerOrdersStats = async (): Promise<OrderStats[]> => {
        // if (isBuyerLoading.value) return buyerOrdersStats.value

        isBuyerLoading.value = true
        resetError()

        try {
            buyerOrdersStats.value = await ordersDashboardService.fetchBuyerOrdersStats()
            return buyerOrdersStats.value
        } catch (e) {
            handleError(e)
            buyerOrdersStats.value = []
            return []
        } finally {
            isBuyerLoading.value = false
        }
    }

    const fetchBuyerSpentCategoryChart = async (
        filters: OrdersChartFilters = {}
    ): Promise<BuyerSpentCategoryChart | null> => {
        if (isBuyerLoading.value) return buyerSpentCategoryChart.value

        isBuyerLoading.value = true
        resetError()

        try {
            buyerSpentCategoryChart.value =
                await ordersDashboardService.fetchBuyerSpentCategoryChart(filters)
            return buyerSpentCategoryChart.value
        } catch (e) {
            handleError(e)
            buyerSpentCategoryChart.value = null
            return null
        } finally {
            isBuyerLoading.value = false
        }
    }

    const fetchBuyerSpentCategoryTable = async (
        filters: OrdersTableFilters = {}
    ): Promise<TableResponse<CategoryTableItem> | null> => {
        if (isBuyerLoading.value) return null

        isBuyerLoading.value = true
        resetError()

        try {
            const response = await ordersDashboardService.fetchBuyerSpentCategoryTable(filters)
            buyerSpentCategoryTable.value = response.data
            buyerSpentCategoryMeta.value = response.meta
            currentTableFilters.value = { ...filters }
            return response
        } catch (e) {
            handleError(e)
            buyerSpentCategoryTable.value = []
            buyerSpentCategoryMeta.value = null
            return null
        } finally {
            isBuyerLoading.value = false
        }
    }

    const fetchBuyerSpentCategoryFilters = async (): Promise<CategoryFilterOptions | null> => {
        if (isLoading.value) return buyerSpentCategoryFilters.value

        isLoading.value = true
        resetError()

        try {
            buyerSpentCategoryFilters.value =
                await ordersDashboardService.fetchBuyerSpentCategoryFilters()
            return buyerSpentCategoryFilters.value
        } catch (e) {
            handleError(e)
            buyerSpentCategoryFilters.value = null
            return null
        } finally {
            isLoading.value = false
        }
    }

    const fetchBuyerSpentSupplierChart = async (
        filters: OrdersChartFilters = {}
    ): Promise<BuyerSpentSupplierChart | null> => {
        if (isBuyerLoading.value) return buyerSpentSupplierChart.value

        isBuyerLoading.value = true
        resetError()

        try {
            buyerSpentSupplierChart.value =
                await ordersDashboardService.fetchBuyerSpentSupplierChart(filters)
            return buyerSpentSupplierChart.value
        } catch (e) {
            handleError(e)
            buyerSpentSupplierChart.value = null
            return null
        } finally {
            isBuyerLoading.value = false
        }
    }

    const fetchBuyerSpentSupplierTable = async (
        filters: OrdersTableFilters = {}
    ): Promise<TableResponse<SupplierTableItem> | null> => {
        if (isBuyerLoading.value) return null

        isBuyerLoading.value = true
        resetError()

        try {
            const response = await ordersDashboardService.fetchBuyerSpentSupplierTable(filters)
            buyerSpentSupplierTable.value = response.data
            buyerSpentSupplierMeta.value = response.meta
            return response
        } catch (e) {
            handleError(e)
            buyerSpentSupplierTable.value = []
            buyerSpentSupplierMeta.value = null
            return null
        } finally {
            isBuyerLoading.value = false
        }
    }

    const fetchBuyerSpentSupplierFilters = async (): Promise<SupplierFilterOptions | null> => {
        if (isLoading.value) return buyerSpentSupplierFilters.value

        isLoading.value = true
        resetError()

        try {
            buyerSpentSupplierFilters.value =
                await ordersDashboardService.fetchBuyerSpentSupplierFilters()
            return buyerSpentSupplierFilters.value
        } catch (e) {
            handleError(e)
            buyerSpentSupplierFilters.value = null
            return null
        } finally {
            isLoading.value = false
        }
    }

    // Supplier actions
    const fetchSupplierOrdersChart = async (
        filters: OrdersChartFilters = {}
    ): Promise<SupplierOrdersChart | null> => {
        isSupplierLoading.value = true
        resetError()

        try {
            supplierOrdersChart.value =
                await ordersDashboardService.fetchSupplierOrdersChart(filters)
            currentChartFilters.value = { ...filters }
            return supplierOrdersChart.value
        } catch (e) {
            handleError(e)
            supplierOrdersChart.value = null
            return null
        } finally {
            isSupplierLoading.value = false
        }
    }

    const fetchSupplierOrdersTimelineChart = async (
        filters: OrdersChartFilters = {}
    ): Promise<SupplierOrdersChart | null> => {
        isSupplierLoading.value = true
        resetError()

        try {
            supplierOrdersTimelineChart.value =
                await ordersDashboardService.fetchSupplierOrdersChart(filters)
            return supplierOrdersTimelineChart.value
        } catch (e) {
            handleError(e)
            supplierOrdersTimelineChart.value = null
            return null
        } finally {
            isSupplierLoading.value = false
        }
    }

    const fetchSupplierOrdersStats = async (): Promise<OrderStats[]> => {
        // if (isSupplierLoading.value) return supplierOrdersStats.value

        isSupplierLoading.value = true
        resetError()

        try {
            supplierOrdersStats.value = await ordersDashboardService.fetchSupplierOrdersStats()
            return supplierOrdersStats.value
        } catch (e) {
            handleError(e)
            supplierOrdersStats.value = []
            return []
        } finally {
            isSupplierLoading.value = false
        }
    }

    const fetchSupplierOrdersByCountryChart = async (
        filters: OrdersChartFilters = {}
    ): Promise<SupplierOrdersByCountryChart | null> => {
        if (isSupplierLoading.value) return supplierOrdersByCountryChart.value

        isSupplierLoading.value = true
        resetError()

        try {
            supplierOrdersByCountryChart.value =
                await ordersDashboardService.fetchSupplierOrdersByCountryChart(filters)
            return supplierOrdersByCountryChart.value
        } catch (e) {
            handleError(e)
            supplierOrdersByCountryChart.value = null
            return null
        } finally {
            isSupplierLoading.value = false
        }
    }

    const fetchSupplierOrdersByCountryTable = async (
        filters: OrdersTableFilters = {}
    ): Promise<TableResponse<CountryTableItem> | null> => {
        if (isSupplierLoading.value) return null

        isSupplierLoading.value = true
        resetError()

        try {
            const response = await ordersDashboardService.fetchSupplierOrdersByCountryTable(filters)
            supplierOrdersByCountryTable.value = response.data
            supplierOrdersByCountryMeta.value = response.meta
            return response
        } catch (e) {
            handleError(e)
            supplierOrdersByCountryTable.value = []
            supplierOrdersByCountryMeta.value = null
            return null
        } finally {
            isSupplierLoading.value = false
        }
    }

    const fetchSupplierOrdersByCountryFilters = async (): Promise<CountryFilterOptions | null> => {
        if (isLoading.value) return supplierOrdersByCountryFilters.value

        isLoading.value = true
        resetError()

        try {
            supplierOrdersByCountryFilters.value =
                await ordersDashboardService.fetchSupplierOrdersByCountryFilters()
            return supplierOrdersByCountryFilters.value
        } catch (e) {
            handleError(e)
            supplierOrdersByCountryFilters.value = null
            return null
        } finally {
            isLoading.value = false
        }
    }

    const fetchSupplierAverageCartChart = async (
        filters: OrdersChartFilters = {}
    ): Promise<SupplierAverageCartChart | null> => {
        if (isSupplierLoading.value) return supplierAverageCartChart.value

        isSupplierLoading.value = true
        resetError()

        try {
            supplierAverageCartChart.value =
                await ordersDashboardService.fetchSupplierAverageCartChart(filters)
            return supplierAverageCartChart.value
        } catch (e) {
            handleError(e)
            supplierAverageCartChart.value = null
            return null
        } finally {
            isSupplierLoading.value = false
        }
    }

    // Clear actions
    const clearBuyerData = (): void => {
        buyerOrdersChart.value = null
        buyerOrdersStats.value = []
        buyerSpentCategoryChart.value = null
        buyerSpentCategoryTable.value = []
        buyerSpentCategoryMeta.value = null
        buyerSpentSupplierChart.value = null
        buyerSpentSupplierTable.value = []
        buyerSpentSupplierMeta.value = null
    }

    const clearSupplierData = (): void => {
        supplierOrdersChart.value = null
        supplierOrdersTimelineChart.value = null
        supplierOrdersStats.value = []
        supplierOrdersByCountryChart.value = null
        supplierOrdersByCountryTable.value = []
        supplierOrdersByCountryMeta.value = null
        supplierAverageCartChart.value = null
    }

    const clearFilters = (): void => {
        buyerSpentCategoryFilters.value = null
        buyerSpentSupplierFilters.value = null
        supplierOrdersByCountryFilters.value = null
        currentChartFilters.value = {}
        currentTableFilters.value = {}
    }

    const clearCache = (): void => {
        clearBuyerData()
        clearSupplierData()
        clearFilters()
        resetError()
    }

    return {
        // Buyer state
        buyerOrdersChart,
        buyerOrdersStats,
        buyerSpentCategoryChart,
        buyerSpentCategoryTable,
        buyerSpentCategoryMeta,
        buyerSpentCategoryFilters,
        buyerSpentSupplierChart,
        buyerSpentSupplierTable,
        buyerSpentSupplierMeta,
        buyerSpentSupplierFilters,

        // Supplier state
        supplierOrdersChart,
        supplierOrdersTimelineChart,
        supplierOrdersStats,
        supplierOrdersByCountryChart,
        supplierOrdersByCountryTable,
        supplierOrdersByCountryMeta,
        supplierOrdersByCountryFilters,
        supplierAverageCartChart,

        // Loading states
        isLoading,
        isBuyerLoading,
        isSupplierLoading,

        // Error state
        error,

        // Current filters
        currentChartFilters,
        currentTableFilters,

        // Computed
        hasBuyerData,
        hasSupplierData,
        totalBuyerOrders,
        totalSupplierOrders,
        totalSupplierOrdersTimeline,
        buyerSpentTotal,
        supplierAverageCart,

        // Buyer actions
        fetchBuyerOrdersChart,
        fetchBuyerOrdersStats,
        fetchBuyerSpentCategoryChart,
        fetchBuyerSpentCategoryTable,
        fetchBuyerSpentCategoryFilters,
        fetchBuyerSpentSupplierChart,
        fetchBuyerSpentSupplierTable,
        fetchBuyerSpentSupplierFilters,

        // Supplier actions
        fetchSupplierOrdersChart,
        fetchSupplierOrdersTimelineChart,
        fetchSupplierOrdersStats,
        fetchSupplierOrdersByCountryChart,
        fetchSupplierOrdersByCountryTable,
        fetchSupplierOrdersByCountryFilters,
        fetchSupplierAverageCartChart,

        // Clear actions
        clearBuyerData,
        clearSupplierData,
        clearFilters,
        clearCache,
        resetError,
    }
})

if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useOrdersDashboardStore, import.meta.hot))
}
