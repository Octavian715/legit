// ~/plugins/04_plan_change_handler.client.ts

export default defineNuxtPlugin((nuxtApp) => {
    const userStore = useUserStore()
    const router = useRouter()
    const route = useRoute()
    const localePath = useLocalePath()
    const { emitPlanChange } = usePlanChangeEvents()
    const Toast = defineAsyncComponent(() => import('~/components/ui/Toast.vue'))

    // ✅ FIX: Access i18n from nuxtApp instead of useI18n()
    const i18n = nuxtApp.$i18n
    const t = (key: string, fallback?: string) => {
        try {
            return i18n.t(key)
        } catch {
            return fallback || key
        }
    }

    // ✅ FIX: Access toast from nuxtApp instead of useToastNotification()
    const showWarning = (message: string) => {
        try {
            if (nuxtApp.$toast && typeof nuxtApp.$toast === 'function') {
                // Use toast if available
                nuxtApp.$toast(
                    {
                        component: Toast,
                        props: {
                            title: 'Warning',
                            type: 'warning',
                            message,
                        },
                    },
                    {
                        timeout: 4000,
                        position: 'top-right',
                        hideProgressBar: true,
                    }
                )
            }
        } catch (error) {
            console.error('[Plan Change] Toast error:', error)
        }
    }

    // ============================================
    // ROUTE TO FEATURE MAPPING
    // ============================================
    const routeFeatureMap: Record<string, string> = {
        // Supplier routes
        '/supplier/dashboard/orders': 'orders_dashboard',
        '/supplier/orders/overview': 'orders_overview',
        '/supplier/orders/all': 'orders_all',
        '/supplier/orders/create': 'orders_create',
        '/supplier/dashboard/buyers': 'buyers_overview',
        '/supplier/buyers/overview': 'buyers_overview',
        '/supplier/buyers/all': 'buyers_all',
        '/supplier/products/features': 'products_features',
        '/supplier/sales': 'sales_dashboard',
        '/supplier/documents': 'documents_all',
        '/supplier/documents/all': 'documents_all',
        '/supplier/documents/create': 'documents_add',

        // Buyer routes
        '/buyer/dashboard/suppliers': 'suppliers_overview',
        '/buyer/suppliers/overview': 'suppliers_overview',
        '/buyer/suppliers/all': 'suppliers_all',
        '/buyer/products': 'products_overview_buyer',
        '/buyer/products/all': 'products_all_buyer',
        '/buyer/products/features': 'products_features',
        '/buyer/documents': 'documents_all_buyer',
        '/buyer/documents/all': 'documents_all_buyer',
    }

    // ============================================
    // HELPER FUNCTIONS
    // ============================================

    const getRequiredFeature = (path: string): string | null => {
        for (const [routePrefix, feature] of Object.entries(routeFeatureMap)) {
            if (path.startsWith(routePrefix)) {
                return feature
            }
        }
        return null
    }

    const hasAccessToCurrentRoute = (): boolean => {
        const requiredFeature = getRequiredFeature(route.path)
        if (!requiredFeature) return true
        return userStore.canAccess(requiredFeature)
    }

    const getDashboardPath = (): string => {
        const role = userStore.primaryRole
        if (role === 'supplier') return localePath('/supplier/dashboard')
        if (role === 'buyer') return localePath('/buyer/dashboard')
        if (role === 'admin') return localePath('/admin/dashboard')
        return localePath('/')
    }

    const isMarketplaceLikePage = (): boolean => {
        const path = route.path
        return (
            path.startsWith('/marketplace') ||
            path.startsWith('/search') ||
            path.startsWith('/products/') ||
            path === '/products' ||
            path === '/favorites' ||
            path.startsWith('/favorites')
        )
    }

    const redirectToDashboard = async (reason: 'downgrade' | 'expired' = 'downgrade') => {
        const dashboardPath = getDashboardPath()

        if (reason === 'downgrade') {
            showWarning(
                t(
                    'subscription.featureNoLongerAvailable',
                    'This feature is no longer available with your current plan. You have been redirected to your dashboard.'
                )
            )
        } else if (reason === 'expired') {
            showWarning(
                t(
                    'subscription.subscriptionExpired',
                    'Your subscription has expired. Please renew to access premium features.'
                )
            )
        }

        await nextTick()
        await router.push(dashboardPath)
    }

    // ============================================
    // MAIN WATCHER - Detects plan changes
    // ============================================

    watch(
        () => userStore.plan,
        async (newPlan, oldPlan) => {
            // Skip if plan hasn't actually changed
            if (!oldPlan || newPlan === oldPlan) return

            // Skip if user not authenticated
            if (!userStore.isAuthenticated) return

            // Skip if registration not complete
            if (!userStore.isRegistrationComplete) return

            // ============================================
            // HANDLE MARKETPLACE/SEARCH PAGES
            // ============================================
            if (isMarketplaceLikePage()) {
                await new Promise((resolve) => setTimeout(resolve, 300))

                // ✅ EMIT EVENT instead of page refresh!
                // Components listening to this will re-fetch their data
                emitPlanChange(oldPlan, newPlan)

                return
            }

            // ============================================
            // HANDLE RESTRICTED PAGES
            // ============================================

            const hasAccess = hasAccessToCurrentRoute()

            if (!hasAccess) {
                await redirectToDashboard('downgrade')
                return
            }
        },
        { immediate: false }
    )

    // ============================================
    // WATCH SUBSCRIPTION STATUS (expired/cancelled)
    // ============================================

    watch(
        () => userStore.currentPlan,
        async (newPlan, oldPlan) => {
            if (!newPlan || !oldPlan) return

            const wasActive = !oldPlan.expires_at || new Date(oldPlan.expires_at) > new Date()
            const isExpired = newPlan.expires_at && new Date(newPlan.expires_at) < new Date()

            if (wasActive && isExpired) {
                const hasAccess = hasAccessToCurrentRoute()

                if (!hasAccess) {
                    await redirectToDashboard('expired')
                }
            }
        }
    )
})
