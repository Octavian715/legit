<template>
    <div class="flex flex-col gap-3">
        <Breadcrumbs :items="breadcrumbItems" />

        <div v-if="error && !isRetrying" class="bg-white rounded-sm shadow p-8 text-center">
            <div class="mx-auto w-16 h-16 text-red-500 mb-4">
                <svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                </svg>
            </div>
            <h3 class="text-title1 font-bold text-gray-950 mb-2">
                {{ t('dashboardUser.errors.generic') }}
            </h3>
            <p class="text-subtitle1 text-gray-700 mb-6">{{ error.message }}</p>
            <Button color="red" variant="filled" @click="handleRetry">
                {{ t('dashboardUser.messages.tryAgain') }}
            </Button>
        </div>

        <div v-else class="dashboard-content mb-20">
            <!-- Charts Section -->
            <div class="mb-3">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <ChartSkeleton v-if="!hasLoadedOnce" />
                    <div v-else class="chart-container">
                        <Chart
                            ref="primaryMetricChartRef"
                            :title="
                                t(
                                    `dashboardUser.${currentRole}.${currentRole === 'supplier' ? 'revenue' : 'spent'}`
                                )
                            "
                            :main-value="getMetricStats.primaryMetric.value"
                            :chart-type="'bar'"
                            :data="primaryMetricChartData"
                            :chart-height="'140px'"
                            :show-info="true"
                            :is-loading="chartLoadingStates.primaryMetric"
                            :empty-message="t('dashboardUser.messages.noData')"
                            :currency="currency"
                            :value-type="'currency'"
                            :default-period="chartPeriods.primaryMetric"
                            :locked="isRevenueChartLocked"
                            :feature-name="'sales_dashboard'"
                            @period-change="
                                (period, dateRange) =>
                                    handlePeriodChange('primaryMetric', period, dateRange)
                            "
                        />
                    </div>

                    <ChartSkeleton v-if="!hasLoadedOnce" />
                    <div v-else class="chart-container">
                        <Chart
                            ref="ordersChartRef"
                            :title="t('dashboardUser.supplier.orders')"
                            :main-value="getMetricStats.orders.value"
                            :chart-type="'line'"
                            :data="ordersChartData"
                            :chart-height="'140px'"
                            :show-info="true"
                            :is-loading="chartLoadingStates.orders"
                            :empty-message="t('dashboardUser.messages.noData')"
                            :default-period="chartPeriods.orders"
                            :locked="isOrdersChartLocked"
                            :feature-name="'orders_dashboard'"
                            @period-change="
                                (period, dateRange) =>
                                    handlePeriodChange('orders', period, dateRange)
                            "
                        />
                    </div>

                    <ChartSkeleton v-if="!hasLoadedOnce" />
                    <div v-else class="chart-container">
                        <Chart
                            ref="connectionsChartRef"
                            :title="t('dashboardUser.supplier.connections')"
                            :main-value="getMetricStats.connections.value"
                            :chart-type="'line'"
                            :data="connectionsChartData"
                            :chart-height="'140px'"
                            :show-info="true"
                            :default-period="chartPeriods.connections"
                            :show-custom-option="true"
                            :is-loading="chartLoadingStates.connections"
                            :empty-message="t('dashboardUser.messages.noData')"
                            :locked="isConnectionsChartLocked"
                            @period-change="
                                (period, dateRange) =>
                                    handlePeriodChange('connections', period, dateRange)
                            "
                        />
                    </div>

                    <ChartSkeleton v-if="!hasLoadedOnce" />
                    <div v-else class="chart-container">
                        <Chart
                            ref="partnersChartRef"
                            :title="
                                t(
                                    `dashboardUser.${currentRole}.${currentRole === 'supplier' ? 'buyers' : 'suppliers'}`
                                )
                            "
                            :main-value="getMetricStats.partners.value"
                            :chart-type="'bar'"
                            :data="partnersChartData"
                            :chart-height="'140px'"
                            :show-info="true"
                            :default-period="chartPeriods.partners"
                            :show-custom-option="true"
                            :is-loading="chartLoadingStates.partners"
                            :empty-message="t('dashboardUser.messages.noData')"
                            :locked="isPartnersChartLocked"
                            :feature-name="'buyers_overview'"
                            @period-change="
                                (period, dateRange) =>
                                    handlePeriodChange('partners', period, dateRange)
                            "
                        />
                    </div>
                </div>
            </div>

            <!-- Tables Section -->
            <div class="space-y-3">
                <!-- Products Table (Always shown for both roles) -->
                <div v-if="!hasLoadedOnce">
                    <TableSkeleton :rows="10" :columns="8" />
                </div>
                <div v-else class="table-container bg-white rounded-sm shadow overflow-hidden py-2">
                    <div class="table-header pb-5">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="text-gray-950 font-bold text-title3">
                                    {{ t(`dashboardUser.${currentRole}.products`) }}
                                </h3>
                                <p class="text-gray-800 text-subtitle3 mt-1">
                                    {{
                                        totalProducts
                                            ? t('table.countProducts', {
                                                  count: formatNumber(totalProducts),
                                              })
                                            : t(`dashboardUser.${currentRole}.products`)
                                    }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="table-content">
                        <Table
                            :columns="productsTableColumns"
                            :rows="productsTableRows"
                            :loading="tableLoadingStates.products"
                            :pagination="false"
                            :show-column-borders="false"
                            :fixed-layout="true"
                            background="bg-white"
                            :locked="isProductsTableLocked"
                            :feature-name="'products_all'"
                        />
                    </div>
                </div>

                <!-- Buyers Table (Supplier only) -->
                <template v-if="currentRole === 'supplier'">
                    <div v-if="!hasLoadedOnce">
                        <TableSkeleton :rows="5" :columns="6" />
                    </div>
                    <div
                        v-else
                        class="table-container bg-white rounded-sm shadow overflow-hidden py-2"
                    >
                        <div class="table-header pb-5">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h3 class="text-gray-950 font-bold text-title3">
                                        {{ t('dashboardUser.supplier.buyersTable') }}
                                    </h3>
                                    <p class="text-gray-800 text-subtitle3 mt-1">
                                        {{
                                            totalBuyers
                                                ? t('table.countCompanies', {
                                                      count: formatNumber(totalBuyers),
                                                  })
                                                : t('dashboardUser.supplier.buyers')
                                        }}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div class="table-content">
                            <Table
                                :columns="buyersTableColumns"
                                :rows="buyersTableRows"
                                :loading="tableLoadingStates.buyers"
                                :pagination="false"
                                :show-column-borders="false"
                                :fixed-layout="true"
                                background="bg-white"
                                :locked="isBuyersTableLocked"
                                :feature-name="'buyers_all'"
                            />
                        </div>
                    </div>
                </template>

                <!-- Suppliers Table (Buyer only) -->
                <template v-if="currentRole === 'buyer'">
                    <div v-if="!hasLoadedOnce">
                        <TableSkeleton :rows="5" :columns="6" />
                    </div>
                    <div
                        v-else
                        class="table-container bg-white rounded-sm shadow overflow-hidden py-2"
                    >
                        <div class="table-header pb-5">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h3 class="text-gray-950 font-bold text-title3">
                                        {{ t('dashboardUser.buyer.suppliers') }}
                                    </h3>
                                    <p class="text-gray-800 text-subtitle3 mt-1">
                                        {{
                                            totalPartners
                                                ? t('table.countCompanies', {
                                                      count: formatNumber(totalPartners),
                                                  })
                                                : t('dashboardUser.buyer.suppliers')
                                        }}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div class="table-content">
                            <Table
                                :columns="suppliersTableColumns"
                                :rows="suppliersTableRows"
                                :loading="tableLoadingStates.partners"
                                :pagination="false"
                                :show-column-borders="false"
                                :fixed-layout="true"
                                background="bg-white"
                                :locked="isSuppliersTableLocked"
                                :feature-name="'suppliers_all'"
                            />
                        </div>
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import type { TableColumn, TableRow } from '~/types/ui/table'
    import type {
        ChartPeriodState,
        DashboardPeriodType,
        DashboardDateRange,
    } from '~/types/dashboard'
    import type { PeriodType, DateRange } from '~/types/chart'
    import type { UserRoleCode } from '~/types/auth'
    import { storeToRefs } from 'pinia'

    definePageMeta({
        middleware: ['role', 'dashboard'],
        layout: 'app',
    })

    const { t } = useI18n()
    const localePath = useLocalePath()
    const router = useRouter()
    const route = useRoute()
    const userStore = useUserStore()
    const dashboardStore = useDashboardStore()

    const { roles, isLiteSupplier } = storeToRefs(userStore)

    const {
        currentRole,
        isLoading,
        error,
        chartPeriods,
        chartLoadingStates,
        tableLoadingStates,
        totalProducts,
        totalPartners,
        totalBuyers,
        getMetricStats,
        getProductsTableData,
        updateChartPeriod,
        retryOperation,
        formatNumber,
        formatCurrency,
        primaryMetricChartData,
        ordersChartData,
        connectionsChartData,
        partnersChartData,
        currency,
        getPathRole,
        // Chart Feature Locks
        isRevenueChartLocked,
        isOrdersChartLocked,
        isConnectionsChartLocked,
        isPartnersChartLocked,
    } = useDashboard()

    const isRetrying = ref(false)
    const hasLoadedOnce = ref(false)

    const primaryMetricChartRef = ref()
    const ordersChartRef = ref()
    const connectionsChartRef = ref()
    const partnersChartRef = ref()

    const pathRole = computed(() => getPathRole() || 'supplier')

    const breadcrumbItems = computed(() => [
        { label: t('home'), to: localePath(`/${pathRole.value}/dashboard`) },
        {
            label: t('dashboardUser.title'),
            to: localePath(`/${pathRole.value}/dashboard`),
        },
    ])

    // ====================================
    // TABLE LOCKS - Feature Access Control
    // ====================================

    /**
     * Check if products table is locked
     * For Supplier Lite: LOCKED (requires Professional+)
     */
    const isProductsTableLocked = computed(() => {
        // Check if user is a supplier (regardless of which dashboard they're on)
        const userIsSupplier = userStore.isSupplier
        if (userIsSupplier) {
            // For suppliers, check products_all or sales_dashboard feature
            // For suppliers, check products_all feature
            return !userStore.canAccess('sales_dashboard')
            return !userStore.canAccess('sales_dashboard')
        }
        // Buyers always have access to products
        // Buyers always have access to products
        return false
        return false
    })

    /**
     * Check if buyers table is locked
     * For Supplier Lite: LOCKED (requires Professional+)
     */
    const isBuyersTableLocked = computed(() => {
        // Check if user is a supplier (regardless of which dashboard they're on)
        const userIsSupplier = userStore.isSupplier
        if (userIsSupplier) {
            if (currentRole.value === 'supplier') {
                return !userStore.canAccess('buyers_all')
                return !userStore.canAccess('buyers_all')
            }
        }
        return false
        return false
    })

    /**
     * Check if suppliers table is locked (for buyers)
     */
    const isSuppliersTableLocked = computed(() => {
        if (currentRole.value === 'supplier') {
            return !userStore.canAccess('suppliers_all')
        }
        return false
    })

    const canUserAccessRole = (userRoles: UserRoleCode[], targetRole: string): boolean => {
        if (userRoles.includes('admin')) {
            return true
        }

        if (targetRole === 'supplier' && userRoles.includes('supplier')) {
            return true
        }

        if (targetRole === 'buyer') {
            if (userRoles.includes('supplier') || userRoles.includes('buyer')) {
                return true
            }
        }

        return false
    }

    const convertChartPeriodToDashboardPeriod = (period: PeriodType): DashboardPeriodType => {
        const periodMap: Record<PeriodType, DashboardPeriodType> = {
            today: 'today',
            lastMonth: 'last_month',
            lastYear: 'last_year',
            custom: 'custom',
            yesterday: 'today',
            thisWeek: 'last_month',
            lastWeek: 'last_month',
            thisMonth: 'last_month',
            last30Days: 'last_month',
            last90Days: 'last_year',
            thisYear: 'last_year',
        }

        return periodMap[period] || 'last_month'
    }

    const convertChartDateRangeToDashboardDateRange = (
        dateRange?: DateRange
    ): DashboardDateRange | undefined => {
        if (!dateRange?.start || !dateRange?.end) {
            return undefined
        }

        return {
            start_date: dateRange.start,
            end_date: dateRange.end,
        }
    }

    const updateAllCharts = async () => {
        await nextTick()

        const charts = [
            primaryMetricChartRef.value,
            ordersChartRef.value,
            connectionsChartRef.value,
            partnersChartRef.value,
        ]

        charts.forEach((chartRef) => {
            if (chartRef?.updateChart) {
                setTimeout(() => chartRef.updateChart(), 50)
            }
        })
    }

    const handlePeriodChange = async (
        metricType: keyof ChartPeriodState,
        period: PeriodType,
        dateRange?: DateRange
    ): Promise<void> => {
        const dashboardPeriod = convertChartPeriodToDashboardPeriod(period)
        const dashboardDateRange = convertChartDateRangeToDashboardDateRange(dateRange)

        await updateChartPeriod(metricType, dashboardPeriod, dashboardDateRange)

        await nextTick()
        setTimeout(updateAllCharts, 100)
    }

    const handleRetry = async () => {
        isRetrying.value = true
        hasLoadedOnce.value = false
        try {
            await retryOperation()
            await nextTick()
            updateAllCharts()
        } finally {
            isRetrying.value = false
        }
    }

    const buyersTableColumns = computed<TableColumn[]>(() => [
        {
            key: 'company_id',
            label: t('table.companyId'),
            sortable: false,
            view: 'TableCellText',
            width: '100px',
            align: 'left',
        },
        {
            key: 'company_name',
            label: t('table.companyName'),
            sortable: false,
            view: 'TableCellCompany',
            width: '200px',
            align: 'left',
        },
        {
            key: 'country',
            label: t('table.country'),
            sortable: false,
            view: 'TableCellCountry',
            width: '130px',
            align: 'left',
        },
        {
            key: 'nr_of_skus',
            label: t('table.numberOfSKUs'),
            sortable: false,
            view: 'TableCellText',
            width: '100px',
            align: 'left',
        },
        {
            key: 'nr_of_orders',
            label: t('table.numberOfOrders'),
            sortable: false,
            view: 'TableCellText',
            width: '120px',
            align: 'left',
        },
        {
            key: 'total_amount',
            label: t('table.totalAmount'),
            sortable: false,
            view: 'TableCellText',
            classes: 'font-bold',
            width: '130px',
            align: 'right',
        },
    ])

    const buyersTableRows = computed<TableRow[]>(() => {
        const buyers = dashboardStore.data?.buyers?.data
        if (!buyers?.length) return []

        return buyers.map((buyer, index) => ({
            id: buyer.company_id.toString(),
            row: [
                buyer.company_id,
                { name: buyer.company_name },
                { name: buyer.country?.name || buyer.country, icon: buyer.country?.flag_url },
                formatNumber(buyer.nr_of_skus || 0),
                formatNumber(buyer.nr_of_orders || 0),
                formatCurrency(buyer.total_amount_raw || 0),
            ],
            originalData: buyer,
            index,
        }))
    })

    const suppliersTableColumns = computed<TableColumn[]>(() => [
        {
            key: 'company_id',
            label: t('table.companyId'),
            sortable: false,
            view: 'TableCellText',
            width: '100px',
            align: 'left',
        },
        {
            key: 'company_name',
            label: t('table.companyName'),
            sortable: false,
            view: 'TableCellCompany',
            width: '200px',
            align: 'left',
        },
        {
            key: 'country',
            label: t('table.country'),
            sortable: false,
            view: 'TableCellCountry',
            width: '130px',
            align: 'left',
        },
        {
            key: 'nr_of_skus',
            label: t('table.numberOfSKUs'),
            sortable: false,
            view: 'TableCellText',
            width: '100px',
            align: 'left',
        },
        {
            key: 'nr_of_orders',
            label: t('table.numberOfOrders'),
            sortable: false,
            view: 'TableCellText',
            width: '120px',
            align: 'left',
        },
        {
            key: 'total_amount',
            label: t('table.totalAmount'),
            sortable: false,
            view: 'TableCellText',
            classes: 'font-bold',
            width: '130px',
            align: 'right',
        },
    ])

    const suppliersTableRows = computed<TableRow[]>(() => {
        const suppliers = dashboardStore.data?.suppliers
        if (!suppliers?.data?.length) return []

        return suppliers.data.map((supplier, index) => ({
            id: supplier.company_id?.toString() || index.toString(),
            row: [
                supplier.company_id || '-',
                { name: supplier.company_name || '-' },
                {
                    name: supplier.country?.name || supplier.country || '-',
                    icon: supplier.country?.flag_url,
                },
                formatNumber(supplier.nr_of_skus || 0),
                formatNumber(supplier.nr_of_orders || 0),
                formatCurrency(supplier.total_amount_raw || 0),
            ],
            originalData: supplier,
            index,
        }))
    })

    const productsTableColumns = computed<TableColumn[]>(() => [
        {
            key: 'id',
            label: t('table.productId', 0),
            sortable: false,
            view: 'TableCellText',
            width: '100px',
            align: 'left',
        },
        {
            key: 'brand_name',
            label: t('table.brandName'),
            sortable: false,
            view: 'TableCellText',
            width: '150px',
            align: 'left',
        },
        {
            key: 'original_name',
            label: t('table.productName'),
            sortable: false,
            view: 'TableCellText',
            width: '200px',
            align: 'left',
        },
        {
            key: 'article_number',
            label: t('table.articleNumber'),
            sortable: false,
            view: 'TableCellText',
            width: '130px',
            align: 'left',
        },
        {
            key: 'weight',
            label: t('table.weight'),
            sortable: false,
            view: 'TableCellText',
            width: '100px',
            align: 'left',
        },
        {
            key: 'category',
            label: t('table.category'),
            sortable: false,
            view: 'TableCellText',
            width: '130px',
            align: 'left',
        },
        {
            key: 'total_units',
            label: t('table.soldUnits'),
            sortable: false,
            view: 'TableCellText',
            width: '100px',
            align: 'left',
        },
        {
            key: 'total_amount',
            label: t('table.totalAmount'),
            sortable: false,
            view: 'TableCellText',
            classes: 'font-bold',
            width: '120px',
            align: 'right',
        },
    ])

    const productsTableRows = computed<TableRow[]>(() => {
        const products = getProductsTableData.value
        if (!products?.length) return []

        return products.map((product, index) => ({
            id: product.id.toString(),
            row: [
                product.id,
                product.brand_name,
                product.original_name,
                product.article_number || '-',
                product.weight?.net ? `${product.weight.net} ${product.weight.symbol}` : '-',
                product.category || '-',
                formatNumber(product.total_units || 0),
                formatCurrency(product.total_amount || 0),
            ],
            originalData: product,
            index,
        }))
    })

    let refreshInterval: NodeJS.Timeout | null = null

    const extractRoleFromPath = (path: string): 'supplier' | 'buyer' | null => {
        const cleanPath = path.toLowerCase()
        const segments = cleanPath.split('/').filter(Boolean)

        for (const segment of segments) {
            if (segment === 'supplier') return 'supplier'
            if (segment === 'buyer') return 'buyer'
        }

        return null
    }

    const initializeDashboardData = async () => {
        const roleFromPath = getPathRole()

        if (!roleFromPath) {
            console.error('[Dashboard] Cannot determine role from path')
            return
        }

        if (!canUserAccessRole(roles.value, roleFromPath)) {
            console.error(`[Dashboard] User cannot access ${roleFromPath} functionality`)
            await router.push(localePath('/marketplace'))
            return
        }

        try {
            await dashboardStore.initialize(roleFromPath)

            if (isLiteSupplier.value) {
                await dashboardStore.loadDashboard({
                    primaryMetric: false,
                    orders: false,
                    connections: true,
                    partners: false,
                    products: false,
                    filters: false,
                    buyers: false,
                })
            } else {
                await dashboardStore.loadDashboard()
            }

            hasLoadedOnce.value = true

            await nextTick()
            setTimeout(updateAllCharts, 300)
        } catch (error) {
            console.error('[Dashboard] Initialization failed:', error)
        }
    }

    const handleRoleChange = async (newPath: string, oldPath: string) => {
        const newRole = extractRoleFromPath(newPath)
        const oldRole = extractRoleFromPath(oldPath)

        if (newRole && newRole !== oldRole && newRole !== dashboardStore.role) {
            try {
                hasLoadedOnce.value = false
                dashboardStore.clearDashboard()
                await dashboardStore.initialize(newRole)
                //await dashboardStore.loadDashboard()
                if (isLiteSupplier.value) {
                    await dashboardStore.loadDashboard({
                        primaryMetric: false,
                        orders: false,
                        connections: true,
                        partners: false,
                        products: false,
                        filters: false,
                        buyers: false,
                    })
                } else {
                    await dashboardStore.loadDashboard()
                }

                hasLoadedOnce.value = true

                await nextTick()
                setTimeout(updateAllCharts, 300)
            } catch (error) {
                console.error('[Dashboard] Role change failed:', error)
            }
        }
    }

    watch(
        () => route.path,
        (newPath, oldPath) => {
            if (newPath !== oldPath) {
                nextTick(() => {
                    handleRoleChange(newPath, oldPath)
                })
            }
        },
        { flush: 'post' }
    )

    watch(
        () => dashboardStore.data,
        async (newData) => {
            if (newData && hasLoadedOnce.value) {
                await nextTick()
                setTimeout(updateAllCharts, 150)
            }
        },
        { deep: true }
    )

    onMounted(async () => {
        await initializeDashboardData()

        refreshInterval = setInterval(
            () => {
                if (!isLoading.value && hasLoadedOnce.value) {
                    dashboardStore.loadDashboard({ force: false }).then(() => {
                        updateAllCharts()
                    })
                }
            },
            5 * 60 * 1000
        )
    })

    onUnmounted(() => {
        if (refreshInterval) {
            clearInterval(refreshInterval)
            refreshInterval = null
        }
    })

    defineExpose({
        updateAllCharts,
    })
</script>

<style scoped>
    .dashboard-content {
        @apply grid grid-cols-1;
    }

    .chart-container {
        @apply h-full;
    }

    .table-container {
        @apply overflow-hidden p-3;
    }

    @media (max-width: 768px) {
        .charts-grid .grid {
            @apply grid-cols-1 gap-3;
        }
    }
</style>
