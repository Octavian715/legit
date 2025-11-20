import { ref } from 'vue'
import type { Notification, NotificationType } from '~/types/notifications'

type NotificationHandler = (notification: Notification) => void | Promise<void>

interface EventBusState {
    handlers: Map<NotificationType | 'all', Set<NotificationHandler>>
    isInitialized: boolean
}

const state: EventBusState = {
    handlers: new Map(),
    isInitialized: false,
}

export const useNotificationEventBus = () => {
    const register = (
        type: NotificationType | 'all',
        handler: NotificationHandler,
        handlerId?: string
    ): string => {
        const id = handlerId || `handler-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        if (!state.handlers.has(type)) {
            state.handlers.set(type, new Set())
        }

        const handlers = state.handlers.get(type)
        if (handlers) {
            handlers.add(handler)
        }

        return id
    }

    const unregister = (type: NotificationType | 'all', handler: NotificationHandler): boolean => {
        const handlers = state.handlers.get(type)
        if (handlers) {
            return handlers.delete(handler)
        }
        return false
    }

    const emit = async (notification: Notification): Promise<void> => {
        if (!notification || !notification.type) {
            console.warn('[NotificationEventBus] Invalid notification received:', notification)
            return
        }

        try {
            const typeHandlers = state.handlers.get(notification.type)
            const allHandlers = state.handlers.get('all')

            const handlers: NotificationHandler[] = [
                ...(typeHandlers ? Array.from(typeHandlers) : []),
                ...(allHandlers ? Array.from(allHandlers) : []),
            ]

            if (handlers.length === 0) {
                return
            }

            await Promise.allSettled(
                handlers.map(async (handler) => {
                    try {
                        await handler(notification)
                    } catch (error) {
                        console.error(
                            `[NotificationEventBus] Handler error for type ${notification.type}:`,
                            error
                        )
                    }
                })
            )
        } catch (error) {
            console.error('[NotificationEventBus] Emit error:', error)
        }
    }

    const clear = (type?: NotificationType | 'all'): void => {
        if (type) {
            state.handlers.delete(type)
        } else {
            state.handlers.clear()
        }
    }

    const getHandlerCount = (type?: NotificationType | 'all'): number => {
        if (type) {
            return state.handlers.get(type)?.size || 0
        }
        return Array.from(state.handlers.values()).reduce((sum, set) => sum + set.size, 0)
    }

    const initialize = (): void => {
        if (state.isInitialized) return
        state.isInitialized = true
    }

    const reset = (): void => {
        state.handlers.clear()
        state.isInitialized = false
    }

    return {
        register,
        unregister,
        emit,
        clear,
        getHandlerCount,
        initialize,
        reset,
        isInitialized: () => state.isInitialized,
    }
}
