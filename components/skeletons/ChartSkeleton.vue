<template>
    <div class="stats-card-skeleton bg-white rounded-md shadow px-4 py-2.5">
        <div class="animate-pulse">
            <!-- Card Header -->
            <div class="flex items-center justify-between mb-2">
                <div class="h-10 bg-gray-300 rounded w-80"></div>
                <div class="flex space-x-2">
                    <div class="w-8 h-8 bg-gray-300 rounded"></div>
                    <div class="w-8 h-8 bg-gray-300 rounded"></div>
                </div>
            </div>

            <!-- Card Content -->
            <div class="flex items-end justify-between gap-3 h-full">
                <div class="space-y-2 w-full">
                    <div class="h-7 bg-gray-200 rounded w-16"></div>
                    <div class="w-full h-40 bg-gray-200 rounded"></div>
                </div>
            </div>
            <div class="w-1/2 h-6 bg-gray-200 rounded mx-auto my-6 py-2.5"></div>
        </div>
    </div>
</template>

<script setup lang="ts"></script>

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
