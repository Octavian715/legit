// ~/composables/useFeatureAccess.ts
import { computed } from 'vue'
import { useUserStore } from '~/stores/user'
import { useRouter } from 'vue-router'
import { useLocalePath } from '#imports'
import type { UserRoleCode, PlanTier } from '~/types/auth'
import type { FeatureName } from '~/constants/featureAccess'
import {
    hasFeatureAccess,
    getAvailableFeatures,
    hasFullAccess,
    getMissingFeatures,
} from '~/constants/featureAccess'
import type { FeatureCheckResult, FeatureLockStatus } from '~/types/features'

export const useFeatureAccess = () => {
    const userStore = useUserStore()
    const router = useRouter()
    const localePath = useLocalePath()

    const { showUpgradePrompt: showUpgradeModalFn } = useUpgradeModal()

    // Current user data
    const currentRole = computed<UserRoleCode | null>(() => userStore.primaryRole)
    const currentPlan = computed<PlanTier>(() => userStore.plan)
    const isAuthenticated = computed(() => userStore.isAuthenticated)

    /**
     * Check if user has access to a specific feature
     */
    const canAccess = (feature: FeatureName): boolean => {
        if (!currentRole.value) return false
        return hasFeatureAccess(currentRole.value, currentPlan.value, feature)
    }

    /**
     * Check if user has full access (wildcard plan)
     */
    const hasFullPlanAccess = computed((): boolean => {
        if (!currentRole.value) return false
        return hasFullAccess(currentRole.value, currentPlan.value)
    })

    /**
     * Get all available features for current user
     */
    const availableFeatures = computed((): FeatureName[] | ['*'] => {
        if (!currentRole.value) return []
        return getAvailableFeatures(currentRole.value, currentPlan.value)
    })

    /**
     * Check if feature requires upgrade
     */
    const requiresUpgrade = (feature: FeatureName): boolean => {
        return !canAccess(feature)
    }

    /**
     * Get detailed check result for a feature
     */
    const checkFeature = (feature: FeatureName): FeatureCheckResult => {
        const hasAccess = canAccess(feature)

        return {
            hasAccess,
            feature,
            currentPlan: currentPlan.value,
            role: currentRole.value!,
            requiresUpgrade: !hasAccess,
            suggestedPlan: !hasAccess ? getSuggestedPlan() : undefined,
        }
    }

    /**
     * Get suggested upgrade plan
     */
    const getSuggestedPlan = (): PlanTier | undefined => {
        if (!currentRole.value) return undefined

        // Suggest next tier based on role
        if (currentRole.value === 'supplier') {
            if (currentPlan.value === 'Lite') return 'Professional'
            if (currentPlan.value === 'Professional') return 'Enterprise'
        }

        if (currentRole.value === 'buyer') {
            if (currentPlan.value === 'referral') return 'Lite'
            if (currentPlan.value === 'Lite') return 'Premium'
        }

        return undefined
    }

    /**
     * Get feature lock status with detailed reason
     */
    const getFeatureLockStatus = (feature: FeatureName): FeatureLockStatus => {
        // Check if authenticated
        if (!isAuthenticated.value) {
            return {
                isLocked: true,
                reason: 'role_mismatch',
                message: 'Please log in to access this feature',
                upgradeAvailable: false,
            }
        }

        // Check subscription status
        const subscription = userStore.currentPlan
        if (!subscription?.plan) {
            return {
                isLocked: true,
                reason: 'no_subscription',
                message: 'Please select a subscription plan to access this feature',
                upgradeAvailable: true,
                upgradeUrl: localePath('/settings/subscription'),
            }
        }

        // Check if expired
        if (subscription.expires_at) {
            const expiryDate = new Date(subscription.expires_at)
            if (expiryDate < new Date()) {
                return {
                    isLocked: true,
                    reason: 'expired_subscription',
                    message: 'Your subscription has expired. Please renew to continue.',
                    upgradeAvailable: true,
                    upgradeUrl: localePath('/settings/subscription'),
                }
            }
        }

        // Check feature access
        const hasAccess = canAccess(feature)
        if (!hasAccess) {
            return {
                isLocked: true,
                reason: 'plan_limitation',
                message: `This feature is not available in your ${currentPlan.value} plan`,
                upgradeAvailable: true,
                upgradeUrl: localePath('/settings/subscription'),
            }
        }

        // Feature is accessible
        return {
            isLocked: false,
            reason: 'plan_limitation', // Not really locked, but need a reason
            message: '',
            upgradeAvailable: false,
        }
    }

    /**
     * Get features that would be available with upgrade
     */
    const getUpgradeFeatures = (targetPlan: PlanTier): FeatureName[] => {
        if (!currentRole.value) return []
        return getMissingFeatures(currentRole.value, currentPlan.value, targetPlan)
    }

    /**
     * Show upgrade modal with feature context
     */
    const navigateToUpgrade = (feature?: FeatureName) => {
        if (feature) {
            // ✅ Use already initialized function
            showUpgradeModalFn(feature)
        } else {
            // Fallback to settings page if no feature specified
            router.push(localePath('/settings?tab=subscription'))
        }
    }

    /**
     * Show upgrade prompt (alias for better semantics)
     */
    const showUpgradePrompt = (feature: FeatureName) => {
        // ✅ Use already initialized function
        showUpgradeModalFn(feature)
    }

    /**
     * Check if user can access a route based on required feature
     */
    const canAccessRoute = (requiredFeature?: FeatureName): boolean => {
        if (!requiredFeature) return true
        return canAccess(requiredFeature)
    }

    /**
     * Guard function for route navigation
     */
    const guardRoute = (requiredFeature: FeatureName, fallbackPath?: string): boolean => {
        if (canAccess(requiredFeature)) return true

        // Redirect to fallback or upgrade page
        const redirectPath = fallbackPath || localePath(`settings?tab=subscription`)
        router.push(redirectPath)
        return false
    }

    return {
        // State
        currentRole,
        currentPlan,
        hasFullPlanAccess,
        availableFeatures,

        // Check functions
        canAccess,
        requiresUpgrade,
        checkFeature,
        getFeatureLockStatus,
        getUpgradeFeatures,
        canAccessRoute,

        // Actions
        navigateToUpgrade,
        showUpgradePrompt,
        guardRoute,
        getSuggestedPlan,
    }
}
