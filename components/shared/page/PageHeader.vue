<template>
    <div class="page-header bg-white p-3 border-b border-gray-600 rounded-t-sm space-y-2 mt-4">
        <div class="flex items-center justify-between md:gap-4">
            <!-- Left Slot with Skeleton -->
            <slot name="left">
                <div class="space-y-1">
                    <h2 class="text-gray-950 text-title3 font-bold">{{ title }}</h2>
                    <div v-if="subtitle">
                        <div v-if="loading" class="flex items-center gap-3">
                            <div class="skeleton-shimmer w-20 h-[13.8px] bg-gray-300"></div>
                        </div>
                        <p v-else class="text-subtitle3 text-gray-700">{{ subtitle }}</p>
                    </div>
                </div>
            </slot>

            <!-- Right Slot with Skeleton -->
            <slot name="right">
                <div class="flex items-center gap-3"></div>
            </slot>
        </div>

        <slot />
    </div>
</template>

<script lang="ts" setup>
    interface Props {
        title?: string
        subtitle?: string
        loading?: boolean
    }

    withDefaults(defineProps<Props>(), {
        loading: false,
    })
</script>
