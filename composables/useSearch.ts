import type { SearchProductFilters, SearchCompanyFilters } from '~/types/search'
import type { AddToCartPayload } from '~/types/cart'

interface DebounceTimers {
    [key: string]: NodeJS.Timeout
}

interface LoadingStates {
    [key: string]: boolean
}

export const useSearch = () => {
    const searchStore = useSearchStore()
    const cartStore = useCartStore()
    const { t } = useI18n()
    const toast = useToastNotification()
    const router = useRouter()
    const route = useRoute()

    const debounceTimers = ref<DebounceTimers>({})
    const loading = ref<LoadingStates>({})

    const setLoading = (key: string, state: boolean): void => {
        loading.value[key] = state
    }

    const clearDebounceTimer = (key: string): void => {
        if (debounceTimers.value[key]) {
            clearTimeout(debounceTimers.value[key])
            delete debounceTimers.value[key]
        }
    }

    const debounce = (key: string, callback: () => void, delay = 500): void => {
        clearDebounceTimer(key)

        debounceTimers.value[key] = setTimeout(() => {
            callback()
            delete debounceTimers.value[key]
        }, delay)
    }

    const cleanup = (): void => {
        Object.keys(debounceTimers.value).forEach(clearDebounceTimer)
        loading.value = {}
    }

    onBeforeUnmount(() => {
        cleanup()
    })

    const quickSearchProducts = async (
        query: string,
        additionalFilters: Partial<SearchProductFilters> = {}
    ): Promise<boolean> => {
        if (!query || typeof query !== 'string' || !query.trim()) {
            return false
        }

        const filters: Partial<SearchProductFilters> = {
            search: query.trim(),
            page: 1,
            per_page: 6,
            group_by_company: false,
            ...additionalFilters,
        }

        setLoading('searchProducts', true)
        try {
            await searchStore.searchProducts(filters)
            return true
        } catch (error: any) {
            const message = error.message || t('search.productSearchFailed')
            toast.error(message)
            return false
        } finally {
            setLoading('searchProducts', false)
        }
    }

    const quickSearchGrouped = async (
        query: string,
        additionalFilters: Partial<SearchProductFilters> = {}
    ): Promise<boolean> => {
        if (!query || typeof query !== 'string' || !query.trim()) {
            return false
        }

        const filters: Partial<SearchProductFilters> = {
            search: query.trim(),
            page: 1,
            per_page: 6,
            group_by_company: true,
            ...additionalFilters,
        }

        setLoading('searchGrouped', true)
        try {
            await searchStore.searchProducts(filters)
            return true
        } catch (error: any) {
            const message = error.message || t('search.productSearchFailed')
            toast.error(message)
            return false
        } finally {
            setLoading('searchGrouped', false)
        }
    }

    const quickSearchCompanies = async (
        query: string,
        additionalFilters: Partial<SearchCompanyFilters> = {}
    ): Promise<boolean> => {
        if (!query || typeof query !== 'string' || !query.trim()) {
            return false
        }

        const filters: Partial<SearchCompanyFilters> = {
            query: query.trim(),
            page: 1,
            per_page: 6,
            ...additionalFilters,
        }

        setLoading('searchCompanies', true)
        try {
            await searchStore.searchCompanies(filters)
            return true
        } catch (error: any) {
            const message = error.message || t('search.companySearchFailed')
            toast.error(message)
            return false
        } finally {
            setLoading('searchCompanies', false)
        }
    }

    const debouncedProductSearch = (
        query: string,
        additionalFilters: Partial<SearchProductFilters> = {},
        delay = 500
    ): void => {
        debounce('productSearch', () => quickSearchProducts(query, additionalFilters), delay)
    }

    const debouncedGroupedSearch = (
        query: string,
        additionalFilters: Partial<SearchProductFilters> = {},
        delay = 300
    ): void => {
        debounce('groupedSearch', () => quickSearchGrouped(query, additionalFilters), delay)
    }

    const debouncedCompanySearch = (
        query: string,
        additionalFilters: Partial<SearchCompanyFilters> = {},
        delay = 300
    ): void => {
        debounce('companySearch', () => quickSearchCompanies(query, additionalFilters), delay)
    }

    const clearSearchResults = (): void => {
        searchStore.clearSearchResults()
    }

    const resetFilters = (): void => {
        searchStore.resetProductFilters()
        searchStore.resetCompanyFilters()
    }

    const getCompanySuggestions = async (query: string): Promise<boolean> => {
        if (!query?.trim() || query.trim().length < 2) {
            return false
        }

        try {
            await searchStore.getCompanySuggestions(query.trim())
            return true
        } catch (error: any) {
            console.warn('Company suggestions failed:', error)
            return false
        }
    }

    const debouncedCompanySuggestions = (query: string, delay = 200): void => {
        debounce('companySuggestions', () => getCompanySuggestions(query), delay)
    }

    const toggleFavorite = async (productId: number): Promise<boolean> => {
        const loadingKey = `toggleFavorite_${productId}`
        setLoading(loadingKey, true)

        try {
            const success = await searchStore.toggleProductFavorite(productId)
            if (success) {
                const product = searchStore.getProductById(productId)
                const message = product?.is_favorite
                    ? t('search.addedToFavorites')
                    : t('search.removedFromFavorites')
                toast.success(message)
            }
            return success
        } catch (error: any) {
            const message = error.message || t('search.favoriteToggleFailed')
            toast.error(message)
            return false
        } finally {
            setLoading(loadingKey, false)
        }
    }

    const addProductToCart = async (
        productId: number,
        quantity = 1,
        showSuccessMessage = true
    ): Promise<boolean> => {
        const loadingKey = `addToCart_${productId}`
        setLoading(loadingKey, true)

        try {
            const payload: AddToCartPayload = { product_id: productId, quantity }
            await cartStore.addToCart(payload)

            searchStore.updateProductInCart(productId, quantity)

            if (showSuccessMessage) {
                toast.success(t('search.productAddedToCart'))
            }
            return true
        } catch (error: any) {
            const message =
                error.statusCode === 422
                    ? t('cart.validationError')
                    : error.message || t('cart.addError')
            toast.error(message)
            return false
        } finally {
            setLoading(loadingKey, false)
        }
    }

    const loadMoreProducts = async (): Promise<boolean> => {
        if (!searchStore.canLoadMoreProducts) return false

        setLoading('loadMoreProducts', true)
        try {
            await searchStore.loadMoreProducts()
            return true
        } catch (error: any) {
            const message = error.message || t('search.loadMoreFailed')
            toast.error(message)
            return false
        } finally {
            setLoading('loadMoreProducts', false)
        }
    }

    const loadMoreCompanies = async (): Promise<boolean> => {
        if (!searchStore.canLoadMoreCompanies) return false

        setLoading('loadMoreCompanies', true)
        try {
            await searchStore.loadMoreCompanies()
            return true
        } catch (error: any) {
            const message = error.message || t('search.loadMoreFailed')
            toast.error(message)
            return false
        } finally {
            setLoading('loadMoreCompanies', false)
        }
    }

    const applyPriceFilter = (minPrice?: number, maxPrice?: number): void => {
        const filters: Partial<SearchProductFilters> = {}
        if (minPrice !== undefined) filters.price_min = minPrice
        if (maxPrice !== undefined) filters.price_max = maxPrice

        searchStore.setProductFilters(filters)
        quickSearchProducts('', filters)
    }

    const applyCategoryFilter = (categoryIds: number[]): void => {
        const filters: Partial<SearchProductFilters> = { categories: categoryIds }
        searchStore.setProductFilters(filters)
        quickSearchProducts('', filters)
    }

    const applySortOption = (
        sortBy: SearchProductFilters['sort_by'],
        sortDirection: 'asc' | 'desc' = 'desc'
    ): void => {
        const filters: Partial<SearchProductFilters> = {
            sort_by: sortBy,
            sort_direction: sortDirection,
        }
        searchStore.setProductFilters(filters)
        quickSearchProducts('', filters)
    }

    const navigateToProduct = (productId: number): Promise<void> => {
        return router.push(`/products/${productId}`)
    }

    const navigateToCompany = (companyUsername: string): Promise<void> => {
        return router.push(`/profile/${companyUsername}`)
    }

    const navigateToSearchResults = (
        query: string,
        type: 'products' | 'companies' | 'all' = 'products'
    ): Promise<void> => {
        return router.push({
            path: '/search',
            query: {
                q: query,
                type,
                ...route.query,
            },
        })
    }

    const syncFiltersWithURL = (): void => {
        const urlParams = route.query
        const productFilters: Partial<SearchProductFilters> = {}

        if (urlParams.q && typeof urlParams.q === 'string') {
            productFilters.search = urlParams.q
        }
        if (urlParams.page && typeof urlParams.page === 'string') {
            const pageNum = parseInt(urlParams.page, 10)
            if (!isNaN(pageNum) && pageNum > 0) {
                productFilters.page = pageNum
            }
        }

        if (Object.keys(productFilters).length > 0) {
            searchStore.setProductFilters(productFilters)
        }
    }

    const clearAllFilters = (): Promise<void> => {
        resetFilters()
        clearSearchResults()
        return router.push({ query: {} })
    }

    const refreshResults = async (): Promise<boolean> => {
        setLoading('refreshResults', true)
        try {
            await searchStore.refreshCurrentSearch()
            return true
        } catch (error: any) {
            const message = error.message || t('search.refreshFailed')
            toast.error(message)
            return false
        } finally {
            setLoading('refreshResults', false)
        }
    }

    const getProductPrice = (product: any, currencyId = 978): number => {
        if (!product?.prices) return 0
        const price = product.prices.find((p: any) => p.currency_id === currencyId)
        return price?.price || 0
    }

    const getProductDiscount = (product: any, currencyId = 978): number => {
        if (!product?.discounts) return 0
        const discount = product.discounts.find((d: any) => d.currency_id === currencyId)
        return discount?.percentage || 0
    }

    const getDiscountedPrice = (product: any, currencyId = 978): number => {
        const originalPrice = getProductPrice(product, currencyId)
        const discountPercentage = getProductDiscount(product, currencyId)

        if (discountPercentage > 0) {
            return originalPrice * (1 - discountPercentage / 100)
        }
        return originalPrice
    }

    const isProductInCart = (productId: number): boolean => {
        const product = searchStore.getProductById(productId)
        return (product?.in_cart_quantity || 0) > 0
    }

    const getProductCartQuantity = (productId: number): number => {
        const product = searchStore.getProductById(productId)
        return product?.in_cart_quantity || 0
    }

    return {
        isLoading: computed(() => Object.values(loading.value).some(Boolean)),
        loading: computed(() => loading.value),

        productResults: computed(() => searchStore.productResults),
        groupedResults: computed(() => searchStore.groupedResults),
        companyResults: computed(() => searchStore.companyResults),
        companySuggestions: computed(() => searchStore.companySuggestions),
        productMeta: computed(() => searchStore.productMeta),
        companyMeta: computed(() => searchStore.companyMeta),
        productFilters: computed(() => searchStore.productFilters),
        companyFilters: computed(() => searchStore.companyFilters),
        hasProductResults: computed(() => searchStore.hasProductResults),
        hasGroupedResults: computed(() => searchStore.hasGroupedResults),
        hasCompanyResults: computed(() => searchStore.hasCompanyResults),
        hasCompanySuggestions: computed(() => searchStore.hasCompanySuggestions),
        canLoadMoreProducts: computed(() => searchStore.canLoadMoreProducts),
        canLoadMoreCompanies: computed(() => searchStore.canLoadMoreCompanies),
        favoriteProductIds: computed(() => searchStore.favoriteProductIds),
        totalProductsCount: computed(() => searchStore.totalProductsCount),
        totalCompaniesCount: computed(() => searchStore.totalCompaniesCount),

        quickSearchProducts,
        quickSearchGrouped,
        quickSearchCompanies,
        debouncedProductSearch,
        debouncedGroupedSearch,
        debouncedCompanySearch,
        getCompanySuggestions,
        debouncedCompanySuggestions,

        toggleFavorite,
        addProductToCart,
        loadMoreProducts,
        loadMoreCompanies,

        applyPriceFilter,
        applyCategoryFilter,
        applySortOption,
        clearAllFilters,

        navigateToProduct,
        navigateToCompany,
        navigateToSearchResults,

        syncFiltersWithURL,
        refreshResults,
        getProductPrice,
        getProductDiscount,
        getDiscountedPrice,
        isProductInCart,
        getProductCartQuantity,

        resetFilters,
        clearSearchResults,
        clearCache: searchStore.clearAllCache,
        cleanup,
    }
}
