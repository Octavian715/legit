<!-- components/cart/CartItem.vue -->
<template>
    <div class="cart-item">
        <ul class="cart-item__content">
            <li v-for="item in items" class="cart-item__content-item">
                <div>{{ item.name }}</div>
                <div class="text-gray-950 text-right">{{ item.value }}</div>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
    import type { CartItem } from '~/types/cart'
    import { useFormatters } from '~/composables/useFormatters'

    const { t } = useI18n()
    const { formatWithUserCurrency } = useFormatters()

    const props = defineProps<{
        item: CartItem
    }>()

    const productCurrency = computed(() => {
        return (
            props.item?.pricing?.line_totals?.product_currency?.currency || {
                symbol: '$',
                code: 'USD',
            }
        )
    })

    const userCurrency = computed(() => {
        return (
            props.item?.pricing?.line_totals?.user_currency?.currency || {
                symbol: '$',
                code: 'USD',
            }
        )
    })

    const getQuantity = computed(() => {
        return Number(props.item?.quantity || 0)
    })

    const productTotal = computed(() => {
        return props.item?.pricing?.line_totals?.product_currency?.final || 0
    })

    const userTotal = computed(() => {
        return props.item?.pricing?.line_totals?.user_currency?.final || 0
    })

    const items = computed(() => {
        // Determine which total and currency to use
        const shouldUseUserCurrency = userTotal.value && userTotal.value !== 0
        const totalToDisplay = shouldUseUserCurrency ? userTotal.value : productTotal.value
        const currencyToUse = shouldUseUserCurrency ? userCurrency.value : productCurrency.value

        return [
            {
                name: t('cart.totalArticles'),
                value: getQuantity.value.toString(),
            },
            {
                name: t('productTotal'),
                value: productTotal.value
                    ? `${productCurrency.value.symbol} ${productTotal.value.toFixed(2)}`
                    : '-.--',
            },
            {
                name: t('total'),
                value: totalToDisplay
                    ? shouldUseUserCurrency
                        ? formatWithUserCurrency(totalToDisplay)
                        : `${currencyToUse.symbol} ${totalToDisplay.toFixed(2)}`
                    : '-.--',
            },
        ]
    })

    const { loading } = useCart()
</script>

<style scoped>
    .cart-item {
        @apply flex gap-2;
    }

    .cart-item__content {
        @apply flex-1 space-y-2;
    }
    .cart-item__content-item {
        @apply grid grid-cols-2 font-semibold text-caption1 text-gray-800;
    }
</style>
