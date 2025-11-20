<template>
    <!-- Table Skeleton -->
    <div class="bg-white rounded-md shadow">
        <!-- Table Header -->
        <div v-if="showHeader" class="table-header p-6">
            <div class="animate-pulse">
                <div class="flex items-center justify-between">
                    <div class="space-y-2">
                        <div class="h-6 bg-gray-300 rounded w-40"></div>
                        <div class="h-4 bg-gray-300 rounded w-64"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Table Tabs -->
        <!-- <div class="border-b border-gray-300 px-6">
                <div class="animate-pulse flex space-x-8 py-3">
                    <div v-for="i in 4" :key="i" class="h-8 bg-gray-300 rounded w-24"></div>
                </div>
            </div> -->

        <!-- Table Content -->
        <div class="table-content border border-gray-400 rounded-sm">
            <div class="animate-pulse">
                <!-- Table Header Row -->
                <div class="grid grid-cols-8 gap-4 p-4 bg-gray-50">
                    <div v-for="i in 8" :key="i" class="h-4 bg-gray-300 rounded"></div>
                </div>

                <!-- Table Data Rows -->
                <div
                    v-for="i in 5"
                    :key="i"
                    class="grid grid-cols-8 gap-4 p-4 border-b border-gray-100"
                >
                    <!-- Company Column with Avatar -->
                    <div class="flex items-center space-x-3">
                        <!-- <div class="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0"></div> -->
                        <div class="flex-1 space-y-1">
                            <div class="h-4 bg-gray-300 rounded w-24"></div>
                            <div class="h-3 bg-gray-300 rounded w-20"></div>
                        </div>
                    </div>

                    <!-- Other Columns -->
                    <div v-for="j in 6" :key="j" class="h-4 bg-gray-300 rounded"></div>

                    <!-- Actions Column -->
                    <div class="flex justify-end space-x-2">
                        <div class="w-8 h-8 bg-gray-300 rounded"></div>
                        <div class="w-8 h-8 bg-gray-300 rounded"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Pagination Skeleton -->
        <div v-if="showPagination" class="pagination-skeleton p-6">
            <div class="animate-pulse flex">
                <div class="flex items-center mx-auto">
                    <div class="flex space-x-2">
                        <div v-for="i in 7" :key="i" class="w-8 h-8 bg-gray-300 rounded"></div>
                    </div>
                </div>
                <div class="h-4 bg-gray-300 rounded w-32"></div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    interface Props {
        showHeader?: boolean
        showPagination?: boolean
    }

    const props = withDefaults(defineProps<Props>(), {
        showHeader: true,
        showPagination: true,
    })
</script>

<style scoped>
    .network-overview-skeleton {
        @apply min-h-screen;
    }

    .stats-card-skeleton {
        @apply transition-all duration-200 h-80;
    }

    .table-content {
        @apply p-3;
    }

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

    /* Mobile responsive adjustments */
    @media (max-width: 768px) {
        .network-overview-skeleton .grid {
            @apply grid-cols-1 gap-3;
        }

        .chart-header,
        .table-header,
        .chart-content,
        .table-content {
            @apply m-3;
        }

        /* Stack table header elements on mobile */
        .chart-header .flex,
        .table-header .flex {
            @apply flex-col space-y-3 items-start;
        }

        /* Adjust table grid for mobile */
        .table-content .grid {
            @apply grid-cols-4 gap-2;
        }

        /* Hide some columns on mobile */
        .table-content .grid > div:nth-child(n + 5):nth-child(-n + 7) {
            @apply hidden;
        }
    }

    /* Tablet adjustments */
    @media (min-width: 768px) and (max-width: 1024px) {
        .network-overview-skeleton .grid {
            @apply grid-cols-2 gap-4;
        }

        .table-content .grid {
            @apply grid-cols-6 gap-3;
        }

        /* Hide less important columns on tablet */
        .table-content .grid > div:nth-child(n + 6):nth-child(-n + 7) {
            @apply hidden;
        }
    }

    @keyframes loading-shimmer {
        0% {
            background-position: -200% 0;
        }
        100% {
            background-position: 200% 0;
        }
    }
</style>
