<template>
    <div class="company-card-skeleton bg-white border-b border-gray-300 p-2 animate-pulse">
        <!-- Desktop Layout -->
        <div class="hidden lg:grid lg:grid-cols-[140px_1fr_auto] gap-4 items-stretch">
            <!-- Image Skeleton -->
            <div class="h-full">
                <div
                    class="w-full h-full rounded-sm border border-gray-300 bg-gray-200 flex items-center justify-center overflow-hidden aspect-square"
                >
                    <div class="w-12 h-12 bg-gray-300 rounded-full"></div>
                </div>
            </div>

            <!-- Main Content Skeleton -->
            <div
                class="flex flex-col p-3 gap-3 min-w-0 rounded-sm border border-gray-300 bg-gray-50"
            >
                <!-- Header Section -->
                <div class="flex items-center justify-between gap-4 flex-wrap">
                    <!-- Left Side - Company Info -->
                    <div class="flex items-center gap-2 flex-1">
                        <!-- "Supplier:" label -->
                        <div class="h-4 w-16 bg-gray-300 rounded"></div>
                        <!-- Company name -->
                        <div class="h-4 w-40 bg-gray-300 rounded"></div>
                        <!-- Verified icon placeholder -->
                        <div class="w-4 h-4 bg-gray-300 rounded-full"></div>
                        <!-- Connected icon placeholder -->
                        <div class="w-4 h-4 bg-gray-300 rounded-full"></div>
                    </div>

                    <!-- Right Side - Stats and Buttons -->
                    <div class="flex items-center gap-4 shrink-0 flex-wrap">
                        <!-- Stats Section -->
                        <div class="flex items-center gap-3 text-subtitle4">
                            <!-- Rating -->
                            <div class="flex items-center gap-1">
                                <div class="h-4 w-6 bg-gray-300 rounded"></div>
                                <div class="w-4 h-4 bg-gray-300 rounded"></div>
                            </div>
                            <span class="w-px h-4 bg-gray-300"></span>

                            <!-- Products count -->
                            <div class="flex items-center gap-1">
                                <div class="h-4 w-6 bg-gray-300 rounded"></div>
                                <div class="h-4 w-16 bg-gray-300 rounded"></div>
                            </div>
                            <span class="w-px h-4 bg-gray-300"></span>

                            <!-- Posts count -->
                            <div class="flex items-center gap-1">
                                <div class="h-4 w-6 bg-gray-300 rounded"></div>
                                <div class="h-4 w-12 bg-gray-300 rounded"></div>
                            </div>
                            <span class="w-px h-4 bg-gray-300"></span>

                            <!-- Followers count -->
                            <div class="flex items-center gap-1">
                                <div class="h-4 w-8 bg-gray-300 rounded"></div>
                                <div class="h-4 w-16 bg-gray-300 rounded"></div>
                            </div>
                            <span class="w-px h-4 bg-gray-300"></span>

                            <!-- Connections count -->
                            <div class="flex items-center gap-1">
                                <div class="h-4 w-6 bg-gray-300 rounded"></div>
                                <div class="h-4 w-20 bg-gray-300 rounded"></div>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="flex items-center gap-2">
                            <!-- Follow Button -->
                            <div class="h-8 w-20 bg-gray-300 rounded"></div>
                            <!-- Connect Button -->
                            <div class="h-8 w-24 bg-gray-300 rounded"></div>
                        </div>
                    </div>
                </div>

                <!-- Details Grid -->
                <div class="grid grid-cols-5 gap-x-4 gap-y-1 pt-3 border-t border-gray-300">
                    <!-- Headers Row -->
                    <div class="h-4 w-20 bg-gray-300 rounded"></div>
                    <div class="h-4 w-16 bg-gray-300 rounded"></div>
                    <div class="h-4 w-16 bg-gray-300 rounded"></div>
                    <div class="h-4 w-12 bg-gray-300 rounded"></div>
                    <div class="h-4 w-24 bg-gray-300 rounded"></div>

                    <!-- Values Row -->
                    <div class="h-4 w-full bg-gray-300 rounded"></div>
                    <div class="h-4 w-3/4 bg-gray-300 rounded"></div>
                    <div class="h-4 w-full bg-gray-300 rounded"></div>
                    <div class="h-4 w-full bg-gray-300 rounded"></div>
                    <div class="flex flex-col gap-1">
                        <div class="h-4 w-full bg-gray-300 rounded"></div>
                        <div class="h-4 w-full bg-gray-300 rounded"></div>
                        <div class="h-4 w-full bg-gray-300 rounded"></div>
                    </div>
                </div>
            </div>

            <!-- Action Buttons Column -->
            <div
                class="flex flex-col gap-2 shrink-0 bg-gray-100 border border-gray-300 p-2 rounded-sm"
            >
                <!-- Message Button -->
                <div class="w-10 h-10 bg-gray-300 rounded"></div>
                <!-- Call Button -->
                <div class="w-10 h-10 bg-gray-300 rounded"></div>
                <!-- Share Button -->
                <div class="w-10 h-10 bg-gray-300 rounded"></div>
            </div>
        </div>

        <!-- Mobile Layout -->
        <div class="lg:hidden flex flex-col gap-4">
            <!-- Image Skeleton - Full width with 1:1 aspect ratio -->
            <div class="w-full aspect-square">
                <div
                    class="relative w-full h-full rounded border border-gray-300 bg-gray-200 flex items-center justify-center overflow-hidden"
                >
                    <div class="w-20 h-20 bg-gray-300 rounded-full"></div>
                </div>
            </div>

            <!-- Content Card -->
            <div class="flex flex-col border border-gray-300 p-3 gap-3 rounded-sm bg-gray-50">
                <!-- Company Header -->
                <div class="flex flex-col flex-1 min-w-0 gap-3">
                    <!-- Company Name Row -->
                    <div class="flex items-center gap-2 flex-wrap">
                        <!-- "Supplier:" label -->
                        <div class="h-4 w-14 bg-gray-300 rounded"></div>
                        <!-- Company name/link -->
                        <div class="h-4 w-32 bg-gray-300 rounded"></div>
                        <!-- Verified icon -->
                        <div class="w-3 h-3 bg-gray-300 rounded-full"></div>
                        <!-- Connected icon -->
                        <div class="w-3 h-3 bg-gray-300 rounded-full"></div>
                    </div>

                    <!-- Stats Row -->
                    <div class="flex flex-wrap items-center gap-2 text-caption1">
                        <!-- Rating -->
                        <div class="flex items-center gap-1">
                            <div class="h-3 w-6 bg-gray-300 rounded"></div>
                            <div class="w-3 h-3 bg-gray-300 rounded"></div>
                        </div>
                        <span class="w-px h-3 bg-gray-300"></span>

                        <!-- Products -->
                        <div class="flex items-center gap-1">
                            <div class="h-3 w-6 bg-gray-300 rounded"></div>
                            <div class="h-3 w-14 bg-gray-300 rounded"></div>
                        </div>
                        <span class="w-px h-3 bg-gray-300"></span>

                        <!-- Posts -->
                        <div class="flex items-center gap-1">
                            <div class="h-3 w-6 bg-gray-300 rounded"></div>
                            <div class="h-3 w-10 bg-gray-300 rounded"></div>
                        </div>
                        <span class="w-px h-3 bg-gray-300"></span>

                        <!-- Followers -->
                        <div class="flex items-center gap-1">
                            <div class="h-3 w-8 bg-gray-300 rounded"></div>
                            <div class="h-3 w-14 bg-gray-300 rounded"></div>
                        </div>
                        <span class="w-px h-3 bg-gray-300"></span>

                        <!-- Connections -->
                        <div class="flex items-center gap-1">
                            <div class="h-3 w-6 bg-gray-300 rounded"></div>
                            <div class="h-3 w-18 bg-gray-300 rounded"></div>
                        </div>
                    </div>
                </div>

                <!-- Action Buttons Row -->
                <div class="flex gap-2">
                    <!-- Follow Button -->
                    <div class="h-8 flex-1 bg-gray-300 rounded"></div>
                    <!-- Connect Button -->
                    <div class="h-8 flex-1 bg-gray-300 rounded"></div>
                </div>

                <!-- Details Grid -->
                <div class="grid grid-cols-2 gap-2">
                    <!-- Legal Name -->
                    <div class="space-y-1">
                        <div class="h-3 w-20 bg-gray-300 rounded"></div>
                        <div class="h-3 w-full bg-gray-300 rounded"></div>
                    </div>

                    <!-- Username -->
                    <div class="space-y-1">
                        <div class="h-3 w-16 bg-gray-300 rounded"></div>
                        <div class="h-3 w-3/4 bg-gray-300 rounded"></div>
                    </div>

                    <!-- Website URL -->
                    <div class="space-y-1">
                        <div class="h-3 w-14 bg-gray-300 rounded"></div>
                        <div class="h-3 w-full bg-gray-300 rounded"></div>
                    </div>

                    <!-- Email -->
                    <div class="space-y-1">
                        <div class="h-3 w-10 bg-gray-300 rounded"></div>
                        <div class="h-3 w-full bg-gray-300 rounded"></div>
                    </div>

                    <!-- Phone Numbers -->
                    <div class="space-y-1 col-span-2">
                        <div class="h-3 w-24 bg-gray-300 rounded"></div>
                        <div class="flex flex-col gap-1">
                            <div class="h-3 w-full bg-gray-300 rounded"></div>
                            <div class="h-3 w-full bg-gray-300 rounded"></div>
                            <div class="h-3 w-full bg-gray-300 rounded"></div>
                        </div>
                    </div>
                </div>

                <!-- Bottom Action Buttons -->
                <div
                    class="flex justify-around gap-2 shrink-0 bg-gray-100 border border-gray-300 p-2 rounded-sm"
                >
                    <!-- Message Button -->
                    <div class="w-10 h-10 bg-gray-300 rounded"></div>
                    <!-- Call Button -->
                    <div class="w-10 h-10 bg-gray-300 rounded"></div>
                    <!-- Share Button -->
                    <div class="w-10 h-10 bg-gray-300 rounded"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    // No props needed for skeleton
    // This component is purely presentational
</script>

<style lang="css" scoped>
    /* Optional: Custom animation timing if needed */
    .company-card-skeleton {
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    @keyframes pulse {
        0%,
        100% {
            opacity: 1;
        }
        50% {
            opacity: 0.8;
        }
    }
</style>
