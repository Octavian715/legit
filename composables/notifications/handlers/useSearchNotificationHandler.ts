import { onUnmounted } from 'vue'
import type { Notification } from '~/types/notifications'
import { useNotificationEventBus } from './useNotificationEventBus'
import { useSearchStore } from '~/stores/search'
import { ProfileService } from '~/services/profile'

export const useSearchNotificationHandler = () => {
    const profileService = new ProfileService()
    const eventBus = useNotificationEventBus()
    const searchStore = useSearchStore()
    const toast = useToastNotification()
    const route = useRoute()
    const isRegistered = ref(false)

    // Check if user is on search page
    const isOnSearchPage = computed(() => {
        return route.path.includes('/search/')
    })

    // Get current active tab from route
    const currentSearchTab = computed(() => {
        if (route.path.includes('/search/products')) return 'products'
        if (route.path.includes('/search/companies')) return 'companies'
        if (route.path.includes('/search/all')) return 'all'
        return null
    })

    // Debounce multiple updates
    const pendingUpdates = new Map<number, NodeJS.Timeout>()

    const scheduleUserUpdate = (userId: number, delay = 300) => {
        if (pendingUpdates.has(userId)) {
            clearTimeout(pendingUpdates.get(userId)!)
        }

        const timeout = setTimeout(async () => {
            await updateUserData(userId)
            pendingUpdates.delete(userId)
        }, delay)

        pendingUpdates.set(userId, timeout)
    }

    const scheduleProductUpdate = (productIds: number[], delay = 300) => {
        const key = -1 // Special key for product updates
        if (pendingUpdates.has(key)) {
            clearTimeout(pendingUpdates.get(key)!)
        }

        const timeout = setTimeout(async () => {
            await updateProductsData(productIds)
            pendingUpdates.delete(key)
        }, delay)

        pendingUpdates.set(key, timeout)
    }

    // Fetch and update user profile data in search results
    const updateUserData = async (userId: number) => {
        try {
            const userProfile = await profileService.getUserProfile(userId)

            if (!userProfile) {
                console.warn('[SearchHandler] ❌ No user profile returned for:', userId)
                return
            }

            if (!userProfile.social) {
                console.warn('[SearchHandler] ❌ User profile has no social data:', userId)
                return
            }

            // Update in store
            searchStore.updateUserInResults(userId, userProfile)
        } catch (error) {
            console.error('[SearchHandler] ❌ Error updating user data:', error)
        }
    }

    // Update products data in search results
    const updateProductsData = async (productIds: number[]) => {
        try {
            if (!productIds || productIds.length === 0) {
                return
            }

            await searchStore.refreshProductsInResults(productIds)
        } catch (error) {
            console.error('[SearchHandler] ❌ Error updating products:', error)
        }
    }

    // Remove deleted products from search results
    const removeProductsData = (productIds: number[]) => {
        try {
            if (!productIds || productIds.length === 0) return

            searchStore.removeProductsFromResults(productIds)
        } catch (error) {
            console.error('[SearchHandler] Error removing products:', error)
        }
    }

    // Handle follow notifications - only update user data
    const handleFollowNotification = async (notification: Notification) => {
        if (!isOnSearchPage.value) return

        try {
            const { userId, target_user_id } = notification
            const targetUserId = userId || target_user_id

            if (!targetUserId) return

            const tab = currentSearchTab.value

            // Update user in all tabs or specific tab
            if (tab === 'companies' || tab === 'all') {
                scheduleUserUpdate(Number(targetUserId))
            }
        } catch (error) {
            console.error('[SearchHandler] Error handling follow notification:', error)
        }
    }

    // Handle product notifications - update user AND products
    const handleProductNotification = async (notification: Notification) => {
        if (!isOnSearchPage.value) return

        try {
            const { productId, userId, companyId, affected_product_ids } = notification
            const tab = currentSearchTab.value

            // Only relevant for product tabs
            if (tab !== 'all' && tab !== 'products') return

            // Handle product deletion
            if (
                notification.type === 'product-deleted' ||
                notification.type === 'product_deleted'
            ) {
                const deleteIds = productId
                    ? [Number(productId)]
                    : affected_product_ids
                          ?.map((id: any) => Number(id))
                          .filter((id: number) => !isNaN(id)) || []

                if (deleteIds.length > 0) {
                    removeProductsData(deleteIds)
                }
                return
            }

            // Handle product updates
            const updateIds = productId
                ? [Number(productId)]
                : affected_product_ids
                      ?.map((id: any) => Number(id))
                      .filter((id: number) => !isNaN(id)) || []

            if (updateIds.length > 0) {
                scheduleProductUpdate(updateIds)
            }

            // Also update user data if userId or companyId is provided
            const targetUserId = userId || companyId
            if (targetUserId) {
                scheduleUserUpdate(Number(targetUserId))
            }
        } catch (error) {
            console.error('[SearchHandler] Error handling product notification:', error)
        }
    }

    // Handle cart notifications - update user AND products
    const handleCartNotification = async (notification: Notification) => {
        if (!isOnSearchPage.value) return

        try {
            const { affected_product_ids, userId, companyId } = notification
            const tab = currentSearchTab.value

            // Only relevant for product tabs
            if (tab !== 'all' && tab !== 'products') return

            // Update affected products
            if (affected_product_ids && Array.isArray(affected_product_ids)) {
                const productIds = affected_product_ids
                    .map((id: any) => Number(id))
                    .filter((id: number) => !isNaN(id) && id > 0)

                if (productIds.length > 0) {
                    scheduleProductUpdate(productIds)
                }
            }

            // Update user data if available
            const targetUserId = userId || companyId
            if (targetUserId) {
                scheduleUserUpdate(Number(targetUserId))
            }
        } catch (error) {
            console.error('[SearchHandler] Error handling cart notification:', error)
        }
    }

    // Map notification types to handlers
    // NOTE: Connection notifications are handled by useConnectionNotificationHandler
    const handlers = new Map<string, (notification: Notification) => Promise<void>>([
        // Follow notifications - only update user
        ['user_follow', handleFollowNotification],
        ['user_unfollow', handleFollowNotification],

        // Product notifications - update user AND products
        ['product-updated', handleProductNotification],
        ['product_updated', handleProductNotification],
        ['product-deleted', handleProductNotification],
        ['product_deleted', handleProductNotification],
        ['stock-notification', handleProductNotification],
        ['stock_notification', handleProductNotification],
        ['discount-offer', handleProductNotification],
        ['discount_offer', handleProductNotification],
        ['price-change', handleProductNotification],
        ['price_change', handleProductNotification],

        // Cart notifications - update user AND products
        ['cart_changed', handleCartNotification],
        ['cart_updated', handleCartNotification],
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

        // Clear pending updates
        pendingUpdates.forEach((timeout) => clearTimeout(timeout))
        pendingUpdates.clear()

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
