<template>
    <div class="supplier-group">
        <div class="supplier-group__header">
            <div class="supplier-group__info">
                <h4 class="supplier-group__name">{{ summary.supplier_name }}</h4>
                <!-- <div class="supplier-group__badge">
                    {{ $t('cart.remainedToMin') }}
                    <span class=""> </span>
                </div> -->
            </div>
        </div>

        <div class="supplier-group__items">
            <div class="cart-item">
                <ul class="cart-item__content">
                    <li class="cart-item__content-item">
                        <div>{{ $t('cart.totalArticles') }}</div>
                        <div class="text-gray-950 text-right">{{ summary.total_items || 0 }}</div>
                    </li>
                    <li v-if="productCurrency" class="cart-item__content-item">
                        <div>{{ $t('productTotal') }}</div>
                        <div class="text-gray-950 text-right">
                            {{ productCurrency.symbol || '' }}
                            {{ productAmount }}
                        </div>
                    </li>
                    <li v-if="userCurrency" class="cart-item__content-item">
                        <div>{{ $t('total') }}</div>
                        <div class="text-gray-950 text-right">
                            {{ userCurrency.symbol || '' }}
                            {{ userAmount }}
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import type { SupplierSummary } from '~/types/cart'

    const props = defineProps<{
        summary: SupplierSummary
    }>()

    const productCurrency = computed(() => {
        return props.summary?.totals?.product_currency?.currency
    })

    const userCurrency = computed(() => {
        return props.summary?.totals?.user_currency?.currency
    })

    const productAmount = computed(() => {
        const amount = props.summary?.totals?.product_currency?.amount
        return typeof amount === 'number' ? amount.toFixed(2) : '0.00'
    })

    const userAmount = computed(() => {
        const amount = props.summary?.totals?.user_currency?.amount
        return typeof amount === 'number' ? amount.toFixed(2) : '0.00'
    })
</script>

<style scoped>
    .supplier-group {
        @apply mx-4 py-3  border-b border-gray-600 last:border-0;
    }

    .supplier-group__header {
        @apply space-y-0.5 pb-2;
    }

    .supplier-group__info {
        @apply space-y-1;
    }

    .supplier-group__name {
        @apply font-bold text-gray-950 text-subtitle3;
    }

    .supplier-group__badge {
        @apply flex items-center justify-between text-caption1 text-gray-800;
    }

    .supplier-group__items {
        @apply space-y-2;
    }

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
