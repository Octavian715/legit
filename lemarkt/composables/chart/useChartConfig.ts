import { useI18n } from 'vue-i18n'
import { toRaw } from 'vue'
import type { ChartDataPoint, ChartData, ChartDataset } from '~/types/chart'

interface Currency {
    id: number
    code: string
    symbol: string
}

export const useChartConfig = () => {
    const { t } = useI18n()

    const chartColors = {
        revenue: '#3B82F6',
        orders: '#22C55E',
        connections: '#3B82F6',
        followers: '#22C55E',
        disconnections: '#EF4444',
        unfollowers: '#FB923C',
        primary: '#3B82F6',
        secondary: '#8B5CF6',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#06B6D4',
        purple: '#8B5CF6',
        pink: '#EC4899',
        indigo: '#6366F1',
        teal: '#14B8A6',
    }

    /**
     * Create single stat chart data structure - COMPLETELY STATIC WITH VALIDATION
     */
    const createSingleStatChart = (
        data: any[], // Accept any array and validate/transform
        label: string,
        type: 'connections' | 'followers' | 'disconnections' | 'unfollowers' | 'revenue' | 'orders',
        chartType: 'line' | 'bar' = 'line'
    ): ChartData => {
        // Handle empty or invalid data
        if (!data || !Array.isArray(data) || data.length === 0) {
            return { labels: [], datasets: [] }
        }

        // Extract and transform data safely
        const rawData = toRaw(data)

        // Flexible data extraction - handle different API response formats
        const processedData = rawData.map((item: any, index: number) => {
            // Try different possible field names for the period/label
            const period =
                item.period || item.label || item.date || item.time || `Period ${index + 1}`

            // Try different possible field names for the value
            const value =
                item.value ?? item.count ?? item.total ?? item.amount ?? item.average_value ?? 0

            return {
                period: String(period),
                value: Number(value) || 0,
            }
        })

        // Filter out entries where value is 0 to show only meaningful data
        const filteredData = processedData.filter((item) => item.value !== 0)

        // If all values are 0, return empty chart
        if (filteredData.length === 0) {
            return { labels: [], datasets: [] }
        }

        // Create labels and values arrays from filtered data
        const labels = filteredData.map((item) => item.period)
        const values = filteredData.map((item) => item.value)

        // Validate we have data
        if (labels.length === 0 || values.length === 0) {
            return { labels: [], datasets: [] }
        }

        const color = chartColors[type] || chartColors.primary

        // Create dataset with proper Chart.js structure
        const dataset: ChartDataset = {
            label,
            data: [...values], // Ensure new array
            borderColor: color,
            borderWidth: chartType === 'line' ? 2 : 1,
        }

        // Apply chart type specific styling
        if (chartType === 'line') {
            Object.assign(dataset, {
                backgroundColor: `${color}20`, // Semi-transparent fill
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBorderWidth: 2,
                pointBorderColor: '#ffffff',
                pointBackgroundColor: color,
            })
        } else {
            Object.assign(dataset, {
                backgroundColor: `${color}80`, // Semi-transparent bars
                borderRadius: 4,
                borderSkipped: false,
            })
        }

        const result = {
            labels: [...labels],
            datasets: [{ ...dataset }],
        }
        return result
    }

    /**
     * Create sample/mock data for testing
     */
    const createSampleChartData = (
        type: 'connections' | 'followers' | 'disconnections' | 'unfollowers',
        chartType: 'line' | 'bar' = 'line'
    ): ChartData => {
        const sampleData = [
            { period: 'Jan', value: Math.floor(Math.random() * 100) + 10 },
            { period: 'Feb', value: Math.floor(Math.random() * 100) + 10 },
            { period: 'Mar', value: Math.floor(Math.random() * 100) + 10 },
            { period: 'Apr', value: Math.floor(Math.random() * 100) + 10 },
            { period: 'May', value: Math.floor(Math.random() * 100) + 10 },
            { period: 'Jun', value: Math.floor(Math.random() * 100) + 10 },
        ]

        return createSingleStatChart(sampleData, `Sample ${type}`, type, chartType)
    }

    /**
     * Transform network stats API response to chart data
     */
    const transformNetworkStatsToChart = (
        statsResponse: any,
        type: 'connections' | 'followers' | 'disconnections' | 'unfollowers',
        chartType: 'line' | 'bar' = 'line'
    ): ChartData => {
        // Handle different possible response structures
        let chartData = statsResponse?.chart_data || statsResponse?.data || statsResponse

        // If no chart_data, try to use the response directly if it's an array
        if (!chartData && Array.isArray(statsResponse)) {
            chartData = statsResponse
        }

        // If still no data, create empty chart
        if (!chartData || !Array.isArray(chartData)) {
            return { labels: [], datasets: [] }
        }

        const label = `${type.charAt(0).toUpperCase() + type.slice(1)}`
        return createSingleStatChart(chartData, label, type, chartType)
    }

    /**
     * Get Chart.js options configuration
     */
    const getStaticChartOptions = (
        type: 'line' | 'bar' = 'bar',
        currency?: Currency,
        valueType: 'currency' | 'number' = 'number'
    ) => {
        const isCurrency = currency && valueType === 'currency'

        return {
            responsive: true,
            maintainAspectRatio: false,
            animation: false, // Disable to prevent reactivity issues
            interaction: {
                intersect: false,
                mode: 'index' as const,
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom' as const,
                    align: 'center' as const,
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 15,
                        color: '#6B7280',
                        font: {
                            size: 12,
                            weight: '500',
                        },
                    },
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderWidth: 0,
                    cornerRadius: 8,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function (context: any) {
                            const label = context.dataset.label || ''
                            const value = context.parsed.y || 0

                            if (isCurrency && currency) {
                                const formatted = formatCurrency(value, currency)
                                return `${label}: ${formatted}`
                            }

                            return `${label}: ${value}`
                        },
                    },
                },
            },
            scales: {
                x: {
                    grid: {
                        display: false,
                    },
                    border: {
                        display: false,
                    },
                    ticks: {
                        color: '#9CA3AF',
                        font: {
                            size: 11,
                        },
                        maxRotation: 0,
                        minRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 10,
                    },
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(156, 163, 175, 0.2)',
                        drawBorder: false,
                    },
                    border: {
                        display: false,
                    },
                    ticks: {
                        color: '#9CA3AF',
                        font: {
                            size: 11,
                        },
                        callback: function (value: any) {
                            if (!Number.isInteger(value)) return null

                            if (isCurrency && currency) {
                                if (value >= 1000000) {
                                    return currency.symbol + (value / 1000000).toFixed(1) + 'M'
                                }
                                if (value >= 1000) {
                                    return currency.symbol + (value / 1000).toFixed(1) + 'k'
                                }
                                return currency.symbol + value
                            }

                            if (value >= 1000000) {
                                return (value / 1000000).toFixed(1) + 'M'
                            }
                            if (value >= 1000) {
                                return (value / 1000).toFixed(value >= 10000 ? 0 : 1) + 'k'
                            }
                            return value.toString()
                        },
                    },
                },
            },
        }
    }

    /**
     * Format currency values
     */
    const formatCurrency = (value: number, currency: Currency): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.code,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(value)
    }

    return {
        chartColors,
        createSingleStatChart,
        createSampleChartData,
        transformNetworkStatsToChart,
        getStaticChartOptions,
        formatCurrency,
    }
}
