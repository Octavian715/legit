import { defineStore, acceptHMRUpdate } from 'pinia'
import { UserDashboardService } from '~/services/userDashboard'
import type {
    BuyerDashboardUser,
    SupplierDashboardUser,
    DashboardListResponse,
    DashboardFilterOptions,
    DashboardFilters,
    DashboardChartData,
    DashboardChartFilters,
    DashboardPeriod,
    SupplierChartData,
    BuyerChartData,
    ApiError,
} from '~/types/userDashboard'

// Chart period state type - similar to dashboard store pattern
type ChartType = 'buyersBusinessType' | 'buyersCountry' | 'suppliersBusinessType' | 'suppliersCountry'

interface ChartPeriodState {
    buyersBusinessType: DashboardPeriod
    buyersCountry: DashboardPeriod
    suppliersBusinessType: DashboardPeriod
    suppliersCountry: DashboardPeriod
}

interface ChartDateRangeState {
    buyersBusinessType?: { start_date: string; end_date: string }
    buyersCountry?: { start_date: string; end_date: string }
    suppliersBusinessType?: { start_date: string; end_date: string }
    suppliersCountry?: { start_date: string; end_date: string }
}

const DEFAULT_CHART_PERIODS: ChartPeriodState = {
    buyersBusinessType: 'last_month',
    buyersCountry: 'last_month',
    suppliersBusinessType: 'last_month',
    suppliersCountry: 'last_month',
}

export const useUserDashboardStore = defineStore('userDashboard', () => {
    const userDashboardService = new UserDashboardService()

    // State
    const buyers = ref<BuyerDashboardUser[]>([])
    const suppliers = ref<SupplierDashboardUser[]>([])
    const buyersMeta = ref<DashboardListResponse<BuyerDashboardUser>['meta'] | null>(null)
    const suppliersMeta = ref<DashboardListResponse<SupplierDashboardUser>['meta'] | null>(null)

    const buyersFilterOptions = ref<DashboardFilterOptions | null>(null)
    const suppliersFilterOptions = ref<DashboardFilterOptions | null>(null)

    const buyersChartData = ref<DashboardChartData | null>(null)
    const suppliersChartData = ref<DashboardChartData | null>(null)

    // NEW: Chart data for analytics
    const buyersBusinessTypeChart = ref<BuyerChartData | null>(null)
    const buyersCountryChart = ref<BuyerChartData | null>(null)
    const suppliersBusinessTypeChart = ref<SupplierChartData | null>(null)
    const suppliersCountryChart = ref<SupplierChartData | null>(null)

    // Chart period state - following dashboard store pattern
    const chartPeriods = ref<ChartPeriodState>({ ...DEFAULT_CHART_PERIODS })
    const chartDateRanges = ref<ChartDateRangeState>({})

    const isLoading = ref<boolean>(false)
    const error = ref<ApiError | null>(null)

    const currentFilters = ref<DashboardFilters>({})

    // Computed
    const totalBuyers = computed<number>(() => {
        return buyersMeta.value?.total || 0
    })

    const totalSuppliers = computed<number>(() => {
        return suppliersMeta.value?.total || 0
    })

    const hasBuyers = computed<boolean>(() => {
        return Array.isArray(buyers.value) && buyers.value.length > 0
    })

    const hasSuppliers = computed<boolean>(() => {
        return Array.isArray(suppliers.value) && suppliers.value.length > 0
    })

    const getBuyerById = computed(() => {
        return (buyerId: number) => {
            if (!Array.isArray(buyers.value)) return undefined
            return buyers.value.find((buyer) => buyer.company_id === buyerId)
        }
    })

    const getSupplierById = computed(() => {
        return (supplierId: number) => {
            if (!Array.isArray(suppliers.value)) return undefined
            return suppliers.value.find((supplier) => supplier.company_id === supplierId)
        }
    })

    // NEW: Chart data computed
    const hasBuyerChartData = computed<boolean>(() => {
        return !!buyersBusinessTypeChart.value || !!buyersCountryChart.value
    })

    const hasSupplierChartData = computed<boolean>(() => {
        return !!suppliersBusinessTypeChart.value || !!suppliersCountryChart.value
    })

    // Actions
    const resetError = (): void => {
        error.value = null
    }

    const handleError = (e: any): void => {
        const apiError: ApiError = {
            message: e.data?.message || e.message || 'An error occurred',
            errors: e.data?.errors,
            statusCode: e.statusCode || 500,
        }
        error.value = apiError
        console.error('Buyer dashboard error:', apiError)
        throw apiError
    }

    // Helper to build chart params - similar to dashboard store pattern
    const buildChartParams = (chartType: ChartType): DashboardChartFilters => {
        try {
            const periods = chartPeriods.value || { ...DEFAULT_CHART_PERIODS }
            const period = periods[chartType] || 'last_month'
            const customRange = chartDateRanges.value?.[chartType]

            if (period === 'custom' && customRange) {
                return {
                    start_date: customRange.start_date,
                    end_date: customRange.end_date,
                }
            }

            return { period }
        } catch (error) {
            console.warn(`Error building chart params for ${chartType}:`, error)
            return { period: 'last_month' }
        }
    }

    // Update chart period - similar to dashboard store pattern
    const updateChartPeriod = (
        chartType: ChartType,
        period: DashboardPeriod,
        customRange?: { start_date: string; end_date: string }
    ): void => {
        if (!chartPeriods.value) {
            chartPeriods.value = { ...DEFAULT_CHART_PERIODS }
        }

        chartPeriods.value = {
            ...chartPeriods.value,
            [chartType]: period,
        }

        if (period === 'custom' && customRange) {
            chartDateRanges.value = {
                ...chartDateRanges.value,
                [chartType]: customRange,
            }
        } else {
            // Clear custom range when not using custom period
            const newRanges = { ...chartDateRanges.value }
            delete newRanges[chartType]
            chartDateRanges.value = newRanges
        }
    }

    const fetchAllBuyers = async (
        filters: DashboardFilters = {}
    ): Promise<DashboardListResponse<BuyerDashboardUser> | undefined> => {
        if (isLoading.value) return

        isLoading.value = true
        resetError()

        try {
            const cleanFilters: DashboardFilters = {}

            if (filters.search?.trim()) cleanFilters.search = filters.search.trim()
            if (filters.period) cleanFilters.period = filters.period
            if (filters.start_date) cleanFilters.start_date = filters.start_date
            if (filters.end_date) cleanFilters.end_date = filters.end_date
            if (filters.business_type_ids?.length)
                cleanFilters.business_type_ids = filters.business_type_ids
            if (filters.country_ids?.length) cleanFilters.country_ids = filters.country_ids
            if (filters.min_total_amount !== undefined)
                cleanFilters.min_total_amount = filters.min_total_amount
            if (filters.max_total_amount !== undefined)
                cleanFilters.max_total_amount = filters.max_total_amount
            if (filters.page && filters.page > 0) cleanFilters.page = filters.page
            if (filters.per_page && filters.per_page > 0) cleanFilters.per_page = filters.per_page
            if (filters.sort_by) cleanFilters.sort_by = filters.sort_by
            if (filters.sort_direction) cleanFilters.sort_direction = filters.sort_direction

            const response = await userDashboardService.fetchAllBuyers(cleanFilters)

            buyers.value = Array.isArray(response.data) ? response.data : []
            buyersMeta.value = response.meta
            currentFilters.value = cleanFilters

            return response
        } catch (e) {
            handleError(e)
            buyers.value = []
            buyersMeta.value = null
            return undefined
        } finally {
            isLoading.value = false
        }
    }

    const fetchAllBuyersFilters = async (): Promise<DashboardFilterOptions | null> => {
        if (isLoading.value) return buyersFilterOptions.value

        isLoading.value = true
        resetError()

        try {
            const response = await userDashboardService.fetchAllBuyersFilters()
            buyersFilterOptions.value = response
            return buyersFilterOptions.value
        } catch (e) {
            handleError(e)
            buyersFilterOptions.value = null
            return null
        } finally {
            isLoading.value = false
        }
    }

    const fetchBuyersChartData = async (filters: DashboardFilters = {}): Promise<void> => {
        if (isLoading.value) return

        isLoading.value = true
        resetError()

        try {
            buyersChartData.value = await userDashboardService.fetchBuyersByBusinessType(filters)
        } catch (e) {
            handleError(e)
            buyersChartData.value = null
        } finally {
            isLoading.value = false
        }
    }

    const fetchAllSuppliers = async (
        filters: DashboardFilters = {}
    ): Promise<DashboardListResponse<SupplierDashboardUser> | undefined> => {
        if (isLoading.value) return

        isLoading.value = true
        resetError()

        try {
            const cleanFilters: DashboardFilters = {}

            if (filters.search?.trim()) cleanFilters.search = filters.search.trim()
            if (filters.period) cleanFilters.period = filters.period
            if (filters.start_date) cleanFilters.start_date = filters.start_date
            if (filters.end_date) cleanFilters.end_date = filters.end_date
            if (filters.business_type_ids?.length)
                cleanFilters.business_type_ids = filters.business_type_ids
            if (filters.country_ids?.length) cleanFilters.country_ids = filters.country_ids
            if (filters.min_total_amount !== undefined)
                cleanFilters.min_total_amount = filters.min_total_amount
            if (filters.max_total_amount !== undefined)
                cleanFilters.max_total_amount = filters.max_total_amount
            if (filters.page && filters.page > 0) cleanFilters.page = filters.page
            if (filters.per_page && filters.per_page > 0) cleanFilters.per_page = filters.per_page
            if (filters.sort_by) cleanFilters.sort_by = filters.sort_by
            if (filters.sort_direction) cleanFilters.sort_direction = filters.sort_direction

            const response = await userDashboardService.fetchAllSuppliers(cleanFilters)

            suppliers.value = Array.isArray(response.data) ? response.data : []
            suppliersMeta.value = response.meta
            currentFilters.value = cleanFilters

            return response
        } catch (e) {
            handleError(e)
            suppliers.value = []
            suppliersMeta.value = null
            return undefined
        } finally {
            isLoading.value = false
        }
    }

    const fetchAllSuppliersFilters = async (): Promise<DashboardFilterOptions | null> => {
        if (isLoading.value) return suppliersFilterOptions.value

        isLoading.value = true
        resetError()

        try {
            suppliersFilterOptions.value = await userDashboardService.fetchAllSuppliersFilters()
            return suppliersFilterOptions.value
        } catch (e) {
            handleError(e)
            suppliersFilterOptions.value = null
            return null
        } finally {
            isLoading.value = false
        }
    }

    // Chart data actions - no isLoading check to allow parallel loading
    // Each chart component manages its own loading state
    const fetchBuyersBusinessTypeChart = async (
        filters: DashboardChartFilters = {}
    ): Promise<BuyerChartData | null> => {
        try {
            buyersBusinessTypeChart.value =
                await userDashboardService.fetchBuyersBusinessTypeChart(filters)
            return buyersBusinessTypeChart.value
        } catch (e) {
            console.error('Error fetching buyers business type chart:', e)
            buyersBusinessTypeChart.value = null
            return null
        }
    }

    const fetchBuyersCountryChart = async (
        filters: DashboardChartFilters = {}
    ): Promise<BuyerChartData | null> => {
        try {
            buyersCountryChart.value = await userDashboardService.fetchBuyersCountryChart(filters)
            return buyersCountryChart.value
        } catch (e) {
            console.error('Error fetching buyers country chart:', e)
            buyersCountryChart.value = null
            return null
        }
    }

    const fetchSuppliersBusinessTypeChart = async (
        filters: DashboardChartFilters = {}
    ): Promise<SupplierChartData | null> => {
        try {
            suppliersBusinessTypeChart.value =
                await userDashboardService.fetchSuppliersByBusinessType(filters)
            return suppliersBusinessTypeChart.value
        } catch (e) {
            console.error('Error fetching suppliers business type chart:', e)
            suppliersBusinessTypeChart.value = null
            return null
        }
    }

    const fetchSuppliersCountryChart = async (
        filters: DashboardChartFilters = {}
    ): Promise<SupplierChartData | null> => {
        try {
            suppliersCountryChart.value =
                await userDashboardService.fetchSuppliersByCountry(filters)
            return suppliersCountryChart.value
        } catch (e) {
            console.error('Error fetching suppliers country chart:', e)
            suppliersCountryChart.value = null
            return null
        }
    }

    const clearBuyers = (): void => {
        buyers.value = []
        buyersMeta.value = null
        buyersChartData.value = null
        buyersBusinessTypeChart.value = null
        buyersCountryChart.value = null
    }

    const clearSuppliers = (): void => {
        suppliers.value = []
        suppliersMeta.value = null
        suppliersChartData.value = null
        suppliersBusinessTypeChart.value = null
        suppliersCountryChart.value = null
    }

    const clearFilters = (): void => {
        buyersFilterOptions.value = null
        suppliersFilterOptions.value = null
        currentFilters.value = {}
    }

    const clearCache = (): void => {
        clearBuyers()
        clearSuppliers()
        clearFilters()
    }

    const getActiveFilters = computed((): number => {
        const filters = { ...currentFilters.value }

        delete filters.page
        delete filters.per_page
        delete filters.sort_by
        delete filters.sort_direction

        return Object.keys(filters).filter((key) => {
            const value = filters[key as keyof DashboardFilters]
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
        buyers: computed(() => (Array.isArray(buyers.value) ? buyers.value : [])),
        suppliers: computed(() => (Array.isArray(suppliers.value) ? suppliers.value : [])),
        buyersMeta,
        suppliersMeta,
        buyersFilterOptions,
        suppliersFilterOptions,
        buyersChartData,
        suppliersChartData,

        // Chart data state
        buyersBusinessTypeChart,
        buyersCountryChart,
        suppliersBusinessTypeChart,
        suppliersCountryChart,

        // Chart period state - following dashboard store pattern
        chartPeriods,
        chartDateRanges,

        isLoading,
        error,
        currentFilters,

        // Computed
        totalBuyers,
        totalSuppliers,
        hasBuyers,
        hasSuppliers,
        getBuyerById,
        getSupplierById,
        getActiveFilters,

        // Chart data computed
        hasBuyerChartData,
        hasSupplierChartData,

        // Actions
        fetchAllBuyers,
        fetchAllBuyersFilters,
        fetchBuyersChartData,
        fetchAllSuppliers,
        fetchAllSuppliersFilters,

        // Chart data actions
        fetchBuyersBusinessTypeChart,
        fetchBuyersCountryChart,
        fetchSuppliersBusinessTypeChart,
        fetchSuppliersCountryChart,

        // Chart period helpers - following dashboard store pattern
        buildChartParams,
        updateChartPeriod,

        clearBuyers,
        clearSuppliers,
        clearFilters,
        clearCache,
        resetError,
    }
})

if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useUserDashboardStore, import.meta.hot))
}
