<template>
    <div class="category-products-page px-4 md:px-0">
        <Breadcrumbs :items="breadcrumbs" :loading="pageWrapperRef?.state?.isLoading" />

        <PageHeader
            :title="categoryInfo?.name || t('pages.category')"
            :subtitle="
                pageWrapperRef?.data?.summary
                    ? t('countResults', { count: pageWrapperRef.data.summary.total_products })
                    : ''
            "
        >
            <template #right>
                <div class="flex items-center gap-3">
                    <div class="flex gap-2 items-center">
                        <label
                            for="dropdown-menu-sort"
                            class="hidden md:block text-body text-gray-950"
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
                            auto-sync-trigger-width
                            @select="onSortSelect"
                        />
                    </div>
                    <span class="border border-gray-600 h-6 w-px"></span>
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
                    </Button>
                </div>
            </template>
        </PageHeader>

        <PageWrapper
            v-if="categoryInfo?.id"
            ref="pageWrapperRef"
            :fetch-fn="createFetchFunction"
            :dependencies="filterDependencies"
            :empty-check="(data) => !data?.products || data.products.length === 0"
            immediate
            :meta="{
                skeleton: true,
                refreshInterval: 300000,
                maxRetries: 3,
            }"
            @success="onDataSuccess"
            @error="onDataError"
        >
            <template #skeleton>
                <div class="grid grid-cols-1 gap-0 bg-white">
                    <ProductCardSkeleton v-for="n in 10" :key="n" />
                </div>
            </template>

            <template #error="{ error }">
                <ErrorBoundary
                    :title="t('errorLoadingProducts')"
                    :subtitle="error?.message || t('errorLoadingProductsDescription')"
                    :button-label="t('tryAgain')"
                    @action="pageWrapperRef?.retry()"
                />
            </template>

            <template #empty>
                <ErrorBoundary
                    v-if="hasFiltersInUrl"
                    :title="t('filters.noProductsFound')"
                    :subtitle="t('filters.tryAdjustingFilters')"
                    :button-label="t('filters.reset')"
                    @action="handleResetFilters"
                />
                <NoDataPage v-else @action="handleResetFilters" />
            </template>

            <ProductsList
                v-if="pageWrapperRef?.data?.products?.length > 0"
                :products="pageWrapperRef.data.products"
                :meta="pageWrapperRef.data.meta"
                @page-change="handlePageChange"
                @items-per-page-change="handleItemsPerPageChange"
                @view-product="onViewProduct"
                @contact-supplier="onContactSupplier"
            />
        </PageWrapper>

        <ProductsFilterDrawer
            :is-open="showFilters"
            :filters="filters"
            :filter-options="filterOptions"
            :counts="filterCounts"
            @update:is-open="showFilters = $event"
            @apply="handleApplyFilters"
            @reset="handleResetFilters"
        />
    </div>
</template>

<script setup lang="ts">
    import { useLocalePath } from '#imports'
    import { useI18n } from 'vue-i18n'
    import type { ProductListing } from '~/types/products'
    import { TokenService } from '~/services/token'
    import { useUserStore } from '~/stores/user'
    import { storeToRefs } from 'pinia'
    import { useCatalogProducts } from '~/composables/useCategoryProducts'
    import { usePlanChangeEvents } from '~/composables/usePlanChangeEvents'

    const localePath = useLocalePath()
    const { t } = useI18n()
    const route = useRoute()
    const router = useRouter()
    const config = useRuntimeConfig()

    const userStore = useUserStore()

    const { plan } = storeToRefs(userStore)

    const pageWrapperRef = ref()
    const showFilters = ref(false)
    const categoryInfo = ref(null)
    const { planChangeKey } = usePlanChangeEvents()

    definePageMeta({
        layout: 'default',
        scrollToTop: true,
    })

    const slug = computed(() => route.params.slug as string)

    const fetchCategoryData = async (categorySlug: string) => {
        try {
            const headers = TokenService.getRequestHeaders()

            const response = await $fetch('/catalog/menu', {
                baseURL: config.public.apiBaseURL,
                headers,
                params: { root_id: categorySlug },
            })

            const categoryData = response?.data || response

            if (!categoryData) {
                throw new Error(`Category "${categorySlug}" not found`)
            }

            return categoryData
        } catch (error: any) {
            console.error('[Category] Fetch error:', error)

            const statusCode = error?.status || error?.statusCode

            if (statusCode === 422 || statusCode === 404) {
                throw createError({
                    statusCode: 404,
                    statusMessage: `Category "${categorySlug}" not found`,
                    fatal: true,
                })
            }

            throw createError({
                statusCode: statusCode || 500,
                statusMessage: error.message || `Failed to load category "${categorySlug}"`,
                fatal: true,
            })
        }
    }

    const { data: categoryData, error: categoryError } = await useAsyncData(
        `category-${slug.value}`,
        () => fetchCategoryData(slug.value),
        {
            server: true,
            lazy: false,
        }
    )

    if (categoryError.value) {
        throw createError({
            statusCode: 404,
            statusMessage: categoryError.value.message || `Category "${slug.value}" not found`,
            fatal: true,
        })
    }

    if (!categoryData.value) {
        throw createError({
            statusCode: 404,
            statusMessage: `Category "${slug.value}" not found`,
            fatal: true,
        })
    }

    categoryInfo.value = categoryData.value

    const catalogItem = computed(() => categoryInfo.value)

    const {
        filters,
        filterOptions,
        filterDependencies,
        applyFilters,
        resetFilters,
        search,
        goToPage,
        sortBy,
        parseQueryFilters,
        mergeWithCategoryFilter,
    } = useCatalogProducts({ catalogItem })

    const createFetchFunction = async () => {
        if (!categoryInfo.value?.id) {
            throw new Error('Category ID not available')
        }

        const queryFilters = parseQueryFilters()
        const filtersWithCategory = mergeWithCategoryFilter(queryFilters)

        const productsStore = useProductsStore()
        await productsStore.initializeProducts(filtersWithCategory, plan.value)

        return {
            products: productsStore.products,
            meta: productsStore.meta,
            summary: productsStore.summary,
            filterOptions: productsStore.filterOptions,
        }
    }

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

    const breadcrumbs = computed(() => {
        const items = [
            { label: t('home'), to: localePath('/marketplace') },
            { label: t('navigation.marketplace'), to: localePath('/marketplace') },
        ]

        if (categoryInfo.value?.parent) {
            items.push({
                label: categoryInfo.value.parent.name,
                to: localePath(`/marketplace/category/${categoryInfo.value.parent.slug}`),
            })
        }

        if (categoryInfo.value) {
            items.push({ label: categoryInfo.value.name, current: true })
        }

        return items
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
        // { label: t('sorting.chooseOption'), value: '', disabled: true },
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
            filterOptions.value?.categories?.map((c) => ({
                id: c.id,
                count: c.products_count || 0,
            })) || [],
    }))

    const onDataSuccess = (data: any) => {}

    const onDataError = (error: any) => {
        console.error('[Category] Failed to load products:', error)
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

    const handleResetFilters = async () => {
        const productsStore = useProductsStore()

        await router.push({
            path: route.path,
            query: {},
        })

        productsStore.resetFilters()

        const categoryFilter =
            categoryInfo.value?.depth === 0
                ? { categories: [categoryInfo.value.id] }
                : { subcategories: [categoryInfo.value.id] }

        await productsStore.initializeProducts(categoryFilter, plan.value)
    }

    const onSortSelect = async (value: string) => {
        if (!value) return
        const [sortField, sortDirection] = value.split(':')
        await sortBy(sortField as any, sortDirection as 'asc' | 'desc')
    }

    const onViewProduct = (product: ProductListing) => {
        router.push(localePath(`/marketplace/products/${product.id}`))
    }

    const onContactSupplier = (product: ProductListing) => {}

    watch(slug, async (newSlug, oldSlug) => {
        if (newSlug && newSlug !== oldSlug) {
            try {
                const newCategoryData = await fetchCategoryData(newSlug)
                categoryInfo.value = newCategoryData

                const productsStore = useProductsStore()
                productsStore.resetFilters()

                await nextTick()

                if (pageWrapperRef.value) {
                    await pageWrapperRef.value.refresh()
                }
            } catch (error: any) {
                console.error('[Category] Failed to load new category:', error)
                throw createError({
                    statusCode: 404,
                    statusMessage: error.message || `Category "${newSlug}" not found`,
                    fatal: true,
                })
            }
        }
    })

    watch(
        () => route.query.search,
        (newSearch) => {
            if (newSearch && typeof newSearch === 'string') {
                search(newSearch)
            }
        }
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
        title: () => `${categoryInfo.value?.name || t('category')} - ${t('marketplace')}`,
        description: () =>
            t('categoryDescription', {
                category: categoryInfo.value?.name || t('category'),
            }),
    })
</script>

<style scoped>
    .category-products-page {
        @apply min-h-screen;
    }
</style>
