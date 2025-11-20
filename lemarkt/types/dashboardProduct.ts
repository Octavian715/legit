import type { Currency } from './auth'

// Common interfaces
export interface Category {
    id: number
    name: string
    unique_products_count?: number
    products_count?: number
}

export interface Brand {
    name: string
    products_count?: number
}

export interface ProductStatus {
    id: number
    name: string
    products_count?: number
}

export interface AmountRange {
    min: number
    max: number
    currency?: string
}

export interface Weight {
    value: number
    unit: string
}

export interface Feature {
    id: number
    name: string
    products_count?: number
}

export interface BusinessType {
    id: number
    name: string
}

export interface Country {
    id: number
    name: string
    code: string
}

// Product interfaces
export interface ProductWithFeatures {
    product_id: number
    brand_name: string
    product_original_name: string
    article_number: string
    weight: Weight | null
    category: Category | null
    status: string
    local_price: number
    export_price: number
    local_vat: number
    export_vat: number
    sold_units: number
    created_at: string
    updated_at: string
    features?: Feature[]
    has_features?: boolean
}

export interface ProductWithPrices {
    product_id: number
    brand_name: string
    product_original_name: string
    article_number: string
    weight: Weight | null
    category: Category | null
    local_price: number
    export_price: number
    local_discount_price?: number
    export_discount_price?: number
    local_vat: number
    export_vat: number
    created_at: string
    updated_at: string
}

export interface SupplierBuyerTableItem {
    company_id: number
    company_name: string
    business_type?: BusinessType
    country?: Country
    total_amount: number
    products_count?: number
    orders_count?: number
    created_at: string
}

// Response interfaces
export interface ProductFeaturesListResponse {
    data: ProductWithFeatures[]
    meta: {
        current_page: number
        per_page: number
        total: number
        last_page: number
        from: number
        to: number
        currency?: Currency
        filters_applied?: {
            search?: string | null
            brand_names?: string[] | null
            category_ids?: number[] | null
            feature_ids?: number[] | null
            has_features?: boolean | null
            sort?: {
                sort_by: string
                sort_direction: string
            }
        }
    }
}

export interface ProductPricesListResponse {
    data: ProductWithPrices[]
    meta: {
        current_page: number
        per_page: number
        total: number
        last_page: number
        from: number
        to: number
        currency?: Currency
        filters_applied?: {
            search?: string | null
            brand_names?: string[] | null
            sort?: {
                sort_by: string
                sort_direction: string
            }
        }
    }
}

export interface ProductOverviewResponse {
    total_products: number
    currency?: Currency
    period?: {
        start_date: string
        end_date: string
    }
}

export interface ProductStatsResponse {
    active_products: number
    inactive_products: number
    draft_products: number
    total_products: number
    featured_products?: number
    products_with_discount?: number
}

export interface NewProductsResponse {
    new_products_count: number
    growth_percentage?: number
    period?: {
        start_date: string
        end_date: string
    }
}

export interface SupplierBuyerStatsResponse {
    data: Array<{
        label: string
        value: number
        percentage?: number
        color?: string
    }>
    total: number
    period?: {
        start_date: string
        end_date: string
    }
}

export interface SupplierBuyerTableResponse {
    data: SupplierBuyerTableItem[]
    meta: {
        current_page: number
        per_page: number
        total: number
        last_page: number
        from: number
        to: number
        currency?: Currency
        filters_applied?: {
            search?: string | null
            business_type_ids?: number[] | null
            country_ids?: number[] | null
            min_total_amount?: number | null
            max_total_amount?: number | null
            period?: string | null
            sort?: {
                sort_by: string
                sort_direction: string
            }
        }
    }
}

// Filter option interfaces
export interface FeatureFilterOptions {
    categories: Category[]
    brands: Brand[]
    features: Feature[]
    currency?: Currency
}

export interface PriceFilterOptions {
    brands: Brand[]
    price_ranges: {
        local_price: { min: number; max: number }
        export_price: { min: number; max: number }
        local_discount_price: { min: number; max: number }
        export_discount_price: { min: number; max: number }
    }
    currency?: Currency
}

export interface SupplierFilterOptions {
    categories: Category[]
    brands: Brand[]
    statuses: ProductStatus[]
    amount_range: AmountRange
    currency?: Currency
    brand_names: string[]
}

export interface BuyerFilterOptions {
    categories: Category[]
    brands: Brand[]
    statuses: ProductStatus[]
    amount_range: AmountRange
    currency?: Currency
}

export interface SupplierBuyerFilters {
    business_types: BusinessType[]
    countries: Country[]
    amount_range?: {
        min: number
        max: number
    }
}

// Filter interfaces for API calls
export interface ProductFeaturesFilters {
    search?: string
    brand_names?: string[]
    category_ids?: number[]
    feature_ids?: number[]
    has_features?: boolean
    status_ids?: number[]
    min_amount?: number
    max_amount?: number
    start_date?: string
    end_date?: string
    page?: number
    per_page?: number
    sort_by?: ProductFeaturesSort
    sort_direction?: SortDirection
}

export interface ProductPricesFilters {
    search?: string
    brand_names?: string[]
    local_price_from?: number
    local_price_to?: number
    export_price_from?: number
    export_price_to?: number
    local_discount_price_from?: number
    local_discount_price_to?: number
    export_discount_price_from?: number
    export_discount_price_to?: number
    page?: number
    per_page?: number
    sort_by?: ProductPricesSort
    sort_direction?: SortDirection
}

export interface ProductOverviewFilters {
    start_date?: string
    end_date?: string
}

export interface NewProductsFilters {
    period?: StatsPeriod
    start_date?: string
    end_date?: string
}

export interface SupplierBuyerStatsFilters {
    period?: StatsPeriod
    start_date?: string
    end_date?: string
}

export interface SupplierBuyerTableFilters {
    search?: string
    business_type_ids?: number[]
    country_ids?: number[]
    min_total_amount?: number
    max_total_amount?: number
    period?: StatsPeriod
    start_date?: string
    end_date?: string
    page?: number
    per_page?: number
    sort_by?: SupplierBuyerSort | SupplierBuyerCountrySort
    sort_direction?: SortDirection
}

// Sort types
export type ProductFeaturesSort =
    | 'name_original'
    | 'brand_name'
    | 'article_number'
    | 'category'
    | 'weight'
    | 'sold_units'
    | 'local_price'
    | 'export_price'
    | 'local_vat'
    | 'export_vat'

export type ProductPricesSort =
    | 'brand_name'
    | 'name_original'
    | 'article_number'
    | 'weight'
    | 'category'
    | 'local_vat'
    | 'export_vat'
    | 'local_price'
    | 'export_price'
    | 'local_discount_price'
    | 'export_discount_price'

export type SupplierBuyerSort =
    | 'company_name'
    | 'business_type'
    | 'total_amount'
    | 'products_count'
    | 'orders_count'
    | 'created_at'

export type SupplierBuyerCountrySort =
    | 'company_name'
    | 'country'
    | 'total_amount'
    | 'products_count'
    | 'orders_count'
    | 'created_at'

export type SortDirection = 'asc' | 'desc'

export type StatsPeriod = 'last_7_days' | 'last_30_days' | 'last_90_days' | 'last_year' | 'custom'

// Add new interfaces for All Products endpoints
export interface AllProductsItem {
    product_id: number
    product_original_name: string
    brand_name: string
    article_number: string
    weight: Weight | null
    vat_local: number
    vat_export: number
    total_amount: number
    sold_units?: number // Supplier only
    bought_units?: number // Buyer only
    status: ProductStatus | null
}

export interface AllProductsResponse {
    data: AllProductsItem[]
    meta: {
        current_page: number
        per_page: number
        total: number
        last_page: number
        from: number
        to: number
        currency?: Currency
        type: 'supplier' | 'buyer'
        filters_applied?: {
            search?: string | null
            date_range?:
                | 'all_time'
                | {
                      start_date: string
                      end_date: string
                  }
            amount_range?: {
                from?: number | null
                to?: number | null
            } | null
            category_ids?: number[] | null
            brand_names?: string[] | null
            status_ids?: number[] | null
            sort?: {
                sort_by: string
                sort_direction: string
            }
        }
    }
}

export interface AllProductsFilters {
    search?: string
    start_date?: string
    end_date?: string
    amount_from?: number
    amount_to?: number
    category_ids?: number[]
    brand_names?: string[]
    status_ids?: number[]
    page?: number
    per_page?: number
    sort_by?: AllProductsSort
    sort_direction?: SortDirection
}

export type AllProductsSort =
    | 'id'
    | 'name'
    | 'brand_name'
    | 'created_at'
    | 'amount'
    | 'weight'
    | 'article_number'
    | 'units'
    | 'local_vat'
    | 'export_vat'
// Error interface
export interface ApiError {
    message: string
    errors?: Record<string, string[]>
    statusCode?: number
    code?: string
}

// Legacy interfaces for backward compatibility (remove these when all components are updated)
export interface DashboardProduct extends ProductWithFeatures {}

export interface DashboardProductsListResponse extends ProductFeaturesListResponse {}

export interface DashboardProductFilters extends SupplierFilterOptions {}

export type DashboardProductSort = ProductFeaturesSort

export interface DashboardProductsFilters extends ProductFeaturesFilters {}
