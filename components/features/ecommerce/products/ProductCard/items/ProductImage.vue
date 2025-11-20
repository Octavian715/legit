<template>
    <div>
        <!-- <div
            class="relative flex-shrink-0 min-w-28 min-h-28 md:w-44 md:h-44 border" -->
        <div
            class="relative flex-shrink-0 min-h-28 h-full min-w-0 border"
            :class="[roundedClass, isNew ? 'border-green-400' : 'border-gray-400']"
        >
            <template v-if="showBadges">
                <div
                    v-if="hasDiscount"
                    class="discount-badge absolute top-0 left-0 z-10"
                    :class="topRoundedClass"
                >
                    {{ t('product.discount') }} {{ discountPercentage }}%
                </div>

                <div
                    v-if="isNew"
                    class="new-badge absolute bottom-0 left-0 right-0 z-10"
                    :class="bottomRoundedClass"
                >
                    {{ t('product.new') }}
                </div>
            </template>

            <div
                class="product-image-container w-full h-full cursor-zoom-in group"
                @click="openModal"
            >
                <!-- <NuxtImg
                    v-if="image"
                    :src="image"
                    :alt="alt"
                    class="w-full h-full sm:object-cover lg:object-fill object-fill"
                    :class="roundedClass"
                    loading="lazy"
                    format="webp"
                    quality="85"
                    sizes="sm:112px md:160px"
                /> -->
                <img
                    v-if="image"
                    :src="image"
                    :alt="alt"
                    class="w-full h-full object-fill"
                    :class="roundedClass"
                    loading="lazy"
                />
                <div
                    v-else
                    class="w-full h-full bg-gray-100 flex items-center justify-center"
                    :class="roundedClass"
                >
                    <svg class="w-12 h-12 text-gray-400" aria-hidden="true">
                        <use xlink:href="/sprite.svg#image" />
                    </svg>
                </div>

                <div
                    class="absolute top-2 right-2 bg-white text-gray-600 border border-gray-400 hover:bg-red-50 hover:text-red-600 active:bg-red-500 active:text-white p-1.5 rounded-sm opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-sm cursor-pointer hover:border-red-50 active:border-red-500"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                        />
                    </svg>
                </div>
            </div>
        </div>

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

                    <div
                        class="relative bg-white rounded-sm shadow-2xl w-full max-w-2xl z-[9999]"
                        @click.stop
                    >
                        <div class="absolute top-3 right-3 z-10">
                            <ButtonClose size="lg" @click="closeModal" />
                        </div>

                        <div class="aspect-square w-full flex items-center justify-center p-14">
                            <img
                                :src="displayImage"
                                :alt="`${alt} - Full View`"
                                class="max-w-full max-h-full object-contain"
                            />
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { onKeyStroke, useToggle, whenever } from '@vueuse/core'

    interface Currency {
        id: number
        code: string
        symbol: string
    }

    interface PriceData {
        currency: Currency
        type: string
        original: number
        final: number
        discount_percentage: string | number
        has_discount: boolean
    }

    interface Price {
        product_currency: PriceData
        user_currency: PriceData | null
    }

    interface Feature {
        id: number
        code: string
        name: string
    }

    interface Props {
        image?: string | null
        alt?: string
        price?: Price | undefined
        features?: Feature[]
        roundedClass?: string
    }

    const props = withDefaults(defineProps<Props>(), {
        image: null,
        alt: '',
        roundedClass: 'rounded-md',
        price: null,
        features: () => [],
    })

    const { t } = useI18n()

    const [isModalOpen, toggleModal] = useToggle(false)

    const roundedClassMap = {
        'rounded-sm': { top: 'rounded-tl-sm', bottom: 'rounded-b' },
        'rounded-md': { top: 'rounded-tl-md', bottom: 'rounded-b-sm' },
        'rounded-lg': { top: 'rounded-tl-lg', bottom: 'rounded-b-md' },
        'rounded-xl': { top: 'rounded-tl-xl', bottom: 'rounded-b-xl' },
    }

    const topRoundedClass = computed(() => {
        return roundedClassMap[props.roundedClass]?.top || 'rounded-tl-md'
    })

    const bottomRoundedClass = computed(() => {
        return roundedClassMap[props.roundedClass]?.bottom || 'rounded-b-md'
    })

    const activePrice = computed(() => {
        return props.price?.user_currency || props.price?.product_currency || null
    })

    const hasDiscount = computed(() => {
        return Boolean(activePrice.value?.has_discount) || false
    })

    const discountPercentage = computed(() => {
        if (!hasDiscount.value || !activePrice.value?.discount_percentage) return 0

        const percentage = activePrice.value.discount_percentage
        return Math.round(typeof percentage === 'string' ? parseFloat(percentage) : percentage)
    })

    const isNew = computed(() => {
        return Boolean(
            props.features?.find(
                (feature) => feature.code === 'new' || feature.name.toLowerCase() === 'new'
            )
        )
    })

    const showBadges = computed(() => {
        return hasDiscount.value || isNew.value
    })

    const displayImage = computed(() => {
        return props.image || '/images/content/no-image.svg'
    })

    const openModal = () => {
        toggleModal(true)
    }

    const closeModal = () => {
        toggleModal(false)
    }

    whenever(isModalOpen, () => {
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = ''
        }
    })

    onKeyStroke('Escape', () => {
        if (isModalOpen.value) {
            closeModal()
        }
    })
</script>

<style scoped>
    .product-image-container {
        /* aspect-ratio: 1 / 1; */
        position: relative;
        overflow: hidden;
    }
    .product-image-container:hover img {
        filter: brightness(1.05);
    }
    .discount-badge {
        @apply bg-red-50 text-red-500 px-4 py-2 rounded-br-sm text-subtitle3 font-bold whitespace-nowrap;
        /* border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
        border-buto */
    }

    .new-badge {
        @apply bg-green-400 text-white text-center py-1.5 text-subtitle3 font-bold whitespace-nowrap;
        @apply border-t border-green-400;
    }

    .modal-fade-enter-active,
    .modal-fade-leave-active {
        transition: opacity 0.3s ease;
    }

    .modal-fade-enter-from,
    .modal-fade-leave-to {
        opacity: 0;
    }

    @media (prefers-reduced-motion: reduce) {
        .product-image-container:hover {
            transform: none;
        }
    }
</style>
