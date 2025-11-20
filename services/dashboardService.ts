// services/dashboardService.ts
import type {
    UserRole,
    DashboardPeriodType,
    DashboardDateRange,
    MetricQueryParams,
    ProductQueryParams,
    BuyersQueryParams,
    SupplierRevenueResponse,
    SupplierOrdersResponse,
    SupplierConnectionsResponse,
    SupplierBuyersResponse,
    BuyerSpentResponse,
    BuyerOrdersResponse,
    BuyerConnectionsResponse,
    BuyerSuppliersResponse,
    TopProductsResponse,
    ProductFilterOptions,
    BuyersResponse,
    BuyersFiltersResponse,
} from '~/types/dashboard'

export class DashboardService {
    private readonly apiBase = '/backoffice/dashboard'
    private readonly buyersBuyersApiBase = '/backoffice/supplier-buyer'

    private buildQueryParams(params: any): URLSearchParams {
        const queryParams = new URLSearchParams()

        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                    value.forEach((item) => {
                        queryParams.append(key, item.toString())
                    })
                } else {
                    queryParams.append(key, value.toString())
                }
            }
        })

        return queryParams
    }

    private async makeRequest<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
        const { $api } = useNuxtApp()

        try {
            const url = params ? `${endpoint}?${this.buildQueryParams(params)}` : endpoint
            const response = await $api.get<T>(url)
            return response.data || response
        } catch (error: any) {
            console.error(`Dashboard API Error [${endpoint}]:`, error)

            if (error.response?.status === 401) {
                throw new Error('dashboardUser.errors.authorization')
            } else if (error.response?.status === 403) {
                throw new Error('dashboardUser.errors.endpointNotAvailable')
            } else if (error.response?.status === 422) {
                throw new Error('dashboardUser.errors.validation')
            } else if (error.response?.status >= 500) {
                throw new Error('dashboardUser.errors.server')
            } else if (!navigator.onLine) {
                throw new Error('dashboardUser.errors.network')
            } else {
                throw new Error('dashboardUser.errors.generic')
            }
        }
    }

    async getSupplierRevenue(params: MetricQueryParams = {}): Promise<SupplierRevenueResponse> {
        return this.makeRequest<SupplierRevenueResponse>(`${this.apiBase}/supplier/revenue`, params)
    }

    async getSupplierOrders(params: MetricQueryParams = {}): Promise<SupplierOrdersResponse> {
        return this.makeRequest<SupplierOrdersResponse>(`${this.apiBase}/supplier/orders`, params)
    }

    async getSupplierConnections(
        params: MetricQueryParams = {}
    ): Promise<SupplierConnectionsResponse> {
        return this.makeRequest<SupplierConnectionsResponse>(
            `${this.apiBase}/supplier/connections`,
            params
        )
    }

    async getSupplierBuyers(params: MetricQueryParams = {}): Promise<SupplierBuyersResponse> {
        return this.makeRequest<SupplierBuyersResponse>(`${this.apiBase}/supplier/buyers`, params)
    }

    async getSupplierTopProducts(params: ProductQueryParams = {}): Promise<TopProductsResponse> {
        return this.makeRequest<TopProductsResponse>(
            `${this.apiBase}/supplier/top-products`,
            params
        )
    }

    async getDashboardProductFilters(): Promise<ProductFilterOptions> {
        return this.makeRequest<ProductFilterOptions>(
            `${this.apiBase}/supplier/top-products/filters`
        )
    }

    async getSupplierBuyersTable(params: BuyersQueryParams = {}): Promise<BuyersResponse> {
        return this.makeRequest<BuyersResponse>(`${this.buyersBuyersApiBase}/buyers/all`, params)
    }

    async getSupplierBuyersFilters(): Promise<BuyersFiltersResponse> {
        return this.makeRequest<BuyersFiltersResponse>(
            `${this.buyersBuyersApiBase}/buyers/all/filters`
        )
    }

    async getBuyerSpent(params: MetricQueryParams = {}): Promise<BuyerSpentResponse> {
        return this.makeRequest<BuyerSpentResponse>(`${this.apiBase}/buyer/spent`, params)
    }

    async getBuyerOrders(params: MetricQueryParams = {}): Promise<BuyerOrdersResponse> {
        return this.makeRequest<BuyerOrdersResponse>(`${this.apiBase}/buyer/orders`, params)
    }

    async getBuyerConnections(params: MetricQueryParams = {}): Promise<BuyerConnectionsResponse> {
        return this.makeRequest<BuyerConnectionsResponse>(
            `${this.apiBase}/buyer/connections`,
            params
        )
    }

    async getBuyerSuppliers(params: MetricQueryParams = {}): Promise<BuyerSuppliersResponse> {
        return this.makeRequest<BuyerSuppliersResponse>(`${this.apiBase}/buyer/suppliers`, params)
    }

    async getBuyerTopProducts(params: ProductQueryParams = {}): Promise<TopProductsResponse> {
        return this.makeRequest<TopProductsResponse>(`${this.apiBase}/buyer/top-products`, params)
    }

    async getBuyerProductFilters(): Promise<ProductFilterOptions> {
        return this.makeRequest<ProductFilterOptions>(`${this.apiBase}/buyer/top-products/filters`)
    }

    async getMetric(
        role: UserRole,
        metricType: 'revenue' | 'spent' | 'orders' | 'connections' | 'buyers' | 'suppliers',
        params: MetricQueryParams = {}
    ): Promise<any> {
        const methodMap = {
            supplier: {
                revenue: () => this.getSupplierRevenue(params),
                orders: () => this.getSupplierOrders(params),
                connections: () => this.getSupplierConnections(params),
                buyers: () => this.getSupplierBuyers(params),
            },
            buyer: {
                spent: () => this.getBuyerSpent(params),
                orders: () => this.getBuyerOrders(params),
                connections: () => this.getBuyerConnections(params),
                suppliers: () => this.getBuyerSuppliers(params),
            },
        }

        const roleMethodMap = methodMap[role]
        if (!roleMethodMap) {
            throw new Error(`Unsupported role: ${role}`)
        }

        const method = roleMethodMap[metricType as keyof typeof roleMethodMap]
        if (!method) {
            throw new Error(`Unsupported metric type for ${role}: ${metricType}`)
        }

        return method()
    }

    async getTopProducts(
        role: UserRole,
        params: ProductQueryParams = {}
    ): Promise<TopProductsResponse> {
        if (role === 'supplier') {
            return this.getSupplierTopProducts(params)
        } else if (role === 'buyer') {
            return this.getBuyerTopProducts(params)
        } else {
            throw new Error(`Unsupported role: ${role}`)
        }
    }

    async getProductFilters(role: UserRole): Promise<ProductFilterOptions> {
        if (role === 'supplier') {
            return this.getDashboardProductFilters()
        } else if (role === 'buyer') {
            return this.getBuyerProductFilters()
        } else {
            throw new Error(`Unsupported role: ${role}`)
        }
    }

    async getBuyersTable(role: UserRole, params: BuyersQueryParams = {}): Promise<BuyersResponse> {
        if (role === 'supplier') {
            return this.getSupplierBuyersTable(params)
        }
        throw new Error(`Buyers table not available for role: ${role}`)
    }

    async getBuyersFilters(role: UserRole): Promise<BuyersFiltersResponse> {
        if (role === 'supplier') {
            return this.getSupplierBuyersFilters()
        }
        throw new Error(`Buyers filters not available for role: ${role}`)
    }

    // services/dashboardService.ts

    static periodToParams(
        period: DashboardPeriodType,
        customRange?: DashboardDateRange
    ): MetricQueryParams {
        if (period === 'custom' && customRange) {
            return {
                start_date: customRange.start_date,
                end_date: customRange.end_date,
            }
        }

        // ✅ NU MAI TREBUIE CONVERSIE - period e deja snake_case

        return {
            period: period, // Direct, fără mapping
        }
    }
    static validateDateRange(dateRange: DashboardDateRange): boolean {
        const startDate = new Date(dateRange.start_date)
        const endDate = new Date(dateRange.end_date)

        return startDate <= endDate && endDate <= new Date()
    }

    static tableFiltersToParams(filters: any): ProductQueryParams {
        const params: ProductQueryParams = {}

        if (filters.page) params.page = filters.page
        if (filters.perPage) params.per_page = filters.perPage
        if (filters.startDate && filters.endDate) {
            params.start_date = filters.startDate
            params.end_date = filters.endDate
        }
        if (filters.amountFrom !== undefined) params.amount_from = filters.amountFrom
        if (filters.amountTo !== undefined) params.amount_to = filters.amountTo
        if (filters.categoryIds?.length) params['category_ids[]'] = filters.categoryIds
        if (filters.brandName) params.brand_name = filters.brandName
        if (filters.countryIds?.length) params['country_ids[]'] = filters.countryIds

        return params
    }

    static buyersFiltersToParams(filters: any): BuyersQueryParams {
        const params: BuyersQueryParams = {}

        if (filters.page) params.page = filters.page
        if (filters.perPage) params.per_page = filters.perPage
        if (filters.search) params.search = filters.search
        if (filters.startDate && filters.endDate) {
            params.start_date = filters.startDate
            params.end_date = filters.endDate
        }
        if (filters.businessTypeIds?.length) params['business_type_ids[]'] = filters.businessTypeIds
        if (filters.countryIds?.length) params['country_ids[]'] = filters.countryIds
        if (filters.minTotalAmount !== undefined) params.min_total_amount = filters.minTotalAmount
        if (filters.maxTotalAmount !== undefined) params.max_total_amount = filters.maxTotalAmount
        if (filters.sortBy) params.sort_by = filters.sortBy
        if (filters.sortDirection) params.sort_direction = filters.sortDirection

        return params
    }
}
