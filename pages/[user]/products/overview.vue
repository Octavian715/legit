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
                {{ t('productsDashboard.errors.generic') }}
            </h3>
            <p class="text-subtitle1 text-gray-700 mb-6">{{ error }}</p>
            <Button color="red" variant="filled" @click="handleRetry">
                {{ t('productsDashboard.messages.tryAgain') }}
            </Button>
        </div>

        <!-- Loading State -->
        <div v-else-if="!hasLoadedOnce" class="space-y-3">
            <ChartSkeleton />
            <ChartSkeleton v-if="currentRole === 'supplier'" />
        </div>

        <!-- Main Content -->
        <div v-else class="products-all-content mb-20">
            <!-- Supplier View -->
            <template v-if="currentRole === 'supplier'">
                <div class="mb-3">
                    <div class="grid grid-cols-1 gap-3">
                        <div class="chart-container">
                            <Chart
                                ref="supplierNewProductsChartRef"
                                :title="t('productsDashboard.supplier.newProducts')"
                                :main-value="supplierNewProductsCount"
                                chart-type="bar"
                                :data="supplierNewProductsChartData"
                                :show-info="true"
                                :is-loading="isSupplierLoading"
                                :empty-message="t('productsDashboard.messages.noData')"
                                :default-period="chartPeriods.supplierNewProducts"
                                @period-change="handleSupplierNewProductsPeriodChange"
                            />
                        </div>

                        <div class="chart-container">
                            <Chart
                                ref="supplierTotalProductsChartRef"
                                :title="t('productsDashboard.supplier.totalProducts')"
                                :main-value="supplierTotalProductsCount"
                                chart-type="doughnut"
                                :data="supplierTotalProductsChartData"
                                :legend-items="supplierCategoryLegendItems"
                                :show-info="true"
                                :is-loading="isSupplierLoading"
                                :empty-message="t('productsDashboard.messages.noData')"
                                :default-period="chartPeriods.supplierTotalProducts"
                                @period-change="handleSupplierTotalProductsPeriodChange"
                            />
                        </div>
                    </div>
                </div>

                <CompanyProducts
                    :products="supplierProductCategories"
                    :is-loading="isSupplierLoading"
                    :empty-title="t('productsDashboard.messages.noCategories')"
                    :empty-description="t('productsDashboard.messages.noCategoriesDescription')"
                    class="p-3"
                />
            </template>

            <!-- Buyer View -->
            <template v-if="currentRole === 'buyer'">
                <div class="mb-3">
                    <div class="grid grid-cols-1 gap-3">
                        <div class="chart-container">
                            <Chart
                                ref="buyerTotalProductsChartRef"
                                :title="t('productsDashboard.buyer.totalProducts')"
                                :main-value="buyerTotalProductsCount"
                                chart-type="doughnut"
                                :data="buyerTotalProductsChartData"
                                :legend-items="buyerCategoryLegendItems"
                                :show-info="true"
                                :is-loading="isBuyerLoading"
                                :empty-message="t('productsDashboard.messages.noData')"
                                :default-period="chartPeriods.buyerTotalProducts"
                                @period-change="handleBuyerPeriodChange"
                            />
                        </div>
                    </div>
                </div>

                <div class="p-3">
                    <CompanyProducts
                        :products="buyerProductCategories"
                        :is-loading="isBuyerLoading"
                        :empty-title="t('productsDashboard.messages.noCategories')"
                        :empty-description="t('productsDashboard.messages.noCategoriesDescription')"
                    />
                </div>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
    import type { PeriodType, DateRange, ChartData, LegendItem } from '~/types/chart'
    import { useDashboardProductStore } from '~/stores/dashboardProduct'

    definePageMeta({
        middleware: ['role'],
        layout: 'app',
    })

    const { t } = useI18n()
    const localePath = useLocalePath()
    const route = useRoute()
    const dashboardProductStore = useDashboardProductStore()

    const isRetrying = ref(false)
    const hasLoadedOnce = ref(false)
    const isBuyerLoading = ref(false)
    const isSupplierLoading = ref(false)
    const error = ref<string | null>(null)

    const pathRole = computed(() => {
        const path = route.path.toLowerCase()
        if (path.includes('/supplier/')) return 'supplier'
        if (path.includes('/buyer/')) return 'buyer'
        return 'supplier'
    })

    const currentRole = computed(() => pathRole.value)

    const chartPeriods = ref({
        buyerTotalProducts: 'today' as PeriodType,
        supplierNewProducts: 'today' as PeriodType,
        supplierTotalProducts: 'today' as PeriodType,
    })

    const buyerTotalProductsChartRef = ref()
    const supplierNewProductsChartRef = ref()
    const supplierTotalProductsChartRef = ref()

    const breadcrumbItems = computed(() => [
        { label: t('home'), to: localePath(`/${pathRole.value}/dashboard`) },

        {
            label: t('navigation.overview'),
            to: localePath(`/${pathRole.value}/products/all`),
        },
    ])

    const buyerTotalProductsCount = computed(() => {
        return dashboardProductStore.buyerTotalProducts?.total || 0
    })

    const supplierNewProductsCount = computed(() => {
        return dashboardProductStore.supplierNewProducts?.total || 0
    })

    const supplierTotalProductsCount = computed(() => {
        return dashboardProductStore.supplierTotalProducts?.total || 0
    })

    const buyerProductCategories = computed(() => {
        const categories = dashboardProductStore.buyerProductStats?.categories || []
        return categories.map((cat) => ({
            name: cat.category_name,
            slug: cat.category_slug,
            icon: cat.category_icon_raw_svg,
            productCount: cat.total,
        }))
    })

    const supplierProductCategories = computed(() => {
        const categories = dashboardProductStore.dashboardProductStats?.categories || []
        return categories.map((cat) => ({
            name: cat.category_name,
            slug: cat.category_slug,
            icon: cat.category_icon_raw_svg,
            productCount: cat.total,
        }))
    })

    const buyerTotalProductsChartData = computed<ChartData>(() => {
        if (!dashboardProductStore.buyerTotalProducts?.categories?.length) {
            return { labels: [], datasets: [] }
        }

        const colors = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']
        const categories = dashboardProductStore.buyerTotalProducts.categories

        return {
            labels: categories.map((cat) => cat.category_name),
            datasets: [
                {
                    data: categories.map((cat) => cat.total),
                    backgroundColor: colors,
                    borderWidth: 0,
                },
            ],
        }
    })

    const buyerCategoryLegendItems = computed<LegendItem[]>(() => {
        if (!dashboardProductStore.buyerTotalProducts?.categories?.length) return []

        const colors = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']
        const categories = dashboardProductStore.buyerTotalProducts.categories
        const total = categories.reduce((sum, cat) => sum + cat.total, 0)

        return categories.map((cat, index) => ({
            id: cat.category_id?.toString() || `cat-${index}`,
            label: cat.category_name,
            value: cat.total,
            percentage: total > 0 ? (cat.total / total) * 100 : 0,
            color: colors[index % colors.length],
            isActive: true,
        }))
    })

    const supplierNewProductsChartData = computed<ChartData>(() => {
        if (!dashboardProductStore.supplierNewProducts?.chart_data?.length) {
            return { labels: [], datasets: [] }
        }

        const chartData = dashboardProductStore.supplierNewProducts.chart_data

        return {
            labels: chartData.map((item) => item.period),
            datasets: [
                {
                    label: t('productsDashboard.newProducts'),
                    data: chartData.map((item) => item.value),
                    backgroundColor: '#22C55E80',
                    borderColor: '#22C55E',
                    borderWidth: 1,
                    borderRadius: 4,
                },
            ],
        }
    })

    const supplierTotalProductsChartData = computed<ChartData>(() => {
        if (!dashboardProductStore.supplierTotalProducts?.categories?.length) {
            return { labels: [], datasets: [] }
        }

        const colors = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']
        const categories = dashboardProductStore.supplierTotalProducts.categories

        return {
            labels: categories.map((cat) => cat.category_name),
            datasets: [
                {
                    data: categories.map((cat) => cat.total),
                    backgroundColor: colors,
                    borderWidth: 0,
                },
            ],
        }
    })

    const supplierCategoryLegendItems = computed<LegendItem[]>(() => {
        if (!dashboardProductStore.supplierTotalProducts?.categories?.length) return []

        const colors = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']
        const categories = dashboardProductStore.supplierTotalProducts.categories
        const total = categories.reduce((sum, cat) => sum + cat.total, 0)

        return categories.map((cat, index) => ({
            id: cat.category_id?.toString() || `cat-${index}`,
            label: cat.category_name,
            value: cat.total,
            percentage: total > 0 ? (cat.total / total) * 100 : 0,
            color: colors[index % colors.length],
            isActive: true,
        }))
    })

    const handleBuyerPeriodChange = async (period: PeriodType, dateRange?: DateRange) => {
        chartPeriods.value.buyerTotalProducts = period

        const filters = dateRange
            ? {
                  start_date: dateRange.start,
                  end_date: dateRange.end,
              }
            : {}

        try {
            isBuyerLoading.value = true
            await dashboardProductStore.fetchBuyerTotalProducts(filters)
            await dashboardProductStore.fetchBuyerProductStats()
            await nextTick()
            setTimeout(() => {
                buyerTotalProductsChartRef.value?.updateChart?.()
            }, 100)
        } catch (err: any) {
            console.error('[Products All] Buyer period change error:', err)
            error.value = err.message || t('productsDashboard.errors.fetchFailed')
        } finally {
            isBuyerLoading.value = false
        }
    }

    const handleSupplierNewProductsPeriodChange = async (
        period: PeriodType,
        dateRange?: DateRange
    ) => {
        chartPeriods.value.supplierNewProducts = period

        const filters = dateRange
            ? {
                  start_date: dateRange.start,
                  end_date: dateRange.end,
              }
            : { period: period === 'custom' ? 'today' : (period as any) }

        try {
            isSupplierLoading.value = true
            await dashboardProductStore.fetchSupplierNewProducts(filters)
            await nextTick()
            setTimeout(() => {
                supplierNewProductsChartRef.value?.updateChart?.()
            }, 100)
        } catch (err: any) {
            console.error('[Products All] Supplier new products period change error:', err)
            error.value = err.message || t('productsDashboard.errors.fetchFailed')
        } finally {
            isSupplierLoading.value = false
        }
    }

    const handleSupplierTotalProductsPeriodChange = async (
        period: PeriodType,
        dateRange?: DateRange
    ) => {
        chartPeriods.value.supplierTotalProducts = period

        const filters = dateRange
            ? {
                  start_date: dateRange.start,
                  end_date: dateRange.end,
              }
            : {}

        try {
            isSupplierLoading.value = true
            await dashboardProductStore.fetchSupplierTotalProducts(filters)
            await dashboardProductStore.fetchDashboardProductStats()
            await nextTick()
            setTimeout(() => {
                supplierTotalProductsChartRef.value?.updateChart?.()
            }, 100)
        } catch (err: any) {
            console.error('[Products All] Supplier total products period change error:', err)
            error.value = err.message || t('productsDashboard.errors.fetchFailed')
        } finally {
            isSupplierLoading.value = false
        }
    }

    const handleRetry = async () => {
        isRetrying.value = true
        hasLoadedOnce.value = false
        error.value = null
        try {
            await initializeData()
        } finally {
            isRetrying.value = false
        }
    }

    const initializeData = async () => {
        try {
            if (currentRole.value === 'buyer') {
                isBuyerLoading.value = true
                await Promise.all([
                    dashboardProductStore.fetchBuyerTotalProducts(),
                    dashboardProductStore.fetchBuyerProductStats(),
                ])
            } else {
                isSupplierLoading.value = true
                await Promise.all([
                    dashboardProductStore.fetchSupplierNewProducts({ period: 'today' }),
                    dashboardProductStore.fetchSupplierTotalProducts(),
                    dashboardProductStore.fetchDashboardProductStats(),
                ])
            }

            hasLoadedOnce.value = true
            error.value = null

            await nextTick()
            setTimeout(() => {
                buyerTotalProductsChartRef.value?.updateChart?.()
                supplierNewProductsChartRef.value?.updateChart?.()
                supplierTotalProductsChartRef.value?.updateChart?.()
            }, 300)
        } catch (err: any) {
            console.error('[Products All] Initialization error:', err)
            error.value = err.message || t('productsDashboard.errors.initializationFailed')
        } finally {
            isBuyerLoading.value = false
            isSupplierLoading.value = false
        }
    }

    onMounted(async () => {
        await initializeData()
    })

    useSeoMeta({
        title: () => t('productsDashboard.allProducts'),
        description: () => t('productsDashboard.allProductsDescription'),
    })
</script>

<style scoped lang="scss">
    .products-all-content {
        @apply grid grid-cols-1;
    }

    .chart-container {
        @apply h-full;
    }

    @media (max-width: 768px) {
        .grid {
            @apply grid-cols-1 gap-3;
        }
    }
</style>
