<template>
    <div
        class="action-buttons-container flex bg-gray-200 border-gray-400 p-2 rounded-sm justify-between border flex-col gap-2"
    >
        <Button
            :disabled="isLoading"
            color="gray"
            variant="ghost"
            square
            size="md"
            font-weight="normal"
            :loading="isFavoriteLoading"
            :container-classes="favoriteClasses"
            @click="toggleFavorite"
        >
            <svg class="w-4 h-4">
                <use :xlink:href="`/sprite.svg#${isFavorite ? 'heart-full' : 'heart'}`"></use>
            </svg>
        </Button>

        <Button
            :disabled="isLoading"
            color="gray"
            variant="ghost"
            square
            size="md"
            font-weight="normal"
            :loading="isPdfLoading"
            container-classes="base-btn"
            @click="handleDownloadPDF"
        >
            <svg class="w-4 h-4">
                <use xlink:href="/sprite.svg#download-product"></use>
            </svg>
        </Button>

        <Button
            v-tooltip.left="$t('featureComingSoon')"
            disabled
            color="gray"
            variant="ghost"
            size="md"
            font-weight="normal"
            square
            container-classes="base-btn"
            @click="$emit('add-to-cart')"
        >
            <svg class="w-4 h-4">
                <use xlink:href="/sprite.svg#add-to-templates"></use>
            </svg>
        </Button>

        <Button
            v-tooltip.left="$t('featureComingSoon')"
            color="gray"
            disabled
            variant="ghost"
            size="md"
            font-weight="normal"
            square
            container-classes="base-btn"
            @click="$emit('add-to-cart')"
        >
            <svg class="w-4 h-4">
                <use xlink:href="/sprite.svg#add-later"></use>
            </svg>
        </Button>

        <Button
            v-tooltip.left="$t('featureComingSoon')"
            disabled
            color="gray"
            variant="ghost"
            size="md"
            font-weight="normal"
            square
            container-classes="base-btn"
            @click="$emit('add-to-cart')"
        >
            <svg class="w-4 h-4">
                <use xlink:href="/sprite.svg#share1"></use>
            </svg>
        </Button>
    </div>
</template>

<script setup lang="ts">
    import { useFavorite } from '~/composables/useFavorite'
    import { ref, computed } from 'vue'
    import { useProducts } from '~/composables/useProducts'
    import { useProduct } from '~/composables/useProduct'
    import { useCart } from '~/composables/useCart'
    import type { ProductListing } from '@/types/products'

    type ModuleProductCard = 'cart' | 'product' | 'products' | 'favorites' | 'templates'

    const props = withDefaults(
        defineProps<{
            product: ProductListing
            isFavorite?: boolean
            supplierId?: number
            isLoading?: boolean
            productId: number
            module?: ModuleProductCard
        }>(),
        {
            isFavorite: false,
            isLoading: false,
            productId: 0,
            module: 'products',
        }
    )

    const isPdfLoading = ref(false)

    const { updateProductLocally, isLoading: isFavoriteLoading } = useProducts()
    const { downloadPDF } = useProduct()
    const { updateCartLocally } = useCart()
    const { quickToggleFavorite, removeFromFavorite } = useFavorite()
    const { product, setCurrentProduct } = useProductDetails({ productId: props.productId })

    const emit = defineEmits(['add-to-cart', 'favorite-updated'])

    const favoriteClasses = computed(() => {
        return `!text-gray-950 base-btn favorite-btn${props.isFavorite ? ' is-favorite' : ''}`
    })

    const getBrandName = computed(
        () => props.product.brand || props.product.brand_name || props || ''
    )
    const getOriginalTitle = computed(() => props.product.name_original || '')

    const toggleFavorite = async () => {
        try {
            let newFavoriteStatus: boolean = props.isFavorite || false

            if (props.module !== 'favorites') {
                newFavoriteStatus = await quickToggleFavorite(props.productId, props.isFavorite)
            }

            switch (props.module) {
                case 'cart':
                    updateCartLocally(props.productId, {
                        is_favorite: newFavoriteStatus,
                    })
                    break

                case 'product':
                    setCurrentProduct({ ...product.value, is_favorite: newFavoriteStatus })
                    break

                case 'favorites':
                    await removeFromFavorite({ product_id: props.productId }, true)
                    newFavoriteStatus = false
                    break

                default:
                    updateProductLocally(props.productId, { is_favorite: newFavoriteStatus })
                    break
            }

            emit('favorite-updated', {
                productId: props.productId,
                isFavorite: newFavoriteStatus,
                supplierId: props.supplierId,
            })

            return newFavoriteStatus
        } catch (error) {
            console.error('[ActionButtons] Error toggling favorite:', error)
            return props.isFavorite
        }
    }

    const handleDownloadPDF = async () => {
        if (!props.productId || isPdfLoading.value) return

        isPdfLoading.value = true
        try {
            await downloadPDF(props.productId, getBrandName.value, getOriginalTitle.value)
        } catch (error) {
            console.error('Failed to download PDF:', error)
        } finally {
            isPdfLoading.value = false
        }
    }
</script>

<style lang="css" scoped>
    @media (min-width: 1024px) {
        .action-buttons-container {
            @apply flex-col;
        }
    }

    @media (max-width: 1023px) {
        .action-buttons-container {
            @apply flex-row w-full;
        }
    }

    .favorite-btn {
        @apply hover:bg-red-50 hover:text-red-500;
        @apply active:bg-red-100 active:text-red-600;
    }

    .favorite-btn.is-favorite {
        @apply bg-red-50 text-red-500;
        @apply hover:bg-red-100 hover:text-red-600;
        @apply active:bg-red-150 active:text-red-700;
    }

    .favorite-btn.is-favorite svg {
        @apply fill-red-500;
    }

    .base-btn {
        @apply text-gray-950 w-fit !p-0;
        @apply hover:bg-blue-50 hover:!text-blue-500;
        @apply active:bg-blue-100 active:!text-blue-600;
    }
</style>
