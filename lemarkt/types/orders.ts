export type OrderStatus = 'all' | 'incoming' | 'approved' | 'delivered' | 'declined' | 'deleted'

export interface OrderItem {
    id: number
    productId: number
    productName: string
    quantity: number
    unitPrice: number
    totalPrice: number
}

export interface Order {
    id: number
    orderNumber: string
    customerId: number
    customerName: string
    customerEmail: string
    status: OrderStatus
    createdAt: string
    updatedAt: string
    total: number
    items: OrderItem[]
    notes?: string
    shippingAddress?: {
        street: string
        city: string
        state: string
        country: string
        postalCode: string
    }
    billingAddress?: {
        street: string
        city: string
        state: string
        country: string
        postalCode: string
    }
}
