<template>
    <div class="space-y-4">
        <!-- Buyer Data Skeleton -->
        <div class="bg-white border border-gray-600 rounded-sm p-4">
            <div class="h-5 w-32 bg-gray-300 rounded animate-pulse mb-4"></div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div v-for="i in 5" :key="`buyer-${i}`" class="space-y-2">
                    <div class="h-4 w-24 bg-gray-300 rounded animate-pulse"></div>
                    <div class="h-12 bg-gray-300 rounded animate-pulse"></div>
                </div>
            </div>
            <div class="mt-4">
                <div class="h-4 w-32 bg-gray-300 rounded animate-pulse mb-2"></div>
                <div class="h-12 bg-gray-300 rounded animate-pulse"></div>
            </div>
        </div>

        <!-- Delivery Location Skeleton -->
        <div class="bg-white border border-gray-600 rounded-sm p-4">
            <div class="flex items-center justify-between mb-4">
                <div class="h-5 w-40 bg-gray-300 rounded animate-pulse"></div>
                <div class="h-4 w-48 bg-gray-300 rounded animate-pulse"></div>
            </div>
        </div>

        <!-- Head Area Skeleton -->
        <div class="bg-white border border-gray-600 rounded-sm p-4">
            <div class="h-5 w-24 bg-gray-300 rounded animate-pulse mb-4"></div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div v-for="i in 2" :key="`head-${i}`" class="space-y-2">
                    <div class="h-4 w-32 bg-gray-300 rounded animate-pulse"></div>
                    <div class="h-12 bg-gray-300 rounded animate-pulse"></div>
                </div>
            </div>
        </div>

        <!-- Document Positions Skeleton -->
        <div class="bg-white border border-gray-600 rounded-sm p-4">
            <div class="flex items-center justify-between mb-4">
                <div class="h-5 w-40 bg-gray-300 rounded animate-pulse"></div>
                <div class="h-10 w-32 bg-gray-300 rounded animate-pulse"></div>
            </div>
            <div class="space-y-3">
                <div
                    v-for="i in 3"
                    :key="`row-${i}`"
                    class="h-12 bg-gray-300 rounded animate-pulse"
                ></div>
            </div>
        </div>

        <!-- Foot Area Skeleton -->
        <div class="bg-white border border-gray-600 rounded-sm p-4">
            <div class="h-5 w-24 bg-gray-300 rounded animate-pulse mb-4"></div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div v-for="i in 2" :key="`foot-${i}`" class="space-y-2">
                    <div class="h-4 w-24 bg-gray-300 rounded animate-pulse"></div>
                    <div class="h-24 bg-gray-300 rounded animate-pulse"></div>
                </div>
            </div>
        </div>

        <!-- Actions Skeleton -->
        <div class="bg-white border border-gray-600 rounded-sm p-4">
            <div class="h-5 w-20 bg-gray-300 rounded animate-pulse mb-4"></div>
            <div class="flex items-center justify-between gap-4">
                <div class="flex items-center gap-4">
                    <div class="h-10 w-28 bg-gray-300 rounded animate-pulse"></div>
                    <div class="h-10 w-24 bg-gray-300 rounded animate-pulse"></div>
                </div>
                <div class="h-12 w-48 bg-gray-300 rounded animate-pulse"></div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts"></script>
