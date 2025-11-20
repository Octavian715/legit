import { defineStore } from 'pinia'
import type {
    ProductFeaturesListResponse,
    ProductPricesListResponse,
    ProductOverviewResponse,
    ProductStatsResponse,
    NewProductsResponse,
    SupplierBuyerStatsResponse,
    SupplierBuyerTableResponse,
    FeatureFilterOptions,
    PriceFilterOptions,
    SupplierFilterOptions,
    BuyerFilterOptions,
    SupplierBuyerFilters,
    ProductFeaturesFilters,
    ProductPricesFilters,
    ProductOverviewFilters,
    NewProductsFilters,
    SupplierBuyerStatsFilters,
    SupplierBuyerTableFilters,
    ProductWithFeatures,
    ProductWithPrices,
    SupplierBuyerTableItem,
    AllProductsResponse,
    AllProductsFilters,
    AllProductsItem,
} from '~/types/dashboardProduct'
import { DashboardProductService } from '~/services/dashboardProduct'

export const useDashboardProductStore = defineStore('dashboardProduct', () => {
    const service = new DashboardProductService()

    const productsWithFeatures = ref<ProductWithFeatures[]>([])
    const productsWithPrices = ref<ProductWithPrices[]>([])
    const supplierBuyerTableData = ref<SupplierBuyerTableItem[]>([])
    const allSupplierProducts = ref<AllProductsItem[]>([])
    const allBuyerProducts = ref<AllProductsItem[]>([])

    const productFeaturesMeta = ref<ProductFeaturesListResponse['meta'] | null>(null)
    const productPricesMeta = ref<ProductPricesListResponse['meta'] | null>(null)
    const supplierBuyerTableMeta = ref<SupplierBuyerTableResponse['meta'] | null>(null)
    const allSupplierProductsMeta = ref<AllProductsResponse['meta'] | null>(null)
    const allBuyerProductsMeta = ref<AllProductsResponse['meta'] | null>(null)

    const supplierTotalProducts = ref<ProductOverviewResponse | null>(null)
    const buyerTotalProducts = ref<ProductOverviewResponse | null>(null)
    const supplierNewProducts = ref<NewProductsResponse | null>(null)
    const dashboardProductStats = ref<ProductStatsResponse | null>(null)
    const buyerProductStats = ref<ProductStatsResponse | null>(null)

    const suppliersByBusinessType = ref<SupplierBuyerStatsResponse | null>(null)
    const suppliersByCountry = ref<SupplierBuyerStatsResponse | null>(null)
    const buyersByBusinessType = ref<SupplierBuyerStatsResponse | null>(null)
    const buyersByCountry = ref<SupplierBuyerStatsResponse | null>(null)

    const featureFilters = ref<FeatureFilterOptions | null>(null)
    const priceFilters = ref<PriceFilterOptions | null>(null)
    const dashboardProductFilters = ref<SupplierFilterOptions | null>(null)
    const buyerProductFilters = ref<BuyerFilterOptions | null>(null)
    const supplierBuyerFilters = ref<SupplierBuyerFilters | null>(null)

    const isLoading = ref(false)
    const error = ref<string | null>(null)

    const totalProductsWithFeatures = computed(() => productFeaturesMeta.value?.total || 0)
    const totalProductsWithPrices = computed(() => productPricesMeta.value?.total || 0)
    const totalSupplierBuyerItems = computed(() => supplierBuyerTableMeta.value?.total || 0)
    const totalSupplierProductsCount = computed(() => allSupplierProductsMeta.value?.total || 0)
    const totalBuyerProductsCount = computed(() => allBuyerProductsMeta.value?.total || 0)

    const supplierCurrency = computed(() => allSupplierProductsMeta.value?.currency)
    const buyerCurrency = computed(() => allBuyerProductsMeta.value?.currency)

    const canLoadMoreFeatures = computed(() => {
        const meta = productFeaturesMeta.value
        return meta ? meta.current_page < meta.last_page : false
    })

    const canLoadMorePrices = computed(() => {
        const meta = productPricesMeta.value
        return meta ? meta.current_page < meta.last_page : false
    })

    const canLoadMoreSupplierBuyerData = computed(() => {
        const meta = supplierBuyerTableMeta.value
        return meta ? meta.current_page < meta.last_page : false
    })

    const canLoadMoreSupplierProducts = computed(() => {
        const meta = allSupplierProductsMeta.value
        return meta ? meta.current_page < meta.last_page : false
    })

    const canLoadMoreBuyerProducts = computed(() => {
        const meta = allBuyerProductsMeta.value
        return meta ? meta.current_page < meta.last_page : false
    })

    const fetchProductsWithFeatures = async (filters: ProductFeaturesFilters = {}) => {
        isLoading.value = true
        error.value = null

        try {
            const response = await service.fetchProductsWithFeatures(filters)

            if (filters.page && filters.page > 1) {
                productsWithFeatures.value.push(...response.data)
            } else {
                productsWithFeatures.value = response.data
            }

            productFeaturesMeta.value = response.meta
            return response
        } catch (err: any) {
            error.value = err.message
            throw err
        } finally {
            isLoading.value = false
        }
    }

    const fetchAllDashboardProducts = async (filters: ProductFeaturesFilters = {}) => {
        isLoading.value = true
        error.value = null

        try {
            const response = await service.fetchAllDashboardProducts(filters)

            if (filters.page && filters.page > 1) {
                productsWithFeatures.value.push(...response.data)
            } else {
                productsWithFeatures.value = response.data
            }

            productFeaturesMeta.value = response.meta
            return response
        } catch (err: any) {
            error.value = err.message
            throw err
        } finally {
            isLoading.value = false
        }
    }

    const fetchProductsWithPrices = async (filters: ProductPricesFilters = {}) => {
        isLoading.value = true
        error.value = null

        try {
            const response = await service.fetchProductsWithPrices(filters)

            if (filters.page && filters.page > 1) {
                productsWithPrices.value.push(...response.data)
            } else {
                productsWithPrices.value = response.data
            }

            productPricesMeta.value = response.meta
            return response
        } catch (err: any) {
            error.value = err.message
            throw err
        } finally {
            isLoading.value = false
        }
    }

    const fetchAllSupplierProducts = async (filters: AllProductsFilters = {}) => {
        isLoading.value = true
        error.value = null

        try {
            const response = await service.fetchAllSupplierProducts(filters)

            if (filters.page && filters.page > 1) {
                allSupplierProducts.value.push(...response.data)
            } else {
                allSupplierProducts.value = response.data
            }

            allSupplierProductsMeta.value = response.meta
            return response
        } catch (err: any) {
            error.value = err.message
            throw err
        } finally {
            isLoading.value = false
        }
    }

    const fetchAllBuyerProducts = async (filters: AllProductsFilters = {}) => {
        isLoading.value = true
        error.value = null

        try {
            const response = await service.fetchAllBuyerProducts(filters)

            if (filters.page && filters.page > 1) {
                allBuyerProducts.value.push(...response.data)
            } else {
                allBuyerProducts.value = response.data
            }

            allBuyerProductsMeta.value = response.meta
            return response
        } catch (err: any) {
            error.value = err.message
            throw err
        } finally {
            isLoading.value = false
        }
    }

    const fetchSupplierBuyerTable = async (
        endpoint:
            | 'suppliers-business-type'
            | 'suppliers-country'
            | 'buyers-business-type'
            | 'buyers-country'
            | 'all-suppliers'
            | 'all-buyers',
        filters: SupplierBuyerTableFilters = {}
    ) => {
        isLoading.value = true
        error.value = null

        try {
            let response: SupplierBuyerTableResponse

            switch (endpoint) {
                case 'suppliers-business-type':
                    response = await service.fetchSuppliersBusinessTypeTable(filters)
                    break
                case 'suppliers-country':
                    response = await service.fetchSuppliersCountryTable(filters)
                    break
                case 'buyers-business-type':
                    response = await service.fetchBuyersBusinessTypeTable(filters)
                    break
                case 'buyers-country':
                    response = await service.fetchBuyersCountryTable(filters)
                    break
                case 'all-suppliers':
                    response = await service.fetchAllSuppliersTable(filters)
                    break
                case 'all-buyers':
                    response = await service.fetchAllBuyersTable(filters)
                    break
            }

            if (filters.page && filters.page > 1) {
                supplierBuyerTableData.value.push(...response.data)
            } else {
                supplierBuyerTableData.value = response.data
            }

            supplierBuyerTableMeta.value = response.meta
            return response
        } catch (err: any) {
            error.value = err.message
            throw err
        } finally {
            isLoading.value = false
        }
    }

    const fetchSupplierTotalProducts = async (filters: ProductOverviewFilters = {}) => {
        try {
            supplierTotalProducts.value = await service.fetchSupplierTotalProducts(filters)
        } catch (err: any) {
            error.value = err.message
            throw err
        }
    }

    const fetchBuyerTotalProducts = async (filters: ProductOverviewFilters = {}) => {
        try {
            buyerTotalProducts.value = await service.fetchBuyerTotalProducts(filters)
        } catch (err: any) {
            error.value = err.message
            throw err
        }
    }

    const fetchSupplierNewProducts = async (filters: NewProductsFilters = {}) => {
        try {
            supplierNewProducts.value = await service.fetchSupplierNewProducts(filters)
        } catch (err: any) {
            error.value = err.message
            throw err
        }
    }

    const fetchDashboardProductStats = async () => {
        try {
            dashboardProductStats.value = await service.fetchDashboardProductStats()
        } catch (err: any) {
            error.value = err.message
            throw err
        }
    }

    const fetchBuyerProductStats = async () => {
        try {
            buyerProductStats.value = await service.fetchBuyerProductStats()
        } catch (err: any) {
            error.value = err.message
            throw err
        }
    }

    const fetchSuppliersByBusinessType = async (filters: SupplierBuyerStatsFilters = {}) => {
        try {
            suppliersByBusinessType.value = await service.fetchSuppliersByBusinessType(filters)
        } catch (err: any) {
            error.value = err.message
            throw err
        }
    }

    const fetchSuppliersByCountry = async (filters: SupplierBuyerStatsFilters = {}) => {
        try {
            suppliersByCountry.value = await service.fetchSuppliersByCountry(filters)
        } catch (err: any) {
            error.value = err.message
            throw err
        }
    }

    const fetchBuyersByBusinessType = async (filters: SupplierBuyerStatsFilters = {}) => {
        try {
            buyersByBusinessType.value = await service.fetchBuyersByBusinessType(filters)
        } catch (err: any) {
            error.value = err.message
            throw err
        }
    }

    const fetchBuyersByCountry = async (filters: SupplierBuyerStatsFilters = {}) => {
        try {
            buyersByCountry.value = await service.fetchBuyersByCountry(filters)
        } catch (err: any) {
            error.value = err.message
            throw err
        }
    }

    const fetchFeatureFilters = async () => {
        try {
            featureFilters.value = await service.fetchFeatureFilters()
        } catch (err: any) {
            error.value = err.message
            throw err
        }
    }

    const fetchPriceFilters = async () => {
        try {
            priceFilters.value = await service.fetchPriceFilters()
        } catch (err: any) {
            error.value = err.message
            throw err
        }
    }

    const fetchDashboardProductFilters = async () => {
        try {
            dashboardProductFilters.value = await service.fetchDashboardProductFilters()
        } catch (err: any) {
            error.value = err.message
            throw err
        }
    }

    const fetchBuyerProductFilters = async () => {
        try {
            buyerProductFilters.value = await service.fetchBuyerProductFilters()
        } catch (err: any) {
            error.value = err.message
            throw err
        }
    }

    const fetchSupplierBuyerFilters = async (
        endpoint:
            | 'suppliers-business-type'
            | 'suppliers-country'
            | 'buyers-business-type'
            | 'buyers-country'
            | 'all-suppliers'
            | 'all-buyers'
    ) => {
        try {
            switch (endpoint) {
                case 'suppliers-business-type':
                    supplierBuyerFilters.value = await service.fetchSuppliersBusinessTypeFilters()
                    break
                case 'suppliers-country':
                    supplierBuyerFilters.value = await service.fetchSuppliersCountryFilters()
                    break
                case 'buyers-business-type':
                    supplierBuyerFilters.value = await service.fetchBuyersBusinessTypeFilters()
                    break
                case 'buyers-country':
                    supplierBuyerFilters.value = await service.fetchBuyersCountryFilters()
                    break
                case 'all-suppliers':
                    supplierBuyerFilters.value = await service.fetchAllSuppliersFilters()
                    break
                case 'all-buyers':
                    supplierBuyerFilters.value = await service.fetchAllBuyersFilters()
                    break
            }
        } catch (err: any) {
            error.value = err.message
            throw err
        }
    }

    const clearProductsWithFeatures = () => {
        productsWithFeatures.value = []
        productFeaturesMeta.value = null
    }

    const clearProductsWithPrices = () => {
        productsWithPrices.value = []
        productPricesMeta.value = null
    }

    const clearSupplierBuyerTable = () => {
        supplierBuyerTableData.value = []
        supplierBuyerTableMeta.value = null
    }

    const clearSupplierProducts = () => {
        allSupplierProducts.value = []
        allSupplierProductsMeta.value = null
    }

    const clearBuyerProducts = () => {
        allBuyerProducts.value = []
        allBuyerProductsMeta.value = null
    }

    const clearOverviewData = () => {
        supplierTotalProducts.value = null
        buyerTotalProducts.value = null
        supplierNewProducts.value = null
    }

    const clearSupplierBuyerStats = () => {
        suppliersByBusinessType.value = null
        suppliersByCountry.value = null
        buyersByBusinessType.value = null
        buyersByCountry.value = null
    }

    const clearFilters = () => {
        featureFilters.value = null
        priceFilters.value = null
        dashboardProductFilters.value = null
        buyerProductFilters.value = null
        supplierBuyerFilters.value = null
    }

    const clearCache = () => {
        clearProductsWithFeatures()
        clearProductsWithPrices()
        clearSupplierBuyerTable()
        clearSupplierProducts()
        clearBuyerProducts()
        clearOverviewData()
        clearSupplierBuyerStats()
        clearFilters()
    }

    const resetError = () => {
        error.value = null
    }

    return {
        productsWithFeatures,
        productsWithPrices,
        supplierBuyerTableData,
        allSupplierProducts,
        allBuyerProducts,
        productFeaturesMeta,
        productPricesMeta,
        supplierBuyerTableMeta,
        allSupplierProductsMeta,
        allBuyerProductsMeta,
        supplierTotalProducts,
        buyerTotalProducts,
        supplierNewProducts,
        dashboardProductStats,
        buyerProductStats,
        suppliersByBusinessType,
        suppliersByCountry,
        buyersByBusinessType,
        buyersByCountry,
        featureFilters,
        priceFilters,
        dashboardProductFilters,
        buyerProductFilters,
        supplierBuyerFilters,
        isLoading,
        error,
        totalProductsWithFeatures,
        totalProductsWithPrices,
        totalSupplierBuyerItems,
        totalSupplierProductsCount,
        totalBuyerProductsCount,
        supplierCurrency,
        buyerCurrency,
        canLoadMoreFeatures,
        canLoadMorePrices,
        canLoadMoreSupplierBuyerData,
        canLoadMoreSupplierProducts,
        canLoadMoreBuyerProducts,
        fetchProductsWithFeatures,
        fetchAllDashboardProducts,
        fetchProductsWithPrices,
        fetchAllSupplierProducts,
        fetchAllBuyerProducts,
        fetchSupplierBuyerTable,
        fetchSupplierTotalProducts,
        fetchBuyerTotalProducts,
        fetchSupplierNewProducts,
        fetchDashboardProductStats,
        fetchBuyerProductStats,
        fetchSuppliersByBusinessType,
        fetchSuppliersByCountry,
        fetchBuyersByBusinessType,
        fetchBuyersByCountry,
        fetchFeatureFilters,
        fetchPriceFilters,
        fetchDashboardProductFilters,
        fetchBuyerProductFilters,
        fetchSupplierBuyerFilters,
        clearProductsWithFeatures,
        clearProductsWithPrices,
        clearSupplierBuyerTable,
        clearSupplierProducts,
        clearBuyerProducts,
        clearOverviewData,
        clearSupplierBuyerStats,
        clearFilters,
        clearCache,
        resetError,
    }
})
