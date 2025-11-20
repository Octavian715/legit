// stores/product.ts

import { defineStore, acceptHMRUpdate } from 'pinia'
import { ProductService } from '~/services/product'
import type {
    Product,
    ProductStep1Payload,
    ProductStatusResponse,
    ProductStaticData,
    ProductDirectEditPayload,
    ProductDirectEditResponse,
} from '~/types/product'
import type { ApiError } from '~/types/axios'

export const useProductStore = defineStore('product', () => {
    const productService = new ProductService()

    const currentProduct = ref<Product | null>(null)
    const productId = ref<number | null>(null)
    const stepProgress = ref<ProductStatusResponse | null>(null)
    const aiSuggestion = ref<any[]>([])
    const productStaticData = ref<ProductStaticData | null>(null)
    const isLoading = ref<boolean>(false)
    const error = ref<ApiError | null>(null)
    const lastFetch = ref<number | null>(null)

    const isFetchingProduct = ref<Record<number, boolean>>({})
    const isCreatingProduct = ref(false)
    const isDownloadingPDF = ref<Record<number, boolean>>({})
    const isSavingProductStep = ref<Record<string, boolean>>({})
    const isDirectEditingProduct = ref<Record<number, boolean>>({})
    const isDeletingProduct = ref<Record<number, boolean>>({})
    const isLoadingStaticDataFlag = ref(false)
    const isLoadingAISuggestionFlag = ref(false)

    const productStaticDataFetchedAt = ref<Date | null>(null)
    const isProductStaticDataLoading = ref<boolean>(false)
    const productStaticDataError = ref<string | null>(null)

    const fieldErrors = ref<Record<string, string | string[]>>({})
    const generalError = ref<string | null>(null)

    const currentStep = computed<number>(() => stepProgress.value?.current_step || 1)
    const nextStep = computed<number>(() => stepProgress.value?.next_step || 1)
    const isProductComplete = computed<boolean>(() => stepProgress.value?.is_complete || false)

    const hasFieldErrors = computed<boolean>(() => {
        const errors = fieldErrors.value
        return errors ? Object.keys(errors).length > 0 : false
    })

    const hasGeneralError = computed<boolean>(() => !!generalError.value)

    const hasAnyError = computed<boolean>(
        () => hasFieldErrors.value || hasGeneralError.value || !!error.value
    )

    const isProductLoading = (id: number): boolean => !!isFetchingProduct.value[id]
    const isDownloadLoading = (id: number): boolean => !!isDownloadingPDF.value[id]
    const isStepSaving = (id: number, step: number): boolean => {
        return !!isSavingProductStep.value[`${id}:${step}`]
    }
    const isDirectEditLoading = (id: number): boolean => {
        return !!isDirectEditingProduct.value[id]
    }
    const isProductDeleting = (id: number): boolean => !!isDeletingProduct.value[id]

    const getAdditionalFeatures = computed(() => productStaticData.value?.additional_features || [])
    const getAllergens = computed(() => productStaticData.value?.allergens || [])
    const getIncoterms = computed(() => productStaticData.value?.incoterms || [])
    const getKeywords = computed(() => productStaticData.value?.keywords || [])
    const getMaterials = computed(() => productStaticData.value?.materials || [])
    const getQuantityTypes = computed(() => productStaticData.value?.quantity_types || [])
    const getStorageConditions = computed(() => productStaticData.value?.storage_conditions || [])
    const getProductTypes = computed(() => productStaticData.value?.types || [])
    const getProductStatuses = computed(() => productStaticData.value?.statuses || [])
    const getCategories = computed(() => productStaticData.value?.categories || [])

    const isProductStaticDataLoaded = computed(() => productStaticData.value !== null)

    const getAdditionalFeatureByCode = computed(
        () => (code: string) =>
            getAdditionalFeatures.value.find((item) => item?.code === code) || null
    )
    const getAllergenByCode = computed(
        () => (code: string) => getAllergens.value.find((item) => item?.code === code) || null
    )
    const getIncotermByCode = computed(
        () => (code: string) => getIncoterms.value.find((item) => item?.code === code) || null
    )
    const getKeywordByCode = computed(
        () => (code: string) => getKeywords.value.find((item) => item?.code === code) || null
    )
    const getMaterialByCode = computed(
        () => (code: string) => getMaterials.value.find((item) => item?.code === code) || null
    )
    const getQuantityTypeByCode = computed(
        () => (code: string) => getQuantityTypes.value.find((item) => item?.code === code) || null
    )
    const getStorageConditionByCode = computed(
        () => (code: string) =>
            getStorageConditions.value.find((item) => item?.code === code) || null
    )
    const getProductTypeByCode = computed(
        () => (code: string) => getProductTypes.value.find((item) => item?.code === code) || null
    )
    const getProductStatusByCode = computed(
        () => (code: string) => getProductStatuses.value.find((item) => item?.code === code) || null
    )

    const resetError = () => {
        error.value = null
        generalError.value = null
        fieldErrors.value = {}
        productStaticDataError.value = null
    }

    const handleError = (e: any) => {
        console.error('🔴 Product Store Error:', {
            statusCode: e.statusCode,
            message: e.message,
            data: e.data,
            errors: e.data?.errors,
        })

        const apiError: ApiError = {
            message: e.message || e.data?.message || 'An error occurred',
            errors: e.data?.errors || {},
            statusCode: e.statusCode || 500,
        }

        error.value = apiError

        if (e.statusCode === 422 && e.data?.errors && typeof e.data.errors === 'object') {
            const convertedErrors: Record<string, string | string[]> = {}
            const backendErrors = e.data.errors

            Object.keys(backendErrors).forEach((key) => {
                const errorValue = backendErrors[key]

                convertedErrors[key] = errorValue

                const camelCaseKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
                if (camelCaseKey !== key) {
                    convertedErrors[camelCaseKey] = errorValue
                }
            })

            fieldErrors.value = convertedErrors
            generalError.value = null
        } else if (e.statusCode === 400) {
            generalError.value = e.data?.message || e.message || 'Bad Request'
            fieldErrors.value = {}
        } else {
            generalError.value = apiError.message
            fieldErrors.value = {}
        }

        throw apiError
    }

    const clearAllErrors = () => {
        error.value = null
        generalError.value = null
        fieldErrors.value = {}
        productStaticDataError.value = null
    }

    const clearFieldErrors = () => {
        fieldErrors.value = {}
    }

    const clearFieldError = (fieldName: string) => {
        if (!fieldErrors.value || !fieldErrors.value[fieldName]) {
            return
        }

        const newErrors = { ...fieldErrors.value }
        delete newErrors[fieldName]

        const snakeCaseField = fieldName.replace(/([A-Z])/g, '_$1').toLowerCase()
        if (snakeCaseField !== fieldName && newErrors[snakeCaseField]) {
            delete newErrors[snakeCaseField]
        }

        fieldErrors.value = newErrors
    }

    const getFieldError = (fieldName: string): string | null => {
        const errors = fieldErrors.value
        if (!errors) return null

        const fieldError = errors[fieldName]
        if (fieldError) {
            return Array.isArray(fieldError) ? fieldError[0] : fieldError
        }

        const snakeCaseField = fieldName.replace(/([A-Z])/g, '_$1').toLowerCase()
        const snakeError = errors[snakeCaseField]
        if (snakeError) {
            return Array.isArray(snakeError) ? snakeError[0] : snakeError
        }

        return null
    }

    const fetchProductStatus = async (id: number, force = false) => {
        if (isFetchingProduct.value[id] && !force) {
            return
        }

        if (!force && lastFetch.value && Date.now() - lastFetch.value < 1000) {
            return
        }

        isFetchingProduct.value = { ...isFetchingProduct.value, [id]: true }
        isLoading.value = true
        resetError()

        try {
            const productData = await productService.fetchProductStatus(id)

            // ✅ LOGGING CRITICAL: Verifică dacă prices există

            currentProduct.value = productData.product
            productId.value = productData.product?.id || id
            stepProgress.value = productData
            lastFetch.value = Date.now()
        } catch (e: any) {
            console.error('❌ Failed to fetch product status:', e)
            handleError(e)
            currentProduct.value = null
            stepProgress.value = null
        } finally {
            const newFetching = { ...isFetchingProduct.value }
            delete newFetching[id]
            isFetchingProduct.value = newFetching
            isLoading.value = false
        }
    }

    const createProduct = async (payload: ProductStep1Payload) => {
        isCreatingProduct.value = true
        resetError()

        try {
            const response = await productService.createProduct(payload)
            currentProduct.value = response.product
            productId.value = response.product?.id || null
            stepProgress.value = response

            throw new Error('Invalid create product response')
        } catch (e: any) {
            console.error('❌ Failed to create product:', e)
            handleError(e)
            throw e
        } finally {
            isCreatingProduct.value = false
        }
    }

    const updateProductStep = async (id: number, step: number, data: any) => {
        const loadingKey = `${id}:${step}`
        isSavingProductStep.value = { ...isSavingProductStep.value, [loadingKey]: true }
        resetError()

        try {
            const response = await productService.updateProductStep(id, step, data)

            if (response.product) {
                currentProduct.value = { ...currentProduct.value, ...response.product }
            }
            stepProgress.value = response
            currentProduct.value = response.product || currentProduct.value

            return response
        } catch (e: any) {
            console.error('❌ Failed to update product step:', {
                productId: id,
                step,
                error: e,
            })
            handleError(e)
            throw e
        } finally {
            const newSaving = { ...isSavingProductStep.value }
            delete newSaving[loadingKey]
            isSavingProductStep.value = newSaving
        }
    }

    const fetchProductPDF = async (id: number, brandName: string, originalTitle: string) => {
        isDownloadingPDF.value = { ...isDownloadingPDF.value, [id]: true }
        resetError()

        try {
            const blob = await productService.downloadProductPDF(id, brandName, originalTitle)
            return blob
        } catch (e: any) {
            console.error('❌ Failed to download PDF:', e)
            handleError(e)
            throw e
        } finally {
            const newDownload = { ...isDownloadingPDF.value }
            delete newDownload[id]
            isDownloadingPDF.value = newDownload
        }
    }

    const directEditProduct = async (
        id: number,
        payload: ProductDirectEditPayload
    ): Promise<ProductDirectEditResponse | null> => {
        isDirectEditingProduct.value = { ...isDirectEditingProduct.value, [id]: true }
        isLoading.value = true
        resetError()

        try {
            const response = await productService.directEditProduct(id, payload)

            if (currentProduct.value?.id === id) {
                currentProduct.value = { ...currentProduct.value, ...response }
            }

            return response
        } catch (e: any) {
            console.error('❌ Failed to direct edit product:', e)
            handleError(e)
            return null
        } finally {
            const newEditing = { ...isDirectEditingProduct.value }
            delete newEditing[id]
            isDirectEditingProduct.value = newEditing
            isLoading.value = false
        }
    }

    const deleteProduct = async (id: number): Promise<boolean> => {
        isDeletingProduct.value = { ...isDeletingProduct.value, [id]: true }
        resetError()

        try {
            const result = await productService.deleteProduct(id)

            if (result.success) {
                if (currentProduct.value?.id === id) {
                    currentProduct.value = null
                    productId.value = null
                }

                return true
            }

            return false
        } catch (e: any) {
            console.error('❌ Failed to delete product:', e)
            handleError(e)
            return false
        } finally {
            const newDeleting = { ...isDeletingProduct.value }
            delete newDeleting[id]
            isDeletingProduct.value = newDeleting
        }
    }
    const loadProductStaticDataFromStorage = (): boolean => {
        if (!process.client) return false

        try {
            const storedData = localStorage.getItem('productStaticData')
            const storedTimestamp = localStorage.getItem('productStaticDataFetchedAt')

            if (storedData && storedTimestamp) {
                productStaticData.value = JSON.parse(storedData)
                productStaticDataFetchedAt.value = new Date(storedTimestamp)
                return true
            }
        } catch (error) {
            console.error('❌ Error loading product static data from localStorage:', error)
        }
        return false
    }

    const isProductStaticDataExpired = (hours: number = 2): boolean => {
        if (!productStaticDataFetchedAt.value) return true

        const expirationTime = new Date()
        expirationTime.setHours(expirationTime.getHours() - hours)

        return productStaticDataFetchedAt.value < expirationTime
    }

    const saveProductStaticDataToStorage = (data: ProductStaticData, timestamp: Date) => {
        if (!process.client) return

        try {
            localStorage.setItem('productStaticData', JSON.stringify(data))
            localStorage.setItem('productStaticDataFetchedAt', timestamp.toISOString())
        } catch (error) {
            console.error('❌ Error saving product static data to localStorage:', error)
        }
    }

    const fetchProductStaticData = async (force = false) => {
        if (!force && productStaticData.value && !isProductStaticDataExpired()) {
            return
        }

        if (!force && loadProductStaticDataFromStorage() && !isProductStaticDataExpired()) {
            return
        }

        if (isProductStaticDataLoading.value && !force) {
            while (isProductStaticDataLoading.value) {
                await new Promise((resolve) => setTimeout(resolve, 100))
            }
            return
        }

        isProductStaticDataLoading.value = true
        isLoadingStaticDataFlag.value = true
        productStaticDataError.value = null

        try {
            const response = await productService.fetchStaticData()
            const fetchedAt = new Date()

            if (!response || typeof response !== 'object') {
                throw new Error('Invalid static data response')
            }

            const transformedData: ProductStaticData = {
                additional_features: Array.isArray(response.additional_features)
                    ? response.additional_features
                    : [],
                allergens: Array.isArray(response.allergens) ? response.allergens : [],
                incoterms: Array.isArray(response.incoterms) ? response.incoterms : [],
                keywords: Array.isArray(response.keywords) ? response.keywords : [],
                materials: Array.isArray(response.materials) ? response.materials : [],
                quantity_types: Array.isArray(response.quantity_types)
                    ? response.quantity_types.map((item: any) => ({
                          id: item?.id || 0,
                          code: item?.symbol || item?.code || 'unknown',
                          name: item?.name || 'Unknown',
                      }))
                    : [],
                storage_conditions: Array.isArray(response.storage_conditions)
                    ? response.storage_conditions
                    : [],
                types: Array.isArray(response.types) ? response.types : [],
                statuses: Array.isArray(response.statuses) ? response.statuses : [],
                categories: Array.isArray(response.categories) ? response.categories : [],
            }

            productStaticData.value = transformedData
            productStaticDataFetchedAt.value = fetchedAt

            saveProductStaticDataToStorage(transformedData, fetchedAt)
        } catch (e: any) {
            const errorMessage = e.message || 'Failed to load product static data'
            console.error('❌ Error fetching product static data:', e)
            productStaticDataError.value = errorMessage

            if (!productStaticData.value) {
                productStaticData.value = {
                    additional_features: [],
                    allergens: [],
                    incoterms: [],
                    keywords: [],
                    materials: [],
                    quantity_types: [],
                    storage_conditions: [],
                    types: [],
                    statuses: [],
                    categories: [],
                }
            }
        } finally {
            isProductStaticDataLoading.value = false
            isLoadingStaticDataFlag.value = false
        }
    }

    const getAiSuggestions = async (id: number) => {
        isLoadingAISuggestionFlag.value = true
        resetError()

        try {
            const response = await productService.getAISuggestions(id)

            if (!Array.isArray(response)) {
                throw new Error('Invalid AI suggestions response')
            }

            aiSuggestion.value = response || []

            return response
        } catch (e: any) {
            console.error('❌ Failed to get AI suggestions:', e)
            handleError(e)
            throw e
        } finally {
            isLoadingAISuggestionFlag.value = false
        }
    }

    const resetAiSuggetions = () => {
        aiSuggestion.value = []
    }

    const resetFlow = () => {
        currentProduct.value = null
        productId.value = null
        stepProgress.value = null
        resetError()

        isFetchingProduct.value = {}
        isCreatingProduct.value = false
        isDownloadingPDF.value = {}
        isSavingProductStep.value = {}
        isDirectEditingProduct.value = {}
        isDeletingProduct.value = {}
    }

    const initializeProduct = async (id?: number) => {
        try {
            if (id) {
                await fetchProductStatus(id)
            }
            if (!productStaticData.value) {
                await fetchProductStaticData()
            }
        } catch (error) {
            console.error('❌ Error initializing product:', error)
        }
    }

    const preparePricingPayload = (data: any): any => {
        const payload: any = {}

        if (data.priceLocal !== undefined && data.priceLocal !== null) {
            payload.price_local = data.priceLocal
        }

        if (data.priceExport !== undefined && data.priceExport !== null) {
            payload.price_export = data.priceExport
        }

        if (Array.isArray(data.discounts)) {
            if (data.discounts.length === 0) {
                payload.discounts = []
            } else {
                payload.discounts = data.discounts.map((discount: any) => ({
                    price_type: discount.priceType || discount.price_type,
                    percentage: discount.percentage,
                    start_date: discount.startDate || discount.start_date,
                    end_date: discount.endDate || discount.end_date,
                }))
            }
        }

        return payload
    }

    if (process.client) {
        loadProductStaticDataFromStorage()
    }

    return {
        currentProduct,
        productId,
        stepProgress,
        productStaticData,
        isLoading,
        error,
        fieldErrors,
        generalError,
        aiSuggestion,
        productStaticDataFetchedAt,
        isProductStaticDataLoading,
        productStaticDataError,
        isFetchingProduct,
        isCreatingProduct,
        isDownloadingPDF,
        isSavingProductStep,
        isDirectEditingProduct,
        isDeletingProduct,
        isLoadingStaticDataFlag,
        isLoadingAISuggestionFlag,
        currentStep,
        nextStep,
        isProductComplete,
        hasFieldErrors,
        hasGeneralError,
        hasAnyError,
        getAdditionalFeatures,
        getAllergens,
        getIncoterms,
        getKeywords,
        getMaterials,
        getQuantityTypes,
        getStorageConditions,
        getProductTypes,
        getProductStatuses,
        getCategories,
        isProductStaticDataLoaded,
        getAdditionalFeatureByCode,
        getAllergenByCode,
        getIncotermByCode,
        getKeywordByCode,
        getMaterialByCode,
        getQuantityTypeByCode,
        getStorageConditionByCode,
        getProductTypeByCode,
        getProductStatusByCode,
        preparePricingPayload,
        isProductLoading,
        isDownloadLoading,
        isStepSaving,
        isDirectEditLoading,
        isProductDeleting,
        isProductStaticDataExpired,
        fetchProductStatus,
        createProduct,
        updateProductStep,
        fetchProductPDF,
        fetchProductStaticData,
        directEditProduct,
        deleteProduct,
        getAiSuggestions,
        resetAiSuggetions,
        resetFlow,
        initializeProduct,
        resetError,
        clearAllErrors,
        clearFieldErrors,
        clearFieldError,
        getFieldError,
    }
})

if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useProductStore, import.meta.hot))
}
