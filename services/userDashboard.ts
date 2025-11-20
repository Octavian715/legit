import type {
    BuyerDashboardUser,
    SupplierDashboardUser,
    DashboardListResponse,
    DashboardFilterOptions,
    DashboardFilters,
    DashboardChartData,
    DashboardChartFilters,
    SupplierChartData,
    BuyerChartData,
} from '~/types/userDashboard'
import { TokenService } from './token'
import { handleApiError } from '~/utils/errors'

export class UserDashboardService {
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

    // Helper to convert camelCase period to snake_case for API
    private convertPeriodToSnakeCase(period: string): string {
        return period.replace(/([A-Z])/g, '_$1').toLowerCase()
    }

    private buildChartQueryParams(filters: DashboardChartFilters = {}): string {
        const queryParams = new URLSearchParams()

        // Convert camelCase period to snake_case for API
        if (filters.period) {
            queryParams.append('period', this.convertPeriodToSnakeCase(filters.period))
        }
        if (filters.start_date) queryParams.append('start_date', filters.start_date)
        if (filters.end_date) queryParams.append('end_date', filters.end_date)

        const queryString = queryParams.toString()
        return queryString ? `?${queryString}` : ''
    }

    // Buyers endpoints (for suppliers)
    async fetchAllBuyers(
        filters: DashboardFilters = {}
    ): Promise<DashboardListResponse<BuyerDashboardUser>> {
        const queryParams = new URLSearchParams()

        if (filters.search?.trim()) queryParams.append('search', filters.search.trim())
        if (filters.period) queryParams.append('period', this.convertPeriodToSnakeCase(filters.period))
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

        if (filters.page) queryParams.append('page', filters.page.toString())
        if (filters.per_page) queryParams.append('per_page', filters.per_page.toString())
        if (filters.sort_by) queryParams.append('sort_by', filters.sort_by)
        if (filters.sort_direction) queryParams.append('sort_direction', filters.sort_direction)

        const endpoint = `/backoffice/supplier-buyer/buyers/all?${queryParams.toString()}`
        return await this.apiFetch<DashboardListResponse<BuyerDashboardUser>>(endpoint, {
            method: 'GET',
        })
    }

    async fetchAllBuyersFilters(): Promise<DashboardFilterOptions> {
        const response = await this.apiFetch<
            { data?: DashboardFilterOptions } | DashboardFilterOptions
        >('/backoffice/supplier-buyer/buyers/all/filters', { method: 'GET' })
        return 'data' in response ? response.data || response : response
    }

    async fetchBuyersByBusinessType(filters: DashboardFilters = {}): Promise<DashboardChartData> {
        const queryParams = new URLSearchParams()

        if (filters.period) queryParams.append('period', this.convertPeriodToSnakeCase(filters.period))
        if (filters.start_date) queryParams.append('start_date', filters.start_date)
        if (filters.end_date) queryParams.append('end_date', filters.end_date)

        const endpoint = `/backoffice/supplier-buyer/buyers/business-type?${queryParams.toString()}`
        return await this.apiFetch<DashboardChartData>(endpoint, {
            method: 'GET',
        })
    }

    async fetchBuyersByCountry(filters: DashboardFilters = {}): Promise<DashboardChartData> {
        const queryParams = new URLSearchParams()

        if (filters.period) queryParams.append('period', this.convertPeriodToSnakeCase(filters.period))
        if (filters.start_date) queryParams.append('start_date', filters.start_date)
        if (filters.end_date) queryParams.append('end_date', filters.end_date)

        const endpoint = `/backoffice/supplier-buyer/buyers/country?${queryParams.toString()}`
        return await this.apiFetch<DashboardChartData>(endpoint, {
            method: 'GET',
        })
    }

    async fetchBuyersByBusinessTypeTable(
        filters: DashboardFilters = {}
    ): Promise<DashboardListResponse<BuyerDashboardUser>> {
        const queryParams = new URLSearchParams()

        if (filters.search?.trim()) queryParams.append('search', filters.search.trim())
        if (filters.period) queryParams.append('period', this.convertPeriodToSnakeCase(filters.period))
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

        if (filters.page) queryParams.append('page', filters.page.toString())
        if (filters.per_page) queryParams.append('per_page', filters.per_page.toString())
        if (filters.sort_by) queryParams.append('sort_by', filters.sort_by)
        if (filters.sort_direction) queryParams.append('sort_direction', filters.sort_direction)

        const endpoint = `/backoffice/supplier-buyer/buyers/business-type/table?${queryParams.toString()}`
        return await this.apiFetch<DashboardListResponse<BuyerDashboardUser>>(endpoint, {
            method: 'GET',
        })
    }

    async fetchBuyersByCountryTable(
        filters: DashboardFilters = {}
    ): Promise<DashboardListResponse<any>> {
        const queryParams = new URLSearchParams()

        if (filters.search?.trim()) queryParams.append('search', filters.search.trim())
        if (filters.period) queryParams.append('period', this.convertPeriodToSnakeCase(filters.period))
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

        if (filters.page) queryParams.append('page', filters.page.toString())
        if (filters.per_page) queryParams.append('per_page', filters.per_page.toString())
        if (filters.sort_by) queryParams.append('sort_by', filters.sort_by)
        if (filters.sort_direction) queryParams.append('sort_direction', filters.sort_direction)

        const endpoint = `/backoffice/supplier-buyer/buyers/country/table?${queryParams.toString()}`
        return await this.apiFetch<DashboardListResponse<any>>(endpoint, {
            method: 'GET',
        })
    }

    // Suppliers endpoints (for buyers)
    async fetchAllSuppliers(
        filters: DashboardFilters = {}
    ): Promise<DashboardListResponse<SupplierDashboardUser>> {
        const queryParams = new URLSearchParams()

        if (filters.search?.trim()) queryParams.append('search', filters.search.trim())
        if (filters.period) queryParams.append('period', this.convertPeriodToSnakeCase(filters.period))
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

        if (filters.page) queryParams.append('page', filters.page.toString())
        if (filters.per_page) queryParams.append('per_page', filters.per_page.toString())
        if (filters.sort_by) queryParams.append('sort_by', filters.sort_by)
        if (filters.sort_direction) queryParams.append('sort_direction', filters.sort_direction)

        const endpoint = `/backoffice/supplier-buyer/suppliers/all?${queryParams.toString()}`
        return await this.apiFetch<DashboardListResponse<SupplierDashboardUser>>(endpoint, {
            method: 'GET',
        })
    }

    async fetchAllSuppliersFilters(): Promise<DashboardFilterOptions> {
        const response = await this.apiFetch<
            { data?: DashboardFilterOptions } | DashboardFilterOptions
        >('/backoffice/supplier-buyer/suppliers/all/filters', { method: 'GET' })
        return 'data' in response ? response.data || response : response
    }

    // NEW: Chart data endpoints for suppliers (visible to buyers)
    async fetchSuppliersByBusinessType(
        filters: DashboardChartFilters = {}
    ): Promise<SupplierChartData> {
        const queryParams = this.buildChartQueryParams(filters)
        const endpoint = `/backoffice/supplier-buyer/suppliers/business-type${queryParams}`
        return await this.apiFetch<SupplierChartData>(endpoint, {
            method: 'GET',
        })
    }

    async fetchSuppliersByCountry(filters: DashboardChartFilters = {}): Promise<SupplierChartData> {
        const queryParams = this.buildChartQueryParams(filters)
        const endpoint = `/backoffice/supplier-buyer/suppliers/country${queryParams}`
        return await this.apiFetch<SupplierChartData>(endpoint, {
            method: 'GET',
        })
    }

    // NEW: Chart data endpoints for buyers (visible to suppliers)
    async fetchBuyersBusinessTypeChart(
        filters: DashboardChartFilters = {}
    ): Promise<BuyerChartData> {
        const queryParams = this.buildChartQueryParams(filters)
        const endpoint = `/backoffice/supplier-buyer/buyers/business-type${queryParams}`
        return await this.apiFetch<BuyerChartData>(endpoint, {
            method: 'GET',
        })
    }

    async fetchBuyersCountryChart(filters: DashboardChartFilters = {}): Promise<BuyerChartData> {
        const queryParams = this.buildChartQueryParams(filters)
        const endpoint = `/backoffice/supplier-buyer/buyers/country${queryParams}`
        return await this.apiFetch<BuyerChartData>(endpoint, {
            method: 'GET',
        })
    }
}
