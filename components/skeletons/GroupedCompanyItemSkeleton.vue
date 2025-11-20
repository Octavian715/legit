<template>
    <article
        class="grouped-company-item overflow-hidden bg-white border border-gray-400 rounded-sm p-2"
    >
        <div class="flex items-center justify-between gap-2 w-full">
            <!-- Left Section: Avatar + Company Name -->
            <div class="flex items-center gap-2 flex-1 min-w-0">
                <!-- Avatar Skeleton -->
                <div class="relative w-8 h-8 rounded-full bg-gray-200 animate-pulse shrink-0"></div>

                <!-- Company Name Skeleton -->
                <div class="flex-1 min-w-0">
                    <div class="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                </div>
            </div>

            <!-- Right Section: Action Buttons Skeleton -->
            <div class="flex items-center gap-1 shrink-0">
                <!-- Follow Button Skeleton -->
                <div class="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>

                <!-- Connect Button Skeleton -->
                <div class="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>

                <!-- Arrow Icon Skeleton -->
                <div class="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
        </div>
    </article>
</template>

<script setup lang="ts">
    // No props needed for skeleton
</script>
