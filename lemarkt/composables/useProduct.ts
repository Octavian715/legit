// composables/useProduct.ts

import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProductStore } from '~/stores/product'
import { useToastNotification } from '~/composables/useToastNotification'
import type {
    Product,
    ProductStep1Payload,
    ProductStatusResponse,
    ProductDirectEditPayload,
    ProductDirectEditResponse,
} from '~/types/product'

export const useProduct = () => {
    const productStore = useProductStore()
    const { t } = useI18n()
    const toast = useToastNotification()
    const loading = ref<{ [key: string]: boolean }>({})

    const setLoading = (key: string, state: boolean) => {
        loading.value[key] = state
    }

    const getProduct = async (id: number): Promise<boolean> => {
        setLoading('getProduct', true)
        try {
            await productStore.fetchProductStatus(id)
            return true
        } catch (error: any) {
            toast.error(error.message || t('product.fetchError'))
            return false
        } finally {
            setLoading('getProduct', false)
        }
    }

    const createNewProduct = async (
        data: ProductStep1Payload
    ): Promise<ProductStatusResponse | null> => {
        setLoading('createProduct', true)
        try {
            const response = await productStore.createProduct(data)
            toast.success(t('product.created'))
            return response || null
        } catch (error: any) {
            toast.error(error.message || t('product.createError'))
            return null
        } finally {
            setLoading('createProduct', false)
        }
    }

    const updateStep = async (id: number, step: number, data: any): Promise<boolean> => {
        setLoading(`updateStep_${id}_${step}`, true)
        try {
            await productStore.updateProductStep(id, step, data)
            toast.success(t('product.stepUpdated'))
            return true
        } catch (error: any) {
            toast.error(error.message || t('product.updateError'))
            return false
        } finally {
            setLoading(`updateStep_${id}_${step}`, false)
        }
    }

    const directEdit = async (
        id: number,
        payload: ProductDirectEditPayload
    ): Promise<ProductDirectEditResponse | null> => {
        if (!payload || Object.keys(payload).length === 0) {
            toast.error(t('product.validation.emptyPayload'))
            return null
        }

        setLoading(`directEdit_${id}`, true)
        try {
            const response = await productStore.directEditProduct(id, payload)

            return response || null
        } catch (error: any) {
            console.error('Direct edit error:', error)

            let errorMessage = t('product.directEdit.error')

            if (error.translationKey) {
                errorMessage = error.translationParams
                    ? t(error.translationKey, error.translationParams)
                    : t(error.translationKey)
            } else if (error.statusCode === 422) {
                errorMessage = t('product.directEdit.validationError')
            } else if (error.message && error.message.startsWith('product.')) {
                errorMessage = t(error.message)
            } else if (error.message) {
                errorMessage = error.message
            }

            toast.error(errorMessage)
            return null
        } finally {
            setLoading(`directEdit_${id}`, false)
        }
    }

    const updateProductProperty = async (
        id: number,
        payload: { status_id: number }
    ): Promise<any> => {
        if (!payload.status_id || payload.status_id <= 0) {
            toast.error(t('product.validation.statusRequired'))
            return null
        }

        setLoading(`updateProperty_${id}`, true)
        try {
            const response = await productStore.editProductProperty(id, payload)

            if (response) {
                toast.success(t('product.propertyUpdated'))
                return response
            } else {
                toast.error(t('product.updatePropertyError'))
                return null
            }
        } catch (error: any) {
            console.error('Update property error:', error)

            let errorMessage = t('product.updatePropertyError')

            if (error.translationKey) {
                errorMessage = error.translationParams
                    ? t(error.translationKey, error.translationParams)
                    : t(error.translationKey)
            } else if (error.statusCode === 422) {
                errorMessage = t('product.validation.invalidPropertyValue')
            } else if (error.message && error.message.startsWith('product.')) {
                errorMessage = t(error.message)
            } else if (error.message) {
                errorMessage = error.message
            }

            toast.error(errorMessage)
            return null
        } finally {
            setLoading(`updateProperty_${id}`, false)
        }
    }

    const bulkDirectEdit = async (
        id: number,
        updates: {
            prices?: ProductDirectEditPayload['prices']
            features?: number[]
            additionalFeatures?: number[]
            discounts?: ProductDirectEditPayload['discounts']
            statusId?: number
        }
    ): Promise<boolean> => {
        const payload: ProductDirectEditPayload = {}

        if (updates.prices) payload.prices = updates.prices
        if (updates.features) payload.feature_ids = updates.features
        if (updates.additionalFeatures) payload.additional_feature_ids = updates.additionalFeatures
        if (updates.discounts) payload.discounts = updates.discounts
        if (updates.statusId) payload.status_id = updates.statusId

        const result = await directEdit(id, payload)
        return result !== null
    }

    const updatePrices = async (
        id: number,
        prices: ProductDirectEditPayload['prices']
    ): Promise<boolean> => {
        if (!prices || prices.length === 0) {
            toast.error(t('product.validation.pricesRequired'))
            return false
        }

        const result = await directEdit(id, { prices })
        return result !== null
    }

    const updateFeatures = async (id: number, featureIds: number[]): Promise<boolean> => {
        if (!featureIds || featureIds.length === 0) {
            toast.error(t('product.validation.featuresRequired'))
            return false
        }

        const result = await directEdit(id, { feature_ids: featureIds })
        return result !== null
    }

    const updateDiscounts = async (
        id: number,
        discounts: ProductDirectEditPayload['discounts']
    ): Promise<boolean> => {
        if (!discounts || discounts.length === 0) {
            toast.error(t('product.validation.discountsRequired'))
            return false
        }

        const result = await directEdit(id, { discounts })
        return result !== null
    }

    const updatePropery = async (id: number, propery: any = {}): Promise<boolean> => {
        if (!Object.keys(propery)?.length) {
            toast.error(t('product.validation.statusRequired'))
            return false
        }

        const result = await directEdit(id, propery)
        return result !== null
    }

    const updateStatusOnly = async (id: number, statusId: number): Promise<boolean> => {
        if (!statusId || statusId <= 0) {
            toast.error(t('product.validation.statusRequired'))
            return false
        }

        setLoading(`updateStatus_${id}`, true)

        try {
            const response = await productStore.directEditProduct(id, { status_id: statusId })

            toast.success(t('product.directEdit.success'))
            return response !== null
        } catch (error: any) {
            let errorMessage = t('product.directEdit.error')

            if (error.code === 'VALIDATION_ERROR') {
                errorMessage = t('product.directEdit.validationError')
            } else if (error.code === 'AUTH_ERROR') {
                errorMessage = t('product.directEdit.authError')
            } else if (error.code === 'NETWORK_ERROR') {
                errorMessage = t('product.directEdit.networkError')
            } else if (error.translationKey) {
                errorMessage = error.translationParams
                    ? t(error.translationKey, error.translationParams)
                    : t(error.translationKey)
            } else if (error.message && error.message.startsWith('product.')) {
                errorMessage = t(error.message)
            } else if (error.message) {
                errorMessage = error.message
            }

            toast.error(errorMessage)
            return false
        } finally {
            setLoading(`updateStatus_${id}`, false)
        }
    }

    const downloadPDF = async (
        id: number,
        brandName: string,
        originalTitle: string
    ): Promise<boolean> => {
        setLoading(`downloadPDF_${id}`, true)
        try {
            await productStore.fetchProductPDF(id, brandName, originalTitle)
            toast.success(t('product.pdfDownloaded'))
            return true
        } catch (error: any) {
            toast.error(error.message || t('product.downloadError'))
            return false
        } finally {
            setLoading(`downloadPDF_${id}`, false)
        }
    }

    const refreshProduct = async (id?: number): Promise<boolean> => {
        if (!id && !productStore.productId) return false

        const productId = id || productStore.productId
        if (!productId) return false

        setLoading('refresh', true)
        try {
            await productStore.fetchProductStatus(productId, true)
            toast.success(t('product.refreshed'))
            return true
        } catch (error: any) {
            toast.error(error.message || t('product.refreshError'))
            return false
        } finally {
            setLoading('refresh', false)
        }
    }

    const loadStaticData = async (): Promise<boolean> => {
        setLoading('loadStaticData', true)
        try {
            await productStore.fetchProductStaticData()
            return true
        } catch (error: any) {
            toast.error(error.message || t('product.staticDataError'))
            return false
        } finally {
            setLoading('loadStaticData', false)
        }
    }

    const resetProductFlow = () => {
        productStore.resetFlow()
    }

    const getFieldError = (fieldName: string): string | null => {
        return productStore.getFieldError(fieldName)
    }

    const hasErrors = computed(() => productStore.hasAnyError)

    const isDownloadingPDF = (id: number): boolean => {
        return productStore.isDownloadLoading ? productStore.isDownloadLoading(id) : false
    }

    const isUpdatingStep = (id: number, step: number): boolean => {
        return productStore.isStepSaving ? productStore.isStepSaving(id, step) : false
    }

    const isDirectEditingProduct = (id: number): boolean => {
        return productStore.isDirectEditLoading ? productStore.isDirectEditLoading(id) : false
    }

    const isUpdatingProperty = (id: number): boolean => {
        return loading.value[`updateProperty_${id}`] || false
    }

    const validateDirectEditPayload = (
        payload: ProductDirectEditPayload
    ): { valid: boolean; errors: string[] } => {
        const errors: string[] = []

        if (payload.prices && Array.isArray(payload.prices)) {
            const priceTypes = new Set()
            payload.prices.forEach((price, index) => {
                if (!price.currency_id || price.currency_id <= 0) {
                    errors.push(t('product.validation.invalidCurrencyId', { index: index + 1 }))
                }
                if (!price.price || price.price <= 0 || price.price > 999999.99) {
                    errors.push(t('product.validation.invalidPrice', { index: index + 1 }))
                }
                if (!['local', 'export'].includes(price.price_type)) {
                    errors.push(t('product.validation.invalidPriceType', { index: index + 1 }))
                }
                priceTypes.add(price.price_type)
            })

            if (priceTypes.size !== 2) {
                errors.push(t('product.validation.bothPriceTypesRequired'))
            }
        }

        if (payload.discounts && Array.isArray(payload.discounts)) {
            const discountTypes = new Set()
            payload.discounts.forEach((discount, index) => {
                if (!discount.price_type || !['local', 'export'].includes(discount.price_type)) {
                    errors.push(
                        t('product.validation.invalidDiscountPriceType', { index: index + 1 })
                    )
                }
                if (!discount.percentage || discount.percentage <= 0 || discount.percentage > 100) {
                    errors.push(
                        t('product.validation.invalidDiscountPercentage', { index: index + 1 })
                    )
                }
                if (!discount.start_date) {
                    errors.push(
                        t('product.validation.discountStartDateRequired', { index: index + 1 })
                    )
                }
                if (discount.end_date && discount.end_date <= discount.start_date) {
                    errors.push(
                        t('product.validation.invalidDiscountEndDate', { index: index + 1 })
                    )
                }

                if (discountTypes.has(discount.price_type)) {
                    errors.push(t('product.validation.duplicateDiscountPriceType'))
                }
                discountTypes.add(discount.price_type)
            })
        }

        return {
            valid: errors.length === 0,
            errors,
        }
    }

    return {
        // Loading states
        isLoading: computed(() => Object.values(loading.value).some(Boolean)),
        loading,

        // Store data
        product: computed(() => productStore.currentProduct),
        productId: computed(() => productStore.productId),
        stepProgress: computed(() => productStore.stepProgress),
        staticData: computed(() => productStore.productStaticData),
        error: computed(() => productStore.error),
        fieldErrors: computed(() => productStore.fieldErrors),
        generalError: computed(() => productStore.generalError),

        // Store computed
        currentStep: computed(() => productStore.currentStep),
        nextStep: computed(() => productStore.nextStep),
        isProductComplete: computed(() => productStore.isProductComplete),
        hasFieldErrors: computed(() => productStore.hasFieldErrors),
        hasGeneralError: computed(() => productStore.hasGeneralError),
        hasErrors,

        // Loading checks with safe guards
        isLoadingProduct: (id: number) =>
            productStore.isProductLoading ? productStore.isProductLoading(id) : false,
        isDownloadingPDF,
        isUpdatingStep,
        isDirectEditingProduct,
        isUpdatingProperty,
        isCreatingProduct: computed(() => productStore.loadingStates?.isCreating || false),
        isLoadingStaticData: computed(
            () => productStore.loadingStates?.isLoadingStaticData || false
        ),

        // Methods
        getProduct,
        createNewProduct,
        updateStep,
        directEdit,
        updateProductProperty,
        bulkDirectEdit,
        updatePrices,
        updateFeatures,
        updateDiscounts,
        updatePropery,
        updateStatusOnly,
        downloadPDF,
        refreshProduct,
        loadStaticData,
        resetProductFlow,
        getFieldError,
        validateDirectEditPayload,

        // Store methods
        initializeProduct: productStore.initializeProduct,
        resetError: productStore.resetError,
    }
}
