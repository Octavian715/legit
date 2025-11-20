import { onUnmounted } from 'vue'
import type { Notification } from '~/types/notifications'
import { useNotificationEventBus } from './useNotificationEventBus'
import { useCartStore } from '~/stores/cart'
import { useProductsStore } from '~/stores/products'

export const useCartNotificationHandler = () => {
    const eventBus = useNotificationEventBus()
    const cartStore = useCartStore()
    const productsStore = useProductsStore()
    const toast = useToastNotification()
    const route = useRoute()
    const isRegistered = ref(false)

    const isOnMarketplacePage = computed(() => {
        return (
            route.path.startsWith('/marketplace') ||
            route.path.includes('/products') ||
            route.path.includes('/product/')
        )
    })

    const handleCartChanged = async (notification: Notification) => {
        try {
            const affectedProductIds = notification.affected_product_ids || []

            await cartStore.fetchCart(true)

            if (
                isOnMarketplacePage.value &&
                Array.isArray(affectedProductIds) &&
                affectedProductIds.length > 0
            ) {
                const numericIds = affectedProductIds
                    .map((id: any) => Number(id))
                    .filter((id: number) => !isNaN(id) && id > 0)

                if (numericIds.length > 0) {
                    const updatedCount = await productsStore.refreshProductsByIds(numericIds)

                    if (updatedCount > 0) {
                        toast.info(
                            `Cart updated. ${updatedCount} product${updatedCount > 1 ? 's' : ''} refreshed in marketplace`,
                            notification.title || 'Cart Updated'
                        )
                    } else {
                        toast.info(
                            notification.body || 'Your cart has been updated',
                            notification.title || 'Cart Updated'
                        )
                    }
                } else {
                    toast.info(
                        notification.body || 'Your cart has been updated',
                        notification.title || 'Cart Updated'
                    )
                }
            } else {
                toast.info(
                    notification.body || 'Your cart has been updated',
                    notification.title || 'Cart Updated'
                )
            }
        } catch (error) {
            console.error('[CartHandler] Error handling cart changed:', error)
            toast.info('Your cart has been updated')
        }
    }

    const handlers = new Map<string, (notification: Notification) => Promise<void>>([
        ['cart_changed', handleCartChanged],
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
