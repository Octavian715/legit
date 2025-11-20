<template>
    <div class="supplier-average-cart-chart">
        <Chart
            :title="t('ordersDashboard.averageCartChart')"
            :main-value="formattedAverageCart"
            :chart-type="'bar'"
            :chart-height="'140px'"
            :data="chartData"
            :is-loading="isLoading"
            :empty-message="t('noData')"
            :default-period="defaultPeriod"
            :show-center-text="false"
            :currency="currency"
            value-type="currency"
            @period-change="handlePeriodChange"
            @info-click="handleInfoClick"
        />
    </div>
</template>

<script setup lang="ts">
    import type { ChartData as ChartJSData } from '~/types/chart'
    import type { PeriodType, DateRange } from '~/types/chart'
    import type { SupplierAverageCartChart as ApiChartData } from '~/types/ordersDashboard'

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
    const { loadSupplierAverageCartChart, formatCurrency } = useOrdersDashboard()
    const { formatDate } = useDate()

    const isLoading = ref(false)
    const chartApiData = ref<ApiChartData | null>(null)
    const error = ref<string | null>(null)
    const defaultPeriod: PeriodType = 'lastMonth'

    const currency = {
        id: 1,
        code: 'EUR',
        symbol: '€',
    }

    const averageCart = computed(() => {
        return chartApiData.value?.average_cart || 0
    })

    const totalOrders = computed(() => {
        return chartApiData.value?.total_orders || 0
    })

    const formattedAverageCart = computed(() => {
        return formatCurrency(averageCart.value)
    })

    const hasData = computed(() => {
        return !!chartApiData.value?.chart_data?.length
    })

    const chartData = computed<ChartJSData>(() => {
        if (!hasData.value) {
            return { labels: [], datasets: [] }
        }

        const chartPoints = chartApiData.value!.chart_data!

        const labels = chartPoints.map((point) => formatDate(point.date, 'MMM dd'))

        const data = chartPoints.map((point) => point.average_value)

        return {
            labels,
            datasets: [
                {
                    label: t('ordersDashboard.chartLabels.average'),
                    data,
                    backgroundColor: '#22C55E',
                    borderColor: '#22C55E',
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                    hoverBackgroundColor: '#16A34A',
                    hoverBorderColor: '#16A34A',
                },
            ],
        }
    })

    const loadChartData = async (period: PeriodType, dateRange?: DateRange) => {
        if (isLoading.value) return

        isLoading.value = true
        error.value = null

        try {
            const filters = dateRange
                ? {
                      start_date: dateRange.start,
                      end_date: dateRange.end,
                  }
                : {
                      period,
                  }

            chartApiData.value = await loadSupplierAverageCartChart(filters)
        } catch (err: any) {
            console.error('Failed to load supplier average cart chart:', err)
            error.value = err.message || t('ordersDashboard.chartDataError')
        } finally {
            isLoading.value = false
        }
    }

    const handlePeriodChange = (period: PeriodType, dateRange?: DateRange) => {
        loadChartData(period, dateRange)
        emit('period-change', period, dateRange)
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

    // Expose error for parent component
    defineExpose({
        error: readonly(error),
        retry: () => loadChartData(props.period || defaultPeriod, props.dateRange),
    })
</script>
