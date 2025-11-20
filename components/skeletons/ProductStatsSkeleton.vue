<template>
    <div class="mb-3">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div
                v-for="index in skeletonCount"
                :key="index"
                class="flex gap-3 justify-between bg-white rounded-md border border-transparent p-4"
            >
                <div class="flex flex-col items-start justify-between mb-3 w-full animate-pulse">
                    <div class="h-5 bg-gray-300 rounded w-28 mb-3"></div>
                    <div class="h-8 bg-gray-200 rounded w-16"></div>
                </div>
                <div class="w-6 h-6 m-3 bg-gray-300 rounded animate-pulse"></div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    interface Props {
        skeletonCount?: number
    }

    withDefaults(defineProps<Props>(), {
        skeletonCount: 9,
    })
</script>

<style scoped>
    .animate-pulse {
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    @keyframes pulse {
        0%,
        100% {
            opacity: 1;
        }
        50% {
            opacity: 0.5;
        }
    }
</style>
