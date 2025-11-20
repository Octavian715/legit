import { onUnmounted } from 'vue'
import type { Notification } from '~/types/notifications'
import { useNotificationEventBus } from './useNotificationEventBus'
import { useProductsStore } from '~/stores/products'

export const useProductNotificationHandler = () => {
    const eventBus = useNotificationEventBus()
    const productsStore = useProductsStore()
    const toast = useToastNotification()
    const route = useRoute()
    const isRegistered = ref(false)

    // const isOnMarketplacePage = computed(() => {
    //     return route.path.startsWith('/marketplace')
    // })

    // const isViewingProduct = computed(() => {
    //     return route.path.match(/\/products?\/(\d+)/)
    // })

    // const getCurrentProductId = computed(() => {
    //     const match = route.path.match(/\/products?\/(\d+)/)
    //     return match ? Number(match[1]) : null
    // })

    const handlers = new Map<string, (notification: Notification) => Promise<void>>([])

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
