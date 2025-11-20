<template>
    <svg
        class="w-4 h-4 block hover:scale-105 transition-colors duration-200 shrink-0"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
    >
        <!-- Ascending Arrow (Up) -->
        <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M7.46667 2.71111C7.73333 2.35556 8.26667 2.35556 8.53333 2.71111L10 4.66667L11.2 6.26667C11.5296 6.70616 11.216 7.33333 10.6667 7.33333H8H5.33333C4.78397 7.33333 4.47038 6.70616 4.8 6.26667L6 4.66667L7.46667 2.71111Z"
            :fill="active && isAscendant ? '#0057FF' : 'currentColor'"
        ></path>
        <!-- Descending Arrow (Down) -->
        <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M7.46666 13.9555C7.73333 14.311 8.26667 14.311 8.53334 13.9555L10 11.9999L11.2 10.3999C11.5296 9.96043 11.216 9.33325 10.6667 9.33325H8H5.33334C4.78398 9.33325 4.47039 9.96043 4.80001 10.3999L6 11.9999L7.46666 13.9555Z"
            :fill="active && !isAscendant ? '#0057FF' : 'currentColor'"
        ></path>
    </svg>
</template>

<script lang="ts" setup>
    import { computed } from 'vue'

    const props = defineProps<{
        active: boolean
        direction: 'asc' | 'desc' | undefined
    }>()

    const isAscendant = computed(() => props.direction === 'asc')
</script>

<style scoped lang="scss">
    svg {
        transition: fill 0.2s ease;
    }
</style>
