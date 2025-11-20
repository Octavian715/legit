// ~/composables/chart/useChartPeriods.ts
import type { PeriodType, DateRange } from '~/types/chart'

export const useChartPeriods = () => {
    const { t } = useI18n()
    const {
        formatDate,
        formatDateForInput,
        getStartOfMonth,
        getEndOfMonth,
        subtractMonthsFromDate,
        subtractYearsFromDate,
        getDaysDifference,
        isValidDate,
    } = useDate()

    /**
     * Get date range for a specific period type
     * Returns start and end dates in YYYY-MM-DD format
     */
    const getDateRangeForPeriod = (period: PeriodType): DateRange => {
        const today = new Date()

        switch (period) {
            case 'today':
                return {
                    start: formatDateForInput(today),
                    end: formatDateForInput(today),
                }

            case 'lastMonth': {
                const lastMonth = subtractMonthsFromDate(today, 1)
                return {
                    start: formatDateForInput(getStartOfMonth(lastMonth)),
                    end: formatDateForInput(getEndOfMonth(lastMonth)),
                }
            }

            case 'lastYear': {
                const yearAgo = subtractYearsFromDate(today, 1)
                return {
                    start: formatDateForInput(yearAgo),
                    end: formatDateForInput(today),
                }
            }

            case 'custom':
                return { start: '', end: '' }

            default:
                return {
                    start: formatDateForInput(today),
                    end: formatDateForInput(today),
                }
        }
    }

    /**
     * Get simple period options for segmented buttons
     * Used in Chart component
     */
    const getSimplePeriodOptions = (includeCustom: boolean = true) => {
        const options = [
            { value: 'today', label: t('date.today', 'Today'), active: true },
            { value: 'lastMonth', label: t('date.lastMonth', 'Last Month'), active: true },
            { value: 'lastYear', label: t('date.lastYear', 'Last Year'), active: true },
        ]

        if (includeCustom) {
            options.push({
                value: 'custom',
                label: t('filters.customDateRange', 'Custom'),
                active: true,
            })
        }

        return options
    }

    /**
     * Format period label for display
     */
    const formatPeriodLabel = (period: PeriodType, customRange?: DateRange): string => {
        if (period === 'custom' && customRange?.start && customRange?.end) {
            const startStr = formatDate(customRange.start, 'MMM dd, yyyy')
            const endStr = formatDate(customRange.end, 'MMM dd, yyyy')
            return `${startStr} - ${endStr}`
        }

        const periodLabels: Record<PeriodType, string> = {
            today: t('date.today', 'Today'),
            lastMonth: t('date.lastMonth', 'Last Month'),
            lastYear: t('date.lastYear', 'Last Year'),
            custom: t('filters.customDateRange', 'Custom'),
            yesterday: t('date.yesterday', 'Yesterday'),
            thisWeek: t('date.thisWeek', 'This Week'),
            lastWeek: t('date.lastWeek', 'Last Week'),
            thisMonth: t('date.thisMonth', 'This Month'),
            last30Days: t('date.last30Days', 'Last 30 Days'),
            last90Days: t('date.last90Days', 'Last 90 Days'),
            thisYear: t('date.thisYear', 'This Year'),
        }

        return periodLabels[period] || period
    }

    /**
     * Calculate percentage change between two values
     */
    const calculatePercentageChange = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0
        return Math.round(((current - previous) / previous) * 100)
    }

    /**
     * Format large numbers for display (1.2k, 3.4M, etc)
     */
    const formatChartValue = (value: number, decimals: number = 1): string => {
        if (value >= 1000000) {
            return `${(value / 1000000).toFixed(decimals)}M`
        }
        if (value >= 1000) {
            return `${(value / 1000).toFixed(decimals)}k`
        }
        return value.toString()
    }

    /**
     * Get appropriate date format based on period
     */
    const getChartDateFormat = (period: PeriodType): string => {
        const formatMap: Record<PeriodType, string> = {
            today: 'HH:mm',
            yesterday: 'HH:mm',
            thisWeek: 'EEE',
            lastWeek: 'EEE',
            thisMonth: 'MMM dd',
            lastMonth: 'MMM dd',
            last30Days: 'MMM dd',
            last90Days: 'MMM',
            thisYear: 'MMM',
            lastYear: 'MMM',
            custom: 'MMM dd',
        }

        return formatMap[period] || 'MMM dd'
    }

    /**
     * Check if a date range is valid
     */
    const isValidDateRange = (range: DateRange): boolean => {
        if (!range.start || !range.end) return false

        return (
            isValidDate(range.start) &&
            isValidDate(range.end) &&
            new Date(range.start) <= new Date(range.end)
        )
    }

    /**
     * Get the number of days between two dates
     */
    const getDaysBetween = (range: DateRange): number => {
        if (!isValidDateRange(range)) return 0
        return Math.abs(getDaysDifference(range.end, range.start))
    }

    /**
     * Format a date range for API request
     */
    const formatDateRangeForAPI = (
        range: DateRange
    ): { start_date: string; end_date: string } | null => {
        if (!isValidDateRange(range)) return null

        return {
            start_date: range.start,
            end_date: range.end,
        }
    }

    /**
     * Format short date range (for display in charts)
     */
    const formatDateRangeShort = (range: DateRange): string => {
        if (!range.start || !range.end) return ''

        const startStr = formatDate(range.start, 'MMM dd')
        const endStr = formatDate(range.end, 'MMM dd, yyyy')

        return `${startStr} - ${endStr}`
    }

    return {
        getDateRangeForPeriod,
        getSimplePeriodOptions,
        formatPeriodLabel,
        calculatePercentageChange,
        formatChartValue,
        getChartDateFormat,
        isValidDateRange,
        getDaysBetween,
        formatDateRangeForAPI,
        formatDateRangeShort,
    }
}
