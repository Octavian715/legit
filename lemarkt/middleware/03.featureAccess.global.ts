// ~/middleware/03_feature_access.global.ts
// Feature-based access control middleware
// Checks if user has access to features based on subscription plan

export default defineNuxtRouteMiddleware((to) => {
    // Skip on server-side (run only on client)
    // if (import.meta.server) return

    const userStore = useUserStore()
    const localePath = useLocalePath()

    // Skip if not authenticated
    if (!userStore.isAuthenticated) return

    // Skip if registration not complete
    if (!userStore.isRegistrationComplete) return

    // Get role and plan early for all checks
    const role = userStore.primaryRole
    const plan = userStore.plan

    if (!role) {
        console.warn('[Feature Access] No role found for user')
        return
    }

    // ============================================
    // SPECIAL ROUTES WITH CONDITIONAL ACCESS
    // ============================================

    // Cart - Suppliers need cart_checkout feature
    if (to.path.startsWith('/cart')) {
        if (role === 'supplier' && !userStore.canAccess('cart_checkout')) {
            // Redirect IMMEDIATELY without loading page
            // Toast will be shown AFTER redirect in a separate check
            return navigateTo(localePath('/marketplace'))
        }
        // Buyers always have cart access
        return
    }

    // Marketplace - Allow access (public page)
    // Components will check show_my_products_marketplace feature
    if (to.path.startsWith('/marketplace')) {
        return
    }

    // Search - Allow access (public page)
    // Components will check show_my_products_search feature
    if (to.path.startsWith('/search')) {
        return
    }

    // Products - Allow access (public page)
    // Components will check marketplace_see_prices feature for price visibility
    if (to.path.startsWith('/products')) {
        return
    }

    // Favorites - Allow access (authenticated users)
    // Components will check marketplace_see_prices feature for price visibility
    if (to.path.startsWith('/favorites')) {
        return
    }

    // Skip fully public routes that don't require ANY feature checks
    const publicRoutes = ['/settings', '/support', '/guide', '/profile', '/feed', '/logout']

    if (publicRoutes.some((route) => to.path.startsWith(route))) {
        return
    }

    // Skip network routes (accessible for all plans)
    if (to.path.includes('/network/')) {
        return
    }

    // Skip chat routes (accessible for all plans)
    if (to.path.includes('/chat')) {
        return
    }

    // Define feature requirements for specific routes
    const routeFeatureMap: Record<string, string> = {
        // ============================================
        // SUPPLIER ROUTES
        // ============================================
        // Orders
        '/supplier/dashboard/orders': 'orders_dashboard',
        '/supplier/orders/overview': 'orders_overview',
        '/supplier/orders/all': 'orders_all',
        '/supplier/orders/create': 'orders_create',

        // Buyers
        '/supplier/dashboard/buyers': 'buyers_overview',
        '/supplier/buyers/overview': 'buyers_overview',
        '/supplier/buyers/all': 'buyers_all',

        // Products features (ONLY this subpath is restricted for supplier Lite)
        '/supplier/products/features': 'products_features',
        '/buyer/products/features': 'products_features',

        // Sales
        '/supplier/sales': 'sales_dashboard',

        // Documents
        '/supplier/documents': 'documents_all',
        '/supplier/documents/all': 'documents_all',
        '/supplier/documents/create': 'documents_add',

        // ============================================
        // BUYER ROUTES
        // ============================================
        // Suppliers
        '/buyer/dashboard/suppliers': 'suppliers_overview',
        '/buyer/suppliers/overview': 'suppliers_overview',
        '/buyer/suppliers/all': 'suppliers_all',

        // Products (buyer view)
        '/buyer/products': 'products_overview_buyer',
        '/buyer/products/all': 'products_all_buyer',

        // Documents (buyer)
        '/buyer/documents': 'documents_all_buyer',
        '/buyer/documents/all': 'documents_all_buyer',
    }

    // Check if current route requires a feature
    let requiredFeature: string | null = null

    for (const [routePrefix, feature] of Object.entries(routeFeatureMap)) {
        if (to.path.startsWith(routePrefix)) {
            requiredFeature = feature
            break
        }
    }

    // If no feature requirement found, allow access
    if (!requiredFeature) return

    // Check if user has access to required feature
    const hasAccess = userStore.canAccess(requiredFeature)

    if (!hasAccess) {
        // Dashboard will show the upgrade prompt/toast
        const dashboardPath = role === 'supplier' ? '/supplier/dashboard' : '/buyer/dashboard'

        return navigateTo(localePath(`${dashboardPath}?blocked=${requiredFeature}`))
    }

    // User has access, continue
})
