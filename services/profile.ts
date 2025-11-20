// ~/services/profile.ts
import type { ProfileApiResponse, ApiProfileUser, ProfileSocialData } from '~/types/profile'
import { TokenService } from './token'
import { handleApiError } from '~/utils/errors'

export class ProfileService {
    private readonly baseURL: string

    constructor() {
        if (process.server) {
            const config = useRuntimeConfig()
            this.baseURL = config.apiBaseURL
        } else {
            const config = useRuntimeConfig()
            this.baseURL = config.public.apiBaseURL
        }
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

    async getUserProfile(identifier: string | number): Promise<ApiProfileUser> {
        const response = await this.apiFetch<ProfileApiResponse>(`/user/${identifier}`, {
            method: 'GET',
        })
        return response.data || response
    }

    async getSocialState(identifier: string | number): Promise<ProfileSocialData | null> {
        try {
            const userData = await this.getUserProfile(identifier)

            if (userData.social) {
                return {
                    followers_count: userData.social.followers_count || 0,
                    connections_count: userData.social.connections_count || 0,
                    is_following: userData.social.is_following || false,
                    connection: {
                        exists: userData.social.connection?.exists || false,
                        status: userData.social.connection?.status || null,
                        id: userData.social.connection?.id || undefined,
                    },
                }
            }

            return null
        } catch (error) {
            console.error('[ProfileService] Error fetching social state:', error)
            throw error
        }
    }

    async toggleFollow(userId: number, follow: boolean): Promise<void> {
        const endpoint = follow ? `/user/${userId}/follow` : `/user/${userId}/unfollow`
        await this.apiFetch<void>(endpoint, {
            method: 'POST',
        })
    }

    async sendConnectionRequest(userId: number): Promise<void> {
        await this.apiFetch<void>(`/user/${userId}/connect`, {
            method: 'POST',
        })
    }

    async getUserProducts(identifier: string | number, params?: {}): Promise<any> {
        const endpoint = `/user/${identifier}/product-stats`

        return await this.apiFetch<any>(endpoint, {
            method: 'GET',
        })
    }
}
