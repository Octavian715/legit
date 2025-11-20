import { watch, onUnmounted } from 'vue'
import { useProductsStore } from '~/stores/products'
import { useNotificationEventBus } from './notifications/handlers/useNotificationEventBus'
import type { Notification } from '~/types/notifications'

export const useProductRealtimeUpdates = (productId?: Ref<number | string | null>) => {
    const productsStore = useProductsStore()
    const eventBus = useNotificationEventBus()
    const route = useRoute()
    const isRegistered = ref(false)

    const currentProductId = computed(() => {
        if (productId?.value) {
            return Number(productId.value)
        }

        const match = route.path.match(/\/products?\/(\d+)/)
        return match ? Number(match[1]) : null
    })

    const handleRealtimeUpdate = async (notification: Notification) => {
        const notificationProductId = notification.productId ? Number(notification.productId) : null

        if (!notificationProductId) return

        if (currentProductId.value && notificationProductId === currentProductId.value) {
            switch (notification.type) {
                // case 'stock-notification':
                //     productsStore.updateProductStock(
                //         notificationProductId,
                //         'in_stock',
                //         notification.metadata?.quantity
                //     )
                //     break

                // case 'discount-offer':
                //     productsStore.updateProductPrice(
                //         notificationProductId,
                //         notification.metadata?.new_price || productsStore.currentProduct?.price,
                //         notification.metadata?.discount_percentage
                //     )
                //     break

                // case 'price-change':
                //     productsStore.updateProductPrice(
                //         notificationProductId,
                //         notification.metadata?.new_price
                //     )
                //     break

                case 'product-updated':
                    await productsStore.fetchProductDetails(notificationProductId)
                    break

                case 'product-deleted':
                    break
            }
        }
    }

    const register = () => {
        if (isRegistered.value) return

        eventBus.register('all', handleRealtimeUpdate)
        isRegistered.value = true
    }

    const unregister = () => {
        if (!isRegistered.value) return

        eventBus.unregister('all', handleRealtimeUpdate)
        isRegistered.value = false
    }

    if (process.client) {
        watch(
            () => currentProductId.value,
            (newId) => {
                if (newId) {
                    register()
                } else {
                    unregister()
                }
            },
            { immediate: true }
        )

        onUnmounted(() => {
            unregister()
        })
    }

    return {
        register,
        unregister,
        isRegistered: () => isRegistered.value,
        currentProductId,
    }
}
