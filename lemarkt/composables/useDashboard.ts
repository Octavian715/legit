// composables/useDashboard.ts
import { storeToRefs } from 'pinia'
import { useUserStore } from '~/stores/user'
import { useFeatureAccess } from '~/composables/useFeatureAccess'
import type {
    UserRole,
    DashboardFilters,
    TableFilters,
    RefreshOptions,
    ChartPeriodState,
    DashboardPeriodType,
    DashboardDateRange,
} from '~/types/dashboard'
import type { ChartData, ChartDataset } from '~/types/chart'

export const useDashboard = () => {
    const dashboardStore = useDashboardStore()
    const toast = useToastNotification()
    const userStore = useUserStore()
    const { t, locale } = useI18n()
    const route = useRoute()
    const { formatCurrency: formatCurrencyComposable } = useFormatters()
    const { isValidDate, isDateBefore } = useDate()
    const { canAccess } = useFeatureAccess()

    const {
        role,
        data,
        isLoading,
        error,
        lastFetched,
        isInitialized,
        chartPeriods,
        chartDateRanges,
        productsPage,
        partnersPage,
        itemsPerPage,
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
        totalBuyers,
        buyersPage,
    } = storeToRefs(dashboardStore)

    const { isLiteSupplier } = storeToRefs(userStore)

    const chartLoadingStates = ref({
        primaryMetric: false,
        orders: false,
        connections: false,
        partners: false,
    })

    const tableLoadingStates = ref({
        products: false,
        partners: false,
        buyers: false,
    })

    const getPathRole = (): UserRole | null => {
        const path = route.path
        const cleanPath = path.toLowerCase()
        const segments = cleanPath.split('/').filter(Boolean)

        for (const segment of segments) {
            if (segment === 'supplier') return 'supplier'
            if (segment === 'buyer') return 'buyer'
        }

        return null
    }

    const initializeDashboard = async (forceRole?: UserRole): Promise<void> => {
        try {
            const roleToUse = forceRole || getPathRole()

            if (!roleToUse) {
                throw new Error('Cannot determine role from path')
            }

            await dashboardStore.initialize(roleToUse)
            if (isLiteSupplier.value) {
                await loadDashboard({
                    primaryMetric: false,
                    orders: false,
                    connections: true,
                    partners: false,
                    products: false,
                    filters: false,
                    buyers: false,
                })
            } else {
                await loadDashboard()
            }
        } catch (error: any) {
            handleDashboardError(error)
        }
    }

    const loadDashboard = async (options: RefreshOptions = {}): Promise<void> => {
        try {
            await dashboardStore.loadDashboard(options)
        } catch (error: any) {
            handleDashboardError(error)
        }
    }

    const refreshChartMetric = async (metricType: keyof ChartPeriodState): Promise<void> => {
        // Check if chart is locked before fetching
        const chartLocks = {
            revenue: isRevenueChartLocked.value,
            orders: isOrdersChartLocked.value,
            connections: isConnectionsChartLocked.value,
            partners: isPartnersChartLocked.value,
        }

        if (chartLocks[metricType]) {
            // Chart is locked - do not fetch data
            return
        }

        chartLoadingStates.value[metricType] = true

        try {
            await dashboardStore.refreshMetric(metricType)
        } catch (error: any) {
            handleDashboardError(error)
        } finally {
            chartLoadingStates.value[metricType] = false
        }
    }

    const updateChartPeriod = async (
        metricType: keyof ChartPeriodState,
        period: DashboardPeriodType,
        customRange?: DashboardDateRange
    ): Promise<void> => {
        // Check if chart is locked before updating period
        const chartLocks = {
            revenue: isRevenueChartLocked.value,
            orders: isOrdersChartLocked.value,
            connections: isConnectionsChartLocked.value,
            partners: isPartnersChartLocked.value,
        }

        if (chartLocks[metricType]) {
            // Chart is locked - do not update period
            console.log(`[Dashboard] Chart ${metricType} is locked - skipping period update`)
            return
        }

        chartLoadingStates.value[metricType] = true

        try {
            await dashboardStore.updateChartPeriod(metricType, period, customRange)
        } catch (error: any) {
            handleDashboardError(error)
        } finally {
            chartLoadingStates.value[metricType] = false
        }
    }

    const refreshProducts = async (): Promise<void> => {
        tableLoadingStates.value.products = true

        try {
            await dashboardStore.fetchProducts()
            showSuccess(t('dashboard.messages.refreshed'))
        } catch (error: any) {
            handleDashboardError(error)
        } finally {
            tableLoadingStates.value.products = false
        }
    }

    const refreshPartners = async (): Promise<void> => {
        tableLoadingStates.value.partners = true

        try {
            await dashboardStore.fetchPartners()
            showSuccess(t('dashboard.messages.refreshed'))
        } catch (error: any) {
            handleDashboardError(error)
        } finally {
            tableLoadingStates.value.partners = false
        }
    }

    const refreshBuyers = async (): Promise<void> => {
        tableLoadingStates.value.buyers = true
        try {
            await dashboardStore.fetchBuyers()
            showSuccess(t('dashboard.messages.refreshed'))
        } catch (error: any) {
            handleDashboardError(error)
        } finally {
            tableLoadingStates.value.buyers = false
        }
    }

    const handleProductsPageChange = async (page: number): Promise<void> => {
        tableLoadingStates.value.products = true

        try {
            await dashboardStore.changeProductsPage(page)
        } catch (error: any) {
            handleDashboardError(error)
        } finally {
            tableLoadingStates.value.products = false
        }
    }

    const handlePartnersPageChange = async (page: number): Promise<void> => {
        tableLoadingStates.value.partners = true

        try {
            await dashboardStore.changePartnersPage(page)
        } catch (error: any) {
            handleDashboardError(error)
        } finally {
            tableLoadingStates.value.partners = false
        }
    }

    const handleBuyersPageChange = async (page: number): Promise<void> => {
        tableLoadingStates.value.buyers = true
        try {
            await dashboardStore.changeBuyersPage(page)
        } catch (error: any) {
            handleDashboardError(error)
        } finally {
            tableLoadingStates.value.buyers = false
        }
    }

    const applyTableFilters = async (filters: TableFilters): Promise<void> => {
        tableLoadingStates.value.products = true
        tableLoadingStates.value.partners = true

        try {
            await dashboardStore.applyTableFilters(filters)
            showSuccess(t('dashboard.messages.filtersApplied'))
        } catch (error: any) {
            handleDashboardError(error)
        } finally {
            tableLoadingStates.value.products = false
            tableLoadingStates.value.partners = false
        }
    }

    const refreshDashboard = async (options: RefreshOptions = {}): Promise<void> => {
        try {
            await dashboardStore.refresh(options)
            showSuccess(t('dashboard.messages.refreshed'))
        } catch (error: any) {
            handleDashboardError(error)
        }
    }

    const getLabels = computed(() => {
        const roleType = currentRole.value || 'supplier'

        return {
            primaryMetric: t(
                `dashboardUser.${roleType}.${roleType === 'supplier' ? 'revenue' : 'spent'}`
            ),
            partners: t(
                `dashboardUser.${roleType}.${roleType === 'supplier' ? 'buyers' : 'suppliers'}`
            ),
            products: t(`dashboardUser.${roleType}.products`),
            partnersTable: t(
                `dashboardUser.${roleType}.${roleType === 'supplier' ? 'buyersTable' : 'suppliersTable'}`
            ),
        }
    })

    const formatCurrency = (value: number): string => {
        const currencyData = currency.value || { symbol: '€', code: 'EUR' }
        return formatCurrencyComposable(value, currencyData.symbol, 2)
    }

    const formatNumber = (value: number): string => {
        if (value >= 1000000) {
            return `${(value / 1000000).toLocaleString(locale.value, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
            })}M`
        }
        if (value >= 1000) {
            return `${(value / 1000).toLocaleString(locale.value, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
            })}k`
        }
        return value.toLocaleString(locale.value)
    }

    const shouldRefreshData = computed<boolean>(() => {
        return !data.value || isDataStale.value
    })

    const getChartColor = (metricType: keyof ChartPeriodState): string => {
        const colors = {
            primaryMetric: '#3B82F6',
            orders: '#22C55E',
            connections: '#8B5CF6',
            partners: '#F59E0B',
        }
        return colors[metricType] || '#6B7280'
    }

    const createChartDataset = (label: string, values: number[], color: string): ChartDataset => ({
        label,
        data: values,
        borderColor: color,
        backgroundColor: `${color}20`,
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: color,
        pointBorderColor: '#ffffff',
    })

    const primaryMetricChartData = computed<ChartData>(() => {
        try {
            const storeData = dashboardStore.data
            const metric = storeData?.primaryMetric

            if (!metric?.chart_data?.length) {
                return { labels: [], datasets: [] }
            }

            const labels = metric.chart_data.map((item) => item.period)
            const values = metric.chart_data.map((item) => Number(item.value) || 0)

            return {
                labels,
                datasets: [
                    createChartDataset(
                        getLabels.value.primaryMetric,
                        values,
                        getChartColor('primaryMetric')
                    ),
                ],
            }
        } catch (error) {
            console.error('Primary Metric Chart Error:', error)
            return { labels: [], datasets: [] }
        }
    })

    const ordersChartData = computed<ChartData>(() => {
        try {
            const storeData = dashboardStore.data
            const metric = storeData?.orders

            if (!metric?.chart_data?.length) {
                return { labels: [], datasets: [] }
            }

            const labels = metric.chart_data.map((item) => item.period)
            const values = metric.chart_data.map((item) => Number(item.value) || 0)

            return {
                labels,
                datasets: [createChartDataset(t('orders.orders'), values, getChartColor('orders'))],
            }
        } catch (error) {
            console.error('Orders Chart Error:', error)
            return { labels: [], datasets: [] }
        }
    })

    const connectionsChartData = computed<ChartData>(() => {
        try {
            const storeData = dashboardStore.data
            const metric = storeData?.connections

            if (!metric?.chart_data) {
                console.warn('[Connections Chart] No chart_data')
                return { labels: [], datasets: [] }
            }

            if (!Array.isArray(metric.chart_data) || metric.chart_data.length === 0) {
                console.warn('[Connections Chart] Invalid chart_data')
                return { labels: [], datasets: [] }
            }

            const labels = metric.chart_data.map((item) => item.period)
            const values = metric.chart_data.map((item) => Number(item.value) || 0)

            return {
                labels,
                datasets: [
                    createChartDataset(t('network.title'), values, getChartColor('connections')),
                ],
            }
        } catch (error) {
            console.error('Connections Chart Error:', error)
            return { labels: [], datasets: [] }
        }
    })

    const partnersChartData = computed<ChartData>(() => {
        try {
            const storeData = dashboardStore.data
            const metric = storeData?.partners

            if (!metric?.chart_data) {
                console.warn('[Partners Chart] No chart_data:', {
                    hasMetric: !!metric,
                    metricKeys: metric ? Object.keys(metric) : [],
                    rawMetric: metric,
                })
                return { labels: [], datasets: [] }
            }

            if (!Array.isArray(metric.chart_data) || metric.chart_data.length === 0) {
                console.warn('[Partners Chart] Invalid chart_data:', metric.chart_data)
                return { labels: [], datasets: [] }
            }

            const labels = metric.chart_data.map((item) => item.period)
            const values = metric.chart_data.map((item) => Number(item.value) || 0)

            return {
                labels,
                datasets: [
                    createChartDataset(getLabels.value.partners, values, getChartColor('partners')),
                ],
            }
        } catch (error) {
            console.error('Partners Chart Error:', error)
            return { labels: [], datasets: [] }
        }
    })

    const getMetricStats = computed(() => {
        return {
            primaryMetric: {
                value: primaryMetricValue.value,
                formatted: formatCurrency(primaryMetricValue.value),
                label: getLabels.value.primaryMetric,
                color: getChartColor('primaryMetric'),
            },
            orders: {
                value: ordersCount.value,
                formatted: formatNumber(ordersCount.value),
                label: t('orders', ordersCount.value),
                color: getChartColor('orders'),
            },
            connections: {
                value: connectionsCount.value,
                formatted: formatNumber(connectionsCount.value),
                label: t('connenctions', connectionsCount.value),
                color: getChartColor('connections'),
            },
            partners: {
                value: partnersCount.value,
                formatted: formatNumber(partnersCount.value),
                label: getLabels.value.partners,
                color: getChartColor('partners'),
            },
        }
    })

    const getProductsTableData = computed(() => {
        return data.value?.products?.data || []
    })

    const getProductsPagination = computed(() => {
        const meta = data.value?.products?.meta
        if (!meta) {
            return {
                currentPage: 1,
                totalPages: 1,
                totalItems: 0,
                itemsPerPage: itemsPerPage.value,
                from: 0,
                to: 0,
            }
        }

        return {
            currentPage: meta.current_page,
            totalPages: meta.last_page,
            totalItems: meta.total,
            itemsPerPage: meta.per_page,
            from: meta.from,
            to: meta.to,
        }
    })

    const clearDashboard = (): void => {
        dashboardStore.clearDashboard()
        chartLoadingStates.value = {
            primaryMetric: false,
            orders: false,
            connections: false,
            partners: false,
        }
        tableLoadingStates.value = {
            products: false,
            partners: false,
            buyers: false,
        }
    }

    const retryOperation = async (): Promise<void> => {
        dashboardStore.resetError()
        await loadDashboard({ force: true })
    }

    const handleDashboardError = (errorData: any): void => {
        console.error('Dashboard Error:', errorData)

        let message = t('dashboard.errors.generic')

        if (errorData?.response?.status === 401) {
            message = t('dashboard.errors.authorization')
        } else if (errorData?.response?.status === 403) {
            message = t('errors.forbidden')
        } else if (errorData?.response?.status === 404) {
            message = t('errors.notFound')
        } else if (errorData?.response?.status >= 500) {
            message = t('dashboard.errors.server')
        } else if (errorData?.code === 'NETWORK_ERROR') {
            message = t('dashboard.errors.network')
        } else if (errorData?.response?.data?.message) {
            message = errorData.response.data.message
        } else if (errorData?.message) {
            if (errorData.message.startsWith('dashboard.errors.')) {
                message = t(errorData.message)
            } else {
                message = errorData.message
            }
        }

        showError(message)
    }

    const showSuccess = (message: string): void => {
        toast.success(message, t('success'))
    }

    const showError = (message: string): void => {
        toast.error(message, t('error'))
    }

    const getAvailablePeriods = (): { value: DashboardPeriodType; label: string }[] => {
        return [
            { value: 'today', label: t('filters.today') },
            { value: 'lastMonth', label: t('filters.lastMonth') },
            { value: 'lastYear', label: t('filters.lastYear') },
            { value: 'custom', label: t('filters.customDateRange') },
        ]
    }

    const validateDateRange = (dateRange: DashboardDateRange): boolean => {
        if (!dateRange.start_date || !dateRange.end_date) {
            return false
        }

        const startDate = new Date(dateRange.start_date)
        const endDate = new Date(dateRange.end_date)

        if (!isValidDate(startDate) || !isValidDate(endDate)) {
            return false
        }

        if (!isDateBefore(startDate, endDate)) {
            return false
        }

        const now = new Date()
        if (isDateBefore(now, endDate)) {
            return false
        }

        return true
    }

    const getProductFilterOptions = computed(() => {
        return (
            data.value?.productFilters || {
                categories: [],
                brand_names: [],
                countries: [],
                amount_range: { min: 0, max: 0 },
                currency: { id: 1, code: 'EUR', symbol: '€' },
            }
        )
    })

    const getLastUpdatedTime = computed(() => {
        if (!lastFetched.value) return null

        const { getRelativeTime } = useDate()
        return getRelativeTime(lastFetched.value)
    })

    const hasAnyData = computed<boolean>(() => {
        return hasChartData.value || hasTableData.value
    })

    const getDashboardSummary = computed(() => {
        const metrics = getMetricStats.value

        return {
            primaryMetric: {
                label: metrics.primaryMetric.label,
                value: metrics.primaryMetric.formatted,
                period: chartPeriods.value.primaryMetric,
            },
            totalOrders: {
                label: metrics.orders.label,
                value: metrics.orders.formatted,
                period: chartPeriods.value.orders,
            },
            totalConnections: {
                label: metrics.connections.label,
                value: metrics.connections.formatted,
                period: chartPeriods.value.connections,
            },
            totalPartners: {
                label: metrics.partners.label,
                value: metrics.partners.formatted,
                period: chartPeriods.value.partners,
            },
            productsCount: totalProducts.value,
            lastUpdated: getLastUpdatedTime.value,
        }
    })

    // ====================================
    // CHART FEATURE ACCESS (LOCKS)
    // ====================================

    /**
     * Check if sales/revenue chart is locked
     * For Supplier Lite: LOCKED (requires Professional+)
     * IMPORTANT: Checks user's actual role (not page context)
     * Works even when supplier is on /buyer/dashboard
     */
    const isRevenueChartLocked = computed(() => {
        // Check if user is a supplier (regardless of which dashboard they're on)
        const userIsSupplier = userStore.roles.includes('supplier')
        // Lock if user is supplier AND doesn't have access to sales_dashboard
        return userIsSupplier && !canAccess('sales_dashboard')
    })

    /**
     * Check if orders chart is locked
     * For Supplier Lite: LOCKED (requires Professional+)
     * IMPORTANT: Checks user's actual role (not page context)
     */
    const isOrdersChartLocked = computed(() => {
        const userIsSupplier = userStore.roles.includes('supplier')
        return userIsSupplier && !canAccess('orders_dashboard')
    })

    /**
     * Check if connections chart is locked
     * For Supplier Lite: UNLOCKED (available for all)
     */
    const isConnectionsChartLocked = computed(() => {
        // Connections chart is ALWAYS available for all plans
        return false
    })

    /**
     * Check if partners/buyers chart is locked
     * For Supplier Lite: LOCKED (requires Professional+)
     * IMPORTANT: Checks user's actual role (not page context)
     */
    const isPartnersChartLocked = computed(() => {
        const userIsSupplier = userStore.roles.includes('supplier')
        return userIsSupplier && !canAccess('buyers_overview')
    })

    /**
     * Check if top products section is locked
     * For Supplier Lite: LOCKED (requires Professional+)
     */
    const isTopProductsLocked = computed(() => {
        return currentRole.value === 'supplier' && !canAccess('sales_dashboard')
    })

    /**
     * Get list of metrics that should be fetched (not locked)
     */
    const getFetchableMetrics = computed(() => {
        const metrics: string[] = []

        // Revenue/Primary Metric
        if (!isRevenueChartLocked.value) {
            metrics.push('revenue')
            metrics.push('primaryMetric')
        }

        // Orders
        if (!isOrdersChartLocked.value) {
            metrics.push('orders')
        }

        // Connections (always available)
        if (!isConnectionsChartLocked.value) {
            metrics.push('connections')
        }

        // Partners/Buyers
        if (!isPartnersChartLocked.value) {
            metrics.push('partners')
            metrics.push('buyers')
        }

        return metrics
    })

    /**
     * Check if a specific metric should be fetched
     */
    const shouldFetchMetric = (metricType: string): boolean => {
        return getFetchableMetrics.value.includes(metricType)
    }

    const getEmptyStateMessages = computed(() => {
        const roleType = currentRole.value || 'supplier'

        return {
            noProducts: t(`dashboardUser.${roleType}.noProducts`),
            noProductsDescription: t(`dashboardUser.${roleType}.noProductsDescription`),
            noPartners: t(
                `dashboardUser.${roleType}.${roleType === 'supplier' ? 'noBuyers' : 'noSuppliers'}`
            ),
            noPartnersDescription: t(
                `dashboardUser.${roleType}.${roleType === 'supplier' ? 'noBuyersDescription' : 'noSuppliersDescription'}`
            ),
        }
    })

    return {
        role: readonly(role),
        data: readonly(data),
        isLoading: readonly(isLoading),
        error: readonly(error),
        lastFetched: readonly(lastFetched),
        isInitialized: readonly(isInitialized),
        chartPeriods: readonly(chartPeriods),
        chartDateRanges: readonly(chartDateRanges),
        productsPage: readonly(productsPage),
        partnersPage: readonly(partnersPage),
        itemsPerPage: readonly(itemsPerPage),
        activeChartFilters: readonly(activeChartFilters),
        activeTableFilters: readonly(activeTableFilters),
        chartLoadingStates: readonly(chartLoadingStates),
        tableLoadingStates: readonly(tableLoadingStates),
        primaryMetricChartData: readonly(primaryMetricChartData),
        ordersChartData: readonly(ordersChartData),
        connectionsChartData: readonly(connectionsChartData),
        partnersChartData: readonly(partnersChartData),

        currentRole: readonly(currentRole),
        roleConfig: readonly(roleConfig),
        isDataStale: readonly(isDataStale),
        hasChartData: readonly(hasChartData),
        hasTableData: readonly(hasTableData),
        totalProducts: readonly(totalProducts),
        totalPartners: readonly(totalPartners),
        totalBuyers: readonly(totalBuyers),
        buyersPage: readonly(buyersPage),

        getLabels,
        shouldRefreshData,
        getMetricStats,
        getProductsTableData,
        getProductsPagination,
        getProductFilterOptions,
        getLastUpdatedTime,
        hasAnyData,
        getDashboardSummary,
        getEmptyStateMessages,
        currency: readonly(currency),

        // Chart Feature Locks
        isRevenueChartLocked: readonly(isRevenueChartLocked),
        isOrdersChartLocked: readonly(isOrdersChartLocked),
        isConnectionsChartLocked: readonly(isConnectionsChartLocked),
        isPartnersChartLocked: readonly(isPartnersChartLocked),
        isTopProductsLocked: readonly(isTopProductsLocked),

        // Helper Functions for Fetch Control
        getFetchableMetrics: readonly(getFetchableMetrics),
        shouldFetchMetric,

        initializeDashboard,
        loadDashboard,
        refreshChartMetric,
        updateChartPeriod,
        refreshProducts,
        refreshPartners,
        refreshBuyers,
        handleProductsPageChange,
        handlePartnersPageChange,
        handleBuyersPageChange,
        applyTableFilters,
        refreshDashboard,
        clearDashboard,
        retryOperation,
        formatCurrency,
        formatNumber,
        getAvailablePeriods,
        validateDateRange,
        getPathRole,

        resetError: dashboardStore.resetError,
    }
}
