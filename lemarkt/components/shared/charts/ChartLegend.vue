<template>
    <div class="legend-container overflow-y-auto hide-scrollbar pr-1">
        <ul class="legend-items" :class="[legendItems?.length > 5 ? 'columns-2xs' : '']">
            <li
                v-for="(item, index) in legendItems"
                :key="item.id"
                class="legend-item flex items-center justify-between group w-full break-inside-avoid mb-1"
                :class="{
                    'opacity-50': !item.isActive && hasInactiveItems,
                }"
                @mouseenter="handleItemHover(item)"
                @mouseleave="handleItemHover(null)"
                @click="handleItemClick(item)"
            >
                <div class="flex flex-col gap-1 flex-1 min-w-0">
                    <div class="legend-indicator flex justify-between gap-1">
                        <div class="flex gap-1 items-center min-w-0">
                            <div
                                class="w-2 h-2 rounded-full transition-all duration-200 flex-shrink-0"
                                :style="{ backgroundColor: item.color }"
                            ></div>
                            <p class="text-subtitle4 text-gray-800 truncate">
                                {{ item.label }}
                            </p>
                        </div>

                        <p class="text-subtitle4 text-gray-950 flex-shrink-0 ml-1">
                            {{ formatValue(item.value) }}
                        </p>
                    </div>

                    <div class="progress-container flex-1 min-w-0">
                        <div class="progress-bar bg-blue-50 rounded-full h-0.5 overflow-hidden">
                            <div
                                class="progress-fill h-full rounded-full transition-all duration-500 ease-out"
                                :style="{
                                    width: `${item.percentage}%`,
                                    backgroundColor: item.color,
                                }"
                            ></div>
                        </div>
                    </div>
                </div>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue'
    import { useI18n } from 'vue-i18n'
    import type { LegendItem, Currency } from '~/types/chart'

    interface Props {
        items: LegendItem[]
        total?: number
        currency?: Currency
        valueType?: 'currency' | 'number' | 'percentage'
        showTotal?: boolean
        totalLabel?: string
        maxItems?: number
    }

    const props = withDefaults(defineProps<Props>(), {
        valueType: 'number',
        showTotal: true,
        totalLabel: 'Total',
        maxItems: 10,
    })

    const emit = defineEmits<{
        'item-click': [item: LegendItem]
        'item-hover': [item: LegendItem | null]
    }>()

    const { t } = useI18n()

    const legendItems = computed(() => {
        const sortedItems = [...props.items].sort((a, b) => b.value - a.value)
        return sortedItems.slice(0, props.maxItems)
    })

    const hasInactiveItems = computed(() => {
        return props.items.some((item) => item.isActive === false)
    })

    const formatValue = (value: number): string => {
        if (props.valueType === 'currency' && props.currency) {
            return formatCurrency(value, props.currency)
        }

        if (props.valueType === 'percentage') {
            return `${value.toFixed(1)}%`
        }

        return formatNumber(value)
    }

    const formatNumber = (value: number): string => {
        if (value >= 1000000) {
            return `${(value / 1000000).toFixed(1)}M`
        }
        if (value >= 1000) {
            return `${(value / 1000).toFixed(1)}k`
        }
        return new Intl.NumberFormat().format(value)
    }

    const formatCurrency = (value: number, currency: Currency): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.code,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(value)
    }

    const handleItemClick = (item: LegendItem) => {
        emit('item-click', item)
    }

    const handleItemHover = (item: LegendItem | null) => {
        emit('item-hover', item)
    }
</script>

<style scoped>
    .legend-item {
        @apply cursor-pointer p-1 transition-all duration-200;
    }

    .legend-item:hover {
        @apply bg-red-50 rounded-sm;
    }

    .progress-fill {
        transition: width 0.5s ease-out;
    }

    .legend-indicator {
        @apply min-w-fit;
    }

    .progress-container {
        min-width: 120px;
    }

    /* Custom scrollbar styles */
    .legend-container::-webkit-scrollbar {
        width: 6px;
    }

    .legend-container::-webkit-scrollbar-track {
        @apply bg-gray-100 rounded-full;
    }

    .legend-container::-webkit-scrollbar-thumb {
        @apply bg-gray-300 rounded-full;
    }

    .legend-container::-webkit-scrollbar-thumb:hover {
        @apply bg-gray-400;
    }

    /* Firefox scrollbar */
    .legend-container {
        scrollbar-width: thin;
        scrollbar-color: #d1d5db #f3f4f6;
    }

    /* Ensure columns work well with scrolling */
    @media (min-width: 1024px) {
        .legend-item {
            break-inside: avoid;
        }
    }

    .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }

    .hide-scrollbar::-webkit-scrollbar {
        display: none;
    }
</style>
