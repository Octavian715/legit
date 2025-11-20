<template>
    <article
        class="flex items-center justify-between gap-1 p-2 bg-white border border-gray-400 rounded-sm"
        role="article"
    >
        <!-- Left Section: Avatar + Name Skeleton -->
        <div class="flex items-center gap-3 flex-1 min-w-0">
            <!-- Avatar Skeleton -->
            <div class="relative w-8 h-8 rounded-full bg-gray-200 animate-pulse shrink-0"></div>

            <!-- Name Skeleton -->
            <div class="flex-1 min-w-0">
                <div class="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
        </div>

        <!-- Right Section: Action Buttons Skeleton -->
        <div v-if="showActionButtons" class="flex items-center gap-1 shrink-0">
            <!-- Follow Button Skeleton -->
            <div class="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>

            <!-- Connect Button Skeleton -->
            <div class="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
    </article>
</template>

<script setup lang="ts">
    interface Props {
        showActionButtons?: boolean
    }

    withDefaults(defineProps<Props>(), { showActionButtons: true })
</script>
