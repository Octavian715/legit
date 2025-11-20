import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
    SearchProductFilters,
    SearchCompanyFilters,
    SearchProduct,
    SearchCompany,
    GroupedCompanyProducts,
    PaginationMeta,
    GroupedProductSearchResponse,
    ProductSearchResponse,
} from '~/types/search'
import { SearchService } from '~/services/search'

const initialProductFilters: SearchProductFilters = {
    page: 1,
    per_page: 20,
    sort_by: 'created_at',
    sort_direction: 'desc',
}

const initialCompanyFilters: SearchCompanyFilters = {
    query: '',
    page: 1,
    per_page: 20,
}

export const useSearchStore = defineStore('search', () => {
    const searchService = new SearchService()

    const products = ref({
        results: [] as SearchProduct[],
        groupedResults: [] as GroupedCompanyProducts[],
        meta: null as PaginationMeta | null,
        filters: { ...initialProductFilters },
        isLoading: false,
        error: null as string | null,
        hasInitialLoad: false, // Track if we've loaded data at least once
    })

    const companies = ref({
        results: [] as SearchCompany[],
        suggestions: [] as SearchCompany[],
        meta: null as PaginationMeta | null,
        filters: { ...initialCompanyFilters },
        isLoading: false,
        error: null as string | null,
        hasInitialLoad: false,
    })

    const quickSearch = ref({
        products: [] as SearchProduct[],
        groupedResults: [] as GroupedCompanyProducts[],
        companies: [] as SearchCompany[],
        isLoading: false,
        error: null as string | null,
    })

    const filterOptions = ref<any>(null)
    const companyFilterOptions = ref<any>(null)

    const productResults = computed(() => products.value.results)
    const groupedResults = computed(() => products.value.groupedResults)
    const companyResults = computed(() => companies.value.results)
    const companySuggestions = computed(() => companies.value.suggestions)
    const productMeta = computed(() => products.value.meta)
    const companyMeta = computed(() => companies.value.meta)
    const productFilters = computed(() => products.value.filters)
    const companyFilters = computed(() => companies.value.filters)
    const isLoadingProducts = computed(() => products.value.isLoading)
    const isLoadingCompanies = computed(() => companies.value.isLoading)
    const hasProductResults = computed(() => products.value.results.length > 0)
    const hasGroupedResults = computed(() => products.value.groupedResults.length > 0)
    const hasCompanyResults = computed(() => companies.value.results.length > 0)
    const hasCompanySuggestions = computed(() => companies.value.suggestions.length > 0)
    const canLoadMoreProducts = computed(() => !!products.value.meta?.next_page)
    const canLoadMoreCompanies = computed(() => !!companies.value.meta?.next_page)
    const favoriteProductIds = computed(() =>
        products.value.results.filter((p) => p.is_favorite).map((p) => p.id)
    )
    const totalProductsCount = computed(() => products.value.meta?.total || 0)
    const totalCompaniesCount = computed(() => companies.value.meta?.total || 0)
    const quickSearchProducts = computed(() => quickSearch.value.products)
    const quickSearchGroupedResults = computed(() => quickSearch.value.groupedResults)
    const quickSearchCompanies = computed(() => quickSearch.value.companies)
    const isLoadingQuickSearch = computed(() => quickSearch.value.isLoading)
    const hasQuickSearchResults = computed(
        () =>
            quickSearch.value.products.length > 0 ||
            quickSearch.value.groupedResults.length > 0 ||
            quickSearch.value.companies.length > 0
    )
    const hasProductInitialLoad = computed(() => products.value.hasInitialLoad)
    const hasCompanyInitialLoad = computed(() => companies.value.hasInitialLoad)

    const searchProducts = async (filters: Partial<SearchProductFilters>): Promise<void> => {
        products.value.isLoading = true
        products.value.error = null

        // Sync filters including pagination
        products.value.filters = {
            ...products.value.filters,
            ...filters,
        }

        try {
            const response = await searchService.searchProducts(
                products.value.filters as SearchProductFilters
            )

            if (filters.group_by_company) {
                products.value.groupedResults = (response as GroupedProductSearchResponse).data
                products.value.results = []
            } else {
                products.value.results = (response as ProductSearchResponse).data
                products.value.groupedResults = []
            }

            products.value.meta = response.meta
            products.value.hasInitialLoad = true
        } catch (error: any) {
            products.value.error = error.message
            throw error
        } finally {
            products.value.isLoading = false
        }
    }

    const searchCompanies = async (filters: SearchCompanyFilters): Promise<void> => {
        companies.value.isLoading = true
        companies.value.error = null

        // Sync filters including pagination
        companies.value.filters = {
            ...companies.value.filters,
            ...filters,
        }

        try {
            const response = await searchService.searchCompanies(companies.value.filters)
            companies.value.results = response.data
            companies.value.meta = response.meta
            companies.value.hasInitialLoad = true
        } catch (error: any) {
            companies.value.error = error.message
            throw error
        } finally {
            companies.value.isLoading = false
        }
    }

    const getCompanySuggestions = async (query: string): Promise<void> => {
        if (!query.trim()) {
            companies.value.suggestions = []
            return
        }

        companies.value.isLoading = true

        try {
            companies.value.suggestions = await searchService.getCompanySuggestions(query)
        } catch (error: any) {
            companies.value.error = error.message
            throw error
        } finally {
            companies.value.isLoading = false
        }
    }

    const loadMoreProducts = async (): Promise<void> => {
        if (!products.value.meta?.next_page || products.value.isLoading) return

        const nextFilters = { ...products.value.filters, page: products.value.meta.next_page }

        await searchProducts(nextFilters)
    }

    const loadMoreCompanies = async (): Promise<void> => {
        if (!companies.value.meta?.next_page || companies.value.isLoading) return

        const nextFilters = { ...companies.value.filters, page: companies.value.meta.next_page }

        await searchCompanies(nextFilters)
    }

    const toggleProductFavorite = async (productId: number, isFavorite: boolean): Promise<void> => {
        try {
            await searchService.toggleProductFavorite(productId, isFavorite)
            // Update in results
            const updateProduct = (products: SearchProduct[]) => {
                const product = products.find((p) => p.id === productId)
                if (product) product.is_favorite = !isFavorite
            }
            updateProduct(products.value.results)
            updateProduct(quickSearch.value.products)
            // Update in grouped if present
            products.value.groupedResults.forEach((group) => updateProduct(group.products))
            quickSearch.value.groupedResults.forEach((group) => updateProduct(group.products))
        } catch (error: any) {
            throw error
        }
    }

    const setProductFilters = (filters: Partial<SearchProductFilters>): void => {
        products.value.filters = { ...products.value.filters, ...filters }
    }

    const setCompanyFilters = (filters: Partial<SearchCompanyFilters>): void => {
        companies.value.filters = { ...companies.value.filters, ...filters }
    }

    const resetProductFilters = (): void => {
        products.value.filters = { ...initialProductFilters }
    }

    const resetCompanyFilters = (): void => {
        companies.value.filters = { ...initialCompanyFilters }
    }

    const clearSearchResults = (): void => {
        products.value.results = []
        products.value.groupedResults = []
        products.value.meta = null
        products.value.hasInitialLoad = false
        companies.value.results = []
        companies.value.suggestions = []
        companies.value.meta = null
        companies.value.hasInitialLoad = false
    }

    const getFilterOptions = async (filters: Partial<SearchProductFilters> = {}) => {
        const response = await searchService.getProductFilterOptions(filters)
        const filterData = response.data || response

        filterOptions.value = {
            categories: filterData.categories || [],
            subcategories: filterData.subcategories || [],
            brands: filterData.brands || [],
            features: filterData.features || [],
            additionalFeatures: filterData.additional_features || [],
            supplierCountries: filterData.supplier_countries || [],
            availabilityCountries: filterData.availability_countries || [],
            conditions: filterData.conditions || [],
            priceRange: filterData.price_range || { min: 0, max: 0 },
            weightRange: filterData.weight_range || { min: 0, max: 0 },
        }
    }

    const getCompanyFilterOptions = async () => {
        const response = await searchService.getCompanyFilterOptions()
        const filterData = response.data || response

        companyFilterOptions.value = {
            businessTypes: filterData.business_types || [],
            countries: filterData.countries || [],
        }
    }

    const getProductById = (productId: number): SearchProduct | null => {
        const product =
            products.value.results.find((p) => p.id === productId) ||
            quickSearch.value.products.find((p) => p.id === productId)

        if (product) return product

        for (const group of products.value.groupedResults) {
            const found = group.products.find((p) => p.id === productId)
            if (found) return found
        }

        for (const group of quickSearch.value.groupedResults) {
            const found = group.products.find((p) => p.id === productId)
            if (found) return found
        }

        return null
    }

    const updateProductInCart = (productId: number, inCart: boolean): void => {
        const updateProduct = (products: SearchProduct[]) => {
            const product = products.find((p) => p.id === productId)
            if (product) {
                product.is_in_cart = inCart
            }
        }

        updateProduct(products.value.results)
        updateProduct(quickSearch.value.products)

        products.value.groupedResults.forEach((group) => updateProduct(group.products))
        quickSearch.value.groupedResults.forEach((group) => updateProduct(group.products))
    }

    const updateConnection = (companyId: number, isConnected: boolean): void => {
        const updateCompany = (companies: SearchCompany[]) => {
            const company = companies.find((c) => c.id === companyId)
            if (company) {
                company.is_connected = isConnected
            }
        }

        updateCompany(companies.value.results)
        updateCompany(companies.value.suggestions)
        updateCompany(quickSearch.value.companies)

        const updateGroupCompany = (groups: GroupedCompanyProducts[]) => {
            const group = groups.find((g) => g.company.id === companyId)
            if (group) {
                group.company.is_connected = isConnected
            }
        }

        updateGroupCompany(products.value.groupedResults)
        updateGroupCompany(quickSearch.value.groupedResults)
    }

    const updateProductDetails = async (productId: number, companyId?: number): Promise<void> => {
        return new Promise((resolve) => {
            setTimeout(async () => {
                const fetchedProduct = await searchService.getProductById(productId)

                if (hasProductResults.value) {
                    const index = products.value.results.findIndex(
                        (p) => p.id === fetchedProduct.id
                    )
                    if (index !== -1) {
                        const existingProduct = products.value.results[index]
                        const updatedProduct = { ...existingProduct, ...fetchedProduct }
                        products.value.results.splice(index, 1, updatedProduct)
                    }
                }

                if (quickSearchProducts.value.length) {
                    const index = quickSearch.value.products.findIndex(
                        (p) => p.id === fetchedProduct.id
                    )
                    if (index !== -1) {
                        const existingProduct = quickSearch.value.products[index]
                        const updatedProduct = { ...existingProduct, ...fetchedProduct }
                        quickSearch.value.products.splice(index, 1, updatedProduct)
                    }
                }

                if (hasGroupedResults.value) {
                    products.value.groupedResults.forEach((group, groupIndex) => {
                        if (group.company.id === companyId) {
                            const prodIndex = group.products.findIndex(
                                (p) => p.id === fetchedProduct.id
                            )
                            if (prodIndex !== -1) {
                                const existingProduct = group.products[prodIndex]
                                const updatedProduct = { ...existingProduct, ...fetchedProduct }

                                const updatedProducts = [...group.products]
                                updatedProducts.splice(prodIndex, 1, updatedProduct)

                                const updatedGroup = { ...group, products: updatedProducts }
                                products.value.groupedResults.splice(groupIndex, 1, updatedGroup)
                            }
                        }
                    })
                }

                if (quickSearchGroupedResults.value.length) {
                    quickSearch.value.groupedResults.forEach((group, groupIndex) => {
                        if (group.company.id === companyId) {
                            const prodIndex = group.products.findIndex(
                                (p) => p.id === fetchedProduct.id
                            )
                            if (prodIndex !== -1) {
                                const existingProduct = group.products[prodIndex]
                                const updatedProduct = { ...existingProduct, ...fetchedProduct }

                                const updatedProducts = [...group.products]
                                updatedProducts.splice(prodIndex, 1, updatedProduct)

                                const updatedGroup = { ...group, products: updatedProducts }
                                quickSearch.value.groupedResults.splice(groupIndex, 1, updatedGroup)
                            }
                        }
                    })
                }

                resolve()
            }, 100)
        })
    }

    const clearAllCache = (): void => {
        products.value = {
            results: [],
            groupedResults: [],
            meta: null,
            filters: { ...initialProductFilters },
            isLoading: false,
            error: null,
            hasInitialLoad: false,
        }
        companies.value = {
            results: [],
            suggestions: [],
            meta: null,
            filters: { ...initialCompanyFilters },
            isLoading: false,
            error: null,
            hasInitialLoad: false,
        }
        quickSearch.value = {
            products: [],
            groupedResults: [],
            companies: [],
            isLoading: false,
            error: null,
        }
        filterOptions.value = null
        companyFilterOptions.value = null
    }

    const refreshCurrentSearch = async (): Promise<void> => {
        if (products.value.filters.search) {
            await searchProducts(products.value.filters)
        } else if (companies.value.filters.query) {
            await searchCompanies(companies.value.filters)
        }
    }

    const quickSearchProductsAction = async (query: string): Promise<void> => {
        quickSearch.value.isLoading = true
        try {
            const response = await searchService.searchProducts({
                search: query,
                per_page: 5,
                group_by_company: false,
            })
            quickSearch.value.products = (response as ProductSearchResponse).data
        } catch (error) {
            quickSearch.value.error = (error as Error).message
        } finally {
            quickSearch.value.isLoading = false
        }
    }

    const quickSearchGroupedAction = async (query: string): Promise<void> => {
        quickSearch.value.isLoading = true
        try {
            const response = await searchService.searchProducts({
                search: query,
                per_page: 5,
                group_by_company: true,
            })
            quickSearch.value.groupedResults = (response as GroupedProductSearchResponse).data
        } catch (error) {
            quickSearch.value.error = (error as Error).message
        } finally {
            quickSearch.value.isLoading = false
        }
    }

    const quickSearchCompaniesAction = async (query: string): Promise<void> => {
        quickSearch.value.isLoading = true
        try {
            quickSearch.value.companies = await searchService.getCompanySuggestions(query)
        } catch (error) {
            quickSearch.value.error = (error as Error).message
        } finally {
            quickSearch.value.isLoading = false
        }
    }

    const quickSearchAll = async (query: string): Promise<void> => {
        quickSearch.value.isLoading = true
        try {
            await Promise.all([
                quickSearchProductsAction(query),
                quickSearchGroupedAction(query),
                quickSearchCompaniesAction(query),
            ])
        } catch (error) {
            quickSearch.value.error = (error as Error).message
        } finally {
            quickSearch.value.isLoading = false
        }
    }

    const clearQuickSearch = (): void => {
        quickSearch.value = {
            products: [],
            groupedResults: [],
            companies: [],
            isLoading: false,
            error: null,
        }
    }

    return {
        productResults,
        groupedResults,
        companyResults,
        companySuggestions,
        productMeta,
        companyMeta,
        productFilters,
        companyFilters,
        isLoadingProducts,
        isLoadingCompanies,
        hasProductResults,
        hasGroupedResults,
        hasCompanyResults,
        hasCompanySuggestions,
        canLoadMoreProducts,
        canLoadMoreCompanies,
        favoriteProductIds,
        totalProductsCount,
        totalCompaniesCount,
        quickSearchProducts,
        quickSearchGroupedResults,
        quickSearchCompanies,
        isLoadingQuickSearch,
        hasQuickSearchResults,
        hasProductInitialLoad,
        hasCompanyInitialLoad,
        searchProducts,
        searchCompanies,
        getCompanySuggestions,
        loadMoreProducts,
        loadMoreCompanies,
        toggleProductFavorite,
        setProductFilters,
        setCompanyFilters,
        resetProductFilters,
        resetCompanyFilters,
        clearSearchResults,
        getProductById,
        updateProductInCart,
        updateConnection,
        updateProductDetails,
        clearAllCache,
        refreshCurrentSearch,
        quickSearchProductsAction,
        quickSearchGroupedAction,
        quickSearchCompaniesAction,
        clearQuickSearch,
        filterOptions: computed(() => filterOptions.value),
        companyFilterOptions: computed(() => companyFilterOptions.value),
        getFilterOptions,
        getCompanyFilterOptions,
        quickSearchAll,
    }
})

if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useSearchStore, import.meta.hot))
}
