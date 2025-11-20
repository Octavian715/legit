<template>
    <div class="cart-product-item p-6 hover:bg-gray-50 transition-colors">
        <!-- Discount Badge -->
        <div v-if="hasDiscount" class="mb-3">
            <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-red-100 text-red-800"
            >
                {{ t('cart.item.discount') }} {{ discountPercentage }}%
            </span>
        </div>

        <div class="flex gap-6">
            <!-- Product Image -->
            <div class="flex-shrink-0">
                <div
                    class="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden border border-gray-200"
                >
                    <!-- <NuxtImg
                        v-if="item.product.image"
                        :src="item.product.image"
                        :alt="item.product.name"
                        class="w-full h-full object-cover"
                        loading="lazy"
                        format="webp"
                    /> -->
                    <img
                        v-if="item.product.image"
                        :src="item.product.image"
                        :alt="item.product.name"
                        class="w-full h-full object-cover"
                        loading="lazy"
                    />
                    <div v-else class="w-full h-full bg-gray-100 flex items-center justify-center">
                        <svg class="w-8 h-8 text-gray-400">
                            <use xlink:href="/sprite.svg#image" />
                        </svg>
                    </div>
                </div>
            </div>

            <!-- Product Details -->
            <div class="flex-1 min-w-0">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <!-- Left Column: Basic Info -->
                    <div class="lg:col-span-1 space-y-2">
                        <div>
                            <p class="text-sm text-gray-600">{{ t('cart.item.supplier') }}:</p>
                            <p class="font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                                {{ supplierName }}
                            </p>
                        </div>

                        <div>
                            <p class="text-sm text-gray-600">{{ t('cart.item.brand') }}:</p>
                            <p class="font-medium text-gray-900">{{
                                item.product.brand_name || '-'
                            }}</p>
                        </div>

                        <div>
                            <p class="text-sm text-gray-600">{{ t('cart.item.originalTitle') }}:</p>
                            <p class="font-medium text-gray-900">{{ item.product.name }}</p>
                        </div>

                        <div>
                            <p class="text-sm text-gray-600">{{ t('cart.item.category') }}:</p>
                            <p class="text-blue-600 hover:text-blue-800 cursor-pointer">{{
                                categoryName
                            }}</p>
                        </div>

                        <div>
                            <p class="text-sm text-gray-600">{{ t('cart.item.articleNumber') }}:</p>
                            <p class="text-gray-900">{{ item.product.article_number || '-' }}</p>
                        </div>

                        <div>
                            <p class="text-sm text-gray-600">{{ t('cart.item.conditions') }}:</p>
                            <div class="flex items-center gap-2">
                                <svg class="w-4 h-4 text-blue-500">
                                    <use xlink:href="/sprite.svg#thermometer"></use>
                                </svg>
                                <span class="text-sm text-gray-900">{{ storageConditions }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Middle Column: Additional Info -->
                    <div class="lg:col-span-1 space-y-2">
                        <div>
                            <p class="text-sm text-gray-600">{{ t('cart.item.productId') }}:</p>
                            <p class="text-gray-900">{{ item.product.id }}</p>
                        </div>

                        <div>
                            <p class="text-sm text-gray-600">{{ t('cart.item.shelf') }}:</p>
                            <p class="text-gray-900">{{ shelfLife }}</p>
                        </div>

                        <div class="flex items-center gap-2">
                            <svg class="w-4 h-4 text-blue-500">
                                <use xlink:href="/sprite.svg#weight"></use>
                            </svg>
                            <span class="text-sm text-gray-900">{{ weightInfo }}</span>
                        </div>

                        <div class="flex items-center gap-2">
                            <svg class="w-4 h-4 text-blue-500">
                                <use xlink:href="/sprite.svg#package"></use>
                            </svg>
                            <span class="text-sm text-gray-900">{{ packagingInfo }}</span>
                        </div>

                        <!-- Rating -->
                        <div class="mt-4">
                            <div class="flex items-center gap-2 mb-2">
                                <StarRating
                                    :rating="currentRating"
                                    :max-stars="5"
                                    size="sm"
                                    @update:rating="handleRateProduct"
                                />
                                <span class="text-sm text-gray-600">({{ reviewCount }})</span>
                            </div>

                            <div class="flex gap-2">
                                <Button
                                    color="gray"
                                    variant="outline"
                                    size="xs"
                                    @click="$emit('view-product', item.product.id)"
                                >
                                    {{ t('cart.item.viewProduct') }}
                                </Button>
                                <Button
                                    color="gray"
                                    variant="outline"
                                    size="xs"
                                    @click="showAddReview"
                                >
                                    {{ t('cart.item.addReviews') }}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <!-- Right Column: Price & Actions -->
                    <div class="lg:col-span-1">
                        <div class="space-y-4">
                            <!-- Price Information -->
                            <div class="space-y-2">
                                <div>
                                    <p class="text-sm text-gray-600">{{ t('cart.item.price') }}:</p>
                                    <div class="flex items-center gap-2">
                                        <span class="text-lg font-bold text-gray-900">
                                            {{ formatPrice(finalPrice) }}
                                        </span>
                                        <span
                                            v-if="hasDiscount"
                                            class="text-sm text-gray-500 line-through"
                                        >
                                            {{ formatPrice(originalPrice) }}
                                        </span>
                                        <svg v-if="hasDiscount" class="w-3 h-3 text-green-500">
                                            <use xlink:href="/sprite.svg#arrow-down"></use>
                                        </svg>
                                    </div>
                                </div>

                                <div>
                                    <p class="text-sm text-gray-600"
                                        >{{ t('cart.item.interest') }}:</p
                                    >
                                    <p class="text-sm font-medium text-gray-900">{{
                                        interestRate
                                    }}</p>
                                </div>

                                <div>
                                    <p class="text-sm text-gray-600"
                                        >{{ t('cart.item.ownPrice') }}:</p
                                    >
                                    <div class="flex items-center gap-2">
                                        <input
                                            v-model.number="localOwnPrice"
                                            type="number"
                                            :min="0"
                                            step="0.01"
                                            class="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            @input="calculateInterest"
                                        />
                                        <span class="text-sm text-gray-600">{{
                                            currencySymbol
                                        }}</span>
                                    </div>
                                </div>

                                <div>
                                    <p class="text-sm text-gray-600">{{ t('cart.item.vat') }}:</p>
                                    <p class="text-sm font-medium text-gray-900">{{ vatRate }}%</p>
                                </div>

                                <div>
                                    <p class="text-sm text-gray-600">{{ t('cart.item.stock') }}:</p>
                                    <p class="text-sm font-medium text-green-600">{{
                                        stockStatus
                                    }}</p>
                                </div>
                            </div>

                            <!-- Quantity Controls -->
                            <div class="space-y-3">
                                <!-- Quick quantity buttons -->
                                <div class="flex gap-1">
                                    <button
                                        v-for="mult in [+1, +2, +3, +4, +5]"
                                        :key="mult"
                                        class="flex-1 px-2 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 border border-gray-300 transition-colors"
                                        :class="{ 'first:rounded-l last:rounded-r': true }"
                                        @click="adjustQuantity(mult)"
                                    >
                                        +{{ mult }}
                                    </button>
                                </div>

                                <!-- Main quantity control -->
                                <div
                                    class="flex items-center border border-gray-300 rounded overflow-hidden"
                                >
                                    <button
                                        class="px-3 py-2 hover:bg-gray-100 transition-colors"
                                        :disabled="localQuantity <= 0"
                                        @click="decreaseQuantity"
                                    >
                                        <svg class="w-4 h-4">
                                            <use xlink:href="/sprite.svg#minus"></use>
                                        </svg>
                                    </button>

                                    <input
                                        v-model.number="localQuantity"
                                        type="number"
                                        :min="0"
                                        class="flex-1 px-3 py-2 text-center border-0 focus:outline-none"
                                        @change="updateQuantity"
                                    />

                                    <button
                                        class="px-3 py-2 hover:bg-gray-100 transition-colors"
                                        @click="increaseQuantity"
                                    >
                                        <svg class="w-4 h-4">
                                            <use xlink:href="/sprite.svg#plus"></use>
                                        </svg>
                                    </button>
                                </div>

                                <!-- Total Price -->
                                <div class="pt-2 border-t border-gray-200">
                                    <div class="flex items-center justify-between">
                                        <span class="text-sm font-medium text-gray-900"
                                            >{{ t('cart.item.totalPrice') }}:</span
                                        >
                                        <span class="text-lg font-bold text-gray-900">{{
                                            formatPrice(totalPrice)
                                        }}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Action Buttons -->
                            <div class="space-y-2">
                                <Button
                                    v-if="savedMode"
                                    color="green"
                                    variant="filled"
                                    size="sm"
                                    class="w-full"
                                    @click="$emit('move-to-cart', item.id)"
                                >
                                    {{ t('cart.item.addToCart') }}
                                </Button>

                                <div class="flex gap-2">
                                    <Button
                                        color="gray"
                                        variant="outline"
                                        size="sm"
                                        class="flex-1"
                                        @click="toggleSaveForLater"
                                    >
                                        <svg class="w-4 h-4 mr-1">
                                            <use
                                                :xlink:href="`/sprite.svg#${savedMode ? 'cart' : 'bookmark'}`"
                                            ></use>
                                        </svg>
                                        {{
                                            savedMode
                                                ? t('cart.item.moveToCart')
                                                : t('cart.item.saveForLater')
                                        }}
                                    </Button>

                                    <Button
                                        color="red"
                                        variant="outline"
                                        size="sm"
                                        @click="$emit('remove', item.id)"
                                    >
                                        <svg class="w-4 h-4">
                                            <use xlink:href="/sprite.svg#trash"></use>
                                        </svg>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, watch } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useFormatters } from '~/composables/useFormatters'
    import type { CartItem } from '~/types/cart'

    interface Props {
        item: CartItem
        savedMode?: boolean
        currencySymbol?: string
    }

    const props = withDefaults(defineProps<Props>(), {
        savedMode: false,
        currencySymbol: '€',
    })

    const emit = defineEmits<{
        'update-quantity': [itemId: number, quantity: number]
        remove: [itemId: number]
        'save-for-later': [itemId: number]
        'move-to-cart': [itemId: number]
        'view-product': [productId: number]
        'rate-product': [productId: number, rating: number]
    }>()

    const { t } = useI18n()
    const { formatCurrency } = useFormatters()

    // Local state
    const localQuantity = ref(props.item.quantity)
    const localOwnPrice = ref(0)
    const currentRating = ref(0)

    // Computed properties
    const supplierName = computed(() => {
        // This would come from the supplier data in the item
        return 'Carlevana Vinery' // Placeholder based on design
    })

    const categoryName = computed(() => {
        return props.item.product.category?.name || 'Food, wines & spirits'
    })

    const storageConditions = computed(() => {
        return '0°C - 15°C' // Placeholder based on design
    })

    const shelfLife = computed(() => {
        return '250 Days' // Placeholder based on design
    })

    const weightInfo = computed(() => {
        return '250g' // Placeholder based on design
    })

    const packagingInfo = computed(() => {
        return '5 Pieces' // Placeholder based on design
    })

    const reviewCount = computed(() => {
        return 1204 // Placeholder based on design
    })

    const finalPrice = computed(() => {
        return (
            props.item.product.price?.user_currency?.final ||
            props.item.product.price?.product_currency?.final ||
            0
        )
    })

    const originalPrice = computed(() => {
        return (
            props.item.product.price?.user_currency?.original ||
            props.item.product.price?.product_currency?.original ||
            0
        )
    })

    const hasDiscount = computed(() => {
        return (
            props.item.product.price?.user_currency?.has_discount ||
            props.item.product.price?.product_currency?.has_discount ||
            false
        )
    })

    const discountPercentage = computed(() => {
        if (!hasDiscount.value) return 0
        return Math.round(((originalPrice.value - finalPrice.value) / originalPrice.value) * 100)
    })

    const totalPrice = computed(() => {
        return finalPrice.value * localQuantity.value
    })

    const interestRate = computed(() => {
        if (localOwnPrice.value <= 0 || finalPrice.value <= 0) return '0%'
        if (localOwnPrice.value <= finalPrice.value) return '0%'
        const profit = localOwnPrice.value - finalPrice.value
        const margin = (profit / localOwnPrice.value) * 100
        return `${margin.toFixed(1)}%`
    })

    const vatRate = computed(() => {
        return 7 // Placeholder based on design
    })

    const stockStatus = computed(() => {
        return t('cart.item.stockAvailable')
    })

    // Methods
    const formatPrice = (price: number) => {
        return formatCurrency(price, props.currencySymbol)
    }

    const adjustQuantity = (amount: number) => {
        localQuantity.value += amount
        updateQuantity()
    }

    const increaseQuantity = () => {
        localQuantity.value++
        updateQuantity()
    }

    const decreaseQuantity = () => {
        if (localQuantity.value > 0) {
            localQuantity.value--
            updateQuantity()
        }
    }

    const updateQuantity = () => {
        if (localQuantity.value < 0) {
            localQuantity.value = 0
        }
        emit('update-quantity', props.item.id, localQuantity.value)
    }

    const toggleSaveForLater = () => {
        if (props.savedMode) {
            emit('move-to-cart', props.item.id)
        } else {
            emit('save-for-later', props.item.id)
        }
    }

    const calculateInterest = () => {
        // Interest calculation is reactive via computed property
    }

    const handleRateProduct = (rating: number) => {
        currentRating.value = rating
        emit('rate-product', props.item.product.id, rating)
    }

    const showAddReview = () => {
        // Handle showing review dialog
    }

    // Initialize own price with final price
    watch(
        () => finalPrice.value,
        (newPrice) => {
            if (localOwnPrice.value === 0) {
                localOwnPrice.value = newPrice
            }
        },
        { immediate: true }
    )

    // Sync quantity with prop changes
    watch(
        () => props.item.quantity,
        (newQuantity) => {
            localQuantity.value = newQuantity
        }
    )
</script>

<style scoped>
    .cart-product-item {
        position: relative;
    }

    /* Ensure consistent input styling */
    input[type='number'] {
        -moz-appearance: textfield;
    }

    input[type='number']::-webkit-outer-spin-button,
    input[type='number']::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    /* Focus states */
    input:focus {
        outline: none;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
    }

    /* Hover effects for buttons */
    button:hover:not(:disabled) {
        transform: translateY(-1px);
        transition: transform 0.1s ease;
    }

    button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style>
