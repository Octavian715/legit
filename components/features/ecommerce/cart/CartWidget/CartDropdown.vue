<template>
    <div
        class="cart-dropdown"
        :class="{
            'cart-dropdown--in-widget': inWidget,
            'cart-dropdown--auto-opened': isAutoOpened,
        }"
    >
        <div class="cart-dropdown__header">
            <div class="cart-dropdown__header-wrapper">
                <svg class="w-6 h-6" aria-hidden="true">
                    <use xlink:href="/sprite.svg#shopping-cart"></use>
                </svg>
                <h3 class="cart-dropdown-wrapper__title">
                    {{ $t('cart.shoppingCart') }}
                </h3>
            </div>

            <button class="cart-dropdown__close" :aria-label="$t('close')" @click="$emit('close')">
                <svg class="w-5 h-5" aria-hidden="true">
                    <use xlink:href="/sprite.svg#a_down"></use>
                </svg>
            </button>
        </div>

        <div class="cart-dropdown__body">
            <div v-if="isLoading" class="cart-dropdown__loading">
                <div>
                    <div
                        v-for="i in supplierSkeletonCount"
                        :key="`skeleton-group-${i}`"
                        class="cart-supplier-skeleton"
                    >
                        <div class="cart-skeleton-shimmer"></div>
                    </div>
                </div>
            </div>

            <CartEmpty v-else-if="totalItemsCount === 0" />

            <template v-else-if="hasSummaryData">
                <CartSummaryGroup
                    v-for="supplier in summarySuppliers"
                    :key="supplier.supplier_id"
                    :summary="supplier"
                    class="cart-summary-group"
                />
            </template>
        </div>

        <div class="cart-dropdown__footer">
            <!-- <template v-if="isLoading">
                <div class="cart-dropdown__summary">
                    <div class="cart-dropdown__summary-row">
                        <div class="skeleton-text skeleton-text--small"></div>
                        <div class="skeleton-text skeleton-text--price"></div>
                    </div>
                    <div class="cart-dropdown__summary-row cart-dropdown__summary-row--main">
                        <div class="skeleton-text skeleton-text--small"></div>
                        <div class="skeleton-text skeleton-text--price"></div>
                    </div>
                </div>
                <div class="skeleton-button"></div>
            </template> -->

            <div class="cart-dropdown__summary">
                <div
                    v-for="(total, index) in formatGrandTotal"
                    :key="`total-${index}`"
                    class="cart-dropdown__summary-row"
                    :class="{
                        'cart-dropdown__summary-row--main':
                            index === formatGrandTotal.length - 1 && formatGrandTotal.length > 1,
                    }"
                >
                    <span class="text-gray-800 text-subtitle3 font-bold">
                        {{
                            index === formatGrandTotal.length - 1
                                ? $t('cart.totalCart')
                                : total.label
                        }}
                    </span>
                    <span
                        class="font-bold"
                        :class="
                            index === formatGrandTotal.length - 1
                                ? 'text-subtitle2 text-gray-950'
                                : 'text-subtitle3 text-gray-800'
                        "
                    >
                        {{ total.value }}
                    </span>
                </div>
            </div>

            <NuxtLink
                to="/cart"
                class="w-full block"
                :aria-disabled="!canCheckout"
                @click="$emit('checkout')"
            >
                <Button color="red" variant="filled" container-classes="w-full">
                    {{ $t('cart.viewShoppingCart') }}
                </Button>
            </NuxtLink>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { useFormatters } from '~/composables/useFormatters'

    const props = defineProps<{
        inWidget?: boolean
        isAutoOpened?: boolean
    }>()

    const showPulse = ref(false)

    // Trigger pulse animation when auto-opened
    watch(
        () => props.isAutoOpened,
        (newVal) => {
            if (newVal) {
                showPulse.value = true
                setTimeout(() => {
                    showPulse.value = false
                }, 1000)
            }
        },
        { immediate: true }
    )

    defineEmits<{
        close: []
        checkout: []
    }>()

    const { t } = useI18n()
    const cartStore = useCartStore()
    const { isLoading, totalItemsCount, canCheckout } = useCart()
    const { formatCurrency } = useFormatters()

    const summarySuppliers = computed(() => {
        return cartStore.summary?.suppliers || []
    })

    const hasSummaryData = computed(() => {
        return summarySuppliers.value && summarySuppliers.value.length > 0
    })

    const supplierSkeletonCount = computed(() => {
        const supplierCount = summarySuppliers.value.length

        if (supplierCount > 0) {
            return Math.min(supplierCount, 1)
        }

        const previousSupplierCount = cartStore.summary?.suppliers?.length || 0

        return previousSupplierCount > 0 ? Math.min(previousSupplierCount, 1) : 1
    })

    const formatGrandTotal = computed(() => {
        const summary = cartStore.summary
        if (!summary || !summary.grand_totals) return []

        const result: Array<{ label: string; value: string }> = []

        const userCurrencyCode = summary.grand_totals.user_currency?.currency?.code

        if (
            summary.grand_totals.product_currency &&
            Array.isArray(summary.grand_totals.product_currency)
        ) {
            summary.grand_totals.product_currency.forEach((item) => {
                if (item?.currency && typeof item.amount === 'number') {
                    if (item.currency.code !== userCurrencyCode) {
                        result.push({
                            label: t('productTotal'),
                            value: formatCurrency(
                                item.amount,
                                item.currency.symbol || item.currency.code || '$'
                            ),
                        })
                    }
                }
            })
        }

        const userCurrency = summary.grand_totals.user_currency
        if (userCurrency?.currency && typeof userCurrency.amount === 'number') {
            result.push({
                label: t('total'),
                value: formatCurrency(
                    userCurrency.amount,
                    userCurrency.currency.symbol || userCurrency.currency.code || '$'
                ),
            })
        }

        return result
    })
</script>

<style scoped>
    .cart-dropdown {
        @apply bg-white rounded-md flex flex-col;
        min-width: 16rem;
        max-width: 20rem;
        height: auto;
        max-height: 28rem;
        box-shadow: 0 2px 8px rgba(90, 93, 101, 0.08);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .cart-dropdown--auto-opened {
        animation: cart-attention 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        box-shadow: 0 2px 10px rgba(255, 50, 50, 0.12);
    }

    @keyframes cart-attention {
        0% {
            transform: scale(1);
        }
        25% {
            transform: scale(1.05);
        }
        50% {
            transform: scale(0.98);
        }
        75% {
            transform: scale(1.02);
        }
        100% {
            transform: scale(1);
        }
    }

    .cart-dropdown--in-widget {
        @apply border border-gray-600;
    }

    .cart-dropdown__header {
        @apply flex items-center justify-between p-4 border-b border-gray-400 flex-shrink-0;
    }

    .cart-dropdown__header-wrapper {
        @apply flex items-center gap-2;
    }

    .cart-dropdown-wrapper__title {
        @apply font-bold text-gray-950 text-title3;
    }

    .cart-dropdown__close {
        @apply p-1 rounded text-gray-950 hover:text-red-500 active:text-red-700 active:scale-95 transition-colors duration-150;
    }

    .cart-dropdown__body {
        @apply flex-1 overflow-y-auto bg-gray-200;
        max-height: 18rem;
    }

    .cart-dropdown__loading {
        @apply px-3;
    }

    .cart-summary-group {
        height: 100px;
    }

    .cart-supplier-skeleton {
        @apply bg-white rounded border border-gray-300 relative overflow-hidden;
        height: 100px;
    }

    .cart-skeleton-shimmer {
        @apply absolute inset-0;
        background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.6) 50%,
            transparent 100%
        );
        animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
        0% {
            transform: translateX(-100%);
        }
        100% {
            transform: translateX(100%);
        }
    }

    .cart-dropdown__footer {
        @apply border-t border-gray-400 p-3 space-y-3 flex-shrink-0;
    }

    .cart-dropdown__summary {
        @apply space-y-2;
    }

    .cart-dropdown__summary-row {
        @apply flex items-center justify-between text-subtitle3 font-bold text-gray-800;
    }

    .cart-dropdown__summary-row--main {
        @apply pt-2 border-t border-gray-300;
    }

    .skeleton-text {
        @apply bg-gray-300 rounded relative overflow-hidden;
        height: 1rem;
    }

    .skeleton-text--small {
        @apply w-24;
    }

    .skeleton-text--price {
        @apply w-20;
    }

    .skeleton-text::after {
        content: '';
        @apply absolute inset-0;
        background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.6) 50%,
            transparent 100%
        );
        animation: shimmer 1.5s infinite;
    }

    .skeleton-button {
        @apply w-full bg-gray-300 rounded relative overflow-hidden;
        height: 2.5rem;
    }

    .skeleton-button::after {
        content: '';
        @apply absolute inset-0;
        background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.6) 50%,
            transparent 100%
        );
        animation: shimmer 1.5s infinite;
    }
</style>
