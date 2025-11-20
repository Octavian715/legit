// Updated types to match real API response structure

export interface OrderTableCountry {
    code: string
    name: string
    flag_url?: string
}

export interface OrderTableCurrency {
    code: string
    symbol: string
}

export interface OrderTableStatus {
    id: number
    code: string
    name: string
}

export interface OrderTablePaymentStatus {
    id: number
    code: string
    name: string
}

export interface OrderTableUser {
    id: number
    name: string
    email: string
    country?: OrderTableCountry
}

export interface OrderTableData {
    id: number
    type: string
    number: string
    title: string
    date: string // "2025-09-25" format
    total: string // "125235.0600" format
    currency: OrderTableCurrency
    status: OrderTableStatus
    payment_status: OrderTablePaymentStatus
    buyer: OrderTableUser
    supplier: OrderTableUser
    items_count: number
    created_at: string
    updated_at: string
}

export interface OrderTableStatusCount {
    id: number
    code: string
    count: number
}

export interface OrderTablePaymentStatusCount {
    id: number
    code: string
    count: number
}

export interface OrderTableMeta {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number
    to: number
    applied_filters: Record<string, any>
    view_as: 'supplier' | 'buyer'
    status_counts: OrderTableStatusCount[]
    payment_status_counts: OrderTablePaymentStatusCount[]
}

export interface OrderTableListResponse {
    data: OrderTableData[]
    meta: OrderTableMeta
}

export interface OrderTableFilterOptions {
    currencies: OrderTableFilterCurrency[]
    statuses: OrderTableFilterStatus[]
    payment_statuses: OrderTableFilterPaymentStatus[]
    amount_range: {
        min: string // "7050.6300" format
        max: string // "170043.2700" format
    }
    document_types: string[]
    view_as: 'supplier' | 'buyer'
}

export interface OrderTableFilterCurrency {
    id: number
    code: string
    symbol: string
}

export interface OrderTableFilterStatus {
    id: number
    code: string
    name?: string // Added for compatibility, will be generated if missing
}

export interface OrderTableFilterPaymentStatus {
    id: number
    code: string
    name?: string // Added for compatibility, will be generated if missing
}

export interface OrderTableFilters {
    type?: 'order' | 'offer' | 'delivery_note' | 'invoice' | 'correction_invoice'
    search?: string
    status_ids?: number[]
    payment_status_ids?: number[]
    currency_ids?: number[]
    amount_min?: number
    amount_max?: number
    date_from?: string
    date_to?: string
    page?: number
    per_page?: number
    sort_by?: OrderTableSortField
    sort_order?: 'asc' | 'desc'
}

export interface OrderTableCountry {
    code: string
    name: string
    flag_url?: string
}

export interface OrderTableCurrency {
    code: string
    symbol: string
    id?: number
}

export interface OrderTableStatus {
    id: number
    code: string
    name: string
}

export interface OrderTablePaymentStatus {
    id: number
    code: string
    name: string
}

export interface OrderTableUser {
    id: number
    name: string
    email: string
    country?: OrderTableCountry
}

export interface OrderTableData {
    id: number
    type: string
    number: string
    title: string
    date: string
    total: string
    currency: OrderTableCurrency
    status: OrderTableStatus
    payment_status: OrderTablePaymentStatus
    buyer: OrderTableUser
    supplier: OrderTableUser
    items_count: number
    created_at: string
    updated_at: string
}

export interface OrderTableStatusCount {
    id: number
    code: string
    count: number
}

export interface OrderTablePaymentStatusCount {
    id: number
    code: string
    count: number
}

export interface OrderTableMeta {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number
    to: number
    applied_filters: Record<string, any>
    view_as: 'supplier' | 'buyer'
    status_counts: OrderTableStatusCount[]
    payment_status_counts: OrderTablePaymentStatusCount[]
}

export interface OrderTableListResponse {
    data: OrderTableData[]
    meta: OrderTableMeta
}

export interface OrderTableFilterOptions {
    currencies: OrderTableFilterCurrency[]
    statuses: OrderTableFilterStatus[]
    payment_statuses: OrderTableFilterPaymentStatus[]
    amount_range: {
        min: string
        max: string
    }
    document_types: string[]
    view_as: 'supplier' | 'buyer'
}

export interface OrderTableFilterCurrency {
    id: number
    code: string
    symbol: string
}

export interface OrderTableFilterStatus {
    id: number
    code: string
    name?: string
}

export interface OrderTableFilterPaymentStatus {
    id: number
    code: string
    name?: string
}

export interface OrderTableFilters {
    type?: 'order' | 'offer' | 'delivery_note' | 'invoice' | 'correction_invoice'
    search?: string
    status_ids?: number[]
    payment_status_ids?: number[]
    currency_ids?: number[]
    amount_min?: number
    amount_max?: number
    date_from?: string
    date_to?: string
    page?: number
    per_page?: number
    sort_by?: OrderTableSortField
    sort_order?: 'asc' | 'desc'
}

export type OrderTableSortField =
    | 'date'
    | 'total'
    | 'number'
    | 'type'
    | 'buyer_name'
    | 'buyer_id'
    | 'buyer_country'
    | 'supplier_name'
    | 'supplier_id'
    | 'supplier_country'
    | 'currency'
    | 'status'
    | 'payment_status'
    | 'number_of_skus'
    | 'items_count'
    | 'created_at'
    | 'updated_at'
    | 'id'

export interface ApiError {
    message: string
    statusCode?: number
    code?: string
    errors?: Record<string, string[]>
}

export interface OrderTableTabConfig {
    key: string
    statusCodes?: string[]
    paymentStatusCodes?: string[]
}

export const ORDER_TABLE_TAB_CONFIGS: OrderTableTabConfig[] = [
    { key: 'all' },
    { key: 'incoming', statusCodes: ['incoming', 'pending'] },
    { key: 'approved', statusCodes: ['approved', 'accepted'] },
    { key: 'paid', paymentStatusCodes: ['paid'] },
    { key: 'unpaid', paymentStatusCodes: ['unpaid'] },
    { key: 'delivered', statusCodes: ['delivered'] },
    { key: 'not_delivered', statusCodes: ['not_delivered', 'pending_delivery'] },
    { key: 'declined', statusCodes: ['declined', 'rejected', 'cancelled'] },
    { key: 'deleted', statusCodes: ['deleted', 'archived'] },
]

export type UserRole = 'supplier' | 'buyer'

export const getCounterpartyField = (viewAs: UserRole): 'buyer' | 'supplier' => {
    return viewAs === 'supplier' ? 'buyer' : 'supplier'
}

export const getSortFieldForRole = (field: string, viewAs: UserRole): OrderTableSortField => {
    const fieldMapping: Record<string, Record<UserRole, OrderTableSortField>> = {
        counterparty_name: {
            supplier: 'buyer_name',
            buyer: 'supplier_name',
        },
        counterparty_id: {
            supplier: 'buyer_id',
            buyer: 'supplier_id',
        },
        counterparty_country: {
            supplier: 'buyer_country',
            buyer: 'supplier_country',
        },
    }

    return (fieldMapping[field]?.[viewAs] as OrderTableSortField) || (field as OrderTableSortField)
}

export interface ApiError {
    message: string
    statusCode?: number
    code?: string
    errors?: Record<string, string[]>
}

// Tab configuration for different order views
export interface OrderTableTabConfig {
    key: string
    statusCodes?: string[]
    paymentStatusCodes?: string[]
}
