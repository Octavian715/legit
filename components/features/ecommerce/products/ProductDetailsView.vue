<template>
    <div class="product-details-view">
        <div class="bg-white rounded-sm">
            <div class="product-wrapper">
                <!-- Image Gallery Section with Modal -->
                <ImageGallery
                    :images="product.images"
                    :product-name="currentProductName"
                    class="image-gallery-section"
                />
                <!-- Product Info and Actions Section -->
                <div class="product-info-actions">
                    <div class="product-info-section space-y-3 flex-1">
                        <!-- Supplier Header -->
                        <SupplierInfo
                            :product="product"
                            :social="product?.user?.social"
                            :supplier="supplierName"
                            :supplier-url="supplierUserName"
                            :verified="true"
                            :supplier-id="supplierId"
                            :phones="supplierPhones"
                            :connected="true"
                            :followed="isFollowing"
                            mode="product"
                            class="!py-3"
                            @chat="handleChatWithSupplier"
                            @call="handleCallSupplier"
                            @viewSupplier="() => emit('viewSupplier', supplier)"
                        />

                        <!-- Product Name & Brand -->
                        <div class="space-y-3">
                            <div
                                class="flex flex-col items-start gap-3 border-b border-gray-400 pb-3"
                            >
                                <h1
                                    class="text-title2 lg:text-title1 font-bold text-gray-950 self-stretch"
                                >
                                    {{ currentProductName }}
                                </h1>
                                <div
                                    v-if="product.features?.length"
                                    class="flex flex-wrap gap-3 text-subtitle4 text-gray-800"
                                >
                                    <span
                                        v-if="product.private_label_available"
                                        class="flex items-center gap-1 px-2 py-1 bg-gray-200 border border-gray-600 text-nowrap"
                                    >
                                        <svg class="w-3 h-3">
                                            <use
                                                :xlink:href="`/sprite.svg#${getImageType('label')}`"
                                            ></use>
                                        </svg>
                                        {{ $t('product.privateLabel') }}
                                    </span>
                                    <span
                                        v-if="product.label_translations_on_request"
                                        class="flex items-center gap-1 px-2 py-1 bg-gray-200 border border-gray-600 text-nowrap"
                                    >
                                        <svg class="w-3 h-3">
                                            <use
                                                :xlink:href="`/sprite.svg#${getImageType('label')}`"
                                            ></use>
                                        </svg>
                                        {{ $t('product.privateLabel') }}
                                    </span>
                                </div>
                            </div>

                            <ProductDetails
                                mode="extended"
                                container-classes="!space-y-3 border-b border-gray-400 pb-3"
                                :trademark="product.brand_name"
                                :article-number="product.article_number"
                                :category="product.category"
                                :original-title="product.name_original"
                                :translation-languages="product.names"
                                :label-translation-languages="product.ingredients"
                                :english-title="product?.name_english"
                                :storage="product.storage_condition"
                                :width="product?.weight"
                                :product="product"
                            />

                            <ul
                                class="grid grid-cols-2 lg:grid-cols-4 gap-3"
                                :class="[`md:grid-cols-[${productPackage.length}]`]"
                            >
                                <li
                                    v-for="item in productPackage"
                                    :key="item.label"
                                    class="border border-gray-400 rounded-md flex text-center flex-col items-center gap-2 text-gray-800 text-subtitle4 py-2 px-auto"
                                >
                                    <svg class="w-6 h-6">
                                        <use
                                            :xlink:href="`/sprite.svg#${getImageType(item.icon)}`"
                                        ></use>
                                    </svg>
                                    {{ item.label }}
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div
                    class="sidebar-section sticky top-6 space-y-3 flex-shrink-0 md:max-w-64 ml-auto"
                >
                    <ProductPrice
                        container-classes="!w-full"
                        :product-id="product.id"
                        :is-own="isOwner"
                        :visible="product.price_visibility"
                        :price="product.price"
                        :vat="product.vat"
                        :min-order-qty="1"
                        :stock="999999"
                        mode="product"
                        class="product-price lg:w-full"
                    />

                    <ActionButtons
                        mode="horizontal"
                        :product-id="product.id"
                        :is-favorite="product.is_favorite"
                        :product="product"
                        :is-loading="false"
                        module="product"
                        class="!flex-row"
                    />
                    <div class="space-y-3">
                        <div
                            v-if="product.ean_box"
                            class="flex flex-col px-4 py-1 items-center gap-1 bg-white border border-gray-400 rounded-sm p-3"
                        >
                            <p class="ean-label">{{ t('itemEanInPackaging') }}</p>
                            <!-- <NuxtImg
                                v-if="isValidImageUrl(product.ean_box_url)"
                                :src="product.ean_box_url"
                                :alt="`${t('itemEanInPackaging')} ${product.ean_box}`"
                                loading="lazy"
                                class="w-full min-w-32 max-w-40 h-full object-contain"
                            /> -->
                            <img
                                v-if="!!product.ean_box_url"
                                :src="product.ean_box_url"
                                :alt="`${t('itemEanInPackaging')} ${product.ean_box}`"
                                loading="lazy"
                                class="w-full max-w-32 h-full object-contain"
                            />
                            <p class="ean-number">
                                {{ product.ean_box }}
                            </p>
                        </div>

                        <div
                            v-if="product.ean_product"
                            class="flex flex-col px-4 py-1 items-center gap-1 bg-white border border-gray-400 rounded-sm p-3"
                        >
                            <p class="ean-label">{{ t('itemEan') }}</p>
                            <!-- <NuxtImg
                                v-if="isValidImageUrl(product.ean_product_url)"
                                :src="product.ean_product_url"
                                :alt="`${t('itemEan')} ${product.ean_product}`"
                                loading="lazy"
                                class="w-full min-w-32 max-w-40 h-full object-contain"
                            /> -->
                            <img
                                v-if="!!product.ean_product_url"
                                :src="product.ean_product_url"
                                :alt="`${t('itemEan')} ${product.ean_product}`"
                                loading="lazy"
                                class="w-full max-w-32 h-full object-contain"
                            />
                            <p class="ean-number">
                                {{ product.ean_product }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useLocalePath } from '#imports'
    import { useConnections } from '~/composables/useConnections'
    import { useDate } from '~/composables/useDate'
    import type { ProductDetails } from '~/types/products'
    import ImageGallery from './ImageGallery.vue'
    import { useUserStore } from '~/stores/user'

    interface Props {
        product: ProductDetails
        prices?: {
            local?: any
            export?: any
            all: any[]
        }
        features?: any[]
        allergens?: any[]
        businessTypes?: any[]
        availabilityCountries?: any[]
        keywords?: any[]
        weight?: string
        origin?: string
        shelfLife?: string
        minOrder?: string
        storageCondition?: string
        privateLabelAvailable?: boolean
        logistic?: any
        supplier?: any
        hasDiscounts?: boolean
    }

    const props = withDefaults(defineProps<Props>(), {
        prices: () => ({ all: [] }),
        features: () => [],
        allergens: () => [],
        businessTypes: () => [],
        availabilityCountries: () => [],
        keywords: () => [],
        weight: '',
        origin: '',
        shelfLife: '',
        minOrder: '',
        storageCondition: '',
        privateLabelAvailable: false,
        logistic: null,
        supplier: null,
        hasDiscounts: false,
    })

    const emit = defineEmits<{
        contactSupplier: [product: ProductDetails]
        addToFavorites: [product: ProductDetails]
        shareProduct: [product: ProductDetails]
        viewSupplier: [supplier: any]
        chat: []
    }>()

    const { t, locale } = useI18n()
    const localePath = useLocalePath()
    const { formatDate } = useDate()
    const userStore = useUserStore()

    const {
        getUserConnectionState,
        connect,
        disconnect,
        isLoading: connectionsLoading,
    } = useConnections()

    const supplier = computed(() => props.product.user)

    const productPackage = computed(() => {
        const packageDetails = []

        // if (props.logistic?.show_product_gross_weight) {
        packageDetails.push({
            label: props.weight || '-',
            icon: 'weight',
        })
        // }

        if (props.logistic.pieces_per_box) {
            packageDetails.push({
                label: `${t('product.nPiecesPerBox', { number: props.logistic.pieces_per_box || 0 })}`,
                icon: 'package',
            })
        }

        if (props.logistic.rows_per_palette) {
            packageDetails.push({
                label: `${t('product.nRowPerPallert', { number: props.logistic.rows_per_palette || 0 })}`,
                icon: 'rows',
            })
        }

        if (props.logistic.boxes_per_palette) {
            packageDetails.push({
                label: `${t('product.nBoxPerPallert', { number: props.logistic.boxes_per_palette || 0 })}`,
                icon: 'boxes-pallets',
            })
        }

        return packageDetails
    })

    const supplierPhone = computed(() => {
        return supplier.value?.contacts?.[0]?.phones?.[0]?.phone_number
    })

    const currentProductName = computed(() => {
        const localizedName = props.product.names?.find((n) => n.language.code === locale.value)
        return localizedName?.name || props.product.name_original || t('product.noName')
    })

    const supplierName = computed(() => {
        return supplier.value?.company_details?.legal_name || supplier.value?.name || t('unknown')
    })

    const supplierUserName = computed(() => {
        return supplier.value?.company_details?.username || 'unknown'
    })
    const supplierId = computed(() => {
        return supplier.value?.id || null
    })
    const isOwner = computed(() => {
        return supplierId.value === userStore?.user?.id
    })

    const isFollowing = computed(() => {
        return supplier.value?.social.is_following || false
    })

    const getImageType = (icon: string): string | string[] | undefined => {
        const iconMap: Record<string, string | string[]> = {
            pickup: 'pickup',
            delivery: 'delivery',
            label: 'label',
            weight: 'weight',
            package: 'package',
            rows: 'rows',
            'boxes-pallets': 'boxes-pallets',
        }

        return iconMap[icon]
    }
    const supplierPhones = computed(() => {
        const contacts = props.product.user?.contacts
        if (!contacts || contacts.length === 0) return null

        const firstContact = contacts[0]

        return firstContact?.phones || []
    })

    const handleChatWithSupplier = () => {
        emit('chat')
    }

    const handleCallSupplier = () => {
        if (supplierPhone.value) {
            window.location.href = `tel:${supplierPhone.value}`
        } else {
            console.warn('No phone number available for supplier')
        }
    }
</script>
<style scoped lang="scss">
    .product-wrapper {
        @apply grid gap-3 p-4 sm:p-6;

        grid-template-areas:
            'image'
            'info-actions'
            'sidebar';

        @media (min-width: 768px) {
            padding: 1.5rem;
            grid-template-areas:
                'image image image'
                'info-actions info-actions sidebar';
        }

        @media (min-width: 1024px) {
            /* MODIFICAT: Mai mult spațiu pentru imagine */
            grid-template-columns: 1.4fr 2fr 1fr;
            grid-template-areas: 'image info-actions info-actions sidebar';
            grid-template-rows: auto;
        }

        @media (min-width: 1280px) {
            /* ADĂUGAT: Imagine și mai mare pe ecrane xl */
            grid-template-columns: 1.4fr 2fr 1fr;
        }
    }

    .image-gallery-section {
        grid-area: image;
        @apply w-full;
    }

    .product-info-actions {
        grid-area: info-actions;
    }

    .product-info-section {
        @apply flex-1 min-w-0;
    }

    .sidebar-section {
        grid-area: sidebar;
        @apply w-full md:w-auto md:flex-shrink-0;

        .sticky {
            @apply top-6;
            position: sticky;
            align-self: flex-start;
            height: calc(100vh - 3rem);
            overflow-y: auto;
        }
    }

    .ean-label {
        @apply text-gray-800 text-caption1;
    }

    .ean-number {
        @apply text-gray-950 text-title3;
    }

    .product-price {
        .quantity-selector {
            @apply flex-col;

            .multiplier-buttons,
            .quantity-controls {
                @apply w-full;
            }
        }
    }
</style>
