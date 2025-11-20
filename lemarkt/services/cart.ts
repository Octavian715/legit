import type {
    CartSupplierGroup,
    CartItem,
    CartSummary,
    AddToCartPayload,
    BulkAddToCartPayload,
    UpdateQuantityPayload,
} from '~/types/cart'
import { TokenService } from './token'
import { handleApiError } from '~/utils/errors'

export interface CreateOrderPayload {
    supplier_id: number
    document_notes?: string
    delivery_detail?: {
        contact_name: string
        phone_number: string
        country_id: number
        state_name?: string
        city_name: string
        street_name: string
        street_number: string
        postal_code: string
    }
}

export interface OrderResponse {
    id: number
    type: string
    number: string
    created_at: string
}

export class CartService {
    private readonly baseURL: string

    constructor() {
        const config = useRuntimeConfig()
        this.baseURL = config.public.apiBaseURL
    }

    private async apiFetch<T>(endpoint: string, options: any = {}): Promise<T> {
        try {
            return await $fetch<T>(endpoint, {
                baseURL: this.baseURL,
                headers: TokenService.getRequestHeaders(),
                ...options,
            })
        } catch (error: any) {
            const appError = handleApiError(error)
            if (appError.code === 'AUTH_ERROR') {
                TokenService.clearAllTokens()
            }
            throw appError
        }
    }

    async fetchCart(): Promise<CartSupplierGroup[]> {
        const token = TokenService.getAuthToken()
        if (!token) {
            return []
        }

        try {
            const result = await this.apiFetch<CartSupplierGroup[]>('/user/cart', {
                method: 'GET',
            })
            return result || []
        } catch (error) {
            console.error('Error fetching cart:', error)
            return []
        }
    }

    async fetchApiSummary(): Promise<CartSummary> {
        return await this.apiFetch<CartSummary>('/user/cart/summary', {
            method: 'GET',
        })
    }

    async fetchCount(): Promise<number> {
        try {
            const data = await this.apiFetch<{ count: number }>('/user/cart/count', {
                method: 'GET',
            })
            return data?.count || 0
        } catch (error) {
            console.error('Error fetching cart count:', error)
            return 0
        }
    }

    async addToCart(payload: AddToCartPayload): Promise<CartItem> {
        return await this.apiFetch<CartItem>('/user/cart/add', {
            method: 'POST',
            body: payload,
        })
    }

    async bulkAddToCart(payload: BulkAddToCartPayload): Promise<CartItem[]> {
        return await this.apiFetch<CartItem[]>('/user/cart/bulk-add', {
            method: 'POST',
            body: payload,
        })
    }

    async updateQuantity(itemId: number, payload: UpdateQuantityPayload): Promise<CartItem> {
        return await this.apiFetch<CartItem>(`/user/cart/${itemId}/quantity`, {
            method: 'PATCH',
            body: payload,
        })
    }

    async removeFromCart(itemId: number): Promise<void> {
        await this.apiFetch(`/user/cart/${itemId}`, {
            method: 'DELETE',
        })
    }

    async removeFromSupplierCart(supplierId: number): Promise<void> {
        await this.apiFetch(`/user/cart/supplier/${supplierId}`, {
            method: 'DELETE',
        })
    }

    async clearCart(): Promise<void> {
        await this.apiFetch('/user/cart', {
            method: 'DELETE',
        })
    }

    async saveForLater(itemId: number): Promise<CartItem> {
        return await this.apiFetch<CartItem>(`/user/cart/${itemId}/save-for-later`, {
            method: 'PATCH',
        })
    }

    async moveToCart(itemId: number): Promise<CartItem> {
        return await this.apiFetch<CartItem>(`/user/cart/${itemId}/move-to-cart`, {
            method: 'PATCH',
        })
    }

    async fetchSavedForLater(): Promise<CartItem[]> {
        try {
            const data = await this.apiFetch<CartItem[] | CartItem[][]>(
                '/user/cart/saved-for-later',
                {
                    method: 'GET',
                }
            )
            // Handle both array and nested array responses
            if (Array.isArray(data)) {
                // If it's a nested array, take the first element
                if (data.length > 0 && Array.isArray(data[0])) {
                    return data[0] as CartItem[]
                }
                // If it's a flat array, return as is
                return data as CartItem[]
            }
            return []
        } catch (error) {
            console.error('Error fetching saved for later items:', error)
            return []
        }
    }

    async clearSavedForLater(): Promise<void> {
        await this.apiFetch('/user/cart/saved-for-later', {
            method: 'DELETE',
        })
    }

    async createOrder(payload: CreateOrderPayload): Promise<OrderResponse> {
        return await this.apiFetch<OrderResponse>('/documents/create-order-from-cart', {
            method: 'POST',
            body: payload,
        })
    }
}
