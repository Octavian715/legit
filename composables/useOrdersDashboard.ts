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
        totalSupplierOrdersByCountry,
        buyerSpentTotal,
        supplierAverageCart,
    } = storeToRefs(store)

    /**
     * Build chart filters from period and date range
     */
    const buildChartFilters = (
        period: PeriodType,
        dateRange?: { start: string; end: string }
    ): OrdersChartFilters => {
        const filters: OrdersChartFilters = {
            period,
        }

        if (dateRange) {
            filters.start_date = dateRange.start
            filters.end_date = dateRange.end
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
        totalSupplierOrdersByCountry,
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
