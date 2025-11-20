<template>
    <div class="image-gallery-section">
        <!-- Desktop Layout: Main Image + Thumbnails -->
        <div class="hidden lg:block">
            <!-- Main Image -->
            <div
                class="relative aspect-square rounded-lg overflow-hidden group border border-gray-200 cursor-zoom-in"
                @click="openModal"
            >
                <img
                    :src="currentDisplayImage"
                    :alt="productName"
                    class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    @error="handleImageError"
                />
                <!-- Zoom Indicator -->
                <div
                    class="absolute top-3 right-3 bg-white text-gray-600 border border-gray-400 hover:bg-red-50 hover:text-red-600 active:bg-red-500 active:text-white p-2 rounded-sm opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-sm cursor-pointer hover:border-red-50 active:border-red-500"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                        />
                    </svg>
                </div>

                <!-- Image Navigation Controls - Show on Hover -->
                <div
                    v-if="allImages.length > 1"
                    class="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                    <button
                        class="bg-white border text-gray-600 hover:bg-red-50 hover:text-red-600 active:bg-red-500 active:text-white disabled:bg-gray-400 disabled:text-white disabled:hover:bg-gray-400 disabled:active:bg-gray-400 p-2 rounded-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:border-red-50 active:border-red-500"
                        :disabled="currentImageIndex === 0"
                        @click.stop="previousImage"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                    </button>

                    <button
                        class="bg-white border text-gray-600 hover:bg-red-50 hover:text-red-600 active:bg-red-500 active:text-white disabled:bg-gray-400 disabled:text-white disabled:hover:bg-gray-400 disabled:active:bg-gray-400 p-2 rounded-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:border-red-50 active:border-red-500"
                        :disabled="currentImageIndex === allImages.length - 1"
                        @click.stop="nextImage"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M9 5l7 7-7 7"
                            />
                        </svg>
                    </button>
                </div>

                <!-- Image Counter - Mobile Only -->
                <div v-if="allImages.length > 1" class="absolute bottom-3 right-3 md:hidden">
                    <div class="bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                        {{ currentImageIndex + 1 }} / {{ allImages.length }}
                    </div>
                </div>
            </div>

            <!-- Thumbnail Gallery -->
            <div
                v-if="allImages.length > 1"
                class="flex gap-3 overflow-x-auto pb-2 mt-3 custom-scrollbar"
            >
                <button
                    v-for="(image, index) in allImages"
                    :key="index"
                    class="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all duration-200 hover:border-gray-600"
                    :class="[currentImageIndex === index ? 'border-gray-600' : 'border-gray-400']"
                    @click="selectImage(index)"
                >
                    <img
                        :src="image"
                        :alt="`${productName} image ${index + 1}`"
                        loading="lazy"
                        class="w-full h-full object-cover"
                    />
                </button>
            </div>
        </div>

        <!-- Mobile/Tablet Layout: Horizontal Carousel -->
        <div class="lg:hidden">
            <!-- Carousel with Multiple Visible Images -->
            <div class="carousel-wrapper">
                <!-- Left Arrow -->
                <button
                    v-if="allImages.length > 1"
                    class="carousel-arrow carousel-arrow-left bg-white text-gray-600 hover:bg-red-50 hover:text-red-600 active:bg-red-500 active:text-white disabled:bg-gray-400 disabled:text-white"
                    :disabled="scrollPosition <= 0"
                    @click="scrollLeft"
                >
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                </button>

                <!-- Images Container -->
                <div ref="carouselRef" class="carousel-container">
                    <div class="carousel-track">
                        <div
                            v-for="(image, index) in allImages"
                            :key="index"
                            class="carousel-slide"
                            :class="{ active: currentImageIndex === index }"
                            @click="selectImageAndOpen(index)"
                        >
                            <div class="carousel-image-wrapper">
                                <img
                                    :src="image"
                                    :alt="`${productName} - Image ${index + 1}`"
                                    class="carousel-image"
                                    loading="lazy"
                                    @error="handleImageError"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Arrow -->
                <button
                    v-if="allImages.length > 1"
                    class="carousel-arrow carousel-arrow-right bg-white text-gray-600 hover:bg-red-50 hover:text-red-600 active:bg-red-500 active:text-white disabled:bg-gray-400 disabled:text-white hover:border-red-50 active:border-red-500"
                    :disabled="scrollPosition >= maxScroll"
                    @click="scrollRight"
                >
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 5l7 7-7 7"
                        />
                    </svg>
                </button>
            </div>

            <!-- Dot Indicators -->
            <div v-if="allImages.length > 1" class="carousel-dots">
                <button
                    v-for="(image, index) in allImages"
                    :key="`dot-${index}`"
                    class="carousel-dot"
                    :class="{ 'carousel-dot-active': currentImageIndex === index }"
                    :aria-label="`Go to image ${index + 1}`"
                    @click="selectImageAndScroll(index)"
                />
            </div>
        </div>

        <!-- Modal/Lightbox -->
        <Teleport to="body">
            <Transition name="modal-fade">
                <div
                    v-if="isModalOpen"
                    class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                >
                    <div
                        class="absolute inset-0 bg-gray-100/80 backdrop-blur-sm"
                        @click="closeModal"
                    ></div>

                    <!-- Modal Card -->
                    <div
                        class="relative bg-white rounded-sm shadow-2xl w-full max-w-2xl z-[9999]"
                        @click.stop
                    >
                        <!-- Previous Button - Inside Modal -->
                        <button
                            v-if="allImages.length > 1"
                            class="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-sm transition-all duration-300 bg-white text-gray-600 hover:bg-red-50 hover:text-red-600 active:bg-red-500 active:text-white disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:text-white border border-gray-600 hover:border-red-50 active:border-red-500"
                            :disabled="currentImageIndex === 0"
                            @click="previousImage"
                        >
                            <svg
                                class="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                        </button>

                        <!-- Next Button - Inside Modal -->
                        <button
                            v-if="allImages.length > 1"
                            class="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-sm transition-all duration-300 bg-white text-gray-600 hover:bg-red-50 hover:text-red-600 active:bg-red-500 active:text-white disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:text-white border border-gray-600 hover:border-red-50 active:border-red-500"
                            :disabled="currentImageIndex === allImages.length - 1"
                            @click="nextImage"
                        >
                            <svg
                                class="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M9 5l7 7-7 7"
                                />
                            </svg>
                        </button>
                        <!-- Close Button -->
                        <div class="absolute top-3 right-3 z-10">
                            <ButtonClose size="lg" @click="closeModal" />
                        </div>

                        <!-- Square Image Container -->
                        <div class="aspect-square w-full flex items-center justify-center p-14">
                            <img
                                :src="currentDisplayImage"
                                :alt="`${productName} - Full View ${currentImageIndex + 1}`"
                                class="max-w-full max-h-full object-contain"
                            />
                        </div>

                        <!-- Image Counter -->
                        <div
                            v-if="allImages.length > 1"
                            class="absolute bottom-4 left-1/2 -translate-x-1/2 text-gray-600 text-sm font-medium"
                        >
                            {{ currentImageIndex + 1 }}/{{ allImages.length }}
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

    interface Props {
        images: {
            primary?: string
            gallery?: string[]
        }
        productName: string
    }

    const props = defineProps<Props>()

    const currentImageIndex = ref(0)
    const isModalOpen = ref(false)
    const carouselRef = ref<HTMLElement | null>(null)
    const scrollPosition = ref(0)
    const maxScroll = ref(0)

    const allImages = computed(() => {
        const images = []

        if (props.images?.primary) {
            images.push(props.images.primary)
        }

        if (props.images?.gallery?.length) {
            images.push(...props.images.gallery)
        }

        if (images.length === 0) {
            images.push('/images/content/no-image.svg')
        }

        return images
    })

    const currentDisplayImage = computed(() => {
        return allImages.value[currentImageIndex.value] || '/images/content/no-image.svg'
    })

    const selectImage = (index: number) => {
        currentImageIndex.value = index
    }

    const openModal = () => {
        isModalOpen.value = true
        document.body.style.overflow = 'hidden'
    }

    const openModalWithImage = (index: number) => {
        currentImageIndex.value = index
        isModalOpen.value = true
        document.body.style.overflow = 'hidden'
    }

    const selectImageAndOpen = (index: number) => {
        currentImageIndex.value = index
        openModal()
    }

    const selectImageAndScroll = (index: number) => {
        currentImageIndex.value = index
        scrollToImage(index)
    }

    const scrollToImage = (index: number) => {
        if (carouselRef.value) {
            const slideWidth = 220
            const containerWidth = carouselRef.value.offsetWidth
            const targetScroll = index * slideWidth - containerWidth / 2 + slideWidth / 2

            carouselRef.value.scrollTo({
                left: Math.max(0, targetScroll),
                behavior: 'smooth',
            })
        }
    }

    const scrollLeft = () => {
        if (carouselRef.value) {
            carouselRef.value.scrollBy({
                left: -250,
                behavior: 'smooth',
            })
            setTimeout(updateScrollPosition, 100)
        }
    }

    const scrollRight = () => {
        if (carouselRef.value) {
            carouselRef.value.scrollBy({
                left: 250,
                behavior: 'smooth',
            })
            setTimeout(updateScrollPosition, 100)
        }
    }

    const updateScrollPosition = () => {
        if (carouselRef.value) {
            scrollPosition.value = carouselRef.value.scrollLeft
            maxScroll.value = carouselRef.value.scrollWidth - carouselRef.value.clientWidth

            // Update current image based on scroll position
            const slideWidth = 220
            const scrollCenter = scrollPosition.value + carouselRef.value.offsetWidth / 2
            const newIndex = Math.round(scrollCenter / slideWidth)
            const clampedIndex = Math.max(0, Math.min(newIndex, allImages.value.length - 1))

            if (clampedIndex !== currentImageIndex.value) {
                currentImageIndex.value = clampedIndex
            }
        }
    }

    const handleResize = () => {
        if (carouselRef.value) {
            nextTick(() => {
                updateScrollPosition()
            })
        }
    }

    const nextImage = () => {
        if (currentImageIndex.value < allImages.value.length - 1) {
            currentImageIndex.value++
        }
    }

    const previousImage = () => {
        if (currentImageIndex.value > 0) {
            currentImageIndex.value--
        }
    }

    const closeModal = () => {
        isModalOpen.value = false
        document.body.style.overflow = ''
    }

    const handleImageError = (event: Event) => {
        const img = event.target as HTMLImageElement
        img.src = '/images/content/placeholder-product.svg'
    }

    const handleKeydown = (e: KeyboardEvent) => {
        if (!isModalOpen.value) return

        if (e.key === 'Escape') {
            closeModal()
        } else if (e.key === 'ArrowLeft') {
            previousImage()
        } else if (e.key === 'ArrowRight') {
            nextImage()
        }
    }

    onMounted(() => {
        window.addEventListener('keydown', handleKeydown)
        window.addEventListener('resize', handleResize)
        if (carouselRef.value) {
            carouselRef.value.addEventListener('scroll', updateScrollPosition)
            nextTick(() => {
                updateScrollPosition()
            })
        }
    })

    onUnmounted(() => {
        window.removeEventListener('keydown', handleKeydown)
        window.removeEventListener('resize', handleResize)
        if (carouselRef.value) {
            carouselRef.value.removeEventListener('scroll', updateScrollPosition)
        }
        document.body.style.overflow = ''
    })
</script>
<style scoped>
    /* Desktop Thumbnail Scrollbar - VIZIBIL */
    .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: #9ca3af #e5e7eb;
    }

    .custom-scrollbar::-webkit-scrollbar {
        height: 8px;
        width: 8px;
    }

    .custom-scrollbar::-webkit-scrollbar-track {
        @apply bg-gray-200 rounded-full;
        margin: 0 0.5rem;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb {
        @apply bg-gray-400 rounded-full;
        border: 2px solid transparent;
        background-clip: padding-box;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        @apply bg-gray-600;
    }

    .image-gallery-section {
        max-width: 100%;
        overflow-x: hidden;
    }

    /* Desktop Main Image Size Limits - CORECTAT */
    @media (min-width: 1024px) {
        .image-gallery-section {
            max-width: 280px;
        }
    }

    @media (min-width: 1280px) {
        .image-gallery-section {
            max-width: 320px;
        }
    }

    @media (min-width: 1560px) {
        .image-gallery-section {
            max-width: 350px;
        }
    }

    .carousel-wrapper {
        position: relative;
        width: 100%;
        max-width: 100%;
        overflow: hidden;
    }

    .carousel-container {
        position: relative;
        width: 100%;
        overflow-x: auto;
        scroll-behavior: smooth;
        scrollbar-width: none;
        -ms-overflow-style: none;
        -webkit-overflow-scrolling: touch;
        scroll-snap-type: x proximity;
    }

    .carousel-container::-webkit-scrollbar {
        display: none;
    }

    .carousel-track {
        @apply flex gap-0;
        width: max-content;
    }

    .carousel-slide {
        min-width: 150px;
        max-width: 220px;
        flex-shrink: 0;
        cursor: pointer;
        overflow: hidden;
        transition: all 0.2s ease;
        scroll-snap-align: start;
    }

    .carousel-slide:hover {
        @apply scale-105;
    }

    .carousel-image-wrapper {
        aspect-ratio: 1;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem;
    }

    .carousel-image {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        transition: transform 0.3s ease;
    }

    .carousel-slide:hover .carousel-image {
        transform: scale(1.05);
    }

    .carousel-arrow {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        z-index: 10;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        @apply border border-gray-400 rounded-sm hover:border-red-50 active:border-red-500;
    }

    .carousel-arrow:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .carousel-arrow-left {
        left: 0rem;
    }

    .carousel-arrow-right {
        right: 0rem;
    }

    .carousel-dots {
        @apply flex justify-center items-center gap-1.5 py-4;
    }

    .carousel-dot {
        @apply w-3.5 h-3.5 rounded-full bg-gray-400 p-0;
        border: none;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .carousel-dot:hover {
        @apply bg-gray-500;
    }

    .carousel-dot-active {
        @apply bg-gray-600;
    }

    /* Modal transitions */
    .modal-fade-enter-active,
    .modal-fade-leave-active {
        transition: opacity 0.3s ease;
    }

    .modal-fade-enter-from,
    .modal-fade-leave-to {
        opacity: 0;
    }

    /* FIX pentru ecrane 370-400px */
    @media (max-width: 400px) {
        .carousel-wrapper {
            margin: 0;
            padding: 0;
        }

        .carousel-slide {
            min-width: 110px;
            max-width: 140px;
        }

        .carousel-arrow {
            width: 32px;
            height: 32px;
        }

        .carousel-arrow svg {
            width: 1rem;
            height: 1rem;
        }

        .carousel-image-wrapper {
            padding: 0.25rem;
        }
    }

    /* Pentru ecrane foarte mici (sub 370px) */
    @media (max-width: 370px) {
        .carousel-slide {
            min-width: 100px;
            max-width: 120px;
        }

        .carousel-arrow {
            width: 28px;
            height: 28px;
        }
    }

    /* Ecrane medii (401-640px) */
    @media (max-width: 640px) and (min-width: 401px) {
        .carousel-slide {
            min-width: 120px;
            max-width: 180px;
        }
    }

    /* Disable hover effects on touch devices */
    @media (hover: none) {
        .carousel-slide:hover {
            transform: none;
        }

        .carousel-slide:hover .carousel-image {
            transform: none;
        }
    }
</style>
