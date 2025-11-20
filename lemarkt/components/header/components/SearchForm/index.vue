<template>
    <div>
        <Transition name="overlay">
            <div
                v-if="isActive"
                class="search-dropdown__overlay fixed inset-0 bg-white/80 z-[9999]"
                @click="resetSearchState"
            ></div>
        </Transition>

        <div ref="searchRef" class="search-dropdown relative z-[99999]">
            <div
                :class="{
                    'search-dropdown__input-wrapper': true,
                    'rounded-sm': !shouldShowResults,
                    'rounded-t-sm': shouldShowResults,
                    'search-dropdown__input-wrapper--active ': isActive,
                }"
            >
                <input
                    v-model="searchQuery"
                    type="text"
                    class="search-dropdown__input"
                    :class="{
                        'search-dropdown__input--active': isActive,
                        'search-dropdown__input--loading': isCurrentlyLoading,
                    }"
                    placeholder="Search..."
                    @focus="handleFocus"
                    @input="handleSearchInput"
                />
                <span
                    class="search-dropdown__icon absolute left-6 top-1/2 -translate-y-1/2 text-gray-800"
                >
                    <svg class="w-5 h-5">
                        <use xlink:href="/sprite.svg#search"></use>
                    </svg>
                </span>

                <ButtonClose
                    v-if="searchQuery?.length && !isCurrentlyLoading"
                    :color-type="!isActive ? '950' : undefined"
                    size="sm"
                    icon-size="md"
                    class="absolute right-6 top-1/2 -translate-y-1/2"
                    @click="handleClearClick"
                />
                <div v-if="isCurrentlyLoading" class="absolute right-6 top-1/2 -translate-y-1/2">
                    <div class="loader-btn !bg-gray-950"></div>
                </div>
            </div>

            <div
                v-if="isActive"
                ref="dropdownRef"
                class="search-dropdown__results bg-white rounded-b-sm shadow-lg"
            >
                <div class="search-dropdown__tabs">
                    <SegmentedButtons
                        :options="tabs"
                        border-radius="rounded-md"
                        :default-active="activeTab"
                        @change="handleTabChange"
                    />
                </div>

                <div
                    ref="scrollContainerRef"
                    class="search-dropdown__scroll-container"
                    :class="{ 'search-dropdown__scroll-container--scrollable': canScroll }"
                    @scroll="handleScroll"
                >
                    <div class="search-dropdown__results-list">
                        <template v-if="isCurrentlyLoading && searchQuery?.length">
                            <div class="min-h-[400px] flex flex-col justify-start gap-2">
                                <template v-if="activeTab === 'all'">
                                    <GroupedCompanyItemSkeleton
                                        v-for="i in skeletonCount"
                                        :key="`skeleton-grouped-${i}`"
                                    />
                                </template>

                                <template v-else-if="activeTab === 'products'">
                                    <ProductCardItemSkeleton
                                        v-for="i in skeletonCount"
                                        :key="`skeleton-product-${i}`"
                                        :show-supplier="true"
                                    />
                                </template>

                                <template v-else-if="activeTab === 'companies'">
                                    <SupplierCardItemSkeleton
                                        v-for="i in skeletonCount"
                                        :key="`skeleton-company-${i}`"
                                        :show-action-buttons="true"
                                    />
                                </template>
                            </div>
                        </template>

                        <template v-else-if="hasCurrentResults && !isCurrentlyLoading">
                            <template v-if="activeTab === 'all'">
                                <TransitionGroup name="list">
                                    <GroupedCompanyItem
                                        v-for="group in currentResults"
                                        :key="`group-${group.company.id}`"
                                        :group="group"
                                        @click="handleItemClick"
                                        @category-click="handleCategoryClick"
                                        @profile-click="handleProfileClick"
                                        @view-all="handleViewAllClick"
                                    />
                                </TransitionGroup>
                            </template>

                            <template v-else>
                                <TransitionGroup name="list">
                                    <component
                                        :is="componentId"
                                        v-for="item in currentResults"
                                        :key="`${activeTab}-${item.id}`"
                                        :item="item"
                                        @click="handleItemClick"
                                        @category-click="handleCategoryClick"
                                        @supplier-click="handleProfileClick"
                                    />
                                </TransitionGroup>
                            </template>
                        </template>

                        <template
                            v-else-if="
                                !hasCurrentResults && !isCurrentlyLoading && searchQuery?.length
                            "
                        >
                            <div
                                class="flex flex-col justify-center items-center rounded-sm text-gray-500 gap-1 py-5 bg-gray-200"
                            >
                                <img
                                    src="/images/content/no-found-products.svg"
                                    width="120"
                                    height="20"
                                    loading="lazy"
                                />
                                <p class="text-title2 text-gray-950 font-bold">
                                    {{ $t('noResults', 'No results found') }}
                                </p>
                                <p class="text-gray-800 text-subtitle2 pb-4">
                                    {{ $t('checkYourRequest', 'Check your request and try again') }}
                                </p>
                            </div>
                        </template>

                        <div v-if="currentError" class="p-4 text-center text-red-500">
                            {{ currentError }}
                        </div>
                    </div>

                    <div
                        v-if="canScroll && !isAtBottom"
                        class="search-dropdown__fade-gradient"
                    ></div>
                </div>
                <Button
                    v-if="hasCurrentResults"
                    type="button"
                    color="blue"
                    size="md"
                    variant="filled"
                    class="mx-auto my-3"
                    @click="handleSeeMoreResults"
                >
                    {{ t('search.seeAllResults') }}
                </Button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
    import { useSearchStore } from '~/stores/search'
    import { useModalStore } from '~/stores/modal'
    import { useLocalePath } from '#imports'
    import ProductCardItem from './items/ProductCardItem.vue'
    import SupplierCardItem from './items/SupplierCardItem.vue'
    import GroupedCompanyItem from './items/GroupedCompanyItem.vue'

    interface TabInterface {
        value: string
        label: string
        active: boolean
    }

    const props = defineProps({
        activeTab: {
            type: String,
            required: false,
            default: 'products',
        },
    })

    const emit = defineEmits<{
        'select-item': [item: any]
    }>()

    const { t } = useI18n()
    const localePath = useLocalePath()
    const router = useRouter()
    const route = useRoute()
    const modalStore = useModalStore()

    const searchStore = useSearchStore()

    const productResults = computed(() => searchStore.quickSearchProducts)
    const groupedResults = computed(() => searchStore.quickSearchGroupedResults)
    const companyResults = computed(() => searchStore.quickSearchCompanies)
    const searchLoading = computed(() => searchStore.isLoadingQuickSearch)

    const isCurrentlyLoading = computed(() => searchLoading.value)
    const skeletonCount = 6

    const tabs = ref<TabInterface[]>([
        // { value: 'all', label: t('all', 'All'), active: true },
        { value: 'products', label: t('products', 1, 'Products'), active: true },
        { value: 'companies', label: t('company.title', 0), active: true },
    ])
    const searchRef = ref<HTMLElement | null>(null)
    const dropdownRef = ref<HTMLElement | null>(null)
    const scrollContainerRef = ref<HTMLElement | null>(null)

    const searchQuery = ref('')
    const activeTab = ref(props.activeTab || 'products')
    const isActive = ref(false)
    const canScroll = ref(false)
    const isAtBottom = ref(false)
    const debounceTimer = ref<NodeJS.Timeout | null>(null)
    const clearDebounceTimer = ref<NodeJS.Timeout | null>(null)

    const currentResults = computed(() => {
        switch (activeTab.value) {
            case 'all':
                return groupedResults.value
            case 'products':
                const items = productResults.value

                const transformedProducts = computed(() => {
                    if (!items) return []

                    return items.map((product) => {
                        const { transformedProduct } = useSearchProduct(product)
                        return transformedProduct.value
                    })
                })

                return transformedProducts.value
                return
            case 'companies':
                return companyResults.value
            default:
                return []
        }
    })

    const hasCurrentResults = computed(() => {
        return currentResults.value.length > 0
    })

    const currentError = computed(() => {
        return null
    })

    const shouldShowResults = computed(() => {
        return (
            searchQuery.value?.length > 0 &&
            (isCurrentlyLoading.value || hasCurrentResults.value || currentError.value)
        )
    })

    const componentId = computed(() => {
        switch (activeTab.value) {
            case 'products':
                return ProductCardItem
            case 'companies':
                return SupplierCardItem
            default:
                return null
        }
    })

    const checkScrollable = () => {
        nextTick(() => {
            if (scrollContainerRef.value) {
                const { scrollHeight, clientHeight } = scrollContainerRef.value
                canScroll.value = scrollHeight > clientHeight
            }
        })
    }

    const handleScroll = () => {
        if (!scrollContainerRef.value) return

        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.value
        const scrollThreshold = 50
        isAtBottom.value = scrollHeight - scrollTop - clientHeight < scrollThreshold
    }

    const handleFocus = () => {
        isActive.value = true
        if (searchQuery.value?.length > 0) {
            performSearch()
        }
    }

    const handleSearchInput = () => {
        if (debounceTimer.value) {
            clearTimeout(debounceTimer.value)
        }

        if (!searchQuery.value?.trim()) {
            searchStore.clearQuickSearch()
            return
        }

        debounceTimer.value = setTimeout(() => {
            performSearch()
        }, 300)
    }

    const performSearch = async () => {
        if (!searchQuery.value?.trim()) {
            searchStore.clearQuickSearch()
            return
        }

        try {
            const query = searchQuery.value.trim()

            switch (activeTab.value) {
                case 'all':
                    await searchStore.quickSearchGroupedAction(query)
                    break
                case 'products':
                    await searchStore.quickSearchProductsAction(query)
                    break
                case 'companies':
                    await searchStore.quickSearchCompaniesAction(query)
                    break
            }
        } catch (error) {
            console.error('Quick search error:', error)
        }
    }

    const handleClearClick = () => {
        clearSearchQuery()
    }

    const handleClickOutside = (event: MouseEvent) => {
        if (
            searchRef.value &&
            !searchRef.value.contains(event.target as Node) &&
            !modalStore.isOpen
        ) {
            resetSearchState()
        }
    }

    const clearSearchQuery = () => {
        searchQuery.value = ''
        searchStore.clearQuickSearch()
        resetSearchState()
    }

    const resetSearchState = () => {
        isActive.value = false
        searchStore.clearQuickSearch()
    }

    const handleTabChange = async (newTab: string) => {
        activeTab.value = newTab
        await performSearch()
        checkScrollable()
    }

    const handleCategoryClick = (categorySlug: string) => {
        const categoryPath = localePath(`/marketplace/category/${categorySlug}`)
        router.push(categoryPath)
        resetSearchState()
    }

    const handleProfileClick = (companyUsername: string) => {
        const profilePath = localePath(`/profile/${companyUsername}`)
        router.push(profilePath)
        resetSearchState()
    }

    const handleViewAllClick = (companyUsername: string) => {
        const profilePath = localePath(`/profile/${companyUsername}`)
        router.push({
            path: profilePath,
            query: { tab: 'products' },
        })
        resetSearchState()
    }

    const handleItemClick = (item: any) => {
        const originalItem = item.originalProduct || item.originalCompany || item
        emit('select-item', originalItem)

        let targetPath = ''

        if (originalItem.id && originalItem.name_original) {
            targetPath = localePath(`/marketplace/product/${originalItem.id}`)
        } else if (originalItem.username) {
            targetPath = localePath(`/profile/${originalItem.username}`)
        }

        if (targetPath) {
            router.push(targetPath)
        }

        resetSearchState()
    }

    const handleSeeMoreResults = () => {
        const searchPath = localePath(`/search/${activeTab.value}`)
        router.push({
            path: searchPath,
            query: {
                q: searchQuery.value,
            },
        })
        resetSearchState()
    }

    onMounted(() => {
        document.addEventListener('click', handleClickOutside)
    })

    onUnmounted(() => {
        document.removeEventListener('click', handleClickOutside)
        if (debounceTimer.value) {
            clearTimeout(debounceTimer.value)
        }
        if (clearDebounceTimer.value) {
            clearTimeout(clearDebounceTimer.value)
        }
    })

    watch(
        () => props.activeTab,
        (newTab) => {
            if (newTab) {
                activeTab.value = newTab
            }
        }
    )

    watch(
        () => route.path,
        (newPath) => {
            if (newPath && !newPath.includes('/search/')) {
                searchQuery.value = ''
            }
        },
        { immediate: true }
    )

    watch(
        () => searchQuery.value,
        (newValue) => {
            if (newValue.length === 0) {
                if (clearDebounceTimer.value) {
                    clearTimeout(clearDebounceTimer.value)
                }
                clearDebounceTimer.value = setTimeout(() => {
                    searchStore.clearQuickSearch()
                }, 100)
            }
        }
    )

    watch(
        () => currentResults.value,
        () => {
            checkScrollable()
        },
        { deep: true }
    )
</script>

<style>
    .search-dropdown {
        @apply relative;
    }

    .search-dropdown__input-wrapper {
        @apply relative w-full p-2 bg-transparent border border-transparent bg-white;
    }

    .search-dropdown__input-wrapper--active {
        @apply border-b-transparent;
        box-shadow:
            0px 5px 22px 4px rgba(90, 93, 101, 0.12),
            0px 12px 17px 2px rgba(90, 93, 101, 0.14);
    }

    .search-dropdown__input {
        @apply w-full text-subtitle2 outline-none border border-transparent text-gray-950 rounded-sm px-3 py-3 bg-gray-100 border-b-transparent focus:border-gray-800 focus:border-b-transparent transition-all duration-200;
        padding-left: 44px;
    }

    .search-dropdown__input::placeholder {
        @apply text-gray-600;
    }

    .search-dropdown__input:focus {
        @apply outline-none bg-gray-200 border-gray-800;
    }

    .search-dropdown__input:hover {
        @apply bg-gray-300;
    }

    .search-dropdown__input:hover::placeholder {
        @apply text-gray-800;
    }

    .search-dropdown__input:focus + .search-dropdown__icon {
        @apply text-gray-950;
    }

    .search-dropdown__input:hover + .search-dropdown__icon {
        @apply text-gray-950;
    }

    .search-dropdown__input--active {
        @apply border-gray-800;
    }

    .search-dropdown__results {
        @apply absolute overflow-hidden w-full -mt-px pb-2;
        max-height: 60vh;
    }

    .search-dropdown__scroll-container {
        @apply relative;
        max-height: calc(60vh - 120px);
        overflow-y: auto;
    }

    .search-dropdown__fade-gradient {
        @apply sticky bottom-0 left-0 right-0 h-8 pointer-events-none;
        background: linear-gradient(
            to bottom,
            transparent 0%,
            rgba(255, 255, 255, 0.8) 70%,
            rgba(255, 255, 255, 1) 100%
        );
    }

    .search-dropdown__results-list {
        @apply px-2 space-y-2;
    }

    .search-dropdown__tabs {
        @apply w-full flex-shrink-0;
    }

    .search-dropdown__tabs .segment-wrapper {
        @apply py-2 pt-1 m-auto w-full min-w-full px-2;
    }

    .overlay-enter-active,
    .overlay-leave-active {
        transition:
            opacity 0.2s ease-in-out,
            backdrop-filter 0.2s ease-in-out;
    }

    .overlay-enter-from,
    .overlay-leave-to {
        opacity: 0;
    }

    .overlay-enter-to,
    .overlay-leave-from {
        opacity: 1;
    }

    .list-enter-active,
    .list-leave-active {
        transition: all 0.3s ease;
    }

    .list-enter-from {
        opacity: 0;
        transform: translateY(-10px);
    }

    .list-leave-to {
        opacity: 0;
        transform: translateY(10px);
    }

    .list-move {
        transition: transform 0.3s ease;
    }
</style>
