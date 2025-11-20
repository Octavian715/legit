// ~/types/documents.ts
export type DocumentType = 'order' | 'offer' | 'delivery_note' | 'invoice' | 'correction_invoice'

export interface DocumentStatus {
    id: number
    code: string
    name: string
}

export interface DocumentPaymentStatus {
    id: number
    code: string
    name: string
}

export interface DocumentDeliveryDetail {
    id: number
    contact_name: string
    phone_number: string
    phone_country_id?: number | null
    country: DocumentCountry
    state?: {
        id: number
        name: string
    } | null
    state_name?: string
    city_name: string
    street_name: string
    street_number: string
    postal_code: string
}

export interface DocumentDeliveryLocation {
    id: number
    contact_name: string
    phone_number?: string
    phone_country_id?: number | null
    country: DocumentCountry
    state?: {
        id: number
        name: string
    } | null
    city_name: string
    street_name: string
    street_number: string
    postal_code: string
}

export interface DocumentBuyerDetail {
    id: number
    company_name: string
    vat_number?: string
    country: DocumentCountry
    city: string
    street: string
    postal_code: string
}

export interface DocumentCurrency {
    id: number
    code: string
    symbol: string
    name: string
}

export interface DocumentBuyer {
    id: number
    legal_name?: string
    username?: string
    email: string
}

export interface DocumentCountry {
    id: number
    code: string
    name: string
}

export interface DocumentItem {
    id?: number
    product_id?: number
    product?: {
        id: number
        user_id: number
        status_id: number
        brand_name: string | null
        article_number: string | null
        name_original: string
        weight_net: number | null
        weight_net_type_id: number | null
        ean_product: string | null
        ean_box: string | null
        local_vat: string
        export_vat: string
        primary_image?: string
    }
    name: string
    sku: string
    ean?: string
    bbd?: string
    quantity: number
    quantity_unit_id?: number
    quantity_unit: {
        id: number
        symbol: string
    }
    unit_price: number
    discount_percent: number
    vat_percent: number
    line_subtotal?: string
    line_discount?: string
    line_vat?: string
    line_total?: string
}

export interface DocumentVatTotal {
    vat_percent: number
    net_amount: number
    vat_amount: number
    gross_amount: number
}

export interface DocumentIssuerDetail {
    legal_name: string
    registration_number?: string
    vat_number?: string
    address?: string
    city?: string
    postal_code?: string
    country?: string
}

export interface DocumentListItem {
    id: number
    type: DocumentType
    status: DocumentStatus
    payment_status?: DocumentPaymentStatus
    number: string
    title?: string
    date: string
    currency: DocumentCurrency
    total: number
    buyer: DocumentBuyer
    items_count: number
    created_at: string
    updated_at: string
}

export interface Document {
    id: number
    type: DocumentType
    status: DocumentStatus
    payment_status?: DocumentPaymentStatus
    title?: string
    subtitle?: string
    number: string
    date: string
    currency: DocumentCurrency
    delivery_detail?: DocumentDeliveryDetail
    delivery_location?: DocumentDeliveryLocation
    subtotal: number
    total_discount: number
    total_vat: number
    total: number
    buyer: DocumentBuyer
    buyer_detail?: DocumentBuyerDetail
    document_notes?: string
    document_commentary?: string
    items: DocumentItem[]
    vat_totals: DocumentVatTotal[]
    issuer_detail?: DocumentIssuerDetail
    last_edited_by_user_id?: number
    created_at: string
    updated_at: string
}

export interface DocumentMeta {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number
    to: number
}

export interface DocumentsResponse {
    data: DocumentListItem[]
    meta: DocumentMeta
}

export interface DocumentFilters {
    type?: DocumentType
    status_id?: number
    payment_status_id?: number
    buyer_id?: number
    date_from?: string
    date_to?: string
    search?: string
    sort_by?: 'created_at' | 'date' | 'total' | 'number'
    sort_order?: 'asc' | 'desc'
    per_page?: number
    page?: number
}

export interface CreateDocumentRequest {
    type: DocumentType
    buyer_id: number
    status_id?: number
    payment_status_id?: number
    title?: string
    subtitle?: string
    number?: string
    date?: string
    currency_id: number
    document_notes?: string
    document_commentary?: string
    delivery_location_id?: number
    delivery_detail?: {
        contact_name: string
        phone_number?: string
        phone_country_id?: number
        country_id: number
        state_name?: string
        city_name: string
        street_name: string
        street_number?: string
        postal_code?: string
    }
    items: {
        product_id?: number
        name: string
        sku: string
        ean?: string
        bbd?: string
        quantity: number
        quantity_unit_id: number
        unit_price: number
        discount_percent: number
        vat_percent: number
    }[]
    last_edited_by_user_id?: number
}

export interface ConnectedClientDeliveryLocation {
    id: number
    contactName: string
    phoneNumber?: string
    phoneCountryId?: number
    country: DocumentCountry
    state?: {
        id: number
        name: string
    }
    cityName: string
    streetName: string
    streetNumber: string
    postalCode: string
}

export interface ConnectedClientCompanyDetails {
    legalName: string
    registrationNumber?: string
    vatNumber?: string
}

export interface ConnectedClient {
    id: number
    companyDetails: ConnectedClientCompanyDetails | null
    deliveryLocations: ConnectedClientDeliveryLocation[]
}

export interface ConnectedClientResponse {
    id: number
    company_details: {
        legal_name: string
        registration_number?: string
        vat_number?: string
    } | null
    delivery_locations: Array<{
        id: number
        contact_name: string
        phone_number?: string
        phone_country_id?: number
        country: {
            id: number
            code: string
            name: string
        }
        state?: {
            id: number
            name: string
        }
        city_name: string
        street_name: string
        street_number: string
        postal_code: string
    }>
}

export type UpdateDocumentRequest = Omit<CreateDocumentRequest, 'type'>

export interface ProductWeightType {
    id: number
    symbol: string
}

export interface ProductPrice {
    id: number
    price: number
    price_type: 'local' | 'export'
    currency: {
        id: number
        code: string
        symbol: string
    } | null
}

export interface UserProduct {
    id: number
    primary_image: string | null
    brand_name: string | null
    article_number: string | null
    name_original: string
    weight_net: number | null
    weight_net_type: ProductWeightType | null
    ean_product: string | null
    ean_product_url: string | null
    ean_box: string | null
    ean_box_url: string | null
    export_vat: number
    local_vat: number
    prices: ProductPrice[]
}

export interface CreateOrderFromCartRequest {
    supplier_id: number
    document_commentary?: string
    delivery_location_id?: number
    delivery_detail?: {
        contact_name: string
        phone_country_id?: number
        phone_number?: string
        country_id: number
        state_name?: string
        city_name: string
        street_name: string
        street_number?: string
        postal_code?: string
    }
}
