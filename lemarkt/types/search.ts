// Base types
export interface PaginationMeta {
    current_page: number
    per_page: number
    total: number
    last_page: number
    from: number
    to: number
    grouped_by?: 'company' | null
    filters_applied?: Record<string, any>
    sort_options?: {
        sort_by: string
        sort_direction: string
    }
    applied_filters?: {
        query?: string
        business_type?: {
            id: number
            name: string
            code: string
        }
        country?: {
            id: number
            name: string
            code: string
        }
        sorting?: {
            sort_by: string
            sort_direction: string
        }
    }
}

// Reusable filter option
export interface FilterOption {
    id: number
    name: string
    code?: string
    depth?: number
    value?: string
    symbol?: string
}

// Product search filters (EXACT from API docs)
export interface SearchProductFilters {
    search?: string
    page?: number
    per_page?: number
    sort_by?:
        | 'name'
        | 'price'
        | 'created_at'
        | 'weight'
        | 'brand'
        | 'shelf_life'
        | 'discount'
        | 'most_ordered'
    sort_direction?: 'asc' | 'desc'
    categories?: number[] | string
    subcategories?: number[] | string
    price_min?: number
    price_max?: number
    supplier_countries?: number[] | string
    availability_countries?: number[] | string
    features?: number[] | string
    additional_features?: number[] | string
    brands?: string[] | string
    conditions?: number[] | string
    weight_min?: number
    weight_max?: number
    weight_type?: number
    status?: number[] | string
    has_discount?: boolean
    only_favorites?: boolean
    my_products?: boolean
    group_by_company?: boolean
}

// Company search filters
export interface SearchCompanyFilters {
    query: string
    page?: number
    per_page?: number
    business_type_id?: number
    country_id?: number
    sort_by?: 'name' | 'followers_count'
    sort_direction?: 'asc' | 'desc'
}

// Product price object
export interface ProductPrice {
    amount: number
    currency: {
        id: number
        code: string
        symbol: string
    }
}

// Volume price
export interface VolumePrice {
    quantity_from: number
    price: ProductPrice
}

// Product entity (EXACT from API docs + products.ts)
export interface SearchProduct {
    id: number
    article_number: string
    ean_product?: string
    ean_box?: string
    name_original: string
    name: string
    brand?: string | null
    price?: ProductPrice | null
    volume_prices?: VolumePrice[]
    vat?: number | null
    price_visibility: boolean
    is_favorite: boolean
    weight: {
        value: number
        symbol: string
        name: string
    }
    category: {
        id: number
        slug: string
        name: string
    }
    country_origin: {
        id: number
        code: string
        name: string
    }
    user: {
        id: number
        company_details: {
            username: string
            legal_name: string
        }
    }
    prices: Array<{
        currency_id: number
        price_type: 'local' | 'export'
        price: string
    }>
    discounts: any[]
    logistic: {
        pieces_per_box: number
    }
    features: any[]
    additional_features: Array<{
        id: number
        code: string
        name: string
    }>
    allergens: Array<{
        id: number
        code: string
        name: string
    }>
    business_types: Array<{
        id: number
        code: string
        name: string
    }>
    shelf_life_days: number
    storage_condition: {
        id: number
        code: string
        name: string
    }
    availability_countries: Array<{
        id: number
        code: string
        name: string
    }>
    private_label_available: boolean
    min_order_qty: string
    min_order_type: string
    images: {
        primary: {
            id: number | null
            url: string | null
        }
        gallery: any[]
    }
    status: {
        id: number
        code: string
        name: string
    }
    completion: {
        is_complete: boolean
        current_step: number
    }
    keywords: Array<{
        id: number
        code: string
        name: string
    }>
    created_at: string
    updated_at: string
}

// Company entity (EXACT from API docs)
export interface SearchCompany {
    id: number
    legal_name: string
    username: string
    is_following: boolean
    followers_count: number | null
    connection:
        | false
        | {
              id: number
              status: 'pending' | 'accepted'
              requester_id: number
              requested_at: string
              accepted_at: string | null
              rejected_at: string | null
              is_requester: boolean
          }
    profile_picture?: {
        id: number
        url: string
        file_name: string
    } | null
}

// Company with products (group_by_company=true)
export interface GroupedCompanyProducts {
    company: {
        id: number
        username: string
        legal_name: string
        country?: {
            id: number
            name: string
            code: string
        } | null
        social: {
            is_following: boolean
            followers_count: number
            connection: {
                id?: number | null
                exists: boolean
                status?: 'pending' | null
            }
        }
        contacts?: Array<{
            name: string
            email: string
            phones: Array<{
                phone_number: string
                verified: boolean
            }>
        }> | null
        profile_media?: Array<{
            id: number
            type: string
            url: string
        }> | null
    }
    products: SearchProduct[]
}

// Search responses
export interface ProductSearchResponse {
    data: SearchProduct[]
    meta: PaginationMeta
}

export interface GroupedProductSearchResponse {
    data: GroupedCompanyProducts[]
    meta: PaginationMeta
}

export interface CompanySearchResponse {
    data: SearchCompany[]
    meta: PaginationMeta
}

// Filter options responses (EXACT from API docs)
export interface ProductFilterOptionsResponse {
    categories: FilterOption[]
    subcategories: FilterOption[]
    brands: Array<{
        name: string
        value: string
    }>
    features: FilterOption[]
    additional_features: FilterOption[]
    storage_conditions: FilterOption[]
    weight_types: FilterOption[]
    countries: FilterOption[]
    price_range: {
        min: number
        max: number
    }
}

export interface CompanyFilterOptionsResponse {
    business_types: FilterOption[]
    countries: FilterOption[]
}

// Summary response
export interface ProductSummaryResponse {
    total_products: number
    total_suppliers: number
    price_range: {
        min: number
        max: number
    }
    average_price: number
    filters_count: number
}

// Favorite toggle response
export interface ToggleFavoriteResponse {
    success: boolean
    message?: string
}

// Store state types
export interface SearchState {
    products: {
        results: SearchProduct[]
        groupedResults: GroupedCompanyProducts[]
        meta: PaginationMeta | null
        filters: SearchProductFilters
        isLoading: boolean
        error: string | null
    }
    companies: {
        results: SearchCompany[]
        suggestions: SearchCompany[]
        meta: PaginationMeta | null
        filters: SearchCompanyFilters
        isLoading: boolean
        error: string | null
    }
    favorites: {
        isLoading: boolean
        error: string | null
    }
}

export type SearchType = 'products' | 'companies' | 'all'
export type SearchMode = 'search' | 'suggestions'
