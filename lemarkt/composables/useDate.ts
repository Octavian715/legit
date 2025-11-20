// composables/useDate.ts
import {
    format,
    parseISO,
    isValid,
    addDays,
    addMonths,
    addYears,
    subDays,
    subMonths,
    subYears,
    differenceInDays,
    differenceInMonths,
    differenceInYears,
    startOfDay,
    endOfDay,
    startOfMonth,
    endOfMonth,
    startOfYear,
    endOfYear,
    isBefore,
    isAfter,
    isSameDay,
    isSameMonth,
    isSameYear,
} from 'date-fns'
import { enUS, ro, fr, de, es } from 'date-fns/locale'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const localeMap = {
    en: enUS,
    ro: ro,
    fr: fr,
    de: de,
    es: es,
}

export const useDate = () => {
    const { t, locale } = useI18n()

    // Get current locale for date-fns
    const currentLocale = computed(() => localeMap[locale.value as keyof typeof localeMap] || enUS)

    // Current date
    const now = ref(new Date())

    // Get current year
    const getCurrentYear = (): number => {
        return new Date().getFullYear()
    }

    // Format date with locale support
    const formatDate = (date: Date | string, formatString = 'PPP'): string => {
        const dateObj = typeof date === 'string' ? parseISO(date) : date

        if (!isValid(dateObj)) {
            return ''
        }

        return format(dateObj, formatString, { locale: currentLocale.value })
    }

    // Format date for forms (YYYY-MM-DD)
    const formatDateForInput = (date: Date | string): string => {
        const dateObj = typeof date === 'string' ? parseISO(date) : date

        if (!isValid(dateObj)) {
            return ''
        }

        return format(dateObj, 'yyyy-MM-dd')
    }

    // Format datetime for API
    const formatDateTimeForAPI = (date: Date | string): string => {
        const dateObj = typeof date === 'string' ? parseISO(date) : date

        if (!isValid(dateObj)) {
            return ''
        }

        return format(dateObj, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")
    }

    // Parse date from string
    const parseDate = (dateString: string): Date | null => {
        const date = parseISO(dateString)
        return isValid(date) ? date : null
    }

    // Validate date
    const isValidDate = (date: Date | string): boolean => {
        const dateObj = typeof date === 'string' ? parseISO(date) : date
        return isValid(dateObj)
    }

    // Date comparisons
    const isDateBefore = (date1: Date | string, date2: Date | string): boolean => {
        const d1 = typeof date1 === 'string' ? parseISO(date1) : date1
        const d2 = typeof date2 === 'string' ? parseISO(date2) : date2

        if (!isValid(d1) || !isValid(d2)) return false

        return isBefore(d1, d2)
    }

    const isDateAfter = (date1: Date | string, date2: Date | string): boolean => {
        const d1 = typeof date1 === 'string' ? parseISO(date1) : date1
        const d2 = typeof date2 === 'string' ? parseISO(date2) : date2

        if (!isValid(d1) || !isValid(d2)) return false

        return isAfter(d1, d2)
    }

    const areDatesEqual = (date1: Date | string, date2: Date | string): boolean => {
        const d1 = typeof date1 === 'string' ? parseISO(date1) : date1
        const d2 = typeof date2 === 'string' ? parseISO(date2) : date2

        if (!isValid(d1) || !isValid(d2)) return false

        return isSameDay(d1, d2)
    }

    // Date arithmetic
    const addDaysToDate = (date: Date | string, days: number): Date => {
        const dateObj = typeof date === 'string' ? parseISO(date) : date
        return addDays(dateObj, days)
    }

    const addMonthsToDate = (date: Date | string, months: number): Date => {
        const dateObj = typeof date === 'string' ? parseISO(date) : date
        return addMonths(dateObj, months)
    }

    const addYearsToDate = (date: Date | string, years: number): Date => {
        const dateObj = typeof date === 'string' ? parseISO(date) : date
        return addYears(dateObj, years)
    }

    const subtractDaysFromDate = (date: Date | string, days: number): Date => {
        const dateObj = typeof date === 'string' ? parseISO(date) : date
        return subDays(dateObj, days)
    }

    const subtractMonthsFromDate = (date: Date | string, months: number): Date => {
        const dateObj = typeof date === 'string' ? parseISO(date) : date
        return subMonths(dateObj, months)
    }

    const subtractYearsFromDate = (date: Date | string, years: number): Date => {
        const dateObj = typeof date === 'string' ? parseISO(date) : date
        return subYears(dateObj, years)
    }

    // Date differences
    const getDaysDifference = (date1: Date | string, date2: Date | string): number => {
        const d1 = typeof date1 === 'string' ? parseISO(date1) : date1
        const d2 = typeof date2 === 'string' ? parseISO(date2) : date2

        if (!isValid(d1) || !isValid(d2)) return 0

        return differenceInDays(d1, d2)
    }

    const getMonthsDifference = (date1: Date | string, date2: Date | string): number => {
        const d1 = typeof date1 === 'string' ? parseISO(date1) : date1
        const d2 = typeof date2 === 'string' ? parseISO(date2) : date2

        if (!isValid(d1) || !isValid(d2)) return 0

        return differenceInMonths(d1, d2)
    }

    const getYearsDifference = (date1: Date | string, date2: Date | string): number => {
        const d1 = typeof date1 === 'string' ? parseISO(date1) : date1
        const d2 = typeof date2 === 'string' ? parseISO(date2) : date2

        if (!isValid(d1) || !isValid(d2)) return 0

        return differenceInYears(d1, d2)
    }

    // Date range helpers
    const getStartOfDay = (date: Date | string): Date => {
        const dateObj = typeof date === 'string' ? parseISO(date) : date
        return startOfDay(dateObj)
    }

    const getEndOfDay = (date: Date | string): Date => {
        const dateObj = typeof date === 'string' ? parseISO(date) : date
        return endOfDay(dateObj)
    }

    const getStartOfMonth = (date: Date | string): Date => {
        const dateObj = typeof date === 'string' ? parseISO(date) : date
        return startOfMonth(dateObj)
    }

    const getEndOfMonth = (date: Date | string): Date => {
        const dateObj = typeof date === 'string' ? parseISO(date) : date
        return endOfMonth(dateObj)
    }

    const getStartOfYear = (date: Date | string): Date => {
        const dateObj = typeof date === 'string' ? parseISO(date) : date
        return startOfYear(dateObj)
    }

    const getEndOfYear = (date: Date | string): Date => {
        const dateObj = typeof date === 'string' ? parseISO(date) : date
        return endOfYear(dateObj)
    }

    // Business logic helpers for registration
    const getYearOptions = (
        startYear?: number,
        endYear?: number
    ): Array<{ value: string; label: string }> => {
        const currentYear = getCurrentYear()
        const start = startYear || 1950
        const end = endYear || currentYear

        const years = []
        for (let year = end; year >= start; year--) {
            years.push({
                value: year.toString(),
                label: year.toString(),
            })
        }

        return years
    }

    // Certificate validation helpers
    const isDateInFuture = (date: Date | string): boolean => {
        const dateObj = typeof date === 'string' ? parseISO(date) : date

        if (!isValid(dateObj)) return false

        return isAfter(dateObj, now.value)
    }

    const isDateInPast = (date: Date | string): boolean => {
        const dateObj = typeof date === 'string' ? parseISO(date) : date

        if (!isValid(dateObj)) return false

        return isBefore(dateObj, now.value)
    }

    const isCertificateExpired = (expiryDate: Date | string): boolean => {
        return isDateInPast(expiryDate)
    }

    const isCertificateExpiringSoon = (expiryDate: Date | string, daysThreshold = 30): boolean => {
        const dateObj = typeof expiryDate === 'string' ? parseISO(expiryDate) : expiryDate

        if (!isValid(dateObj)) return false

        const warningDate = addDays(now.value, daysThreshold)
        return isBefore(dateObj, warningDate) && isAfter(dateObj, now.value)
    }

    // Relative time formatting
    const getRelativeTime = (date: Date | string): string => {
        const dateObj = typeof date === 'string' ? parseISO(date) : date

        if (!isValid(dateObj)) return ''

        const daysDiff = getDaysDifference(now.value, dateObj)

        if (daysDiff === 0) return t('date.today')
        if (daysDiff === 1) return t('date.yesterday')
        if (daysDiff === -1) return t('date.tomorrow')
        if (daysDiff > 0 && daysDiff <= 7) return t('date.daysAgo', { count: daysDiff })
        if (daysDiff < 0 && daysDiff >= -7) return t('date.inDays', { count: Math.abs(daysDiff) })

        return formatDate(dateObj, 'PP')
    }

    // Update current time (useful for reactive updates)
    const updateCurrentTime = (): void => {
        now.value = new Date()
    }

    return {
        // Current date
        now,

        // Formatting
        formatDate,
        formatDateForInput,
        formatDateTimeForAPI,

        // Parsing and validation
        parseDate,
        isValidDate,

        // Comparisons
        isDateBefore,
        isDateAfter,
        areDatesEqual,

        // Arithmetic
        addDaysToDate,
        addMonthsToDate,
        addYearsToDate,
        subtractDaysFromDate,
        subtractMonthsFromDate,
        subtractYearsFromDate,

        // Differences
        getDaysDifference,
        getMonthsDifference,
        getYearsDifference,

        // Date ranges
        getStartOfDay,
        getEndOfDay,
        getStartOfMonth,
        getEndOfMonth,
        getStartOfYear,
        getEndOfYear,

        // Business helpers
        getCurrentYear,
        getYearOptions,
        isDateInFuture,
        isDateInPast,
        isCertificateExpired,
        isCertificateExpiringSoon,
        getRelativeTime,

        // Utilities
        updateCurrentTime,
    }
}
