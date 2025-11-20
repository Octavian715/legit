<!-- components/cart/CartEmpty.vue -->
<template>
    <div class="cart-empty">
        <p class="cart-empty__message">{{ $t('cart.emptyMessage') }}</p>
    </div>
</template>

<style scoped>
    .cart-empty {
        @apply text-center bg-gray-200 px-4 py-5;
    }

    .cart-empty__message {
        @apply text-gray-600 text-subtitle2;
    }
</style>
