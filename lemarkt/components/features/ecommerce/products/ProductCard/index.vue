<template>
    <div
        class="product-card relative p-3 border-t first:border-t-0 last:border-b min-h-64"
        :class="{
            'bg-blue-50': isProductInCart && mode !== 'cart',
            'border-gray-600': !isProductInCart,
        }"
    >
        <div class="flex flex-1 flex-col gap-2 md:gap-3 sm:flex-row">
            <ProductImage
                :image="product.images.primary"
                :features="product.features"
                :price="product?.price"
                :alt="product.name"
                rounded-class="rounded-sm"
                class="product-image w-full !h-full flex-1"
            />

            <div class="min-w-0 flex-1 border border-gray-500 p-3 rounded-sm md:flex md:flex-col">
                <SupplierInfo
                    :product="product"
                    :supplier="supplierName"
                    :supplier-url="supplierUserName"
                    :supplier-id="supplierId"
                    :social="supplierSocialData"
                    :verified="true"
                    :show-social="mode !== 'search-all'"
                    :phones="supplierPhones"
                    :enable-store-sync="isSearchContext"
                    @chat="handleChatWithSupplier"
                    @social-update="handleSocialUpdate"
                />

                <div class="flex flex-col xl:flex-row xl:justify-between mt-2 gap-2">
                    <ProductDetails
                        :trademark="product.brand || product.brand_name"
                        :product-slug="product.id"
                        :original-title="product.name_original"
                        :english-title="product.name_en"
                        :category="product.category"
                        :article-number="product.article_number"
                        :storage="product.storage_condition"
                        :width="product?.weight"
                        class="w-full"
                    />

                    <ProductInfo
                        :features="product.additional_features"
                        :private-label="product.private_label_available"
                        class="hidden pb-2 md:flex"
                    />
                </div>

                <ProductMetadata
                    :id="product?.id"
                    :best-before-date="product?.shelf_life_days || ''"
                    :show-weight="product?.logistic?.show_product_gross_weight || false"
                    :weight="product?.weight"
                    :quantity-per-box="product.logistic?.pieces_per_box"
                    :rows-per-pallet="product.logistic?.rows_per_palette"
                    :boxes-per-pallet="product.logistic?.boxes_per_palette"
                    class="w-full md:border-t md:border-gray-500 pt-1.5 mt-auto"
                />
            </div>
        </div>
        <div class="flex flex-col lg:flex-row gap-2 md:gap-3">
            <ProductPrice
                :key="`price-${product.id}-${productQuantityInCart}`"
                :product-id="product?.id"
                :mode="mode"
                :is-own="isOwner"
                :visible="mode === 'cart' ? true : product?.price_visibility"
                :price="product?.price || product?.pricing"
                :quantity="productQuantityInCart"
                :vat="product?.vat"
                :min-order-qty="1"
                :pices-per-box="product?.logistic?.pieces_per_box"
                :stock="999999"
                :volume-discounts="product?.volume_prices"
                container-classes="md:max-w-full h-full"
                @remove-from-cart="$emit('remove-product', $event)"
            />

            <ActionButtons
                :product="product"
                :product-id="product.id"
                :supplier-id="supplierId"
                :is-favorite="product?.is_favorite"
                :module="mode"
                :is-loading="false"
                :mode="isDesktop ? 'vertical' : 'horizontal'"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue'
    import type { ProductListing } from '@/types/products'
    import { useBreakpoints, breakpointsTailwind } from '@vueuse/core'
    import { useUserStore } from '~/stores/user'
    import { useCartStore } from '~/stores/cart'
    import { useSearchStore } from '~/stores/search'

    type ModeProductCard =
        | 'cart'
        | 'product'
        | 'products'
        | 'favorites'
        | 'templates'
        | 'search-all'

    interface SocialData {
        is_following: boolean
        connection: {
            exists: boolean
            status: 'pending' | 'accepted' | 'rejected' | null
            id?: number
        }
    }

    const props = withDefaults(
        defineProps<{
            product: ProductListing
            mode?: ModeProductCard
        }>(),
        {
            mode: 'product',
        }
    )

    const userStore = useUserStore()
    const cartStore = useCartStore()
    const searchStore = useSearchStore()
    const breakpoints = useBreakpoints(breakpointsTailwind)
    const isDesktop = breakpoints.greaterOrEqual('lg')

    const { isCartReady, getCartQuantity } = useCart()

    const emit = defineEmits<{
        (e: 'chat'): void
        (e: 'call', phone: string | undefined): void
        (e: 'set-reating', value: number): void
        (e: 'compare', productId: string): void
        (e: 'share', productId: string): void
        (e: 'notification', productId: string): void
        (e: 'remove-product', productId: string): void
    }>()

    const isSearchContext = computed(() => {
        return props.mode === 'products' || props.mode === 'search-all'
    })

    const isProductInCart = computed(() => {
        if (!isCartReady.value) {
            return false
        }

        try {
            const quantity = cartStore.cartItems[props.product.id] || 0
            return quantity > 0
        } catch (error) {
            console.error('[ProductCard] Error checking if product is in cart:', error)
            return false
        }
    })

    const productQuantityInCart = computed(() => {
        if (props.mode === 'cart') {
            return props.product?.quantity ? Number(props.product.quantity) : 0
        }

        return getCartQuantity(props.product.id)
    })

    const productFromStore = computed(() => {
        if (!isSearchContext.value) return null

        return searchStore.productResults.find((p) => p.id === props.product.id)
    })

    const supplier = computed(() => {
        return productFromStore.value?.user || props.product.user
    })

    const supplierName = computed(() => {
        return supplier.value?.company_details?.legal_name || supplier.value?.name || 'Unknown'
    })

    const supplierUserName = computed(() => {
        return supplier.value?.company_details?.username || 'unknown'
    })

    const supplierSocialData = computed(() => {
        const storeSupplier = productFromStore.value?.user
        if (storeSupplier?.social) {
            return storeSupplier.social
        }

        return (
            supplier.value?.social || {
                is_following: false,
                connection: { exists: false, status: null },
            }
        )
    })

    const supplierId = computed(() => props.product?.user?.id || null)

    const isOwner = computed(() => {
        return supplierId.value === userStore?.user?.id
    })

    const supplierPhones = computed(() => {
        const contacts = supplier.value?.contacts
        if (!contacts || contacts.length === 0) return null

        const firstContact = contacts[0]

        return firstContact?.phones || []
    })

    const handleSocialUpdate = (socialData: SocialData): void => {
        if (!supplierId.value || !isSearchContext.value) return

        const productIndex = searchStore.productResults.findIndex((p) => p.id === props.product.id)

        if (productIndex !== -1) {
            if (!searchStore.productResults[productIndex].user.social) {
                searchStore.productResults[productIndex].user.social = {
                    is_following: false,
                    connection: { exists: false, status: null },
                }
            }
            searchStore.productResults[productIndex].user.social = socialData
        }
    }

    const handleChatWithSupplier = () => emit('chat')
</script>

<style scoped>
    .product-card {
        @apply flex flex-col gap-2 md:gap-3;

        @media (min-width: 1023px) {
            flex-direction: row;
        }
    }
    .product-image {
        @media (min-width: 1023px) {
            max-width: 240px;

            @media (max-width: 1280px) {
                flex: 1 1 auto;
                width: 100%;
                height: 100%;
                max-width: 278px;
            }
        }
    }

    @media (max-width: 767px) {
        .product-card {
            word-wrap: break-word;
            overflow-wrap: break-word;
        }

        .product-card .space-y-1 > * + * {
            margin-top: 0.25rem;
        }

        @media (max-width: 374px) {
            .product-card .text-caption1 {
                font-size: 9px;
                line-height: 10px;
            }
        }
    }

    @media (min-width: 768px) and (max-width: 1023px) {
        .product-card .hidden.md\\:block {
            display: block;
        }
    }

    .product-card img {
        object-fit: cover;
        object-position: center;
    }

    @media (max-width: 1023px) {
        .product-card button {
            min-height: 44px;
            min-width: 44px;
        }

        .product-card input[type='number'] {
            min-height: 44px;
        }
    }

    .product-card {
        will-change: auto;
        transform: translateZ(0);
    }

    @media (prefers-reduced-motion: reduce) {
        .product-card * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
        }
    }
</style>
