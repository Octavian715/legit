import type { ConnectionApiResponse, FollowApiResponse } from '~/types/connections'
import { TokenService } from './token'

export class ConnectionsService {
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
            const message =
                error.data?.message ||
                error.response?._data?.message ||
                error.message ||
                'An error occurred'
            const statusCode = error.statusCode || 500

            const appError = {
                message,
                statusCode,
                data: error.data,
                code: statusCode === 401 ? 'AUTH_ERROR' : 'API_ERROR',
            }

            if (appError.code === 'AUTH_ERROR') {
                TokenService.clearAllTokens()
            }

            throw appError
        }
    }

    async sendConnectionRequest(userId: number): Promise<ConnectionApiResponse> {
        return await this.apiFetch<ConnectionApiResponse>('/user/connections/send-request', {
            method: 'POST',
            body: { user_id: userId },
        })
    }

    async respondToConnectionRequest(
        connectionId: number,
        action: 'accept' | 'reject'
    ): Promise<ConnectionApiResponse> {
        return await this.apiFetch<ConnectionApiResponse>('/user/connections/respond', {
            method: 'PATCH',
            body: { connection_id: connectionId, action },
        })
    }

    async removeConnection(connectionId: number): Promise<ConnectionApiResponse> {
        return await this.apiFetch<ConnectionApiResponse>(`/user/connections/${connectionId}`, {
            method: 'DELETE',
        })
    }

    async followUser(userId: number): Promise<FollowApiResponse> {
        return await this.apiFetch<FollowApiResponse>('/user/follow', {
            method: 'POST',
            body: { user_id: userId },
        })
    }

    async unfollowUser(userId: number): Promise<FollowApiResponse> {
        return await this.apiFetch<FollowApiResponse>('/user/unfollow', {
            method: 'DELETE',
            body: { user_id: userId },
        })
    }

    async sendRefferalInvitaton(payload: any): Promise<boolean> {
        return await this.apiFetch('/referral/invitations', { method: 'POST', body: payload })
    }

    async cancelRefferalInvitation(invitationId: number): Promise<boolean> {
        return await this.apiFetch(`/referral/invitations/${invitationId}/cancel`, {
            method: 'PATCH',
        })
    }
}
