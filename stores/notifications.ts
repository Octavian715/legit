import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Notification, NotificationMeta } from '~/types/notifications'
import { NotificationService } from '~/services/notificationService'

export const useNotificationsStore = defineStore('notifications', () => {
    const notificationService = new NotificationService()
    const notifications = ref<Notification[]>([])
    const unreadCount = ref(0)
    const meta = ref<NotificationMeta | null>(null)
    const isLoading = ref(false)
    const isInitialized = ref(false)
    const lastError = ref<string | null>(null)

    const hasUnread = computed(() => unreadCount.value > 0)

    const unreadNotifications = computed(() => notifications.value.filter((n) => !n.is_read))

    const recentNotifications = computed(() => notifications.value.slice(0, 5))

    const addNotification = (notification: Notification) => {
        const exists = notifications.value.find((n) => n.id === notification.id)

        if (!exists) {
            notifications.value.unshift(notification)

            if (!notification.is_read) {
                unreadCount.value++
            }
        }
    }

    const updateUnreadCount = (count: number) => {
        unreadCount.value = Math.max(0, count)
    }

    const markAsRead = async (notificationId: number) => {
        try {
            await notificationService.markAsRead(notificationId)

            const notification = notifications.value.find((n) => n.id === notificationId)
            if (notification && !notification.is_read) {
                notification.is_read = true
                notification.read_at = new Date().toISOString()
                unreadCount.value = Math.max(0, unreadCount.value - 1)
            }
        } catch (error: any) {
            console.error('[NotificationsStore] Error marking notification as read:', error)
            lastError.value = error?.message || 'Failed to mark notification as read'
            throw error
        }
    }

    const markAllAsRead = async () => {
        try {
            const count = await notificationService.markAllAsRead()

            notifications.value.forEach((n) => {
                if (!n.is_read) {
                    n.is_read = true
                    n.read_at = new Date().toISOString()
                }
            })

            unreadCount.value = 0

            return count
        } catch (error: any) {
            console.error('[NotificationsStore] Error marking all as read:', error)
            lastError.value = error?.message || 'Failed to mark all notifications as read'
            throw error
        }
    }

    const fetchNotifications = async (page = 1, options?: { unreadOnly?: boolean }) => {
        try {
            isLoading.value = true
            lastError.value = null

            const response = await notificationService.getNotifications(page, 20, options)

            if (page === 1) {
                notifications.value = response.data
            } else {
                notifications.value.push(...response.data)
            }

            meta.value = response.meta
            unreadCount.value = response.meta.unread_count
        } catch (error: any) {
            if (error?.statusCode === 403 || error?.response?.status === 403) {
                console.warn(
                    '[NotificationsStore] Access forbidden - user may not have notification permissions'
                )
                lastError.value = 'Access forbidden'
                return
            }

            console.error('[NotificationsStore] Error fetching notifications:', error)
            lastError.value = error?.message || 'Failed to fetch notifications'
            throw error
        } finally {
            isLoading.value = false
        }
    }

    const fetchUnreadCount = async () => {
        try {
            const count = await notificationService.getUnreadCount()
            unreadCount.value = count
        } catch (error: any) {
            console.error('[NotificationsStore] Error fetching unread count:', error)
            lastError.value = error?.message || 'Failed to fetch unread count'
        }
    }

    const initialize = async () => {
        if (isInitialized.value) return

        try {
            await fetchNotifications(1)
            isInitialized.value = true
        } catch (error: any) {
            console.error('[NotificationsStore] Initialization failed:', error)
            lastError.value = error?.message || 'Initialization failed'
        }
    }

    const reset = () => {
        notifications.value = []
        unreadCount.value = 0
        meta.value = null
        isLoading.value = false
        isInitialized.value = false
        lastError.value = null
    }

    return {
        notifications,
        unreadCount,
        meta,
        isLoading,
        isInitialized,
        lastError,
        hasUnread,
        unreadNotifications,
        recentNotifications,
        addNotification,
        updateUnreadCount,
        markAsRead,
        markAllAsRead,
        fetchNotifications,
        fetchUnreadCount,
        initialize,
        reset,
    }
})

if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useNotificationsStore, import.meta.hot))
}
