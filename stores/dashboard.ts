// stores/dashboard.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { DashboardService } from '~/services/dashboardService'
import type {
    UserRole,
    DashboardData,
    DashboardPeriodType,
    DashboardDateRange,
    DashboardFilters,
    TableFilters,
    ChartPeriodState,
    ChartDateRangeState,
    RefreshOptions,
    DashboardError,
    RoleConfig,
    MetricQueryParams,
} from '~/types/dashboard'

const CACHE_DURATION = 5 * 60 * 1000
const MAX_RETRIES = 3
const RETRY_DELAY = 1000

const DEFAULT_CHART_PERIODS: ChartPeriodState = {
    primaryMetric: 'last_month',
    orders: 'last_month',
    connections: 'last_month',
    partners: 'last_month',
}

const DEFAULT_DASHBOARD_DATA: DashboardData = {
    primaryMetric: null,
    orders: null,
    connections: null,
    partners: null,
    products: null,
    productFilters: null,
    buyers: null,
    buyersFilters: null,
    suppliers: null,
}

const safeAssignData = (dataRef: any, property: keyof DashboardData, value: any): void => {
    try {
        if (!dataRef.value || typeof dataRef.value !== 'object') {
            dataRef.value = { ...DEFAULT_DASHBOARD_DATA }
        }

        dataRef.value[property] = value
    } catch (error) {
        console.error(`Critical error assigning ${property}:`, error)

        try {
            dataRef.value = { ...DEFAULT_DASHBOARD_DATA }
            dataRef.value[property] = value
        } catch (fallbackError) {
            console.error('Fallback assignment also failed:', fallbackError)
        }
    }
}

export const useDashboardStore = defineStore('dashboard', () => {
    const dashboardService = new DashboardService()

    const role = ref<UserRole | null>(null)
    const data = ref<DashboardData>({
        primaryMetric: null,
        orders: null,
        connections: null,
        partners: null,
        products: null,
        productFilters: null,
        buyers: null,
        buyersFilters: null,
        suppliers: null,
    })
    const isLoading = ref(false)
    const loadingStates = ref({
        primaryMetric: false,
        orders: false,
        connections: false,
        partners: false,
        products: false,
        productFilters: false,
        buyers: false,
        buyersFilters: false,
        suppliers: false,
    })
    const error = ref<DashboardError | null>(null)
    const lastFetched = ref<Date | null>(null)
    const isInitialized = ref(false)

    const chartPeriods = ref<ChartPeriodState>({ ...DEFAULT_CHART_PERIODS })
    const chartDateRanges = ref<ChartDateRangeState>({})

    const productsPage = ref(1)
    const partnersPage = ref(1)
    const itemsPerPage = ref(15)
    const buyersPage = ref(1)
    const suppliersPage = ref(1)

    const activeChartFilters = ref<DashboardFilters>({})
    const activeTableFilters = ref<TableFilters>({})

    const currentRole = computed<UserRole | null>(() => role.value)

    const totalBuyers = computed<number>(() => {
        try {
            return data.value?.buyers?.meta?.total || 0
        } catch (error) {
            console.warn('Error getting total buyers:', error)
            return 0
        }
    })

    const roleConfig = computed<RoleConfig | null>(() => {
        if (!role.value) return null

        const configs: Record<UserRole, RoleConfig> = {
            supplier: {
                labels: {
                    primaryMetric: 'dashboard.metrics.revenue',
                    partners: 'dashboard.metrics.buyers',
                    products: 'dashboard.labels.supplier.products',
                    partnersTable: 'dashboard.labels.supplier.partnersTable',
                },
                endpoints: {
                    primaryMetric: 'revenue',
                    orders: 'orders',
                    connections: 'connections',
                    partners: 'buyers',
                    products: 'top-products',
                    productFilters: 'top-products/filters',
                },
            },
            buyer: {
                labels: {
                    primaryMetric: 'dashboard.metrics.spent',
                    partners: 'dashboard.metrics.suppliers',
                    products: 'dashboard.labels.buyer.products',
                    partnersTable: 'dashboard.labels.buyer.partnersTable',
                },
                endpoints: {
                    primaryMetric: 'spent',
                    orders: 'orders',
                    connections: 'connections',
                    partners: 'suppliers',
                    products: 'top-products',
                    productFilters: 'top-products/filters',
                },
            },
        }

        return configs[role.value]
    })

    const isDataStale = computed<boolean>(() => {
        if (!lastFetched.value) return true
        return Date.now() - lastFetched.value.getTime() > CACHE_DURATION
    })

    const hasChartData = computed<boolean>(() => {
        try {
            return !!(
                data.value?.primaryMetric?.chart_data?.length ||
                data.value?.orders?.chart_data?.length ||
                data.value?.connections?.chart_data?.length ||
                data.value?.partners?.chart_data?.length
            )
        } catch (error) {
            console.warn('Error checking chart data:', error)
            return false
        }
    })

    const hasTableData = computed<boolean>(() => {
        try {
            return !!data.value?.products?.data?.length
        } catch (error) {
            console.warn('Error checking table data:', error)
            return false
        }
    })

    const totalProducts = computed<number>(() => {
        try {
            return data.value?.products?.meta?.total || 0
        } catch (error) {
            console.warn('Error getting total products:', error)
            return 0
        }
    })

    const totalPartners = computed<number>(() => {
        try {
            // For buyer, use suppliers table total; for supplier, use partners chart total
            if (role.value === 'buyer') {
                return data.value?.suppliers?.meta?.total || 0
            }
            return data.value?.partners?.total || 0
        } catch (error) {
            console.warn('Error getting total partners:', error)
            return 0
        }
    })

    const primaryMetricValue = computed<number>(() => {
        try {
            return data.value?.primaryMetric?.total || 0
        } catch (error) {
            console.warn('Error getting primary metric value:', error)
            return 0
        }
    })

    const ordersCount = computed<number>(() => {
        try {
            return data.value?.orders?.total || 0
        } catch (error) {
            console.warn('Error getting orders count:', error)
            return 0
        }
    })

    const connectionsCount = computed<number>(() => {
        try {
            return data.value?.connections?.total || 0
        } catch (error) {
            console.warn('Error getting connections count:', error)
            return 0
        }
    })

    const partnersCount = computed<number>(() => {
        try {
            return data.value?.partners?.total || 0
        } catch (error) {
            console.warn('Error getting partners count:', error)
            return 0
        }
    })

    const currency = computed(() => {
        try {
            return (
                data.value?.productFilters?.currency || {
                    id: 1,
                    symbol: '$',
                    code: 'USD',
                }
            )
        } catch (error) {
            console.warn('Error getting currency:', error)
            return {
                id: 1,
                symbol: '$',
                code: 'USD',
            }
        }
    })

    const isAnyLoading = computed(() => {
        try {
            return Object.values(loadingStates.value).some(Boolean) || isLoading.value
        } catch (error) {
            console.warn('Error checking loading states:', error)
            return false
        }
    })

    const fetchBuyers = async (): Promise<void> => {
        if (!role.value || role.value !== 'supplier') return

        loadingStates.value.buyers = true
        try {
            const params = DashboardService.buyersFiltersToParams({
                page: buyersPage.value,
                perPage: itemsPerPage.value,
                ...activeTableFilters.value,
            })

            const buyersData = await retryOperation(() =>
                dashboardService.getBuyersTable(role.value!, params)
            )

            safeAssignData(data, 'buyers', buyersData)
        } catch (errorData) {
            console.error('Failed to fetch buyers:', errorData)
            safeAssignData(data, 'buyers', null)
        } finally {
            loadingStates.value.buyers = false
        }
    }

    const fetchBuyersFilters = async (): Promise<void> => {
        if (!role.value || role.value !== 'supplier') return

        loadingStates.value.buyersFilters = true
        try {
            const filtersData = await retryOperation(() =>
                dashboardService.getBuyersFilters(role.value!)
            )

            safeAssignData(data, 'buyersFilters', filtersData)
        } catch (errorData) {
            console.error('Failed to fetch buyers filters:', errorData)
            safeAssignData(data, 'buyersFilters', null)
        } finally {
            loadingStates.value.buyersFilters = false
        }
    }

    const fetchSuppliers = async (): Promise<void> => {
        if (!role.value || role.value !== 'buyer') return

        loadingStates.value.suppliers = true
        try {
            const params = DashboardService.buyersFiltersToParams({
                page: suppliersPage.value,
                perPage: itemsPerPage.value,
                ...activeTableFilters.value,
            })

            const suppliersData = await retryOperation(() =>
                dashboardService.getSuppliersTable(role.value!, params)
            )

            safeAssignData(data, 'suppliers', suppliersData)
        } catch (errorData) {
            console.error('Failed to fetch suppliers:', errorData)
            safeAssignData(data, 'suppliers', null)
        } finally {
            loadingStates.value.suppliers = false
        }
    }

    const buildMetricParams = (metricType: keyof ChartPeriodState): MetricQueryParams => {
        try {
            const periods = chartPeriods.value || { ...DEFAULT_CHART_PERIODS }
            const period = periods[metricType] || 'lastMonth'
            const customRange = chartDateRanges.value?.[metricType]

            const params = DashboardService.periodToParams(period, customRange)

            return params
        } catch (error) {
            console.warn(`Error building metric params for ${metricType}:`, error)
            return DashboardService.periodToParams('lastMonth')
        }
    }

    const handleError = (errorData: any, fallbackMessage: string): void => {
        console.error('Dashboard Store Error:', errorData)

        error.value = {
            code: errorData?.code || 'UNKNOWN_ERROR',
            message: errorData?.message || fallbackMessage,
            details: errorData?.details || errorData,
            timestamp: new Date(),
            retryable: isRetryableError(errorData),
        }
    }

    const isRetryableError = (errorData: any): boolean => {
        try {
            const retryableCodes = ['NETWORK_ERROR', 'TIMEOUT', 'SERVER_ERROR']
            return (
                retryableCodes.includes(errorData?.code) ||
                errorData?.response?.status >= 500 ||
                !navigator.onLine
            )
        } catch (error) {
            console.warn('Error checking if error is retryable:', error)
            return false
        }
    }

    const retryOperation = async <T>(
        operation: () => Promise<T>,
        maxRetries = MAX_RETRIES
    ): Promise<T> => {
        let lastError: any

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation()
            } catch (errorData: any) {
                lastError = errorData

                if (attempt === maxRetries || !isRetryableError(errorData)) {
                    throw errorData
                }

                const delay = RETRY_DELAY * Math.pow(2, attempt - 1)
                await new Promise((resolve) => setTimeout(resolve, delay))
            }
        }

        throw lastError
    }

    const initialize = async (userRole?: UserRole): Promise<void> => {
        try {
            isLoading.value = true
            error.value = null

            if (!data.value) {
                data.value = { ...DEFAULT_DASHBOARD_DATA }
            }

            if (!chartPeriods.value) {
                chartPeriods.value = { ...DEFAULT_CHART_PERIODS }
            }

            if (userRole) {
                role.value = userRole
            }

            if (!role.value) {
                throw new Error('User role is required for dashboard initialization')
            }

            isInitialized.value = true
        } catch (errorData: any) {
            handleError(errorData, 'dashboard.errors.initializationFailed')
            throw errorData
        } finally {
            isLoading.value = false
        }
    }

    const loadDashboard = async (options: RefreshOptions = {}): Promise<void> => {
        if (!role.value) {
            await initialize()
            if (!role.value) return
        }

        try {
            isLoading.value = true
            error.value = null

            const promises: Promise<any>[] = []

            if (options.primaryMetric !== false) {
                promises.push(
                    fetchPrimaryMetric().catch((e) => console.error('Primary metric failed:', e))
                )
            }

            if (options.orders !== false) {
                promises.push(fetchOrders().catch((e) => console.error('Orders failed:', e)))
            }

            if (options.connections !== false) {
                promises.push(
                    fetchConnections().catch((e) => console.error('Connections failed:', e))
                )
            }

            if (options.partners !== false) {
                promises.push(fetchPartners().catch((e) => console.error('Partners failed:', e)))
            }

            if (options.products !== false) {
                promises.push(fetchProducts().catch((e) => console.error('Products failed:', e)))
            }

            if (options.filters !== false) {
                promises.push(
                    fetchProductFilters().catch((e) => console.error('Filters failed:', e))
                )
            }

            if (role.value === 'supplier') {
                if (options.buyers !== false) {
                    promises.push(fetchBuyers().catch((e) => console.error('Buyers failed:', e)))
                }
                if (options.filters !== false) {
                    promises.push(
                        fetchBuyersFilters().catch((e) =>
                            console.error('Buyers filters failed:', e)
                        )
                    )
                }
            }

            if (role.value === 'buyer') {
                if (options.partners !== false) {
                    promises.push(
                        fetchSuppliers().catch((e) => console.error('Suppliers failed:', e))
                    )
                }
            }

            await Promise.allSettled(promises)
            lastFetched.value = new Date()
        } catch (errorData: any) {
            handleError(errorData, 'dashboard.errors.generic')
        } finally {
            isLoading.value = false
        }
    }

    const fetchPrimaryMetric = async (): Promise<void> => {
        if (!role.value) return

        loadingStates.value.primaryMetric = true
        try {
            const metricType = role.value === 'supplier' ? 'revenue' : 'spent'
            const params = buildMetricParams('primaryMetric')

            const metricData = await retryOperation(() =>
                dashboardService.getMetric(role.value!, metricType, params)
            )

            safeAssignData(data, 'primaryMetric', metricData)
        } catch (errorData) {
            console.error('Failed to fetch primary metric:', errorData)
            safeAssignData(data, 'primaryMetric', null)
        } finally {
            loadingStates.value.primaryMetric = false
        }
    }

    const fetchOrders = async (): Promise<void> => {
        if (!role.value) return

        loadingStates.value.orders = true
        try {
            const params = buildMetricParams('orders')
            const metricData = await retryOperation(() =>
                dashboardService.getMetric(role.value!, 'orders', params)
            )

            safeAssignData(data, 'orders', metricData)
        } catch (errorData) {
            console.error('Failed to fetch orders:', errorData)
            safeAssignData(data, 'orders', null)
        } finally {
            loadingStates.value.orders = false
        }
    }

    const fetchConnections = async (): Promise<void> => {
        if (!role.value) return

        loadingStates.value.connections = true
        try {
            const params = buildMetricParams('connections')
            const metricData = await retryOperation(() =>
                dashboardService.getMetric(role.value!, 'connections', params)
            )

            safeAssignData(data, 'connections', metricData)
        } catch (errorData) {
            console.error('Failed to fetch connections:', errorData)
            safeAssignData(data, 'connections', null)
        } finally {
            loadingStates.value.connections = false
        }
    }

    const fetchPartners = async (): Promise<void> => {
        if (!role.value) return

        loadingStates.value.partners = true
        try {
            const metricType = role.value === 'supplier' ? 'buyers' : 'suppliers'
            const params = buildMetricParams('partners')

            const metricData = await retryOperation(() =>
                dashboardService.getMetric(role.value!, metricType, params)
            )

            safeAssignData(data, 'partners', metricData)
        } catch (errorData) {
            console.error('Failed to fetch partners:', errorData)
            safeAssignData(data, 'partners', null)
        } finally {
            loadingStates.value.partners = false
        }
    }

    const fetchProducts = async (): Promise<void> => {
        if (!role.value) return

        loadingStates.value.products = true
        try {
            const params = DashboardService.tableFiltersToParams({
                page: productsPage.value,
                perPage: itemsPerPage.value,
                ...activeTableFilters.value,
            })

            const productsData = await retryOperation(() =>
                dashboardService.getTopProducts(role.value!, params)
            )

            safeAssignData(data, 'products', productsData)
        } catch (errorData) {
            console.error('Failed to fetch products:', errorData)
            safeAssignData(data, 'products', null)
        } finally {
            loadingStates.value.products = false
        }
    }

    const fetchProductFilters = async (): Promise<void> => {
        if (!role.value) return

        loadingStates.value.productFilters = true
        try {
            const filtersData = await retryOperation(() =>
                dashboardService.getProductFilters(role.value!)
            )

            safeAssignData(data, 'productFilters', filtersData)
        } catch (errorData) {
            console.error('Failed to fetch product filters:', errorData)
            safeAssignData(data, 'productFilters', null)
        } finally {
            loadingStates.value.productFilters = false
        }
    }

    const changeBuyersPage = async (page: number): Promise<void> => {
        try {
            buyersPage.value = page
            await fetchBuyers()
        } catch (error) {
            console.error('Error changing buyers page:', error)
            handleError(error, 'Failed to change page')
        }
    }

    const updateChartPeriod = async (
        metricType: keyof ChartPeriodState,
        period: DashboardPeriodType,
        customRange?: DashboardDateRange
    ): Promise<void> => {
        try {
            if (!chartPeriods.value) {
                chartPeriods.value = { ...DEFAULT_CHART_PERIODS }
            }

            chartPeriods.value = {
                ...chartPeriods.value,
                [metricType]: period,
            }

            if (period === 'custom' && customRange) {
                if (!chartDateRanges.value) chartDateRanges.value = {}
                chartDateRanges.value = {
                    ...chartDateRanges.value,
                    [metricType]: customRange,
                }
            } else {
                if (chartDateRanges.value?.[metricType]) {
                    const { [metricType]: _, ...rest } = chartDateRanges.value
                    chartDateRanges.value = rest
                }
            }

            await nextTick()
            await refreshMetric(metricType)
        } catch (error) {
            console.error(`Error updating chart period for ${metricType}:`, error)
            handleError(error, 'Failed to update chart period')
        }
    }

    const refreshMetric = async (metricType: keyof ChartPeriodState): Promise<void> => {
        try {
            const methodMap = {
                primaryMetric: fetchPrimaryMetric,
                orders: fetchOrders,
                connections: fetchConnections,
                partners: fetchPartners,
            }

            const method = methodMap[metricType]
            if (method) {
                await method()
            }
        } catch (error) {
            console.error(`Error refreshing metric ${metricType}:`, error)
        }
    }

    const applyTableFilters = async (filters: TableFilters): Promise<void> => {
        try {
            activeTableFilters.value = { ...filters }
            productsPage.value = 1
            await fetchProducts()
        } catch (error) {
            console.error('Error applying table filters:', error)
            handleError(error, 'Failed to apply filters')
        }
    }

    const changeProductsPage = async (page: number): Promise<void> => {
        try {
            productsPage.value = page
            await fetchProducts()
        } catch (error) {
            console.error('Error changing products page:', error)
            handleError(error, 'Failed to change page')
        }
    }

    const changePartnersPage = async (page: number): Promise<void> => {
        try {
            partnersPage.value = page
        } catch (error) {
            console.error('Error changing partners page:', error)
        }
    }

    const changeSuppliersPage = async (page: number): Promise<void> => {
        try {
            suppliersPage.value = page
            await fetchSuppliers()
        } catch (error) {
            console.error('Error changing suppliers page:', error)
            handleError(error, 'Failed to change page')
        }
    }

    const refresh = async (options: RefreshOptions = {}): Promise<void> => {
        await loadDashboard({ force: true, ...options })
    }

    const clearDashboard = (): void => {
        try {
            data.value = { ...DEFAULT_DASHBOARD_DATA }

            error.value = null
            lastFetched.value = null
            isInitialized.value = false

            chartPeriods.value = { ...DEFAULT_CHART_PERIODS }
            chartDateRanges.value = {}

            productsPage.value = 1
            partnersPage.value = 1
            buyersPage.value = 1
            suppliersPage.value = 1
            activeChartFilters.value = {}
            activeTableFilters.value = {}

            Object.keys(loadingStates.value).forEach((key) => {
                loadingStates.value[key as keyof typeof loadingStates.value] = false
            })
        } catch (error) {
            console.error('Error clearing dashboard:', error)

            try {
                data.value = { ...DEFAULT_DASHBOARD_DATA }
                chartPeriods.value = { ...DEFAULT_CHART_PERIODS }
            } catch (fallbackError) {
                console.error('Fallback clear also failed:', fallbackError)
            }
        }
    }

    const resetError = (): void => {
        error.value = null
    }

    return {
        role,
        data,
        isLoading,
        loadingStates,
        error,
        lastFetched,
        isInitialized,
        chartPeriods,
        chartDateRanges,
        productsPage,
        partnersPage,
        itemsPerPage,
        buyersPage,
        suppliersPage,
        activeChartFilters,
        activeTableFilters,

        currentRole,
        roleConfig,
        isDataStale,
        hasChartData,
        hasTableData,
        totalProducts,
        totalPartners,
        primaryMetricValue,
        ordersCount,
        connectionsCount,
        partnersCount,
        currency,
        isAnyLoading,

        initialize,
        loadDashboard,
        fetchPrimaryMetric,
        fetchOrders,
        fetchConnections,
        fetchPartners,
        fetchProducts,
        fetchProductFilters,
        updateChartPeriod,
        refreshMetric,
        applyTableFilters,
        changeProductsPage,
        changePartnersPage,
        refresh,
        clearDashboard,
        resetError,

        totalBuyers,
        fetchBuyers,
        fetchBuyersFilters,
        changeBuyersPage,
        fetchSuppliers,
        changeSuppliersPage,
    }
})

if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useDashboardStore, import.meta.hot))
}
