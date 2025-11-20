// ~/types/ui/planCard.ts
// Type definitions for PlanCard component

export interface PlanCardFeature {
    title: string
    text: string
    included: boolean
    hint?: string | null
}

export interface PlanCard {
    id: number
    title: string
    currency: string
    monthlyPrice: number
    oldPrice?: number | null
    discountPercentage?: number
    discountedPrice?: number
    highlighted: boolean
    label?: string | null
    features: PlanCardFeature[]
}

export interface PlanCardProps {
    plan: PlanCard
    isSelected?: boolean
    isCurrent?: boolean
    buttonLabel?: string
    disabled?: boolean
}

export interface PlanCardEmits {
    (e: 'select-plan', plan: PlanCard): void
}
