<template>
    <div class="chart-component h-80 w-full">
        <div class="chart-card bg-white rounded-md px-4 py-2.5 h-full">
            <!-- Header -->
            <div class="chart-header">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <h3 class="text-subtitle1 font-medium text-gray-950">{{ title }}</h3>
                        <!-- Lock Badge -->
                        <span
                            v-if="locked"
                            class="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-caption1"
                        >
                            <svg class="w-3 h-3">
                                <use xlink:href="/sprite.svg#lock"></use>
                            </svg>
                            <span>{{ t('subscription.locked') }}</span>
                        </span>
                    </div>
                    <div v-if="!locked" class="flex gap-2 items-center">
                        <DatePicker
                            ref="datePickerRef"
                            v-model="customDateRange"
                            compact
                            :is-range-mode="true"
                            class="hover:bg-gray-50 p-1"
                            @range-selected="handleCustomRangeSelected"
                        />

                        <button
                            v-if="showInfo"
                            v-tooltip="t('featureComingSoon')"
                            disabled
                            class="inline-flex items-center justify-center p-1.5 text-gray-600 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed enabled:hover:text-gray-800 enabled:hover:bg-gray-50 enabled:active:scale-95"
                            @click="handleInfoClick"
                        >
                            <svg class="w-5 h-5">
                                <use xlink:href="/sprite.svg#info"></use>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Main Value (Hidden when locked) -->
                <div v-if="!locked && mainValue !== undefined && mainValue !== null">
                    <div class="text-title1 font-bold text-gray-950">{{ formattedMainValue }}</div>
                    <div
                        v-if="
                            selectedPeriod === 'custom' &&
                            customDateRange.start &&
                            customDateRange.end
                        "
                        class="text-body text-gray-600 h-4"
                    >
                        {{ formatDateRange(customDateRange) }}
                    </div>
                    <div v-else class="h-4"></div>
                </div>
            </div>

            <!-- Legend Tabs -->
            <div v-if="legendTabs && legendTabs.length > 0" class="chart-legend-tabs px-4 pb-2">
                <div class="flex gap-1 border-b border-gray-200">
                    <button
                        v-for="tab in legendTabs"
                        :key="tab.value"
                        class="px-3 py-2 text-sm font-medium transition-colors relative"
                        :class="{
                            'text-blue-600 border-b-2 border-blue-600 -mb-[2px]':
                                activeLegendTab === tab.value,
                            'text-gray-500 hover:text-gray-700': activeLegendTab !== tab.value,
                        }"
                        @click="handleLegendTabChange(tab.value)"
                    >
                        {{ tab.label }}
                        <span v-if="tab.count" class="ml-1 text-xs text-gray-400"
                            >({{ tab.count }})</span
                        >
                    </button>
                </div>
            </div>

            <!-- Chart Content -->
            <div class="chart-wrapper h-36">
                <!-- Loading State -->
                <div v-if="isLoading" class="animate-pulse h-full pb-6">
                    <div class="h-full bg-gray-300 rounded"></div>
                </div>

                <!-- Locked State (Feature Access Restricted) -->
                <div
                    v-else-if="locked"
                    class="locked-state text-center h-full flex flex-col items-center justify-center px-4"
                >
                    <div class="text-gray-400 mb-4">
                        <svg class="w-12 h-12 mx-auto">
                            <use xlink:href="/sprite.svg#lock"></use>
                        </svg>
                    </div>
                    <h3 class="text-subtitle2 font-bold text-gray-950 mb-4">
                        {{ t('subscription.featureNotAvailable') }}
                    </h3>

                    <Button
                        color="blue"
                        size="md"
                        font-weight="normal"
                        :label="t('subscription.upgradePlan')"
                        @click="handleUpgradeClick"
                    />
                </div>

                <!-- Empty State -->
                <div
                    v-else-if="!hasValidData"
                    class="empty-state text-center h-full flex flex-col items-center justify-center"
                >
                    <div class="text-gray-600 mb-4">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            class="w-12 h-12 mx-auto"
                        >
                            <path
                                d="M6.88 18.15V16.08"
                                stroke="currentColor"
                                stroke-width="1.6"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                            <path
                                d="M12 18.15V14.01"
                                stroke="currentColor"
                                stroke-width="1.6"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                            <path
                                d="M17.12 18.15V11.93"
                                stroke="currentColor"
                                stroke-width="1.6"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                            <path
                                d="M17.12 5.85L16.66 6.39C14.11 9.37 10.69 11.48 6.88 12.43"
                                stroke="currentColor"
                                stroke-width="1.6"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                            <path
                                d="M14.19 5.85H17.12V8.77"
                                stroke="currentColor"
                                stroke-width="1.6"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                            <path
                                d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z"
                                stroke="currentColor"
                                stroke-width="1.6"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                        </svg>
                    </div>
                    <h3 class="text-subtitle2 font-bold text-gray-950 mb-2">{{ emptyMessage }}</h3>
                </div>

                <div v-else class="relative h-full">
                    <!-- Doughnut Chart Layout -->
                    <div
                        v-if="chartType === 'doughnut'"
                        class="flex gap-2 md:gap-5 h-full w-full items-start"
                    >
                        <!-- Legend Section -->
                        <div class="legend-section flex-1 w-full">
                            <ChartLegend
                                v-if="legendItems && legendItems.length > 0"
                                :style="{ height: '140px' }"
                                :items="legendItems"
                                :max-items="legendItems.length"
                                :total="mainValue"
                                :currency="currency"
                                :value-type="valueType"
                                :show-scroll-indicator="true"
                                @item-click="handleLegendItemClick"
                                @item-hover="handleLegendItemHover"
                            />
                        </div>

                        <!-- Chart Section -->
                        <div
                            class="chart-section w-44 h-32 md:w-60 md:h-40 relative flex-shrink-0 mb-auto"
                        >
                            <div class="canvas-container w-full h-full">
                                <canvas
                                    :id="canvasId"
                                    :ref="setCanvasRef"
                                    class="w-full h-full"
                                ></canvas>
                            </div>

                            <!-- Center Text Overlay -->
                            <div
                                v-if="showCenterText"
                                class="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
                            >
                                <div class="text-center">
                                    <div class="text-subtitle2 text-gray-800">{{
                                        formattedCenterValue
                                    }}</div>
                                    <div class="text-caption2 text-gray-950 mt-1">{{
                                        centerLabel
                                    }}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Regular Chart Layout -->
                    <div v-else class="canvas-container w-full h-full pb-3">
                        <canvas :id="canvasId" :ref="setCanvasRef" class="max-h-36 w-full"></canvas>
                    </div>
                </div>
            </div>

            <!-- Period Controls (Hidden when locked) -->
            <div v-if="!locked" class="chart-controls px-4 pb-3 mt-3">
                <div class="flex items-center justify-between gap-4">
                    <SegmentedButtons
                        ref="segmentedButtonsRef"
                        size="sm"
                        :options="periodOptions"
                        :default-active="selectedPeriod"
                        class="!mt-0"
                        @change="handlePeriodChange"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { format, parseISO } from 'date-fns'
    import { toRaw, markRaw } from 'vue'
    import {
        Chart as ChartJS,
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement,
        BarElement,
        ArcElement,
        Title,
        Tooltip,
        Legend,
        Filler,
    } from 'chart.js'
    import { useChartPeriods } from '~/composables/chart/useChartPeriods'
    import { useChartConfig } from '~/composables/chart/useChartConfig'
    import { useUpgradeModal } from '~/composables/useUpgradeModal'
    import type {
        ChartData,
        LegendTab,
        LegendItem,
        PeriodType,
        DateRange,
        ChartType,
        Currency,
    } from '~/types/chart'

    ChartJS.register(
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement,
        BarElement,
        ArcElement,
        Title,
        Tooltip,
        Legend,
        Filler
    )

    interface Props {
        title: string
        subtitle?: string
        mainValue?: number | string
        chartType?: ChartType
        chartHeight?: string
        data?: ChartData
        isLoading?: boolean
        emptyMessage?: string
        showInfo?: boolean
        legendTabs?: LegendTab[]
        defaultLegendTab?: string
        defaultPeriod?: PeriodType
        initialDateRange?: DateRange
        showCustomOption?: boolean
        currency?: Currency
        valueType?: 'currency' | 'number' | 'percentage'
        legendItems?: LegendItem[]
        showCenterText?: boolean
        centerLabel?: string
        locked?: boolean // Feature is locked due to plan restrictions
        featureName?: string // Name of locked feature for upgrade prompt
    }

    const props = withDefaults(defineProps<Props>(), {
        chartType: 'bar',
        chartHeight: '140px',
        showInfo: true,
        showCustomOption: true,
        defaultPeriod: 'today',
        isLoading: false,
        emptyMessage: 'No data available',
        valueType: 'number',
        showCenterText: true,
        centerLabel: 'Total Users',
    })

    const emit = defineEmits<{
        'period-change': [period: PeriodType, dateRange?: DateRange]
        'legend-tab-change': [tab: string]
        'legend-item-click': [item: LegendItem]
        'legend-item-hover': [item: LegendItem | null]
        'info-click': []
    }>()

    const { t } = useI18n()
    const { getDateRangeForPeriod } = useChartPeriods()
    const { getStaticChartOptions, getStaticDoughnutOptions } = useChartConfig()
    const { openUpgradeModal } = useUpgradeModal()

    /**
     * Handle upgrade button click from locked state
     */
    const handleUpgradeClick = () => {
        if (props.featureName) {
            openUpgradeModal(props.featureName, 'upgrade')
        } else {
            openUpgradeModal(undefined, 'upgrade')
        }
    }

    const chartInstance = ref<ChartJS | null>(null)
    const canvasElement = ref<HTMLCanvasElement | null>(null)
    const selectedPeriod = ref<PeriodType>(props.defaultPeriod)
    const activeLegendTab = ref(props.defaultLegendTab || props.legendTabs?.[0]?.value || '')
    const customDateRange = ref<DateRange>({ start: '', end: '' })
    const segmentedButtonsRef = ref<any>(null)
    const datePickerRef = ref<any>(null)
    const isComponentReady = ref(false)

    const instanceId = `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const canvasId = `canvas-${instanceId}`

    const setCanvasRef = (el: HTMLCanvasElement | null) => {
        canvasElement.value = el
    }

    const hasValidData = computed(() => {
        if (!props.data?.datasets?.length) return false
        return props.data.datasets.some(
            (dataset) => dataset.data && Array.isArray(dataset.data) && dataset.data.length > 0
        )
    })

    const periodOptions = computed(() => {
        const baseOptions = [
            { value: 'today', label: t('date.today'), active: true },
            { value: 'lastMonth', label: t('date.lastMonth'), active: true },
            { value: 'lastYear', label: t('date.lastYear'), active: true },
        ]

        if (props.showCustomOption) {
            baseOptions.push({
                value: 'custom',
                label: t('filters.customDateRange'),
                active: true,
            })
        }

        return baseOptions
    })

    const formattedMainValue = computed(() => {
        if (typeof props.mainValue === 'number') {
            if (props.currency && props.valueType === 'currency') {
                return formatCurrency(props.mainValue, props.currency)
            }
            return new Intl.NumberFormat().format(props.mainValue)
        }
        return props.mainValue || '0'
    })

    const formattedCenterValue = computed(() => {
        if (!props.mainValue || typeof props.mainValue !== 'number') return '0'

        if (props.mainValue >= 1000000) {
            return `${(props.mainValue / 1000000).toFixed(1)}M`
        }
        if (props.mainValue >= 1000) {
            return `${(props.mainValue / 1000).toFixed(0)}k`
        }
        return new Intl.NumberFormat().format(props.mainValue)
    })

    const formatCurrency = (value: number, currency: Currency): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.code,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(value)
    }

    const formatDateRange = (range: DateRange): string => {
        if (!range.start || !range.end) return ''
        try {
            const start = format(parseISO(range.start), 'dd.MM.yyyy')
            const end = format(parseISO(range.end), 'dd.MM.yyyy')
            return `${start} - ${end}`
        } catch {
            return ''
        }
    }

    const createWorkingChartData = (): any => {
        if (props.data && hasValidData.value) {
            const rawData = toRaw(props.data)
            return {
                labels: [...(rawData.labels || [])],
                datasets: rawData.datasets.map((dataset) => ({
                    ...dataset,
                    data: [...(dataset.data || [])],
                })),
            }
        }
        return null
    }

    const createChartConfig = () => {
        const workingData = createWorkingChartData()
        if (!workingData) return null

        if (props.chartType === 'doughnut') {
            return markRaw({
                type: 'doughnut',
                data: workingData,
                options: markRaw({
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: true,
                    cutout: '85%',
                    spacing: -10,
                    layout: {
                        padding: { top: 5, bottom: 10 },
                    },
                    plugins: {
                        legend: {
                            display: false,
                        },
                        tooltip: {
                            backgroundColor: '#rgba(0,0,0,0.8)',
                            z: 9999,
                            titleColor: '#DBDEE4',
                            bodyColor: '#ffffff',
                            borderWidth: 0,
                            cornerRadius: 4,
                            padding: 10,
                            displayColors: true,
                            callbacks: {
                                label: function (context: any) {
                                    const label = context.label || ''
                                    const value = context.parsed || 0
                                    const total = context.dataset.data.reduce(
                                        (a: number, b: number) => a + b,
                                        0
                                    )
                                    const percentage =
                                        total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'

                                    return `${label}: ${new Intl.NumberFormat().format(value)} (${percentage}%)`
                                },
                            },
                        },
                    },
                    interaction: {
                        intersect: false,
                    },
                    elements: {
                        arc: {
                            borderRadius: 5,
                            borderSkipped: false,
                        },
                    },
                }),
            })
        }

        return markRaw({
            type: props.chartType,
            data: workingData,
            options: markRaw({
                ...getStaticChartOptions(
                    props.chartType as 'line' | 'bar',
                    props.currency,
                    props.valueType
                ),
                responsive: true,
                maintainAspectRatio: false,
                animation: true,
                layout: {
                    padding: 0,
                },
            }),
        })
    }

    const destroyChart = () => {
        if (chartInstance.value) {
            try {
                chartInstance.value.destroy()
            } catch (error) {
                console.warn(`Chart ${instanceId} destroy failed:`, error)
            } finally {
                chartInstance.value = null
            }
        }
    }

    const createChart = async () => {
        if (!process.client || !isComponentReady.value || !hasValidData.value) {
            return
        }

        await nextTick()

        if (!canvasElement.value) {
            return
        }

        const rect = canvasElement.value.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) {
            return
        }

        canvasElement.value.width = rect.width * window.devicePixelRatio
        canvasElement.value.height = rect.height * window.devicePixelRatio
        canvasElement.value.style.width = rect.width + 'px'
        canvasElement.value.style.height = rect.height + 'px'

        const ctx = canvasElement.value.getContext('2d')
        if (!ctx) {
            return
        }

        ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

        destroyChart()

        try {
            const config = createChartConfig()
            if (!config) return

            chartInstance.value = markRaw(new ChartJS(canvasElement.value, config))
        } catch (error) {
            console.error(`Chart ${instanceId} creation failed:`, error)
        }
    }

    const updateChart = async () => {
        if (!process.client || !isComponentReady.value) {
            return
        }

        await createChart()
    }

    const handlePeriodChange = async (period: string) => {
        selectedPeriod.value = period as PeriodType

        if (period === 'custom') {
            await nextTick()
            setTimeout(() => {
                if (datePickerRef.value?.openPicker) {
                    datePickerRef.value.openPicker()
                }
            }, 50)

            if (customDateRange.value.start && customDateRange.value.end) {
                emit('period-change', 'custom', customDateRange.value)
            }
        } else {
            customDateRange.value = { start: '', end: '' }

            const dateRange = getDateRangeForPeriod(period as PeriodType)
            emit('period-change', period as PeriodType, dateRange)
        }
    }

    const handleCustomRangeSelected = (range: DateRange) => {
        customDateRange.value = range

        if (range.start && range.end) {
            selectedPeriod.value = 'custom'
            emit('period-change', 'custom', range)
        } else if (!range.start && !range.end) {
            selectedPeriod.value = 'today'
            customDateRange.value = { start: '', end: '' }

            nextTick(() => {
                if (segmentedButtonsRef.value?.selectSegment) {
                    const todayOption = periodOptions.value.find((opt) => opt.value === 'today')
                    if (todayOption) {
                        const todayIndex = periodOptions.value.indexOf(todayOption)
                        segmentedButtonsRef.value.selectSegment(todayOption, todayIndex)
                    }
                }
            })

            const todayDateRange = getDateRangeForPeriod('today')
            emit('period-change', 'today', todayDateRange)
        }
    }

    const handleLegendTabChange = (tab: string) => {
        activeLegendTab.value = tab
        emit('legend-tab-change', tab)
    }

    const handleLegendItemClick = (item: LegendItem) => {
        emit('legend-item-click', item)
    }

    const handleLegendItemHover = (item: LegendItem | null) => {
        emit('legend-item-hover', item)

        if (chartInstance.value && props.chartType === 'doughnut') {
            const chart = chartInstance.value

            if (item) {
                const dataIndex = props.data?.labels?.indexOf(item.label)

                if (dataIndex !== undefined && dataIndex >= 0) {
                    chart.setActiveElements([
                        {
                            datasetIndex: 0,
                            index: dataIndex,
                        },
                    ])
                    chart.update('none')

                    chart.tooltip.setActiveElements(
                        [
                            {
                                datasetIndex: 0,
                                index: dataIndex,
                            },
                        ],
                        {
                            x: chart.canvas.width / 2,
                            y: chart.canvas.height / 2,
                        }
                    )
                    chart.update('none')
                }
            } else {
                chart.setActiveElements([])
                chart.tooltip.setActiveElements([])
                chart.update('none')
            }
        }
    }

    const handleInfoClick = () => {
        emit('info-click')
    }

    watch(
        () => props.data,
        (newData) => {
            if (isComponentReady.value && newData) {
                setTimeout(updateChart, 100)
            }
        },
        { deep: false }
    )

    watch(
        () => props.isLoading,
        (isLoading) => {
            if (!isLoading && isComponentReady.value && hasValidData.value) {
                setTimeout(updateChart, 200)
            }
        }
    )

    // Watch hasValidData to create chart when data becomes available
    watch(
        hasValidData,
        (newHasData, oldHasData) => {
            // Only trigger when data goes from invalid to valid (data just arrived)
            if (newHasData && !oldHasData && isComponentReady.value) {
                setTimeout(createChart, 150)
            }
        }
    )

    const forceUpdate = async () => {
        await nextTick()
        if (hasValidData.value && isComponentReady.value) {
            await updateChart()
        }
    }

    onMounted(() => {
        isComponentReady.value = true

        // Initialize custom date range if defaultPeriod is 'custom' and initialDateRange is provided
        if (props.defaultPeriod === 'custom') {
            if (props.initialDateRange?.start && props.initialDateRange?.end) {
                // Există date range salvat, inițializează și emit period-change
                customDateRange.value = props.initialDateRange

                // Emit period-change to load data for the custom range (NU deschide DatePicker)
                nextTick(() => {
                    emit('period-change', 'custom', props.initialDateRange)
                })
            } else {
                // NU există date range salvat, resetează la 'today'
                selectedPeriod.value = 'today'
                customDateRange.value = { start: '', end: '' }

                // Update SegmentedButtons la 'today'
                nextTick(() => {
                    if (segmentedButtonsRef.value?.selectSegment) {
                        const todayOption = periodOptions.value.find((opt) => opt.value === 'today')
                        if (todayOption) {
                            const todayIndex = periodOptions.value.indexOf(todayOption)
                            segmentedButtonsRef.value.selectSegment(todayOption, todayIndex)
                        }
                    }

                    // Emit period-change pentru 'today'
                    const todayDateRange = getDateRangeForPeriod('today')
                    emit('period-change', 'today', todayDateRange)
                })
            }
        }

        if (hasValidData.value) {
            setTimeout(createChart, 300)
        }
    })

    onBeforeUnmount(() => {
        isComponentReady.value = false
        destroyChart()
    })

    defineExpose({
        updateChart: forceUpdate, // Expose as updateChart for backward compatibility
        destroyChart,
        createChart,
        getInstance: () => chartInstance.value,
        getInstanceId: () => instanceId,
    })
</script>

<style scoped lang="scss">
    .chart-component {
        @apply w-full;
        transition: all 0.3s ease;
        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }
    }

    .chart-card {
        @apply transition-all duration-200 w-full h-full flex flex-col;
        box-shadow:
            0 1px 18px 0 rgba(90, 93, 101, 0.12),
            0 6px 10px 0 rgba(90, 93, 101, 0.14);
    }

    .chart-wrapper {
        @apply relative flex-1 min-h-0;
    }

    .canvas-container {
        @apply relative overflow-hidden;
        width: 100%;
        height: 100%;
    }

    .canvas-container canvas {
        @apply block z-[1] relative;
        max-height: 100%;
    }

    .chart-legend-tabs button {
        @apply outline-none focus:outline-none;
    }

    .chart-controls {
        @apply mt-auto;
    }
</style>
