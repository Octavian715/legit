import { storeToRefs } from 'pinia'
import { useOrdersDashboardStore } from '~/stores/ordersDashboard'
import type { OrdersChartFilters, PeriodType } from '~/types/ordersDashboard'

export const useOrdersDashboard = () => {
    const store = useOrdersDashboardStore()

    // Destructure all state and computed from store
    const {
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

        // Computed properties
        hasBuyerData,
        hasSupplierData,
        totalBuyerOrders,
        totalSupplierOrders,
        totalSupplierOrdersTimeline,
        buyerSpentTotal,
        supplierAverageCart,
    } = storeToRefs(store)

    /**
     * Convert camelCase period to snake_case for API
     */
    const convertPeriodToSnakeCase = (period: string): string => {
        return period.replace(/([A-Z])/g, '_$1').toLowerCase()
    }

    /**
     * Build chart filters from period and date range
     */
    const buildChartFilters = (
        period?: PeriodType,
        dateRange?: { start_date: string; end_date: string }
    ): OrdersChartFilters => {
        const filters: OrdersChartFilters = {}

        // Only include period if it's defined and no custom date range
        if (period && !dateRange) {
            filters.period = convertPeriodToSnakeCase(period) as OrdersChartFilters['period']
        }

        if (dateRange) {
            filters.start_date = dateRange.start_date
            filters.end_date = dateRange.end_date
        }

        return filters
    }

    /**
     * Format currency amount
     */
    const formatCurrency = (amount: number, currency: string = 'MDL'): string => {
        return new Intl.NumberFormat('ro-MD', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount)
    }

    // Buyer load functions (wrappers around store fetch functions)
    const loadBuyerOrdersChart = async (filters: OrdersChartFilters = {}) => {
        return await store.fetchBuyerOrdersChart(filters)
    }

    const loadBuyerOrdersStats = async () => {
        return await store.fetchBuyerOrdersStats()
    }

    const loadBuyerSpentCategoryChart = async (filters: OrdersChartFilters = {}) => {
        return await store.fetchBuyerSpentCategoryChart(filters)
    }

    const loadBuyerSpentCategoryTable = async (filters = {}) => {
        return await store.fetchBuyerSpentCategoryTable(filters)
    }

    const loadBuyerSpentCategoryFilters = async () => {
        return await store.fetchBuyerSpentCategoryFilters()
    }

    const loadBuyerSpentSupplierChart = async (filters: OrdersChartFilters = {}) => {
        return await store.fetchBuyerSpentSupplierChart(filters)
    }

    const loadBuyerSpentSupplierTable = async (filters = {}) => {
        return await store.fetchBuyerSpentSupplierTable(filters)
    }

    const loadBuyerSpentSupplierFilters = async () => {
        return await store.fetchBuyerSpentSupplierFilters()
    }

    // Supplier load functions (wrappers around store fetch functions)
    const loadSupplierOrdersChart = async (filters: OrdersChartFilters = {}) => {
        return await store.fetchSupplierOrdersChart(filters)
    }

    const loadSupplierOrdersTimelineChart = async (filters: OrdersChartFilters = {}) => {
        return await store.fetchSupplierOrdersTimelineChart(filters)
    }

    const loadSupplierOrdersStats = async () => {
        return await store.fetchSupplierOrdersStats()
    }

    const loadSupplierOrdersByCountryChart = async (filters: OrdersChartFilters = {}) => {
        return await store.fetchSupplierOrdersByCountryChart(filters)
    }

    const loadSupplierOrdersByCountryTable = async (filters = {}) => {
        return await store.fetchSupplierOrdersByCountryTable(filters)
    }

    const loadSupplierOrdersByCountryFilters = async () => {
        return await store.fetchSupplierOrdersByCountryFilters()
    }

    const loadSupplierAverageCartChart = async (filters: OrdersChartFilters = {}) => {
        return await store.fetchSupplierAverageCartChart(filters)
    }

    return {
        // State
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

        // Computed
        hasBuyerData,
        hasSupplierData,
        totalBuyerOrders,
        totalSupplierOrders,
        totalSupplierOrdersTimeline,
        buyerSpentTotal,
        supplierAverageCart,

        // Buyer load functions
        loadBuyerOrdersChart,
        loadBuyerOrdersStats,
        loadBuyerSpentCategoryChart,
        loadBuyerSpentCategoryTable,
        loadBuyerSpentCategoryFilters,
        loadBuyerSpentSupplierChart,
        loadBuyerSpentSupplierTable,
        loadBuyerSpentSupplierFilters,

        // Supplier load functions
        loadSupplierOrdersChart,
        loadSupplierOrdersTimelineChart,
        loadSupplierOrdersStats,
        loadSupplierOrdersByCountryChart,
        loadSupplierOrdersByCountryTable,
        loadSupplierOrdersByCountryFilters,
        loadSupplierAverageCartChart,

        // Utility functions
        buildChartFilters,
        formatCurrency,

        // Store actions (if needed directly)
        resetError: store.resetError,
    }
}
