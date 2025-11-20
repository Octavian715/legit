<template>
    <div
        class="p-2 grid grid-cols-3 justify-start gap-3 transition-all duration-300 transform hover:bg-blue-50"
        :class="productClass"
        @click="handleClick"
    >
        <div class="w-24 h-24 flex-shrink-0">
            <!-- <NuxtImg
                :src="product.image"
                :alt="product.productName"
                lazy
                class="w-full h-full object-cover"
            /> -->
            <img
                :src="product.image"
                :alt="product.productName"
                lazy
                class="w-full h-full object-cover"
            />
        </div>
        <div class="flex flex-col gap-1">
            <h4 class="text-subtitle3 font-bold text-gray-950">
                {{ product.brandName }}
            </h4>

            <Link
                :to="localePath(`product/sku/${product.articleNumber}`)"
                class="text-gray-950 text-subtitle2 font-bold"
                >{{ product.productName }}</Link
            >

            <div class="flex flex-col gap-2">
                <div class="flex gap-1">
                    <p class="text-gray-700 text-subtitle3"
                        >{{ $t('product.articleNumber', 1) }}:</p
                    >
                    <p class="text-gray-950 text-body">{{ product.articleNumber }}</p>
                </div>
                <div class="flex gap-1">
                    <p class="text-gray-700 text-subtitle3">{{ $t('product.purchase') }}:</p>
                    <p class="text-gray-950 text-body font-bold">{{ product.price }}</p>
                </div>
            </div>
        </div>
        <div class="ml-auto"> tst </div>
    </div>
</template>

<script setup lang="ts">
    import { defineProps, defineEmits } from 'vue'
    import type { CartItem } from '@/types/cart'
    import { useLocalePath } from '#imports'
    import Link from '~/components/ui/Link.vue'

    const localePath = useLocalePath()

    const props = defineProps<{
        product: CartItem
    }>()

    const emit = defineEmits<{
        (e: 'update-item-quantity', payload: { id: string; quantity: number; unit: string }): void
    }>()

    const handleClick = () => {}

    const bodyClass = computed(() => {
        return 'text-body text-gray-950 break-words text-start w-full'
    })
    const productClass = {}
</script>
