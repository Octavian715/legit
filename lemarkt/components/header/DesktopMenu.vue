<template>
    <div ref="menuContainerRef" class="relative">
        <nav class="bg-gray-0 shadow-sm border-b border-gray-200" @mouseleave="handleNavMouseLeave">
            <div class="flex mx-4 lg:mx-6">
                <button
                    class="p-2 text-gray-950 flex items-center justify-center hover:text-red-500 active:text-red-50 active:scale-95 flex-shrink-0"
                    :disabled="!canScrollLeft"
                    :class="{
                        'opacity-50 cursor-not-allowed disabled:scale-100': !canScrollLeft,
                    }"
                    @click="scrollCategories('left')"
                >
                    <svg class="h-6 w-6 flex-shrink-0">
                        <use :xlink:href="`/sprite.svg#a_left`"></use>
                    </svg>
                </button>
                <div
                    ref="categoriesContainer"
                    class="flex-1 overflow-x-auto hide-scrollbar h-full"
                    @scroll="updateScrollState"
                >
                    <ClientOnly>
                        <div v-if="shouldShowSkeleton" class="flex items-center gap-1 py-2">
                            <div
                                v-for="n in 27"
                                :key="`skeleton-${n}`"
                                class="skeleton-shimmer w-[72px] h-[72px] lg:h-20 lg:w-20 bg-gray-200 animate-pulse rounded flex-shrink-0 mx-auto my-auto"
                            ></div>
                        </div>
                        <div v-else-if="hasCategories" class="flex items-center gap-1 py-2">
                            <div class="category-container">
                                <!-- v-tooltip="t('navigation.allProducts')" -->
                                <NuxtLink
                                    class="flex-col text-center group hover:bg-red-50 hover:text-red-500 h-[80px] w-[80px] text-gray-800 active:bg-red-500 active:text-white cursor-pointer transition-colors duration-200 rounded-sm flex-shrink-0 flex items-center justify-center gap-1 p-1"
                                    :class="{
                                        'bg-red-500 text-white': route.path === '/marketplace',
                                    }"
                                    :to="localePath('/marketplace')"
                                    @mouseenter="handleCategoryMouseEnter(undefined)"
                                    @click="handleCategoryClick"
                                >
                                    <svg
                                        width="36"
                                        height="36"
                                        viewBox="0 0 36 36"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M16.0694 9.49183V18.6714M1.04248 27.7548L8.51358 31.9761C8.53986 31.9909 8.57201 31.9909 8.5983 31.9761L16.027 27.7787C16.0533 27.7639 16.0855 27.7639 16.1117 27.7787L23.5828 32M23.5828 32L31.0525 27.7795C31.0796 27.7642 31.0963 27.7356 31.0963 27.7045V18.6793M23.5828 32V22.9245M16.0694 18.6788V27.7543M1.04248 18.6788V27.7543M8.55594 22.924V31.9995M23.5828 5.24568V14.3212M8.55594 5.24568V14.3212M16.0694 18.6779L23.5405 22.8992C23.5668 22.914 23.5989 22.914 23.6252 22.8992L30.9636 18.7529C31.0219 18.7199 31.0219 18.6359 30.9636 18.6029L23.6252 14.4566C23.5989 14.4418 23.5668 14.4418 23.5405 14.4566L16.0694 18.6779ZM16.0694 18.6779L8.59829 22.8992C8.57201 22.914 8.53986 22.914 8.51357 22.8992L1.17517 18.7529C1.11684 18.7199 1.11684 18.6359 1.17517 18.6029L8.51358 14.4566C8.53986 14.4418 8.57201 14.4418 8.5983 14.4566L16.0694 18.6779ZM8.68862 5.32019L16.027 9.46649C16.0533 9.48135 16.0855 9.48135 16.1117 9.46649L23.4502 5.32019C23.5085 5.28723 23.5085 5.2032 23.4502 5.17024L16.1117 1.02393C16.0855 1.00908 16.0533 1.00908 16.027 1.02393L8.68862 5.17024C8.63029 5.2032 8.63029 5.28723 8.68862 5.32019Z"
                                            stroke="currentColor"
                                            stroke-width="0.8"
                                            stroke-miterlimit="22.9256"
                                            class="flex-shrink-0 object-contain group-hover:scale-105 pt-2"
                                        />
                                    </svg>
                                    <span class="text-caption1 mb-auto">{{
                                        t('navigation.allProducts')
                                    }}</span>
                                </NuxtLink>
                                <!-- v-tooltip="category.name" -->
                                <div
                                    v-for="category in categories"
                                    :key="category.id"
                                    class="category-item flex-col text-center group hover:bg-red-50 hover:text-red-500 h-[80px] w-[80px] text-gray-800 active:bg-red-500 active:text-white cursor-pointer transition-colors duration-200 rounded-sm flex-shrink-0 flex items-center justify-center gap-1 p-1"
                                    :class="{
                                        'bg-red-500 text-white':
                                            activeCategory === category.id ||
                                            isActiveCategory(category),
                                    }"
                                    @click="handleCategoryClickAll(category)"
                                    @mouseenter="handleCategoryMouseEnter(category.id)"
                                >
                                    <div
                                        class="category-icon w-9 h-9 flex-shrink-0 object-contain group-hover:scale-105 transition-transform duration-200"
                                        v-html="category.icon_raw_svg"
                                    >
                                    </div>

                                    <span class="text-caption1 mb-auto">{{ category.name }}</span>
                                </div>
                            </div>
                        </div>
                        <div v-else class="flex items-center justify-center py-3 max-h-24">
                            <div class="text-center">
                                <div class="mx-auto w-6 h-6 text-red-500 mb-2">
                                    <svg class="w-full h-full">
                                        <use :xlink:href="`/sprite.svg#info`"></use>
                                    </svg>
                                </div>
                                <p class="text-subtitle3 text-gray-700 mb-1">{{
                                    t('categoriesNotAvailable')
                                }}</p>
                                <Button
                                    color="red"
                                    variant="filled"
                                    size="sm"
                                    class="mx-auto"
                                    @click="retryLoadCategories"
                                >
                                    {{ t('retry') }}
                                </Button>
                            </div>
                        </div>

                        <template #fallback>
                            <div class="flex items-center gap-1 py-2">
                                <div
                                    v-for="n in 27"
                                    :key="`skeleton-server-${n}`"
                                    class="skeleton-shimmer h-[80px] w-[80px] bg-gray-200 animate-pulse rounded flex-shrink-0 mx-auto my-auto"
                                ></div>
                            </div>
                        </template>
                    </ClientOnly>
                </div>
                <button
                    class="p-2 text-gray-950 flex items-center justify-center hover:text-red-500 active:text-red-700 active:scale-95 flex-shrink-0"
                    :disabled="!canScrollRight"
                    :class="{
                        'opacity-50 cursor-not-allowed disabled:scale-100': !canScrollRight,
                    }"
                    @click="scrollCategories('right')"
                >
                    <svg class="h-6 w-6 flex-shrink-0">
                        <use :xlink:href="`/sprite.svg#a_right`"></use>
                    </svg>
                </button>
            </div>
        </nav>

        <ClientOnly>
            <div
                v-if="!isMobile && activeFlyout"
                class="bridge-zone absolute left-0 right-0 z-40 pointer-events-auto"
                style="top: 100%; height: 12px"
                @mouseenter="handleBridgeMouseEnter"
                @mouseleave="handleBridgeMouseLeave"
            ></div>

            <Transition name="flyout">
                <div
                    v-if="activeFlyout && activeCategory !== null"
                    ref="flyoutRef"
                    class="menu-list absolute left-0 right-0 bg-white shadow-lg z-50 container mx-auto rounded-md"
                    style="top: calc(100% + 8px); max-height: calc(100vh - 200px)"
                    @mouseenter="handleFlyoutMouseEnter"
                    @mouseleave="handleFlyoutMouseLeave"
                >
                    <div class="py-0 flex" style="max-height: calc(100vh - 200px)">
                        <div class="w-1/2 lg:w-1/3 border-r border-gray-200 flex flex-col">
                            <div class="px-8 pt-3 pb-2 flex-shrink-0">
                                <h3 class="text-caption1 text-gray-600 pl-3 uppercase font-medium">
                                    {{ $t('subcategory', { count: 0 }) }}
                                </h3>
                            </div>
                            <div class="subcategory-scroll flex-1 overflow-y-auto px-8 pb-3">
                                <ul>
                                    <li
                                        v-for="subcategory in activeSubcategories"
                                        :key="subcategory.id"
                                        class="relative py-3 px-3 font-bold rounded text-subtitle2 text-gray-950 cursor-pointer transition-colors duration-150 hover:text-red-500 hover:bg-red-50 active:text-white active:bg-red-500 active:scale-95"
                                        :class="{
                                            'bg-red-50 text-red-500':
                                                activeSubcategoryId === subcategory.id,
                                        }"
                                        @mouseenter="handleSubcategoryMouseEnter(subcategory.id)"
                                    >
                                        <div
                                            class="flex items-center justify-between w-full h-full"
                                        >
                                            <NuxtLink
                                                :to="
                                                    localePath(
                                                        `/marketplace/category/${subcategory.slug}`
                                                    )
                                                "
                                                class="flex-1 break-words mr-2"
                                                @click="handleMenuItemClick"
                                            >
                                                {{ subcategory.name }}
                                            </NuxtLink>
                                            <button
                                                v-if="
                                                    subcategory.children &&
                                                    subcategory.children.length > 0
                                                "
                                                class="flex-shrink-0 p-1 hover:scale-110 transition-all duration-150"
                                                :class="{
                                                    'text-red-500':
                                                        activeSubcategoryId === subcategory.id,
                                                    'text-gray-950':
                                                        activeSubcategoryId !== subcategory.id,
                                                }"
                                                @click.stop="
                                                    handleSubcategoryClickExpand(subcategory.id)
                                                "
                                            >
                                                <svg class="h-4 w-4">
                                                    <use :xlink:href="`/sprite.svg#a_right`"></use>
                                                </svg>
                                            </button>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div class="w-1/2 lg:w-full flex flex-col">
                            <div class="items-scroll flex-1 overflow-y-auto px-5 py-6">
                                <div
                                    v-if="activeItems.length"
                                    class="columns-1 md:columns-2 lg:columns-3 xl:columns-5 gap-6"
                                >
                                    <div
                                        v-for="item in activeItems"
                                        :key="item.id"
                                        class="break-inside-avoid-column mb-6"
                                    >
                                        <template v-if="!item?.children?.length">
                                            <NuxtLink
                                                :to="
                                                    localePath(`/marketplace/category/${item.slug}`)
                                                "
                                                class="block text-gray-950 font-bold text-subtitle1 hover:text-red-500 active:text-red-700 active:scale-95 cursor-pointer transition-colors duration-150"
                                                @click="handleMenuItemClick"
                                            >
                                                {{ item.name }}
                                            </NuxtLink>
                                        </template>

                                        <div v-else class="break-inside-avoid-column">
                                            <h3 class="text-gray-950 font-bold mb-2 text-subtitle1">
                                                <NuxtLink
                                                    :to="
                                                        localePath(
                                                            `/marketplace/category/${item.slug}`
                                                        )
                                                    "
                                                    class="block hover:text-red-500 active:text-red-700 active:scale-95 cursor-pointer transition-colors duration-150"
                                                    @click="handleMenuItemClick"
                                                >
                                                    {{ item.name }}
                                                </NuxtLink>
                                            </h3>
                                            <hr class="border-t border-gray-200 mb-3" />
                                            <ul class="space-y-1 break-inside-avoid-column">
                                                <li
                                                    v-for="child in item.children"
                                                    :key="child.id"
                                                    class="text-subtitle2 hover:text-red-500 active:text-red-700 active:scale-95 cursor-pointer transition-colors duration-150 break-inside-avoid-column"
                                                >
                                                    <NuxtLink
                                                        :to="
                                                            localePath(
                                                                `/marketplace/category/${child.slug}`
                                                            )
                                                        "
                                                        class="block py-1"
                                                        @click="handleMenuItemClick"
                                                    >
                                                        {{ child.name }}
                                                    </NuxtLink>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Transition>
        </ClientOnly>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onBeforeUnmount, nextTick, onMounted, watch } from 'vue'
    import { useLocalePath } from '#imports'
    import { useStaticData } from '~/composables/useStaticData'
    import { useGlobalStore } from '@/stores/global'
    import type { CatalogNode } from '~/types/catalog'
    import { onClickOutside, useMediaQuery } from '@vueuse/core'

    const localePath = useLocalePath()
    const route = useRoute()
    const router = useRouter()
    const { t } = useI18n()
    const { categories, isLoading, isLoaded, error, refresh } = useStaticData()
    const globalStore = useGlobalStore()

    const menuContainerRef = ref<HTMLElement | null>(null)
    const flyoutRef = ref<HTMLElement | null>(null)
    const isMobile = useMediaQuery('(max-width: 1024px)')

    const activeCategory = ref<number | null>(null)
    const activeSubcategoryId = ref<number | null>(null)
    const activeFlyout = ref(false)
    const categoriesContainer = ref<HTMLElement | null>(null)
    const closeTimer = ref<number | null>(null)
    const openTimer = ref<number | null>(null)
    const subcategoriesData = ref<Map<number, CatalogNode[]>>(new Map())
    const isMouseInNav = ref(false)
    const isMouseInFlyout = ref(false)
    const isMouseInBridge = ref(false)

    const canScrollLeft = ref(false)
    const canScrollRight = ref(false)

    onClickOutside(menuContainerRef, (event) => {
        if (flyoutRef.value && flyoutRef.value.contains(event.target as Node)) {
            return
        }
        if (activeFlyout.value) {
            closeFlyout()
        }
    })

    const shouldShowSkeleton = computed(() => {
        return isLoading.value || !isLoaded.value || !categories.value
    })

    const hasCategories = computed(() => {
        return (
            isLoaded.value &&
            categories.value &&
            Array.isArray(categories.value) &&
            categories.value.length > 0
        )
    })

    const activeSubcategories = computed(() => {
        if (!activeCategory.value) return []
        const subcategories = subcategoriesData.value.get(activeCategory.value) || []
        return subcategories
    })

    const activeItems = computed(() => {
        if (!activeSubcategoryId.value) return []

        const subcategory = activeSubcategories.value.find(
            (s) => s.id === activeSubcategoryId.value
        )
        return subcategory?.children || []
    })

    const currentRouteSlug = computed(() => {
        const pathParts = route.path.split('/')
        const categoryIndex = pathParts.indexOf('category')
        if (categoryIndex !== -1 && pathParts[categoryIndex + 1]) {
            return pathParts[categoryIndex + 1]
        }
        return null
    })

    const isActiveCategory = (category: any): boolean => {
        if (!currentRouteSlug.value) return false

        if (category.slug === currentRouteSlug.value) {
            return true
        }

        const subcategories = subcategoriesData.value.get(category.id)
        if (!subcategories || subcategories.length === 0) {
            return false
        }

        const checkChildren = (nodes: CatalogNode[]): boolean => {
            for (const node of nodes) {
                if (node.slug === currentRouteSlug.value) {
                    return true
                }
                if (node.children && node.children.length > 0) {
                    if (checkChildren(node.children)) {
                        return true
                    }
                }
            }
            return false
        }

        return checkChildren(subcategories)
    }

    const updateScrollState = () => {
        if (!categoriesContainer.value) return

        const container = categoriesContainer.value
        const scrollLeft = container.scrollLeft
        const maxScrollLeft = container.scrollWidth - container.clientWidth

        canScrollLeft.value = scrollLeft > 0
        canScrollRight.value = scrollLeft < maxScrollLeft - 1
    }

    const clearAllTimers = () => {
        if (closeTimer.value) {
            clearTimeout(closeTimer.value)
            closeTimer.value = null
        }
        if (openTimer.value) {
            clearTimeout(openTimer.value)
            openTimer.value = null
        }
    }

    const openCategory = async (categoryId: number | undefined) => {
        if (categoryId === undefined) {
            closeFlyout()
            return
        }

        clearAllTimers()

        if (activeCategory.value === categoryId && activeFlyout.value) {
            return
        }

        activeCategory.value = categoryId

        if (subcategoriesData.value.has(categoryId)) {
            const subcategories = subcategoriesData.value.get(categoryId) || []

            if (subcategories.length > 0) {
                activeSubcategoryId.value = subcategories[0].id
                activeFlyout.value = true
            } else {
                activeSubcategoryId.value = null
                activeFlyout.value = false
            }
            return
        }

        try {
            await globalStore.fetchCatalogMenu(categoryId)

            const catalogData = globalStore.catalogMenu
            let subcategories: CatalogNode[] = []

            if (catalogData) {
                if (catalogData.data && catalogData.data.data) {
                    subcategories = catalogData.data.data.children || []
                } else if (catalogData.data) {
                    subcategories = catalogData.data.children || []
                } else if (Array.isArray(catalogData)) {
                    subcategories = catalogData
                } else if (catalogData.children) {
                    subcategories = catalogData.children
                }
            }

            subcategoriesData.value.set(categoryId, subcategories)

            if (subcategories.length > 0) {
                activeSubcategoryId.value = subcategories[0].id
                await nextTick()
                activeFlyout.value = true
            } else {
                activeSubcategoryId.value = null
                activeFlyout.value = false
            }
        } catch (error) {
            subcategoriesData.value.set(categoryId, [])
            activeSubcategoryId.value = null
            activeFlyout.value = false
        }
    }

    const goToCategory = (slug: string) => {
        closeFlyout()
        router.push(localePath('/marketplace/category/' + slug))
    }

    const closeFlyout = () => {
        clearAllTimers()
        activeFlyout.value = false
        activeCategory.value = null
        activeSubcategoryId.value = null
        isMouseInNav.value = false
        isMouseInFlyout.value = false
        isMouseInBridge.value = false
    }

    const scheduleClose = () => {
        clearAllTimers()
        closeTimer.value = window.setTimeout(() => {
            if (!isMouseInNav.value && !isMouseInFlyout.value && !isMouseInBridge.value) {
                closeFlyout()
            }
        }, 400)
    }

    const handleCategoryClick = () => {
        closeFlyout()
    }

    const handleCategoryClickAll = async (category: any) => {
        if (isMobile.value) {
            if (activeCategory.value === category.id && activeFlyout.value) {
                goToCategory(category.slug)
            } else {
                await openCategory(category.id)

                const hasChildren = subcategoriesData.value.get(category.id)?.length ?? 0
                if (hasChildren === 0) {
                    goToCategory(category.slug)
                }
            }
        } else {
            goToCategory(category.slug)
        }
    }

    const handleMenuItemClick = () => {
        closeFlyout()
    }

    const handleSubcategoryClickExpand = (subcategoryId: number) => {
        activeSubcategoryId.value = subcategoryId
    }

    const handleCategoryMouseEnter = (categoryId: number | undefined) => {
        if (isMobile.value) return

        isMouseInNav.value = true
        clearAllTimers()

        openTimer.value = window.setTimeout(() => {
            openCategory(categoryId)
        }, 100)
    }

    const handleNavMouseLeave = () => {
        if (isMobile.value) return

        isMouseInNav.value = false
        scheduleClose()
    }

    const handleFlyoutMouseEnter = () => {
        if (isMobile.value) return

        isMouseInFlyout.value = true
        clearAllTimers()
    }

    const handleFlyoutMouseLeave = () => {
        if (isMobile.value) return

        isMouseInFlyout.value = false
        scheduleClose()
    }

    const handleBridgeMouseEnter = () => {
        if (isMobile.value) return

        isMouseInBridge.value = true
        clearAllTimers()
    }

    const handleBridgeMouseLeave = () => {
        if (isMobile.value) return

        isMouseInBridge.value = false
        scheduleClose()
    }

    const handleSubcategoryMouseEnter = (subcategoryId: number) => {
        activeSubcategoryId.value = subcategoryId
    }

    const scrollCategories = (direction: 'left' | 'right') => {
        if (!categoriesContainer.value) return

        const containerWidth = categoriesContainer.value.clientWidth
        const scrollAmount = Math.floor(containerWidth * 0.8)
        const currentScroll = categoriesContainer.value.scrollLeft
        const maxScroll = categoriesContainer.value.scrollWidth - containerWidth

        let targetScroll = currentScroll

        if (direction === 'left') {
            if (!canScrollLeft.value) return
            targetScroll = Math.max(0, currentScroll - scrollAmount)
        } else {
            if (!canScrollRight.value) return
            targetScroll = Math.min(maxScroll, currentScroll + scrollAmount)
        }

        categoriesContainer.value.scrollTo({
            left: targetScroll,
            behavior: 'smooth',
        })

        setTimeout(() => {
            updateScrollState()
        }, 300)
    }

    const retryLoadCategories = async () => {
        try {
            await refresh()
        } catch (error) {
            return
        }
    }

    watch(
        () => route.path,
        () => {
            closeFlyout()
        }
    )

    watch(isMobile, (newVal) => {
        if (newVal) {
            closeFlyout()
        }
    })

    onMounted(() => {
        updateScrollState()

        watch(
            categories,
            () => {
                nextTick(() => {
                    updateScrollState()
                })
            },
            { immediate: true }
        )
    })

    onBeforeUnmount(() => {
        clearAllTimers()
    })
</script>

<style scoped>
    .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }

    .hide-scrollbar::-webkit-scrollbar {
        display: none;
    }

    .bridge-zone {
        background: transparent;
    }

    .menu-list {
        box-shadow:
            0px 5px 22px 4px rgba(90, 93, 101, 0.12),
            0px 12px 17px 2px rgba(90, 93, 101, 0.14);
    }

    .flyout-enter-active,
    .flyout-leave-active {
        transition:
            opacity 0.2s ease,
            transform 0.2s ease;
    }

    .flyout-enter-from {
        opacity: 0;
        transform: translateY(-10px);
    }

    .flyout-leave-to {
        opacity: 0;
        transform: translateY(-5px);
    }

    .category-container {
        display: flex;
        flex-wrap: nowrap;
        gap: 0.25rem;
    }

    .break-inside-avoid-column {
        break-inside: avoid;
        page-break-inside: avoid;
        -webkit-column-break-inside: avoid;
    }

    @media (max-height: 900px) {
        .menu-list {
            max-height: calc(100vh - 200px) !important;
        }
        .menu-list > div {
            max-height: calc(100vh - 200px) !important;
        }
    }

    @media (max-height: 700px) {
        .menu-list {
            max-height: calc(100vh - 180px) !important;
        }
        .menu-list > div {
            max-height: calc(100vh - 180px) !important;
        }
    }

    @media (max-height: 500px) {
        .menu-list {
            max-height: calc(100vh - 150px) !important;
        }
        .menu-list > div {
            max-height: calc(100vh - 150px) !important;
        }
    }

    @media (max-width: 1280px) {
        .items-scroll .grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
        }
    }

    @media (max-width: 1024px) {
        .items-scroll .grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }
    }

    @media (max-width: 768px) {
        .items-scroll .grid {
            grid-template-columns: repeat(1, minmax(0, 1fr));
        }
    }

    .category-item:hover .category-icon :deep(svg) {
        @apply scale-105;
    }
    .category-item:hover .category-icon :deep(svg path),
    .category-item:hover .category-icon :deep(svg),
    .category-item.bg-red-500 .category-icon :deep(svg path),
    .category-item.bg-red-500 .category-icon :deep(svg) {
        stroke-width: 1.2;
        transition: stroke-width 0.2s ease;
    }

    .group:hover svg path,
    .group.bg-red-500 svg path {
        stroke-width: 1.2;
        transition: stroke-width 0.2s ease;
    }
</style>
