import type { Country, BusinessType } from './auth'

export interface BuyerDashboardUser {
    company_id: number
    company_name: string
    country: string
    business_type: string
    nr_of_skus: number
    nr_of_orders: number
    total_amount: string
    total_amount_raw: number
}
export type allBuyersTableUser = BuyerDashboardUser

export interface SupplierDashboardUser {
    company_id: number
    company_name: string
    country: string
    business_type: string
    nr_of_skus: number
    nr_of_orders: number
    total_amount: string
    total_amount_raw: number
}

export interface DashboardMeta {
    current_page: number
    per_page: number
    total: number
    last_page: number
    from: number
    to: number
    filters_applied?: {
        sort_by?: string
        sort_direction?: string
        business_type_ids?: number[]
        country_ids?: number[]
        search?: string
        min_total_amount?: number
        max_total_amount?: number
        period?: string
        start_date?: string
        end_date?: string
    }
}

export interface DashboardListResponse<T> {
    data: T[]
    meta: DashboardMeta
}

export interface DashboardFilterOptions {
    business_types: BusinessType[]
    countries: Country[]
}

export type DashboardSortField =
    | 'company_id'
    | 'company_name'
    | 'country'
    | 'business_type'
    | 'nr_of_skus'
    | 'nr_of_orders'
    | 'total_amount'

export type DashboardSortDirection = 'asc' | 'desc'
export type DashboardPeriod = 'today' | 'last_month' | 'last_year'

export interface DashboardFilters {
    search?: string
    period?: DashboardPeriod
    start_date?: string
    end_date?: string
    business_type_ids?: number[]
    country_ids?: number[]
    min_total_amount?: number
    max_total_amount?: number
    page?: number
    per_page?: number
    sort_by?: DashboardSortField
    sort_direction?: DashboardSortDirection
}

export interface DashboardChartData {
    total_buyers?: number
    total_suppliers?: number
    total_orders: number
    total_amount: number
    period: string
    date_range: {
        start_date: string
        end_date: string
    }
    chart_data: ChartDataPoint[]
    business_type_breakdown?: BusinessTypeBreakdown[]
    country_breakdown?: CountryBreakdown[]
}

export interface ChartDataPoint {
    date: string
    count: number
}

export interface BusinessTypeBreakdown {
    business_type_id: number
    business_type_name: string
    buyer_count?: number
    supplier_count?: number
    total: number
}

export interface CountryBreakdown {
    country_id?: number
    country: string
    country_code: string
    country_name?: string
    number_of_buyers?: number
    number_of_suppliers?: number
    buyer_count?: number
    supplier_count?: number
    nr_of_skus: number
    nr_of_orders: number
    total_amount: string
    total_amount_raw: number
    total: number
}

// New types for chart endpoints
export interface SupplierChartData extends DashboardChartData {
    total_suppliers: number
    business_type_breakdown?: Array<BusinessTypeBreakdown & { supplier_count: number }>
    country_breakdown?: Array<CountryBreakdown & { supplier_count: number }>
}

export interface BuyerChartData extends DashboardChartData {
    total_buyers: number
    business_type_breakdown?: Array<BusinessTypeBreakdown & { buyer_count: number }>
    country_breakdown?: Array<CountryBreakdown & { buyer_count: number }>
}

// Chart filter parameters
export interface DashboardChartFilters {
    period?: DashboardPeriod
    start_date?: string
    end_date?: string
}

export interface ApiError {
    message: string
    errors?: Record<string, string[]>
    statusCode?: number
}
