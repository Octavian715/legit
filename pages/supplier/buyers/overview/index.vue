<template>
    <div class="flex flex-col gap-3">
        <Breadcrumbs :items="breadcrumbs" />

        <div class="">
            <div class="charts-grid grid grid-cols-1 gap-3">
                <!-- Buyers by Business Type Chart -->
                <Chart
                    :title="t('charts.buyersByBT.title')"
                    :main-value="businessTypeTotal"
                    :chart-type="'doughnut'"
                    :chart-height="'140px'"
                    :data="businessTypeChartData"
                    :legend-items="businessTypeLegendItems"
                    :is-loading="businessTypeLoading"
                    :empty-message="t('noData')"
                    :default-period="'lastMonth'"
                    :show-center-text="true"
                    :center-label="t('charts.buyersByBT.labelCenter')"
                    value-type="number"
                    @period-change="handleBusinessTypePeriodChange"
                />

                <!-- Buyers by Country Chart -->
                <Chart
                    :title="t('charts.buyersByCountry.title')"
                    :main-value="countryTotal"
                    :chart-type="'doughnut'"
                    :chart-height="'140px'"
                    :data="countryChartData"
                    :legend-items="countryLegendItems"
                    :is-loading="countryLoading"
                    :empty-message="t('noData')"
                    :default-period="'lastMonth'"
                    :show-center-text="true"
                    :center-label="t('charts.buyersByCountry.labelCenter')"
                    value-type="number"
                    @period-change="handleCountryPeriodChange"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import type { ChartData as ChartJSData, LegendItem, PeriodType, DateRange } from '~/types/chart'
    import type { BuyerChartData, DashboardPeriod } from '~/types/userDashboard'

    definePageMeta({
        layout: 'app',
        middleware: ['supplier'],
    })

    const { t } = useI18n()
    const localePath = useLocalePath()
    const {
        loadBuyersBusinessTypeChart,
        loadBuyersCountryChart,
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

    // Loading states - separate for parallel loading
    const businessTypeLoading = ref(false)
    const countryLoading = ref(false)

    // Chart data
    const businessTypeApiData = ref<BuyerChartData | null>(null)
    const countryApiData = ref<BuyerChartData | null>(null)

    const breadcrumbs = computed(() => [
        { label: t('home'), to: localePath('/supplier/dashboard') },
        { label: t('navigation.buyers'), to: localePath('/supplier/buyers') },
        { label: t('navigation.overview'), to: localePath('/supplier/buyers/overview') },
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
    const businessTypeTotal = computed(() => businessTypeApiData.value?.total_buyers || 0)

    const businessTypeLegendItems = computed((): LegendItem[] => {
        if (!businessTypeApiData.value?.business_type_breakdown?.length) return []

        const breakdown = businessTypeApiData.value.business_type_breakdown
        const total = businessTypeTotal.value

        return breakdown.map((item, index) => ({
            id: `business-type-${item.business_type_id}`,
            label: formatChartBusinessTypeName(item),
            value: item.buyer_count || 0,
            percentage: total > 0 ? (item.buyer_count / total) * 100 : 0,
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
                    label: t('charts.buyersBusinessType.datasetLabel'),
                    data: breakdown.map((item) => item.buyer_count || 0),
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
    const countryTotal = computed(() => countryApiData.value?.total_buyers || 0)

    const countryLegendItems = computed((): LegendItem[] => {
        if (!countryApiData.value?.country_breakdown?.length) return []

        const breakdown = countryApiData.value.country_breakdown
        const total = countryTotal.value

        return breakdown.map((item, index) => ({
            id: item.country_code || item.country || `country-${index}`,
            label: formatChartCountryName(item),
            value: item.buyer_count || 0,
            percentage: total > 0 ? (item.buyer_count / total) * 100 : 0,
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
                    label: t('charts.buyersCountry.datasetLabel'),
                    data: breakdown.map((item) => item.buyer_count || 0),
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
        try {
            const filters = dateRange
                ? { start_date: dateRange.start, end_date: dateRange.end }
                : { period: convertPeriodToApiFormat(period) }

            businessTypeApiData.value = await loadBuyersBusinessTypeChart(filters)
        } catch (error) {
            console.error('Failed to load buyers business type chart:', error)
        } finally {
            businessTypeLoading.value = false
        }
    }

    const loadCountryData = async (period: PeriodType, dateRange?: DateRange) => {
        countryLoading.value = true
        try {
            const filters = dateRange
                ? { start_date: dateRange.start, end_date: dateRange.end }
                : { period: convertPeriodToApiFormat(period) }

            countryApiData.value = await loadBuyersCountryChart(filters)
        } catch (error) {
            console.error('Failed to load buyers country chart:', error)
        } finally {
            countryLoading.value = false
        }
    }

    // Event handlers
    const handleBusinessTypePeriodChange = (period: PeriodType, dateRange?: DateRange) => {
        loadBusinessTypeData(period, dateRange)
    }

    const handleCountryPeriodChange = (period: PeriodType, dateRange?: DateRange) => {
        loadCountryData(period, dateRange)
    }

    // Initial data load
    onMounted(() => {
        loadBusinessTypeData('lastMonth')
        loadCountryData('lastMonth')
    })
</script>
