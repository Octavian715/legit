<template>
    <article
        class="relative flex md:items-center gap-3 p-2 bg-white hover:bg-blue-50 hover:border-gray-600 border border-gray-400 rounded-md hover:shadow-sm transition-shadow duration-200"
        role="article"
        :aria-label="`Product: ${item.name}-${item.id}`"
    >
        <!-- Product Image -->
        <div
            class="relative min-w-20 min-h-20 max-w-28 max-h-28 flex-shrink-0 bg-gray-100 rounded overflow-hidden hover:scale-105 border border-gray-400 transition-transform duration-200"
            :class="{ ' border-green-500': item.isNew }"
        >
            <img
                :src="productImage"
                :alt="item.name"
                class="w-full h-full aspect-square object-contain cursor-pointer"
                loading="lazy"
                @click="handleProductClick"
            />

            <!-- NEW Badge -->
            <div
                v-if="item.isNew"
                class="absolute left-0 right-0 bottom-0 bg-green-500 text-white text-caption1 font-bold text-center py-1 rounded-b"
            >
                {{ t('product.new') }}
            </div>
            <!-- Discount Badge -->
            <div
                v-if="item.hasDiscount && item.discountPercentage"
                class="absolute top-0 left-0 bg-red-50 text-red-500 text-caption1 px-1 py-1 rounded-r rounder-t"
            >
                {{ t('product.discount') }} {{ item.discountPercentage }}%
            </div>
        </div>

        <div
            class="grid sm:grid-cols-[35%_1fr] lg:grid-cols-[20%_1fr] gap-1 min-w-0 align-middle mb-auto flex-1"
        >
            <p v-if="showSupplier" class="text-subtitle4 text-gray-800 max-w-24 break-words"
                >{{ t('supplier') }}:</p
            >

            <!-- Supplier Link -->
            <template v-if="showSupplier">
                <Link
                    v-if="item.supplier?.username || item.user?.company_details?.legal_name"
                    size="sm"
                    class="w-fit"
                    @click="handleSupplierClick"
                >
                    {{ item?.user?.company_details?.legal_name }}
                </Link>
                <span v-else class="text-subtitle4 text-gray-950">-</span>
            </template>

            <p class="text-subtitle4 text-gray-800 max-w-24 break-words">
                {{ t('product.trademark') }}:
            </p>
            <p class="text-subtitle4 text-gray-950 font-bold break-words">{{ item.brand }}</p>

            <p class="text-subtitle4 text-gray-800 max-w-24 break-words">
                {{ t('product.originalTitle') }}:
            </p>

            <!-- Product Link -->
            <Link
                v-if="item.id"
                size="sm"
                type="button"
                class="w-fit font-bold"
                @click="handleProductClick"
            >
                {{ item.originalName || item.name_original }}
            </Link>

            <p class="text-subtitle4 text-gray-800 max-w-24 break-words">{{ t('category') }}:</p>

            <!-- Category Link -->
            <Link
                v-if="item.category?.slug"
                size="sm"
                type="button"
                class="w-fit"
                @click="handleCategoryClick"
            >
                {{ item.category.name }}
            </Link>
            <span v-else class="text-subtitle4 text-gray-950">-</span>

            <p class="text-subtitle4 text-gray-800 max-w-24 break-words">{{ t('unit') }}:</p>
            <p class="text-subtitle4 text-gray-950 break-words">{{
                item.unit ? item.unit : `${item?.weight?.name} (${item?.weight?.symbol})`
            }}</p>
            <!-- Price Display -->
            <p class="text-subtitle4 text-gray-800 max-w-24 break-words self-center">
                {{ t('price') }}:
            </p>

            <div
                v-if="item.visiblePrice && item.price !== null"
                class="flex gap-1 justify-center w-fit"
            >
                <span v-if="item?.price?.thePrice" class="text-subtitle4 font-bold text-gray-950">
                    {{ item?.price?.thePrice }}
                </span>
                <span
                    v-if="item?.price?.oldPrice"
                    class="text-subtitle4 font-bold text-gray-800 line-through decoration-red-500"
                >
                    {{ item?.price?.oldPrice }}
                </span>
                <svg v-if="item?.price?.oldPrice" class="w-3 h-3 text-green-500">
                    <use :xlink:href="`/sprite.svg#arrow_down`"></use>
                </svg>
            </div>

            <div v-else-if="!item.visiblePrice" class="flex gap-1 text-red-500 items-center">
                <svg class="w-4 h-4">
                    <use :xlink:href="`/sprite.svg#alert`"></use>
                </svg>
                <div class="flex flex-col gap-0.5 justify-start flex-1">
                    <p class="font-bold text-subtitle4">{{ t('product.priceAreNotPublic') }}</p>
                    <span class="text-caption1 text-gray-800">
                        {{ t('product.priceAreNotPublicSummary') }}
                    </span>
                </div>
            </div>
        </div>
    </article>
</template>

<script setup lang="ts">
    import Link from '~/components/ui/Link.vue'

    interface SupplierData {
        username: string
        legal_name: string
    }

    interface CategoryData {
        id: number
        slug: string
        name: string
        depth?: number
    }

    interface ProductItem {
        id: number
        name: string
        brand: string
        image: string
        unit: string
        supplier?: SupplierData | null
        visiblePrice: boolean
        isNew: boolean
        category?: CategoryData | null
        originalName: string
        price?: Record<string, string> | null
        hasDiscount?: boolean
        discountPercentage?: number | null
    }

    interface Props {
        item: ProductItem
        showSupplier?: boolean
    }

    const props = withDefaults(defineProps<Props>(), { showSupplier: true })

    const emit = defineEmits<{
        click: [item: ProductItem]
        'category-click': [categorySlug: string]
        'supplier-click': [supplierUsername: string]
    }>()

    const { t } = useI18n()

    const productImage = computed(
        () => props.item.image || props.item?.images?.primary || '/images/content/no-image.svg'
    )

    const handleProductClick = (): void => {
        emit('click', props.item)
    }

    const handleCategoryClick = (): void => {
        if (props.item.category?.slug) {
            emit('category-click', props.item.category.slug)
        }
    }

    const handleSupplierClick = (): void => {
        if (props.item.supplier?.username || props.item.user?.company_details?.username) {
            emit('supplier-click', props.item.supplier.username)
        }
    }
</script>
