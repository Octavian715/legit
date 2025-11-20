<template>
    <div class="product-details-skeleton">
        <div class="bg-white rounded-sm">
            <div class="product-wrapper">
                <!-- Image Gallery Skeleton -->
                <div class="image-gallery-section">
                    <div class="hidden lg:block space-y-3">
                        <div class="aspect-square bg-gray-300 rounded-lg animate-pulse"></div>
                        <div class="flex gap-3 overflow-x-auto pb-2">
                            <div
                                v-for="n in 4"
                                :key="n"
                                class="flex-shrink-0 w-16 h-16 rounded-md bg-gray-300 animate-pulse"
                            ></div>
                        </div>
                    </div>

                    <div class="lg:hidden">
                        <div class="carousel-wrapper">
                            <div class="carousel-container">
                                <div class="carousel-track">
                                    <div v-for="n in 3" :key="n" class="carousel-slide">
                                        <div class="carousel-image-wrapper">
                                            <div
                                                class="w-full h-full bg-gray-300 rounded animate-pulse"
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="carousel-dots">
                            <div
                                v-for="n in 3"
                                :key="`dot-${n}`"
                                class="w-3.5 h-3.5 rounded-full bg-gray-300 animate-pulse"
                            />
                        </div>
                    </div>
                </div>

                <!-- Product Info Section -->
                <div class="product-info-actions">
                    <div class="product-info-section space-y-3">
                        <!-- Supplier Info Skeleton -->
                        <div class="supplier-info-skeleton">
                            <div class="flex items-center gap-2 border-b border-gray-400 pb-3">
                                <div class="h-4 w-20 bg-gray-300 rounded animate-pulse"></div>
                                <div class="h-4 w-32 bg-gray-300 rounded animate-pulse"></div>
                                <div class="flex-1"></div>
                                <div class="flex gap-1">
                                    <div class="h-8 w-8 bg-gray-300 rounded animate-pulse"></div>
                                    <div class="h-8 w-20 bg-gray-300 rounded animate-pulse"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Product Name & Brand Skeleton -->
                        <div class="space-y-3">
                            <div
                                class="flex flex-col items-start gap-3 border-b border-gray-400 pb-3"
                            >
                                <div class="h-8 w-3/4 bg-gray-300 rounded animate-pulse"></div>
                                <div class="flex flex-wrap gap-3">
                                    <div class="h-6 w-24 bg-gray-300 rounded animate-pulse"></div>
                                    <div class="h-6 w-32 bg-gray-300 rounded animate-pulse"></div>
                                </div>
                            </div>

                            <!-- Product Details Skeleton -->
                            <div class="space-y-3 border-b border-gray-400 pb-3">
                                <div
                                    v-for="n in 14"
                                    :key="n"
                                    class="grid grid-cols-[100px_1fr] gap-1"
                                >
                                    <div
                                        class="h-[14px] w-20 bg-gray-300 rounded animate-pulse"
                                    ></div>
                                    <div
                                        class="h-[14px] w-32 bg-gray-300 rounded animate-pulse"
                                    ></div>
                                </div>
                            </div>

                            <!-- Package Info Skeleton -->
                            <ul class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <li
                                    v-for="n in 4"
                                    :key="n"
                                    class="border border-gray-400 rounded-md flex flex-col items-center gap-2 py-2"
                                >
                                    <div
                                        class="w-6 h-6 bg-gray-300 rounded-full animate-pulse"
                                    ></div>
                                    <div class="h-3 w-16 bg-gray-300 rounded animate-pulse"></div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Sidebar Section -->
                <div class="sidebar-section sticky top-6 space-y-3 h-fit">
                    <!-- Price Skeleton -->
                    <div
                        class="h-full md:w-full min-h-[400px] bg-gray-200 rounded-sm p-3 border border-gray-400 space-y-2"
                    >
                        <div class="grid grid-cols-2 items-center gap-1">
                            <div class="h-4 w-12 bg-gray-300 rounded animate-pulse"></div>
                            <div class="h-5 w-20 bg-gray-300 rounded animate-pulse"></div>
                        </div>

                        <div class="grid grid-cols-2 items-center gap-1">
                            <div class="h-4 w-16 bg-gray-300 rounded animate-pulse"></div>
                            <div class="h-4 w-12 bg-gray-300 rounded animate-pulse"></div>
                        </div>

                        <div class="grid grid-cols-2 items-center gap-1">
                            <div class="h-4 w-20 bg-gray-300 rounded animate-pulse"></div>
                            <div class="h-8 w-full bg-gray-300 rounded animate-pulse"></div>
                        </div>

                        <div
                            class="flex items-center md:flex-col gap-2 border-t border-gray-300 pt-2"
                        >
                            <div class="flex gap-0 flex-1 md:w-full h-8">
                                <div
                                    v-for="n in 5"
                                    :key="n"
                                    class="flex-1 bg-gray-300 border border-gray-300 animate-pulse"
                                    :class="{ 'rounded-l': n === 1, 'rounded-r': n === 5 }"
                                ></div>
                            </div>

                            <div
                                class="flex items-center border border-gray-300 rounded overflow-hidden h-8 md:w-full"
                            >
                                <div class="w-10 h-10 bg-gray-300 animate-pulse"></div>
                                <div class="flex-1 bg-gray-300 animate-pulse h-full"></div>
                                <div class="w-10 h-10 bg-gray-300 animate-pulse"></div>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 items-center gap-1">
                            <div class="h-4 w-16 bg-gray-300 rounded animate-pulse"></div>
                            <div class="h-6 w-24 bg-gray-300 rounded animate-pulse"></div>
                        </div>
                    </div>

                    <!-- Action Buttons Skeleton -->
                    <div
                        class="flex bg-gray-200 border-gray-400 p-3 rounded-sm justify-between border gap-3 lg:flex-col"
                    >
                        <div
                            v-for="n in 5"
                            :key="n"
                            class="w-8 h-8 bg-gray-300 rounded animate-pulse"
                        ></div>
                    </div>

                    <!-- EAN Skeletons -->
                    <div class="space-y-3">
                        <div
                            class="flex flex-col px-4 py-1 items-center gap-1 bg-white border border-gray-400 rounded-sm p-3"
                        >
                            <div class="h-3 w-32 bg-gray-300 rounded animate-pulse"></div>
                            <div class="w-32 h-16 bg-gray-300 rounded animate-pulse"></div>
                            <div class="h-5 w-28 bg-gray-300 rounded animate-pulse"></div>
                        </div>

                        <div
                            class="flex flex-col px-4 py-1 items-center gap-1 bg-white border border-gray-400 rounded-sm p-3"
                        >
                            <div class="h-3 w-24 bg-gray-300 rounded animate-pulse"></div>
                            <div class="w-32 h-4 bg-gray-300 rounded animate-pulse"></div>
                            <div class="h-5 w-28 bg-gray-300 rounded animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts"></script>

<style scoped lang="scss">
    .product-wrapper {
        @apply grid gap-3 p-4 sm:p-6;

        grid-template-areas:
            'image'
            'info-actions'
            'sidebar';

        @media (min-width: 768px) {
            padding: 1.5rem;
            grid-template-areas:
                'image image image'
                'info-actions info-actions sidebar';
        }

        @media (min-width: 1024px) {
            grid-template-columns: 1fr 2fr 1fr;
            grid-template-areas: 'image info-actions info-actions info-actions sidebar';
            grid-template-rows: auto;
        }
    }

    .image-gallery-section {
        grid-area: image;
        @apply w-full;
    }

    .product-info-actions {
        grid-area: info-actions;
        @apply grid grid-cols-1 gap-3;
    }

    .product-info-section {
        @apply w-full;
    }

    .sidebar-section {
        grid-area: sidebar;
        @apply w-full md:w-64;

        .sticky {
            @apply top-6;
            position: sticky;
            align-self: flex-start;
        }
    }

    .carousel-wrapper {
        position: relative;
        width: 100%;
        overflow: hidden;
    }

    .carousel-container {
        position: relative;
        width: 100%;
        overflow-x: auto;
        scroll-behavior: smooth;
        scrollbar-width: none;
        -ms-overflow-style: none;
    }

    .carousel-container::-webkit-scrollbar {
        display: none;
    }

    .carousel-track {
        @apply flex gap-0 py-3;
    }

    .carousel-slide {
        @apply w-[163px] sm:min-w-[179px] flex-shrink-0;
    }

    .carousel-image-wrapper {
        aspect-ratio: 1;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem;
    }

    .carousel-dots {
        @apply flex justify-center items-center gap-1.5 py-4;
    }
</style>
