import type { ProductFilters } from '~/types/products'
import { useProductsStore } from '~/stores/products'

interface CatalogItem {
    id: number
    name: string
    slug: string
    depth: number
    category?: {
        id: number
        name: string
        slug: string
    }
    subcategories?: Array<{
        id: number
        name: string
        slug: string
        products_count?: number
    }>
}

interface UseCatalogProductsOptions {
    catalogItem: Ref<CatalogItem | null>
}

export const useCatalogProducts = (options: UseCatalogProductsOptions) => {
    const { catalogItem } = options
    const route = useRoute()
    const router = useRouter()
    const productsStore = useProductsStore()

    const itemId = computed(() => catalogItem.value?.id)
    const itemDepth = computed(() => catalogItem.value?.depth || 0)
    const isMainCategory = computed(() => itemDepth.value === 0)
    const isSubcategory = computed(() => itemDepth.value > 0)

    // Parse query filters WITHOUT category/subcategory
    const parseQueryFilters = (): ProductFilters => {
        const query = route.query
        const filters: ProductFilters = {}

        // Add all filters EXCEPT categories and subcategories
        if (query.search && typeof query.search === 'string') {
            filters.search = query.search
        }

        if (query.page && typeof query.page === 'string') {
            const page = parseInt(query.page, 10)
            if (!isNaN(page) && page > 0) {
                filters.page = page
            }
        }

        if (query.per_page && typeof query.per_page === 'string') {
            const perPage = parseInt(query.per_page, 10)
            if (!isNaN(perPage) && perPage > 0 && perPage <= 100) {
                filters.per_page = perPage
            }
        }

        if (query.sort_by && typeof query.sort_by === 'string') {
            const validSortFields = [
                'name',
                'price',
                'rating',
                'created_at',
                'updated_at',
                'weight',
                'brand',
                'shelf_life',
            ]
            if (validSortFields.includes(query.sort_by)) {
                filters.sort_by = query.sort_by as any
            }
        }

        if (query.sort_direction && typeof query.sort_direction === 'string') {
            if (['asc', 'desc'].includes(query.sort_direction)) {
                filters.sort_direction = query.sort_direction as 'asc' | 'desc'
            }
        }

        // Skip categories and subcategories - they come from the slug!
        // if (query.categories) { ... } // NO!
        // if (query.subcategories) { ... } // NO!

        if (query.price_min && typeof query.price_min === 'string') {
            const priceMin = parseFloat(query.price_min)
            if (!isNaN(priceMin) && priceMin >= 0) {
                filters.price_min = priceMin
            }
        }

        if (query.price_max && typeof query.price_max === 'string') {
            const priceMax = parseFloat(query.price_max)
            if (!isNaN(priceMax) && priceMax >= 0) {
                filters.price_max = priceMax
            }
        }

        if (query.rating && typeof query.rating === 'string') {
            const rating = parseFloat(query.rating)
            if (!isNaN(rating) && rating >= 1 && rating <= 5) {
                filters.rating = rating
            }
        }

        if (query.supplier_countries) {
            filters.supplier_countries = parseIntArrayParam(query.supplier_countries)
        }

        if (query.features) {
            filters.features = parseIntArrayParam(query.features)
        }

        if (query.additional_features) {
            filters.additional_features = parseIntArrayParam(query.additional_features)
        }

        if (query.brands) {
            filters.brands = parseStringArrayParam(query.brands)
        }

        if (query.conditions) {
            filters.conditions = parseIntArrayParam(query.conditions)
        }

        if (query.weight_min && typeof query.weight_min === 'string') {
            const weightMin = parseFloat(query.weight_min)
            if (!isNaN(weightMin) && weightMin >= 0) {
                filters.weight_min = weightMin
            }
        }

        if (query.weight_max && typeof query.weight_max === 'string') {
            const weightMax = parseFloat(query.weight_max)
            if (!isNaN(weightMax) && weightMax >= 0) {
                filters.weight_max = weightMax
            }
        }

        if (query.status) {
            filters.status = parseIntArrayParam(query.status)
        }

        if (query.allergens) {
            filters.allergens = parseIntArrayParam(query.allergens)
        }

        if (query.has_discount === 'true') {
            filters.has_discount = true
        }

        if (query.private_label_available === 'true') {
            filters.private_label_available = true
        }

        if (query.my_products === 'true') {
            filters.my_products = true
        }

        return filters
    }

    const parseIntArrayParam = (param: string | string[]): number[] => {
        if (Array.isArray(param)) {
            return param.map((p) => parseInt(p, 10)).filter((n) => !isNaN(n))
        }
        if (typeof param === 'string') {
            return param
                .split(',')
                .map((p) => parseInt(p.trim(), 10))
                .filter((n) => !isNaN(n))
        }
        return []
    }

    const parseStringArrayParam = (param: string | string[]): string[] => {
        if (Array.isArray(param)) {
            return param.filter((p) => typeof p === 'string' && p.trim() !== '')
        }
        if (typeof param === 'string') {
            return param
                .split(',')
                .map((p) => p.trim())
                .filter((p) => p !== '')
        }
        return []
    }

    // Build query string WITHOUT category filters
    const buildQueryString = (filters: Partial<ProductFilters>): Record<string, string> => {
        const query: Record<string, string> = {}

        Object.entries(filters).forEach(([key, value]) => {
            // EXCLUDE categories and subcategories from URL
            if (key === 'categories' || key === 'subcategories') {
                return
            }

            if (shouldIncludeInQuery(key, value)) {
                if (Array.isArray(value)) {
                    query[key] = value.join(',')
                } else {
                    query[key] = String(value)
                }
            }
        })

        return query
    }

    const shouldIncludeInQuery = (key: string, value: any): boolean => {
        // Never include category filters in URL
        if (key === 'categories' || key === 'subcategories') {
            return false
        }

        if (value === undefined || value === null || value === '') {
            return false
        }

        if (Array.isArray(value) && value.length === 0) {
            return false
        }

        const booleanFields = ['has_discount', 'private_label_available', 'my_products']
        if (booleanFields.includes(key)) {
            return value === true
        }

        if (key === 'rating') {
            return typeof value === 'number' && value > 0
        }

        const numericFields = ['price_min', 'weight_min']
        if (numericFields.includes(key)) {
            return typeof value === 'number' && value > 0
        }

        return true
    }

    // Get category filter based on depth
    const getCategoryFilter = () => {
        if (!itemId.value) return {}

        if (isMainCategory.value) {
            return { categories: [itemId.value] }
        } else {
            return { subcategories: [itemId.value] }
        }
    }

    // Merge filters with category filter
    const mergeWithCategoryFilter = (filters: Partial<ProductFilters>) => {
        const categoryFilter = getCategoryFilter()

        // Remove any categories/subcategories from incoming filters
        const cleanFilters = { ...filters }
        delete cleanFilters.categories
        delete cleanFilters.subcategories

        return {
            ...cleanFilters,
            ...categoryFilter,
        }
    }

    // Custom fetch function that always includes category filter
    const fetchFunction = () => {
        return async () => {
            const queryFilters = parseQueryFilters()
            const filtersWithCategory = mergeWithCategoryFilter(queryFilters)

            await productsStore.initializeProducts(filtersWithCategory)

            return {
                products: productsStore.products,
                meta: productsStore.meta,
                summary: productsStore.summary,
                filterOptions: productsStore.filterOptions,
            }
        }
    }

    // Update URL without category filters
    const updateQueryParams = async (filters: Partial<ProductFilters>) => {
        const query = buildQueryString(filters)
        await router.push({ query })
    }

    // Apply filters preserving category
    const applyFilters = async (filters: Partial<ProductFilters>) => {
        const currentFilters = parseQueryFilters()
        const mergedFilters = mergeWithCategoryFilter({
            ...currentFilters,
            ...filters,
            page: filters.page || 1,
        })

        // Update URL without category filters
        await updateQueryParams(mergedFilters)
    }

    // Reset filters but keep category
    const resetFilters = async () => {
        await router.push({
            path: route.path,
            query: {},
        })
    }

    const search = async (searchTerm: string) => {
        await applyFilters({ search: searchTerm, page: 1 })
    }

    const goToPage = async (page: number) => {
        const currentFilters = parseQueryFilters()
        await applyFilters({ ...currentFilters, page })
    }

    const sortBy = async (
        sortField: ProductFilters['sort_by'],
        direction?: ProductFilters['sort_direction']
    ) => {
        await applyFilters({
            sort_by: sortField,
            sort_direction: direction || 'desc',
            page: 1,
        })
    }

    // Initialize with category filter
    const initializeCatalogFilter = async () => {
        if (itemId.value) {
            const queryFilters = parseQueryFilters()
            const filtersWithCategory = mergeWithCategoryFilter(queryFilters)
            await productsStore.initializeProducts(filtersWithCategory)
        }
    }

    // Filter dependencies - watch query and catalog item
    const filterDependencies = [
        computed(() => JSON.stringify(route.query)),
        computed(() => catalogItem.value?.id),
    ]

    return {
        // Store data
        products: computed(() => productsStore.products),
        meta: computed(() => productsStore.meta),
        filters: computed(() => productsStore.filters),
        filterOptions: computed(() => productsStore.filterOptions),
        summary: computed(() => productsStore.summary),
        isLoading: computed(() => productsStore.isLoading),
        error: computed(() => productsStore.error),

        // Computed
        hasProducts: computed(() => productsStore.hasProducts),
        totalProducts: computed(() => productsStore.totalProducts),
        currentPage: computed(() => productsStore.currentPage),
        lastPage: computed(() => productsStore.lastPage),
        hasNextPage: computed(() => productsStore.hasNextPage),
        hasPrevPage: computed(() => productsStore.hasPrevPage),
        activeFiltersCount: computed(() => productsStore.activeFiltersCount),

        // Catalog-specific
        catalogItem,
        itemId,
        itemDepth,
        isMainCategory,
        isSubcategory,

        // Methods
        fetchFunction,
        filterDependencies,
        parseQueryFilters,
        applyFilters,
        resetFilters,
        search,
        goToPage,
        sortBy,
        initializeCatalogFilter,
        mergeWithCategoryFilter,
        // Utils
        loadMore: productsStore.loadMore,
        clearFilter: async (filterKey: keyof ProductFilters) => {
            if (filterKey === 'categories' || filterKey === 'subcategories') {
                return // Don't allow clearing category filter
            }
            const newQuery = { ...route.query }
            delete newQuery[filterKey]
            await router.push({ query: newQuery })
        },
    }
}
