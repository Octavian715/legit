import { useI18n } from 'vue-i18n'
import { useUserStore } from '~/stores/user'
import { computed } from 'vue'

export const useFormatters = () => {
    const { locale } = useI18n()
    const userStore = useUserStore()

    // Make currency reactive to user store changes
    const currentCurrency = computed(() => userStore.defaultCurrency)
    const currentCurrencySymbol = computed(() => userStore.currencySymbol)
    const currentCurrencyCode = computed(() => userStore.currencyCode)

    const formatCurrency = (
        value: number | string | null | undefined,
        currencySymbol?: string,
        decimals: number = 2
    ): string => {
        if (value === null || value === undefined) return '—'

        const numValue = typeof value === 'string' ? parseFloat(value) : value
        if (isNaN(numValue)) return '—'

        // Use provided symbol or fall back to reactive user currency symbol
        const symbol = currencySymbol || currentCurrencySymbol.value

        const formattedNumber = numValue.toLocaleString(locale.value, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        })

        return `${symbol}${formattedNumber}`
    }

    const formatCurrencyWithCode = (
        value: number | string | null | undefined,
        currencyCode?: string,
        decimals: number = 2
    ): string => {
        if (value === null || value === undefined) return '—'

        const numValue = typeof value === 'string' ? parseFloat(value) : value
        if (isNaN(numValue)) return '—'

        // Use provided code or fall back to reactive user currency code
        const code = currencyCode || currentCurrencyCode.value

        return new Intl.NumberFormat(locale.value, {
            style: 'currency',
            currency: code,
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(numValue)
    }

    // Helper function to format with user's default currency
    const formatWithUserCurrency = (
        value: number | string | null | undefined,
        decimals: number = 2,
        useCode: boolean = false
    ): string => {
        if (useCode) {
            return formatCurrencyWithCode(value, currentCurrencyCode.value, decimals)
        }
        return formatCurrency(value, currentCurrencySymbol.value, decimals)
    }

    const calculateProfit = (sellingPrice: number, costPrice: number): number => {
        return sellingPrice - costPrice
    }

    const calculateMarkupPercentage = (sellingPrice: number, costPrice: number): number => {
        if (costPrice <= 0) return 0

        const profit = sellingPrice - costPrice
        return (profit / costPrice) * 100
    }

    const formatPercentage = (value: number, decimals: number = 1): string => {
        return `${value.toFixed(decimals)}%`
    }

    return {
        formatCurrency,
        formatCurrencyWithCode,
        formatWithUserCurrency,
        formatPercentage,
        calculateMarkupPercentage,
        calculateProfit,
        // Expose reactive currency info
        currentCurrency,
        currentCurrencySymbol,
        currentCurrencyCode,
    }
}
