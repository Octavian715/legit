import type {
    DashboardFilters,
    DashboardChartFilters,
    DashboardSortField,
    DashboardSortDirection,
    BuyerChartData,
    SupplierChartData,
} from '~/types/userDashboard'
import { startOfDay, differenceInDays, isAfter, isValid, parseISO } from 'date-fns'

export const useUserDashboard = () => {
    const userDashboardStore = useUserDashboardStore()
    const { t } = useI18n()
    const toast = useToastNotification()

    const validateFilters = (filters: DashboardFilters): { isValid: boolean; errors: string[] } => {
        const errors: string[] = []

        if (filters.search) {
            const trimmedSearch = filters.search.trim()
            if (trimmedSearch.length > 0 && trimmedSearch.length < 2) {
                errors.push(t('filters.searchTooShort'))
            }
            if (trimmedSearch.length > 255) {
                errors.push(t('filters.searchTooLong'))
            }
        }

        if (filters.business_type_ids && filters.business_type_ids.length > 20) {
            errors.push(t('filters.tooManyBusinessTypes'))
        }

        if (filters.country_ids && filters.country_ids.length > 50) {
            errors.push(t('filters.tooManyCountries'))
        }

        if (filters.min_total_amount !== undefined && filters.min_total_amount < 0) {
            errors.push(t('filters.invalidMinAmount'))
        }

        if (filters.max_total_amount !== undefined && filters.max_total_amount < 0) {
            errors.push(t('filters.invalidMaxAmount'))
        }

        if (
            filters.min_total_amount !== undefined &&
            filters.max_total_amount !== undefined &&
            filters.min_total_amount > filters.max_total_amount
        ) {
            errors.push(t('filters.invalidAmountRange'))
        }

        if (filters.start_date && filters.end_date) {
            const startDate = parseISO(filters.start_date)
            const endDate = parseISO(filters.end_date)

            if (!isValid(startDate) || !isValid(endDate)) {
                errors.push(t('filters.invalidDates'))
            } else {
                const startDay = startOfDay(startDate)
                const endDay = startOfDay(endDate)
                const today = startOfDay(new Date())

                if (isAfter(startDay, endDay)) {
                    errors.push(t('filters.invalidDateRange'))
                }

                const daysDifference = differenceInDays(endDay, startDay)
                if (daysDifference > 365) {
                    errors.push(t('filters.dateRangeTooLarge'))
                }

                if (isAfter(startDay, today) || isAfter(endDay, today)) {
                    errors.push(t('filters.futureDatesNotAllowed'))
                }
            }
        }

        if (filters.page !== undefined && filters.page < 1) {
            errors.push(t('filters.invalidPage'))
        }

        if (filters.per_page !== undefined && (filters.per_page < 1 || filters.per_page > 100)) {
            errors.push(t('filters.invalidPerPage'))
        }

        return {
            isValid: errors.length === 0,
            errors,
        }
    }

    const validateChartFilters = (
        filters: DashboardChartFilters
    ): { isValid: boolean; errors: string[] } => {
        const errors: string[] = []

        if (filters.start_date && filters.end_date) {
            const startDate = parseISO(filters.start_date)
            const endDate = parseISO(filters.end_date)

            if (!isValid(startDate) || !isValid(endDate)) {
                errors.push(t('filters.invalidDates'))
            } else {
                const startDay = startOfDay(startDate)
                const endDay = startOfDay(endDate)
                const today = startOfDay(new Date())

                if (isAfter(startDay, endDay)) {
                    errors.push(t('filters.invalidDateRange'))
                }

                if (isAfter(startDay, today) || isAfter(endDay, today)) {
                    errors.push(t('filters.futureDatesNotAllowed'))
                }
            }
        }

        if (filters.period && filters.start_date) {
            errors.push(t('filters.cannotUseBothPeriodAndDates'))
        }

        return {
            isValid: errors.length === 0,
            errors,
        }
    }

    const getAllBuyersWithFilters = async (filters: DashboardFilters = {}): Promise<boolean> => {
        try {
            const validation = validateFilters(filters)
            if (!validation.isValid) {
                validation.errors.forEach((error) => toast.error(error))
                return false
            }

            const result = await userDashboardStore.fetchAllBuyers(filters)
            return !!result
        } catch (error: any) {
            const message =
                error.statusCode === 422
                    ? t('buyerDashboard.validationError')
                    : t('buyerDashboard.buyersError')
            toast.error(error.message || message)
            return false
        }
    }

    const getAllSuppliersWithFilters = async (filters: DashboardFilters = {}): Promise<boolean> => {
        try {
            const validation = validateFilters(filters)
            if (!validation.isValid) {
                validation.errors.forEach((error) => toast.error(error))
                return false
            }

            const result = await userDashboardStore.fetchAllSuppliers(filters)
            return !!result
        } catch (error: any) {
            const message =
                error.statusCode === 422
                    ? t('buyerDashboard.validationError')
                    : t('buyerDashboard.suppliersError')
            toast.error(error.message || message)
            return false
        }
    }

    const loadBuyersFilters = async (): Promise<boolean> => {
        try {
            await userDashboardStore.fetchAllBuyersFilters()
            return true
        } catch (error: any) {
            toast.error(error.message || t('buyerDashboard.filtersError'))
            return false
        }
    }

    const loadSuppliersFilters = async (): Promise<boolean> => {
        try {
            await userDashboardStore.fetchAllSuppliersFilters()
            return true
        } catch (error: any) {
            toast.error(error.message || t('buyerDashboard.filtersError'))
            return false
        }
    }

    const loadBuyersChartData = async (filters: DashboardFilters = {}): Promise<boolean> => {
        try {
            await userDashboardStore.fetchBuyersChartData(filters)
            return true
        } catch (error: any) {
            toast.error(error.message || t('buyerDashboard.chartDataError'))
            return false
        }
    }

    const loadBuyersBusinessTypeChart = async (
        filters: DashboardChartFilters = {}
    ): Promise<BuyerChartData | null> => {
        try {
            const validation = validateChartFilters(filters)
            if (!validation.isValid) {
                validation.errors.forEach((error) => toast.error(error))
                return null
            }

            return await userDashboardStore.fetchBuyersBusinessTypeChart(filters)
        } catch (error: any) {
            toast.error(error.message || t('buyerDashboard.chartDataError'))
            return null
        }
    }

    const loadBuyersCountryChart = async (
        filters: DashboardChartFilters = {}
    ): Promise<BuyerChartData | null> => {
        try {
            const validation = validateChartFilters(filters)
            if (!validation.isValid) {
                validation.errors.forEach((error) => toast.error(error))
                return null
            }

            return await userDashboardStore.fetchBuyersCountryChart(filters)
        } catch (error: any) {
            toast.error(error.message || t('buyerDashboard.chartDataError'))
            return null
        }
    }

    const loadSuppliersBusinessTypeChart = async (
        filters: DashboardChartFilters = {}
    ): Promise<SupplierChartData | null> => {
        try {
            const validation = validateChartFilters(filters)
            if (!validation.isValid) {
                validation.errors.forEach((error) => toast.error(error))
                return null
            }

            return await userDashboardStore.fetchSuppliersBusinessTypeChart(filters)
        } catch (error: any) {
            toast.error(error.message || t('buyerDashboard.chartDataError'))
            return null
        }
    }

    const loadSuppliersCountryChart = async (
        filters: DashboardChartFilters = {}
    ): Promise<SupplierChartData | null> => {
        try {
            const validation = validateChartFilters(filters)
            if (!validation.isValid) {
                validation.errors.forEach((error) => toast.error(error))
                return null
            }

            return await userDashboardStore.fetchSuppliersCountryChart(filters)
        } catch (error: any) {
            toast.error(error.message || t('buyerDashboard.chartDataError'))
            return null
        }
    }

    const buildFilters = (
        search?: string,
        businessTypeIds?: number[],
        countryIds?: number[],
        dateRange?: { start_date: string; end_date: string },
        amountRange?: { min_total_amount: number; max_total_amount: number },
        pagination?: { page: number; per_page: number },
        sort?: { sort_by: DashboardSortField; sort_direction: DashboardSortDirection },
        period?: 'today' | 'last_month' | 'last_year'
    ): DashboardFilters => {
        return {
            ...(search?.trim() && { search: search.trim() }),
            ...(businessTypeIds?.length && { business_type_ids: businessTypeIds }),
            ...(countryIds?.length && { country_ids: countryIds }),
            ...(dateRange && {
                start_date: dateRange.start_date,
                end_date: dateRange.end_date,
            }),
            ...(amountRange && {
                min_total_amount: amountRange.min_total_amount,
                max_total_amount: amountRange.max_total_amount,
            }),
            ...(pagination && {
                page: pagination.page,
                per_page: pagination.per_page,
            }),
            ...(sort && {
                sort_by: sort.sort_by,
                sort_direction: sort.sort_direction,
            }),
            ...(period && { period }),
        }
    }

    const buildChartFilters = (
        period?: 'today' | 'last_month' | 'last_year',
        dateRange?: { start_date: string; end_date: string }
    ): DashboardChartFilters => {
        return {
            ...(period && { period }),
            ...(dateRange && {
                start_date: dateRange.start_date,
                end_date: dateRange.end_date,
            }),
        }
    }

    const formatAmount = (amount: string | number): string => {
        if (typeof amount === 'string') return amount
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount)
    }

    const formatCompanyName = (name: string): string => {
        if (!name || name.trim() === '') return t('common.unknown')
        return name.trim()
    }

    const formatCountryName = (country: string): string => {
        if (!country || country.trim() === '') return t('common.unknown')
        return country.trim()
    }

    const formatBusinessType = (businessType: string): string => {
        if (!businessType || businessType.trim() === '') return t('common.unknown')
        return businessType.trim()
    }

    const formatChartBusinessTypeName = (businessTypeBreakdown: any): string => {
        return businessTypeBreakdown?.business_type_name || t('common.unknown')
    }

    const formatChartCountryName = (countryBreakdown: any): string => {
        return countryBreakdown?.country_name || countryBreakdown?.country || t('common.unknown')
    }

    const getCountryFlag = (countryCode: string): string => {
        if (!countryCode || countryCode.length !== 2) return ''
        return countryCode.toLowerCase()
    }

    const canLoadMore = computed(() => {
        const buyersMeta = userDashboardStore.buyersMeta
        const suppliersMeta = userDashboardStore.suppliersMeta

        return {
            buyers: buyersMeta ? buyersMeta.current_page < buyersMeta.last_page : false,
            suppliers: suppliersMeta ? suppliersMeta.current_page < suppliersMeta.last_page : false,
        }
    })

    return {
        isLoading: computed(() => userDashboardStore.isLoading),
        error: computed(() => userDashboardStore.error),
        buyers: computed(() => userDashboardStore.buyers),
        suppliers: computed(() => userDashboardStore.suppliers),
        buyersMeta: computed(() => userDashboardStore.buyersMeta),
        suppliersMeta: computed(() => userDashboardStore.suppliersMeta),
        buyersFilterOptions: computed(() => userDashboardStore.buyersFilterOptions),
        suppliersFilterOptions: computed(() => userDashboardStore.suppliersFilterOptions),
        buyersChartData: computed(() => userDashboardStore.buyersChartData),
        buyersBusinessTypeChart: computed(() => userDashboardStore.buyersBusinessTypeChart),
        buyersCountryChart: computed(() => userDashboardStore.buyersCountryChart),
        suppliersBusinessTypeChart: computed(() => userDashboardStore.suppliersBusinessTypeChart),
        suppliersCountryChart: computed(() => userDashboardStore.suppliersCountryChart),
        totalBuyers: computed(() => userDashboardStore.totalBuyers),
        totalSuppliers: computed(() => userDashboardStore.totalSuppliers),
        hasBuyers: computed(() => userDashboardStore.hasBuyers),
        hasSuppliers: computed(() => userDashboardStore.hasSuppliers),
        getActiveFilters: computed(() => userDashboardStore.getActiveFilters),
        hasBuyerChartData: computed(() => userDashboardStore.hasBuyerChartData),
        hasSupplierChartData: computed(() => userDashboardStore.hasSupplierChartData),
        canLoadMore,
        getAllBuyersWithFilters,
        getAllSuppliersWithFilters,
        loadBuyersFilters,
        loadSuppliersFilters,
        loadBuyersChartData,
        loadBuyersBusinessTypeChart,
        loadBuyersCountryChart,
        loadSuppliersBusinessTypeChart,
        loadSuppliersCountryChart,
        buildFilters,
        buildChartFilters,
        validateFilters,
        validateChartFilters,
        formatAmount,
        formatCompanyName,
        formatCountryName,
        formatBusinessType,
        formatChartBusinessTypeName,
        formatChartCountryName,
        getCountryFlag,
        clearBuyers: userDashboardStore.clearBuyers,
        clearSuppliers: userDashboardStore.clearSuppliers,
        clearFilters: userDashboardStore.clearFilters,
        clearCache: userDashboardStore.clearCache,
        resetError: userDashboardStore.resetError,
    }
}
