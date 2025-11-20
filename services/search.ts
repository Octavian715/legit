import type {
    SearchProductFilters,
    SearchCompanyFilters,
    ProductSearchResponse,
    GroupedProductSearchResponse,
    CompanySearchResponse,
    SearchCompany,
    ProductFilterOptionsResponse,
    CompanyFilterOptionsResponse,
    ProductSummaryResponse,
} from '~/types/search'
import { handleApiError } from '~/utils/errors'
import { TokenService } from './token'

export class SearchService {
    private readonly baseURL: string

    constructor() {
        const config = useRuntimeConfig()
        this.baseURL = config.public.apiBaseURL
    }

    private async apiFetch<T>(endpoint: string, options: any = {}): Promise<T> {
        try {
            return await $fetch<T>(endpoint, {
                baseURL: this.baseURL,
                headers: TokenService.getRequestHeaders(),
                ...options,
            })
        } catch (error: any) {
            const appError = handleApiError(error)
            if (appError.code === 'AUTH_ERROR') {
                TokenService.clearAllTokens()
            }
            throw appError
        }
    }

    async searchProducts(
        filters: SearchProductFilters,
        useCache = true
    ): Promise<ProductSearchResponse | GroupedProductSearchResponse> {
        const params = {
            ...(filters.search && { search: filters.search }),
            ...(filters.page && { page: filters.page }),
            ...(filters.per_page && { per_page: filters.per_page }),
            ...(filters.sort_by && { sort_by: filters.sort_by }),
            ...(filters.sort_direction && { sort_direction: filters.sort_direction }),
            ...(filters.group_by_company && { group_by_company: filters.group_by_company }),
            ...(filters.categories && {
                categories: Array.isArray(filters.categories)
                    ? filters.categories.join(',')
                    : filters.categories,
            }),
            ...(filters.subcategories && {
                subcategories: Array.isArray(filters.subcategories)
                    ? filters.subcategories.join(',')
                    : filters.subcategories,
            }),
            ...(filters.price_min && { price_min: filters.price_min }),
            ...(filters.price_max && { price_max: filters.price_max }),
            ...(filters.supplier_countries && {
                supplier_countries: Array.isArray(filters.supplier_countries)
                    ? filters.supplier_countries.join(',')
                    : filters.supplier_countries,
            }),
            ...(filters.availability_countries && {
                availability_countries: Array.isArray(filters.availability_countries)
                    ? filters.availability_countries.join(',')
                    : filters.availability_countries,
            }),
            ...(filters.features && {
                features: Array.isArray(filters.features)
                    ? filters.features.join(',')
                    : filters.features,
            }),
            ...(filters.additional_features && {
                additional_features: Array.isArray(filters.additional_features)
                    ? filters.additional_features.join(',')
                    : filters.additional_features,
            }),
            ...(filters.brands && {
                brands: Array.isArray(filters.brands) ? filters.brands.join(',') : filters.brands,
            }),
            ...(filters.conditions && {
                conditions: Array.isArray(filters.conditions)
                    ? filters.conditions.join(',')
                    : filters.conditions,
            }),
            ...(filters.weight_min && { weight_min: filters.weight_min }),
            ...(filters.weight_max && { weight_max: filters.weight_max }),
            ...(filters.weight_type && { weight_type: filters.weight_type }),
            ...(filters.status && {
                status: Array.isArray(filters.status) ? filters.status.join(',') : filters.status,
            }),
            ...(filters.has_discount !== undefined && { has_discount: filters.has_discount }),
            ...(filters.only_favorites !== undefined && { only_favorites: filters.only_favorites }),
            ...(filters.my_products !== undefined && { my_products: filters.my_products }),
        }

        return await this.apiFetch<ProductSearchResponse | GroupedProductSearchResponse>(
            '/products',
            {
                method: 'GET',
                params,
            }
        )
    }

    async getProductFilterOptions(
        filters: Partial<SearchProductFilters> = {} // Am schimbat categoryId cu 'filters'
    ): Promise<ProductFilterOptionsResponse> {
        const token = TokenService.getAuthToken()
        if (!token) {
            return {
                categories: [],
                subcategories: [],
                brands: [],
                features: [],
                additional_features: [],
                conditions: [],
                allergens: [],
                statuses: [],
                countries: [],
                price_range: { min: 0, max: 1000 },
            }
        }

        // Am adăugat logica de serializare a filtrelor, la fel ca în getProductSummary
        const params = {
            ...(filters.search && { search: filters.search }),
            ...(filters.categories && {
                categories: Array.isArray(filters.categories)
                    ? filters.categories.join(',')
                    : filters.categories,
            }),
            ...(filters.subcategories && {
                subcategories: Array.isArray(filters.subcategories)
                    ? filters.subcategories.join(',')
                    : filters.subcategories,
            }),
            ...(filters.price_min && { price_min: filters.price_min }),
            ...(filters.price_max && { price_max: filters.price_max }),
            ...(filters.supplier_countries && {
                supplier_countries: Array.isArray(filters.supplier_countries)
                    ? filters.supplier_countries.join(',')
                    : filters.supplier_countries,
            }),
            ...(filters.availability_countries && {
                availability_countries: Array.isArray(filters.availability_countries)
                    ? filters.availability_countries.join(',')
                    : filters.availability_countries,
            }),
            ...(filters.features && {
                features: Array.isArray(filters.features)
                    ? filters.features.join(',')
                    : filters.features,
            }),
            ...(filters.additional_features && {
                additional_features: Array.isArray(filters.additional_features)
                    ? filters.additional_features.join(',')
                    : filters.additional_features,
            }),
            ...(filters.brands && {
                brands: Array.isArray(filters.brands) ? filters.brands.join(',') : filters.brands,
            }),
            ...(filters.conditions && {
                conditions: Array.isArray(filters.conditions)
                    ? filters.conditions.join(',')
                    : filters.conditions,
            }),
            ...(filters.weight_min && { weight_min: filters.weight_min }),
            ...(filters.weight_max && { weight_max: filters.weight_max }),
            ...(filters.weight_type && { weight_type: filters.weight_type }),
            ...(filters.status && {
                status: Array.isArray(filters.status) ? filters.status.join(',') : filters.status,
            }),
            ...(filters.has_discount !== undefined && { has_discount: filters.has_discount }),
            ...(filters.only_favorites !== undefined && { only_favorites: filters.only_favorites }),
            ...(filters.my_products !== undefined && { my_products: filters.my_products }),
        }
        // --- Sfârșitul logicii adăugate ---

        const response = await this.apiFetch<ProductFilterOptionsResponse>(
            '/products/filter-options',
            {
                method: 'GET',
                params, // Am înlocuit 'params' care avea doar category_id cu noul 'params'
            }
        )

        // Extract data from response structure
        const filterData = response.data || response

        return {
            categories: filterData.categories || [],
            subcategories: filterData.subcategories || [],
            brands: filterData.brands || [],
            features: filterData.features || [],
            additional_features: filterData.additional_features || [],
            conditions: filterData.storage_conditions || [],
            allergens: filterData.allergens || [],
            statuses: filterData.statuses || [],
            countries: filterData.countries || [],
            price_range: filterData.price_range || { min: 0, max: 1000 },
            weight_types: filterData.weight_types || [],
        }
    }

    async getProductSummary(
        filters: Partial<SearchProductFilters>
    ): Promise<ProductSummaryResponse> {
        const params = {
            ...(filters.search && { search: filters.search }),
            ...(filters.categories && {
                categories: Array.isArray(filters.categories)
                    ? filters.categories.join(',')
                    : filters.categories,
            }),
            ...(filters.subcategories && {
                subcategories: Array.isArray(filters.subcategories)
                    ? filters.subcategories.join(',')
                    : filters.subcategories,
            }),
            ...(filters.price_min && { price_min: filters.price_min }),
            ...(filters.price_max && { price_max: filters.price_max }),
            ...(filters.supplier_countries && {
                supplier_countries: Array.isArray(filters.supplier_countries)
                    ? filters.supplier_countries.join(',')
                    : filters.supplier_countries,
            }),
            ...(filters.availability_countries && {
                availability_countries: Array.isArray(filters.availability_countries)
                    ? filters.availability_countries.join(',')
                    : filters.availability_countries,
            }),
            ...(filters.features && {
                features: Array.isArray(filters.features)
                    ? filters.features.join(',')
                    : filters.features,
            }),
            ...(filters.additional_features && {
                additional_features: Array.isArray(filters.additional_features)
                    ? filters.additional_features.join(',')
                    : filters.additional_features,
            }),
            ...(filters.brands && {
                brands: Array.isArray(filters.brands) ? filters.brands.join(',') : filters.brands,
            }),
            ...(filters.conditions && {
                conditions: Array.isArray(filters.conditions)
                    ? filters.conditions.join(',')
                    : filters.conditions,
            }),
            ...(filters.weight_min && { weight_min: filters.weight_min }),
            ...(filters.weight_max && { weight_max: filters.weight_max }),
            ...(filters.weight_type && { weight_type: filters.weight_type }),
            ...(filters.status && {
                status: Array.isArray(filters.status) ? filters.status.join(',') : filters.status,
            }),
            ...(filters.has_discount !== undefined && { has_discount: filters.has_discount }),
            ...(filters.only_favorites !== undefined && { only_favorites: filters.only_favorites }),
            ...(filters.my_products !== undefined && { my_products: filters.my_products }),
        }

        return await this.apiFetch<ProductSummaryResponse>('/products/summary', {
            method: 'GET',
            params,
        })
    }

    async searchCompanies(filters: SearchCompanyFilters): Promise<CompanySearchResponse> {
        if (!filters.query?.trim()) {
            throw new Error('Search query is required')
        }

        const params = {
            query: filters.query.trim(),
            ...(filters.page && { page: filters.page }),
            ...(filters.per_page && { per_page: filters.per_page }),
            ...(filters.business_type_id && { business_type_id: filters.business_type_id }),
            ...(filters.country_id && { country_id: filters.country_id }),
            ...(filters.sort_by && { sort_by: filters.sort_by }),
            ...(filters.sort_direction && { sort_direction: filters.sort_direction }),
        }

        return await this.apiFetch<CompanySearchResponse>('/search/companies', {
            method: 'GET',
            params,
        })
    }

    async getCompanySuggestions(query: string): Promise<SearchCompany[]> {
        if (!query?.trim()) {
            return []
        }

        return await this.apiFetch<SearchCompany[]>('/search/companies/suggestions', {
            method: 'GET',
            params: { query: query.trim() },
        })
    }

    async getCompanyFilterOptions(
        filters: Partial<SearchCompanyFilters> = {} // Am adăugat 'filters' ca parametru
    ): Promise<CompanyFilterOptionsResponse> {
        // Am adăugat logica de serializare
        const params = {
            ...(filters.query && { query: filters.query.trim() }),
            ...(filters.business_type_id && { business_type_id: filters.business_type_id }),
            ...(filters.country_id && { country_id: filters.country_id }),
        }

        return await this.apiFetch<CompanyFilterOptionsResponse>('/search/companies/filters', {
            method: 'GET',
            params, // Am adăugat 'params' la request
        })
    }

    async toggleProductFavorite(
        productId: number,
        isFavorite: boolean
    ): Promise<{ success: boolean }> {
        return await this.apiFetch<{ success: boolean }>(`/products/${productId}/favorite`, {
            method: isFavorite ? 'DELETE' : 'POST',
        })
    }

    async getProductById(id: number): Promise<any> {
        const token = TokenService.getAuthToken()
        if (!token) {
            return null
        }

        const response = await this.apiFetch<ProductFilterOptionsResponse>(`/products/${id}`, {
            method: 'GET',
        })

        return response.data || response
    }
}
