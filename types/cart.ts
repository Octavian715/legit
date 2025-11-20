export interface Supplier {
    id: number
    name: string
    email: string
    legal_name?: string | null
    username?: string | null
}

export interface Product {
    id: number
    name: string
    brand_name?: string | null
    article_number?: string | null
    image?: string | null
    price?: PriceInfo | null
}

export interface Money {
    amount: number
    currency: { code: string }
}

export interface PriceInfo {
    user_currency: Money
    product_currency: Money
    type: string
}

export interface DualCurrencySubtotal {
    user_currency: Money
    product_currency: Money
}

export interface DualCurrencyTotal {
    user_currency: Money
    product_currency?: Money | null
}

export interface CartItem {
    id: number
    quantity: number
    is_saved_for_later: boolean
    price_type: string
    product: Product
    subtotals?: DualCurrencySubtotal | null
    created_at: string
    updated_at: string
}

export interface CartSupplierGroup {
    supplier: Supplier
    items: CartItem[]
    totals: DualCurrencyTotal
    total_items: number
}

export interface SupplierSummary {
    supplier_id: number
    supplier_name: string
    totals: {
        user_currency: Money
        product_currency: Money
    }
    total_items: number
}

export interface GrandTotals {
    user_currency: Money
    product_currency: {
        amount: number
        currencies: string[]
    }
}
export interface CartSummary {
    suppliers: SupplierSummary[]
    grand_totals: {
        user_currency: Money
        product_currency: Money[] | Money
    }
    total_items: number
    supplier_count: number
}

export interface AddToCartPayload {
    product_id: number
    quantity: number
}

export interface BulkAddToCartPayload {
    items: AddToCartPayload[]
}

export interface UpdateQuantityPayload {
    quantity: number
}

export interface CreateOrderPayload {
    supplier_id: number
    document_notes?: string
}
