import type { Chat, ChatMessage, SendMessagePayload, ChatPaginationParams } from '~/types/chat'
import { handleApiError } from '~/utils/errors'

export class ChatService {
    private baseURL: string | null = null

    private getBaseURL(): string {
        if (!this.baseURL) {
            const config = useRuntimeConfig()
            this.baseURL = config.public.apiBaseURL
        }
        return this.baseURL
    }

    private getAuthHeaders() {
        const userStore = useUserStore()
        const token = userStore.getAuthToken()

        if (!token) {
            throw new Error('No authentication token available')
        }

        return {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        }
    }

    private async apiFetch<T>(endpoint: string, options: any = {}): Promise<T> {
        try {
            const headers = this.getAuthHeaders()
            const baseURL = this.getBaseURL()

            return await $fetch<T>(endpoint, {
                baseURL,
                headers: options.headers ? { ...headers, ...options.headers } : headers,
                ...options,
            })
        } catch (error: any) {
            const appError = handleApiError(error)

            if (appError.code === 'AUTH_ERROR') {
                const userStore = useUserStore()
                userStore.clearTokens()
                await userStore.logoutExpired()
            }

            throw appError
        }
    }

    async getChats(): Promise<Chat[]> {
        const response = await this.apiFetch<{ data?: Chat[] } | Chat[]>('/chats', {
            method: 'GET',
        })

        const chats = Array.isArray(response) ? response : response.data || []
        return chats.map((chat) => ({
            ...chat,
            is_direct: chat.participants?.length === 2,
        }))
    }

    async getOrCreateDirectChat(userId: number): Promise<Chat> {
        const response = await this.apiFetch<{ data?: Chat } | Chat>(`/chats/direct/${userId}`, {
            method: 'GET',
        })

        const chat = response.data || response
        return {
            ...chat,
            is_direct: true,
        }
    }

    async getMessages(chatId: number, params?: ChatPaginationParams): Promise<ChatMessage[]> {
        const queryParams = new URLSearchParams()
        queryParams.append('limit', (params?.limit || 50).toString())

        if (params?.before) {
            queryParams.append('before', params.before.toString())
        }

        const endpoint = `/chats/${chatId}/messages?${queryParams.toString()}`
        const response = await this.apiFetch<{ data?: ChatMessage[] } | ChatMessage[]>(endpoint, {
            method: 'GET',
        })

        const messages = Array.isArray(response) ? response : response.data || []
        return messages.reverse()
    }

    async getPinnedMessages(chatId: number): Promise<ChatMessage[]> {
        const response = await this.apiFetch<{ data?: ChatMessage[] } | ChatMessage[]>(
            `/chats/${chatId}/pinned-messages`,
            {
                method: 'GET',
            }
        )

        return Array.isArray(response) ? response : response.data || []
    }

    async sendMessage(payload: SendMessagePayload): Promise<ChatMessage> {
        const formData = new FormData()

        if (payload.chat_id) {
            formData.append('chat_id', payload.chat_id.toString())
        }
        if (payload.recipient_id) {
            formData.append('recipient_id', payload.recipient_id.toString())
        }
        if (payload.content) {
            formData.append('content', payload.content)
        }
        if (payload.reply_to_id) {
            formData.append('reply_to_id', payload.reply_to_id.toString())
        }
        if (payload.files) {
            payload.files.forEach((file) => {
                formData.append('files[]', file)
            })
        }

        const userStore = useUserStore()
        const token = userStore.getAuthToken()

        if (!token) {
            throw new Error('No authentication token available')
        }

        const baseURL = this.getBaseURL()

        const response = await $fetch<{ data?: ChatMessage } | ChatMessage>('/chats/messages', {
            baseURL,
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        })

        return response.data || response
    }

    async editMessage(messageId: number, content: string): Promise<ChatMessage> {
        const response = await this.apiFetch<{ data?: ChatMessage } | ChatMessage>(
            `/chats/messages/${messageId}`,
            {
                method: 'PUT',
                body: JSON.stringify({ content }),
            }
        )

        return response.data || response
    }

    async deleteMessage(messageId: number): Promise<ChatMessage> {
        const response = await this.apiFetch<{ data?: ChatMessage } | ChatMessage>(
            `/chats/messages/${messageId}`,
            {
                method: 'DELETE',
            }
        )

        return response.data || response
    }

    async togglePin(messageId: number, pinned: boolean): Promise<ChatMessage> {
        const response = await this.apiFetch<{ data?: ChatMessage } | ChatMessage>(
            `/chats/messages/${messageId}/pin`,
            {
                method: 'POST',
                body: JSON.stringify({ pinned }),
            }
        )

        return response.data || response
    }

    async toggleLike(messageId: number): Promise<{ success: boolean; liked: boolean }> {
        const response = await this.apiFetch<
            { data?: { success: boolean; liked: boolean } } | { success: boolean; liked: boolean }
        >(`/chats/messages/${messageId}/like`, {
            method: 'POST',
        })

        return response.data || response
    }

    async markAsRead(chatId: number): Promise<{ success: boolean }> {
        const response = await this.apiFetch<
            { data?: { success: boolean } } | { success: boolean }
        >(`/chats/${chatId}/read`, {
            method: 'POST',
        })

        return response.data || response
    }
}

// Factory function that creates the service instance when called (lazy initialization)
export const createChatService = (): ChatService => {
    return new ChatService()
}

// Export a function that returns the service instance
export const useChatService = (): ChatService => {
    // Create a new instance each time to ensure fresh composable access
    return createChatService()
}

// For backward compatibility, export the factory as default
export default createChatService
