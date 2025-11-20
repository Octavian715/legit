import type {
    ResponseFavorites,
    AddToFavoritePayload,
    RemoveFromFavoritePayload,
} from '~/types/favorite'
import { TokenService } from './token'
import { handleApiError } from '~/utils/errors'

export class FavoriteService {
    private readonly baseURL: string

    constructor() {
        const config = useRuntimeConfig()
        this.baseURL = config.public.apiBaseURL
    }

    private async apiFetch<T>(endpoint: string, options: any): Promise<T> {
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

    async fetchFavorites(params: any = {}): Promise<ResponseFavorites> {
        const token = TokenService.getAuthToken()
        if (!token) {
            return { data: [], meta: {} }
        }

        // Ensure only_favorites is always true for favorites endpoint
        const queryParams = {
            ...params,
            only_favorites: true,
            per_page: params.per_page || 20,
        }

        return await this.apiFetch<ResponseFavorites>('/products', {
            method: 'GET',
            params: queryParams,
        })
    }

    async fetchFilterOptions(categoryId?: number): Promise<any> {
        const token = TokenService.getAuthToken()
        if (!token) {
            return {
                categories: [],
                subcategories: [],
                brands: [],
                features: [],
                additional_features: [],
                conditions: [],
                allergens: [],
                statuses: [],
                countries: [],
                price_range: { min: 0, max: 1000 },
            }
        }

        const params: any = {}
        if (categoryId) {
            params.category_id = categoryId
        }

        const response = await this.apiFetch<any>('/products/filter-options', {
            method: 'GET',
            params,
        })

        // Extract data from response structure
        const filterData = response.data || response

        return {
            categories: filterData.categories || [],
            subcategories: filterData.subcategories || [],
            brands: filterData.brands || [],
            features: filterData.features || [],
            additional_features: filterData.additional_features || [],
            conditions: filterData.storage_conditions || [],
            allergens: filterData.allergens || [],
            statuses: filterData.statuses || [],
            countries: filterData.countries || [],
            price_range: filterData.price_range || { min: 0, max: 1000 },
            weight_types: filterData.weight_types || [],
        }
    }

    async addToFavorite(payload: AddToFavoritePayload): Promise<{ success: boolean }> {
        return await this.apiFetch<{ success: boolean }>(
            `/products/${payload.product_id}/favorite`,
            {
                method: 'POST',
            }
        )
    }

    async removeFromFavorite(payload: RemoveFromFavoritePayload): Promise<{ success: boolean }> {
        return await this.apiFetch<{ success: boolean }>(
            `/products/${payload.product_id}/favorite`,
            {
                method: 'DELETE',
            }
        )
    }
}
