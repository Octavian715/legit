<template>
    <div class="network-overview-skeleton space-y-3">
        <!-- Stats Cards Skeleton -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
                v-for="i in 4"
                :key="i"
                class="stats-card-skeleton bg-white rounded-md shadow px-4 py-2.5"
            >
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
        </div>

        <!-- Table Skeleton -->
        <div class="bg-white rounded-md shadow">
            <!-- Table Header -->
            <div class="table-header p-6 border-b border-gray-300">
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
            <div class="table-content">
                <div class="animate-pulse">
                    <!-- Table Header Row -->
                    <div class="grid grid-cols-8 gap-4 p-4 border-b border-gray-300 bg-gray-50">
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
                            <div class="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0"></div>
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
            <div class="pagination-skeleton p-6 border-t border-gray-300">
                <div class="animate-pulse flex">
                    <div class="flex items-center mx-auto">
                        <div class="flex space-x-2">
                            <div v-for="i in 5" :key="i" class="w-8 h-8 bg-gray-300 rounded"></div>
                        </div>
                    </div>
                    <div class="h-4 bg-gray-300 rounded w-32"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    // No props needed for skeleton component
</script>

<style scoped>
    .network-overview-skeleton {
        @apply min-h-screen;
    }

    .stats-card-skeleton {
        @apply transition-all duration-200 h-80;
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
            @apply p-3;
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

    /* Loading shimmer effect */
    /* .animate-pulse > div {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading-shimmer 1.5s infinite;
    } */

    @keyframes loading-shimmer {
        0% {
            background-position: -200% 0;
        }
        100% {
            background-position: 200% 0;
        }
    }
</style>
