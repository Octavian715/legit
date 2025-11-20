// types/product.ts

export interface ProductName {
    language_id: number
    name: string
}

export interface ProductStep1Payload {
    private_label_available: boolean
    brand_name?: string
    name_original: string
    names: ProductName[]
    weight_net: number
    weight_net_type_id: number
    ean_product?: string
    ean_box?: string
    local_vat: number
    export_vat: number
    category_id: number
    country_origin_id: number
    destination_type: 'both' | 'horeca' | 'retail'
    min_order_qty: number
    min_order_qty_type: number
}

export interface ProductPrice {
    currency_id: number
    price: number
    price_type: 'local' | 'export'
}

export interface ProductDiscount {
    price_type: 'local' | 'export'
    percentage: number
    start_date: string
    end_date: string
}
export interface ProductDirectEditPayload {
    prices?: ProductPrice[]
    volume_prices?: ProductVolumePrice[]
    feature_ids?: number[]
    discounts?: ProductDiscount[]
    additional_feature_ids?: number[]
    status_id?: number
}

export interface Product {
    id: number
    brand_name?: string
    name_original: string
    article_number?: string
    prices?: ProductPrice[]
    features?: Array<{ id: number; name: string }>
    discounts?: ProductDiscount[]
    additional_features?: Array<{ id: number; name: string }>
    status?: { id: number; name: string }
    [key: string]: any
}

export interface ProductStatusResponse {
    message: string
    product: Product
    current_step: number
    next_step: number | null
    is_complete: boolean
    total_steps: number
}

export interface ProductDirectEditResponse extends Product {
    id: number
    brand_name?: string
    name_original: string
    article_number?: string
    prices: ProductPrice[]
    volume_prices?: ProductVolumePrice[]
    features: Array<{ id: number; name: string }>
    discounts: ProductDiscount[]
    additional_features: Array<{ id: number; name: string }>
    status: { id: number; name: string }
}

export interface ProductStaticDataItem {
    id: number
    code: string
    name: string
    symbol?: string
}

export interface categories {
    id: number
    name: string
}

export interface ProductStaticData {
    additional_features?: ProductStaticDataItem[]
    allergens?: ProductStaticDataItem[]
    incoterms?: ProductStaticDataItem[]
    keywords?: ProductStaticDataItem[]
    materials?: ProductStaticDataItem[]
    quantity_types?: ProductStaticDataItem[]
    storage_conditions?: ProductStaticDataItem[]
    types?: ProductStaticDataItem[]
    statuses?: ProductStaticDataItem[]
    categories: categories[]
}

export interface ProductSelectOption {
    code: string
    label: string
    value: number
    [key: string]: any
}
export interface ProductPricingFormData {
    prices: Array<{
        currencyId: number
        price: number
        priceType: 'local' | 'export'
    }>
    volumePrices?: Array<{
        currencyId: number
        quantityFrom: number
        price: number
        priceType: 'local' | 'export'
        id?: string
    }>
}

export interface ProductPricingPayload {
    prices: ProductPrice[]
    volume_prices?: ProductVolumePrice[]
}
export interface ProductVolumePrice {
    currency_id: number
    quantity_from: number
    price: number
    price_type: 'local' | 'export'
}

export interface ProductImportResponse {
    message: string
    imported_count?: number
    created_products?: number
    excel_products?: number
    failed_count?: number
    errors?: Array<{
        row: number
        field: string
        message: string
    }>
}

export interface ProductImportError {
    message: string
    errors?: Record<string, string[]>
}

export interface Product {
    id: number
    brand_name?: string
    name_original: string
    article_number?: string
    prices?: ProductPrice[]
    volume_prices?: ProductVolumePrice[]
    features?: Array<{ id: number; name: string }>
    discounts?: ProductDiscount[]
    additional_features?: Array<{ id: number; name: string }>
    status?: { id: number; name: string }
    [key: string]: any
}
