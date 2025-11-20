import type {
    Notification,
    NotificationsResponse,
    NotificationPreference,
    NotificationTypeInfo,
} from '~/types/notifications'
import { TokenService } from './token'

export class NotificationService {
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

    async getNotifications(
        page = 1,
        perPage = 20,
        options?: { unreadOnly?: boolean }
    ): Promise<NotificationsResponse> {
        const params: Record<string, any> = {
            page,
            per_page: perPage,
        }

        if (options?.unreadOnly === true) {
            params.unread_only = options.unreadOnly ? 1 : 0
        }

        return await this.apiFetch<NotificationsResponse>('/user/notifications', {
            method: 'GET',
            params,
        })
    }

    async getUnreadCount(): Promise<number> {
        return await this.apiFetch<number>('/user/notifications/unread-count', {
            method: 'GET',
        })
    }

    async markAsRead(notificationId: number): Promise<{ success: boolean }> {
        return await this.apiFetch<{ success: boolean }>(
            `/user/notifications/${notificationId}/mark-read`,
            {
                method: 'PATCH',
            }
        )
    }

    async markAllAsRead(): Promise<number> {
        return await this.apiFetch<number>('/user/notifications/mark-all-read', {
            method: 'PATCH',
        })
    }

    async getNotificationTypes(): Promise<NotificationTypeInfo[]> {
        return await this.apiFetch<NotificationTypeInfo[]>('/user/notifications/types', {
            method: 'GET',
        })
    }

    async getNotificationPreferences(): Promise<NotificationPreference[]> {
        return await this.apiFetch<NotificationPreference[]>('/user/notifications/preferences', {
            method: 'GET',
        })
    }

    async updateNotificationPreferences(payload: {
        email_enabled: boolean
        platform_enabled: boolean
        preferences: Array<{
            type: string
            email_enabled: boolean
            platform_enabled: boolean
        }>
    }): Promise<NotificationPreference[]> {
        return await this.apiFetch<NotificationPreference[]>('/user/notifications/preferences', {
            method: 'PATCH',
            body: payload, // Send complete payload with global toggles
        })
    }

    async deleteNotification(notificationId: number): Promise<{ success: boolean }> {
        return await this.apiFetch<{ success: boolean }>(`/user/notifications/${notificationId}`, {
            method: 'DELETE',
        })
    }
}
