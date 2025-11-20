// ~/composables/useBlockedFeatureNotification.ts
// Handles notifications when user is redirected from blocked features

import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

/**
 * Composable to show notifications when user is redirected from blocked features
 * Usage: Call in dashboard pages to detect if user was redirected due to feature restriction
 */
export const useBlockedFeatureNotification = () => {
    const route = useRoute()
    const router = useRouter()
    const { warning } = useToastNotification()
    const { t } = useI18n()

    /**
     * Feature name to user-friendly message mapping
     */
    const featureMessages: Record<string, string> = {
        // Orders
        orders_dashboard: t('subscription.features.ordersDashboard'),
        orders_overview: t('subscription.features.ordersOverview'),
        orders_all: t('subscription.features.ordersAll'),
        orders_create: t('subscription.features.ordersCreate'),

        // Buyers
        buyers_overview: t('subscription.features.buyersOverview'),
        buyers_all: t('subscription.features.buyersAll'),
        buyers_invite: t('subscription.features.buyersInvite'),

        // Suppliers
        suppliers_overview: t('subscription.features.suppliersOverview'),
        suppliers_all: t('subscription.features.suppliersAll'),
        suppliers_invite: t('subscription.features.suppliersInvite'),

        // Products
        products_features: t('subscription.features.productFeatures'),
        products_overview_buyer: t('subscription.features.productsOverview'),
        products_all_buyer: t('subscription.features.productsAll'),

        // Documents
        documents_all: t('subscription.features.documentsAll'),
        documents_add: t('subscription.features.documentsAdd'),
        documents_all_buyer: t('subscription.features.documentsAll'),

        // Sales
        sales_dashboard: t('subscription.features.salesDashboard'),

        // Cart
        cart_checkout: t('subscription.features.cartCheckout'),
    }

    /**
     * Check if user was redirected from blocked feature
     */
    const checkBlockedFeature = () => {
        const blockedFeature = route.query.blocked as string | undefined

        if (blockedFeature) {
            // Get user-friendly message
            const featureName = featureMessages[blockedFeature] || t('subscription.thisFeature')

            // Show warning toast
            warning(
                t('subscription.featureNotAvailableWithName', {
                    feature: featureName,
                })
            )

            // Clean up query params (remove ?blocked=...)
            router.replace({
                query: {
                    ...route.query,
                    blocked: undefined,
                },
            })
        }
    }

    return {
        checkBlockedFeature,
    }
}
