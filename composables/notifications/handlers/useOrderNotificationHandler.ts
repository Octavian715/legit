import { onUnmounted } from 'vue'
import type { Notification } from '~/types/notifications'
import { useNotificationEventBus } from './useNotificationEventBus'
import { useOrderTableDashboardStore } from '~/stores/orderTableDashboard'

export const useOrderNotificationHandler = () => {
    const eventBus = useNotificationEventBus()
    const orderStore = useOrderTableDashboardStore()
    const toast = useToastNotification()
    const isRegistered = ref(false)
    const route = useRoute()

    const isOrdersPage = computed(() => {
        return route.path.includes('/orders/all')
    })

    const handleOrderReceived = async (notification: Notification) => {
        try {
            if (isOrdersPage.value) {
                await handleOrder()
            }
        } catch (error) {
            console.error('[OrderHandler] Error handling order received:', error)
        }
    }

    const handleOrder = async () => {
        await orderStore.ordersListRefreshKey++
    }

    const handleOrderUpdated = async (notification: Notification) => {
        try {
            if (isOrdersPage.value) {
                await handleOrder()
            }
        } catch (error) {
            console.error('[OrderHandler] Error handling order updated:', error)
        }
    }

    const handlers = new Map<string, (notification: Notification) => Promise<void>>([
        ['order_received', handleOrderReceived],
        ['order_updated', handleOrderUpdated],
    ])

    const register = () => {
        if (isRegistered.value) return

        handlers.forEach((handler, type) => {
            eventBus.register(type as any, handler)
        })

        isRegistered.value = true
    }

    const unregister = () => {
        if (!isRegistered.value) return

        handlers.forEach((handler, type) => {
            eventBus.unregister(type as any, handler)
        })

        isRegistered.value = false
    }

    if (process.client) {
        onUnmounted(() => {
            unregister()
        })
    }

    return {
        register,
        unregister,
        isRegistered: () => isRegistered.value,
    }
}
