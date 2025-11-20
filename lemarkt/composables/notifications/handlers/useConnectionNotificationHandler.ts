import { onUnmounted } from 'vue'
import type { Notification } from '~/types/notifications'
import { useNotificationEventBus } from './useNotificationEventBus'
import { useProductsStore } from '~/stores/products'
import { useSearchStore } from '~/stores/search'
import { ProfileService } from '~/services/profile'
import { useNetworkStore } from '~/stores/network'
import { storeToRefs } from 'pinia'

export const useConnectionNotificationHandler = () => {
    const profileService = new ProfileService()
    const eventBus = useNotificationEventBus()
    const productsStore = useProductsStore()
    const searchStore = useSearchStore()
    const newtworkStore = useNetworkStore()

    const { hasQuickSearchResults } = storeToRefs(searchStore)
    const toast = useToastNotification()
    const route = useRoute()
    const isRegistered = ref(false)

    const isOnMarketplacePage = computed(() => {
        return route.path.startsWith('/marketplace')
    })

    const isNewtwork = computed(() => {
        return route.path.includes('/network/')
    })

    const isOnSearchPage = computed(() => {
        return route.path.includes('/search') || hasQuickSearchResults.value
    })
    const handleConnectionRequestReceived = async (notification: Notification) => {
        try {
            if (isNewtwork.value) {
                await newtworkStore.networkRefreshKey++
            }
        } catch (error) {
            console.error('[ConnectionHandler] Error handling connection request:', error)
        }
    }

    const handleConnectionRequestAccepted = async (notification: Notification) => {
        try {
            const { companyId, companyName, target_user_id } = notification
            const targetUserId = target_user_id || companyId

            if (isNewtwork.value) {
                await newtworkStore.networkRefreshKey++
            }

            if (!targetUserId) {
                return
            }

            if (isOnMarketplacePage.value) {
                const currentProducts = productsStore.products.filter(
                    (p) => p.user?.id === Number(targetUserId)
                )

                if (currentProducts.length === 0) {
                    return
                }

                await productsStore.refreshUserProducts(Number(targetUserId), companyName)
            }

            if (isOnSearchPage.value) {
                const profile = await profileService.getUserProfile(Number(targetUserId))
                await searchStore.updateConnection(Number(targetUserId), profile.social, 'accept')
            }
        } catch (error) {
            console.error('[ConnectionHandler] Error handling connection accepted:', error)
        }
    }

    const handleConnectionRequestRejected = async (notification: Notification) => {
        try {
            const { companyName, targetUserId } = notification

            if (isNewtwork.value) {
                await newtworkStore.networkRefreshKey++
            }

            if (isOnSearchPage.value) {
                const profile = await profileService.getUserProfile(Number(targetUserId))
                await searchStore.updateConnection(targetUserId, {
                    ...profile.social,
                    is_connected: false,
                })
            }
        } catch (error) {
            console.error('[ConnectionHandler] Error handling connection rejected:', error)
        }
    }

    const handleConnectionRemoved = async (notification: Notification) => {
        try {
            const { companyId } = notification
            const targetUserId = notification.target_user_id || companyId

            if (isNewtwork.value) {
                await newtworkStore.networkRefreshKey++
            }

            if (isOnSearchPage.value) {
                const profile = await profileService.getUserProfile(Number(targetUserId))
                await searchStore.updateConnection(Number(targetUserId), {
                    ...profile.social,
                    is_connected: false,
                })
            }
        } catch (error) {
            console.error('[ConnectionHandler] Error handling connection removed:', error)
        }
    }

    const handleConnectionRequestCancel = async (notification: Notification) => {
        try {
            if (isNewtwork.value) {
                await newtworkStore.networkRefreshKey++
            }
        } catch (error) {
            console.error('[ConnectionHandler] Error handling connection request:', error)
        }
    }

    const handlers = new Map<string, (notification: Notification) => Promise<void>>([
        ['connection_request_received', handleConnectionRequestReceived],
        ['connection_request_accepted', handleConnectionRequestAccepted],
        ['connection_request_rejected', handleConnectionRequestRejected],
        ['connection_request_rejected', handleConnectionRequestRejected],
        ['connection_request_cancelled', handleConnectionRequestCancel],
        ['connection_removed', handleConnectionRemoved],
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
