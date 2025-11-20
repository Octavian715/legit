import { TokenService } from './token'
import { handleApiError } from '~/utils/errors'

export class GlobalService {
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

    async fetchGeneralData(): Promise<ProductStaticData> {
        try {
            const response = await this.apiFetch<ProductStaticData>('/general/static-data', {
                method: 'GET',
            })
            return response.data || response
        } catch (error: any) {
            console.error('Product static data service error:', error)
            throw handleApiError(error)
        }
    }
}
