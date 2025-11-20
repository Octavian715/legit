<template>
    <div class="product-price-container overflow-hidden" :class="[containerClasses]">
        <div v-if="visible && price" class="price-visible">
            <!-- PRICE ROW -->
            <div class="price-row">
                <span class="label">{{ t('price', 0) }}:</span>
                <div class="price-values justify-between">
                    <div class="price-content">
                        <span class="final-price">
                            {{ formatPrice(currentActivePrice) }}
                        </span>
                        <span
                            v-if="showOriginalPrice"
                            class="original-price flex items-center gap-1"
                        >
                            {{ formatPrice(originalPrice) }}
                            <svg class="w-4 h-4 text-green-500">
                                <use :xlink:href="`/sprite.svg#arrow_down`"></use>
                            </svg>
                        </span>
                    </div>
                    <button
                        v-if="hasVolumeDiscount"
                        v-tooltip.buttom="{
                            content: volumeDiscountTooltipHtml,
                            html: true,
                            placement: 'right',
                            delay: { show: 200, hide: 100 },
                            distance: 12,
                        }"
                        type="button"
                        class="info-btn w-fit"
                        @click.prevent
                    >
                        <svg class="w-5 h-5 ml-auto">
                            <use :xlink:href="`/sprite.svg#info`"></use>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- DISCOUNT ROW - Only show if volume discounts exist -->
            <!-- <div v-if="hasVolumeDiscount" class="discount-row">
                <span class="label">{{ t('product.bulkSavings') }}:</span>
                <div class="flex items-center justify-between gap-2">
                    <span v-if="priceRange" class="discount-badge">
                        {{ formatPrice(priceRange.lowest) }}-{{ formatPrice(priceRange.highest) }}
                    </span>
                    <span v-else-if="activeDiscountTier" class="discount-badge">
                        {{ formatPrice(activeDiscountTier.price) }}
                    </span>
                    <span v-else class="discount-badge">-</span>
                    <button
                        v-tooltip.buttom="{
                            content: volumeDiscountTooltipHtml,
                            html: true,
                            placement: 'right',
                            delay: { show: 200, hide: 100 },
                            distance: 12,
                        }"
                        type="button"
                        class="info-btn w-fit"
                        @click.prevent
                    >
                        <svg class="w-5 h-5 ml-auto">
                            <use :xlink:href="`/sprite.svg#info`"></use>
                        </svg>
                    </button>
                </div>
            </div> -->

            <!-- INTEREST ROW -->
            <div class="interest-row">
                <span class="label">{{ t('product.interest') }}:</span>
                <div class="value">{{ marginPercentage }}</div>
            </div>

            <!-- OWN PRICE ROW -->
            <div class="own-price-row">
                <span class="label">{{ t('product.ownPrice') }}:</span>
                <div class="own-price-input-wrapper">
                    <input
                        v-model.number="ownPrice"
                        type="number"
                        :min="0"
                        :max="999999"
                        :step="0.01"
                        class="own-price-input"
                        @input="validateOwnPrice"
                        @blur="roundOwnPrice"
                    />
                </div>
            </div>

            <!-- VAT ROW -->
            <div class="vat-row">
                <span class="label">{{ t('product.vat') }}:</span>
                <div class="value">{{ vatValue || 0 }}%</div>
            </div>

            <!-- STOCK ROW -->
            <!-- <div class="stock-row">
                <span class="label">{{ t('product.stock') }}</span>
                <div class="value">{{ props.stock }}</div>
            </div> -->

            <!-- ENHANCED PROGRESS BAR WITH STEP INDICATORS -->
            <div v-if="displayQuantity > 0 && hasVolumeDiscount" class="discount-progress-section">
                <!-- SAVINGS TEXT ABOVE PROGRESS BAR WITH MAX BADGE -->
                <div class="savings-header-container">
                    <div class="savings-header">
                        <div
                            v-if="totalSavings > 0"
                            class="savings-text-above"
                            :class="{ 'savings-text-glow': isMaxDiscountReached }"
                        >
                            {{ t('product.youSaved') }}: <strong>{{ formatPrice(totalSavings) }}</strong>
                        </div>
                        <Transition name="badge-pop">
                            <div v-if="isMaxDiscountReached" class="max-savings-badge">
                                🎉 {{ t('product.maxSavings') || 'MAX SAVINGS!' }}
                            </div>
                        </Transition>
                    </div>
                </div>

                <!-- PROGRESS BAR WITH FIXED STEPS -->
                <div class="progress-bar-wrapper">
                    <!-- CELEBRATION PARTICLES -->
                    <Transition name="celebration-fade">
                        <div v-if="showCelebration" :key="celebrationKey" class="celebration-container">
                            <div v-for="i in 12" :key="i" class="celebration-particle" :style="{ '--i': i }"></div>
                        </div>
                    </Transition>

                    <div class="progress-bar-track" :class="{ 'progress-complete': isMaxDiscountReached }">
                        <div
                            class="progress-bar-fill"
                            :class="[progressBarColorClass, { 'progress-fill-complete': isMaxDiscountReached }]"
                            :style="progressBarStyle"
                        ></div>

                        <!-- FIXED STEP INDICATORS -->
                        <div
                            v-for="(step, index) in fixedSteps"
                            :key="index"
                            v-tooltip="{
                                content: step.tooltipContent,
                                html: true,
                                placement: 'top',
                                delay: { show: 100, hide: 50 },
                            }"
                            class="progress-step"
                            :class="{ achieved: step.isAchieved }"
                            :style="{ left: `${step.position}%` }"
                        >
                            <div class="step-circle"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div v-else class="h-[26px]"></div>

            <!-- QUANTITY SELECTOR -->
            <div class="quantity-selector">
                <div class="multiplier-buttons">
                    <button
                        v-for="mult in multipliers"
                        :key="mult"
                        class="multiplier-btn"
                        :class="{
                            active: selectedMultiplier === mult,
                            loading: isQuantityLoading,
                        }"
                        :disabled="isCartLoading || isQuantityLoading || isOwn"
                        @click="applyMultiplier(mult)"
                    >
                        <div
                            v-if="isQuantityLoading && selectedMultiplier === mult"
                            class="absolute inset-0 flex items-center justify-center"
                        >
                            <div class="loader-btn !bg-gray-600 h-3 w-3"></div>
                        </div>
                        <span
                            :class="{
                                'opacity-0': isQuantityLoading && selectedMultiplier === mult,
                            }"
                        >
                            {{ mult > 0 ? '+' : '' }}{{ mult }}
                        </span>
                    </button>
                </div>

                <div class="flex gap-2 w-full">
                    <Transition name="fade-slide">
                        <Button
                            v-if="currentCartQuantity > 0"
                            color="red"
                            size="md"
                            variant="filled"
                            :loading="cartIsLoading"
                            font-weight="normal"
                            :label="t('remove')"
                            container-classes="!rounded"
                            @click="handleRemoveItem(productId)"
                        ></Button>
                    </Transition>
                    <div class="quantity-controls">
                        <button
                            class="quantity-btn decrease"
                            :disabled="
                                displayQuantity <= 0 || isCartLoading || isQuantityLoading || isOwn
                            "
                            @click="decreaseQuantity"
                        >
                            <div
                                v-if="isQuantityLoading && quantityAction === 'decrease'"
                                class="absolute inset-0 flex items-center justify-center"
                            >
                                <div class="loader-btn !bg-gray-600 h-3 w-3"></div>
                            </div>
                            <svg
                                v-if="!(isQuantityLoading && quantityAction === 'decrease')"
                                class="w-5 h-5"
                            >
                                <use :xlink:href="`/sprite.svg#minus`"></use>
                            </svg>
                        </button>

                        <div class="quantity-input-wrapper">
                            <input
                                v-model.number="displayQuantity"
                                type="number"
                                :min="0"
                                :max="9999999"
                                class="quantity-input"
                                :disabled="isCartLoading || isQuantityLoading || isOwn"
                                @input="onQuantityInputValidation"
                                @blur="onQuantityInputCommit"
                                @keydown.enter="($event.target as HTMLInputElement).blur()"
                            />
                            <div
                                v-if="isQuantityLoading && quantityAction === 'input'"
                                class="absolute inset-0 flex items-center justify-center bg-white/80"
                            >
                                <div class="loader-btn !bg-gray-600 h-3 w-3"></div>
                            </div>
                        </div>

                        <button
                            class="quantity-btn increase"
                            :disabled="
                                isOwn ||
                                displayQuantity >= maxQuantity ||
                                isCartLoading ||
                                isQuantityLoading
                            "
                            @click="increaseQuantity"
                        >
                            <div
                                v-if="isQuantityLoading && quantityAction === 'increase'"
                                class="absolute inset-0 flex items-center justify-center"
                            >
                                <div class="loader-btn !bg-gray-600 h-3 w-3"></div>
                            </div>
                            <svg
                                v-if="!(isQuantityLoading && quantityAction === 'increase')"
                                class="w-5 h-5"
                            >
                                <use :xlink:href="`/sprite.svg#plus`"></use>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <!-- TOTAL PRICE ROW -->
            <div class="total-price-row">
                <span class="label">{{ t('totalPrice', 0) }}:</span>
                <div v-if="!pendingUpdate && !isPriceLoading" class="total-value h-5">
                    {{ formatPrice(totalPrice) }}
                </div>
                <div v-else class="h-5 flex items-center">
                    <div class="loader-btn !bg-gray-950 h-4 w-16"></div>
                </div>
            </div>
        </div>

        <div v-else class="price-hidden">
            <div class="warning-icon">
                <svg class="w-12 h-12 text-red-500">
                    <use :xlink:href="`/sprite.svg#alert`"></use>
                </svg>
            </div>
            <h3 class="warning-title">{{ t('product.pricesNotPublic') }}</h3>
            <p class="warning-message">{{ t('product.unlockPriceMessage') }}</p>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { debounce } from 'lodash-es'
    import { useFormatters } from '~/composables/useFormatters'
    import { useCart } from '~/composables/useCart'
    import { useCartStore } from '~/stores/cart'
    import { useUserStore } from '~/stores/user'

    interface Currency {
        id: number
        code: string
        symbol: string
    }

    interface PriceData {
        currency: Currency
        type: string
        original: number
        final: number
        discount_percentage: number
        has_discount: boolean
    }

    interface StandardPrice {
        product_currency: PriceData
        user_currency: PriceData | null
    }

    interface LineTotals {
        product_currency: {
            original: number
            final: number
            currency: Currency
        }
        user_currency: {
            original: number
            final: number
            currency: Currency
        }
    }

    interface CartPrice {
        unit_price: StandardPrice
        line_totals: LineTotals
    }

    interface VolumeDiscount {
        quantity_from: string | number
        price: string | number
        currency: Currency
    }

    interface ProgressStep {
        position: number
        isActive: boolean
        isAchieved: boolean
        tooltipContent: string
        tier: {
            quantity_from: number
            price: number
            currency: Currency
        }
    }

    type Price = StandardPrice | CartPrice

    type ModeProductCard = 'cart' | 'product' | 'products' | 'favorite' | 'templates'

    interface Props {
        productId: number
        isOwn: boolean
        volumeDiscounts?: VolumeDiscount[]
        mode?: ModeProductCard
        visible?: boolean
        picesPerBox?: number
        containerClasses?: string
        price?: Price | undefined
        vat?: number
        stock?: number
        quantity?: number | undefined
        minOrderQty?: number
        maxOrderQty?: number
    }

    const props = withDefaults(defineProps<Props>(), {
        mode: 'product',
        containerClasses: '',
        picesPerBox: 1,
        vat: 0,
        stock: 0,
        minOrderQty: 1,
        maxOrderQty: 99999999,
        isOwn: false,
        volumeDiscounts: () => [],
    })

    const emit = defineEmits<{
        'quantity-updated': [quantity: number]
        'remove-from-cart': [id: number]
    }>()

    const { t } = useI18n()
    const userStore = useUserStore()
    const cartStore = useCartStore()
    const toast = useToastNotification()

    const { formatCurrency, formatPercentage, calculateMarkupPercentage } = useFormatters()
    const {
        findCartItemByProduct,
        quickAddToCart,
        quickUpdateQuantity,
        quickRemoveItem,
        isLoading: cartIsLoading,
        getCartQuantity,
    } = useCart()

    const isPriceLoading = ref(false)
    const isQuantityLoading = ref(false)
    const quantityAction = ref<'increase' | 'decrease' | 'input' | 'multiplier' | null>(null)
    const isSyncingFromCart = ref(false)
    const displayQuantity = ref<number>(0)
    const inputPendingValue = ref<number | null>(null)
    const ownPrice = ref(0)
    const vatValue = ref(props.vat)
    const selectedMultiplier = ref<number | null>(null)
    const pendingUpdate = ref(false)
    const lastUpdateValue = ref<number | null>(null)
    const showCelebration = ref(false)
    const celebrationKey = ref(0)

    const multipliers = [1, 2, 3, 4, 5]

    const isCartMode = computed(() => props.mode === 'cart')

    const hasCartPrice = (price: Price): price is CartPrice => {
        return 'unit_price' in price && 'line_totals' in price
    }

    const hasStandardPrice = (price: Price): price is StandardPrice => {
        return 'product_currency' in price && !('unit_price' in price)
    }

    const standardPrice = computed((): StandardPrice | null => {
        if (!props.price) return null

        if (hasCartPrice(props.price)) {
            return props.price.unit_price
        }

        if (hasStandardPrice(props.price)) {
            return props.price
        }

        return null
    })

    const activePrice = computed(() => {
        if (!standardPrice.value) return null
        return standardPrice.value.user_currency || standardPrice.value.product_currency
    })

    const lineTotals = computed(() => {
        if (!props.price || !hasCartPrice(props.price)) return null
        return props.price.line_totals
    })

    const sortedVolumeDiscounts = computed(() => {
        if (!props.volumeDiscounts || props.volumeDiscounts.length === 0) return []

        return [...props.volumeDiscounts]
            .map((discount) => ({
                quantity_from: Number(discount.quantity_from),
                price: Number(discount.price),
                currency: discount.currency,
            }))
            .filter((d) => !isNaN(d.quantity_from) && !isNaN(d.price))
            .sort((a, b) => a.quantity_from - b.quantity_from)
    })

    const hasVolumeDiscount = computed(() => sortedVolumeDiscounts.value.length > 0)

    const priceRange = computed(() => {
        if (!hasVolumeDiscount.value) return null

        const prices = sortedVolumeDiscounts.value.map((tier) => {
            let price = tier.price
            if (activePrice.value?.has_discount && activePrice.value.discount_percentage) {
                const discountPercent = Number(activePrice.value.discount_percentage)
                price = tier.price * (1 - discountPercent / 100)
            }
            return price
        })

        const lowestPrice = Math.min(...prices)
        const highestPrice = Math.max(...prices)

        if (lowestPrice === highestPrice) return null

        return {
            lowest: lowestPrice,
            highest: highestPrice,
        }
    })

    const activeDiscountTier = computed(() => {
        if (!hasVolumeDiscount.value || displayQuantity.value === 0) return null

        const quantity = displayQuantity.value
        let activeTier = null

        for (const tier of sortedVolumeDiscounts.value) {
            if (quantity >= tier.quantity_from) {
                activeTier = tier
            } else {
                break
            }
        }

        return activeTier
    })

    const nextDiscountTier = computed(() => {
        if (!hasVolumeDiscount.value) return null

        const quantity = displayQuantity.value

        for (const tier of sortedVolumeDiscounts.value) {
            if (quantity < tier.quantity_from) {
                return tier
            }
        }

        return null
    })

    const originalPrice = computed(() => {
        return activePrice.value?.original || 0
    })

    const currentActivePrice = computed(() => {
        if (activeDiscountTier.value) {
            const volumePrice = activeDiscountTier.value.price

            if (activePrice.value?.has_discount && activePrice.value.discount_percentage) {
                const discountPercent = Number(activePrice.value.discount_percentage)
                const discountedVolumePrice = volumePrice * (1 - discountPercent / 100)
                return Number(discountedVolumePrice.toFixed(2))
            }

            return volumePrice
        }

        return activePrice.value?.final || 0
    })

    const showOriginalPrice = computed(() => {
        if (activeDiscountTier.value !== null && originalPrice.value !== currentActivePrice.value) {
            return true
        }
        if (activePrice.value?.has_discount && originalPrice.value !== currentActivePrice.value) {
            return true
        }
        return false
    })

    // Calculate total savings based on original price
    const totalSavings = computed(() => {
        if (displayQuantity.value === 0 || !originalPrice.value) return 0

        const savedPerUnit = originalPrice.value - currentActivePrice.value
        return Math.max(0, savedPerUnit * displayQuantity.value)
    })

    const progressToNextTier = computed(() => {
        if (!hasVolumeDiscount.value || displayQuantity.value === 0) return 0

        const quantity = displayQuantity.value
        const tiers = sortedVolumeDiscounts.value

        // Find current tier index (which tier have we reached)
        let currentTierIndex = -1
        for (let i = 0; i < tiers.length; i++) {
            if (quantity >= tiers[i].quantity_from) {
                currentTierIndex = i
            } else {
                break
            }
        }

        const margin = 10 // Same margin as step positions
        const usableWidth = 100 - 2 * margin

        // CRITICAL: If at or beyond last tier, go to 100% IMMEDIATELY
        if (currentTierIndex >= tiers.length - 1) {
            return 100
        }

        // If before first tier (quantity < first tier)
        if (currentTierIndex === -1) {
            const nextTier = tiers[0]
            const progressRatio = quantity / nextTier.quantity_from

            // Progress from 0% to first step position (10%)
            return progressRatio * margin
        }

        // Between two tiers
        const currentTier = tiers[currentTierIndex]
        const nextTier = tiers[currentTierIndex + 1]

        // Calculate progress between current and next tier (0.0 to 1.0)
        const progressRatio =
            (quantity - currentTier.quantity_from) /
            (nextTier.quantity_from - currentTier.quantity_from)

        // Calculate step positions for current and next tier
        const currentStepPos = margin + (currentTierIndex / (tiers.length - 1)) * usableWidth
        const nextStepPos = margin + ((currentTierIndex + 1) / (tiers.length - 1)) * usableWidth

        // Interpolate progress between current step position and next step position
        const progress = currentStepPos + progressRatio * (nextStepPos - currentStepPos)

        return Math.min(Math.max(progress, 0), 100)
    })

    // Check if max discount is reached (100%)
    const isMaxDiscountReached = computed(() => {
        return progressToNextTier.value >= 100
    })

    const progressBarColorClass = computed(() => {
        // APLICĂ UN SINGUR GRADIENT STATIC: Roșu -> Galben -> Verde
        return 'from-red-500 via-yellow-500 to-green-600'
    })
    // Noua proprietate computed pentru stilul barei de progres
    const progressBarStyle = computed(() => {
        const widthPercent = progressToNextTier.value

        // Gradientul fix (de la Roșu, la Galben, la Verde)
        // Am folosit culorile din Tailwind: red-500, yellow-400, emerald-500
        const gradient = 'linear-gradient(to right, #FF0000, #FFD400, #32AF7F)'

        // La 0%, nu afișăm nimic și evităm împărțirea la zero
        if (widthPercent <= 0) {
            return { width: '0%' }
        }

        // Aici e trucul:
        // Setăm lățimea barei (ex: 10%)
        // Setăm fundalul ca fiind gradientul
        // Setăm 'background-size' să fie inversul lățimii (ex: 1000%)
        // Asta face ca gradientul să rămână fix, iar bara doar îl "dezvăluie"
        const backgroundSizeX = 100 / (widthPercent / 100)

        return {
            width: `${widthPercent}%`,
            backgroundImage: gradient,
            backgroundSize: `${backgroundSizeX}% 100%`,
        }
    })
    const remainingAmountToNextTier = computed(() => {
        if (!nextDiscountTier.value || displayQuantity.value === 0) return 0

        const qtyNeeded = nextDiscountTier.value.quantity_from - displayQuantity.value
        const currentPrice = currentActivePrice.value

        return Math.max(0, qtyNeeded * currentPrice)
    })

    // Calculate FIXED step positions INSIDE the progress bar (not at edges)
    const fixedSteps = computed((): ProgressStep[] => {
        if (!hasVolumeDiscount.value) return []

        const totalSteps = Math.min(sortedVolumeDiscounts.value.length, 10)
        const steps: ProgressStep[] = []

        const margin = 10 // 10% margin on each side
        const usableWidth = 100 - 2 * margin // 80% usable width

        // Create evenly spaced fixed positions INSIDE the bar (between 10% and 90%)
        for (let i = 0; i < totalSteps; i++) {
            // Distribute evenly between margin% and (100-margin)%
            const position = margin + (i / (totalSteps - 1)) * usableWidth
            const tier = sortedVolumeDiscounts.value[i]

            if (!tier) continue

            let displayPrice = tier.price
            if (activePrice.value?.has_discount && activePrice.value.discount_percentage) {
                const discountPercent = Number(activePrice.value.discount_percentage)
                displayPrice = tier.price * (1 - discountPercent / 100)
            }

            const tooltipContent = `
                <div style="font-size: 14px; font-weight: 600; color: #fff; white-space: nowrap; padding: 4px 8px;">
                    ${t('price', 0)}: ${formatCurrency(displayPrice, tier.currency.symbol)}
                </div>
            `

            steps.push({
                position: position,
                isActive: tier === activeDiscountTier.value,
                isAchieved: displayQuantity.value >= tier.quantity_from,
                tooltipContent,
                tier,
            })
        }

        return steps
    })

    const volumeDiscountTooltipHtml = computed(() => {
        if (!hasVolumeDiscount.value) return ''

        const parts: string[] = []

        parts.push(`<div style="line-height:115%">`)

        parts.push(
            `<div style="font-size: 16px; font-weight: 400; margin-bottom: 8px; color: #e5e7eb;">`
        )
        parts.push(
            `<strong>Hint:</strong> ${t('product.volumeDiscountHintPart1')}<br/>${t('product.volumeDiscountHintPart2')}`
        )
        parts.push(`</div>`)

        sortedVolumeDiscounts.value.forEach((tier) => {
            const boxText = `${t('product.box', { count: tier.quantity_from })}`

            let displayPrice = tier.price
            if (activePrice.value?.has_discount && activePrice.value.discount_percentage) {
                const discountPercent = Number(activePrice.value.discount_percentage)
                displayPrice = tier.price * (1 - discountPercent / 100)
            }

            parts.push(`
                <div style="font-size: 16px; font-weight: 400; margin-bottom: 8px; color: #e5e7eb;">
                    ${boxText} – ${formatCurrency(displayPrice, tier.currency.symbol)}
                </div>
            `)
        })

        parts.push(`</div>`)

        return parts.join('')
    })

    const maxQuantity = computed(() => Math.min(props.maxOrderQty, props.stock))

    const currentCartQuantity = computed(() => {
        if (isCartMode.value) {
            return props.quantity ?? 0
        }

        return getCartQuantity(props.productId)
    })

    const cartItemInfo = computed(() => {
        const item = findCartItemByProduct(props.productId)
        return {
            id: item?.id || null,
            quantity: item?.quantity || 0,
        }
    })

    const isCartLoading = computed(() => {
        return cartIsLoading.value || pendingUpdate.value || cartStore.isUpdating
    })

    const cartItemId = computed(() => cartItemInfo.value.id)

    const marginPercentage = computed(() => {
        const markup = calculateMarkupPercentage(ownPrice.value, currentActivePrice.value)
        return formatPercentage(markup, 1)
    })

    const totalPrice = computed(() => {
        if (isCartMode.value && lineTotals.value) {
            const userCurrency = lineTotals.value.user_currency
            const productCurrency = lineTotals.value.product_currency

            return userCurrency?.final ?? productCurrency?.final ?? 0
        }

        const basePrice = currentActivePrice.value || 0
        const quantity = Number(displayQuantity.value)

        return basePrice * quantity * props.picesPerBox
    })

    const formatPrice = (value: number): string => {
        if (!activePrice.value || !activePrice.value.currency) {
            return formatCurrency(value, userStore.currencySymbol)
        }
        return formatCurrency(value, activePrice.value.currency.symbol)
    }

    const setQuantityLoading = (action: string, loading: boolean) => {
        isQuantityLoading.value = loading
        quantityAction.value = loading ? (action as any) : null
    }

    const setPriceLoading = (loading: boolean) => {
        isPriceLoading.value = loading
    }

    const initializeQuantity = () => {
        isSyncingFromCart.value = true

        const initialQuantity = currentCartQuantity.value

        displayQuantity.value = initialQuantity
        lastUpdateValue.value = initialQuantity > 0 ? initialQuantity : null
        inputPendingValue.value = null

        nextTick(() => {
            isSyncingFromCart.value = false
        })
    }

    const handleCartUpdate = async (newQuantity: number) => {
        if (lastUpdateValue.value === newQuantity) {
            pendingUpdate.value = false
            setQuantityLoading('', false)
            return
        }

        lastUpdateValue.value = newQuantity
        pendingUpdate.value = true

        try {
            const itemId = cartItemId.value

            if (newQuantity <= 0) {
                if (itemId) {
                    await quickRemoveItem(itemId)
                }
            } else if (itemId) {
                await quickUpdateQuantity(itemId, newQuantity)
            } else {
                await quickAddToCart(props.productId, newQuantity)
            }

            emit('quantity-updated', newQuantity)
        } catch (error) {
            console.error('[ProductPrice] Cart update error:', error)

            nextTick(() => {
                initializeQuantity()
            })
        } finally {
            pendingUpdate.value = false
            setQuantityLoading('', false)
        }
    }

    const debouncedCartUpdate = debounce(handleCartUpdate, 300)

    const triggerCartUpdate = (newQuantity: number) => {
        if (isSyncingFromCart.value) {
            setQuantityLoading('', false)
            return
        }

        if (typeof newQuantity === 'number' && !isNaN(newQuantity)) {
            if (isCartMode.value) {
                handleCartUpdate(newQuantity)
            } else {
                pendingUpdate.value = true
                debouncedCartUpdate(newQuantity)
            }
        }
    }

    const applyMultiplier = (multiplier: number) => {
        if (isCartLoading.value || isQuantityLoading.value || props.isOwn) return

        selectedMultiplier.value = multiplier
        setQuantityLoading('multiplier', true)

        const newQuantity = Math.max(
            0,
            Math.min(displayQuantity.value + multiplier, maxQuantity.value)
        )

        displayQuantity.value = newQuantity

        triggerCartUpdate(newQuantity)

        setTimeout(() => {
            selectedMultiplier.value = null
        }, 200)
    }

    const increaseQuantity = () => {
        if (
            props.isOwn ||
            displayQuantity.value >= maxQuantity.value ||
            isCartLoading.value ||
            isQuantityLoading.value
        )
            return

        setQuantityLoading('increase', true)
        const newQuantity = Math.min(displayQuantity.value + 1, maxQuantity.value)
        displayQuantity.value = newQuantity
        triggerCartUpdate(newQuantity)
    }

    const decreaseQuantity = () => {
        if (displayQuantity.value <= 0 || isCartLoading.value || isQuantityLoading.value) return

        setQuantityLoading('decrease', true)
        const newQuantity = Math.max(0, displayQuantity.value - 1)
        displayQuantity.value = newQuantity
        triggerCartUpdate(newQuantity)
    }

    const onQuantityInputValidation = (event: Event) => {
        const target = event.target as HTMLInputElement
        let value = parseInt(target.value) || 0

        if (value < 0) value = 0
        if (value > maxQuantity.value) value = maxQuantity.value

        displayQuantity.value = value
        inputPendingValue.value = value
    }

    const onQuantityInputCommit = () => {
        if (inputPendingValue.value !== null) {
            setQuantityLoading('input', true)
            triggerCartUpdate(inputPendingValue.value)
            inputPendingValue.value = null
        }
    }

    const validateOwnPrice = (event: Event) => {
        const target = event.target as HTMLInputElement
        let value = parseFloat(target.value) || 0

        if (value < 0) {
            value = 0
        } else if (value > 999999) {
            value = 999999
        }

        ownPrice.value = value
    }

    const roundOwnPrice = () => {
        ownPrice.value = Math.round(ownPrice.value * 100) / 100
    }

    const handleRemoveItem = async (productId: number) => {
        try {
            const itemId = cartItemId.value
            if (itemId) {
                await quickRemoveItem(itemId)
                emit('remove-from-cart', productId)
            }
        } catch (error) {
            console.error('[ProductPrice] Error removing item:', error)
        }
    }

    watch(
        () => currentCartQuantity.value,
        (newQuantity) => {
            if (!pendingUpdate.value && !isQuantityLoading.value) {
                initializeQuantity()
            }
        }
    )

    watch(
        () => props.quantity,
        (newQuantity) => {
            if (
                isCartMode.value &&
                newQuantity !== undefined &&
                newQuantity !== displayQuantity.value
            ) {
                initializeQuantity()
            }
        }
    )

    // Watch for 100% completion to trigger celebration
    watch(isMaxDiscountReached, (newVal, oldVal) => {
        if (newVal && !oldVal) {
            // Trigger celebration
            showCelebration.value = true
            celebrationKey.value++

            // Hide celebration after animation
            setTimeout(() => {
                showCelebration.value = false
            }, 1500)
        }
    })

    onMounted(() => {
        nextTick(() => {
            initializeQuantity()
        })
    })

    onBeforeUnmount(() => {
        debouncedCartUpdate.cancel()
    })
</script>

<style scoped>
    .product-price-container {
        @apply w-full lg:w-72 bg-gray-200 rounded-sm p-3 border border-gray-400 lg:h-auto;
    }

    .price-visible {
        @apply space-y-1;
    }

    .price-row {
        @apply h-4;
    }

    .price-row,
    .discount-row,
    .interest-row,
    .own-price-row,
    .vat-row,
    .stock-row,
    .total-price-row {
        @apply grid grid-cols-[1.3fr_2fr] items-center gap-1;
    }

    .interest-row,
    .own-price-row {
        @apply hidden sm:grid;
    }

    .label {
        @apply text-subtitle4 text-gray-800;
    }

    .price-values {
        @apply flex items-center gap-2;
    }

    .price-content {
        @apply flex items-center gap-2;
    }

    .final-price,
    .price-range,
    .discount-badge {
        @apply font-bold text-subtitle4 text-gray-950;
    }

    .original-price {
        @apply text-subtitle4 font-bold text-gray-800 line-through decoration-red-500;
    }

    .info-btn {
        @apply flex items-center justify-end text-gray-800 hover:text-blue-500 hover:scale-105 transition-colors cursor-help;
    }

    .value {
        @apply font-bold text-subtitle4 text-gray-950;
    }

    .own-price-input-wrapper {
        @apply flex items-center gap-2 text-subtitle4 relative;
    }

    .own-price-input {
        @apply w-full p-2 border border-gray-600 rounded text-left focus:outline-none focus:border-gray-800 transition-colors;
    }

    .own-price-input:disabled {
        @apply opacity-70 cursor-not-allowed;
    }

    .discount-progress-section {
        @apply space-y-1;
    }

    .savings-header-container {
        @apply relative;
        min-height: 20px;
    }

    .savings-header {
        @apply flex items-center justify-between gap-2;
    }

    .savings-text-above {
        @apply text-gray-800 text-subtitle4 font-normal transition-all duration-300 flex-shrink-0;
    }

    .savings-text-glow {
        @apply text-green-600 font-bold;
        animation: text-glow 2s ease-in-out infinite;
    }

    @keyframes text-glow {
        0%,
        100% {
            text-shadow: 0 0 4px rgba(50, 175, 127, 0.5);
        }
        50% {
            text-shadow: 0 0 8px rgba(50, 175, 127, 0.8), 0 0 12px rgba(50, 175, 127, 0.5);
        }
    }

    .max-savings-badge {
        @apply px-2 py-0.5 bg-green-600 text-white text-subtitle4 font-bold rounded-full whitespace-nowrap flex-shrink-0;
        box-shadow: 0 0 12px rgba(50, 175, 127, 0.6);
        animation: badge-pulse 2s ease-in-out infinite;
    }

    @keyframes badge-pulse {
        0%,
        100% {
            transform: scale(1);
            box-shadow: 0 0 12px rgba(50, 175, 127, 0.6);
        }
        50% {
            transform: scale(1.05);
            box-shadow: 0 0 20px rgba(50, 175, 127, 0.9);
        }
    }

    .badge-pop-enter-active {
        animation: badge-pop-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .badge-pop-leave-active {
        animation: badge-pop-out 0.3s cubic-bezier(0.4, 0, 0.6, 1);
    }

    @keyframes badge-pop-in {
        0% {
            opacity: 0;
            transform: scale(0) rotate(-10deg);
        }
        100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
        }
    }

    @keyframes badge-pop-out {
        0% {
            opacity: 1;
            transform: scale(1);
        }
        100% {
            opacity: 0;
            transform: scale(0.8);
        }
    }

    .progress-info {
        @apply flex items-center justify-between text-subtitle4;
    }

    .progress-label {
        @apply text-gray-700 font-medium;
    }

    .progress-value {
        @apply text-gray-950 font-bold;
    }

    .progress-bar-wrapper {
        @apply relative;
        min-height: 8px;
    }

    .celebration-container {
        @apply absolute pointer-events-none z-20;
        left: 0;
        right: 0;
        top: -20px;
        bottom: -20px;
    }

    .celebration-particle {
        @apply absolute w-2 h-2 rounded-full;
        left: 50%;
        top: 50%;
        background: linear-gradient(45deg, #FFD400, #FF0000, #32AF7F);
        animation: particle-burst 1s ease-out forwards;
        animation-delay: calc(var(--i) * 0.05s);
    }

    @keyframes particle-burst {
        0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
        }
        100% {
            transform: translate(
                    calc(cos(calc(var(--i) * 30deg)) * 40px),
                    calc(sin(calc(var(--i) * 30deg)) * 40px)
                )
                scale(0);
            opacity: 0;
        }
    }

    .celebration-fade-enter-active {
        animation: celebration-in 0.3s ease-out;
    }

    @keyframes celebration-in {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    .progress-bar-track {
        @apply w-full bg-gray-300 rounded-full overflow-visible relative transition-all duration-300;
        height: 8px;
    }

    .progress-bar-track.progress-complete {
        @apply bg-gray-400;
        box-shadow: 0 0 8px rgba(50, 175, 127, 0.4);
        animation: track-glow 2s ease-in-out infinite;
    }

    @keyframes track-glow {
        0%,
        100% {
            box-shadow: 0 0 8px rgba(50, 175, 127, 0.4);
        }
        50% {
            box-shadow: 0 0 16px rgba(50, 175, 127, 0.7), 0 0 24px rgba(50, 175, 127, 0.4);
        }
    }

    .progress-bar-fill {
        @apply h-full bg-gradient-to-r transition-all duration-500 ease-out relative flex items-center justify-center rounded-full;
    }

    .progress-bar-fill.progress-fill-complete {
        animation: fill-pulse 2s ease-in-out infinite;
    }

    @keyframes fill-pulse {
        0%,
        100% {
            filter: brightness(1);
        }
        50% {
            filter: brightness(1.2);
        }
    }

    .progress-percentage {
        @apply text-white text-subtitle4 font-bold drop-shadow-sm;
    }

    .progress-remaining {
        @apply text-start text-subtitle4 text-gray-600 font-normal;
    }

    /* Step indicators styling - FIXED positions */
    .progress-step {
        @apply absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 cursor-pointer;
        @apply transition-transform duration-200 ease-out;
    }

    .step-circle {
        @apply w-1 h-1 rounded-full bg-gray-600 transition-all duration-200;
    }

    /* Green for achieved steps */
    .progress-step.achieved .step-circle {
        @apply bg-white shadow-lg;
    }

    .progress-step:hover .step-circle {
        @apply scale-150;
    }

    .quantity-selector {
        @apply flex flex-col sm:flex-row items-center md:flex-col gap-2 border-t border-gray-200;
    }

    .multiplier-buttons {
        @apply flex gap-0 justify-center flex-1 w-full;
    }

    .multiplier-btn {
        @apply px-3 py-2 text-subtitle3 font-semibold bg-gray-100 text-gray-700 transition-all duration-150 flex-1 h-8 relative;
        @apply border border-gray-600;
        @apply hover:bg-gray-600 hover:text-white hover:border-gray-800 hover:z-10;
        @apply active:bg-gray-800 active:text-white active:border-gray-800;
    }

    .multiplier-btn:first-child {
        @apply rounded-l;
    }

    .multiplier-btn:last-child {
        @apply rounded-r;
    }

    .multiplier-btn:not(:first-child) {
        @apply -ml-px;
    }

    .multiplier-btn.active {
        @apply bg-gray-300 border-gray-600;
    }

    .multiplier-btn.loading {
        @apply cursor-wait;
    }

    .multiplier-btn:disabled {
        @apply opacity-50 cursor-not-allowed hover:bg-gray-100 hover:text-gray-700 hover:border-gray-600;
    }

    .quantity-controls {
        @apply flex items-center border border-gray-600 bg-white rounded overflow-hidden h-8 w-full;
        @apply hover:border-gray-800 transition-colors duration-150;
    }

    .quantity-btn {
        @apply w-10 h-full p-2 flex items-center justify-center bg-transparent transition-all duration-150 relative;
        @apply hover:bg-gray-600 hover:text-white;
        @apply active:bg-gray-800 active:text-white active:scale-95;
    }

    .quantity-btn:disabled {
        @apply opacity-50 cursor-not-allowed hover:bg-transparent hover:text-current;
    }

    .quantity-input-wrapper {
        @apply relative flex-1;
    }

    .quantity-input {
        @apply w-full px-2 text-center bg-transparent focus:outline-none text-subtitle2 text-gray-800 h-full;
        -moz-appearance: textfield;
    }

    .quantity-input::-webkit-outer-spin-button,
    .quantity-input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    .quantity-input:disabled {
        @apply opacity-50 cursor-not-allowed;
    }

    .total-value {
        @apply font-bold text-subtitle1 text-gray-950;
    }

    .price-hidden {
        @apply flex flex-col items-center justify-center px-6 text-center !my-auto !h-full;
    }

    .warning-icon {
        @apply mb-2;
    }

    .warning-title {
        @apply font-medium text-subtitle1 text-red-500 mb-0.5;
    }

    .warning-message {
        @apply text-body text-gray-800;
    }

    .fade-slide-enter-active {
        transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .fade-slide-leave-active {
        transition: all 0.25s cubic-bezier(0.4, 0, 0.6, 1);
    }

    .fade-slide-enter-from {
        opacity: 0;
        transform: translateY(-8px) scale(0.95);
    }

    .fade-slide-leave-to {
        opacity: 0;
        transform: translateY(8px) scale(0.95);
    }

    .fade-slide-enter-to,
    .fade-slide-leave-from {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
</style>
