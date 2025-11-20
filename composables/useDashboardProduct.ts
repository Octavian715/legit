import type {
    ProductFeaturesFilters,
    ProductPricesFilters,
    ProductOverviewFilters,
    NewProductsFilters,
    SupplierBuyerStatsFilters,
    SupplierBuyerTableFilters,
    AllProductsFilters,
    StatsPeriod,
    ProductFeaturesSort,
    ProductPricesSort,
    SupplierBuyerSort,
    SupplierBuyerCountrySort,
    AllProductsSort,
    SortDirection,
} from '~/types/dashboardProduct'
import { startOfDay, differenceInDays, isAfter, isValid, parseISO } from 'date-fns'

export const useDashboardProduct = () => {
    const dashboardProductStore = useDashboardProductStore()
    const { t } = useI18n()
    const toast = useToastNotification()

    const validateProductFeaturesFilters = (
        filters: ProductFeaturesFilters
    ): { isValid: boolean; errors: string[] } => {
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

        if (filters.brand_names && filters.brand_names.length > 20) {
            errors.push(t('filters.tooManyBrands'))
        }

        if (filters.category_ids && filters.category_ids.length > 50) {
            errors.push(t('filters.tooManyCategories'))
        }

        if (filters.feature_ids && filters.feature_ids.length > 30) {
            errors.push(t('filters.tooManyFeatures'))
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

    const validateProductPricesFilters = (
        filters: ProductPricesFilters
    ): { isValid: boolean; errors: string[] } => {
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

        if (filters.brand_names && filters.brand_names.length > 20) {
            errors.push(t('filters.tooManyBrands'))
        }

        if (filters.local_price_from !== undefined && filters.local_price_to !== undefined) {
            if (filters.local_price_from > filters.local_price_to) {
                errors.push(t('filters.invalidPriceRange', { type: 'local' }))
            }
        }

        if (filters.export_price_from !== undefined && filters.export_price_to !== undefined) {
            if (filters.export_price_from > filters.export_price_to) {
                errors.push(t('filters.invalidPriceRange', { type: 'export' }))
            }
        }

        if (
            filters.local_discount_price_from !== undefined &&
            filters.local_discount_price_to !== undefined
        ) {
            if (filters.local_discount_price_from > filters.local_discount_price_to) {
                errors.push(t('filters.invalidPriceRange', { type: 'local discount' }))
            }
        }

        if (
            filters.export_discount_price_from !== undefined &&
            filters.export_discount_price_to !== undefined
        ) {
            if (filters.export_discount_price_from > filters.export_discount_price_to) {
                errors.push(t('filters.invalidPriceRange', { type: 'export discount' }))
            }
        }

        const priceFields = [
            filters.local_price_from,
            filters.local_price_to,
            filters.export_price_from,
            filters.export_price_to,
            filters.local_discount_price_from,
            filters.local_discount_price_to,
            filters.export_discount_price_from,
            filters.export_discount_price_to,
        ]

        priceFields.forEach((price) => {
            if (price !== undefined && (price < 0 || price > 1000000)) {
                errors.push(t('filters.priceOutOfRange'))
            }
        })

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

    const validateSupplierBuyerTableFilters = (
        filters: SupplierBuyerTableFilters
    ): { isValid: boolean; errors: string[] } => {
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

        if (filters.min_total_amount !== undefined && filters.max_total_amount !== undefined) {
            if (filters.min_total_amount > filters.max_total_amount) {
                errors.push(t('filters.invalidAmountRange'))
            }
        }

        if (filters.min_total_amount !== undefined && filters.min_total_amount < 0) {
            errors.push(t('filters.negativeAmount'))
        }

        if (filters.max_total_amount !== undefined && filters.max_total_amount < 0) {
            errors.push(t('filters.negativeAmount'))
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
                if (daysDifference > 730) {
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

    const validateAllProductsFilters = (
        filters: AllProductsFilters
    ): { isValid: boolean; errors: string[] } => {
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

        if (filters.amount_from !== undefined && filters.amount_to !== undefined) {
            if (filters.amount_from > filters.amount_to) {
                errors.push(t('filters.invalidAmountRange'))
            }
            if (filters.amount_from < 0 || filters.amount_to < 0) {
                errors.push(t('filters.negativeAmount'))
            }
        }

        if (filters.category_ids && filters.category_ids.length > 50) {
            errors.push(t('filters.tooManyCategories'))
        }

        if (filters.brand_names && filters.brand_names.length > 20) {
            errors.push(t('filters.tooManyBrands'))
        }

        if (filters.status_ids && filters.status_ids.length > 10) {
            errors.push(t('filters.tooManyStatuses'))
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

    const getProductsWithFeaturesFiltered = async (
        filters: ProductFeaturesFilters = {}
    ): Promise<boolean> => {
        try {
            const validation = validateProductFeaturesFilters(filters)
            if (!validation.isValid) {
                validation.errors.forEach((error) => toast.error(error))
                return false
            }

            const result = await dashboardProductStore.fetchProductsWithFeatures(filters)
            return !!result
        } catch (error: any) {
            const message =
                error.statusCode === 422
                    ? t('dashboardProduct.validationError')
                    : t('dashboardProduct.featuresError')
            toast.error(error.message || message)
            return false
        }
    }

    const getAllDashboardProductsFiltered = async (
        filters: ProductFeaturesFilters = {}
    ): Promise<boolean> => {
        try {
            const validation = validateProductFeaturesFilters(filters)
            if (!validation.isValid) {
                validation.errors.forEach((error) => toast.error(error))
                return false
            }

            const result = await dashboardProductStore.fetchAllDashboardProducts(filters)
            return !!result
        } catch (error: any) {
            const message =
                error.statusCode === 422 ? t('validation.invalidData') : t('errors.default')
            toast.error(error.message || message)
            return false
        }
    }

    const getProductsWithPricesFiltered = async (
        filters: ProductPricesFilters = {}
    ): Promise<boolean> => {
        try {
            const validation = validateProductPricesFilters(filters)
            if (!validation.isValid) {
                validation.errors.forEach((error) => toast.error(error))
                return false
            }

            const result = await dashboardProductStore.fetchProductsWithPrices(filters)
            return !!result
        } catch (error: any) {
            const message =
                error.statusCode === 422
                    ? t('dashboardProduct.validationError')
                    : t('dashboardProduct.pricesError')
            toast.error(error.message || message)
            return false
        }
    }

    const getAllSupplierProducts = async (filters: AllProductsFilters = {}): Promise<boolean> => {
        try {
            const validation = validateAllProductsFilters(filters)
            if (!validation.isValid) {
                validation.errors.forEach((error) => toast.error(error))
                return false
            }

            await dashboardProductStore.fetchAllSupplierProducts(filters)
            return true
        } catch (error: any) {
            const message =
                error.statusCode === 422
                    ? t('validation.invalidData')
                    : t('dashboardProduct.fetchError')
            toast.error(error.message || message)
            return false
        }
    }

    const getAllBuyerProducts = async (filters: AllProductsFilters = {}): Promise<boolean> => {
        try {
            const validation = validateAllProductsFilters(filters)
            if (!validation.isValid) {
                validation.errors.forEach((error) => toast.error(error))
                return false
            }

            await dashboardProductStore.fetchAllBuyerProducts(filters)
            return true
        } catch (error: any) {
            const message =
                error.statusCode === 422
                    ? t('validation.invalidData')
                    : t('dashboardProduct.fetchError')
            toast.error(error.message || message)
            return false
        }
    }

    const getSupplierBuyerTableFiltered = async (
        endpoint:
            | 'suppliers-business-type'
            | 'suppliers-country'
            | 'buyers-business-type'
            | 'buyers-country'
            | 'all-suppliers'
            | 'all-buyers',
        filters: SupplierBuyerTableFilters = {}
    ): Promise<boolean> => {
        try {
            const validation = validateSupplierBuyerTableFilters(filters)
            if (!validation.isValid) {
                validation.errors.forEach((error) => toast.error(error))
                return false
            }

            const result = await dashboardProductStore.fetchSupplierBuyerTable(endpoint, filters)
            return !!result
        } catch (error: any) {
            const message =
                error.statusCode === 422
                    ? t('dashboardProduct.validationError')
                    : t('dashboardProduct.tableError')
            toast.error(error.message || message)
            return false
        }
    }

    const getSupplierTotalProducts = async (
        filters: ProductOverviewFilters = {}
    ): Promise<boolean> => {
        try {
            await dashboardProductStore.fetchSupplierTotalProducts(filters)
            return true
        } catch (error: any) {
            toast.error(error.message || t('dashboardProduct.overviewError'))
            return false
        }
    }

    const getBuyerTotalProducts = async (
        filters: ProductOverviewFilters = {}
    ): Promise<boolean> => {
        try {
            await dashboardProductStore.fetchBuyerTotalProducts(filters)
            return true
        } catch (error: any) {
            toast.error(error.message || t('dashboardProduct.overviewError'))
            return false
        }
    }

    const getSupplierNewProducts = async (filters: NewProductsFilters = {}): Promise<boolean> => {
        try {
            await dashboardProductStore.fetchSupplierNewProducts(filters)
            return true
        } catch (error: any) {
            toast.error(error.message || t('dashboardProduct.newProductsError'))
            return false
        }
    }

    const getDashboardProductStats = async (): Promise<boolean> => {
        try {
            await dashboardProductStore.fetchDashboardProductStats()
            return true
        } catch (error: any) {
            toast.error(error.message || t('dashboardProduct.statsError'))
            return false
        }
    }

    const getBuyerProductStats = async (): Promise<boolean> => {
        try {
            await dashboardProductStore.fetchBuyerProductStats()
            return true
        } catch (error: any) {
            toast.error(error.message || t('dashboardProduct.statsError'))
            return false
        }
    }

    const getSuppliersByBusinessType = async (
        filters: SupplierBuyerStatsFilters = {}
    ): Promise<boolean> => {
        try {
            await dashboardProductStore.fetchSuppliersByBusinessType(filters)
            return true
        } catch (error: any) {
            toast.error(error.message || t('dashboardProduct.suppliersError'))
            return false
        }
    }

    const getSuppliersByCountry = async (
        filters: SupplierBuyerStatsFilters = {}
    ): Promise<boolean> => {
        try {
            await dashboardProductStore.fetchSuppliersByCountry(filters)
            return true
        } catch (error: any) {
            toast.error(error.message || t('dashboardProduct.suppliersError'))
            return false
        }
    }

    const getBuyersByBusinessType = async (
        filters: SupplierBuyerStatsFilters = {}
    ): Promise<boolean> => {
        try {
            await dashboardProductStore.fetchBuyersByBusinessType(filters)
            return true
        } catch (error: any) {
            toast.error(error.message || t('dashboardProduct.buyersError'))
            return false
        }
    }

    const getBuyersByCountry = async (
        filters: SupplierBuyerStatsFilters = {}
    ): Promise<boolean> => {
        try {
            await dashboardProductStore.fetchBuyersByCountry(filters)
            return true
        } catch (error: any) {
            toast.error(error.message || t('dashboardProduct.buyersError'))
            return false
        }
    }

    const loadFeatureFilters = async (): Promise<boolean> => {
        try {
            await dashboardProductStore.fetchFeatureFilters()
            return true
        } catch (error: any) {
            console.error('Failed to load feature filters:', error)
            toast.error(error.message || t('dashboardProduct.filtersError'))
            return false
        }
    }

    const loadPriceFilters = async (): Promise<boolean> => {
        try {
            await dashboardProductStore.fetchPriceFilters()
            return true
        } catch (error: any) {
            toast.error(error.message || t('dashboardProduct.filtersError'))
            return false
        }
    }

    const loadSupplierBuyerFilters = async (
        endpoint:
            | 'suppliers-business-type'
            | 'suppliers-country'
            | 'buyers-business-type'
            | 'buyers-country'
            | 'all-suppliers'
            | 'all-buyers'
    ): Promise<boolean> => {
        try {
            await dashboardProductStore.fetchSupplierBuyerFilters(endpoint)
            return true
        } catch (error: any) {
            toast.error(error.message || t('dashboardProduct.filtersError'))
            return false
        }
    }

    const loadDashboardProductFilters = async (): Promise<boolean> => {
        try {
            await dashboardProductStore.fetchDashboardProductFilters()
            return true
        } catch (error: any) {
            toast.error(error.message || t('dashboardProduct.filtersError'))
            return false
        }
    }

    const loadBuyerProductFilters = async (): Promise<boolean> => {
        try {
            await dashboardProductStore.fetchBuyerProductFilters()
            return true
        } catch (error: any) {
            toast.error(error.message || t('dashboardProduct.filtersError'))
            return false
        }
    }

    const buildProductFeaturesFilters = (
        search?: string,
        brandNames?: string[],
        categoryIds?: number[],
        featureIds?: number[],
        hasFeatures?: boolean,
        dateRange?: { startDate: string; endDate: string },
        pagination?: { page: number; perPage: number },
        sort?: { sortBy: ProductFeaturesSort; sortDirection: SortDirection }
    ): ProductFeaturesFilters => {
        return {
            ...(search?.trim() && { search: search.trim() }),
            ...(brandNames?.length && { brand_names: brandNames }),
            ...(categoryIds?.length && { category_ids: categoryIds }),
            ...(featureIds?.length && { feature_ids: featureIds }),
            ...(hasFeatures !== undefined && { has_features: hasFeatures }),
            ...(dateRange && {
                start_date: dateRange.startDate,
                end_date: dateRange.endDate,
            }),
            ...(pagination && {
                page: pagination.page,
                per_page: pagination.perPage,
            }),
            ...(sort && {
                sort_by: sort.sortBy,
                sort_direction: sort.sortDirection,
            }),
        }
    }

    const buildProductPricesFilters = (
        search?: string,
        brandNames?: string[],
        priceRanges?: {
            localFrom?: number
            localTo?: number
            exportFrom?: number
            exportTo?: number
            localDiscountFrom?: number
            localDiscountTo?: number
            exportDiscountFrom?: number
            exportDiscountTo?: number
        },
        pagination?: { page: number; perPage: number },
        sort?: { sortBy: ProductPricesSort; sortDirection: SortDirection }
    ): ProductPricesFilters => {
        return {
            ...(search?.trim() && { search: search.trim() }),
            ...(brandNames?.length && { brand_names: brandNames }),
            ...(priceRanges?.localFrom !== undefined && {
                local_price_from: priceRanges.localFrom,
            }),
            ...(priceRanges?.localTo !== undefined && { local_price_to: priceRanges.localTo }),
            ...(priceRanges?.exportFrom !== undefined && {
                export_price_from: priceRanges.exportFrom,
            }),
            ...(priceRanges?.exportTo !== undefined && { export_price_to: priceRanges.exportTo }),
            ...(priceRanges?.localDiscountFrom !== undefined && {
                local_discount_price_from: priceRanges.localDiscountFrom,
            }),
            ...(priceRanges?.localDiscountTo !== undefined && {
                local_discount_price_to: priceRanges.localDiscountTo,
            }),
            ...(priceRanges?.exportDiscountFrom !== undefined && {
                export_discount_price_from: priceRanges.exportDiscountFrom,
            }),
            ...(priceRanges?.exportDiscountTo !== undefined && {
                export_discount_price_to: priceRanges.exportDiscountTo,
            }),
            ...(pagination && {
                page: pagination.page,
                per_page: pagination.perPage,
            }),
            ...(sort && {
                sort_by: sort.sortBy,
                sort_direction: sort.sortDirection,
            }),
        }
    }

    const buildAllProductsFilters = (options: {
        search?: string
        dateRange?: { start: string; end: string }
        amountRange?: { from?: number; to?: number }
        categoryIds?: number[]
        brandNames?: string[]
        statusIds?: number[]
        pagination?: { page: number; perPage: number }
        sort?: { sortBy: AllProductsSort; sortDirection: SortDirection }
    }): AllProductsFilters => {
        return {
            ...(options.search?.trim() && { search: options.search.trim() }),
            ...(options.dateRange && {
                start_date: options.dateRange.start,
                end_date: options.dateRange.end,
            }),
            ...(options.amountRange?.from !== undefined && {
                amount_from: options.amountRange.from,
            }),
            ...(options.amountRange?.to !== undefined && {
                amount_to: options.amountRange.to,
            }),
            ...(options.categoryIds?.length && { category_ids: options.categoryIds }),
            ...(options.brandNames?.length && { brand_names: options.brandNames }),
            ...(options.statusIds?.length && { status_ids: options.statusIds }),
            ...(options.pagination && {
                page: options.pagination.page,
                per_page: options.pagination.perPage,
            }),
            ...(options.sort && {
                sort_by: options.sort.sortBy,
                sort_direction: options.sort.sortDirection,
            }),
        }
    }

    const buildSupplierBuyerTableFilters = (
        search?: string,
        businessTypeIds?: number[],
        countryIds?: number[],
        amountRange?: { min?: number; max?: number },
        dateRange?: { startDate: string; endDate: string },
        period?: StatsPeriod,
        pagination?: { page: number; perPage: number },
        sort?: {
            sortBy: SupplierBuyerSort | SupplierBuyerCountrySort
            sortDirection: SortDirection
        }
    ): SupplierBuyerTableFilters => {
        return {
            ...(search?.trim() && { search: search.trim() }),
            ...(businessTypeIds?.length && { business_type_ids: businessTypeIds }),
            ...(countryIds?.length && { country_ids: countryIds }),
            ...(amountRange?.min !== undefined && { min_total_amount: amountRange.min }),
            ...(amountRange?.max !== undefined && { max_total_amount: amountRange.max }),
            ...(dateRange && {
                start_date: dateRange.startDate,
                end_date: dateRange.endDate,
            }),
            ...(period && { period }),
            ...(pagination && {
                page: pagination.page,
                per_page: pagination.perPage,
            }),
            ...(sort && {
                sort_by: sort.sortBy,
                sort_direction: sort.sortDirection,
            }),
        }
    }

    const buildStatsFilters = (
        period?: StatsPeriod,
        customRange?: { startDate: string; endDate: string }
    ): SupplierBuyerStatsFilters => {
        if (customRange) {
            return {
                start_date: customRange.startDate,
                end_date: customRange.endDate,
            }
        }
        return period ? { period } : {}
    }

    const buildOverviewFilters = (dateRange?: {
        startDate: string
        endDate: string
    }): ProductOverviewFilters => {
        return dateRange
            ? {
                  start_date: dateRange.startDate,
                  end_date: dateRange.endDate,
              }
            : {}
    }

    const buildNewProductsFilters = (
        period?: StatsPeriod,
        customRange?: { startDate: string; endDate: string }
    ): NewProductsFilters => {
        if (customRange) {
            return {
                start_date: customRange.startDate,
                end_date: customRange.endDate,
            }
        }
        return period ? { period } : {}
    }

    const formatPrice = (value: number, currency?: { symbol: string; code: string }): string => {
        const currencySymbol = currency?.symbol || '$'
        const currencyCode = currency?.code || 'USD'

        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value)
    }

    const formatWeight = (weight: { value: number; unit: string } | null): string => {
        if (!weight) return t('dashboardProduct.noWeight')
        return `${weight.value}${weight.unit}`
    }

    const formatAmount = (value: number): string => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value)
    }

    const formatPercentage = (value: number): string => {
        return `${value}%`
    }

    return {
        isLoading: computed(() => dashboardProductStore.isLoading),
        error: computed(() => dashboardProductStore.error),
        productsWithFeatures: computed(() => dashboardProductStore.productsWithFeatures),
        productsWithPrices: computed(() => dashboardProductStore.productsWithPrices),
        supplierBuyerTableData: computed(() => dashboardProductStore.supplierBuyerTableData),
        allSupplierProducts: computed(() => dashboardProductStore.allSupplierProducts),
        allBuyerProducts: computed(() => dashboardProductStore.allBuyerProducts),
        productFeaturesMeta: computed(() => dashboardProductStore.productFeaturesMeta),
        productPricesMeta: computed(() => dashboardProductStore.productPricesMeta),
        supplierBuyerTableMeta: computed(() => dashboardProductStore.supplierBuyerTableMeta),
        allSupplierProductsMeta: computed(() => dashboardProductStore.allSupplierProductsMeta),
        allBuyerProductsMeta: computed(() => dashboardProductStore.allBuyerProductsMeta),
        supplierTotalProducts: computed(() => dashboardProductStore.supplierTotalProducts),
        buyerTotalProducts: computed(() => dashboardProductStore.buyerTotalProducts),
        supplierNewProducts: computed(() => dashboardProductStore.supplierNewProducts),
        dashboardProductStats: computed(() => dashboardProductStore.dashboardProductStats),
        buyerProductStats: computed(() => dashboardProductStore.buyerProductStats),
        suppliersByBusinessType: computed(() => dashboardProductStore.suppliersByBusinessType),
        suppliersByCountry: computed(() => dashboardProductStore.suppliersByCountry),
        buyersByBusinessType: computed(() => dashboardProductStore.buyersByBusinessType),
        buyersByCountry: computed(() => dashboardProductStore.buyersByCountry),
        featureFilters: computed(() => dashboardProductStore.featureFilters),
        priceFilters: computed(() => dashboardProductStore.priceFilters),
        dashboardProductFilters: computed(() => dashboardProductStore.dashboardProductFilters),
        buyerProductFilters: computed(() => dashboardProductStore.buyerProductFilters),
        supplierBuyerFilters: computed(() => dashboardProductStore.supplierBuyerFilters),
        totalProductsWithFeatures: computed(() => dashboardProductStore.totalProductsWithFeatures),
        totalProductsWithPrices: computed(() => dashboardProductStore.totalProductsWithPrices),
        totalSupplierBuyerItems: computed(() => dashboardProductStore.totalSupplierBuyerItems),
        totalSupplierProductsCount: computed(
            () => dashboardProductStore.totalSupplierProductsCount
        ),
        totalBuyerProductsCount: computed(() => dashboardProductStore.totalBuyerProductsCount),
        supplierCurrency: computed(() => dashboardProductStore.supplierCurrency),
        buyerCurrency: computed(() => dashboardProductStore.buyerCurrency),
        canLoadMoreFeatures: computed(() => dashboardProductStore.canLoadMoreFeatures),
        canLoadMorePrices: computed(() => dashboardProductStore.canLoadMorePrices),
        canLoadMoreSupplierBuyerData: computed(
            () => dashboardProductStore.canLoadMoreSupplierBuyerData
        ),
        canLoadMoreSupplierProducts: computed(
            () => dashboardProductStore.canLoadMoreSupplierProducts
        ),
        canLoadMoreBuyerProducts: computed(() => dashboardProductStore.canLoadMoreBuyerProducts),
        getProductsWithFeaturesFiltered,
        getAllDashboardProductsFiltered,
        getProductsWithPricesFiltered,
        getAllSupplierProducts,
        getAllBuyerProducts,
        getSupplierBuyerTableFiltered,
        getSupplierTotalProducts,
        getBuyerTotalProducts,
        getSupplierNewProducts,
        getDashboardProductStats,
        getBuyerProductStats,
        getSuppliersByBusinessType,
        getSuppliersByCountry,
        getBuyersByBusinessType,
        getBuyersByCountry,
        loadFeatureFilters,
        loadPriceFilters,
        loadSupplierBuyerFilters,
        loadDashboardProductFilters,
        loadBuyerProductFilters,
        buildProductFeaturesFilters,
        buildProductPricesFilters,
        buildAllProductsFilters,
        buildSupplierBuyerTableFilters,
        buildStatsFilters,
        buildOverviewFilters,
        buildNewProductsFilters,
        formatPrice,
        formatWeight,
        formatAmount,
        formatPercentage,
        validateProductFeaturesFilters,
        validateProductPricesFilters,
        validateSupplierBuyerTableFilters,
        validateAllProductsFilters,
        clearProductsWithFeatures: dashboardProductStore.clearProductsWithFeatures,
        clearProductsWithPrices: dashboardProductStore.clearProductsWithPrices,
        clearSupplierBuyerTable: dashboardProductStore.clearSupplierBuyerTable,
        clearSupplierProducts: dashboardProductStore.clearSupplierProducts,
        clearBuyerProducts: dashboardProductStore.clearBuyerProducts,
        clearOverviewData: dashboardProductStore.clearOverviewData,
        clearSupplierBuyerStats: dashboardProductStore.clearSupplierBuyerStats,
        clearFilters: dashboardProductStore.clearFilters,
        clearCache: dashboardProductStore.clearCache,
        resetError: dashboardProductStore.resetError,
    }
}
