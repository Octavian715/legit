<template>
    <div class="supplier-orders-chart">
        <Chart
            :title="t('charts.totalOrders.title')"
            :main-value="totalOrders"
            :chart-type="'bar'"
            :chart-height="'140px'"
            :data="chartData"
            :is-loading="isLoading"
            :empty-message="t('noData')"
            :default-period="defaultPeriod"
            :show-center-text="false"
            value-type="number"
            @period-change="handlePeriodChange"
            @info-click="handleInfoClick"
        />
    </div>
</template>

<script setup lang="ts">
    import type { ChartData as ChartJSData } from '~/types/chart'
    import type { PeriodType, DateRange } from '~/types/chart'
    import type { SupplierOrdersChart as ApiChartData } from '~/types/ordersDashboard'

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
    const { loadSupplierOrdersChart } = useOrdersDashboard()
    const { formatDate } = useDate()

    const isLoading = ref(false)
    const chartApiData = ref<ApiChartData | null>(null)
    const error = ref<string | null>(null)
    const defaultPeriod: PeriodType = 'lastMonth'

    const totalOrders = computed(() => {
        return chartApiData.value?.total || 0
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

        const data = chartPoints.map((point) => point.count)

        return {
            labels,
            datasets: [
                {
                    label: t('orders.orders'),
                    data,
                    backgroundColor: '#3B82F6',
                    borderColor: '#3B82F6',
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                    hoverBackgroundColor: '#2563EB',
                    hoverBorderColor: '#2563EB',
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

            chartApiData.value = await loadSupplierOrdersChart(filters)
        } catch (err: any) {
            console.error('Failed to load supplier orders chart:', err)
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
