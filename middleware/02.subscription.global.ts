// ~/middleware/02_subscription_global.ts
// Subscription status middleware
// Handles expired subscriptions and no-plan scenarios

export default defineNuxtRouteMiddleware((to) => {
    // Skip on server-side
    if (import.meta.server) return

    const userStore = useUserStore()
    const localePath = useLocalePath()
    const user = userStore.user

    // Skip if not authenticated
    if (!user) return

    // Skip if registration not complete
    if (!userStore.isRegistrationComplete) return

    // Skip auth routes
    const authRoutes = ['/login', '/register', '/forgot-password', '/logout']
    if (authRoutes.some((route) => to.path.startsWith(route))) return

    // Skip subscription page itself
    if (to.path.startsWith('/settings/subscription')) return

    // Get current plan
    const currentPlan = user?.current_plan

    // ================================================
    // SCENARIO 1: NO PLAN (current_plan.plan === null)
    // ================================================
    if (!currentPlan || !currentPlan.plan) {
        // EXCEPTION: Referral buyers (current_plan.referral === true)
        const isReferralBuyer = userStore.primaryRole === 'buyer' && currentPlan?.referral === true

        if (isReferralBuyer) {
            // Referral buyers have limited access but don't need to select plan
            return
        }

        // All other users without plan must select one
        const allowedPathsWithoutPlan = [
            '/settings', // Allow access to settings
            '/profile', // Allow profile view
            '/register/subscription', // Allow subscription selection during registration
        ]

        const isAllowed = allowedPathsWithoutPlan.some((path) => to.path.startsWith(path))

        if (!isAllowed) {
            // Redirect IMMEDIATELY to subscription selection
            // No toast - subscription page will show message
            return navigateTo(localePath('/settings/subscription?required=true'))
        }

        return
    }

    // ================================================
    // SCENARIO 2: EXPIRED SUBSCRIPTION
    // ================================================
    const subscriptionStatus = getSubscriptionStatus(currentPlan)

    if (subscriptionStatus === 'expired') {
        // Block ALL features except subscription management
        const allowedPaths = [
            '/settings/subscription',
            '/settings', // Allow base settings to redirect
            '/profile', // Allow profile view
        ]

        const isAllowed = allowedPaths.some((path) => to.path.startsWith(path))

        if (!isAllowed) {
            // Redirect IMMEDIATELY to subscription page
            // Subscription page will show expired message based on query param
            return navigateTo(localePath('/settings/subscription?expired=true'))
        }

        return
    }

    // ================================================
    // SCENARIO 3: CANCELLED SUBSCRIPTION
    // ================================================
    if (subscriptionStatus === 'cancelled') {
        // Cancelled users CAN still access features until expiry
        // Show warning banner (handled in component)
        return
    }

    // ================================================
    // SCENARIO 4: ACTIVE SUBSCRIPTION
    // ================================================
    // Continue to feature access checks (03_feature_access.global.ts)
})

/**
 * Get user subscription status
 */
function getSubscriptionStatus(currentPlan: any): 'active' | 'cancelled' | 'expired' | 'none' {
    if (!currentPlan || !currentPlan.plan) return 'none'

    const now = new Date()
    const expiresAt = currentPlan.expires_at ? new Date(currentPlan.expires_at) : null
    const cancelledAt = currentPlan.cancelled_at ? new Date(currentPlan.cancelled_at) : null

    // Check if expired
    if (expiresAt && now > expiresAt) {
        return 'expired'
    }

    // Check if cancelled (but not expired yet)
    if (cancelledAt && expiresAt && now < expiresAt) {
        return 'cancelled'
    }

    // Active subscription
    return 'active'
}
