import type { ProductFilters, ProductDetails } from '~/types/products'
import { useProductsStore } from '~/stores/products'
import { useUserStore } from '~/stores/user'
import { storeToRefs } from 'pinia'

export const useProducts = (initialFilters?: ProductFilters) => {
    const productsStore = useProductsStore()
    const route = useRoute()
    const router = useRouter()
    const userStore = useUserStore()

    const { plan } = storeToRefs(userStore)

    const filterDependencies = [computed(() => JSON.stringify(route.query))]

    const fetchFunction = () => {
        return async () => {
            const queryFilters = parseQueryFilters()

            await productsStore.initializeProducts(queryFilters, plan.value)

            return {
                products: productsStore.products,
                meta: productsStore.meta,
                summary: productsStore.summary,
                filterOptions: productsStore.filterOptions,
            }
        }
    }

    const parseQueryFilters = (): ProductFilters => {
        const query = route.query
        const filters: ProductFilters = {}

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
                'discount',
                'most_ordered',
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

        if (query.categories) {
            filters.categories = parseIntArrayParam(query.categories)
        }

        if (query.subcategories) {
            filters.subcategories = parseIntArrayParam(query.subcategories)
        }

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

        if (query.availability_countries) {
            filters.availability_countries = parseIntArrayParam(query.availability_countries)
        }

        if (query.weight_type && typeof query.weight_type === 'string') {
            const weightType = parseInt(query.weight_type, 10)
            if (!isNaN(weightType)) {
                filters.weight_type = weightType
            }
        }

        if (query.supplier_id && typeof query.supplier_id === 'string') {
            const supplierId = parseInt(query.supplier_id, 10)
            if (!isNaN(supplierId)) {
                filters.supplier_id = supplierId
            }
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

        if (query.only_favorites === 'true') {
            filters.only_favorites = true
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

    const shouldIncludeInQuery = (key: string, value: any): boolean => {
        if (value === undefined || value === null || value === '') {
            return false
        }

        if (Array.isArray(value) && value.length === 0) {
            return false
        }

        const booleanFields = [
            'has_discount',
            'private_label_available',
            'my_products',
            'only_favorites',
        ]
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

    const buildQueryString = (filters: Partial<ProductFilters>): Record<string, string> => {
        const query: Record<string, string> = {}

        Object.entries(filters).forEach(([key, value]) => {
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

    const updateQueryParams = async (filters: Partial<ProductFilters>) => {
        const query = buildQueryString(filters)
        await router.push({ query })
    }

    const applyFilters = async (filters: Partial<ProductFilters>) => {
        const currentFilters = parseQueryFilters()
        const mergedFilters = {
            ...currentFilters,
            ...filters,
            page: filters.page || 1,
        }

        const cleanedFilters: Partial<ProductFilters> = {}
        Object.entries(mergedFilters).forEach(([key, value]) => {
            if (shouldIncludeInQuery(key, value)) {
                cleanedFilters[key as keyof ProductFilters] = value
            }
        })

        await updateQueryParams(cleanedFilters)
    }

    const clearFilter = async (filterKey: keyof ProductFilters) => {
        const newQuery = { ...route.query }
        delete newQuery[filterKey]
        await router.push({ query: newQuery })
    }

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

    const refresh = async () => {
        await productsStore.refresh()
    }

    const updateProductLocally = (productId: number, updates: Partial<ProductDetails>): boolean => {
        try {
            productsStore.updateProductLocally(productId, updates)
            return true
        } catch (error: any) {
            console.warn('Failed to update product locally:', error)
            return false
        }
    }

    return {
        products: computed(() => productsStore.products),
        meta: computed(() => productsStore.meta),
        filters: computed(() => productsStore.filters),
        filterOptions: computed(() => productsStore.filterOptions),
        summary: computed(() => productsStore.summary),
        isLoading: computed(() => productsStore.isLoading),
        error: computed(() => productsStore.error),

        hasProducts: computed(() => productsStore.hasProducts),
        totalProducts: computed(() => productsStore.totalProducts),
        currentPage: computed(() => productsStore.currentPage),
        lastPage: computed(() => productsStore.lastPage),
        hasNextPage: computed(() => productsStore.hasNextPage),
        hasPrevPage: computed(() => productsStore.hasPrevPage),
        activeFiltersCount: computed(() => productsStore.activeFiltersCount),

        fetchFunction,
        filterDependencies,
        parseQueryFilters,
        applyFilters,
        clearFilter,
        resetFilters,
        search,
        goToPage,
        sortBy,
        refresh,
        updateProductLocally,

        loadMore: productsStore.loadMore,
    }
}
