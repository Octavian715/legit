// composables/useProductStaticData.ts
import { computed, ref } from 'vue'
import { useProductStore } from '~/stores/product'
import type { ProductSelectOption } from '~/types/productStaticData'

export const useProductStaticData = () => {
    const productStore = useProductStore()
    const initializationPromise = ref<Promise<void> | null>(null)

    const initializeProductStaticData = async () => {
        if (process.client) {
            try {
                // Access computed as property (not function)
                const isExpired = productStore.isProductStaticDataExpired
                if (isExpired) {
                    await productStore.fetchProductStaticData()
                }
            } catch (error) {
                console.error('Failed to initialize product static data:', error)
            }
        }
    }

    // Initialize immediately but don't await in composable setup
    initializeProductStaticData().catch(console.error)

    // Raw data getters with null safety
    const additionalFeatures = computed(() => productStore.getAdditionalFeatures || [])
    const allergens = computed(() => productStore.getAllergens || [])
    const incoterms = computed(() => productStore.getIncoterms || [])
    const keywords = computed(() => productStore.getKeywords || [])
    const materials = computed(() => productStore.getMaterials || [])
    const quantityTypes = computed(() => productStore.getQuantityTypes || [])
    const storageConditions = computed(() => productStore.getStorageConditions || [])
    const productTypes = computed(() => productStore.getProductTypes || [])
    const productStatuses = computed(() => productStore.getProductStatuses || [])
    const categories = computed(() => productStore.getCategories || [])

    // State getters
    const isLoading = computed(() => productStore.isProductStaticDataLoading)
    const error = computed(() => productStore.productStaticDataError)
    const isLoaded = computed(() => productStore.isProductStaticDataLoaded)

    // Transform raw data to select options with ROBUST NULL CHECKS
    const transformToSelectOptions = <T>(
        data: T[] | null | undefined,
        config: {
            code: keyof T | ((item: T) => string)
            label: keyof T | ((item: T) => string)
            value: keyof T | ((item: T) => number)
            [key: string]: any
        }
    ): ProductSelectOption[] => {
        // CRITICAL: Guard against null/undefined data
        if (!data || !Array.isArray(data) || data.length === 0) {
            return []
        }

        try {
            return data.map((item) => {
                if (!item || typeof item !== 'object') {
                    console.warn('Invalid item in transformToSelectOptions:', item)
                    return {
                        code: 'unknown',
                        label: 'Unknown',
                        value: 0,
                    }
                }

                const getValue = (field: keyof T | ((item: T) => any)) => {
                    try {
                        return typeof field === 'function' ? field(item) : item[field]
                    } catch (err) {
                        console.warn('Error getting value for field:', field, err)
                        return ''
                    }
                }

                const result: ProductSelectOption = {
                    code: getValue(config.code) || 'unknown',
                    label: getValue(config.label) || 'Unknown',
                    value: getValue(config.value) || 0,
                }

                // Add additional fields safely
                Object.keys(config)
                    .filter((key) => !['code', 'label', 'value'].includes(key))
                    .forEach((key) => {
                        try {
                            result[key] = getValue(config[key])
                        } catch (err) {
                            console.warn(`Error adding field ${key}:`, err)
                        }
                    })

                return result
            })
        } catch (error) {
            console.error('Error in transformToSelectOptions:', error)
            return []
        }
    }

    // FORMATTED SELECT OPTIONS with loading guards
    const additionalFeatureOptions = computed(() => {
        if (isLoading.value || !isLoaded.value) return []
        return transformToSelectOptions(additionalFeatures.value, {
            code: 'code',
            label: 'name',
            value: 'id',
        })
    })

    const allergenOptions = computed(() => {
        if (isLoading.value || !isLoaded.value) return []
        return transformToSelectOptions(allergens.value, {
            code: 'code',
            label: 'name',
            value: 'id',
        })
    })

    const incotermOptions = computed(() => {
        if (isLoading.value || !isLoaded.value) return []
        return transformToSelectOptions(incoterms.value, {
            code: 'code',
            label: 'name',
            value: 'id',
        })
    })

    const keywordOptions = computed(() => {
        if (isLoading.value || !isLoaded.value) return []
        return transformToSelectOptions(keywords.value, {
            code: 'code',
            label: 'name',
            value: 'id',
        })
    })

    const materialOptions = computed(() => {
        if (isLoading.value || !isLoaded.value) return []
        return transformToSelectOptions(materials.value, {
            code: 'code',
            label: 'name',
            value: 'id',
        })
    })

    const quantityTypeOptions = computed(() => {
        if (isLoading.value || !isLoaded.value) return []
        return transformToSelectOptions(quantityTypes.value, {
            code: 'code',
            label: 'name',
            value: 'id',
        })
    })

    const storageConditionOptions = computed(() => {
        if (isLoading.value || !isLoaded.value) return []
        return transformToSelectOptions(storageConditions.value, {
            code: 'code',
            label: 'name',
            value: 'id',
        })
    })

    const productTypeOptions = computed(() => {
        if (isLoading.value || !isLoaded.value) return []
        return transformToSelectOptions(productTypes.value, {
            code: 'code',
            label: 'name',
            value: 'id',
        })
    })

    const productStatusOptions = computed(() => {
        if (isLoading.value || !isLoaded.value) return []
        return transformToSelectOptions(productStatuses.value, {
            code: 'code',
            label: 'name',
            value: 'id',
        })
    })

    // Helper methods for finding specific items with null safety
    const findAdditionalFeatureByCode = (code: string) => {
        if (!code || !isLoaded.value) return null
        return productStore.getAdditionalFeatureByCode?.(code) || null
    }

    const findAllergenByCode = (code: string) => {
        if (!code || !isLoaded.value) return null
        return productStore.getAllergenByCode?.(code) || null
    }

    const findIncotermByCode = (code: string) => {
        if (!code || !isLoaded.value) return null
        return productStore.getIncotermByCode?.(code) || null
    }

    const findKeywordByCode = (code: string) => {
        if (!code || !isLoaded.value) return null
        return productStore.getKeywordByCode?.(code) || null
    }

    const findMaterialByCode = (code: string) => {
        if (!code || !isLoaded.value) return null
        return productStore.getMaterialByCode?.(code) || null
    }

    const findQuantityTypeByCode = (code: string) => {
        if (!code || !isLoaded.value) return null
        return productStore.getQuantityTypeByCode?.(code) || null
    }

    const findStorageConditionByCode = (code: string) => {
        if (!code || !isLoaded.value) return null
        return productStore.getStorageConditionByCode?.(code) || null
    }

    const findProductTypeByCode = (code: string) => {
        if (!code || !isLoaded.value) return null
        return productStore.getProductTypeByCode?.(code) || null
    }

    const findProductStatusByCode = (code: string) => {
        if (!code || !isLoaded.value) return null
        return productStore.getProductStatusByCode?.(code) || null
    }

    // Re-fetch method
    const refetch = async (forceRefresh = false) => {
        try {
            initializationPromise.value = null // Reset promise to allow re-initialization
            await productStore.fetchProductStaticData(forceRefresh)
        } catch (error) {
            console.error('Error refetching product static data:', error)
            throw error
        }
    }

    // Check if data is expired
    const isExpired = computed(() => productStore.isProductStaticDataExpired?.() || false)

    // Get last fetch timestamp
    const lastFetchedAt = computed(() => productStore.productStaticDataFetchedAt || null)

    return {
        // Raw data
        additionalFeatures,
        allergens,
        incoterms,
        keywords,
        materials,
        quantityTypes,
        storageConditions,
        productTypes,
        productStatuses,

        // State
        isLoading,
        error,
        isLoaded,

        // Add staticData export
        staticData: computed(() => productStore.productStaticData),

        // SELECT OPTIONS - READY TO USE WITH NULL SAFETY
        additionalFeatureOptions,
        allergenOptions,
        incotermOptions,
        keywordOptions,
        materialOptions,
        quantityTypeOptions,
        storageConditionOptions,
        productTypeOptions,
        productStatusOptions,
        categories,
        // Helper methods
        findAdditionalFeatureByCode,
        findAllergenByCode,
        findIncotermByCode,
        findKeywordByCode,
        findMaterialByCode,
        findQuantityTypeByCode,
        findStorageConditionByCode,
        findProductTypeByCode,
        findProductStatusByCode,

        // Actions
        refetch,
        initialize: initializeProductStaticData,
        isExpired,
        lastFetchedAt,
    }
}
