// ~/types/features.ts
// Feature access types for subscription plans

import type { UserRoleCode, PlanTier } from '~/types/auth'

/**
 * Feature names - exported from featureAccess for consistency
 */
export type { FeatureName } from '~/constants/featureAccess'

/**
 * Feature requirement for routes
 */
export interface FeatureRequirement {
    feature: string
    required: boolean
    fallbackRoute?: string
}

/**
 * Feature check result
 */
export interface FeatureCheckResult {
    hasAccess: boolean
    feature: string
    currentPlan: PlanTier
    role: UserRoleCode
    requiresUpgrade: boolean
    suggestedPlan?: PlanTier
}

/**
 * Upgrade suggestion
 */
export interface UpgradeSuggestion {
    currentPlan: PlanTier
    suggestedPlan: PlanTier
    missingFeatures: string[]
    benefits: string[]
    priceIncrease?: number
}

/**
 * Feature lock status
 */
export interface FeatureLockStatus {
    isLocked: boolean
    reason: 'plan_limitation' | 'expired_subscription' | 'no_subscription' | 'role_mismatch'
    message: string
    upgradeAvailable: boolean
    upgradeUrl?: string
}
