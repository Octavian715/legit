<template>
    <div class="cart-dropdown" :class="{ 'cart-dropdown--in-widget': inWidget }">
        <div class="cart-dropdown__header">
            <div class="cart-dropdown__header-wrapper">
                <svg class="w-6 h-6" aria-hidden="true">
                    <use xlink:href="/sprite.svg#shopping-cart"></use>
                </svg>
                <h3 class="cart-dropdown-wrapper__title">
                    {{ $t('cart.shoppingCart') }}
                </h3>
            </div>

            <button
                class="cart-dropdown__close"
                :aria-label="$t('cart.close')"
                @click="$emit('close')"
            >
                <svg class="w-5 h-5" aria-hidden="true">
                    <use xlink:href="/sprite.svg#a_down"></use>
                </svg>
            </button>
        </div>

        <div class="cart-dropdown__body">
            <div v-if="isLoading" class="cart-dropdown__loading">
                <div class="space-y-2">
                    <div
                        v-for="i in skeletonCount"
                        :key="`skeleton-${i}`"
                        class="cart-skeleton-item"
                    ></div>
                </div>
            </div>

            <CartEmpty v-else-if="totalItemsCount === 0" />

            <template v-else-if="hasSummaryData">
                <CartSummaryGroup
                    v-for="supplier in summarySuppliers"
                    :key="supplier.supplier_id"
                    :summary="supplier"
                />
            </template>
        </div>

        <div class="cart-dropdown__footer">
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
                @click="canCheckout && $emit('checkout')"
            >
                <Button
                    color="red"
                    variant="filled"
                    container-classes="w-full"
                    :disabled="!canCheckout"
                >
                    {{ $t('cart.viewShoppingCart') }}
                </Button>
            </NuxtLink>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { useFormatters } from '~/composables/useFormatters'

    defineProps<{
        inWidget?: boolean
    }>()

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

    const skeletonCount = computed(() => {
        if (totalItemsCount.value > 0) {
            return Math.min(totalItemsCount.value, 3)
        }

        const previousCount = cartStore.summary?.suppliers?.reduce(
            (acc, supplier) => acc + (supplier.items?.length || 0),
            0
        )

        return previousCount && previousCount > 0 ? Math.min(previousCount, 3) : 3
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
        box-shadow:
            0 9px 46px 8px rgba(90, 93, 101, 0.12),
            0 24px 38px 3px rgba(90, 93, 101, 0.14);
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
        @apply p-3;
    }

    .cart-skeleton-item {
        @apply bg-white rounded border border-gray-300;
        height: 82px;
        animation: skeleton-pulse 1.5s ease-in-out infinite;
    }

    @keyframes skeleton-pulse {
        0%,
        100% {
            opacity: 1;
        }
        50% {
            opacity: 0.6;
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
</style>
