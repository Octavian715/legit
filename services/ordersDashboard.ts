import type {
    BuyerOrdersChart,
    SupplierOrdersChart,
    BuyerSpentCategoryChart,
    BuyerSpentSupplierChart,
    SupplierOrdersByCountryChart,
    SupplierAverageCartChart,
    OrderStats,
    CategoryTableItem,
    SupplierTableItem,
    CountryTableItem,
    CategoryFilterOptions,
    SupplierFilterOptions,
    CountryFilterOptions,
    TableResponse,
    OrdersChartFilters,
    OrdersTableFilters,
} from '~/types/ordersDashboard'
import { TokenService } from './token'
import { handleApiError } from '~/utils/errors'

export class OrdersDashboardService {
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

    private buildChartQueryParams(filters: OrdersChartFilters = {}): string {
        const queryParams = new URLSearchParams()

        if (filters.period) queryParams.append('period', filters.period)
        if (filters.start_date) queryParams.append('start_date', filters.start_date)
        if (filters.end_date) queryParams.append('end_date', filters.end_date)

        const queryString = queryParams.toString()
        return queryString ? `?${queryString}` : ''
    }

    private buildTableQueryParams(filters: OrdersTableFilters = {}): string {
        const queryParams = new URLSearchParams()

        if (filters.search?.trim()) queryParams.append('search', filters.search.trim())
        if (filters.period) queryParams.append('period', filters.period)
        if (filters.start_date) queryParams.append('start_date', filters.start_date)
        if (filters.end_date) queryParams.append('end_date', filters.end_date)

        if (filters.category_ids?.length) {
            filters.category_ids.forEach((id) =>
                queryParams.append('category_ids[]', id.toString())
            )
        }

        if (filters.business_type_ids?.length) {
            filters.business_type_ids.forEach((id) =>
                queryParams.append('business_type_ids[]', id.toString())
            )
        }

        if (filters.country_ids?.length) {
            filters.country_ids.forEach((id) => queryParams.append('country_ids[]', id.toString()))
        }

        if (filters.min_total_spent !== undefined) {
            queryParams.append('min_total_spent', filters.min_total_spent.toString())
        }

        if (filters.max_total_spent !== undefined) {
            queryParams.append('max_total_spent', filters.max_total_spent.toString())
        }

        if (filters.page) queryParams.append('page', filters.page.toString())
        if (filters.per_page) queryParams.append('per_page', filters.per_page.toString())
        if (filters.sort_by) queryParams.append('sort_by', filters.sort_by)
        if (filters.sort_direction) queryParams.append('sort_direction', filters.sort_direction)

        const queryString = queryParams.toString()
        return queryString ? `?${queryString}` : ''
    }

    // Buyer orders endpoints
    async fetchBuyerOrdersChart(filters: OrdersChartFilters = {}): Promise<BuyerOrdersChart> {
        const queryParams = this.buildChartQueryParams(filters)
        const endpoint = `/backoffice/orders/buyer${queryParams}`
        return await this.apiFetch<BuyerOrdersChart>(endpoint, { method: 'GET' })
    }

    async fetchBuyerOrdersStats(): Promise<OrderStats[]> {
        const endpoint = `/backoffice/orders/stats/buyer`
        return await this.apiFetch<OrderStats[]>(endpoint, { method: 'GET' })
    }

    async fetchBuyerSpentCategoryChart(
        filters: OrdersChartFilters = {}
    ): Promise<BuyerSpentCategoryChart> {
        const queryParams = this.buildChartQueryParams(filters)
        const endpoint = `/backoffice/orders/spent-category/buyer${queryParams}`
        return await this.apiFetch<BuyerSpentCategoryChart>(endpoint, { method: 'GET' })
    }

    async fetchBuyerSpentCategoryTable(
        filters: OrdersTableFilters = {}
    ): Promise<TableResponse<CategoryTableItem>> {
        const queryParams = this.buildTableQueryParams(filters)
        const endpoint = `/backoffice/orders/spent-category/buyer/table${queryParams}`
        return await this.apiFetch<TableResponse<CategoryTableItem>>(endpoint, { method: 'GET' })
    }

    async fetchBuyerSpentCategoryFilters(): Promise<CategoryFilterOptions> {
        const endpoint = `/backoffice/orders/spent-category/buyer/filters`
        return await this.apiFetch<CategoryFilterOptions>(endpoint, { method: 'GET' })
    }

    async fetchBuyerSpentSupplierChart(
        filters: OrdersChartFilters = {}
    ): Promise<BuyerSpentSupplierChart> {
        const queryParams = this.buildChartQueryParams(filters)
        const endpoint = `/backoffice/orders/spent-supplier/buyer${queryParams}`
        return await this.apiFetch<BuyerSpentSupplierChart>(endpoint, { method: 'GET' })
    }

    async fetchBuyerSpentSupplierTable(
        filters: OrdersTableFilters = {}
    ): Promise<TableResponse<SupplierTableItem>> {
        const queryParams = this.buildTableQueryParams(filters)
        const endpoint = `/backoffice/orders/spent-supplier/buyer/table${queryParams}`
        return await this.apiFetch<TableResponse<SupplierTableItem>>(endpoint, { method: 'GET' })
    }

    async fetchBuyerSpentSupplierFilters(): Promise<SupplierFilterOptions> {
        const endpoint = `/backoffice/orders/spent-supplier/buyer/filters`
        return await this.apiFetch<SupplierFilterOptions>(endpoint, { method: 'GET' })
    }

    // Supplier orders endpoints
    async fetchSupplierOrdersChart(filters: OrdersChartFilters = {}): Promise<SupplierOrdersChart> {
        const queryParams = this.buildChartQueryParams(filters)
        const endpoint = `/backoffice/orders/supplier${queryParams}`
        return await this.apiFetch<SupplierOrdersChart>(endpoint, { method: 'GET' })
    }

    async fetchSupplierOrdersStats(): Promise<OrderStats[]> {
        const endpoint = `/backoffice/orders/stats/supplier`
        return await this.apiFetch<OrderStats[]>(endpoint, { method: 'GET' })
    }

    async fetchSupplierOrdersByCountryChart(
        filters: OrdersChartFilters = {}
    ): Promise<SupplierOrdersByCountryChart> {
        const queryParams = this.buildChartQueryParams(filters)
        const endpoint = `/backoffice/orders/orders-by-country/supplier${queryParams}`
        return await this.apiFetch<SupplierOrdersByCountryChart>(endpoint, { method: 'GET' })
    }

    async fetchSupplierOrdersByCountryTable(
        filters: OrdersTableFilters = {}
    ): Promise<TableResponse<CountryTableItem>> {
        const queryParams = this.buildTableQueryParams(filters)
        const endpoint = `/backoffice/orders/orders-by-country/supplier/table${queryParams}`
        return await this.apiFetch<TableResponse<CountryTableItem>>(endpoint, { method: 'GET' })
    }

    async fetchSupplierOrdersByCountryFilters(): Promise<CountryFilterOptions> {
        const endpoint = `/backoffice/orders/orders-by-country/supplier/filters`
        return await this.apiFetch<CountryFilterOptions>(endpoint, { method: 'GET' })
    }

    async fetchSupplierAverageCartChart(
        filters: OrdersChartFilters = {}
    ): Promise<SupplierAverageCartChart> {
        const queryParams = this.buildChartQueryParams(filters)
        const endpoint = `/backoffice/orders/average-cart/supplier${queryParams}`
        return await this.apiFetch<SupplierAverageCartChart>(endpoint, { method: 'GET' })
    }
}
