import type { Country, BusinessType } from './auth'

// Base interfaces
export interface DateRange {
    start_date: string
    end_date: string
}

export interface ChartDataPoint {
    date: string
    count: number
}

export interface AmountChartDataPoint {
    date: string
    amount: number
}

export interface AverageChartDataPoint {
    date: string
    average_value: number
}

// Category interfaces
export interface CategoryBreakdown {
    category_id: number
    category_name: string
    total: number
}

export interface CategoryTableItem {
    category_id: number
    category_name: string
    nr_of_skus: number
    nr_of_orders: number
    avg_order_value: number
    total_spent: number
}

// Supplier interfaces
export interface SupplierBreakdown {
    supplier_id: number
    supplier_name: string
    total: number
}

export interface SupplierTableItem {
    supplier_id: number
    supplier_name: string
    business_type: string | null
    country_code: string | null
    country_name: string | null
    nr_of_skus: number
    nr_of_orders: number
    avg_order_value: number
    total_spent: number
}

// Country interfaces
export interface CountryBreakdown {
    country_id: number
    country_name: string
    country_code: string
    total_orders: number
    revenue: number
    average_cart: number
}

export interface CountryTableItem {
    country_id: number
    country_name: string
    country_code: string
    total_orders: number
    revenue: number
    average_cart: number
    total_buyers: number
}

// Statistics interfaces
export interface OrderStats {
    status_key: string
    status_name: string
    count: number
    status_id: number | null
}

// Chart response interfaces
export interface BuyerOrdersChart {
    total: number
    period: string | null
    date_range: DateRange
    chart_data: ChartDataPoint[]
}

export interface SupplierOrdersChart {
    total: number
    period: string | null
    date_range: DateRange
    chart_data: ChartDataPoint[]
}

export interface BuyerSpentCategoryChart {
    total: number
    period: string | null
    date_range: DateRange
    chart_data: AmountChartDataPoint[]
    category_breakdown: CategoryBreakdown[]
}

export interface BuyerSpentSupplierChart {
    total: number
    period: string | null
    date_range: DateRange
    chart_data: AmountChartDataPoint[]
    supplier_breakdown: SupplierBreakdown[]
}

export interface SupplierOrdersByCountryChart {
    total: number
    period: string | null
    date_range: DateRange
    chart_data: ChartDataPoint[]
    country_breakdown: CountryBreakdown[]
}

export interface SupplierAverageCartChart {
    total_orders: number
    average_cart: number
    period: string | null
    date_range: DateRange
    chart_data: AverageChartDataPoint[]
}

// Table response interfaces
export interface OrdersDashboardMeta {
    current_page: number
    per_page: number
    total: number
    last_page: number
    from: number
    to: number
    filters_applied: Record<string, any>
}

export interface TableResponse<T> {
    data: T[]
    meta: OrdersDashboardMeta
}

// Filter interfaces
export interface CategoryFilterOptions {
    categories: Array<{
        id: number
        name: string
    }>
}

export interface SupplierFilterOptions {
    business_types: BusinessType[]
    countries: Country[]
}

export interface CountryFilterOptions {
    countries: Array<{
        id: number
        name: string
        code: string
    }>
}

// Filter parameters
export type OrdersPeriod = 'today' | 'last_month' | 'last_year'

export interface OrdersChartFilters {
    period?: OrdersPeriod
    start_date?: string
    end_date?: string
}

export interface OrdersTableFilters extends OrdersChartFilters {
    page?: number
    per_page?: number
    search?: string
    category_ids?: number[]
    business_type_ids?: number[]
    country_ids?: number[]
    min_total_spent?: number
    max_total_spent?: number
    sort_by?: string
    sort_direction?: 'asc' | 'desc'
}

// Sort field types
export type CategoryTableSortField =
    | 'category_name'
    | 'nr_of_skus'
    | 'nr_of_orders'
    | 'avg_order_value'
    | 'total_spent'

export type SupplierTableSortField =
    | 'supplier_id'
    | 'supplier_name'
    | 'business_type'
    | 'country'
    | 'nr_of_skus'
    | 'nr_of_orders'
    | 'avg_order_value'
    | 'total_spent'

export type CountryTableSortField =
    | 'country_name'
    | 'total_orders'
    | 'revenue'
    | 'average_cart'
    | 'total_buyers'

// API Error interface
export interface OrdersApiError {
    message: string
    errors?: Record<string, string[]>
    statusCode?: number
}
