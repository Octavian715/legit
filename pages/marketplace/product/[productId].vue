<template>
    <div class="product-page px-4 md:px-0">
        <Breadcrumbs
            :items="breadcrumbs"
            :loading="pageWrapperRef?.state?.isLoading"
            class="mb-4"
        />

        <PageWrapper
            ref="pageWrapperRef"
            :fetch-fn="fetchFunction"
            :dependencies="[productIdRef]"
            :empty-check="(data) => !data?.product"
            :meta="{
                skeleton: true,
                refreshInterval: 300000,
                maxRetries: 3,
            }"
            @success="onDataSuccess"
            @error="onDataError"
        >
            <template #skeleton>
                <ProductDetailsSkeleton />
            </template>

            <template #error="{ error }">
                <ErrorBoundary
                    :title="t('product.errorLoadingProduct')"
                    :subtitle="error?.message || t('product.errorLoadingProductDescription')"
                    :button-label="t('tryAgain')"
                    @action="pageWrapperRef?.retry()"
                />
            </template>

            <template #empty>
                <ErrorBoundary
                    :title="t('product.productNotFound')"
                    :subtitle="t('product.productNotFoundDescription')"
                    :button-label="t('product.backToMarketplace')"
                    @action="router.push(localePath('/marketplace'))"
                />
            </template>

            <template #default="{ data }">
                <ProductDetailsView
                    v-if="product"
                    :product="product"
                    :prices="productPrices"
                    :features="productFeatures"
                    :allergens="productAllergens"
                    :business-types="businessTypes"
                    :availability-countries="availabilityCountries"
                    :keywords="productKeywords"
                    :weight="productWeight"
                    :origin="productOrigin"
                    :shelf-life="shelfLifeDays"
                    :min-order="minOrderQuantity"
                    :storage-condition="storageCondition"
                    :private-label-available="isPrivateLabelAvailable"
                    :logistic="logisticInfo"
                    :supplier="supplierInfo"
                    :has-discounts="hasDiscounts"
                    @contact-supplier="onContactSupplier"
                    @add-to-favorites="onAddToFavorites"
                    @share-product="onShareProduct"
                />
            </template>
        </PageWrapper>
    </div>
</template>

<script setup lang="ts">
    import { useLocalePath } from '#imports'
    import { useI18n } from 'vue-i18n'
    import type { ProductDetails, ProductListing } from '~/types/products'
    import { useProductRealtimeUpdates } from '~/composables/useProductRealtimeUpdates'
    import { usePlanChangeEvents } from '~/composables/usePlanChangeEvents'

    const localePath = useLocalePath()
    const { t } = useI18n()
    const route = useRoute()
    const router = useRouter()
    const config = useRuntimeConfig()
    const productsStore = useProductsStore()

    const pageWrapperRef = ref()
    const isMounted = ref(false)
    const isUnmounting = ref(false)

    definePageMeta({
        layout: 'default',
        scrollToTop: true,
    })

    const productId = computed(() => route.params.productId as string)
    const productIdRef = ref(productId.value)

    const isValidProductId = computed(() => {
        const id = productId.value
        return id && id !== 'undefined' && id !== 'null' && !Number.isNaN(Number(id))
    })

    watch(
        productId,
        (newId) => {
            productIdRef.value = newId
        },
        { immediate: true }
    )

    const { planChangeKey } = usePlanChangeEvents()

    const { register: registerRealtimeUpdates, unregister: unregisterRealtimeUpdates } =
        useProductRealtimeUpdates(productIdRef)
    const {
        product,
        relatedProducts,
        error,
        isLoading,
        isLoadingRelated,
        productName,
        productBrand,
        productCategory,
        productPrices,
        productFeatures,
        productAllergens,
        businessTypes,
        availabilityCountries,
        productKeywords,
        productWeight,
        productOrigin,
        shelfLifeDays,
        minOrderQuantity,
        storageCondition,
        isPrivateLabelAvailable,
        logisticInfo,
        supplierInfo,
        hasDiscounts,
        contactSupplier,
        addToFavorites,
        shareProduct,
    } = useProductDetails({ productId: productId.value })

    const { data: ssrProductData } = await useAsyncData(
        `product-${productId.value}`,
        async () => {
            if (!isValidProductId.value) {
                return { product: null, relatedProducts: [] }
            }

            try {
                const api = useApi()
                const productResponse = await api.get(`/products/${productId.value}`)
                const productData = productResponse.data || productResponse

                if (!productData) {
                    throw createError({
                        statusCode: 404,
                        statusMessage: `Product with ID ${productId.value} not found`,
                    })
                }

                return {
                    product: productData as ProductDetails,
                    relatedProducts: [],
                }
            } catch (fetchError: any) {
                throw createError({
                    statusCode: fetchError.status || 404,
                    statusMessage:
                        fetchError.data?.message || fetchError.statusMessage || 'Product not found',
                })
            }
        },
        {
            server: true,
            default: () => ({ product: null }),
            key: `product-${productId.value}-${planChangeKey.value}`,
        }
    )

    const fetchFunction = computed(() => {
        return async () => {
            if (!isValidProductId.value) {
                throw new Error(`Invalid product ID: ${productId.value}`)
            }

            if (process.client && ssrProductData.value) {
                const productsStore = useProductsStore()
                if (ssrProductData.value.product) {
                    productsStore.setCurrentProduct(ssrProductData.value.product)
                }
                return ssrProductData.value
            }

            try {
                const api = useApi()
                const productResponse = await api.get(`/products/${productId.value}`)
                const productData = productResponse.data || productResponse

                if (!productData) {
                    throw new Error(`Product with ID ${productId.value} not found`)
                }

                const result = {
                    product: productData as ProductDetails,
                    relatedProducts: [],
                }

                if (process.client && isMounted.value) {
                    const productsStore = useProductsStore()
                    productsStore.setCurrentProduct(result.product)
                }

                return result
            } catch (fetchError: any) {
                throw createError({
                    statusCode: fetchError.status || 404,
                    statusMessage:
                        fetchError.data?.message || fetchError.statusMessage || 'Product not found',
                })
            }
        }
    })

    const breadcrumbs = computed(() => {
        const items = [
            { label: t('home'), to: localePath('/marketplace') },
            { label: t('navigation.marketplace'), to: localePath('/marketplace'), current: true },
        ]

        const currentProduct =
            product.value || pageWrapperRef.value?.data?.product || ssrProductData.value?.product

        if (currentProduct?.category) {
            items.push({
                label: currentProduct.category.name,
                to: localePath(`/marketplace/category/${currentProduct.category.slug}`),
            })
        }

        const currentProductName = currentProduct?.name_original || productName?.name_original
        if (currentProductName) {
            items.push({ label: currentProductName })
        }

        return items
    })

    const onDataSuccess = (data: any) => {}

    const onDataError = (error: any) => {
        console.error('❌ Product data loading failed', error)
    }

    const onContactSupplier = async (productItem: ProductDetails | ProductListing) => {
        if (isUnmounting.value) return

        try {
            await contactSupplier()
        } catch (contactError) {
            console.error('Failed to contact supplier:', contactError)
        }
    }

    const onAddToFavorites = async (productItem: ProductDetails | ProductListing) => {
        if (isUnmounting.value) return

        try {
            await addToFavorites()
        } catch (favoritesError) {
            console.error('Failed to add to favorites:', favoritesError)
        }
    }

    const onShareProduct = async (productItem: ProductDetails | ProductListing) => {
        if (isUnmounting.value) return

        try {
            await shareProduct()
        } catch (shareError) {
            console.error('Failed to share product:', shareError)
        }
    }

    watch(
        () => route.params.productId,
        async (newProductId, oldProductId) => {
            if (newProductId !== oldProductId && newProductId && !isUnmounting.value) {
                productsStore.resetSingleProductState()

                productIdRef.value = newProductId as string

                await nextTick()
                if (pageWrapperRef.value && isMounted.value) {
                    pageWrapperRef.value.refresh()
                }
            }
        }
    )

    watch(
        () => planChangeKey.value,
        async (newValue, oldValue) => {
            if (oldValue === 0 && newValue === 0) return
            // Re-fetch via PageWrapper
            if (pageWrapperRef.value?.refresh) {
                ssrProductData.value = null

                await pageWrapperRef.value?.refresh()
                await nextTick()
            } else {
                console.warn('[Marketplace] pageWrapperRef.value.refresh not available')
            }
        }
    )

    onMounted(() => {
        isMounted.value = true
        registerRealtimeUpdates()
    })

    onBeforeUnmount(() => {
        isUnmounting.value = true
        unregisterRealtimeUpdates()

        if (pageWrapperRef.value) {
            pageWrapperRef.value = null
        }
    })

    useSeoMeta({
        title: () => {
            const currentProduct =
                product.value ||
                pageWrapperRef.value?.data?.product ||
                ssrProductData.value?.product
            if (!currentProduct) return t('product.loadingProduct')
            return `${currentProduct.name_original || currentProduct.name} - ${currentProduct.brand} | ${t('marketplace')}`
        },
        description: () => {
            const currentProduct =
                product.value ||
                pageWrapperRef.value?.data?.product ||
                ssrProductData.value?.product
            if (!currentProduct) return t('product.loadingDescription')

            const parts = [
                currentProduct.name_original || currentProduct.name,
                currentProduct.brand,
                currentProduct.category?.name,
            ].filter(Boolean)

            let description = parts.join(' | ')

            if (currentProduct.description) {
                description += ` - ${currentProduct.description}`
            }

            return description.substring(0, 160)
        },
        ogTitle: () => {
            const currentProduct =
                product.value ||
                pageWrapperRef.value?.data?.product ||
                ssrProductData.value?.product
            return (
                currentProduct?.name_original || currentProduct?.name || t('product.loadingProduct')
            )
        },
        ogDescription: () => {
            const currentProduct =
                product.value ||
                pageWrapperRef.value?.data?.product ||
                ssrProductData.value?.product
            return currentProduct?.description || t('product.loadingDescription')
        },
        ogImage: () => {
            const currentProduct =
                product.value ||
                pageWrapperRef.value?.data?.product ||
                ssrProductData.value?.product
            if (currentProduct?.images?.primary?.url) {
                return currentProduct.images.primary.url
            }
            return '/images/og-product-default.jpg'
        },
        ogType: 'product',
        ogUrl: () => `${config.public.siteUrl}${route.fullPath}`,
        twitterCard: 'summary_large_image',
    })

    useSchemaOrg([
        defineProduct({
            name: () => {
                const currentProduct =
                    product.value ||
                    pageWrapperRef.value?.data?.product ||
                    ssrProductData.value?.product
                return currentProduct?.name_original || currentProduct?.name
            },
            description: () => {
                const currentProduct =
                    product.value ||
                    pageWrapperRef.value?.data?.product ||
                    ssrProductData.value?.product
                return currentProduct?.description
            },
            brand: () => {
                const currentProduct =
                    product.value ||
                    pageWrapperRef.value?.data?.product ||
                    ssrProductData.value?.product
                return currentProduct?.brand
            },
            image: () => {
                const currentProduct =
                    product.value ||
                    pageWrapperRef.value?.data?.product ||
                    ssrProductData.value?.product
                return currentProduct?.images?.primary?.url
            },
            offers: () => {
                const currentProduct =
                    product.value ||
                    pageWrapperRef.value?.data?.product ||
                    ssrProductData.value?.product
                const firstPrice = currentProduct?.prices?.[0]
                if (!firstPrice) return undefined

                return {
                    '@type': 'Offer',
                    price: firstPrice.amount || firstPrice.price,
                    priceCurrency: firstPrice.currency || 'EUR',
                    availability: currentProduct?.status === 'active' ? 'InStock' : 'OutOfStock',
                }
            },
        }),
    ])
</script>

<style scoped>
    .product-page {
        @apply pb-20;
    }
</style>
