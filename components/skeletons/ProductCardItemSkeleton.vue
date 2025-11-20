<template>
    <article
        class="relative flex items-center gap-3 p-2 bg-white border border-gray-400 rounded-md"
        role="article"
    >
        <!-- Product Image Skeleton -->
        <div
            class="relative w-28 h-28 flex-shrink-0 bg-gray-200 rounded overflow-hidden border border-gray-400 animate-pulse"
        ></div>

        <div
            class="grid sm:grid-cols-[35%_1fr] lg:grid-cols-[20%_1fr] gap-1 flex-1 min-w-0 align-middle mb-auto"
        >
            <!-- Supplier Skeleton -->
            <template v-if="showSupplier">
                <div class="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                <div class="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
            </template>

            <!-- Brand Skeleton -->
            <div class="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            <div class="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>

            <!-- Product Name Skeleton -->
            <div class="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            <div class="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>

            <!-- Category Skeleton -->
            <div class="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
            <div class="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>

            <!-- Unit Skeleton -->
            <div class="h-4 w-10 bg-gray-200 rounded animate-pulse"></div>
            <div class="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>

            <!-- Price Skeleton -->
            <div class="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
            <div class="flex gap-1 w-fit">
                <div class="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
        </div>
    </article>
</template>

<script setup lang="ts">
    interface Props {
        showSupplier?: boolean
    }

    withDefaults(defineProps<Props>(), { showSupplier: true })
</script>
