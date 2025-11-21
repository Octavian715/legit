<template>
    <div class="suppliers-country-chart">
        <Chart
            :title="t('charts.suppliersByCountry.title')"
            :main-value="totalSuppliers"
            :chart-type="'doughnut'"
            :chart-height="'140px'"
            :data="chartData"
            :legend-items="legendItems"
            :is-loading="isLoading"
            :empty-message="t('noData')"
            :default-period="defaultPeriod"
            :show-center-text="true"
            :center-label="t('charts.suppliersByCountry.labelCenter')"
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
    import type { SupplierChartData, DashboardPeriod } from '~/types/userDashboard'

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
    const { loadSuppliersCountryChart, formatChartCountryName } = useUserDashboard()

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

    const isLoading = ref(false)
    const chartApiData = ref<SupplierChartData | null>(null)
    const defaultPeriod: PeriodType = 'lastMonth'

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

    const totalSuppliers = computed(() => {
        return chartApiData.value?.total_suppliers || 0
    })

    const hasData = computed(() => {
        return !!chartApiData.value?.country_breakdown?.length
    })

    const legendItems = computed((): LegendItem[] => {
        if (!hasData.value) return []

        const breakdown = chartApiData.value!.country_breakdown!
        const total = totalSuppliers.value

        return breakdown.map((item, index) => ({
            id: item.country_code || item.country || `country-${index}`,
            label: formatChartCountryName ? formatChartCountryName(item) : item.country,
            value: item.supplier_count || 0,
            percentage: total > 0 ? (item.supplier_count / total) * 100 : 0,
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

    const loadChartData = async (period: PeriodType, dateRange?: DateRange) => {
        isLoading.value = true

        try {
            const filters = dateRange
                ? {
                      start_date: dateRange.start,
                      end_date: dateRange.end,
                  }
                : {
                      period: convertPeriodToApiFormat(period),
                  }

            chartApiData.value = await loadSuppliersCountryChart(filters)
        } catch (error) {
            console.error('Failed to load suppliers country chart:', error)
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

    watch(
        () => [props.period, props.dateRange],
        ([newPeriod, newDateRange]) => {
            if (newPeriod) {
                loadChartData(newPeriod, newDateRange)
            }
        },
        { immediate: true }
    )

    // Initial data is now loaded by the watcher with immediate: true
    // onMounted hook removed to avoid double loading
</script>
