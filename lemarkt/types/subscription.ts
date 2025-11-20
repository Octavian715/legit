// ~/types/subscription.ts

export interface PlanFeature {
    name: string
    included: boolean
    hint?: string | null
    params?: Record<string, any>
}

export interface SubscriptionPlan {
    id: number
    code: string
    name: string
    price: string
    billing_cycle: 'monthly' | 'yearly'
    duration_months: number
    is_active: boolean
    role: {
        id: number
        code: string
        name: string
    }
    features: Array<{
        is_enabled: boolean
        name: string
    }>
}

export interface PlanOption {
    code?: string
    label: string
    value: number
    price: string
    billingCycle: string
    isActive: boolean
}

export interface PlanComparisonResult {
    onlyInPlan1: PlanFeature[]
    onlyInPlan2: PlanFeature[]
    inBoth: PlanFeature[]
}

export type PlanTier = 'free' | 'lite' | 'professional' | 'premium' | 'enterprise' | 'referral'
export type BillingCycle = 'monthly' | 'yearly'
export type UserRole = 'buyer' | 'supplier'
