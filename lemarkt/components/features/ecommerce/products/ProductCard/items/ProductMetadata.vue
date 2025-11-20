<template>
    <div class="hidden md:flex flex-col gap-1 mt-2">
        <div class="flex flex-wrap gap-3 text-gray-800 text-subtitle4">
            <!-- ID -->
            <span
                >{{ $t('productId') }}: <span class="text-gray-950">{{ id }}</span></span
            >

            <!-- Best Before Date -->
            <span v-if="bestBeforeDate"
                >{{ $t('product.bbd', 1) }}:
                <span class="text-gray-950">
                    {{ $t('date.day', { count: bestBeforeDate }) || '-' }}</span
                ></span
            >
        </div>
        <div class="flex flex-wrap gap-1.5 text-gray-800 text-subtitle4">
            <!-- Weight -->
            <span class="flex items-center gap-1">
                <svg class="w-3 h-3">
                    <use xlink:href="/sprite.svg#weight"></use>
                </svg>
                <span class="text-gray-950">
                    {{ productWeightLabel }}
                </span>
            </span>

            <!-- Quantity per Box -->
            <span class="flex items-center gap-1">
                <svg class="w-3 h-3">
                    <use xlink:href="/sprite.svg#package"></use>
                </svg>
                <span class="text-gray-950">
                    {{ $t('product.nPiecesPerBox', { number: quantityPerBox }) || '-' }}
                </span>
            </span>

            <!-- Rows per Pallet -->
            <span class="flex items-center gap-1">
                <svg class="w-3 h-3">
                    <use xlink:href="/sprite.svg#rows"></use>
                </svg>
                <span class="text-gray-950">
                    {{ $t('product.nRowPerPallert', { number: rowsPerPallet }) || '-' }}
                </span>
            </span>

            <!-- Boxes per Pallet -->
            <span class="flex items-center gap-1">
                <svg class="w-3 h-3">
                    <use xlink:href="/sprite.svg#boxes-pallets"></use>
                </svg>
                <span class="text-gray-950">
                    {{ $t('product.nBoxPerPallert', { number: boxesPerPallet }) || '-' }}
                </span>
            </span>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { defineProps } from 'vue'

    const props = defineProps<{
        id: number
        bestBeforeDate?: number | null | undefined
        weight: any
        showWeight: boolean
        quantityPerBox?: number
        rowsPerPallet?: number
        boxesPerPallet?: number
    }>()

    const productWeightLabel = computed(() => {
        const { value, symbol } = props.weight ?? {} // fallback la obiect gol

        if (value && symbol) {
            return `${value} ${symbol}`
        }
        return '-'
    })
</script>
