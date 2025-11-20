export interface ProductListing {
    id: number
    article_number: string
    ean_product?: string
    ean_box?: string
    name: string
    brand: string
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
    name_original: string
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

export interface ProductListingMeta {
    current_page: number
    per_page: number
    total: number
    last_page: number
    from: number
    to: number
    filters_applied: any[]
    sort_options: {
        sort_by: string
        sort_direction: string
    }
}

export interface ProductSummary {
    total_products: number
    average_price: number
    price_range: {
        min: number
        max: number
    }
    categories_count: number
    suppliers_count: number
}

export interface ProductFilters {
    search?: string
    page?: number
    per_page?: number
    sort_by?:
        | 'name'
        | 'price'
        | 'rating'
        | 'created_at'
        | 'updated_at'
        | 'weight'
        | 'brand'
        | 'shelf_life'
    sort_direction?: 'asc' | 'desc'
    categories?: number[] | string
    subcategories?: number[] | string
    price_min?: number
    price_max?: number
    rating?: number
    supplier_countries?: number[] | string
    origin_countries?: number[] | string
    availability_countries?: number[] | string
    features?: number[] | string
    additional_features?: number[] | string
    brands?: string[] | string
    conditions?: number[] | string
    weight_min?: number
    weight_max?: number
    shelf_life_min?: number
    status?: number[] | string
    allergens?: number[] | string
    business_types?: number[] | string
    has_discount?: boolean
    private_label_available?: boolean
    my_products?: boolean
    in_stock?: boolean
}

export interface FilterOptions {
    categories: FilterOption[]
    subcategories: FilterOption[]
    countries: FilterOption[]
    features: FilterOption[]
    additional_features: FilterOption[]
    brands: string[]
    conditions: FilterOption[]
    storage_conditions: FilterOption[]
    allergens: FilterOption[]
    business_types: FilterOption[]
    statuses: FilterOption[]
}

export interface FilterOption {
    id: number
    name: string
    code?: string
    count?: number
}

export interface ProductsResponse {
    data: ProductListing[]
    meta: ProductListingMeta
}

export interface FilterOptionsResponse {
    data: FilterOptions
    meta: {
        category_filter?: number
        subcategories_count: number
        total_categories: number
    }
}

export interface ProductsState {
    products: ProductListing[]
    meta: ProductListingMeta | null
    filters: ProductFilters
    filterOptions: FilterOptions | null
    summary: ProductSummary | null
    isLoading: boolean
    error: string | null
}

// types/products.ts - Updated to match real API response

export interface ProductDetails {
    id: number
    user_id: number
    status_id: number
    private_label_available: boolean
    brand_name: string
    article_number: string
    name_original: string
    weight_net: number
    weight_net_type_id: number
    ean_product?: string
    ean_box?: string
    local_vat: string
    export_vat: string
    category_id: number
    country_origin_id: number
    destination_type: string
    min_order_qty: string
    min_order_qty_type: string
    shelf_life_days: number
    storage_condition_id: number
    temperature_min: string
    temperature_max: string
    label_translations_on_request: boolean
    current_step: number
    is_complete: boolean
    created_at: string
    updated_at: string
    names: ProductName[]
    category: ProductCategory
    country_origin: CountryOrigin
    descriptions: ProductDescription[]
    allergens: ProductAllergen[]
    types: ProductType[]
    business_types: ProductBusinessType[]
    ingredients: ProductIngredient[]
    storage_condition: StorageCondition
    keywords: ProductKeyword[]
    prices: ProductPrice[]
    logistic: ProductLogistic
    packagings: ProductPackaging[]
    availability_countries: AvailabilityCountry[]
    incoterms: ProductIncoterm[]
    features: ProductFeature[]
    discounts: ProductDiscount[]
    additional_features: ProductAdditionalFeature[]
    images: ProductImage[]
    primary_image: ProductImage
}

export interface ProductName {
    id: number
    product_id: number
    language_id: number
    name: string
}

export interface ProductCategory {
    id: number
    slug: string
    icon_path: string
    lft: number
    rgt: number
    depth: number
    created_at: string
    updated_at: string
    name?: string
}

export interface CountryOrigin {
    id: number
    continent_id: number
    code: string
    native_name: string
    phone_code: string
    default_currency_id: number
}

export interface ProductDescription {
    id: number
    product_id: number
    language_id: number
    content: string
}

export interface ProductAllergen {
    id: number
    code: string
    name?: string
    pivot: {
        product_id: number
        allergen_id: number
    }
}

export interface ProductType {
    id: number
    code: string
    name?: string
    pivot: {
        product_id: number
        type_id: number
    }
}

export interface ProductBusinessType {
    id: number
    code: string
    name?: string
    pivot: {
        product_id: number
        business_type_id: number
    }
}

export interface ProductIngredient {
    id: number
    product_id: number
    language_id: number
    content: string
}

export interface StorageCondition {
    id: number
    code: string
    name?: string
}

export interface ProductKeyword {
    id: number
    code: string
    name?: string
    pivot: {
        product_id: number
        keyword_id: number
    }
}

export interface ProductPrice {
    id: number
    product_id: number
    currency_id: number
    price: string
    price_type: 'local' | 'export'
    created_at: string
    updated_at: string
    currency: {
        id: number
        code: string
        symbol: string
    }
}

export interface ProductLogistic {
    id: number
    product_id: number
    pieces_per_box: number
    boxes_per_palette: number
    boxes_per_row: number
    rows_per_palette: number
    product_length_cm: string
    product_width_cm: string
    product_height_cm: string
    product_gross_weight_g: string
    carton_length_cm: string
    carton_width_cm: string
    carton_height_cm: string
    carton_gross_weight_g: string
    palette_length_cm: string
    palette_width_cm: string
    palette_height_cm: string
    palette_gross_weight_g: string
    show_product_gross_weight: boolean
    customs_tariff_number: string
}

export interface ProductPackaging {
    id: number
    product_id: number
    type: 'primary' | 'secondary' | 'tertiary'
    material_id: number
    weight: string
    quantity_type_id: number
    is_recyclable: boolean
    material: {
        id: number
        code: string
        name?: string
    }
    quantity_type: {
        id: number
        symbol: string
    }
}

export interface AvailabilityCountry {
    id: number
    continent_id: number
    code: string
    native_name: string
    phone_code: string
    default_currency_id: number
    pivot: {
        product_id: number
        country_id: number
    }
}

export interface ProductIncoterm {
    id: number
    code: string
    name?: string
    pivot: {
        product_id: number
        incoterm_id: number
    }
}

export interface ProductFeature {
    id: number
    code: string
    name?: string
    color: string
    is_automatic: boolean
    automatic_duration_days: number
    pivot: {
        product_id: number
        feature_id: number
        is_automatic: boolean
        assigned_at: string
        expires_at: string | null
        created_at: string
        updated_at: string
    }
}

export interface ProductDiscount {
    id: number
    product_id: number
    price_type: 'local' | 'export'
    percentage: string
    start_date: string
    end_date: string | null
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface ProductAdditionalFeature {
    id: number
    code: string
    name?: string
    pivot: {
        product_id: number
        additional_feature_id: number
    }
}

export interface ProductImage {
    id: number
    product_id: number
    file_path: string
    file_name: string
    file_size: number
    is_primary: boolean
    sort_order: number
    created_at: string
    updated_at: string
    url?: string
}

// Existing types from marketplace
export interface ProductListing {
    id: number
    article_number: string
    ean_product?: string
    ean_box?: string
    name: string
    brand: string
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
