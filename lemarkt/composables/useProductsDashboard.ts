import { useDashboardProductStore } from '~/stores/dashboardProduct'
import type { ProductOverviewFilters, NewProductsFilters } from '~/types/dashboardProduct'

export const useProductsDashboard = () => {
    const dashboardProductStore = useDashboardProductStore()
    const { t } = useI18n()

    const loadBuyerTotalProducts = async (
        filters: ProductOverviewFilters = {}
    ): Promise<boolean> => {
        try {
            await dashboardProductStore.fetchBuyerTotalProducts(filters)
            return true
        } catch (error: any) {
            console.error('Failed to load buyer total products:', error)
            return false
        }
    }

    const loadSupplierTotalProducts = async (
        filters: ProductOverviewFilters = {}
    ): Promise<boolean> => {
        try {
            await dashboardProductStore.fetchSupplierTotalProducts(filters)
            return true
        } catch (error: any) {
            console.error('Failed to load supplier total products:', error)
            return false
        }
    }

    const loadSupplierNewProducts = async (filters: NewProductsFilters = {}): Promise<boolean> => {
        try {
            await dashboardProductStore.fetchSupplierNewProducts(filters)
            return true
        } catch (error: any) {
            console.error('Failed to load supplier new products:', error)
            return false
        }
    }

    const loadBuyerProductFilters = async (): Promise<boolean> => {
        try {
            await dashboardProductStore.fetchBuyerProductFilters()
            return true
        } catch (error: any) {
            console.error('Failed to load buyer product filters:', error)
            return false
        }
    }

    const loadSupplierProductFilters = async (): Promise<boolean> => {
        try {
            await dashboardProductStore.fetchDashboardProductFilters()
            return true
        } catch (error: any) {
            console.error('Failed to load supplier product filters:', error)
            return false
        }
    }

    return {
        // State
        isLoading: computed(() => dashboardProductStore.isLoading),
        error: computed(() => dashboardProductStore.error),

        // Buyer data
        buyerTotalProducts: computed(() => dashboardProductStore.buyerTotalProducts),
        buyerProductFilters: computed(() => dashboardProductStore.buyerProductFilters),

        // Supplier data
        supplierTotalProducts: computed(() => dashboardProductStore.supplierTotalProducts),
        supplierNewProducts: computed(() => dashboardProductStore.supplierNewProducts),
        dashboardProductFilters: computed(() => dashboardProductStore.dashboardProductFilters),

        // Actions
        loadBuyerTotalProducts,
        loadSupplierTotalProducts,
        loadSupplierNewProducts,
        loadBuyerProductFilters,
        loadSupplierProductFilters,

        // Store actions
        clearCache: dashboardProductStore.clearCache,
        resetError: dashboardProductStore.resetError,
    }
}
