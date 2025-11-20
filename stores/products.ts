// stores/products.ts - Extended marketplace store with single product functionality

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ProfileService } from '~/services/profile'

import type {
    ProductsState,
    ProductFilters,
    ProductListing,
    ProductListingMeta,
    FilterOptions,
    ProductSummary,
    ProductDetails,
} from '~/types/products'

interface LoadingStates {
    products: boolean
    filterOptions: boolean
    summary: boolean
    singleProduct: boolean
    relatedProducts: boolean
}

interface ExtendedProductsState extends ProductsState {
    loadingStates: LoadingStates
    // Single product marketplace display
    currentProduct: ProductDetails | null
    relatedProducts: ProductListing[]
    singleProductError: string | null
}

const DEFAULT_FILTERS: ProductFilters = {
    page: 1,
    per_page: 20,
    sort_by: 'created_at',
    sort_direction: 'desc',
}

export const useProductsStore = defineStore('products', () => {
    const api = useApi()

    const state = ref<ExtendedProductsState>({
        products: [],
        meta: null,
        filters: { ...DEFAULT_FILTERS },
        filterOptions: null,
        summary: null,
        isLoading: false,
        error: null,
        loadingStates: {
            products: false,
            filterOptions: false,
            summary: false,
            singleProduct: false,
            relatedProducts: false,
        },
        // Single product for marketplace display
        currentProduct: null,
        relatedProducts: [],
        singleProductError: null,
    })

    const lastFetchSignature = ref<string>('')
    const fetchPromise = ref<Promise<void> | null>(null)
    const filterOptionsPromise = ref<Promise<void> | null>(null)
    const summaryPromise = ref<Promise<void> | null>(null)
    const singleProductPromise = ref<Promise<void> | null>(null)

    // Computed properties - existing marketplace functionality
    const products = computed(() => state.value.products)
    const meta = computed(() => state.value.meta)
    const filters = computed(() => state.value.filters)
    const filterOptions = computed(() => state.value.filterOptions)
    const summary = computed(() => state.value.summary)
    const isLoading = computed(() => state.value.isLoading)
    const error = computed(() => state.value.error)

    // Single product computed properties
    const currentProduct = computed(() => state.value.currentProduct)
    const relatedProducts = computed(() => state.value.relatedProducts)
    const singleProductError = computed(() => state.value.singleProductError)

    const isLoadingProducts = computed(() => state.value.loadingStates.products)
    const isLoadingFilterOptions = computed(() => state.value.loadingStates.filterOptions)
    const isLoadingSummary = computed(() => state.value.loadingStates.summary)
    const isLoadingSingleProduct = computed(() => state.value.loadingStates.singleProduct)
    const isLoadingRelatedProducts = computed(() => state.value.loadingStates.relatedProducts)

    const isLoadingAny = computed(
        () =>
            state.value.loadingStates.products ||
            state.value.loadingStates.filterOptions ||
            state.value.loadingStates.summary ||
            state.value.loadingStates.singleProduct ||
            state.value.loadingStates.relatedProducts
    )

    const hasProducts = computed(() => products.value.length > 0)
    const totalProducts = computed(() => meta.value?.total || 0)
    const currentPage = computed(() => meta.value?.current_page || 1)
    const lastPage = computed(() => meta.value?.last_page || 1)
    const hasNextPage = computed(() => currentPage.value < lastPage.value)
    const hasPrevPage = computed(() => currentPage.value > 1)

    const activeFiltersCount = computed(() => {
        const activeFilters = { ...filters.value }
        delete activeFilters.page
        delete activeFilters.per_page
        delete activeFilters.sort_by
        delete activeFilters.sort_direction

        return Object.values(activeFilters).filter(
            (value) =>
                value !== undefined &&
                value !== null &&
                value !== '' &&
                !(Array.isArray(value) && value.length === 0)
        ).length
    })

    // Mutation methods
    const setLoading = (loading: boolean) => {
        state.value.isLoading = loading
    }

    const setLoadingState = (key: keyof LoadingStates, value: boolean) => {
        state.value.loadingStates[key] = value
        state.value.isLoading =
            state.value.loadingStates.products ||
            state.value.loadingStates.filterOptions ||
            state.value.loadingStates.summary ||
            state.value.loadingStates.singleProduct ||
            state.value.loadingStates.relatedProducts
    }

    const setError = (error: string | null) => {
        state.value.error = error
    }

    const setSingleProductError = (error: string | null) => {
        state.value.singleProductError = error
    }

    const setProducts = (products: ProductListing[]) => {
        state.value.products = products
    }

    const setMeta = (meta: ProductListingMeta | null) => {
        state.value.meta = meta
    }

    const setFilterOptions = (options: FilterOptions) => {
        state.value.filterOptions = options
    }

    const setSummary = (summary: ProductSummary) => {
        state.value.summary = summary
    }

    const setCurrentProduct = (product: ProductDetails | null) => {
        state.value.currentProduct = product
    }

    const setRelatedProducts = (products: ProductListing[]) => {
        state.value.relatedProducts = products
    }

    const updateFilters = (newFilters: Partial<ProductFilters>) => {
        const cleanedFilters: Partial<ProductFilters> = {}

        Object.entries(newFilters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (Array.isArray(value) && value.length === 0) {
                    return
                }
                if (typeof value === 'string' && value.trim() === '') {
                    return
                }
                cleanedFilters[key as keyof ProductFilters] = value
            }
        })

        state.value.filters = {
            ...state.value.filters,
            ...cleanedFilters,
            page: newFilters.page || 1,
        }
    }

    const resetFilters = () => {
        state.value.filters = { ...DEFAULT_FILTERS }
        state.value.products = []
        state.value.meta = null
        state.value.summary = null
        state.value.error = null
        lastFetchSignature.value = ''
        fetchPromise.value = null
        filterOptionsPromise.value = null
        summaryPromise.value = null
    }

    const resetSingleProductState = () => {
        state.value.currentProduct = null
        state.value.relatedProducts = []
        state.value.singleProductError = null
        singleProductPromise.value = null
    }

    const clearFilter = (filterKey: keyof ProductFilters) => {
        const newFilters = { ...state.value.filters }
        delete newFilters[filterKey]
        state.value.filters = {
            ...newFilters,
            page: 1,
        }
    }

    // Existing marketplace methods
    const fetchProducts = async (newFilters?: Partial<ProductFilters>) => {
        if (newFilters) {
            updateFilters(newFilters)
        }

        const currentSignature = JSON.stringify(state.value.filters)

        if (currentSignature === lastFetchSignature.value && state.value.products.length > 0) {
            return
        }

        if (state.value.loadingStates.products) {
            return fetchPromise.value
        }

        lastFetchSignature.value = currentSignature

        fetchPromise.value = (async () => {
            try {
                setLoadingState('products', true)
                setError(null)

                const response = await api.get('/products', {
                    query: state.value.filters,
                })

                setProducts(response.data || [])
                setMeta(
                    response.meta || {
                        current_page: 1,
                        from: 0,
                        last_page: 1,
                        per_page: 20,
                        to: 0,
                        total: 0,
                    }
                )
            } catch (err: any) {
                console.error('Error fetching products:', err)
                setError(err.data?.message || err.statusMessage || 'failedToLoadProducts')
                setProducts([])
                setMeta({
                    current_page: 1,
                    from: 0,
                    last_page: 1,
                    per_page: 20,
                    to: 0,
                    total: 0,
                })
            } finally {
                setLoadingState('products', false)
                fetchPromise.value = null
            }
        })()

        return fetchPromise.value
    }

    const fetchProductDetails = async (productId: string | number) => {
        if (state.value.loadingStates.singleProduct) {
            return singleProductPromise.value
        }

        singleProductPromise.value = (async () => {
            try {
                setLoadingState('singleProduct', true)
                setSingleProductError(null)

                const response = await api.get(`/products/${productId}`)

                // Handle different response structures from marketplace API
                const productData = response.data || response

                if (!productData) {
                    throw new Error(`Product with ID ${productId} not found`)
                }

                setCurrentProduct(productData)

                // Fetch related products if category available
                if (productData.category?.id) {
                    fetchRelatedProducts(productData.category.id, productId).catch((err) => {
                        console.warn('Failed to load related products:', err)
                    })
                }

                return productData
            } catch (err: any) {
                console.error('❌ Error fetching marketplace product:', err)
                setSingleProductError(
                    err.data?.message || err.statusMessage || 'Failed to load product'
                )
                setCurrentProduct(null)
                throw err
            } finally {
                setLoadingState('singleProduct', false)
                singleProductPromise.value = null
            }
        })()

        return singleProductPromise.value
    }

    const updateCurrentProduct = (updates: Partial<ProductDetails>) => {
        if (state.value.currentProduct) {
            state.value.currentProduct = {
                ...state.value.currentProduct,
                ...updates,
            }
        }
    }

    const fetchRelatedProducts = async (categoryId: number, excludeProductId?: string | number) => {
        if (state.value.loadingStates.relatedProducts) {
            return
        }

        try {
            setLoadingState('relatedProducts', true)

            const response = await api.get('/products', {
                query: {
                    categories: categoryId,
                    per_page: 6,
                    page: 1,
                },
            })

            const relatedProducts = (response.data || []).filter(
                (product: ProductListing) => product.id.toString() !== excludeProductId?.toString()
            )

            setRelatedProducts(relatedProducts.slice(0, 4))
        } catch (err: any) {
            console.error('Error fetching related products:', err)
            setRelatedProducts([])
        } finally {
            setLoadingState('relatedProducts', false)
        }
    }

    const fetchFilterOptions = async (categoryId?: number) => {
        if (state.value.loadingStates.filterOptions) {
            return filterOptionsPromise.value
        }

        filterOptionsPromise.value = (async () => {
            try {
                setLoadingState('filterOptions', true)

                const params: any = {}
                if (categoryId) {
                    params.category_id = categoryId
                }

                const response = await api.get('/products/filter-options', { query: params })
                const filterData = response.data?.data || response.data || response

                setFilterOptions({
                    categories: filterData.categories || [],
                    subcategories: filterData.subcategories || [],
                    brands: filterData.brands || [],
                    conditions: filterData.conditions || [],
                    features: filterData.features || [],
                    additional_features: filterData.additional_features || [],
                    allergens: filterData.allergens || [],
                    supplier_countries: filterData.supplier_countries || [],
                    statuses: filterData.statuses || [],
                    price_range: filterData.price_range || { min: 0, max: 0 },
                    weight_range: filterData.weight_range || { min: 0, max: 0 },
                })
            } catch (err: any) {
                console.error('Error fetching filter options:', err)
                setFilterOptions({
                    categories: [],
                    subcategories: [],
                    brands: [],
                    conditions: [],
                    features: [],
                    additional_features: [],
                    allergens: [],
                    supplier_countries: [],
                    statuses: [],
                    price_range: { min: 0, max: 0 },
                    weight_range: { min: 0, max: 0 },
                })
            } finally {
                setLoadingState('filterOptions', false)
                filterOptionsPromise.value = null
            }
        })()

        return filterOptionsPromise.value
    }

    const fetchSummary = async () => {
        if (state.value.loadingStates.summary) {
            return summaryPromise.value
        }

        summaryPromise.value = (async () => {
            try {
                setLoadingState('summary', true)

                const response = await api.get('/products/summary', {
                    query: state.value.filters,
                })

                const summaryData = response || response?.data || {}

                setSummary({
                    total_products: summaryData.total_products || state.value.meta?.total || 0,
                    average_price: summaryData.average_price || 0,
                    categories_count: summaryData.categories_count || 0,
                    suppliers_count: summaryData.suppliers_count || 0,
                })
            } catch (err: any) {
                console.error('Error fetching products summary:', err)
                setSummary({
                    total_products: state.value.meta?.total || 0,
                    average_price: 0,
                    categories_count: 0,
                    suppliers_count: 0,
                })
            } finally {
                setLoadingState('summary', false)
                summaryPromise.value = null
            }
        })()

        return summaryPromise.value
    }

    // Add after refreshSupplierProducts method

    const refreshProductsByIds = async (productIds: number[]): Promise<number> => {
        try {
            if (!productIds || productIds.length === 0) {
                return 0
            }

            const existingProducts = state.value.products.filter((p) => productIds.includes(p.id))

            if (existingProducts.length === 0) {
                return 0
            }

            const BATCH_SIZE = 10
            let updatedCount = 0
            const failedProducts: number[] = []
            const removedProducts: number[] = []

            for (let i = 0; i < existingProducts.length; i += BATCH_SIZE) {
                const batch = existingProducts.slice(i, i + BATCH_SIZE)

                const batchResults = await Promise.allSettled(
                    batch.map(async (product) => {
                        try {
                            const response = await api.get(`/products/${product.id}`)
                            const updatedProduct = response.data || response

                            if (updatedProduct) {
                                const productIndex = state.value.products.findIndex(
                                    (p) => p.id === product.id
                                )

                                if (productIndex !== -1) {
                                    state.value.products[productIndex] = {
                                        ...state.value.products[productIndex],
                                        ...updatedProduct,
                                        updated_at: new Date().toISOString(),
                                    }
                                }

                                return { success: true, productId: product.id, removed: false }
                            }

                            return { success: false, productId: product.id, removed: false }
                        } catch (error: any) {
                            const statusCode =
                                error?.status || error?.statusCode || error?.response?.status

                            if (statusCode === 404) {
                                const productIndex = state.value.products.findIndex(
                                    (p) => p.id === product.id
                                )

                                if (productIndex !== -1) {
                                    state.value.products.splice(productIndex, 1)

                                    if (state.value.meta) {
                                        state.value.meta = {
                                            ...state.value.meta,
                                            total: Math.max(0, state.value.meta.total - 1),
                                        }
                                    }

                                    if (state.value.summary) {
                                        state.value.summary = {
                                            ...state.value.summary,
                                            total_products: Math.max(
                                                0,
                                                state.value.summary.total_products - 1
                                            ),
                                        }
                                    }
                                }

                                return { success: false, productId: product.id, removed: true }
                            }

                            console.error(
                                `[ProductsStore] Failed to refresh product ${product.id}:`,
                                error
                            )
                            return { success: false, productId: product.id, removed: false }
                        }
                    })
                )

                batchResults.forEach((result) => {
                    if (result.status === 'fulfilled') {
                        if (result.value.success) {
                            updatedCount++
                        } else if (result.value.removed) {
                            removedProducts.push(result.value.productId)
                        } else {
                            failedProducts.push(result.value.productId)
                        }
                    }
                })

                if (i + BATCH_SIZE < existingProducts.length) {
                    await new Promise((resolve) => setTimeout(resolve, 100))
                }
            }

            return updatedCount
        } catch (error) {
            console.error('[ProductsStore] Error refreshing products by IDs:', error)
            return 0
        }
    }

    const refreshUserProducts = async (userId: number, userName?: string): Promise<number> => {
        try {
            const userProducts = state.value.products.filter((p) => p.user?.id === userId)

            if (userProducts.length === 0) {
                return 0
            }

            const BATCH_SIZE = 10
            let updatedCount = 0
            const failedProducts: number[] = []
            const removedProducts: number[] = []
            const updatedProducts: number[] = []

            for (let i = 0; i < userProducts.length; i += BATCH_SIZE) {
                const batch = userProducts.slice(i, i + BATCH_SIZE)

                const batchResults = await Promise.allSettled(
                    batch.map(async (product) => {
                        try {
                            const response = await api.get(`/products/${product.id}`)
                            const updatedProduct = response.data || response

                            if (updatedProduct) {
                                const productIndex = state.value.products.findIndex(
                                    (p) => p.id === product.id
                                )

                                if (productIndex !== -1) {
                                    // ✅ CRITICAL: Force reactivity with array splice
                                    state.value.products.splice(productIndex, 1, {
                                        ...updatedProduct,
                                        updated_at: new Date().toISOString(),
                                    })

                                    updatedProducts.push(product.id)
                                }

                                return { success: true, productId: product.id, removed: false }
                            }

                            return { success: false, productId: product.id, removed: false }
                        } catch (error: any) {
                            const statusCode =
                                error?.status || error?.statusCode || error?.response?.status

                            if (statusCode === 404) {
                                const productIndex = state.value.products.findIndex(
                                    (p) => p.id === product.id
                                )

                                if (productIndex !== -1) {
                                    state.value.products.splice(productIndex, 1)

                                    if (state.value.meta) {
                                        state.value.meta = {
                                            ...state.value.meta,
                                            total: Math.max(0, state.value.meta.total - 1),
                                        }
                                    }

                                    if (state.value.summary) {
                                        state.value.summary = {
                                            ...state.value.summary,
                                            total_products: Math.max(
                                                0,
                                                state.value.summary.total_products - 1
                                            ),
                                        }
                                    }
                                }

                                return { success: false, productId: product.id, removed: true }
                            }

                            console.error(
                                `[ProductsStore] Failed to refresh product ${product.id}:`,
                                error
                            )
                            return { success: false, productId: product.id, removed: false }
                        }
                    })
                )

                batchResults.forEach((result) => {
                    if (result.status === 'fulfilled') {
                        if (result.value.success) {
                            updatedCount++
                        } else if (result.value.removed) {
                            removedProducts.push(result.value.productId)
                        } else {
                            failedProducts.push(result.value.productId)
                        }
                    }
                })

                if (i + BATCH_SIZE < userProducts.length) {
                    await new Promise((resolve) => setTimeout(resolve, 100))
                }
            }

            return updatedCount
        } catch (error) {
            console.error('[ProductsStore] Error refreshing user products:', error)
            return 0
        }
    }

    // Existing marketplace action methods
    const loadMore = async () => {
        if (!hasNextPage.value || isLoadingProducts.value) return

        const nextPage = currentPage.value + 1
        await fetchProducts({ page: nextPage })
    }

    const goToPage = async (page: number) => {
        if (page < 1 || page > lastPage.value || isLoadingProducts.value) return
        await fetchProducts({ page })
    }

    const search = async (searchTerm: string) => {
        await fetchProducts({ search: searchTerm, page: 1 })
    }

    const sortBy = async (
        sortBy: ProductFilters['sort_by'],
        sortDirection?: ProductFilters['sort_direction']
    ) => {
        await fetchProducts({
            sort_by: sortBy,
            sort_direction: sortDirection || 'desc',
            page: 1,
        })
    }

    const applyFilters = async (newFilters: Partial<ProductFilters>) => {
        await fetchProducts({ ...newFilters, page: 1 })
    }

    const refresh = async () => {
        lastFetchSignature.value = ''
        await fetchProducts()
    }

    const initializeProducts = async (
        serverFilters?: Partial<ProductFilters>,
        userPlan?: string
    ) => {
        if (!serverFilters || Object.keys(serverFilters).length === 0) {
            state.value.filters = { ...DEFAULT_FILTERS }
        } else {
            updateFilters(serverFilters)
        }

        const currentSignature = JSON.stringify({
            filters: state.value.filters,
            plan: userPlan || 'unknown',
        })

        if (currentSignature === lastFetchSignature.value && state.value.products.length > 0) {
            return
        }

        try {
            await fetchProducts()

            await Promise.allSettled([
                fetchFilterOptions().catch((err) => {}),
                fetchSummary().catch((err) => {}),
            ])

            lastFetchSignature.value = currentSignature
        } catch (err) {
            console.error('Failed to initialize products:', err)
        }
    }

    // NEW: Initialize single product for marketplace display
    const initializeProductDetails = async (productId: string | number) => {
        resetSingleProductState()

        try {
            await fetchProductDetails(productId)
        } catch (err) {
            console.error('Failed to initialize product details:', err)
            throw err
        }
    }
    const updateProductLocally = (productId: number, updates: any) => {
        const productIndex = products.value.findIndex((p) => p.id === productId)
        if (productIndex !== -1) {
            products.value[productIndex] = { ...products.value[productIndex], ...updates }
        }
    }
    // Utility methods
    const isProductLoaded = (productId: string | number) => {
        return products.value.some((product) => product.id === productId)
    }

    const getProductById = (productId: string | number) => {
        return products.value.find((product) => product.id === productId)
    }

    const removeSupplierProducts = (userId: number): number => {
        const initialCount = state.value.products.length

        state.value.products = state.value.products.filter((p) => p.user?.id !== userId)

        const removedCount = initialCount - state.value.products.length

        if (removedCount > 0 && state.value.meta) {
            state.value.meta = {
                ...state.value.meta,
                total: Math.max(0, state.value.meta.total - removedCount),
            }
        }

        if (removedCount > 0 && state.value.summary) {
            state.value.summary = {
                ...state.value.summary,
                total_products: Math.max(0, state.value.summary.total_products - removedCount),
            }
        }

        return removedCount
    }

    const checkAndUpdateUserProducts = async (
        userId: number,
        userName?: string
    ): Promise<{
        action: 'updated' | 'removed' | 'none'
        count: number
    }> => {
        try {
            const userProducts = state.value.products.filter((p) => p.user?.id === userId)

            // const profileService = new ProfileService()
            // const user = await profileService.getUserProfile(userId)

            const updatedCount = await refreshUserProducts(userId, userName)
            return { action: 'updated', count: updatedCount }
        } catch (error: any) {
            const statusCode = error?.status || error?.statusCode || error?.response?.status

            if (statusCode === 404) {
                const removedCount = removeSupplierProducts(userId)
                return { action: 'removed', count: removedCount }
            }

            return { action: 'none', count: 0 }
        }
    }

    const hasActiveFilters = computed(() => activeFiltersCount.value > 0)
    const canLoadMore = computed(() => hasNextPage.value && !isLoadingProducts.value)
    const isEmpty = computed(() => !hasProducts.value && !isLoadingProducts.value)
    const isFirstLoad = computed(() => isLoadingProducts.value && products.value.length === 0)

    return {
        // Existing marketplace state
        products,
        meta,
        filters,
        filterOptions,
        summary,
        isLoading,
        error,

        // NEW: Single product state
        currentProduct,
        relatedProducts,
        singleProductError,

        // Loading states
        isLoadingProducts,
        isLoadingFilterOptions,
        isLoadingSummary,
        isLoadingSingleProduct,
        isLoadingRelatedProducts,
        isLoadingAny,

        // Existing computed properties
        hasProducts,
        totalProducts,
        currentPage,
        lastPage,
        hasNextPage,
        hasPrevPage,
        activeFiltersCount,
        hasActiveFilters,
        canLoadMore,
        isEmpty,
        isFirstLoad,

        // Existing marketplace actions
        fetchProducts,
        fetchFilterOptions,
        fetchSummary,
        loadMore,
        goToPage,
        search,
        sortBy,
        applyFilters,
        refresh,
        initializeProducts,
        removeSupplierProducts,

        updateCurrentProduct,
        fetchProductDetails,
        fetchRelatedProducts,
        initializeProductDetails,
        updateProductLocally,
        // State management actions
        updateFilters,
        resetFilters,
        resetSingleProductState,
        clearFilter,
        setProducts,
        setMeta,
        setFilterOptions,
        setSummary,
        setLoading,
        setError,
        setCurrentProduct,
        setRelatedProducts,
        setSingleProductError,
        //
        refreshProductsByIds,
        refreshUserProducts,
        checkAndUpdateUserProducts,

        // Utility methods
        isProductLoaded,
        getProductById,
    }
})

if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useProductsStore, import.meta.hot))
}
