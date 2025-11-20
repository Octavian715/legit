// composables/useSearchProduct.ts

import { computed, type ComputedRef } from 'vue'
import type { SearchProduct } from '~/types/search'

interface TransformedProduct {
    id: number
    name: string
    brand: string
    image: string
    unit: string
    supplier?: {
        username: string
        legal_name: string
    } | null
    user?: {
        company_details?: {
            username: string
            legal_name: string
        }
        social?: any
        contacts?: any[]
    }
    visiblePrice: boolean
    price_visibility: boolean
    isNew: boolean
    category?: {
        id: number
        slug: string
        name: string
        depth?: number
    } | null
    originalName: string
    name_original?: string
    article_number?: string
    // CRITICAL: price is kept in original API format for ProductPrice.vue
    price?: any // Original API structure: { product_currency: {...}, user_currency: {...} }
    pricing?: any // Alias for compatibility
    hasDiscount?: boolean
    discountPercentage?: number | null
    weight?: any
    images?: any
    volume_prices?: any[]
    vat?: number
    logistic?: any
    shelf_life_days?: any
    is_favorite?: boolean
    features?: any[]
    additional_features?: any[]
    private_label_available?: boolean
    storage?: any
    storage_condition?: any
}

/**
 * Transform search API product to component format
 */
export const useSearchProduct = (product: ComputedRef<SearchProduct> | SearchProduct) => {
    const productValue = computed(() => {
        return typeof product === 'object' && 'value' in product ? product.value : product
    })

    /**
     * Transform price from API format to simple display format
     * API: { product_currency: { original, final, currency: {symbol} }, has_discount }
     * Display: { thePrice: "1€", oldPrice: "100€" }
     *
     * NOTE: This is ONLY for simple price display in components like badges, tooltips, etc.
     * For ProductPrice.vue component, use the original product.price directly!
     */
    const transformedPrice = computed(() => {
        const prod = productValue.value

        if (!prod.price_visibility || !prod.price) {
            return null
        }

        // Handle price as object
        if (typeof prod.price === 'object' && prod.price.product_currency) {
            const priceData = prod.price.product_currency
            const currency = priceData.currency
            const symbol = currency?.symbol || '€'

            const finalPrice = parseFloat(priceData.final || 0)
            const originalPrice = parseFloat(priceData.original || 0)
            const hasDiscount = priceData.has_discount || false

            return {
                thePrice: `${finalPrice.toFixed(2)}${symbol}`,
                oldPrice:
                    hasDiscount && originalPrice > finalPrice
                        ? `${originalPrice.toFixed(2)}${symbol}`
                        : undefined,
            }
        }

        return null
    })

    /**
     * Check if product is new
     */
    const isNew = computed(() => {
        const prod = productValue.value
        return prod.features?.some((f: any) => f.code === 'new') || false
    })

    /**
     * Get discount percentage
     */
    const discountPercentage = computed(() => {
        const prod = productValue.value

        if (typeof prod.price === 'object' && prod.price?.product_currency) {
            const discount = prod.price.product_currency.discount_percentage
            return discount ? parseFloat(discount) : null
        }

        return null
    })

    /**
     * Transform to ProductCardItem format
     * IMPORTANT: price is kept in original API format for ProductPrice.vue compatibility
     */
    const transformedProduct = computed<TransformedProduct>(() => {
        const prod = productValue.value

        return {
            id: prod.id,
            name: prod.name_en || prod.name_original,
            brand: prod.brand || '',
            image: prod.images?.primary || '',
            unit: prod.weight ? `${prod.weight.value} ${prod.weight.symbol}` : '',
            supplier: prod.user?.company_details
                ? {
                      username: prod.user.company_details.username,
                      legal_name: prod.user.company_details.legal_name,
                  }
                : null,
            user: prod.user,
            visiblePrice: prod.price_visibility || false,
            price_visibility: prod.price_visibility || false,
            isNew: isNew.value,
            category: prod.category || null,
            private_label_available: prod.private_label_available || false,
            ararticle_number: prod.article_number || '',
            ararticleNumber: prod.article_number || '',
            article_number: prod.article_number || '',
            storage: prod.storage_condition || null,
            storage_condition: prod.storage_condition || null,
            originalName: prod.name_original,
            name_original: prod.name_original,
            // For ProductCardItem: Use transformed price (thePrice/oldPrice format)
            price: transformedPrice.value, // { thePrice: "10€", oldPrice: "15€" }
            // For ProductPrice.vue: Keep original price structure
            pricing: prod.price, // Original API format: { product_currency: {...}, user_currency: {...} }
            hasDiscount: !!transformedPrice.value?.oldPrice,
            discountPercentage: discountPercentage.value,
            weight: prod.weight,
            images: prod.images,
            volume_prices: prod.volume_prices || [],
            vat: prod.vat,
            logistic: prod.logistic,
            shelf_life_days: prod.shelf_life_days,
            is_favorite: prod.is_favorite || false,
            features: prod.features || [],
            additional_features: prod.additional_features || [],
        }
    })

    return {
        transformedProduct,
        transformedPrice,
        isNew,
        discountPercentage,
    }
}

/**
 * Transform array of search products
 */
export const useSearchProducts = (products: ComputedRef<SearchProduct[]> | SearchProduct[]) => {
    const productsValue = computed(() => {
        return Array.isArray(products) ? products : products.value
    })

    const transformedProducts = computed(() => {
        return productsValue.value.map((product) => {
            const { transformedProduct } = useSearchProduct(product)
            return transformedProduct.value
        })
    })

    return {
        transformedProducts,
    }
}
