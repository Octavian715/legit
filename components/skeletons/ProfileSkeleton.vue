<template>
    <div class="profile-skeleton min-h-screen animate-pulse">
        <!-- Cover Image Skeleton -->
        <div class="relative w-full h-40 bg-gray-300 rounded-t-md overflow-hidden">
            <div
                class="absolute inset-0 bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 shimmer"
            ></div>
        </div>

        <!-- Profile Header Skeleton -->
        <div class="bg-white shadow-sm mb-2">
            <div class="container mx-auto px-4 py-4">
                <div class="flex flex-col lg:flex-row gap-4">
                    <!-- Avatar + Info Section -->
                    <div class="flex flex-col lg:flex-row lg:items-start items-center gap-3 flex-1">
                        <!-- Avatar -->
                        <div class="relative -mt-36 lg:-mt-16 flex-shrink-0">
                            <div
                                class="w-40 h-40 bg-gray-300 rounded-full border-4 border-white shadow-lg"
                            ></div>
                        </div>

                        <!-- Profile Info -->
                        <div class="flex-1 min-w-0 pt-2 space-y-3">
                            <!-- Name + Verified Badge -->
                            <div class="flex justify-center lg:justify-start items-center gap-2">
                                <div class="h-8 w-56 bg-gray-300 rounded"></div>
                                <div class="w-4 h-4 bg-gray-300 rounded-full"></div>
                            </div>

                            <!-- Username -->
                            <div
                                class="flex justify-center lg:justify-start h-5 w-32 bg-gray-300 rounded mx-auto lg:mx-0"
                            ></div>

                            <!-- Stats (Products, Connections, Followers) -->
                            <div class="flex items-center gap-3 justify-center lg:justify-start">
                                <div class="flex flex-col sm:flex-row items-center gap-1">
                                    <div class="h-5 w-8 bg-gray-300 rounded"></div>
                                    <div class="h-5 w-20 bg-gray-300 rounded"></div>
                                </div>

                                <div class="w-px h-5 bg-gray-400"></div>

                                <div class="flex flex-col sm:flex-row items-center gap-1">
                                    <div class="h-5 w-8 bg-gray-300 rounded"></div>
                                    <div class="h-5 w-24 bg-gray-300 rounded"></div>
                                </div>

                                <div class="w-px h-5 bg-gray-400"></div>

                                <div class="flex flex-col sm:flex-row items-center gap-1">
                                    <div class="h-5 w-12 bg-gray-300 rounded"></div>
                                    <div class="h-5 w-20 bg-gray-300 rounded"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Rating + Actions Section -->
                    <div class="flex flex-col lg:ml-auto justify-center lg:justify-end gap-3">
                        <!-- Rating -->
                        <div
                            class="flex flex-col justify-center lg:justify-end gap-2 mb-2 lg:ml-auto"
                        >
                            <div class="flex justify-center lg:justify-start items-center gap-2">
                                <div class="h-7 w-10 bg-gray-300 rounded"></div>
                                <!-- Stars -->
                                <div class="flex gap-1">
                                    <div
                                        v-for="i in 5"
                                        :key="i"
                                        class="w-5 h-5 bg-gray-300 rounded"
                                    ></div>
                                </div>
                            </div>
                            <div class="h-4 w-24 bg-gray-300 rounded mx-auto lg:mx-0"></div>
                        </div>

                        <!-- Action Buttons (Chat, Follow, Connect) -->
                        <div class="flex flex-col gap-2 lg:items-end lg:justify-center">
                            <div class="flex gap-2">
                                <!-- Chat Button -->
                                <div class="h-10 w-24 bg-gray-300 rounded-sm"></div>
                                <!-- Follow Button -->
                                <div class="h-10 w-24 bg-gray-300 rounded-sm"></div>
                                <!-- Connect Button -->
                                <div class="h-10 w-28 bg-gray-300 rounded-sm"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tabs Skeleton -->
        <div class="container mx-auto py-3">
            <div class="bg-white rounded-sm mb-4 p-4">
                <div class="flex gap-6 overflow-x-auto scrollbar-hide">
                    <div class="h-6 w-32 bg-gray-300 rounded flex-shrink-0"></div>
                    <div class="h-6 w-24 bg-gray-300 rounded flex-shrink-0"></div>
                    <div class="h-6 w-20 bg-gray-300 rounded flex-shrink-0"></div>
                    <div class="h-6 w-24 bg-gray-300 rounded flex-shrink-0"></div>
                    <div class="h-6 w-40 bg-gray-300 rounded flex-shrink-0"></div>
                    <div class="h-6 w-28 bg-gray-300 rounded flex-shrink-0"></div>
                </div>
            </div>

            <!-- Content Area -->
            <div class="space-y-4">
                <!-- Company Description Block -->
                <div class="bg-white rounded-md p-4 space-y-3">
                    <div class="h-6 w-48 bg-gray-300 rounded"></div>
                    <div class="space-y-2">
                        <div class="h-4 w-full bg-gray-300 rounded"></div>
                        <div class="h-4 w-full bg-gray-300 rounded"></div>
                        <div class="h-4 w-11/12 bg-gray-300 rounded"></div>
                        <div class="h-4 w-3/4 bg-gray-300 rounded"></div>
                    </div>
                </div>

                <!-- Gallery Block -->
                <div class="bg-white rounded-md p-4 space-y-3">
                    <div class="h-6 w-32 bg-gray-300 rounded"></div>
                    <div class="relative">
                        <!-- Left scroll button -->
                        <div
                            class="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-gray-300 rounded-sm"
                        ></div>

                        <!-- Gallery images -->
                        <div class="flex gap-3 overflow-hidden px-10">
                            <div
                                v-for="i in 5"
                                :key="i"
                                class="flex-shrink-0 w-48 h-48 bg-gray-300 rounded-md"
                            ></div>
                        </div>

                        <!-- Right scroll button -->
                        <div
                            class="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-gray-300 rounded-sm"
                        ></div>
                    </div>
                </div>

                <!-- Company Information Card -->
                <div class="bg-white rounded-md p-4 space-y-4">
                    <div class="h-6 w-56 bg-gray-300 rounded"></div>

                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div v-for="i in 12" :key="i" class="space-y-2">
                            <div class="h-4 w-32 bg-gray-300 rounded"></div>
                            <div class="h-5 w-full bg-gray-300 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    // No props needed for skeleton
</script>

<style scoped lang="scss">
    @keyframes shimmer {
        0% {
            transform: translateX(-100%);
        }
        100% {
            transform: translateX(100%);
        }
    }

    .shimmer {
        animation: shimmer 2s infinite;
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
            opacity: 0.7;
        }
    }

    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }

    .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
</style>
