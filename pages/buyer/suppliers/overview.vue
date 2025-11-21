<template>
    <div class="flex flex-col gap-3">
        <Breadcrumbs :items="breadcrumbs" />

        <!-- Error State -->
        <div v-if="hasError && !isRetrying" class="bg-white rounded-sm shadow p-8 text-center">
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
            <p class="text-subtitle1 text-gray-700 mb-6">
                {{ errorMessage }}
            </p>
            <Button color="red" variant="filled" @click="handleRetry">
                {{ t('dashboardUser.messages.tryAgain') }}
            </Button>
        </div>

        <!-- Content -->
        <div v-else class="">
            <div class="charts-grid grid grid-cols-1 gap-3">
                <!-- Initial Loading Skeleton -->
                <template v-if="!hasLoadedOnce">
                    <ChartSkeleton />
                    <ChartSkeleton />
                </template>

                <!-- Charts -->
                <template v-else>
                    <!-- Suppliers by Business Type Chart -->
                    <Chart
                        :title="t('charts.suppliersByBT.title')"
                        :main-value="businessTypeTotal"
                        :chart-type="'doughnut'"
                        :chart-height="'140px'"
                        :data="businessTypeChartData"
                        :legend-items="businessTypeLegendItems"
                        :is-loading="businessTypeLoading"
                        :empty-message="t('noData')"
                        :default-period="'lastMonth'"
                        :show-center-text="true"
                        :center-label="t('charts.suppliersByBT.labelCenter')"
                        value-type="number"
                        @period-change="handleBusinessTypePeriodChange"
                    />

                    <!-- Suppliers by Country Chart -->
                    <Chart
                        :title="t('charts.suppliersByCountry.title')"
                        :main-value="countryTotal"
                        :chart-type="'doughnut'"
                        :chart-height="'140px'"
                        :data="countryChartData"
                        :legend-items="countryLegendItems"
                        :is-loading="countryLoading"
                        :empty-message="t('noData')"
                        :default-period="'lastMonth'"
                        :show-center-text="true"
                        :center-label="t('charts.suppliersByCountry.labelCenter')"
                        value-type="number"
                        @period-change="handleCountryPeriodChange"
                    />
                </template>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import type { ChartData as ChartJSData, LegendItem, PeriodType, DateRange } from '~/types/chart'
    import type { SupplierChartData, DashboardPeriod } from '~/types/userDashboard'

    definePageMeta({
        layout: 'app',
        middleware: ['buyer'],
    })

    const { t } = useI18n()
    const localePath = useLocalePath()
    const {
        loadSuppliersBusinessTypeChart,
        loadSuppliersCountryChart,
        formatChartBusinessTypeName,
        formatChartCountryName,
    } = useUserDashboard()

    // Chart colors
    const chartColors = [
        '#3B82F6',
        '#22C55E',
        '#8B5CF6',
        '#F59E0B',
        '#EF4444',
        '#06B6D4',
        '#EC4899',
        '#84CC16',
        '#F97316',
        '#6366F1',
    ]

    // Loading and error states
    const businessTypeLoading = ref(false)
    const countryLoading = ref(false)
    const businessTypeError = ref<Error | null>(null)
    const countryError = ref<Error | null>(null)
    const isRetrying = ref(false)
    const hasLoadedOnce = ref(false)

    // Chart data
    const businessTypeApiData = ref<SupplierChartData | null>(null)
    const countryApiData = ref<SupplierChartData | null>(null)

    // Computed
    const hasError = computed(() => businessTypeError.value || countryError.value)
    const errorMessage = computed(() => {
        if (businessTypeError.value) return businessTypeError.value.message
        if (countryError.value) return countryError.value.message
        return t('dashboardUser.errors.generic')
    })

    const breadcrumbs = computed(() => [
        { label: t('home'), to: localePath('/buyer/dashboard') },
        { label: t('navigation.suppliers'), to: localePath('/buyer/suppliers') },
        { label: t('navigation.overview'), to: localePath('/buyer/suppliers/overview') },
    ])

    // Convert PeriodType (camelCase) to DashboardPeriod (snake_case) for API
    const convertPeriodToApiFormat = (period: PeriodType): DashboardPeriod => {
        const periodMap: Record<PeriodType, DashboardPeriod> = {
            today: 'today',
            yesterday: 'today',
            thisWeek: 'last_month',
            lastWeek: 'last_month',
            thisMonth: 'last_month',
            lastMonth: 'last_month',
            last30Days: 'last_month',
            last90Days: 'last_year',
            thisYear: 'last_year',
            lastYear: 'last_year',
            custom: 'last_month',
        }
        return periodMap[period] || 'last_month'
    }

    // Business Type Chart computed
    const businessTypeTotal = computed(() => businessTypeApiData.value?.total_suppliers || 0)

    const businessTypeLegendItems = computed((): LegendItem[] => {
        if (!businessTypeApiData.value?.business_type_breakdown?.length) return []

        const breakdown = businessTypeApiData.value.business_type_breakdown
        const total = businessTypeTotal.value

        return breakdown.map((item, index) => ({
            id: `business-type-${item.business_type_id}`,
            label: formatChartBusinessTypeName(item),
            value: item.supplier_count || 0,
            percentage: total > 0 ? (item.supplier_count / total) * 100 : 0,
            color: chartColors[index % chartColors.length],
            isActive: true,
        }))
    })

    const businessTypeChartData = computed<ChartJSData>(() => {
        if (!businessTypeApiData.value?.business_type_breakdown?.length) {
            return { labels: [], datasets: [] }
        }

        const breakdown = businessTypeApiData.value.business_type_breakdown

        return {
            labels: breakdown.map((item) => formatChartBusinessTypeName(item)),
            datasets: [
                {
                    label: t('charts.suppliersBusinessType.datasetLabel'),
                    data: breakdown.map((item) => item.supplier_count || 0),
                    backgroundColor: breakdown.map(
                        (_, index) => chartColors[index % chartColors.length]
                    ),
                    borderWidth: 0,
                    hoverOffset: 6,
                },
            ],
        }
    })

    // Country Chart computed
    const countryTotal = computed(() => countryApiData.value?.total_suppliers || 0)

    const countryLegendItems = computed((): LegendItem[] => {
        if (!countryApiData.value?.country_breakdown?.length) return []

        const breakdown = countryApiData.value.country_breakdown
        const total = countryTotal.value

        return breakdown.map((item, index) => ({
            id: item.country_code || item.country || `country-${index}`,
            label: formatChartCountryName(item),
            value: item.supplier_count || 0,
            percentage: total > 0 ? (item.supplier_count / total) * 100 : 0,
            color: chartColors[index % chartColors.length],
            isActive: true,
        }))
    })

    const countryChartData = computed<ChartJSData>(() => {
        if (!countryApiData.value?.country_breakdown?.length) {
            return { labels: [], datasets: [] }
        }

        const breakdown = countryApiData.value.country_breakdown

        return {
            labels: breakdown.map((item) => formatChartCountryName(item)),
            datasets: [
                {
                    label: t('charts.suppliersCountry.datasetLabel'),
                    data: breakdown.map((item) => item.supplier_count || 0),
                    backgroundColor: breakdown.map(
                        (_, index) => chartColors[index % chartColors.length]
                    ),
                    borderWidth: 0,
                    hoverOffset: 6,
                },
            ],
        }
    })

    // Load chart data
    const loadBusinessTypeData = async (period: PeriodType, dateRange?: DateRange) => {
        businessTypeLoading.value = true
        businessTypeError.value = null

        try {
            const filters = dateRange
                ? { start_date: dateRange.start, end_date: dateRange.end }
                : { period: convertPeriodToApiFormat(period) }

            businessTypeApiData.value = await loadSuppliersBusinessTypeChart(filters)
        } catch (error: any) {
            console.error('Failed to load suppliers business type chart:', error)
            businessTypeError.value = error
        } finally {
            businessTypeLoading.value = false
        }
    }

    const loadCountryData = async (period: PeriodType, dateRange?: DateRange) => {
        countryLoading.value = true
        countryError.value = null

        try {
            const filters = dateRange
                ? { start_date: dateRange.start, end_date: dateRange.end }
                : { period: convertPeriodToApiFormat(period) }

            countryApiData.value = await loadSuppliersCountryChart(filters)
        } catch (error: any) {
            console.error('Failed to load suppliers country chart:', error)
            countryError.value = error
        } finally {
            countryLoading.value = false
        }
    }

    // Load all data
    const loadAllData = async () => {
        await Promise.all([
            loadBusinessTypeData('lastMonth'),
            loadCountryData('lastMonth'),
        ])
        hasLoadedOnce.value = true
    }

    // Event handlers
    const handleBusinessTypePeriodChange = (period: PeriodType, dateRange?: DateRange) => {
        loadBusinessTypeData(period, dateRange)
    }

    const handleCountryPeriodChange = (period: PeriodType, dateRange?: DateRange) => {
        loadCountryData(period, dateRange)
    }

    const handleRetry = async () => {
        isRetrying.value = true
        businessTypeError.value = null
        countryError.value = null

        try {
            await loadAllData()
        } finally {
            isRetrying.value = false
        }
    }

    // Initial data load
    onMounted(() => {
        loadAllData()
    })
</script>
