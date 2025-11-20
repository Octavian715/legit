<template>
    <div class="supplier-orders-by-country-chart">
        <Chart
            :title="t('charts.totalOrdersByContry.title')"
            :main-value="totalOrders"
            :chart-type="'doughnut'"
            :chart-height="'140px'"
            :data="chartData"
            :legend-items="legendItems"
            :is-loading="isLoading"
            :empty-message="t('noData')"
            :default-period="defaultPeriod"
            :show-center-text="true"
            :center-label="t('charts.totalOrdersByContry.labelCenter')"
            value-type="number"
            @period-change="handlePeriodChange"
            @legend-item-click="handleLegendItemClick"
            @info-click="handleInfoClick"
        />
    </div>
</template>

<script setup lang="ts">
    import type { ChartData as ChartJSData, LegendItem } from '~/types/chart'
    import type { PeriodType, DateRange } from '~/types/chart'
    import type { SupplierOrdersByCountryChart as ApiChartData } from '~/types/ordersDashboard'

    interface Props {
        period?: PeriodType
        dateRange?: DateRange
    }

    const props = withDefaults(defineProps<Props>(), {
        period: 'lastMonth',
    })

    const emit = defineEmits<{
        'period-change': [period: PeriodType, dateRange?: DateRange]
    }>()

    const { t } = useI18n()
    const { loadSupplierOrdersByCountryChart, formatCountryName, getCountryFlag } =
        useOrdersDashboard()

    const isLoading = ref(false)
    const chartApiData = ref<ApiChartData | null>(null)
    const error = ref<string | null>(null)
    const defaultPeriod: PeriodType = 'lastMonth'

    // Chart colors matching design
    const chartColors = [
        '#3B82F6', // Blue
        '#22C55E', // Green
        '#8B5CF6', // Purple
        '#F59E0B', // Yellow
        '#EF4444', // Red
        '#06B6D4', // Cyan
        '#EC4899', // Pink
        '#84CC16', // Lime
        '#F97316', // Orange
        '#6366F1', // Indigo
    ]

    const totalOrders = computed(() => {
        return chartApiData.value?.total || 0
    })

    const totalCountries = computed(() => {
        return chartApiData.value?.country_breakdown?.length || 0
    })

    const hasData = computed(() => {
        return !!chartApiData.value?.country_breakdown?.length
    })

    const legendItems = computed((): LegendItem[] => {
        if (!hasData.value) return []

        const breakdown = chartApiData.value!.country_breakdown!
        const total = totalOrders.value

        return breakdown.map((item, index) => ({
            id: `country-${item.country_id}`,
            label: formatCountryName(item.country_name),
            value: item.total_orders,
            percentage: total > 0 ? (item.total_orders / total) * 100 : 0,
            color: chartColors[index % chartColors.length],
            isActive: true,
        }))
    })

    const chartData = computed<ChartJSData>(() => {
        if (!hasData.value) {
            return { labels: [], datasets: [] }
        }

        const breakdown = chartApiData.value!.country_breakdown!

        return {
            labels: breakdown.map((item) => formatCountryName(item.country_name)),
            datasets: [
                {
                    label: t('ordersDashboard.chartLabels.orders'),
                    data: breakdown.map((item) => item.total_orders),
                    backgroundColor: breakdown.map(
                        (_, index) => chartColors[index % chartColors.length]
                    ),
                    borderWidth: 0,
                    hoverOffset: 6,
                },
            ],
        }
    })

    // Helper function to convert period to date range
    const convertPeriodToDateRange = (
        period: PeriodType
    ): { start_date: string; end_date: string } => {
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        let startDate: Date
        let endDate: Date = today

        switch (period) {
            case 'today':
                startDate = today
                break
            case 'yesterday':
                startDate = new Date(today)
                startDate.setDate(today.getDate() - 1)
                endDate = new Date(startDate)
                break
            case 'thisWeek':
                startDate = new Date(today)
                startDate.setDate(today.getDate() - today.getDay())
                break
            case 'lastWeek':
                startDate = new Date(today)
                startDate.setDate(today.getDate() - today.getDay() - 7)
                endDate = new Date(startDate)
                endDate.setDate(startDate.getDate() + 6)
                break
            case 'thisMonth':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1)
                break
            case 'lastMonth':
                startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
                endDate = new Date(today.getFullYear(), today.getMonth(), 0)
                break
            case 'last30Days':
                startDate = new Date(today)
                startDate.setDate(today.getDate() - 30)
                break
            case 'last90Days':
                startDate = new Date(today)
                startDate.setDate(today.getDate() - 90)
                break
            case 'thisYear':
                startDate = new Date(today.getFullYear(), 0, 1)
                break
            case 'lastYear':
                startDate = new Date(today.getFullYear() - 1, 0, 1)
                endDate = new Date(today.getFullYear() - 1, 11, 31)
                break
            default:
                // Default to last month
                startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
                endDate = new Date(today.getFullYear(), today.getMonth(), 0)
        }

        // Format dates as YYYY-MM-DD
        const formatDate = (date: Date): string => {
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
        }

        return {
            start_date: formatDate(startDate),
            end_date: formatDate(endDate),
        }
    }

    const loadChartData = async (period: PeriodType, dateRange?: DateRange) => {
        if (isLoading.value) return

        isLoading.value = true
        error.value = null

        try {
            // Always convert to date range - backend doesn't accept period parameter
            let filters: { start_date: string; end_date: string }

            if (dateRange) {
                filters = {
                    start_date: dateRange.start,
                    end_date: dateRange.end,
                }
            } else {
                // Convert period to date range
                filters = convertPeriodToDateRange(period)
            }

            chartApiData.value = await loadSupplierOrdersByCountryChart(filters)
        } catch (err: any) {
            console.error('Failed to load supplier orders by country chart:', err)
            error.value = err.message || t('ordersDashboard.chartDataError')
        } finally {
            isLoading.value = false
        }
    }

    const handlePeriodChange = (period: PeriodType, dateRange?: DateRange) => {
        loadChartData(period, dateRange)
        emit('period-change', period, dateRange)
    }

    const handleLegendItemClick = (item: LegendItem) => {}

    const handleInfoClick = () => {}

    // Load initial data on mount
    onMounted(() => {
        loadChartData(props.period || defaultPeriod, props.dateRange)
    })

    // Watch for prop changes (not immediate to prevent race conditions)
    watch(
        () => [props.period, props.dateRange],
        ([newPeriod, newDateRange]) => {
            if (newPeriod) {
                loadChartData(newPeriod as PeriodType, newDateRange as DateRange | undefined)
            }
        }
    )

    // Expose error for parent component
    defineExpose({
        error: readonly(error),
        retry: () => loadChartData(props.period || defaultPeriod, props.dateRange),
    })
</script>
