<template>
    <div class="marketplace-page px-4 md:px-0">
        <Breadcrumbs :items="breadcrumbs" />

        <PageHeader :title="t('navigation.allProducts')" :subtitle="displaySubtitle">
            <template #right>
                <div class="flex items-center gap-3">
                    <div class="flex flex-col gap-2 items-center">
                        <div class="flex gap-2 items-center">
                            <label
                                for="dropdown-menu-sort"
                                class="hidden md:flex text-body text-gray-950"
                            >
                                {{ t('sortBy') }}
                            </label>
                            <Dropdown
                                id="sort"
                                :items="sortOptions"
                                :label="currentSortLabel"
                                trigger="click"
                                size="sm"
                                menu-alignment="right"
                                class="hidden md:block"
                                @select="onSortSelect"
                            />
                            <span class="md:w-px h-6 mx-1 bg-gray-600"></span>
                            <Button
                                variant="ghost"
                                color="gray"
                                size="lg"
                                square
                                container-classes="!p-1"
                                :class="{ relative: hasFiltersInUrl }"
                                @click="showFilters = true"
                            >
                                <svg class="w-4 h-4 flex-1">
                                    <use xlink:href="/sprite.svg#filter" />
                                </svg>
                                <!-- <span
                                    v-if="activeFiltersCount > 0"
                                    class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                                >
                                    {{ activeFiltersCount }}
                                </span> -->
                                <span
                                    v-if="hasActiveFilters"
                                    class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"
                                    aria-label="Active filters"
                                ></span>
                            </Button>
                        </div>
                    </div>
                </div>
            </template>
            <div class="flex justify-end gap-2 md:hidden">
                <div class="flex gap-2 items-center">
                    <label for="dropdown-menu-sort" class="text-body text-gray-950">
                        {{ t('sortBy') }}
                    </label>
                    <Dropdown
                        id="sort"
                        :items="sortOptions"
                        :label="currentSortLabel"
                        trigger="click"
                        size="sm"
                        menu-alignment="right"
                        auto-sync-trigger-width
                        @select="onSortSelect"
                    />
                </div>
            </div>
        </PageHeader>

        <PageWrapper
            ref="pageWrapperRef"
            :fetch-fn="fetchFunction()"
            :dependencies="filterDependencies"
            :empty-check="(data) => !data?.products || data.products.length === 0"
            :meta="{
                skeleton: true,
                refreshInterval: 300000,
                maxRetries: 3,
            }"
            immediate
            @success="onDataSuccess"
            @error="onDataError"
        >
            <template #skeleton>
                <div class="grid grid-cols-1 gap-0 bg-white">
                    <ProductCardSkeleton v-for="n in 10" :key="n" />
                </div>
            </template>

            <template #error>
                <div class="flex flex-col items-center justify-center min-h-[400px] py-16 bg-white">
                    <NuxtImg
                        src="/images/content/error-products.svg"
                        width="160px"
                        height="160px"
                        class="mb-6"
                        loading="lazy"
                    />
                    <h3 class="text-lg font-medium text-gray-900 mb-2 text-center">
                        {{ t('errorLoadingProducts') }}
                    </h3>
                    <p class="text-gray-500 mb-6 text-center max-w-md">
                        {{
                            pageWrapperRef?.state?.error?.message ||
                            t('errorLoadingProductsDescription')
                        }}
                    </p>
                    <Button
                        :label="t('tryAgain')"
                        variant="filled"
                        color="blue"
                        size="lg"
                        @click="pageWrapperRef?.retry()"
                    />
                </div>
            </template>

            <template #empty>
                <ErrorBoundary v-if="hasFiltersInUrl" @action="resetFilters" />
                <NoDataPage
                    v-else
                    :title="t('marketplace.empty.title')"
                    :description="t('marketplace.empty.description')"
                    :button-label="t('marketplace.empty.buttonAction')"
                    image="/images/content/empty-products.svg"
                    image-height="300px"
                    image-width="350px"
                    @action="router.push(localePath('/marketplace'))"
                />
            </template>

            <ProductsList
                v-if="pageWrapperRef?.data?.products?.length > 0"
                :products="pageWrapperRef.data.products"
                :meta="pageWrapperRef.data.meta"
                use-module="products"
                @page-change="handlePageChange"
                @items-per-page-change="handleItemsPerPageChange"
                @view-product="onViewProduct"
                @contact-supplier="onContactSupplier"
            />
        </PageWrapper>

        <ClientOnly>
            <ProductsFilterDrawer
                :is-open="showFilters"
                :filters="filters"
                :filter-options="filterOptions"
                :counts="filterCounts"
                @update:is-open="showFilters = $event"
                @apply="handleApplyFilters"
                @reset="resetFilters"
            />
        </ClientOnly>
    </div>
</template>

<script setup lang="ts">
    import type { ProductListing } from '~/types/products'
    import { usePlanChangeEvents } from '~/composables/usePlanChangeEvents'

    const localePath = useLocalePath()
    const { t } = useI18n()
    const route = useRoute()
    const router = useRouter()

    const pageWrapperRef = ref()
    const showFilters = ref(false)

    definePageMeta({
        layout: 'default',
    })

    const userStore = useUserStore()
    const cartStore = useCartStore()
    const productsStore = useProductsStore()

    const {
        filters,
        filterOptions,
        filterDependencies,
        fetchFunction,
        applyFilters,
        resetFilters,
        search,
        goToPage,
        sortBy,
        activeFiltersCount,
    } = useProducts()
    const { planChangeKey } = usePlanChangeEvents()

    const isLiteSupplier = computed(() => userStore?.currentPlan?.plan?.code === 'supplier-lite')
    if (
        userStore.isAuthenticated &&
        userStore.isRegistrationComplete &&
        userStore.isVerified &&
        !isLiteSupplier
    ) {
        await callOnce('cart-init', () => cartStore.ensureInitialized())
    }

    const breadcrumbs = computed(() => [
        { label: t('home'), to: localePath('/marketplace') },
        { label: t('navigation.marketplace'), to: localePath('/marketplace'), current: true },
    ])

    const displaySubtitle = computed(() => {
        const totalProducts =
            pageWrapperRef.value?.data?.summary?.total_products ||
            productsStore.summary?.total_products ||
            0

        return totalProducts > 0 ? t('countResults', { count: totalProducts }) : ''
    })

    const hasFiltersInUrl = computed(() => {
        const query = route.query
        const filterKeys = [
            'price_min',
            'price_max',
            'rating',
            'brands',
            'supplier_countries',
            'features',
            'additional_features',
            'conditions',
            'allergens',
            'has_discount',
            'private_label_available',
            'search',
        ]

        return filterKeys.some((key) => query[key] !== undefined && query[key] !== '')
    })

    const currentSort = computed(() => {
        const sortByValue = filters.value?.sort_by || 'created_at'
        const sortDirection = filters.value?.sort_direction || 'desc'
        return `${sortByValue}:${sortDirection}`
    })

    const currentSortLabel = computed(() => {
        const currentOption = sortOptions.value.find((option) => option.value === currentSort.value)
        return currentOption?.label || t('sorting.newest')
    })

    const sortOptions = computed(() => [
        // { label: t('sorting.chooseOption'), value: '', disabled: false },
        { label: t('sorting.newest'), value: 'created_at:desc', disabled: false },
        { label: t('sorting.oldest'), value: 'created_at:asc', disabled: false },
        { label: t('sorting.highPrice'), value: 'price:desc', disabled: false },
        { label: t('sorting.lowPrice'), value: 'price:asc', disabled: false },
        // { label: t('sorting.byReviews'), value: 'rating:desc', disabled: false },
        { label: t('sorting.byAlphabetAZ'), value: 'name:asc', disabled: false },
        { label: t('sorting.byAlphabetZA'), value: 'name:desc', disabled: false },
    ])

    const filterCounts = computed(() => ({
        categories:
            filterOptions.value?.categories?.map((c: any) => ({
                id: c.id,
                count: c.products_count || 0,
            })) || [],
    }))

    const onDataSuccess = (data: any) => {}

    const onDataError = (error: any) => {
        console.error('Failed to load products:', error)
    }

    const handlePageChange = async (page: number) => {
        await goToPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleItemsPerPageChange = async (itemsPerPage: number) => {
        await applyFilters({ per_page: itemsPerPage, page: 1 })
    }

    const handleApplyFilters = async (newFilters: any) => {
        await applyFilters(newFilters)
        showFilters.value = false
    }

    const hasActiveFilters = computed(() => {
        return activeFiltersCount.value > 0 || hasFiltersInUrl.value
    })
    const onSortSelect = async (value: string) => {
        if (!value) return
        const [sortField, sortDirection] = value.split(':')
        await sortBy(sortField as any, sortDirection as 'asc' | 'desc')
    }

    const onViewProduct = (product: ProductListing) => {
        router.push(localePath(`/products/${product.id}`))
    }

    const onContactSupplier = (product: ProductListing) => {}

    watch(
        () => route.query.search,
        (newSearch) => {
            if (newSearch && typeof newSearch === 'string') {
                search(newSearch)
            }
        },
        { immediate: true }
    )

    watch(
        () => planChangeKey.value,
        async (newValue, oldValue) => {
            if (oldValue === 0 && newValue === 0) return
            // Re-fetch via PageWrapper
            if (pageWrapperRef.value?.refresh) {
                await pageWrapperRef.value?.refresh()
                await nextTick()
            } else {
                console.warn('[Marketplace] pageWrapperRef.value.refresh not available')
            }
        }
    )

    useSeoMeta({
        title: () => t('navigation.marketplace'),
        description: () => t('marketplace.description'),
    })
</script>

<style scoped>
    .marketplace-page {
        @apply pb-20;
    }
</style>
