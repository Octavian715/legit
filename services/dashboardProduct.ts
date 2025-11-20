import type {
    ProductFeaturesListResponse,
    ProductPricesListResponse,
    ProductOverviewResponse,
    ProductStatsResponse,
    NewProductsResponse,
    SupplierBuyerStatsResponse,
    SupplierBuyerTableResponse,
    FeatureFilterOptions,
    PriceFilterOptions,
    SupplierFilterOptions,
    BuyerFilterOptions,
    SupplierBuyerFilters,
    ProductFeaturesFilters,
    ProductPricesFilters,
    ProductOverviewFilters,
    NewProductsFilters,
    SupplierBuyerStatsFilters,
    SupplierBuyerTableFilters,
} from '~/types/dashboardProduct'
import { TokenService } from './token'
import { handleApiError } from '~/utils/errors'

export class DashboardProductService {
    private readonly baseURL: string

    constructor() {
        const config = useRuntimeConfig()
        this.baseURL = config.public.apiBaseURL
    }

    private async apiFetch<T>(endpoint: string, options: any): Promise<T> {
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

    async fetchProductsWithFeatures(
        filters: ProductFeaturesFilters = {}
    ): Promise<ProductFeaturesListResponse> {
        const queryParams = new URLSearchParams()

        if (filters.search?.trim()) queryParams.append('search', filters.search.trim())
        if (filters.start_date) queryParams.append('start_date', filters.start_date)
        if (filters.end_date) queryParams.append('end_date', filters.end_date)

        if (filters.brand_names?.length) {
            filters.brand_names.forEach((brand) => queryParams.append('brand_names[]', brand))
        }

        if (filters.category_ids?.length) {
            filters.category_ids.forEach((id) =>
                queryParams.append('category_ids[]', id.toString())
            )
        }

        if (filters.feature_ids?.length) {
            filters.feature_ids.forEach((id) => queryParams.append('feature_ids[]', id.toString()))
        }

        if (filters.has_features !== undefined) {
            queryParams.append('has_features', filters.has_features.toString())
        }

        if (filters.page) queryParams.append('page', filters.page.toString())
        if (filters.per_page) queryParams.append('per_page', filters.per_page.toString())
        if (filters.sort_by) queryParams.append('sort_by', filters.sort_by)
        if (filters.sort_direction) queryParams.append('sort_direction', filters.sort_direction)

        const endpoint = `/backoffice/products/features?${queryParams.toString()}`
        return await this.apiFetch<ProductFeaturesListResponse>(endpoint, {
            method: 'GET',
        })
    }

    async fetchAllDashboardProducts(
        filters: ProductFeaturesFilters = {}
    ): Promise<ProductFeaturesListResponse> {
        const queryParams = new URLSearchParams()

        if (filters.search?.trim()) queryParams.append('search', filters.search.trim())

        if (filters.brand_names?.length) {
            filters.brand_names.forEach((brand) => queryParams.append('brand_names[]', brand))
        }

        if (filters.category_ids?.length) {
            filters.category_ids.forEach((id) =>
                queryParams.append('category_ids[]', id.toString())
            )
        }

        if (filters.status_ids?.length) {
            filters.status_ids.forEach((id) => queryParams.append('status_ids[]', id.toString()))
        }

        if (filters.min_amount !== undefined) {
            queryParams.append('min_amount', filters.min_amount.toString())
        }

        if (filters.max_amount !== undefined) {
            queryParams.append('max_amount', filters.max_amount.toString())
        }

        if (filters.page) queryParams.append('page', filters.page.toString())
        if (filters.per_page) queryParams.append('per_page', filters.per_page.toString())
        if (filters.sort_by) queryParams.append('sort_by', filters.sort_by)
        if (filters.sort_direction) queryParams.append('sort_direction', filters.sort_direction)

        const endpoint = `/backoffice/products/all/supplier?${queryParams.toString()}`
        return await this.apiFetch<ProductFeaturesListResponse>(endpoint, {
            method: 'GET',
        })
    }

    async fetchFeatureFilters(): Promise<FeatureFilterOptions> {
        const response = await this.apiFetch<{ data: FeatureFilterOptions }>(
            '/backoffice/products/features/filters',
            { method: 'GET' }
        )
        return response.data || response
    }

    async fetchProductsWithPrices(
        filters: ProductPricesFilters = {}
    ): Promise<ProductPricesListResponse> {
        const queryParams = new URLSearchParams()

        if (filters.search?.trim()) queryParams.append('search', filters.search.trim())

        if (filters.brand_names?.length) {
            filters.brand_names.forEach((brand) => queryParams.append('brand_names[]', brand))
        }

        if (filters.local_price_from !== undefined) {
            queryParams.append('local_price_from', filters.local_price_from.toString())
        }
        if (filters.local_price_to !== undefined) {
            queryParams.append('local_price_to', filters.local_price_to.toString())
        }
        if (filters.export_price_from !== undefined) {
            queryParams.append('export_price_from', filters.export_price_from.toString())
        }
        if (filters.export_price_to !== undefined) {
            queryParams.append('export_price_to', filters.export_price_to.toString())
        }
        if (filters.local_discount_price_from !== undefined) {
            queryParams.append(
                'local_discount_price_from',
                filters.local_discount_price_from.toString()
            )
        }
        if (filters.local_discount_price_to !== undefined) {
            queryParams.append(
                'local_discount_price_to',
                filters.local_discount_price_to.toString()
            )
        }
        if (filters.export_discount_price_from !== undefined) {
            queryParams.append(
                'export_discount_price_from',
                filters.export_discount_price_from.toString()
            )
        }
        if (filters.export_discount_price_to !== undefined) {
            queryParams.append(
                'export_discount_price_to',
                filters.export_discount_price_to.toString()
            )
        }

        if (filters.page) queryParams.append('page', filters.page.toString())
        if (filters.per_page) queryParams.append('per_page', filters.per_page.toString())
        if (filters.sort_by) queryParams.append('sort_by', filters.sort_by)
        if (filters.sort_direction) queryParams.append('sort_direction', filters.sort_direction)

        const endpoint = `/backoffice/products/prices?${queryParams.toString()}`
        return await this.apiFetch<ProductPricesListResponse>(endpoint, {
            method: 'GET',
        })
    }

    async fetchPriceFilters(): Promise<PriceFilterOptions> {
        const response = await this.apiFetch<{ data: PriceFilterOptions }>(
            '/backoffice/products/prices/filters',
            { method: 'GET' }
        )
        return response.data || response
    }

    async fetchDashboardProductFilters(): Promise<SupplierFilterOptions> {
        const response = await this.apiFetch<{ data: SupplierFilterOptions }>(
            '/backoffice/products/all/supplier/filters',
            { method: 'GET' }
        )
        return response.data || response
    }

    async fetchBuyerProductFilters(): Promise<BuyerFilterOptions> {
        const response = await this.apiFetch<{ data: BuyerFilterOptions }>(
            '/backoffice/products/all/buyer/filters',
            { method: 'GET' }
        )
        return response.data || response
    }

    async fetchSupplierTotalProducts(
        filters: ProductOverviewFilters = {}
    ): Promise<ProductOverviewResponse> {
        const queryParams = new URLSearchParams()

        if (filters.start_date) queryParams.append('start_date', filters.start_date)
        if (filters.end_date) queryParams.append('end_date', filters.end_date)

        const endpoint = `/backoffice/products/overview/supplier/total-products?${queryParams.toString()}`
        return await this.apiFetch<ProductOverviewResponse>(endpoint, {
            method: 'GET',
        })
    }

    async fetchBuyerTotalProducts(
        filters: ProductOverviewFilters = {}
    ): Promise<ProductOverviewResponse> {
        const queryParams = new URLSearchParams()

        if (filters.start_date) queryParams.append('start_date', filters.start_date)
        if (filters.end_date) queryParams.append('end_date', filters.end_date)

        const endpoint = `/backoffice/products/overview/buyer/total-products?${queryParams.toString()}`
        return await this.apiFetch<ProductOverviewResponse>(endpoint, {
            method: 'GET',
        })
    }

    async fetchSupplierNewProducts(filters: NewProductsFilters = {}): Promise<NewProductsResponse> {
        const queryParams = new URLSearchParams()

        if (filters.period) queryParams.append('period', filters.period)
        if (filters.start_date) queryParams.append('start_date', filters.start_date)
        if (filters.end_date) queryParams.append('end_date', filters.end_date)

        const endpoint = `/backoffice/products/overview/supplier/new-products?${queryParams.toString()}`
        return await this.apiFetch<NewProductsResponse>(endpoint, {
            method: 'GET',
        })
    }

    async fetchDashboardProductStats(): Promise<ProductStatsResponse> {
        const endpoint = '/backoffice/products/overview/supplier/product-stats'
        return await this.apiFetch<ProductStatsResponse>(endpoint, {
            method: 'GET',
        })
    }

    async fetchBuyerProductStats(): Promise<ProductStatsResponse> {
        const endpoint = '/backoffice/products/overview/buyer/product-stats'
        return await this.apiFetch<ProductStatsResponse>(endpoint, {
            method: 'GET',
        })
    }

    async fetchSuppliersByBusinessType(
        filters: SupplierBuyerStatsFilters = {}
    ): Promise<SupplierBuyerStatsResponse> {
        const queryParams = new URLSearchParams()

        if (filters.period) queryParams.append('period', filters.period)
        if (filters.start_date) queryParams.append('start_date', filters.start_date)
        if (filters.end_date) queryParams.append('end_date', filters.end_date)

        const endpoint = `/backoffice/supplier-buyer/suppliers/business-type?${queryParams.toString()}`
        return await this.apiFetch<SupplierBuyerStatsResponse>(endpoint, {
            method: 'GET',
        })
    }

    async fetchSuppliersByCountry(
        filters: SupplierBuyerStatsFilters = {}
    ): Promise<SupplierBuyerStatsResponse> {
        const queryParams = new URLSearchParams()

        if (filters.period) queryParams.append('period', filters.period)
        if (filters.start_date) queryParams.append('start_date', filters.start_date)
        if (filters.end_date) queryParams.append('end_date', filters.end_date)

        const endpoint = `/backoffice/supplier-buyer/suppliers/country?${queryParams.toString()}`
        return await this.apiFetch<SupplierBuyerStatsResponse>(endpoint, {
            method: 'GET',
        })
    }

    async fetchBuyersByBusinessType(
        filters: SupplierBuyerStatsFilters = {}
    ): Promise<SupplierBuyerStatsResponse> {
        const queryParams = new URLSearchParams()

        if (filters.period) queryParams.append('period', filters.period)
        if (filters.start_date) queryParams.append('start_date', filters.start_date)
        if (filters.end_date) queryParams.append('end_date', filters.end_date)

        const endpoint = `/backoffice/supplier-buyer/buyers/business-type?${queryParams.toString()}`
        return await this.apiFetch<SupplierBuyerStatsResponse>(endpoint, {
            method: 'GET',
        })
    }

    async fetchBuyersByCountry(
        filters: SupplierBuyerStatsFilters = {}
    ): Promise<SupplierBuyerStatsResponse> {
        const queryParams = new URLSearchParams()

        if (filters.period) queryParams.append('period', filters.period)
        if (filters.start_date) queryParams.append('start_date', filters.start_date)
        if (filters.end_date) queryParams.append('end_date', filters.end_date)

        const endpoint = `/backoffice/supplier-buyer/buyers/country?${queryParams.toString()}`
        return await this.apiFetch<SupplierBuyerStatsResponse>(endpoint, {
            method: 'GET',
        })
    }

    async fetchSuppliersBusinessTypeTable(
        filters: SupplierBuyerTableFilters = {}
    ): Promise<SupplierBuyerTableResponse> {
        const queryParams = new URLSearchParams()

        if (filters.page) queryParams.append('page', filters.page.toString())
        if (filters.per_page) queryParams.append('per_page', filters.per_page.toString())
        if (filters.search?.trim()) queryParams.append('search', filters.search.trim())
        if (filters.period) queryParams.append('period', filters.period)
        if (filters.start_date) queryParams.append('start_date', filters.start_date)
        if (filters.end_date) queryParams.append('end_date', filters.end_date)

        if (filters.business_type_ids?.length) {
            filters.business_type_ids.forEach((id) =>
                queryParams.append('business_type_ids[]', id.toString())
            )
        }

        if (filters.country_ids?.length) {
            filters.country_ids.forEach((id) => queryParams.append('country_ids[]', id.toString()))
        }

        if (filters.min_total_amount !== undefined) {
            queryParams.append('min_total_amount', filters.min_total_amount.toString())
        }
        if (filters.max_total_amount !== undefined) {
            queryParams.append('max_total_amount', filters.max_total_amount.toString())
        }

        if (filters.sort_by) queryParams.append('sort_by', filters.sort_by)
        if (filters.sort_direction) queryParams.append('sort_direction', filters.sort_direction)

        const endpoint = `/backoffice/supplier-buyer/suppliers/business-type/table?${queryParams.toString()}`
        return await this.apiFetch<SupplierBuyerTableResponse>(endpoint, {
            method: 'GET',
        })
    }

    async fetchSuppliersBusinessTypeFilters(): Promise<SupplierBuyerFilters> {
        return await this.apiFetch<SupplierBuyerFilters>(
            '/backoffice/supplier-buyer/suppliers/business-type/filters',
            { method: 'GET' }
        )
    }

    async fetchSuppliersCountryTable(
        filters: SupplierBuyerTableFilters = {}
    ): Promise<SupplierBuyerTableResponse> {
        const queryParams = new URLSearchParams()

        if (filters.page) queryParams.append('page', filters.page.toString())
        if (filters.per_page) queryParams.append('per_page', filters.per_page.toString())
        if (filters.search?.trim()) queryParams.append('search', filters.search.trim())
        if (filters.period) queryParams.append('period', filters.period)
        if (filters.start_date) queryParams.append('start_date', filters.start_date)
        if (filters.end_date) queryParams.append('end_date', filters.end_date)

        if (filters.country_ids?.length) {
            filters.country_ids.forEach((id) => queryParams.append('country_ids[]', id.toString()))
        }

        if (filters.min_total_amount !== undefined) {
            queryParams.append('min_total_amount', filters.min_total_amount.toString())
        }
        if (filters.max_total_amount !== undefined) {
            queryParams.append('max_total_amount', filters.max_total_amount.toString())
        }

        if (filters.sort_by) queryParams.append('sort_by', filters.sort_by)
        if (filters.sort_direction) queryParams.append('sort_direction', filters.sort_direction)

        const endpoint = `/backoffice/supplier-buyer/suppliers/country/table?${queryParams.toString()}`
        return await this.apiFetch<SupplierBuyerTableResponse>(endpoint, {
            method: 'GET',
        })
    }

    async fetchSuppliersCountryFilters(): Promise<SupplierBuyerFilters> {
        return await this.apiFetch<SupplierBuyerFilters>(
            '/backoffice/supplier-buyer/suppliers/country/filters',
            { method: 'GET' }
        )
    }

    async fetchBuyersBusinessTypeTable(
        filters: SupplierBuyerTableFilters = {}
    ): Promise<SupplierBuyerTableResponse> {
        const queryParams = new URLSearchParams()

        if (filters.page) queryParams.append('page', filters.page.toString())
        if (filters.per_page) queryParams.append('per_page', filters.per_page.toString())
        if (filters.search?.trim()) queryParams.append('search', filters.search.trim())
        if (filters.period) queryParams.append('period', filters.period)
        if (filters.start_date) queryParams.append('start_date', filters.start_date)
        if (filters.end_date) queryParams.append('end_date', filters.end_date)

        if (filters.business_type_ids?.length) {
            filters.business_type_ids.forEach((id) =>
                queryParams.append('business_type_ids[]', id.toString())
            )
        }

        if (filters.country_ids?.length) {
            filters.country_ids.forEach((id) => queryParams.append('country_ids[]', id.toString()))
        }

        if (filters.min_total_amount !== undefined) {
            queryParams.append('min_total_amount', filters.min_total_amount.toString())
        }
        if (filters.max_total_amount !== undefined) {
            queryParams.append('max_total_amount', filters.max_total_amount.toString())
        }

        if (filters.sort_by) queryParams.append('sort_by', filters.sort_by)
        if (filters.sort_direction) queryParams.append('sort_direction', filters.sort_direction)

        const endpoint = `/backoffice/supplier-buyer/buyers/business-type/table?${queryParams.toString()}`
        return await this.apiFetch<SupplierBuyerTableResponse>(endpoint, {
            method: 'GET',
        })
    }

    async fetchBuyersBusinessTypeFilters(): Promise<SupplierBuyerFilters> {
        return await this.apiFetch<SupplierBuyerFilters>(
            '/backoffice/supplier-buyer/buyers/business-type/filters',
            { method: 'GET' }
        )
    }

    async fetchBuyersCountryTable(
        filters: SupplierBuyerTableFilters = {}
    ): Promise<SupplierBuyerTableResponse> {
        const queryParams = new URLSearchParams()

        if (filters.page) queryParams.append('page', filters.page.toString())
        if (filters.per_page) queryParams.append('per_page', filters.per_page.toString())
        if (filters.search?.trim()) queryParams.append('search', filters.search.trim())
        if (filters.period) queryParams.append('period', filters.period)
        if (filters.start_date) queryParams.append('start_date', filters.start_date)
        if (filters.end_date) queryParams.append('end_date', filters.end_date)

        if (filters.country_ids?.length) {
            filters.country_ids.forEach((id) => queryParams.append('country_ids[]', id.toString()))
        }

        if (filters.min_total_amount !== undefined) {
            queryParams.append('min_total_amount', filters.min_total_amount.toString())
        }
        if (filters.max_total_amount !== undefined) {
            queryParams.append('max_total_amount', filters.max_total_amount.toString())
        }

        if (filters.sort_by) queryParams.append('sort_by', filters.sort_by)
        if (filters.sort_direction) queryParams.append('sort_direction', filters.sort_direction)

        const endpoint = `/backoffice/supplier-buyer/buyers/country/table?${queryParams.toString()}`
        return await this.apiFetch<SupplierBuyerTableResponse>(endpoint, {
            method: 'GET',
        })
    }

    async fetchBuyersCountryFilters(): Promise<SupplierBuyerFilters> {
        return await this.apiFetch<SupplierBuyerFilters>(
            '/backoffice/supplier-buyer/buyers/country/filters',
            { method: 'GET' }
        )
    }

    async fetchAllSuppliersTable(
        filters: SupplierBuyerTableFilters = {}
    ): Promise<SupplierBuyerTableResponse> {
        const queryParams = new URLSearchParams()

        if (filters.page) queryParams.append('page', filters.page.toString())
        if (filters.per_page) queryParams.append('per_page', filters.per_page.toString())
        if (filters.search?.trim()) queryParams.append('search', filters.search.trim())
        if (filters.period) queryParams.append('period', filters.period)
        if (filters.start_date) queryParams.append('start_date', filters.start_date)
        if (filters.end_date) queryParams.append('end_date', filters.end_date)

        if (filters.business_type_ids?.length) {
            filters.business_type_ids.forEach((id) =>
                queryParams.append('business_type_ids[]', id.toString())
            )
        }

        if (filters.country_ids?.length) {
            filters.country_ids.forEach((id) => queryParams.append('country_ids[]', id.toString()))
        }

        if (filters.min_total_amount !== undefined) {
            queryParams.append('min_total_amount', filters.min_total_amount.toString())
        }
        if (filters.max_total_amount !== undefined) {
            queryParams.append('max_total_amount', filters.max_total_amount.toString())
        }

        if (filters.sort_by) queryParams.append('sort_by', filters.sort_by)
        if (filters.sort_direction) queryParams.append('sort_direction', filters.sort_direction)

        const endpoint = `/backoffice/supplier-buyer/suppliers/all?${queryParams.toString()}`
        return await this.apiFetch<SupplierBuyerTableResponse>(endpoint, {
            method: 'GET',
        })
    }

    async fetchAllSuppliersFilters(): Promise<SupplierBuyerFilters> {
        return await this.apiFetch<SupplierBuyerFilters>(
            '/backoffice/supplier-buyer/suppliers/all/filters',
            { method: 'GET' }
        )
    }

    async fetchAllBuyersTable(
        filters: SupplierBuyerTableFilters = {}
    ): Promise<SupplierBuyerTableResponse> {
        const queryParams = new URLSearchParams()

        if (filters.page) queryParams.append('page', filters.page.toString())
        if (filters.per_page) queryParams.append('per_page', filters.per_page.toString())
        if (filters.search?.trim()) queryParams.append('search', filters.search.trim())
        if (filters.period) queryParams.append('period', filters.period)
        if (filters.start_date) queryParams.append('start_date', filters.start_date)
        if (filters.end_date) queryParams.append('end_date', filters.end_date)

        if (filters.business_type_ids?.length) {
            filters.business_type_ids.forEach((id) =>
                queryParams.append('business_type_ids[]', id.toString())
            )
        }

        if (filters.country_ids?.length) {
            filters.country_ids.forEach((id) => queryParams.append('country_ids[]', id.toString()))
        }

        if (filters.min_total_amount !== undefined) {
            queryParams.append('min_total_amount', filters.min_total_amount.toString())
        }
        if (filters.max_total_amount !== undefined) {
            queryParams.append('max_total_amount', filters.max_total_amount.toString())
        }

        if (filters.sort_by) queryParams.append('sort_by', filters.sort_by)
        if (filters.sort_direction) queryParams.append('sort_direction', filters.sort_direction)

        const endpoint = `/backoffice/supplier-buyer/buyers/all?${queryParams.toString()}`
        return await this.apiFetch<SupplierBuyerTableResponse>(endpoint, {
            method: 'GET',
        })
    }

    async fetchAllBuyersFilters(): Promise<SupplierBuyerFilters> {
        return await this.apiFetch<SupplierBuyerFilters>(
            '/backoffice/supplier-buyer/buyers/all/filters',
            { method: 'GET' }
        )
    }

    async fetchAllSupplierProducts(filters: AllProductsFilters = {}): Promise<AllProductsResponse> {
        const queryParams = new URLSearchParams()

        if (filters.search?.trim()) queryParams.append('search', filters.search.trim())
        if (filters.start_date) queryParams.append('start_date', filters.start_date)
        if (filters.end_date) queryParams.append('end_date', filters.end_date)
        if (filters.amount_from !== undefined) {
            queryParams.append('amount_from', filters.amount_from.toString())
        }
        if (filters.amount_to !== undefined) {
            queryParams.append('amount_to', filters.amount_to.toString())
        }

        if (filters.category_ids?.length) {
            filters.category_ids.forEach((id) =>
                queryParams.append('category_ids[]', id.toString())
            )
        }

        if (filters.brand_names?.length) {
            filters.brand_names.forEach((brand) => queryParams.append('brand_names[]', brand))
        }

        if (filters.status_ids?.length) {
            filters.status_ids.forEach((id) => queryParams.append('status_ids[]', id.toString()))
        }

        if (filters.page) queryParams.append('page', filters.page.toString())
        if (filters.per_page) queryParams.append('per_page', filters.per_page.toString())
        if (filters.sort_by) queryParams.append('sort_by', filters.sort_by)
        if (filters.sort_direction) queryParams.append('sort_direction', filters.sort_direction)

        const endpoint = `/backoffice/products/all/supplier?${queryParams.toString()}`
        return await this.apiFetch<AllProductsResponse>(endpoint, {
            method: 'GET',
        })
    }

    async fetchAllBuyerProducts(filters: AllProductsFilters = {}): Promise<AllProductsResponse> {
        const queryParams = new URLSearchParams()

        if (filters.search?.trim()) queryParams.append('search', filters.search.trim())
        if (filters.start_date) queryParams.append('start_date', filters.start_date)
        if (filters.end_date) queryParams.append('end_date', filters.end_date)
        if (filters.amount_from !== undefined) {
            queryParams.append('amount_from', filters.amount_from.toString())
        }
        if (filters.amount_to !== undefined) {
            queryParams.append('amount_to', filters.amount_to.toString())
        }

        if (filters.category_ids?.length) {
            filters.category_ids.forEach((id) =>
                queryParams.append('category_ids[]', id.toString())
            )
        }

        if (filters.brand_names?.length) {
            filters.brand_names.forEach((brand) => queryParams.append('brand_names[]', brand))
        }

        if (filters.status_ids?.length) {
            filters.status_ids.forEach((id) => queryParams.append('status_ids[]', id.toString()))
        }

        if (filters.page) queryParams.append('page', filters.page.toString())
        if (filters.per_page) queryParams.append('per_page', filters.per_page.toString())
        if (filters.sort_by) queryParams.append('sort_by', filters.sort_by)
        if (filters.sort_direction) queryParams.append('sort_direction', filters.sort_direction)

        const endpoint = `/backoffice/products/all/buyer?${queryParams.toString()}`
        return await this.apiFetch<AllProductsResponse>(endpoint, {
            method: 'GET',
        })
    }

    async fetchSupplierProductFilters(): Promise<SupplierFilterOptions> {
        const response = await this.apiFetch<{ data: SupplierFilterOptions }>(
            '/backoffice/products/all/supplier/filters',
            { method: 'GET' }
        )
        return response.data || response
    }
}
