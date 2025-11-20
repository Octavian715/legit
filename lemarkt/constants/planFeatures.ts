/**
 * Get recommended plan for a given role
 * Returns the middle-tier plan code which is typically the best value
 */
export const getRecommendedPlan = (role: 'buyer' | 'supplier'): string => {
    if (role === 'buyer') return 'buyer-premium'
    return 'supplier-professional'
}

/**
 * Check if a plan is recommended for a role
 */
export const isRecommendedPlan = (planCode: string, role: 'buyer' | 'supplier'): boolean => {
    return planCode === getRecommendedPlan(role)
}
