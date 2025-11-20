<template>
    <div class="favorites-page">
        <Breadcrumbs :items="breadcrumbs" />

        <PageHeader
            :title="t('navigation.favorites')"
            :subtitle="
                favoriteProducts.length > 0
                    ? t('countResults', { count: favoriteProducts.length })
                    : ''
            "
            :loading="isLoading"
        >
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
                                auto-sync-trigger-width
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
                                :class="{ relative: hasFiltersApplied }"
                                @click="showFilters = true"
                            >
                                <svg class="w-4 h-4 flex-1">
                                    <use xlink:href="/sprite.svg#filter" />
                                </svg>
                                <span
                                    v-if="hasFiltersApplied"
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

        <!-- Loading State -->
        <div v-if="isLoading" class="grid grid-cols-1 gap-0 bg-white">
            <ProductCardSkeleton v-for="n in 5" :key="n" />
        </div>

        <ErrorBoundary v-else-if="error" @action="refreshFavorites" />

        <!-- Empty State -->
        <div
            v-else-if="favoriteProducts.length === 0"
            class="flex flex-col items-center justify-center min-h-[400px] py-16 bg-white"
        >
            <img
                src="/images/content/empty-favorites.svg"
                width="200"
                height="200"
                class="mb-6"
                loading="lazy"
                alt="Empty favorites"
            />
            <h3 class="text-lg font-medium text-gray-900 mb-3 text-center">
                {{
                    hasFiltersApplied
                        ? t('favorites.empty.noResultsTitle')
                        : t('favorites.empty.title')
                }}
            </h3>
            <p class="text-gray-500 mb-6 text-center max-w-md">
                {{
                    hasFiltersApplied
                        ? t('favorites.empty.noResultsDescription')
                        : t('favorites.empty.description')
                }}
            </p>
            <Button
                :label="
                    hasFiltersApplied ? t('filters.reset') : t('favorites.empty.browseProducts')
                "
                variant="filled"
                color="blue"
                size="lg"
                @click="hasFiltersApplied ? resetFilters() : goToMarketplace()"
            />
        </div>

        <!-- Products List -->
        <div v-else class="favorites-content">
            <ProductsList
                :products="paginatedProducts"
                :meta="paginationMeta"
                use-module="favorites"
                @page-change="handlePageChange"
                @items-per-page-change="handleItemsPerPageChange"
                @view-product="onViewProduct"
                @contact-supplier="onContactSupplier"
            />
        </div>

        <!-- Filter Drawer -->
        <ClientOnly>
            <ProductsFilterDrawer
                :is-open="showFilters"
                :filters="currentFilters"
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
    import { useLocalePath } from '#imports'
    import { useI18n } from 'vue-i18n'
    import type { ProductListing } from '~/types/products'
    import { usePlanChangeEvents } from '~/composables/usePlanChangeEvents'

    const localePath = useLocalePath()
    const { t } = useI18n()
    const router = useRouter()
    const route = useRoute()

    definePageMeta({
        layout: 'default',
        scrollToTop: true,
    })

    // Store
    const favoriteStore = useFavoriteStore()
    const { planChangeKey } = usePlanChangeEvents()

    // Store state
    const isLoading = computed(() => favoriteStore.isLoading)
    const error = computed(() => favoriteStore.error)
    const favorites = computed(() => favoriteStore.favorites)
    const filterOptions = computed(() => favoriteStore.filterOptions)
    const isLoadingFilterOptions = computed(() => favoriteStore.isLoadingFilterOptions)

    // UI state
    const showFilters = ref(false)
    const currentFilters = ref({})

    // Pagination and sorting
    const currentSort = ref('created_at:desc')
    const currentPage = ref(1)
    const itemsPerPage = ref(10)

    // Parse initial filters from URL query params
    const parseFiltersFromQuery = () => {
        const query = route.query
        const filters: any = {}

        if (query.search) filters.search = query.search

        if (query.categories) {
            filters.categories = Array.isArray(query.categories)
                ? query.categories.map(Number)
                : [Number(query.categories)]
        }

        if (query.subcategories) {
            filters.subcategories = Array.isArray(query.subcategories)
                ? query.subcategories.map(Number)
                : [Number(query.subcategories)]
        }

        if (query.price_min) filters.price_min = Number(query.price_min)
        if (query.price_max) filters.price_max = Number(query.price_max)
        if (query.rating) filters.rating = Number(query.rating)

        if (query.supplier_countries) {
            filters.supplier_countries = Array.isArray(query.supplier_countries)
                ? query.supplier_countries.map(Number)
                : [Number(query.supplier_countries)]
        }

        if (query.features) {
            filters.features = Array.isArray(query.features)
                ? query.features.map(Number)
                : [Number(query.features)]
        }

        if (query.additional_features) {
            filters.additional_features = Array.isArray(query.additional_features)
                ? query.additional_features.map(Number)
                : [Number(query.additional_features)]
        }

        if (query.sort_by) filters.sort_by = query.sort_by
        if (query.sort_direction) filters.sort_direction = query.sort_direction
        if (query.page) filters.page = Number(query.page)
        if (query.per_page) filters.per_page = Number(query.per_page)

        return filters
    }

    // Check if filters are applied
    const hasFiltersApplied = computed(() => {
        return (
            Object.keys(currentFilters.value).filter(
                (key) => !['sort_by', 'sort_direction', 'page', 'per_page'].includes(key)
            ).length > 0
        )
    })

    const filterCounts = computed(() => ({
        categories:
            filterOptions.value?.categories?.map((c: any) => ({
                id: c.id,
                count: c.products_count || 0,
            })) || [],
    }))

    // Fetch favorites with current filters
    const fetchFavoritesWithFilters = async () => {
        const params = {
            ...currentFilters.value,
            page: currentPage.value,
            per_page: itemsPerPage.value,
        }

        await favoriteStore.fetchFavoritesWithFilters(params)

        // Fetch filter options if not loaded
        if (!filterOptions.value || Object.keys(filterOptions.value).length === 0) {
            await favoriteStore.fetchFilterOptions()
        }
    }

    const refreshFavorites = async () => {
        await fetchFavoritesWithFilters()
    }

    // Apply filters and update URL
    const handleApplyFilters = async (newFilters: any) => {
        currentFilters.value = { ...newFilters }
        currentPage.value = 1

        const query: any = { ...newFilters }

        // Clean up empty values
        Object.keys(query).forEach((key) => {
            if (
                query[key] === '' ||
                query[key] === null ||
                query[key] === undefined ||
                (Array.isArray(query[key]) && query[key].length === 0)
            ) {
                delete query[key]
            }
        })

        await router.replace({ query })
        await fetchFavoritesWithFilters()
        showFilters.value = false
    }

    // Reset filters
    const resetFilters = async () => {
        currentFilters.value = {}
        currentPage.value = 1
        await router.replace({ query: {} })
        await fetchFavoritesWithFilters()
        showFilters.value = false
    }

    // Product mapping with proper defaults
    const favoriteProducts = computed(() => {
        if (!favorites.value || favorites.value.length === 0) return []

        return favorites.value.map((product: any) => ({
            id: Number(product.product_id || product.id) || 0,
            name: String(product.name || ''),
            description: String(product.description || ''),
            price: Number(product.price) || 0,
            currency: String(product.currency || '€'),
            image: product.image || null,
            images: Array.isArray(product.images) ? product.images : [],
            rating: Number(product.rating) || 0,
            reviews_count: Number(product.reviews_count) || 0,
            supplier: product.supplier || { id: 0, name: 'Unknown' },
            supplier_id: Number(product.supplier_id) || 0,
            brand: product.brand || { id: 0, name: 'Unknown' },
            category: product.category || { id: 0, name: 'Unknown' },
            subcategory: product.subcategory || null,
            trademark: String(product.trademark || ''),
            article_number: String(product.article_number || product.articleNumber || ''),
            width: product.width || { value: 0, unit: 'cm' },
            height: product.height || { value: 0, unit: 'cm' },
            length: product.length || { value: 0, unit: 'cm' },
            weight: product.weight || { value: 0, unit: 'kg' },
            storage: product.storage || {
                temperature: null,
                humidity: null,
                conditions: [],
            },
            features: Array.isArray(product.features) ? product.features : [],
            private_label: Boolean(product.private_label_available || product.private_label),
            created_at: product.created_at,
            updated_at: product.updated_at,
            best_before_date: String(product.best_before_date || ''),
            stock: Number(product.stock) || 0,
            min_order_quantity: Number(product.min_order_quantity) || 1,
            ...product,
        })) as ProductListing[]
    })

    const sortedProducts = computed(() => favoriteProducts.value)

    const totalItems = computed(
        () => favoriteStore.favoritesMeta?.total || favoriteProducts.value.length
    )
    const totalPages = computed(
        () =>
            favoriteStore.favoritesMeta?.last_page ||
            Math.ceil(totalItems.value / itemsPerPage.value)
    )

    const paginatedProducts = computed(() => {
        if (favoriteStore.favoritesMeta?.total) {
            return favoriteProducts.value
        }

        const start = (currentPage.value - 1) * itemsPerPage.value
        const end = start + itemsPerPage.value
        return sortedProducts.value.slice(start, end)
    })

    const paginationMeta = computed(() => ({
        current_page: currentPage.value,
        per_page: itemsPerPage.value,
        total: totalItems.value,
        last_page: totalPages.value,
        from: totalItems.value > 0 ? (currentPage.value - 1) * itemsPerPage.value + 1 : 0,
        to: Math.min(currentPage.value * itemsPerPage.value, totalItems.value),
    }))

    const breadcrumbs = computed(() => [
        { label: t('home'), to: localePath('/marketplace') },
        { label: t('navigation.favorites') },
    ])

    const currentSortLabel = computed(() => {
        const currentOption = sortOptions.value.find((option) => option.value === currentSort.value)
        return currentOption?.label || t('sorting.newest')
    })

    const sortOptions = computed(() => [
        // {
        //     label: t('sorting.chooseOption'),
        //     value: '',
        //     disabled: true,
        // },
        {
            label: t('sorting.newest'),
            value: 'created_at:desc',
            disabled: false,
        },
        {
            label: t('sorting.oldest'),
            value: 'created_at:asc',
            disabled: false,
        },
        {
            label: t('sorting.highPrice'),
            value: 'price:desc',
            disabled: false,
        },
        {
            label: t('sorting.lowPrice'),
            value: 'price:asc',
            disabled: false,
        },
        {
            label: t('sorting.byReviews'),
            value: 'rating:desc',
            disabled: false,
        },
        {
            label: t('sorting.byAlphabetAZ'),
            value: 'name:asc',
            disabled: false,
        },
        {
            label: t('sorting.byAlphabetZA'),
            value: 'name:desc',
            disabled: false,
        },
    ])

    // Methods
    const handlePageChange = async (page: number) => {
        currentPage.value = page
        await fetchFavoritesWithFilters()
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleItemsPerPageChange = async (newItemsPerPage: number) => {
        itemsPerPage.value = newItemsPerPage
        currentPage.value = 1
        await fetchFavoritesWithFilters()
    }

    const onSortSelect = async (value: string) => {
        if (!value) return
        currentSort.value = value
        const [sortField, sortDirection] = value.split(':')
        currentFilters.value.sort_by = sortField
        currentFilters.value.sort_direction = sortDirection
        currentPage.value = 1
        await fetchFavoritesWithFilters()
    }

    const onViewProduct = (product: ProductListing) => {
        router.push(localePath(`/products/${product.id}`))
    }

    const onContactSupplier = (product: ProductListing) => {}

    const goToMarketplace = () => {
        router.push(localePath('/marketplace'))
    }

    // Initialize filters from URL and fetch data on mount
    onMounted(async () => {
        currentFilters.value = parseFiltersFromQuery()
        currentSort.value = `${currentFilters.value.sort_by || 'created_at'}:${currentFilters.value.sort_direction || 'desc'}`
        currentPage.value = Number(currentFilters.value.page) || 1
        itemsPerPage.value = Number(currentFilters.value.per_page) || 10

        await fetchFavoritesWithFilters()
    })

    watch(
        () => planChangeKey.value,
        async (newValue, oldValue) => {
            if (oldValue === 0 && newValue === 0) return
            // Re-fetch via PageWrapper
            await fetchFavoritesWithFilters()
        }
    )
    // Watch for URL query changes
    watch(
        () => route.query,
        () => {
            const newFilters = parseFiltersFromQuery()
            if (JSON.stringify(newFilters) !== JSON.stringify(currentFilters.value)) {
                currentFilters.value = newFilters
                currentSort.value = `${newFilters.sort_by || 'created_at'}:${newFilters.sort_direction || 'desc'}`
                currentPage.value = newFilters.page || 1
                itemsPerPage.value = newFilters.per_page || 10
                fetchFavoritesWithFilters()
            }
        }
    )
</script>

<style scoped>
    .favorites-page {
        @apply pb-20 px-4 md:px-0;
    }

    .favorites-content {
        @apply relative;
    }
</style>
