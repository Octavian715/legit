// ~/types/dashboard.ts

export type UserRole = 'supplier' | 'buyer'

export type DashboardPeriodType = 'today' | 'last_month' | 'last_year' | 'custom'

export interface DashboardDateRange {
    start_date: string
    end_date: string
}

export interface Currency {
    id: number
    code: string
    symbol: string
}

export interface ChartDataPoint {
    period: string
    value: number
}

export interface MetricResponse {
    total: number
    chart_data: ChartDataPoint[]
    period: string
}

export interface Weight {
    net: number
    symbol: string
}

export interface TopProduct {
    id: number
    brand_name: string
    original_name: string
    article_number: string
    weight: Weight
    category: string
    total_units: number
    total_amount: number
}

export interface TopProductsResponse {
    data: TopProduct[]
    meta: {
        current_page: number
        per_page: number
        total: number
        last_page: number
        from: number
        to: number
        currency: Currency
        type: string
        filters_applied: {
            date_range: string | { start_date: string; end_date: string }
            amount_range: { from: number | null; to: number | null }
            category_ids: number[] | null
            brand_name: string | null
            country_ids: number[] | null
        }
    }
}

export interface BuyerData {
    company_id: number
    company_name: string
    country: string
    business_type: string
    nr_of_skus: number
    nr_of_orders: number
    total_amount: string
    total_amount_raw: number
}

export interface BuyersResponse {
    data: BuyerData[]
    meta: {
        current_page: number
        per_page: number
        total: number
        last_page: number
        from: number
        to: number
        filters_applied: {
            sort_by: string
            sort_direction: string
            business_type_ids: number[]
            country_ids: number[]
        }
    }
}

export interface BuyersFiltersResponse {
    business_types: Array<{ id: number; name: string }>
    countries: Array<{ id: number; name: string; code: string }>
}

export interface ProductFilterOptions {
    categories: Array<{ id: number; name: string }>
    brand_names: string[]
    countries: Array<{ id: number; name: string; code: string }>
    amount_range: { min: number; max: number }
    currency: Currency
}

export interface DashboardData {
    primaryMetric: MetricResponse | null
    orders: MetricResponse | null
    connections: MetricResponse | null
    partners: MetricResponse | null
    products: TopProductsResponse | null
    productFilters: ProductFilterOptions | null
    buyers: BuyersResponse | null
    buyersFilters: BuyersFiltersResponse | null
    suppliers: BuyersResponse | null
}

export interface MetricQueryParams {
    period?: DashboardPeriodType
    start_date?: string
    end_date?: string
}

export interface ProductQueryParams {
    page?: number
    per_page?: number
    start_date?: string
    end_date?: string
    amount_from?: number
    amount_to?: number
    'category_ids[]'?: number[]
    brand_name?: string
    'country_ids[]'?: number[]
}

export interface BuyersQueryParams {
    page?: number
    per_page?: number
    search?: string
    start_date?: string
    end_date?: string
    'business_type_ids[]'?: number[]
    'country_ids[]'?: number[]
    min_total_amount?: number
    max_total_amount?: number
    sort_by?: string
    sort_direction?: 'asc' | 'desc'
}

export interface ChartPeriodState {
    primaryMetric: DashboardPeriodType
    orders: DashboardPeriodType
    connections: DashboardPeriodType
    partners: DashboardPeriodType
}

export interface ChartDateRangeState {
    primaryMetric?: DashboardDateRange
    orders?: DashboardDateRange
    connections?: DashboardDateRange
    partners?: DashboardDateRange
}

export interface TableFilters {
    startDate?: string
    endDate?: string
    amountFrom?: number
    amountTo?: number
    categoryIds?: number[]
    brandName?: string
    countryIds?: number[]
    businessTypeIds?: number[]
    search?: string
    sortBy?: string
    sortDirection?: 'asc' | 'desc'
}

export interface DashboardFilters {
    period?: DashboardPeriodType
    dateRange?: DashboardDateRange
}

export interface RefreshOptions {
    force?: boolean
    metrics?: Array<keyof ChartPeriodState>
    products?: boolean
    buyers?: boolean
    filters?: boolean
}

export interface DashboardError {
    code: string
    message: string
    details?: any
    timestamp: Date
    retryable: boolean
}

export interface RoleConfig {
    labels: {
        primaryMetric: string
        partners: string
        products: string
        partnersTable: string
    }
    endpoints: {
        primaryMetric: string
        orders: string
        connections: string
        partners: string
        products: string
        productFilters: string
    }
}

export type SupplierRevenueResponse = MetricResponse
export type SupplierOrdersResponse = MetricResponse
export type SupplierConnectionsResponse = MetricResponse
export type SupplierBuyersResponse = MetricResponse

export type BuyerSpentResponse = MetricResponse
export type BuyerOrdersResponse = MetricResponse
export type BuyerConnectionsResponse = MetricResponse
export type BuyerSuppliersResponse = MetricResponse
