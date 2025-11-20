import { watch, onUnmounted } from 'vue'
import { useNotificationEventBus } from './handlers/useNotificationEventBus'
import { useConnectionNotificationHandler } from './handlers/useConnectionNotificationHandler'
import { useOrderNotificationHandler } from './handlers/useOrderNotificationHandler'
import { useMarketplaceNotificationHandler } from './handlers/useMarketplaceNotificationHandler'
import { useProductNotificationHandler } from './handlers/useProductNotificationHandler'
import { useCartNotificationHandler } from './handlers/useCartNotificationHandler'
import { useSystemNotificationHandler } from './handlers/useSystemNotificationHandler'
import { useSearchNotificationHandler } from './handlers/useSearchNotificationHandler'
export const useNotificationHandler = () => {
    const eventBus = useNotificationEventBus()
    const userStore = useUserStore()

    const connectionHandler = useConnectionNotificationHandler()
    const orderHandler = useOrderNotificationHandler()
    const marketplaceHandler = useMarketplaceNotificationHandler()
    const productHandler = useProductNotificationHandler()
    const cartHandler = useCartNotificationHandler()
    const systemHandler = useSystemNotificationHandler()
    const searchHandler = useSearchNotificationHandler()

    const isInitialized = ref(false)

    const initialize = () => {
        if (isInitialized.value) {
            return
        }

        eventBus.initialize()

        connectionHandler.register()
        orderHandler.register()
        marketplaceHandler.register()
        productHandler.register()
        cartHandler.register()
        systemHandler.register()
        searchHandler.register()

        isInitialized.value = true
    }

    const cleanup = () => {
        if (!isInitialized.value) {
            return
        }

        connectionHandler.unregister()
        orderHandler.unregister()
        marketplaceHandler.unregister()
        productHandler.unregister()
        cartHandler.unregister()
        systemHandler.unregister()
        searchHandler.unregister()

        eventBus.clear()

        isInitialized.value = false
    }

    if (process.client) {
        watch(
            () => userStore.isAuthenticated,
            (isAuth) => {
                if (isAuth && userStore.isRegistrationComplete && userStore.isVerified) {
                    initialize()
                } else {
                    cleanup()
                }
            },
            { immediate: true }
        )

        onUnmounted(() => {
            cleanup()
        })
    }

    return {
        initialize,
        cleanup,
        isInitialized: () => isInitialized.value,
        eventBus,
        handlers: {
            connection: connectionHandler,
            order: orderHandler,
            marketplace: marketplaceHandler,
            product: productHandler,
            cart: cartHandler,
            system: systemHandler,
            search: searchHandler,
        },
    }
}
