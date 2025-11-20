<template>
    <div class="bg-white">
        <TransitionGroup name="list" tag="div">
            <CartItem v-for="item in cart" :key="item.id" :product="item" @close="handleClose" />
        </TransitionGroup>
    </div>
</template>

<script setup lang="ts">
    import { defineProps, defineEmits } from 'vue'
    import type { CartItem } from '@/types/cart'

    const props = defineProps<{
        cart: CartItem[]
    }>()

    const emit = defineEmits<{
        (e: 'remove', id: string): void
        (e: 'update-item-quantity', payload: { id: string; quantity: number; unit: string }): void
    }>()

    const handleClose = (id: string) => {
        emit('remove', id)
    }
</script>

<style>
    .list-enter-active,
    .list-leave-active {
        transition: all 0.5s ease;
    }
    .list-enter-from,
    .list-leave-to {
        opacity: 0;
        transform: translateX(30px);
    }
</style>
