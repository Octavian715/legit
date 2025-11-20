import { computed, onUnmounted, watch, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useNotificationsStore } from '~/stores/notifications'
import { useSocketManager } from '~/composables/socket/useSocketManager'
import type { Notification } from '~/types/notifications'
import { useDate } from '~/composables/useDate'

// Inline utility functions to avoid import errors
const safeExtractNotifications = (data: any): Notification[] => {
    try {
        if (Array.isArray(data)) {
            return data.filter((item) => item && typeof item === 'object' && item.id && item.title)
        }
        if (data?.data && Array.isArray(data.data)) {
            return data.data.filter(
                (item) => item && typeof item === 'object' && item.id && item.title
            )
        }
        return []
    } catch (error) {
        console.error('[NotificationUtils] Error extracting notifications:', error)
        return []
    }
}

const safeExtractUnreadCount = (data: any): number => {
    try {
        if (typeof data === 'number') return Math.max(0, data)
        if (data?.count && typeof data.count === 'number') return Math.max(0, data.count)
        if (data?.unread_count && typeof data.unread_count === 'number')
            return Math.max(0, data.unread_count)
        return 0
    } catch (error) {
        console.error('[NotificationUtils] Error extracting unread count:', error)
        return 0
    }
}

const normalizeNotification = (notification: any): Notification | null => {
    try {
        if (
            !notification ||
            typeof notification !== 'object' ||
            !notification.id ||
            !notification.title
        ) {
            return null
        }

        return {
            id: notification.id,
            type: notification.type || 'system',
            title: notification.title || 'Notification',
            body: notification.body || notification.message || '',
            is_read: notification.is_read || notification.read || false,
            read_at: notification.read_at || null,
            created_at:
                notification.created_at || notification.createAt || new Date().toISOString(),
            updated_at: notification.updated_at || notification.created_at || notification.createAt,
            action_buttons: notification.action_buttons || [],
            actions: notification.actions || undefined,
            metadata: notification.metadata || notification.data || {},
            data: notification.data || notification.metadata || {},
            companyName: notification.companyName || notification.company_name,
            companyId: notification.companyId || notification.company_id,
            companySlug: notification.companySlug || notification.company_slug,
            orderId: notification.orderId || notification.order_id,
            productId: notification.productId || notification.product_id,
            productName: notification.productName || notification.product_name,
        }
    } catch (error) {
        console.error('[NotificationUtils] Error normalizing notification:', error)
        return null
    }
}

const handleNotificationError = (error: any, context: string, fallback?: any) => {
    console.error(`[Notifications] ${context}:`, error)
    if (error?.response) {
        console.error(`[Notifications] ${context} Response:`, {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
        })
    }
    if (error?.message) {
        console.error(`[Notifications] ${context} Message:`, error.message)
    }
    return fallback
}

// Global state to prevent multiple initializations
let globalNotificationsInitialized = false
let globalInitializationPromise: Promise<boolean> | null = null

export const useNotifications = () => {
    const store = useNotificationsStore()
    const socketManager = useSocketManager()
    const toast = useToastNotification()
    const isInitializing = ref(false)
    const initializationError = ref<string | null>(null)
    const userStore = useUserStore()

    const {
        notifications,
        unreadCount,
        isLoading,
        hasUnread,
        unreadNotifications,
        meta,
        isInitialized,
    } = storeToRefs(store)

    // Safe computed for recentNotifications with comprehensive error handling
    const recentNotifications = computed(() => {
        try {
            if (initializationError.value) {
                return []
            }

            if (!notifications.value || !Array.isArray(notifications.value)) {
                return []
            }

            // Validate and normalize notifications before slicing
            const validNotifications = notifications.value
                .map((notification) => {
                    try {
                        return normalizeNotification(notification)
                    } catch (error) {
                        console.warn(
                            '[useNotifications] Invalid notification filtered out:',
                            notification,
                            error
                        )
                        return null
                    }
                })
                .filter((notification): notification is Notification => notification !== null)

            return validNotifications.slice(0, 5)
        } catch (error) {
            const errorMessage = 'Error computing recent notifications'
            handleNotificationError(error, errorMessage)
            initializationError.value = errorMessage
            return []
        }
    })

    // Enhanced computed properties with error boundaries
    const safeUnreadCount = computed(() => {
        try {
            if (initializationError.value) return 0
            if (!isInitialized.value) return 0

            return safeExtractUnreadCount(unreadCount.value)
        } catch (error) {
            handleNotificationError(error, 'Error accessing unread count')
            return 0
        }
    })

    const safeNotifications = computed(() => {
        try {
            if (initializationError.value) return []
            if (!notifications.value) return []

            return safeExtractNotifications(notifications.value)
        } catch (error) {
            handleNotificationError(error, 'Error accessing notifications')
            return []
        }
    })

    const isConnected = computed(() => {
        try {
            return socketManager.isConnected.value
        } catch (error) {
            handleNotificationError(error, 'Error checking connection status')
            return false
        }
    })

    const isConnecting = computed(() => {
        try {
            return socketManager.isConnecting.value
        } catch (error) {
            handleNotificationError(error, 'Error checking connecting status')
            return false
        }
    })

    const hasMorePages = computed(() => {
        try {
            if (initializationError.value || !store.meta) return false

            const { current_page, total, per_page } = store.meta
            const totalPages = Math.ceil(total / per_page)
            return current_page < totalPages
        } catch (error) {
            handleNotificationError(error, 'Error computing hasMorePages')
            return false
        }
    })

    // Enhanced notification state
    const notificationState = computed(() => {
        if (initializationError.value) return 'error'
        if (isInitializing.value || isLoading.value) return 'loading'
        if (!isInitialized.value) return 'not-initialized'
        return 'ready'
    })

    const markAsRead = async (notificationId: number | string): Promise<boolean> => {
        try {
            if (!notificationId) {
                console.warn('[useNotifications] Invalid notification ID provided')
                return false
            }

            await store.markAsRead(Number(notificationId))
            return true
        } catch (error: any) {
            handleNotificationError(error, 'Error marking notification as read')
            toast?.error('Failed to mark notification as read')
            return false
        }
    }

    const markAllAsRead = async (): Promise<number> => {
        try {
            const count = await store.markAllAsRead()
            if (count > 0) {
                toast?.success(`Marked ${count} notifications as read`)
            }
            return count
        } catch (error: any) {
            handleNotificationError(error, 'Error marking all notifications as read')
            toast?.error('Failed to mark all as read')
            return 0
        }
    }

    const fetchNotifications = async (page = 1): Promise<boolean> => {
        if (userStore.isRegistrationComplete && !userStore.isVerified) {
            return false
        }

        try {
            await store.fetchNotifications(page)
            return true
        } catch (error: any) {
            handleNotificationError(error, 'Error fetching notifications')
            toast?.error('Failed to load notifications')
            return false
        }
    }

    const fetchUnreadCount = async (): Promise<boolean> => {
        try {
            await store.fetchUnreadCount()
            return true
        } catch (error: any) {
            handleNotificationError(error, 'Error fetching unread count')
            return false
        }
    }

    const loadMore = async (): Promise<boolean> => {
        if (isLoading.value || !store.meta) return false

        try {
            const currentPage = store.meta.current_page
            const totalPages = Math.ceil(store.meta.total / store.meta.per_page)

            if (currentPage < totalPages) {
                return await fetchNotifications(currentPage + 1)
            }
            return false
        } catch (error: any) {
            handleNotificationError(error, 'Error loading more notifications')
            return false
        }
    }

    const refresh = async (): Promise<boolean> => {
        try {
            initializationError.value = null

            const [notificationResult, countResult] = await Promise.all([
                fetchNotifications(1),
                fetchUnreadCount(),
            ])
            return notificationResult && countResult
        } catch (error: any) {
            const errorMessage = 'Error refreshing notifications'
            handleNotificationError(error, errorMessage)
            initializationError.value = errorMessage
            toast?.error('Failed to refresh notifications')
            return false
        }
    }

    const handleNotificationClick = async (notification: Notification): Promise<boolean> => {
        try {
            if (!notification?.id) {
                console.warn('[useNotifications] Invalid notification provided')
                return false
            }

            if (!notification.is_read) {
                await markAsRead(notification.id)
            }

            const url =
                notification.metadata?.url ||
                notification.data?.url ||
                notification.actions?.primary?.url

            if (url) {
                const router = useRouter()
                const localePath = useLocalePath()

                try {
                    if (url.startsWith('http')) {
                        window.open(url, '_blank')
                    } else {
                        await router.push(localePath(url))
                    }
                    return true
                } catch (routeError) {
                    handleNotificationError(routeError, 'Navigation error')
                    return false
                }
            }

            return false
        } catch (error: any) {
            handleNotificationError(error, 'Error handling notification click')
            toast?.error('Failed to handle notification')
            return false
        }
    }

    const handleActionClick = async (action: any, notification: Notification): Promise<boolean> => {
        try {
            if (!notification?.id) {
                console.warn('[useNotifications] Invalid notification provided')
                return false
            }

            if (!notification.is_read) {
                await markAsRead(notification.id)
            }

            if (action?.url) {
                const router = useRouter()
                const localePath = useLocalePath()

                try {
                    if (action.url.startsWith('http')) {
                        window.open(action.url, '_blank')
                    } else {
                        await router.push(localePath(action.url))
                    }
                    toast?.success('Action completed')
                    return true
                } catch (routeError) {
                    handleNotificationError(routeError, 'Action navigation error')
                    return false
                }
            }

            return false
        } catch (error: any) {
            handleNotificationError(error, 'Error handling action click')
            toast?.error('Failed to handle action')
            return false
        }
    }

    const formatNotificationTime = (dateString?: string): string => {
        try {
            if (!dateString) return 'Unknown time'

            const { formatDate, areDatesEqual } = useDate()
            const date = new Date(dateString)

            if (isNaN(date.getTime())) {
                return 'Invalid date'
            }

            const now = new Date()
            const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

            if (diffInHours < 1) {
                const diffInMinutes = Math.floor(diffInHours * 60)
                return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`
            }

            if (diffInHours < 24) {
                return `${Math.floor(diffInHours)}h ago`
            }

            if (areDatesEqual(date, now)) {
                return formatDate(dateString, 'HH:mm')
            }

            const yesterday = new Date(now)
            yesterday.setDate(yesterday.getDate() - 1)

            if (areDatesEqual(date, yesterday)) {
                return 'Yesterday'
            }

            if (diffInHours < 24 * 7) {
                return formatDate(dateString, 'EEEE')
            }

            return formatDate(dateString, 'dd.MM.yyyy')
        } catch (error) {
            handleNotificationError(error, 'Error formatting notification time')
            return 'Unknown time'
        }
    }

    const getNotificationTypeLabel = (type: string): string => {
        try {
            const typeLabels: Record<string, string> = {
                'connection-request': 'Connection Request',
                connection_request: 'Connection Request',
                connection_accepted: 'Connection Accepted',
                'order-request': 'Order Request',
                'order-request-accepted': 'Order Accepted',
                'order-request-declined': 'Order Declined',
                'discount-offer': 'Discount Offer',
                'stock-notification': 'Stock Alert',
                follow: 'New Follower',
                user_follow: 'New Follower',
                message: 'New Message',
                system: 'System',
            }

            return typeLabels[type] || type.charAt(0).toUpperCase() + type.slice(1)
        } catch (error) {
            handleNotificationError(error, 'Error getting notification type label')
            return 'Notification'
        }
    }

    const filterNotifications = (filter: {
        type?: string
        unread?: boolean
        dateFrom?: Date
        dateTo?: Date
    }): Notification[] => {
        try {
            const validNotifications = safeNotifications.value
            if (!validNotifications.length) return []

            let filtered = [...validNotifications]

            if (filter.type) {
                filtered = filtered.filter((n) => n.type === filter.type)
            }

            if (filter.unread) {
                filtered = filtered.filter((n) => !n.is_read)
            }

            if (filter.dateFrom) {
                filtered = filtered.filter((n) => {
                    const dateString = n.created_at || n.createAt
                    if (!dateString) return false

                    const notificationDate = new Date(dateString)
                    return (
                        !isNaN(notificationDate.getTime()) && notificationDate >= filter.dateFrom!
                    )
                })
            }

            if (filter.dateTo) {
                filtered = filtered.filter((n) => {
                    const dateString = n.created_at || n.createAt
                    if (!dateString) return false

                    const notificationDate = new Date(dateString)
                    return !isNaN(notificationDate.getTime()) && notificationDate <= filter.dateTo!
                })
            }

            return filtered
        } catch (error) {
            handleNotificationError(error, 'Error filtering notifications')
            return []
        }
    }

    const searchNotifications = (query: string): Notification[] => {
        try {
            const validNotifications = safeNotifications.value

            if (!query.trim() || !validNotifications.length) {
                return validNotifications
            }

            const searchTerm = query.toLowerCase()
            return validNotifications.filter((notification) => {
                const title = notification.title?.toLowerCase() || ''
                const body = notification.body?.toLowerCase() || ''
                return title.includes(searchTerm) || body.includes(searchTerm)
            })
        } catch (error) {
            handleNotificationError(error, 'Error searching notifications')
            return safeNotifications.value
        }
    }

    const initialize = async (): Promise<boolean> => {
        if (globalNotificationsInitialized) {
            return true
        }

        if (globalInitializationPromise) {
            return await globalInitializationPromise
        }

        try {
            isInitializing.value = true
            initializationError.value = null

            globalInitializationPromise = new Promise(async (resolve) => {
                try {
                    await store.initialize()

                    globalNotificationsInitialized = true

                    resolve(true)
                } catch (error: any) {
                    const errorMessage = 'Notifications initialization failed'
                    handleNotificationError(error, errorMessage)
                    initializationError.value = errorMessage
                    globalNotificationsInitialized = false
                    globalInitializationPromise = null
                    toast?.error('Failed to initialize notifications')
                    resolve(false)
                }
            })

            return await globalInitializationPromise
        } catch (error: any) {
            const errorMessage = 'Initialization error'
            handleNotificationError(error, errorMessage)
            initializationError.value = errorMessage
            return false
        } finally {
            isInitializing.value = false
        }
    }

    const reset = () => {
        try {
            store.reset()
            globalNotificationsInitialized = false
            globalInitializationPromise = null
            isInitializing.value = false
            initializationError.value = null
        } catch (error) {
            handleNotificationError(error, 'Error resetting notifications')
        }
    }

    const retry = async (): Promise<boolean> => {
        try {
            initializationError.value = null
            globalNotificationsInitialized = false
            globalInitializationPromise = null

            return await initialize()
        } catch (error) {
            handleNotificationError(error, 'Error retrying initialization')
            return false
        }
    }

    // Refresh interval management
    let refreshInterval: NodeJS.Timeout | null = null

    const startRefreshInterval = () => {
        if (refreshInterval) return

        refreshInterval = setInterval(
            () => {
                if (
                    isConnected.value &&
                    !isLoading.value &&
                    !isInitializing.value &&
                    !initializationError.value
                ) {
                    fetchUnreadCount()
                }
            },
            10 * 60 * 1000
        ) // 10 minutes
    }

    const stopRefreshInterval = () => {
        if (refreshInterval) {
            clearInterval(refreshInterval)
            refreshInterval = null
        }
    }

    // Watch for connection changes
    watch(isConnected, (connected) => {
        if (connected && isInitialized.value && !initializationError.value) {
            startRefreshInterval()
        } else {
            stopRefreshInterval()
        }
    })

    // Cleanup on unmount
    onUnmounted(() => {
        stopRefreshInterval()
    })

    return {
        // Enhanced state
        notifications: safeNotifications,
        unreadCount: safeUnreadCount,
        isLoading,
        hasUnread,
        unreadNotifications,
        recentNotifications,
        meta,
        isInitialized,
        hasMorePages,
        isConnected,
        isConnecting,
        isInitializing,
        initializationError: computed(() => initializationError.value),
        notificationState,

        // Actions
        markAsRead,
        markAllAsRead,
        fetchNotifications,
        fetchUnreadCount,
        loadMore,
        refresh,
        handleNotificationClick,
        handleActionClick,
        formatNotificationTime,
        getNotificationTypeLabel,
        filterNotifications,
        searchNotifications,
        initialize,
        reset,
        retry,

        // Utility
        startRefreshInterval,
        stopRefreshInterval,
    }
}
