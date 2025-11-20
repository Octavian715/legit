<template>
    <div
        class="product-card relative p-3 border-t first:border-t-0 last:border-b min-h-64 border-gray-400"
    >
        <!-- Main Layout Container - matches exact structure -->
        <div class="flex flex-1 flex-col gap-2 md:gap-3 sm:flex-row">
            <!-- Product Image - exact sizing -->
            <div class="product-image w-full h-full flex-1">
                <div
                    class="relative flex-shrink-0 min-h-28 min-w-0 border border-gray-400 rounded-sm aspect-square"
                >
                    <div class="skeleton-shimmer w-full h-full bg-gray-300 rounded-sm"></div>
                </div>
            </div>

            <!-- Product Info Container - exact border and padding -->
            <div class="min-w-0 flex-1 border border-gray-500 p-3 rounded-sm">
                <!-- Supplier Info - exact structure -->
                <div
                    class="supplier-info flex flex-col xl:flex-row xl:items-center sm:border-b border-gray-400 gap-2 w-full sm:pb-2"
                >
                    <!-- Supplier name row -->
                    <div class="flex items-start lg:items-center gap-1">
                        <div class="skeleton-shimmer w-16 h-5 bg-gray-300 rounded"></div>
                        <div class="skeleton-shimmer w-32 h-5 bg-gray-300 rounded"></div>
                        <div class="skeleton-shimmer w-3 h-3 bg-gray-300 rounded-sm"></div>
                        <div class="skeleton-shimmer w-3 h-3 bg-gray-300 rounded-sm"></div>
                    </div>

                    <!-- Buttons row -->
                    <div
                        class="flex flex-col md:flex-row md:items-center justify-between gap-2 w-full"
                    >
                        <div class="flex flex-wrap gap-1">
                            <div class="skeleton-shimmer w-7 h-7 bg-gray-300 rounded-full"></div>
                            <div class="skeleton-shimmer w-7 h-7 bg-gray-300 rounded-full"></div>
                        </div>

                        <div class="flex gap-1">
                            <div class="skeleton-shimmer w-20 h-8 bg-gray-300 rounded"></div>
                            <div class="skeleton-shimmer w-24 h-8 bg-gray-300 rounded"></div>
                        </div>
                    </div>
                </div>

                <!-- Product Details Section -->
                <div class="sm:space-y-2 xl:flex sm:justify-between mt-2 gap-2 xl:mb-6">
                    <!-- Details List -->
                    <div class="space-y-2 sm:space-y-1 w-full">
                        <div v-for="n in 6" :key="n" class="grid grid-cols-[100px_1fr] gap-1">
                            <div class="skeleton-shimmer h-[13.8px] bg-gray-300 rounded w-20"></div>
                            <div
                                class="skeleton-shimmer h-[13.8px] bg-gray-300 rounded w-full max-w-[200px]"
                            ></div>
                        </div>
                    </div>

                    <!-- Product Info (Private Label) -->
                    <div class="hidden md:flex flex-col gap-1 flex-wrap">
                        <div
                            class="skeleton-shimmer h-6 w-32 bg-gray-300 rounded border border-gray-400"
                        ></div>
                        <div
                            class="skeleton-shimmer h-6 w-32 bg-gray-300 rounded border border-gray-400"
                        ></div>
                    </div>
                </div>

                <!-- Product Metadata -->
                <div class="w-full md:border-t md:border-gray-500 md:pt-1.5">
                    <div class="hidden md:flex flex-col gap-1 mt-2">
                        <!-- First row -->
                        <div class="flex flex-wrap gap-3 text-subtitle4">
                            <div class="skeleton-shimmer w-24 h-[13.8px] bg-gray-300 rounded"></div>
                            <div class="skeleton-shimmer w-28 h-[13.8px] bg-gray-300 rounded"></div>
                        </div>
                        <!-- Second row -->
                        <div class="flex flex-wrap gap-1.5 text-subtitle4">
                            <div class="flex items-center gap-1">
                                <div class="skeleton-shimmer w-3 h-3 bg-gray-300 rounded"></div>
                                <div
                                    class="skeleton-shimmer w-20 h-[13.8px] bg-gray-300 rounded"
                                ></div>
                            </div>
                            <div class="flex items-center gap-1">
                                <div class="skeleton-shimmer w-3 h-3 bg-gray-300 rounded"></div>
                                <div
                                    class="skeleton-shimmer w-24 h-[13.8px] bg-gray-300 rounded"
                                ></div>
                            </div>
                            <div class="flex items-center gap-1">
                                <div class="skeleton-shimmer w-3 h-3 bg-gray-300 rounded"></div>
                                <div
                                    class="skeleton-shimmer w-20 h-[13.8px] bg-gray-300 rounded"
                                ></div>
                            </div>
                            <div class="flex items-center gap-1">
                                <div class="skeleton-shimmer w-3 h-3 bg-gray-300 rounded"></div>
                                <div
                                    class="skeleton-shimmer w-24 h-[13.8px] bg-gray-300 rounded"
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Price & Actions Row -->
        <div class="flex flex-col lg:flex-row gap-2 md:gap-3">
            <!-- Product Price - EXACT w-72 on desktop -->
            <div class="w-full lg:w-72 bg-gray-200 rounded-sm p-3 border border-gray-400 lg:h-auto">
                <div class="space-y-2">
                    <!-- Price Row -->
                    <div class="grid grid-cols-[1.3fr_2fr] items-center gap-1">
                        <div class="skeleton-shimmer w-10 h-[13.8px] bg-gray-300 rounded"></div>
                        <div class="flex items-center gap-2">
                            <div class="skeleton-shimmer w-20 h-[13.8px] bg-gray-300 rounded"></div>
                            <div class="skeleton-shimmer w-16 h-[13.8px] bg-gray-300 rounded"></div>
                        </div>
                    </div>

                    <!-- Interest Row -->
                    <div class="hidden sm:grid grid-cols-[1.3fr_2fr] items-center gap-1">
                        <div class="skeleton-shimmer w-14 h-[13.8px] bg-gray-300 rounded"></div>
                        <div class="skeleton-shimmer w-12 h-[13.8px] bg-gray-300 rounded"></div>
                    </div>

                    <!-- Own Price Row -->
                    <div class="hidden sm:grid grid-cols-[1.3fr_2fr] items-center gap-1">
                        <div class="skeleton-shimmer w-20 h-[13.8px] bg-gray-300 rounded"></div>
                        <div
                            class="skeleton-shimmer h-10 bg-gray-300 rounded border border-gray-400"
                        ></div>
                    </div>

                    <!-- VAT Row -->
                    <div class="grid grid-cols-[1.3fr_2fr] items-center gap-1">
                        <div class="skeleton-shimmer w-8 h-[13.8px] bg-gray-300 rounded"></div>
                        <div class="skeleton-shimmer w-12 h-[13.8px] bg-gray-300 rounded"></div>
                    </div>

                    <!-- Quantity Selector -->
                    <div
                        class="flex flex-col sm:flex-row items-center md:flex-col gap-2 border-t border-gray-200 pt-2"
                    >
                        <!-- Multiplier Buttons -->
                        <div class="flex gap-0 justify-center flex-1 w-full">
                            <div
                                v-for="n in 5"
                                :key="n"
                                class="skeleton-shimmer flex-1 h-8 bg-gray-300 border border-gray-400 first:rounded-l last:rounded-r -ml-px first:ml-0"
                            ></div>
                        </div>

                        <!-- Quantity Controls + Remove Button -->
                        <div class="flex gap-2 w-full">
                            <div
                                class="flex items-center border border-gray-400 bg-white rounded overflow-hidden h-8 w-full"
                            >
                                <div class="skeleton-shimmer w-10 h-10 bg-gray-300"></div>
                                <div class="flex-1 h-full"></div>
                                <div class="skeleton-shimmer w-10 h-10 bg-gray-300"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Total Price Row -->
                    <div class="grid grid-cols-[1.3fr_2fr] items-center gap-1">
                        <div class="skeleton-shimmer w-20 h-[13.8px] bg-gray-300 rounded"></div>
                        <div class="skeleton-shimmer w-24 h-[18.4px] bg-gray-300 rounded"></div>
                    </div>
                </div>
            </div>

            <!-- Action Buttons - exact sizing -->
            <div
                class="action-buttons-container flex bg-gray-200 border-gray-400 p-2 rounded-sm justify-between border flex-col lg:flex-col gap-2"
            >
                <div
                    v-for="n in 5"
                    :key="n"
                    class="skeleton-shimmer bg-gray-300 rounded h-10 w-10 lg:h-8 lg:w-8"
                ></div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts"></script>

<style scoped>
    /* Base Card Styles */
    .product-card {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        will-change: auto;
        transform: translateZ(0);
    }

    @media (min-width: 768px) {
        .product-card {
            gap: 0.75rem;
        }
    }

    @media (min-width: 1023px) {
        .product-card {
            flex-direction: row;
        }
    }

    /* Product Image Sizing */
    @media (min-width: 1023px) {
        .product-image {
            max-width: 240px;
        }
    }

    @media (min-width: 1023px) and (max-width: 1280px) {
        .product-image {
            flex: 1 1 auto;
            width: 100%;
            height: 100%;
            max-width: 278px;
        }
    }

    /* Action Buttons Container */
    .action-buttons-container {
        flex-direction: row;
        width: 100%;
    }

    @media (min-width: 1024px) {
        .action-buttons-container {
            flex-direction: column;
            width: auto;
        }
    }

    /* Skeleton Shimmer Animation */
    .skeleton-shimmer {
        position: relative;
        overflow: hidden;
    }

    .skeleton-shimmer::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        animation: shimmer 2s infinite;
    }

    @keyframes shimmer {
        0% {
            transform: translateX(-100%);
        }
        100% {
            transform: translateX(100%);
        }
    }

    /* Reduced Motion */
    @media (prefers-reduced-motion: reduce) {
        .product-card * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
        }

        .skeleton-shimmer::before {
            animation: none;
        }
    }
</style>
