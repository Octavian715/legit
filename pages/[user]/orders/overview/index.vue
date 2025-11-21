<template>
    <div class="flex flex-col gap-3">
        <Breadcrumbs :items="breadcrumbItems" />

        <!-- Error State -->
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
                {{ t('ordersDashboard.errors.generic') }}
            </h3>
            <p class="text-subtitle1 text-gray-700 mb-6">{{ error.message }}</p>
            <Button color="red" variant="filled" @click="handleRetry">
                {{ t('ordersDashboard.messages.tryAgain') }}
            </Button>
        </div>

        <!-- Main Content -->
        <div v-else class="orders-overview-content mb-20">
            <!-- Buyer View -->
            <template v-if="currentRole === 'buyer'">
                <!-- Charts Grid -->
                <div class="mb-3">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <!-- Number of Orders Chart - Full Width -->
                        <div class="lg:col-span-2">
                            <ChartSkeleton v-if="!hasLoadedOnce" />
                            <Chart
                                v-else
                                ref="buyerOrdersChartRef"
                                :title="t('ordersDashboard.buyer.numberOfOrders')"
                                :main-value="totalBuyerOrders"
                                chart-type="bar"
                                :data="buyerOrdersChartData"
                                :show-info="true"
                                :is-loading="isBuyerLoading"
                                :empty-message="t('ordersDashboard.messages.noData')"
                                :default-period="chartPeriods.buyerOrders"
                                @period-change="
                                    (period, dateRange) =>
                                        handlePeriodChange('buyerOrders', period, dateRange)
                                "
                            />
                        </div>

                        <!-- Total Spent by Category Chart -->
                        <div class="chart-container">
                            <ChartSkeleton v-if="!hasLoadedOnce" />
                            <Chart
                                v-else
                                ref="buyerSpentCategoryChartRef"
                                :title="t('ordersDashboard.buyer.spentByCategory')"
                                :main-value="buyerSpentTotal"
                                chart-type="doughnut"
                                :data="buyerSpentCategoryChartData"
                                :legend-items="buyerCategoryLegendItems"
                                :show-info="true"
                                :is-loading="isBuyerLoading"
                                :empty-message="t('ordersDashboard.messages.noData')"
                                :currency="currency"
                                value-type="currency"
                                :default-period="chartPeriods.buyerSpentCategory"
                                @period-change="
                                    (period, dateRange) =>
                                        handlePeriodChange('buyerSpentCategory', period, dateRange)
                                "
                            />
                        </div>

                        <!-- Total Spent by Supplier Chart -->
                        <div class="chart-container">
                            <ChartSkeleton v-if="!hasLoadedOnce" />
                            <Chart
                                v-else
                                ref="buyerSpentSupplierChartRef"
                                :title="t('ordersDashboard.buyer.spentBySupplier')"
                                :main-value="buyerSpentTotal"
                                chart-type="doughnut"
                                :data="buyerSpentSupplierChartData"
                                :legend-items="buyerSupplierLegendItems"
                                :show-info="true"
                                :is-loading="isBuyerLoading"
                                :empty-message="t('ordersDashboard.messages.noData')"
                                :currency="currency"
                                value-type="currency"
                                :default-period="chartPeriods.buyerSpentSupplier"
                                @period-change="
                                    (period, dateRange) =>
                                        handlePeriodChange('buyerSpentSupplier', period, dateRange)
                                "
                            />
                        </div>
                    </div>
                </div>

                <!-- Order Status Stats - BUYER -->
                <ProductStatsSkeleton v-if="!hasLoadedOnce" />
                <div v-else-if="buyerOrdersStats?.length" class="mb-3">
                    <div class="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        <NuxtLink
                            v-for="(stat, index) in buyerOrdersStats"
                            :key="stat.status_key"
                            :to="localePath(`/${currentRole}/orders/all?tab=${stat.status_key}`)"
                            class="stat-card group rounded-md p-4 bg-white relative overflow-hidden border border-transparent hover:border-blue-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 opacity-0 animate-fade-in"
                            :style="{ animationDelay: `${index * 50}ms` }"
                        >
                            <div class="flex items-center justify-between gap-3">
                                <div class="flex-1">
                                    <h4
                                        class="text-subtitle2 text-gray-800 mb-1 group-hover:text-blue-600 transition-colors duration-300"
                                    >
                                        {{ stat.status_name }}
                                    </h4>
                                    <p
                                        class="text-h2 font-bold text-gray-950 group-hover:text-blue-700 transition-colors duration-300"
                                    >
                                        {{ stat.count.toLocaleString() }}
                                    </p>
                                </div>

                                <div class="relative flex-shrink-0">
                                    <svg
                                        class="h-9 w-9 text-gray-800 transition-all duration-300 group-hover:text-blue-600 group-hover:translate-x-2 group-hover:-translate-y-2 group-hover:scale-125 relative z-10"
                                    >
                                        <use :xlink:href="`/sprite.svg#redirect`"></use>
                                    </svg>
                                </div>
                            </div>

                            <div
                                class="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-blue-50/30 to-red-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md -z-10"
                            />

                            <div
                                class="absolute inset-0 border border-transparent group-hover:border-blue-300 rounded-md transition-all duration-300"
                            />
                        </NuxtLink>
                    </div>
                </div>
            </template>

            <!-- Supplier View -->
            <template v-if="currentRole === 'supplier'">
                <!-- Charts Grid -->
                <div class="mb-3">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <!-- Orders by Country Chart -->
                        <ChartSkeleton v-if="!hasLoadedOnce" />
                        <div v-else class="chart-container">
                            <Chart
                                ref="supplierOrdersByCountryChartRef"
                                :title="t('ordersDashboard.supplier.ordersByCountry')"
                                :main-value="totalSupplierOrdersByCountry"
                                chart-type="doughnut"
                                :data="supplierOrdersByCountryChartData"
                                :legend-items="supplierCountryLegendItems"
                                :show-info="true"
                                :is-loading="isSupplierLoading"
                                :empty-message="t('ordersDashboard.messages.noData')"
                                :default-period="chartPeriods.supplierOrdersByCountry"
                                @period-change="
                                    (period, dateRange) =>
                                        handlePeriodChange(
                                            'supplierOrdersByCountry',
                                            period,
                                            dateRange
                                        )
                                "
                            />
                        </div>

                        <!-- Number of Orders Chart -->
                        <ChartSkeleton v-if="!hasLoadedOnce" />
                        <div v-else class="chart-container">
                            <Chart
                                ref="supplierOrdersChartRef"
                                :title="t('ordersDashboard.supplier.numberOfOrders')"
                                :main-value="totalSupplierOrders"
                                chart-type="bar"
                                :data="supplierOrdersChartData"
                                :show-info="true"
                                :is-loading="isSupplierLoading"
                                :empty-message="t('ordersDashboard.messages.noData')"
                                :default-period="chartPeriods.supplierOrders"
                                @period-change="
                                    (period, dateRange) =>
                                        handlePeriodChange('supplierOrders', period, dateRange)
                                "
                            />
                        </div>

                        <!-- Average Shopping Cart Chart -->
                        <ChartSkeleton v-if="!hasLoadedOnce" />
                        <div v-else class="chart-container">
                            <Chart
                                ref="supplierAverageCartChartRef"
                                :title="t('ordersDashboard.supplier.averageCart')"
                                :main-value="supplierAverageCart"
                                chart-type="line"
                                :data="supplierAverageCartChartData"
                                :show-info="true"
                                :is-loading="isSupplierLoading"
                                :empty-message="t('ordersDashboard.messages.noData')"
                                :currency="currency"
                                value-type="currency"
                                :default-period="chartPeriods.supplierAverageCart"
                                @period-change="
                                    (period, dateRange) =>
                                        handlePeriodChange('supplierAverageCart', period, dateRange)
                                "
                            />
                        </div>

                        <!-- Orders Timeline Chart -->
                        <ChartSkeleton v-if="!hasLoadedOnce" />
                        <div v-else class="chart-container">
                            <Chart
                                ref="supplierOrdersTimelineChartRef"
                                :title="t('ordersDashboard.supplier.ordersTimeline')"
                                :main-value="totalSupplierOrders"
                                chart-type="line"
                                :data="supplierOrdersTimelineChartData"
                                :show-info="true"
                                :is-loading="isSupplierLoading"
                                :empty-message="t('ordersDashboard.messages.noData')"
                                :default-period="chartPeriods.supplierOrdersTimeline"
                                @period-change="
                                    (period, dateRange) =>
                                        handlePeriodChange(
                                            'supplierOrdersTimeline',
                                            period,
                                            dateRange
                                        )
                                "
                            />
                        </div>
                    </div>
                </div>

                <!-- Order Status Stats - SUPPLIER -->
                <ProductStatsSkeleton v-if="!hasLoadedOnce" />
                <div v-else-if="supplierOrdersStats?.length" class="mb-3">
                    <div class="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        <NuxtLink
                            v-for="(stat, index) in supplierOrdersStats"
                            :key="stat.status_key"
                            :to="localePath(`/${currentRole}/orders/all?tab=${stat.status_key}`)"
                            class="stat-card group rounded-md p-4 bg-white relative overflow-hidden border border-transparent hover:border-blue-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 opacity-0 animate-fade-in"
                            :style="{ animationDelay: `${index * 50}ms` }"
                        >
                            <div class="flex items-center justify-between gap-3">
                                <div class="flex-1">
                                    <h4
                                        class="text-subtitle2 text-gray-800 mb-1 group-hover:text-blue-600 transition-colors duration-300"
                                    >
                                        {{ stat.status_name }}
                                    </h4>
                                    <p
                                        class="text-h2 font-bold text-gray-950 group-hover:text-blue-700 transition-colors duration-300"
                                    >
                                        {{ stat.count.toLocaleString() }}
                                    </p>
                                </div>

                                <div class="relative flex-shrink-0">
                                    <svg
                                        class="h-9 w-9 text-gray-800 transition-all duration-300 group-hover:text-blue-600 group-hover:translate-x-2 group-hover:-translate-y-2 group-hover:scale-125 relative z-10"
                                    >
                                        <use :xlink:href="`/sprite.svg#redirect`"></use>
                                    </svg>
                                </div>
                            </div>

                            <div
                                class="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-blue-50/30 to-red-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md -z-10"
                            />

                            <div
                                class="absolute inset-0 border border-transparent group-hover:border-blue-300 rounded-md transition-all duration-300"
                            />
                        </NuxtLink>
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
    import type { PeriodType, DateRange, ChartData, LegendItem } from '~/types/chart'
    import { storeToRefs } from 'pinia'

    definePageMeta({
        middleware: ['role'],
        layout: 'app',
    })

    const { t } = useI18n()
    const localePath = useLocalePath()
    const route = useRoute()
    const userStore = useUserStore()

    const { defaultCurrency } = storeToRefs(userStore)

    const {
        isBuyerLoading,
        isSupplierLoading,
        error,
        buyerOrdersChart,
        buyerOrdersStats,
        buyerSpentCategoryChart,
        buyerSpentSupplierChart,
        supplierOrdersChart,
        supplierOrdersStats,
        supplierOrdersByCountryChart,
        supplierAverageCartChart,
        totalBuyerOrders,
        totalSupplierOrders,
        totalSupplierOrdersByCountry,
        buyerSpentTotal,
        supplierAverageCart,
        loadBuyerOrdersChart,
        loadBuyerOrdersStats,
        loadBuyerSpentCategoryChart,
        loadBuyerSpentSupplierChart,
        loadSupplierOrdersChart,
        loadSupplierOrdersStats,
        loadSupplierOrdersByCountryChart,
        loadSupplierAverageCartChart,
        buildChartFilters,
        formatCurrency,
    } = useOrdersDashboard()

    const isRetrying = ref(false)
    const hasLoadedOnce = ref(false)

    const buyerOrdersChartRef = ref()
    const buyerSpentCategoryChartRef = ref()
    const buyerSpentSupplierChartRef = ref()
    const supplierOrdersChartRef = ref()
    const supplierOrdersByCountryChartRef = ref()
    const supplierAverageCartChartRef = ref()
    const supplierOrdersTimelineChartRef = ref()

    const chartPeriods = ref({
        buyerOrders: 'today' as PeriodType,
        buyerSpentCategory: 'today' as PeriodType,
        buyerSpentSupplier: 'today' as PeriodType,
        supplierOrders: 'today' as PeriodType,
        supplierOrdersByCountry: 'today' as PeriodType,
        supplierAverageCart: 'today' as PeriodType,
        supplierOrdersTimeline: 'today' as PeriodType,
    })

    const currentRole = computed(() => pathRole.value)

    const currency = computed(() => defaultCurrency.value || { code: 'USD', symbol: '$' })

    const pathRole = computed(() => {
        const path = route.path.toLowerCase()
        if (path.includes('/supplier/')) return 'supplier'
        if (path.includes('/buyer/')) return 'buyer'
        return 'supplier'
    })

    const breadcrumbItems = computed(() => [
        { label: t('home'), to: localePath(`/${pathRole.value}/dashboard`) },
        {
            label: t('ordersDashboard.title'),
            to: localePath(`/${pathRole.value}/orders/overview`),
        },
    ])

    const buyerOrdersChartData = computed<ChartData>(() => {
        if (!buyerOrdersChart.value?.chart_data) {
            return { labels: [], datasets: [] }
        }

        return {
            labels: buyerOrdersChart.value.chart_data.map((item) => item.date),
            datasets: [
                {
                    label: t('ordersDashboard.orders'),
                    data: buyerOrdersChart.value.chart_data.map((item) => item.count),
                    backgroundColor: '#3B82F680',
                    borderColor: '#3B82F6',
                    borderWidth: 1,
                    borderRadius: 4,
                },
            ],
        }
    })

    const buyerSpentCategoryChartData = computed<ChartData>(() => {
        if (!buyerSpentCategoryChart.value?.category_breakdown?.length) {
            return { labels: [], datasets: [] }
        }

        const colors = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

        return {
            labels: buyerSpentCategoryChart.value.category_breakdown.map(
                (item) => item.category_name
            ),
            datasets: [
                {
                    data: buyerSpentCategoryChart.value.category_breakdown.map(
                        (item) => item.total
                    ),
                    backgroundColor: colors,
                    borderWidth: 0,
                },
            ],
        }
    })

    const buyerCategoryLegendItems = computed<LegendItem[]>(() => {
        if (!buyerSpentCategoryChart.value?.category_breakdown?.length) return []

        const colors = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']
        const total = buyerSpentCategoryChart.value.category_breakdown.reduce(
            (sum, item) => sum + item.total,
            0
        )

        return buyerSpentCategoryChart.value.category_breakdown.map((item, index) => ({
            id: item.category_id.toString(),
            label: item.category_name,
            value: item.total,
            percentage: total > 0 ? (item.total / total) * 100 : 0,
            color: colors[index % colors.length],
            isActive: true,
        }))
    })

    const buyerSpentSupplierChartData = computed<ChartData>(() => {
        if (!buyerSpentSupplierChart.value?.supplier_breakdown?.length) {
            return { labels: [], datasets: [] }
        }

        const colors = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

        return {
            labels: buyerSpentSupplierChart.value.supplier_breakdown.map(
                (item) => item.supplier_name
            ),
            datasets: [
                {
                    data: buyerSpentSupplierChart.value.supplier_breakdown.map(
                        (item) => item.total
                    ),
                    backgroundColor: colors,
                    borderWidth: 0,
                },
            ],
        }
    })

    const buyerSupplierLegendItems = computed<LegendItem[]>(() => {
        if (!buyerSpentSupplierChart.value?.supplier_breakdown?.length) return []

        const colors = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']
        const total = buyerSpentSupplierChart.value.supplier_breakdown.reduce(
            (sum, item) => sum + item.total,
            0
        )

        return buyerSpentSupplierChart.value.supplier_breakdown.map((item, index) => ({
            id: item.supplier_id.toString(),
            label: item.supplier_name,
            value: item.total,
            percentage: total > 0 ? (item.total / total) * 100 : 0,
            color: colors[index % colors.length],
            isActive: true,
        }))
    })

    const supplierOrdersChartData = computed<ChartData>(() => {
        if (!supplierOrdersChart.value?.chart_data) {
            return { labels: [], datasets: [] }
        }

        return {
            labels: supplierOrdersChart.value.chart_data.map((item) => item.period || item.date),
            datasets: [
                {
                    label: t('ordersDashboard.orders'),
                    data: supplierOrdersChart.value.chart_data.map((item) => item.value || 0),
                    backgroundColor: '#22C55E80',
                    borderColor: '#22C55E',
                    borderWidth: 1,
                    borderRadius: 4,
                },
            ],
        }
    })

    const supplierOrdersTimelineChartData = computed<ChartData>(() => {
        if (!supplierOrdersChart.value?.chart_data) {
            return { labels: [], datasets: [] }
        }

        return {
            labels: supplierOrdersChart.value.chart_data.map((item) => item.period || item.date),
            datasets: [
                {
                    label: t('ordersDashboard.orders'),
                    data: supplierOrdersChart.value.chart_data.map((item) => item.value || 0),
                    borderColor: '#F59E0B',
                    backgroundColor: '#F59E0B20',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                },
            ],
        }
    })

    const supplierOrdersByCountryChartData = computed<ChartData>(() => {
        if (!supplierOrdersByCountryChart.value?.country_breakdown?.length) {
            return { labels: [], datasets: [] }
        }

        const colors = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

        return {
            labels: supplierOrdersByCountryChart.value.country_breakdown.map(
                (item) => item.country_name
            ),
            datasets: [
                {
                    data: supplierOrdersByCountryChart.value.country_breakdown.map(
                        (item) => item.total_orders
                    ),
                    backgroundColor: colors,
                    borderWidth: 0,
                },
            ],
        }
    })

    const supplierCountryLegendItems = computed<LegendItem[]>(() => {
        if (!supplierOrdersByCountryChart.value?.country_breakdown?.length) return []

        const colors = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']
        const total = supplierOrdersByCountryChart.value.country_breakdown.reduce(
            (sum, item) => sum + item.total_orders,
            0
        )

        return supplierOrdersByCountryChart.value.country_breakdown.map((item, index) => ({
            id: item.country_id.toString(),
            label: item.country_name,
            value: item.total_orders,
            percentage: total > 0 ? (item.total_orders / total) * 100 : 0,
            color: colors[index % colors.length],
            isActive: true,
        }))
    })

    const supplierAverageCartChartData = computed<ChartData>(() => {
        if (!supplierAverageCartChart.value?.chart_data) {
            return { labels: [], datasets: [] }
        }

        return {
            labels: supplierAverageCartChart.value.chart_data.map(
                (item) => item.period || item.date
            ),
            datasets: [
                {
                    label: t('ordersDashboard.averageCart'),
                    data: supplierAverageCartChart.value.chart_data.map(
                        (item) => item.average_value ?? item.value ?? 0
                    ),
                    borderColor: '#8B5CF6',
                    backgroundColor: '#8B5CF620',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                },
            ],
        }
    })

    const handlePeriodChange = async (
        chartType: keyof typeof chartPeriods.value,
        period: PeriodType,
        dateRange?: DateRange
    ) => {
        chartPeriods.value[chartType] = period

        const filters = dateRange
            ? buildChartFilters(undefined, {
                  start_date: dateRange.start,
                  end_date: dateRange.end,
              })
            : buildChartFilters(period as any)

        if (chartType === 'buyerOrders') {
            await loadBuyerOrdersChart(filters)
        } else if (chartType === 'buyerSpentCategory') {
            await loadBuyerSpentCategoryChart(filters)
        } else if (chartType === 'buyerSpentSupplier') {
            await loadBuyerSpentSupplierChart(filters)
        } else if (chartType === 'supplierOrders' || chartType === 'supplierOrdersTimeline') {
            await loadSupplierOrdersChart(filters)
        } else if (chartType === 'supplierOrdersByCountry') {
            await loadSupplierOrdersByCountryChart(filters)
        } else if (chartType === 'supplierAverageCart') {
            await loadSupplierAverageCartChart(filters)
        }

        updateAllCharts()
    }

    const updateAllCharts = async () => {
        await nextTick()

        const charts = [
            buyerOrdersChartRef.value,
            buyerSpentCategoryChartRef.value,
            buyerSpentSupplierChartRef.value,
            supplierOrdersChartRef.value,
            supplierOrdersByCountryChartRef.value,
            supplierAverageCartChartRef.value,
            supplierOrdersTimelineChartRef.value,
        ]

        charts.forEach((chartRef) => {
            if (chartRef?.updateChart) {
                setTimeout(() => chartRef.updateChart(), 50)
            }
        })
    }

    const handleRetry = async () => {
        isRetrying.value = true
        hasLoadedOnce.value = false
        try {
            await initializeData()
        } finally {
            isRetrying.value = false
        }
    }

    const initializeData = async () => {
        if (currentRole.value === 'buyer') {
            await Promise.all([
                loadBuyerOrdersChart(buildChartFilters(chartPeriods.value.buyerOrders)),
                loadBuyerOrdersStats(),
                loadBuyerSpentCategoryChart(
                    buildChartFilters(chartPeriods.value.buyerSpentCategory)
                ),
                loadBuyerSpentSupplierChart(
                    buildChartFilters(chartPeriods.value.buyerSpentSupplier)
                ),
            ])
        } else {
            await Promise.all([
                loadSupplierOrdersChart(buildChartFilters(chartPeriods.value.supplierOrders)),
                loadSupplierOrdersStats(),
                loadSupplierOrdersByCountryChart(
                    buildChartFilters(chartPeriods.value.supplierOrdersByCountry)
                ),
                loadSupplierAverageCartChart(
                    buildChartFilters(chartPeriods.value.supplierAverageCart)
                ),
            ])
        }

        hasLoadedOnce.value = true
        await nextTick()
        setTimeout(updateAllCharts, 300)
    }

    onMounted(async () => {
        await initializeData()
    })
</script>

<style scoped>
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .animate-fade-in {
        animation: fadeIn 0.5s ease-out forwards;
    }

    .fade-list-enter-active,
    .fade-list-leave-active {
        transition: all 0.5s ease;
    }

    .fade-list-enter-from,
    .fade-list-leave-to {
        opacity: 0;
        transform: translateY(10px);
    }

    .orders-overview-content {
        @apply grid grid-cols-1;
    }

    .chart-container {
        @apply h-full;
    }

    .products-section {
        @apply mt-3;
    }

    @media (max-width: 768px) {
        .grid {
            @apply grid-cols-1 gap-3;
        }
    }
</style>
