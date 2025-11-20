<template>
    <div class="buyers-country-chart">
        <Chart
            :title="t('charts.buyersByCountry.title')"
            :main-value="totalBuyers"
            :chart-type="'doughnut'"
            :chart-height="'140px'"
            :data="chartData"
            :legend-items="legendItems"
            :is-loading="isLoading"
            :empty-message="t('noData')"
            :default-period="defaultPeriod"
            :show-center-text="true"
            :center-label="t('charts.buyersByCountry.labelCenter')"
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
    import type { BuyerChartData } from '~/types/userDashboard'

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
    const { loadBuyersCountryChart, formatChartCountryName } = useUserDashboard()

    const isLoading = ref(false)
    const chartApiData = ref<BuyerChartData | null>(null)
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

    const totalBuyers = computed(() => {
        return chartApiData.value?.total_buyers || 0
    })

    const hasData = computed(() => {
        return !!chartApiData.value?.country_breakdown?.length
    })

    const legendItems = computed((): LegendItem[] => {
        if (!hasData.value) return []

        const breakdown = chartApiData.value!.country_breakdown!
        const total = totalBuyers.value

        return breakdown.map((item, index) => ({
            id: item.country_code || item.country || `country-${index}`,
            label: formatChartCountryName ? formatChartCountryName(item) : item.country,
            value: item.buyer_count || 0,
            percentage: total > 0 ? (item.buyer_count / total) * 100 : 0,
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
            labels: breakdown.map((item) =>
                formatChartCountryName ? formatChartCountryName(item) : item.country
            ),
            datasets: [
                {
                    label: t('charts.buyersCountry.datasetLabel'),
                    data: breakdown.map((item) => item.buyer_count || 0),
                    backgroundColor: breakdown.map(
                        (_, index) => chartColors[index % chartColors.length]
                    ),
                    borderWidth: 0, // No border for seamless segments
                    hoverOffset: 6,
                },
            ],
        }
    })

    const loadChartData = async (period: PeriodType, dateRange?: DateRange) => {
        isLoading.value = true

        try {
            const filters = dateRange
                ? {
                      start_date: dateRange.start,
                      end_date: dateRange.end,
                  }
                : {
                      period,
                  }

            chartApiData.value = await loadBuyersCountryChart(filters)
        } catch (error) {
            console.error('Failed to load buyers country chart:', error)
        } finally {
            isLoading.value = false
        }
    }

    const handlePeriodChange = (period: PeriodType, dateRange?: DateRange) => {
        loadChartData(period, dateRange)
        emit('period-change', period, dateRange)
    }

    const handleLegendItemClick = (item: LegendItem) => {
        // Handle legend item click - could filter data or navigate
    }

    const handleInfoClick = () => {}

    // Watch for prop changes
    watch(
        () => [props.period, props.dateRange],
        ([newPeriod, newDateRange]) => {
            if (newPeriod) {
                loadChartData(newPeriod, newDateRange)
            }
        },
        { immediate: false }
    )

    // Load initial data
    onMounted(() => {
        loadChartData(props.period || defaultPeriod, props.dateRange)
    })
</script>
