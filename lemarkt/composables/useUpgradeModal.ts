// ~/composables/useUpgradeModal.ts
// Global state management for upgrade/plan selection modal

import { ref } from 'vue'
import type { FeatureName } from '~/types/features'

// Global state (shared across all components)
const isModalOpen = ref(false)
const requestedFeature = ref<FeatureName | undefined>(undefined)
const modalContext = ref<'upgrade' | 'feature-locked' | 'general'>('general')

export const useUpgradeModal = () => {
    // ✅ TOP-LEVEL: Initialize composables at the top of setup
    const { warning } = useToastNotification()
    const { t } = useI18n()

    /**
     * Open upgrade modal
     */
    const openUpgradeModal = (
        feature?: FeatureName,
        context: 'upgrade' | 'feature-locked' | 'general' = 'feature-locked'
    ) => {
        requestedFeature.value = feature
        modalContext.value = context
        isModalOpen.value = true
    }

    /**
     * Close upgrade modal
     */
    const closeUpgradeModal = () => {
        isModalOpen.value = false
        requestedFeature.value = undefined
        modalContext.value = 'general'
    }

    /**
     * Show upgrade prompt with toast notification
     */
    const showUpgradePrompt = (feature: FeatureName) => {
        // Get feature-friendly name
        const featureName = getFeatureFriendlyName(feature, t)

        // Show toast
        warning(
            t('subscription.featureNotAvailableWithName', {
                feature: featureName,
            }) || `${featureName} is not available in your current plan. Please upgrade.`,
            t('subscription.upgradeRequired') || 'Upgrade Required'
        )

        // Open modal after short delay
        setTimeout(() => {
            openUpgradeModal(feature, 'feature-locked')
        }, 500)
    }

    /**
     * Get user-friendly feature name
     */
    const getFeatureFriendlyName = (
        feature: FeatureName,
        tFunc: (key: string) => string
    ): string => {
        const featureNames: Record<string, string> = {
            // Orders
            orders_dashboard: tFunc('subscription.features.ordersDashboard') || 'Orders Dashboard',
            orders_overview: tFunc('subscription.features.ordersOverview') || 'Orders Overview',
            orders_all: tFunc('subscription.features.ordersAll') || 'All Orders',
            orders_create: tFunc('subscription.features.ordersCreate') || 'Create Order',

            // Buyers
            buyers_overview: tFunc('subscription.features.buyersOverview') || 'Buyers Overview',
            buyers_all: tFunc('subscription.features.buyersAll') || 'All Buyers',
            buyers_invite: tFunc('subscription.features.buyersInvite') || 'Invite Buyers',

            // Suppliers
            suppliers_overview:
                tFunc('subscription.features.suppliersOverview') || 'Suppliers Overview',
            suppliers_all: tFunc('subscription.features.suppliersAll') || 'All Suppliers',
            suppliers_invite: tFunc('subscription.features.suppliersInvite') || 'Invite Suppliers',

            // Products
            products_features: tFunc('subscription.features.productFeatures') || 'Product Features',
            products_overview_buyer:
                tFunc('subscription.features.productsOverview') || 'Products Overview',
            products_all_buyer: tFunc('subscription.features.productsAll') || 'All Products',

            // Documents
            documents_all: tFunc('subscription.features.documentsAll') || 'Documents',
            documents_add: tFunc('subscription.features.documentsAdd') || 'Add Documents',

            // Sales
            sales_dashboard: tFunc('subscription.features.salesDashboard') || 'Sales Dashboard',

            // Cart
            cart_checkout: tFunc('subscription.features.cartCheckout') || 'Checkout',
        }

        return featureNames[feature] || feature
    }

    return {
        // State
        isModalOpen,
        requestedFeature,
        modalContext,

        // Actions
        openUpgradeModal,
        closeUpgradeModal,
        showUpgradePrompt,
        getFeatureFriendlyName: (feature: FeatureName) => getFeatureFriendlyName(feature, t),
    }
}
