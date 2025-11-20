// composables/usePriceValidation.ts
import { computed } from 'vue'
import type { ExtendedUser } from '~/types/auth'

export interface PriceValidationResult {
    isValid: boolean
    hasLocalPrice: boolean
    hasExportPrice: boolean
    shouldHaveExport: boolean
    missingConfigurations: string[]
    redirectPath: string | null
}

export const usePriceValidation = () => {
    const userStore = useUserStore()
    const localePath = useLocalePath()
    const { t } = useI18n()

    /**
     * Validates if user has required price configurations
     */
    const validatePriceConfiguration = (user: ExtendedUser | null): PriceValidationResult => {
        const result: PriceValidationResult = {
            isValid: true,
            hasLocalPrice: false,
            hasExportPrice: false,
            shouldHaveExport: false,
            missingConfigurations: [],
            redirectPath: null,
        }

        if (!user) {
            result.isValid = false
            result.missingConfigurations.push('userNotFound')
            result.redirectPath = localePath('/login')
            return result
        }

        // Check local price configuration
        result.hasLocalPrice = Boolean(user.default_local_currency?.id)

        // Check if user should have export prices
        result.shouldHaveExport = Boolean(user.export_details?.id)

        // Check export price configuration
        result.hasExportPrice = Boolean(user.default_export_currency?.id)

        // Validate configurations
        if (!result.hasLocalPrice) {
            result.isValid = false
            result.missingConfigurations.push('localPriceMissing')
            result.redirectPath = localePath('/supplier/settings/currency')
        }

        if (result.shouldHaveExport && !result.hasExportPrice) {
            result.isValid = false
            result.missingConfigurations.push('exportPriceMissing')
            result.redirectPath = localePath('/supplier/settings/currency')
        }

        return result
    }

    /**
     * Get user's configured currencies
     */
    const userCurrencies = computed(() => {
        const user = userStore.user
        return {
            local: user?.default_local_currency || null,
            export: user?.default_export_currency || null,
        }
    })

    /**
     * Check if user has valid price configuration
     */
    const hasPriceConfiguration = computed(() => {
        const validation = validatePriceConfiguration(userStore.user)
        return validation.isValid
    })

    /**
     * Get default currency for price type
     */
    const getDefaultCurrencyForPriceType = (priceType: 'local' | 'export') => {
        const currencies = userCurrencies.value
        return priceType === 'local' ? currencies.local : currencies.export
    }

    /**
     * Format price with user's currency
     */
    const formatPriceWithCurrency = (
        price: number,
        priceType: 'local' | 'export' = 'local'
    ): string => {
        const currency = getDefaultCurrencyForPriceType(priceType)
        if (!currency) return price.toFixed(2)

        return `${currency.symbol || ''}${price.toFixed(2)}`
    }

    /**
     * Validate and show toast notification if configuration is invalid
     */
    const validateAndNotify = (): boolean => {
        const validation = validatePriceConfiguration(userStore.user)

        if (!validation.isValid) {
            const toast = useToastNotification()
            const messages = validation.missingConfigurations.map((key) =>
                t(`prices.validation.${key}`)
            )

            toast.warning(messages.join('. '), {
                duration: 5000,
                description: t('prices.validation.redirectToSettings'),
            })
        }

        return validation.isValid
    }

    return {
        validatePriceConfiguration,
        userCurrencies,
        hasPriceConfiguration,
        getDefaultCurrencyForPriceType,
        formatPriceWithCurrency,
        validateAndNotify,
    }
}
