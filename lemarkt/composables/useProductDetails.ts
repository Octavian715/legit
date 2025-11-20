// composables/useProductDetails.ts
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDate } from '~/composables/useDate'
import { useProductsStore } from '~/stores/products' // Ensure this points to the marketplace products store

interface UseProductDetailsOptions {
    productId: number | string
}

export const useProductDetails = (options: UseProductDetailsOptions) => {
    const { productId } = options
    const { t } = useI18n()
    const { formatDate } = useDate()
    const productsStore = useProductsStore() // This is now the marketplace products store

    // State from marketplace products store
    const product = computed(() => productsStore.currentProduct)
    const relatedProducts = computed(() => productsStore.relatedProducts)
    const error = computed(() => productsStore.singleProductError)
    const isLoading = computed(() => productsStore.isLoadingSingleProduct)
    const isLoadingRelated = computed(() => productsStore.isLoadingRelatedProducts)

    // Product computed properties
    const productName = computed(() => product.value?.name || '')
    const productBrand = computed(() => product.value?.brand || '')
    const productCategory = computed(() => product.value?.category?.name || '')
    const productStatus = computed(() => product.value?.status?.name || '')

    const productImages = computed(() => {
        const images = product.value?.images
        if (!images) return []

        const allImages = []

        if (images.primary?.url) {
            allImages.push({
                url: images.primary.url,
                isPrimary: true,
                id: images.primary.id,
            })
        }

        if (images.gallery && Array.isArray(images.gallery)) {
            images.gallery.forEach((img: any) => {
                if (img.url) {
                    allImages.push({
                        url: img.url,
                        isPrimary: false,
                        id: img.id,
                    })
                }
            })
        }

        return allImages
    })

    const primaryImage = computed(() => {
        return (
            productImages.value.find((img) => img.isPrimary)?.url ||
            productImages.value[0]?.url ||
            '/public/images/placeholder-product.svg'
        )
    })

    const galleryImages = computed(() => {
        return productImages.value.filter((img) => !img.isPrimary)
    })

    const productPrices = computed(() => {
        const prices = product.value?.prices || []
        const formattedPrices = prices.map((price: any) => ({
            ...price,
            formattedPrice: formatPrice(price.price, price.currency_id),
            type: price.price_type,
        }))

        return {
            local: formattedPrices.find((p) => p.type === 'local'),
            export: formattedPrices.find((p) => p.type === 'export'),
            all: formattedPrices,
        }
    })

    const hasDiscounts = computed(() => {
        return product.value?.discounts && product.value.discounts.length > 0
    })

    const productWeight = computed(() => {
        const weight = product.value?.weight
        if (!weight) return ''
        return `${weight.value} ${weight.symbol}`
    })

    const productOrigin = computed(() => {
        return product.value?.country_origin?.name || ''
    })

    const supplierInfo = computed(() => {
        const user = product.value?.user
        if (!user) return null

        return {
            id: user.id,
            companyName: user.company_details?.legal_name || user.company_details?.username,
            username: user.company_details?.username,
            verified: true, // You might have this info in user object
            rating: 0, // You might have this info in user object
        }
    })

    const productFeatures = computed(() => {
        const features = product.value?.features || []
        const additionalFeatures = product.value?.additional_features || []

        return [
            ...features.map((feature: any) => ({
                ...feature,
                type: 'feature',
            })),
            ...additionalFeatures.map((feature: any) => ({
                ...feature,
                type: 'additional_feature',
            })),
        ]
    })

    const productAllergens = computed(() => {
        return product.value?.allergens || []
    })

    const availabilityCountries = computed(() => {
        return product.value?.availability_countries || []
    })

    const businessTypes = computed(() => {
        return product.value?.business_types || []
    })

    const storageCondition = computed(() => {
        return product.value?.storage_condition?.name || ''
    })

    const shelfLifeDays = computed(() => {
        const days = product.value?.shelf_life_days
        if (!days) return ''

        if (days >= 365) {
            const years = Math.floor(days / 365)
            const remainingDays = days % 365
            if (remainingDays === 0) {
                return t('product.shelfLifeYears', { count: years })
            }
            return t('product.shelfLifeYearsAndDays', { years, days: remainingDays })
        }

        if (days >= 30) {
            const months = Math.floor(days / 30)
            const remainingDays = days % 30
            if (remainingDays === 0) {
                return t('product.shelfLifeMonths', { count: months })
            }
            return t('product.shelfLifeMonthsAndDays', { months, days: remainingDays })
        }

        return t('product.shelfLifeDays', { count: days })
    })

    const minOrderQuantity = computed(() => {
        const qty = product.value?.min_order_qty
        const type = product.value?.min_order_type
        if (!qty) return ''
        return `${qty}${type ? ` ${type}` : ''}`
    })

    const logisticInfo = computed(() => {
        const logistic = product.value?.logistic
        if (!logistic) return null

        return {
            show_product_gross_weight: logistic?.show_product_gross_weight,
            pieces_per_box: logistic?.pieces_per_box,
            boxes_per_palette: logistic?.boxes_per_palette,
            rows_per_palette: logistic?.rows_per_palette,
        }
    })

    const productKeywords = computed(() => {
        return product.value?.keywords || []
    })

    const isPrivateLabelAvailable = computed(() => {
        return product.value?.private_label_available || false
    })

    const productDates = computed(() => {
        const createdAt = product.value?.created_at
        const updatedAt = product.value?.updated_at

        return {
            createdAt: createdAt ? formatDate(createdAt) : '',
            updatedAt: updatedAt ? formatDate(updatedAt) : '',
            createdAtFormatted: createdAt ? formatDate(createdAt, 'PPP') : '',
            updatedAtFormatted: updatedAt ? formatDate(updatedAt, 'PPP') : '',
        }
    })

    const completionInfo = computed(() => {
        return product.value?.completion || null
    })

    const isProductComplete = computed(() => {
        return completionInfo.value?.is_complete || false
    })

    const currentStep = computed(() => {
        return completionInfo.value?.current_step || 1
    })

    // Actions
    const fetchProduct = async () => {
        try {
            await productsStore.fetchProductDetails(productId)
        } catch (error: any) {
            console.error('Failed to fetch product:', error)
            throw error
        }
    }

    const fetchRelatedProducts = async () => {
        if (!product.value?.category?.id) return

        try {
            await productsStore.fetchRelatedProducts(product.value.category.id, productId)
        } catch (error: any) {
            console.error('Failed to fetch related products:', error)
        }
    }

    const refreshProduct = async () => {
        productsStore.resetSingleProductState()
        await fetchProduct()
    }

    const contactSupplier = async () => {
        // Implement contact supplier logic
        // You might want to open a modal or navigate to contact page
    }

    const addToFavorites = async () => {
        // Implement add to favorites logic
    }

    const shareProduct = async () => {
        // Implement share product logic
        if (navigator.share) {
            try {
                await navigator.share({
                    title: productName.value,
                    text: `Check out this product: ${productName.value}`,
                    url: window.location.href,
                })
            } catch (error) {}
        } else {
            // Fallback: copy to clipboard
            try {
                await navigator.clipboard.writeText(window.location.href)
                // You might want to show a toast notification here
            } catch (error) {
                console.error('Failed to copy URL:', error)
            }
        }
    }

    const updateCurrentProduct = (updates: Partial<typeof product.value>) => {
        productsStore.updateCurrentProduct(updates)
    }

    // Initialize
    const initializeProductDetails = async () => {
        try {
            await productsStore.initializeProductDetails(productId)
        } catch (error: any) {
            console.error('Failed to initialize product details:', error)
            throw error
        }
    }

    return {
        // State
        product,
        relatedProducts,
        error,
        isLoading,
        isLoadingRelated,

        // Product info
        productName,
        productBrand,
        productCategory,
        productStatus,
        productImages,
        primaryImage,
        galleryImages,
        productPrices,
        hasDiscounts,
        productWeight,
        productOrigin,
        supplierInfo,
        productFeatures,
        productAllergens,
        availabilityCountries,
        businessTypes,
        storageCondition,
        shelfLifeDays,
        minOrderQuantity,
        logisticInfo,
        productKeywords,
        isPrivateLabelAvailable,
        productDates,
        completionInfo,
        isProductComplete,
        currentStep,

        // Actions
        fetchProduct,
        fetchRelatedProducts,
        refreshProduct,
        contactSupplier,
        addToFavorites,
        shareProduct,
        initializeProductDetails,
        setCurrentProduct: productsStore.setCurrentProduct,
        updateCurrentProduct,
    }
}
