<template>
    <ClientOnly>
        <Teleport to="body">
            <div v-if="shouldShowWidget" class="fixed bottom-6 right-6 z-[2]">
                <Transition name="overlay-fade">
                    <div
                        v-if="isExpanded && isMobileView"
                        class="fixed inset-0 bg-white/80 z-[50]"
                        @click="closeCart"
                    ></div>
                </Transition>

                <div class="relative flex flex-col items-end gap-3 z-[60]">
                    <Transition name="dropdown-slide">
                        <div v-if="isExpanded" class="w-full max-w-sm">
                            <CartDropdown
                                :in-widget="true"
                                :is-auto-opened="isAutoOpened"
                                @close="closeCart"
                                @checkout="handleCheckout"
                            />
                        </div>
                    </Transition>

                    <div
                        class="relative bg-white rounded-md w-16 shadow-lg"
                        style="
                            box-shadow:
                                0 9px 46px 8px rgba(90, 93, 101, 0.12),
                                0 24px 38px 3px rgba(90, 93, 101, 0.14);
                        "
                    >
                        <Transition name="badge-scale">
                            <span
                                v-if="cartBadgeCount && !isExpanded"
                                class="absolute z-[60] -top-2 -right-2 flex justify-center items-center min-w-6 h-6 bg-red-500 text-white text-subtitle4 font-bold rounded-full px-1"
                            >
                                {{ cartBadgeCount }}
                            </span>
                        </Transition>

                        <button
                            v-if="hasCartAccess"
                            class="group relative w-full flex flex-col gap-1 items-center justify-center border-none cursor-pointer py-2.5 px-5 pt-5 transition-all duration-200 hover:bg-red-50 hover:text-red-500"
                            :class="{
                                'border-b border-gray-400 hover:rounded-t-md': showScrollTop,
                                'hover:rounded-md': !showScrollTop,
                                'cart-button-pulse': isAutoOpened,
                            }"
                            :aria-label="$t('cart.toggleCart')"
                            :aria-expanded="isExpanded"
                            @click="toggleCart"
                        >
                            <div class="flex items-center justify-center">
                                <svg class="w-6 h-6" aria-hidden="true">
                                    <use xlink:href="/sprite.svg#shopping-cart"></use>
                                </svg>
                            </div>
                            <span
                                class="text-gray-800 group-hover:text-red-500 text-subtitle4 font-medium"
                            >
                                {{ $t('cart.title') }}
                            </span>
                        </button>

                        <div v-if="showScrollTop" class="h-px bg-gray-400 mx-1"></div>

                        <Transition name="scroll-section">
                            <button
                                v-show="showScrollTop"
                                class="group w-full flex flex-col items-center justify-center gap-1.5 py-3 px-4 text-gray-950 transition-all duration-200 cursor-pointer border-none bg-transparent hover:text-red-500 hover:bg-red-50 hover:rounded-b-md"
                                :aria-label="$t('up')"
                                @click="scrollToTop"
                            >
                                <svg class="w-6 h-6 rotate-90" aria-hidden="true">
                                    <use xlink:href="/sprite.svg#arrow2"></use>
                                </svg>
                                <span
                                    class="text-gray-800 group-hover:text-red-500 text-subtitle4 font-medium"
                                >
                                    {{ $t('up') }}
                                </span>
                            </button>
                        </Transition>
                    </div>
                </div>
            </div>
        </Teleport>
    </ClientOnly>
</template>

<script setup lang="ts">
    const cartStore = useCartStore()
    const { cartBadgeCount, hasCartAccess, itemJustAdded } = useCart()
    const router = useRouter()
    const route = useRoute()

    const isExpanded = ref(false)
    const isMounted = ref(false)
    const showBadge = ref(false)
    const autoCloseTimer = ref<NodeJS.Timeout | null>(null)
    const showScrollTop = ref(false)
    const scrollContainer = ref<HTMLElement | null>(null)
    const isMobileView = ref(false)
    const isAutoOpened = ref(false)
    const previousCartCount = ref(0)

    const isInChatRoute = computed(() => {
        return route.path.includes('chat')
    })

    const shouldShowWidget = computed(() => {
        return isMounted.value && !isInChatRoute.value
    })

    const checkMobileView = () => {
        if (process.client) {
            isMobileView.value = window.innerWidth < 640
        }
    }

    const handleScroll = () => {
        if (!scrollContainer.value) return

        const scrollY = scrollContainer.value.scrollTop
        showScrollTop.value = scrollY > 300
    }

    const findScrollContainer = () => {
        if (!process.client) return null

        const container = document.querySelector('.layout__content')
        return container as HTMLElement | null
    }

    const toggleCart = async () => {
        isExpanded.value = !isExpanded.value
        isAutoOpened.value = false

        if (isExpanded.value) {
            try {
                if (!cartStore.isHydrated) {
                    await cartStore.fetchSummary()
                }
                await nextTick()

                if (isMobileView.value && process.client) {
                    document.body.style.overflow = 'hidden'
                }
            } catch (error) {
                console.error('Failed to fetch summary:', error)
            }
        } else {
            if (isMobileView.value && process.client) {
                document.body.style.overflow = ''
            }
        }
    }

    const autoExpandCart = async () => {
        if (isExpanded.value) {
            // If already expanded, just refresh and reset timer
            if (autoCloseTimer.value) {
                clearTimeout(autoCloseTimer.value)
            }
        } else {
            // Open the dropdown
            isExpanded.value = true
            isAutoOpened.value = true

            try {
                if (!cartStore.isHydrated) {
                    await cartStore.fetchSummary()
                }
                await nextTick()

                if (isMobileView.value && process.client) {
                    document.body.style.overflow = 'hidden'
                }
            } catch (error) {
                console.error('Failed to fetch summary:', error)
            }
        }

        // Set auto-close timer (3 seconds)
        autoCloseTimer.value = setTimeout(() => {
            closeCart()
        }, 3000)
    }

    const closeCart = () => {
        if (autoCloseTimer.value) {
            clearTimeout(autoCloseTimer.value)
            autoCloseTimer.value = null
        }
        isExpanded.value = false
        isAutoOpened.value = false

        if (isMobileView.value && process.client) {
            document.body.style.overflow = ''
        }
    }

    const handleCheckout = () => {
        closeCart()
        router.push('/cart')
    }

    const scrollToTop = () => {
        if (!scrollContainer.value) return

        scrollContainer.value.scrollTo({
            top: 0,
            behavior: 'smooth',
        })
    }

    const { escape } = useMagicKeys()

    whenever(escape, () => {
        if (isExpanded.value) {
            closeCart()
        }
    })

    onMounted(async () => {
        isMounted.value = true
        await nextTick()
        showBadge.value = true

        // Initialize previous cart count
        previousCartCount.value = cartStore.totalItemsCount

        if (process.client) {
            checkMobileView()
            window.addEventListener('resize', checkMobileView, { passive: true })

            await nextTick()

            scrollContainer.value = findScrollContainer()

            if (scrollContainer.value) {
                scrollContainer.value.addEventListener('scroll', handleScroll, { passive: true })
                handleScroll()
            }
        }
    })

    onBeforeUnmount(() => {
        if (autoCloseTimer.value) {
            clearTimeout(autoCloseTimer.value)
        }

        if (scrollContainer.value) {
            scrollContainer.value.removeEventListener('scroll', handleScroll)
        }

        if (process.client) {
            window.removeEventListener('resize', checkMobileView)
            document.body.style.overflow = ''
        }
    })

    watch(
        () => router.currentRoute.value.path,
        () => {
            closeCart()
        }
    )

    // Watch for cart count changes to auto-expand dropdown
    watch(
        () => cartStore.totalItemsCount,
        (newCount, oldCount) => {
            // Only auto-expand if:
            // 1. Count increased (item was added)
            // 2. Not the initial load (oldCount is defined)
            // 3. User has cart access
            if (newCount > oldCount && oldCount !== undefined && hasCartAccess.value) {
                autoExpandCart()
            }
            previousCartCount.value = newCount
        }
    )
</script>

<style scoped>
    .badge-scale-enter-active,
    .badge-scale-leave-active {
        transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .badge-scale-enter-from,
    .badge-scale-leave-to {
        opacity: 0;
        transform: scale(0);
    }

    .overlay-fade-enter-active,
    .overlay-fade-leave-active {
        transition: opacity 0.3s ease;
    }

    .overlay-fade-enter-from,
    .overlay-fade-leave-to {
        opacity: 0;
    }

    .dropdown-slide-enter-active,
    .dropdown-slide-leave-active {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .dropdown-slide-enter-from,
    .dropdown-slide-leave-to {
        opacity: 0;
        transform: translateY(20px);
    }

    .scroll-section-enter-active,
    .scroll-section-leave-active {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .scroll-section-enter-from,
    .scroll-section-leave-to {
        max-height: 0;
        opacity: 0;
        padding-top: 0;
        padding-bottom: 0;
    }

    .scroll-section-enter-to,
    .scroll-section-leave-from {
        max-height: 450px;
        opacity: 1;
    }

    .cart-button-pulse {
        animation: button-pulse 0.6s cubic-bezier(0.4, 0, 0.6, 1);
    }

    @keyframes button-pulse {
        0%,
        100% {
            box-shadow:
                0 9px 46px 8px rgba(90, 93, 101, 0.12),
                0 24px 38px 3px rgba(90, 93, 101, 0.14);
        }
        50% {
            box-shadow:
                0 9px 46px 8px rgba(255, 0, 0, 0.25),
                0 24px 38px 3px rgba(255, 0, 0, 0.3),
                0 0 0 4px rgba(255, 0, 0, 0.2);
        }
    }
</style>
