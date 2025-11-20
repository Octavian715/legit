<template>
    <div class="w-full rounded-sm border border-gray-600 py-0.5 animate-pulse">
        <div class="p-4 bg-white">
            <div class="flex items-center justify-between w-full">
                <div class="flex items-center gap-2 flex-1">
                    <div class="w-4 h-4 bg-gray-200 rounded"></div>
                    <div class="h-6 bg-gray-200 rounded w-48"></div>
                </div>
                <div class="flex items-center gap-3">
                    <div class="h-5 bg-gray-200 rounded w-32"></div>
                    <div class="w-8 h-8 bg-gray-200 rounded"></div>
                </div>
            </div>
        </div>

        <div class="mx-4 py-4 border-t border-gray-200">
            <div class="space-y-4">
                <div
                    v-for="i in itemsCount"
                    :key="i"
                    class="p-3 border-t first:border-t-0 border-gray-600"
                >
                    <div class="flex flex-col md:flex-row gap-3">
                        <div class="w-24 h-24 bg-gray-200 rounded-md flex-shrink-0"></div>

                        <div class="flex-1 space-y-2">
                            <div class="h-5 bg-gray-200 rounded w-3/4"></div>
                            <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                            <div class="h-4 bg-gray-200 rounded w-2/3"></div>
                        </div>

                        <div class="w-full md:w-64 space-y-2">
                            <div class="h-8 bg-gray-200 rounded"></div>
                            <div class="h-8 bg-gray-200 rounded"></div>
                            <div class="h-10 bg-gray-200 rounded"></div>
                            <div class="h-6 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    interface Props {
        itemsCount?: number
    }

    withDefaults(defineProps<Props>(), {
        itemsCount: 2,
    })
</script>
