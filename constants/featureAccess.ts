// ~/constants/featureAccess.ts
// Feature access control based on subscription plans
// Based on LEMARKT_SUBSCRIPTION_PLANS.pdf

import type { UserRoleCode, PlanTier } from '~/types/auth'

/**
 * Feature names - tied to menu keys and route access
 */
export type FeatureName =
    // ============================================
    // COMMON FEATURES (All roles, all plans)
    // ============================================
    | 'platform_access'
    | 'feed'
    | 'dashboard_basic'
    | 'profile_view'
    | 'profile_edit'
    | 'networking' // Follow/Connect/Chat
    | 'chat'
    | 'favorites'
    | 'settings_all'
    | 'notifications'
    | 'search_basic'
    | 'search_companies'
    | 'support'
    | 'guide'
    | 'network_overview'
    | 'network_connections'
    | 'network_followers'
    | 'network_invitations'
    | 'invite_partner'

    // ============================================
    // COMING SOON / DISABLED FEATURES
    // ============================================
    | 'feature_coming_soon' // Feature that no plan has access to - for locking menu items

    // ============================================
    // MARKETPLACE & ECOMMERCE
    // ============================================
    | 'marketplace_access'
    | 'marketplace_show_my_products' // Supplier: show products in marketplace
    | 'marketplace_see_prices' // See prices in marketplace
    | 'search_show_my_products' // Supplier: show products in search
    | 'search_see_prices' // See prices in search
    | 'cart_checkout' // Cart & checkout functionality
    | 'templates' // Access templates

    // ============================================
    // SUPPLIER SPECIFIC FEATURES
    // ============================================
    // Orders
    | 'orders_dashboard' // Orders dashboard access
    | 'orders_overview' // Orders overview page
    | 'orders_all' // All orders list
    | 'orders_create' // Create new order

    // Buyers Management
    | 'buyers_overview' // Buyers overview page
    | 'buyers_all' // All buyers list
    | 'buyers_invite' // Invite buyers

    // Products
    | 'products_overview' // Products overview
    | 'products_add' // Add SKU
    | 'products_all' // All products list
    | 'products_prices' // Manage prices
    | 'products_features' // Product features/attributes

    // Sales & Documents
    | 'sales_dashboard' // Sales dashboard
    | 'documents_all' // View all documents
    | 'documents_add' // Create/add documents

    // ============================================
    // BUYER SPECIFIC FEATURES
    // ============================================
    // Suppliers Management
    | 'suppliers_overview' // Suppliers overview page
    | 'suppliers_all' // All suppliers list
    | 'suppliers_invite' // Invite suppliers

    // Products (Buyer view)
    | 'products_overview_buyer' // Products overview for buyer
    | 'products_all_buyer' // All products for buyer

    // Documents (Buyer)
    | 'documents_all_buyer' // View documents as buyer

/**
 * Feature access map: defines which features are available for each role + plan combination
 *
 * Special values:
 * - ['*'] = all features available
 * - Specific array = only listed features available
 */
export const featureAccessMap: Record<
    UserRoleCode,
    Partial<Record<PlanTier, FeatureName[] | ['*']>>
> = {
    // ================================================
    // SUPPLIER FEATURE ACCESS
    // ================================================
    supplier: {
        // Lite Plan (€49/month) - LIMITED ACCESS
        Startup: ['*'],
        Lite: [
            // Common features
            'platform_access',
            'feed',
            'dashboard_basic',
            'profile_view',
            'profile_edit',
            'networking',
            'chat',
            'favorites',
            'settings_all',
            'notifications',
            'search_basic',
            'search_companies',
            'support',
            'guide',
            'network_overview',
            'network_connections',
            'network_followers',
            'network_invitations',
            'invite_partner',

            // Marketplace - LIMITED
            'marketplace_access', // Can access marketplace
            // ❌ NO: marketplace_show_my_products
            // ❌ NO: marketplace_see_prices
            // ❌ NO: cart_checkout
            // ❌ NO: templates

            // Search - LIMITED
            // ❌ NO: search_show_my_products
            // ❌ NO: search_see_prices

            // Products - BASIC ONLY
            'products_overview',
            'products_add',
            'products_all',
            'products_prices',
            // ❌ NO: products_features

            // ❌ NO ORDERS ACCESS
            // ❌ NO BUYERS ACCESS
            // ❌ NO SALES ACCESS
            // ❌ NO DOCUMENTS ACCESS
        ],

        // Professional Plan (€99/month) - FULL ACCESS
        Professional: ['*'],

        // Enterprise Plan (€149+/month) - FULL ACCESS
        Enterprise: ['*'],
    },

    // ================================================
    // BUYER FEATURE ACCESS
    // ================================================
    buyer: {
        // Referral Plan (FREE) - FULL ACCESS
        // Buyers need full access to browse, purchase, and manage orders
        Startup: ['*'],
        referral: ['*'],

        // Lite Plan (€9.99/month) - FULL ACCESS
        Lite: ['*'],

        // Premium Plan (€49.99/month) - FULL ACCESS
        Premium: ['*'],
    },

    // ================================================
    // SERVICE PROVIDER (Future)
    // ================================================
    serviceProvider: {
        // Basic access for now
        access: [
            'platform_access',
            'feed',
            'dashboard_basic',
            'profile_view',
            'profile_edit',
            'networking',
            'chat',
            'settings_all',
            'notifications',
            'support',
            'guide',
        ],
    },

    // ================================================
    // ADMIN - FULL ACCESS TO EVERYTHING
    // ================================================
    admin: {
        Admin: ['*'],
    },
}

/**
 * Check if a feature is available for a given role and plan
 */
export const hasFeatureAccess = (
    role: UserRoleCode,
    plan: PlanTier,
    feature: FeatureName
): boolean => {
    const roleFeatures = featureAccessMap[role]
    if (!roleFeatures) return false

    const planFeatures = roleFeatures[plan]
    if (!planFeatures) return false

    // Check for wildcard (all features)
    if (planFeatures.includes('*' as FeatureName)) return true

    // Check for specific feature
    return planFeatures.includes(feature)
}

/**
 * Get all available features for a role and plan
 */
export const getAvailableFeatures = (role: UserRoleCode, plan: PlanTier): FeatureName[] | ['*'] => {
    const roleFeatures = featureAccessMap[role]
    if (!roleFeatures) return []

    const planFeatures = roleFeatures[plan]
    if (!planFeatures) return []

    return planFeatures
}

/**
 * Check if plan has full access (wildcard)
 */
export const hasFullAccess = (role: UserRoleCode, plan: PlanTier): boolean => {
    const features = getAvailableFeatures(role, plan)
    return features.includes('*' as FeatureName)
}

/**
 * Map menu keys to required features
 * Used by middleware to check route access
 */
export const menuKeyToFeature: Record<string, FeatureName> = {
    // Dashboard
    dashboard: 'dashboard_basic',

    // Orders
    orders: 'orders_dashboard',
    orders_overview: 'orders_overview',
    orders_all: 'orders_all',
    orders_create: 'orders_create',

    // Network - REMOVED (accessible for all plans, no need to check)
    // network: 'network_overview',
    // network_overview: 'network_overview',
    // network_connections: 'network_connections',
    // network_followers: 'network_followers',
    // network_invitations: 'network_invitations',

    // Buyers (Supplier)
    buyers: 'buyers_overview',
    buyers_overview: 'buyers_overview',
    buyers_all: 'buyers_all',
    buyers_invite: 'buyers_invite',

    // Suppliers (Buyer)
    suppliers: 'suppliers_overview',
    suppliers_overview: 'suppliers_overview',
    suppliers_all: 'suppliers_all',
    suppliers_invite: 'suppliers_invite',

    // Products - Main products pages accessible, only features restricted
    // products: 'products_overview', // REMOVED - accessible for all
    // products_overview: 'products_overview', // REMOVED
    // products_add: 'products_add', // REMOVED
    // products_all: 'products_all', // REMOVED
    // products_prices: 'products_prices', // REMOVED
    products_features: 'products_features', // ONLY THIS is restricted

    // Sales
    sales: 'sales_dashboard',

    // Inventory - Coming Soon
    inventory: 'feature_coming_soon',

    // Documents
    documents: 'documents_all',
    documents_all: 'documents_all',
    documents_add: 'documents_add',

    // Communication - REMOVED (accessible for all plans)
    // messenger: 'chat',
    // chat: 'chat',

    // Settings - settings is accessible for all plans
    // settings: 'settings_all', // REMOVED - accessible for all

    // Support & Guide - Coming Soon (locked for all users)
    support: 'feature_coming_soon',
    guide: 'feature_coming_soon',
}

/**
 * Get features that require upgrade for current plan
 * Useful for showing upgrade prompts
 */
export const getMissingFeatures = (
    role: UserRoleCode,
    currentPlan: PlanTier,
    targetPlan: PlanTier
): FeatureName[] => {
    const currentFeatures = getAvailableFeatures(role, currentPlan)
    const targetFeatures = getAvailableFeatures(role, targetPlan)

    // If current has wildcard, no missing features
    if (currentFeatures.includes('*' as FeatureName)) return []

    // If target has wildcard, return all possible features
    if (targetFeatures.includes('*' as FeatureName)) {
        // Return features not in current
        return Object.values(menuKeyToFeature)
    }

    // Return features in target but not in current
    return (targetFeatures as FeatureName[]).filter(
        (f) => !(currentFeatures as FeatureName[]).includes(f)
    )
}
