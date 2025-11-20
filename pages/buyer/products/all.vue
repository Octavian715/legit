<template>
    <div class="flex flex-col gap-3">
        <Breadcrumbs :items="breadcrumbs" />

        <div class="bg-white rounded-sm">
            <div class="p-4 space-y-3">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-gray-950 font-bold text-title2">
                            {{ t('navigation.allProducts') }}
                        </h1>
                        <p class="text-gray-800 text-subtitle3 mt-1">
                            {{ totalProducts ? t('products', totalProducts) : t('loading') }}
                        </p>
                    </div>
                    <div class="flex items-center gap-2">
                        <InputSearch
                            v-model.trim="searchQuery"
                            :placeholder="t('allProductsPage.searchPlaceholder')"
                            size="md"
                            background="bg-gray-150 hidden md:block"
                            container-classes="rounded-sm"
                            @search="handleSearchInput"
                            @clear="handleSearchClear"
                        />
                        <Button
                            variant="ghost"
                            color="gray"
                            size="lg"
                            square
                            container-classes="!p-1 relative"
                            :tooltip="t('filters.title')"
                            @click="openFilters"
                        >
                            <svg class="w-4 h-4 flex-1">
                                <use xlink:href="/sprite.svg#filter" />
                            </svg>
                            <span
                                v-if="hasActiveFilters"
                                class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"
                                :aria-label="t('allProductsPage.activeFiltersIndicator')"
                            ></span>
                        </Button>
                    </div>
                </div>

                <ClientOnly>
                    <AllProductsTableBuyer
                        :products="products"
                        :meta="productsMeta"
                        :loading="isLoading"
                        :show-pagination="canLoadMore.products || totalItems > itemsPerPage"
                        :current-page="currentPage"
                        :items-per-page="itemsPerPage"
                        :sort-by="sortBy"
                        :sort-direction="sortDirection"
                        @page-change="handlePageChange"
                        @items-per-page-change="handleItemsPerPageChange"
                        @sort-change="handleSortChange"
                    />
                </ClientOnly>
            </div>
        </div>

        <ClientOnly>
            <AllProductsFilterDrawerBuyer
                :is-open="isFilterDrawerOpen"
                :filters="activeFilters"
                @update:is-open="isFilterDrawerOpen = $event"
                @apply="handleApplyFilters"
                @reset="resetFilters"
            />
        </ClientOnly>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted, nextTick, watch } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useLocalePath } from '#imports'
    import { useDebounceFn } from '@vueuse/core'
    import { useToastNotification } from '~/composables/useToastNotification'
    import { useDashboardProductStore } from '~/stores/dashboardProduct'
    import type { AllProductsFilters } from '~/types/dashboardProduct'
    import type { SortDirection } from '~/types/ui/table'

    definePageMeta({
        middleware: ['buyer'],
        layout: 'app',
    })

    const { t } = useI18n()
    const localePath = useLocalePath()
    const toast = useToastNotification()
    const dashboardProductStore = useDashboardProductStore()

    const isFilterDrawerOpen = ref(false)
    const refreshKey = ref(0)
    const searchQuery = ref('')

    const activeFilters = ref<AllProductsFilters>({
        search: '',
        brand_names: [],
        category_ids: [],
        status_ids: [],
        start_date: undefined,
        end_date: undefined,
        amount_from: undefined,
        amount_to: undefined,
    })

    const totalProducts = computed(() => dashboardProductStore.allBuyerProductsMeta?.total || 0)
    const totalItems = computed(() => dashboardProductStore.allBuyerProductsMeta?.total || 0)
    const totalPages = computed(() => {
        if (totalItems.value === 0 || itemsPerPage.value === 0) return 1
        return Math.ceil(totalItems.value / itemsPerPage.value)
    })

    const currentPage = ref(1)
    const itemsPerPage = ref(15)
    const sortBy = ref<string | undefined>(undefined)
    const sortDirection = ref<SortDirection | undefined>(undefined)
    const isFetching = ref(false)

    let currentRequestId = 0

    const canLoadMore = computed(() => ({
        products: currentPage.value < totalPages.value,
    }))

    const products = computed(() => dashboardProductStore.allBuyerProducts)
    const productsMeta = computed(() => dashboardProductStore.allBuyerProductsMeta)
    const isLoading = computed(() => dashboardProductStore.isLoading)

    const activeFiltersCount = computed(() => {
        let count = 0

        if (
            Array.isArray(activeFilters.value.brand_names) &&
            activeFilters.value.brand_names.length > 0
        )
            count++
        if (
            Array.isArray(activeFilters.value.category_ids) &&
            activeFilters.value.category_ids.length > 0
        )
            count++
        if (
            Array.isArray(activeFilters.value.status_ids) &&
            activeFilters.value.status_ids.length > 0
        )
            count++
        if (activeFilters.value.start_date || activeFilters.value.end_date) count++
        if (
            activeFilters.value.amount_from !== undefined ||
            activeFilters.value.amount_to !== undefined
        )
            count++

        return count
    })

    const hasActiveFilters = computed(() => {
        return activeFiltersCount.value > 0 || searchQuery.value?.trim()?.length > 0
    })

    const breadcrumbs = computed(() => [
        { label: t('home'), to: localePath('/buyer/dashboard') },
        { label: t('navigation.products'), to: localePath('/buyer/products/overview') },
        { label: t('navigation.allProducts'), to: localePath('/buyer/products/all') },
    ])

    const transformFiltersForAPI = (filters: AllProductsFilters): AllProductsFilters => {
        const apiFilters: AllProductsFilters = { ...filters }

        if (Array.isArray(filters.brand_names) && filters.brand_names.length > 0) {
            apiFilters.brand_names = filters.brand_names
        } else {
            delete apiFilters.brand_names
        }

        if (Array.isArray(filters.category_ids) && filters.category_ids.length > 0) {
            apiFilters.category_ids = filters.category_ids
        } else {
            delete apiFilters.category_ids
        }

        if (Array.isArray(filters.status_ids) && filters.status_ids.length > 0) {
            apiFilters.status_ids = filters.status_ids
        } else {
            delete apiFilters.status_ids
        }

        if (!apiFilters.search?.trim()) {
            delete apiFilters.search
        }

        if (!apiFilters.start_date) {
            delete apiFilters.start_date
        }

        if (!apiFilters.end_date) {
            delete apiFilters.end_date
        }

        if (apiFilters.amount_from === undefined || apiFilters.amount_from === null) {
            delete apiFilters.amount_from
        }

        if (apiFilters.amount_to === undefined || apiFilters.amount_to === null) {
            delete apiFilters.amount_to
        }

        return apiFilters
    }

    const fetchProducts = async () => {
        if (isFetching.value) {
            return false
        }

        const requestId = ++currentRequestId

        try {
            isFetching.value = true

            if (requestId !== currentRequestId) {
                return false
            }

            if (currentPage.value > totalPages.value && totalPages.value > 0) {
                currentPage.value = totalPages.value
            }

            const apiFilters = transformFiltersForAPI(activeFilters.value)

            const filters: AllProductsFilters = {
                ...apiFilters,
                page: currentPage.value,
                per_page: itemsPerPage.value,
                sort_by: sortBy.value,
                sort_direction: sortDirection.value,
            }

            await dashboardProductStore.fetchAllBuyerProducts(filters)

            if (requestId !== currentRequestId) {
                return false
            }

            if (productsMeta.value?.total !== undefined) {
                const newTotalPages = Math.ceil(productsMeta.value.total / itemsPerPage.value) || 1
                if (currentPage.value > newTotalPages && newTotalPages > 0) {
                    currentPage.value = newTotalPages
                    return fetchProducts()
                }
            }

            return true
        } catch (error: any) {
            if (requestId !== currentRequestId) {
                return false
            }

            console.error('Failed to fetch buyer products:', error)
            toast.error(error.message || t('allProductsPage.errors.fetchFailed'))
            return false
        } finally {
            if (requestId === currentRequestId) {
                isFetching.value = false
            }
        }
    }

    const debouncedFetch = useDebounceFn(fetchProducts, 300)

    const handleSearchInput = (value: string) => {
        searchQuery.value = value?.trim() || ''
        activeFilters.value.search = searchQuery.value
        currentPage.value = 1
        debouncedFetch()
    }

    const handleSearchClear = () => {
        searchQuery.value = ''
        activeFilters.value.search = ''
        currentPage.value = 1
        debouncedFetch()
    }

    const handlePageChange = (page: number) => {
        if (currentPage.value === page || isFetching.value) {
            return
        }

        const maxPage = Math.max(1, totalPages.value)
        const validPage = Math.max(1, Math.min(page, maxPage))

        currentPage.value = validPage
        nextTick(() => {
            fetchProducts()
        })
    }

    const handleItemsPerPageChange = (newItemsPerPage: number) => {
        if (itemsPerPage.value === newItemsPerPage || isFetching.value) {
            return
        }

        itemsPerPage.value = newItemsPerPage
        currentPage.value = 1
        nextTick(() => {
            fetchProducts()
        })
    }

    const handleSortChange = (field: string | undefined, direction: 'asc' | 'desc' | undefined) => {
        if (isFetching.value) {
            return
        }

        if (!field || direction === undefined) {
            sortBy.value = undefined
            sortDirection.value = undefined
        } else {
            sortBy.value = field
            sortDirection.value = direction
        }

        currentPage.value = 1
        nextTick(() => {
            fetchProducts()
        })
    }

    const openFilters = () => {
        isFilterDrawerOpen.value = true
    }

    const handleApplyFilters = (filters: AllProductsFilters) => {
        searchQuery.value = filters.search || ''

        activeFilters.value = {
            search: filters.search || '',
            brand_names: Array.isArray(filters.brand_names) ? filters.brand_names : [],
            category_ids: Array.isArray(filters.category_ids) ? filters.category_ids : [],
            status_ids: Array.isArray(filters.status_ids) ? filters.status_ids : [],
            start_date: filters.start_date,
            end_date: filters.end_date,
            amount_from: filters.amount_from,
            amount_to: filters.amount_to,
        }

        isFilterDrawerOpen.value = false
        currentPage.value = 1
        refreshKey.value++
        debouncedFetch()
    }

    const resetFilters = () => {
        searchQuery.value = ''
        activeFilters.value = {
            search: '',
            brand_names: [],
            category_ids: [],
            status_ids: [],
            start_date: undefined,
            end_date: undefined,
            amount_from: undefined,
            amount_to: undefined,
        }

        currentPage.value = 1
        refreshKey.value++

        if (isFilterDrawerOpen.value) {
            isFilterDrawerOpen.value = false
        }

        debouncedFetch()
    }

    watch(
        () => refreshKey.value,
        () => {
            fetchProducts()
        }
    )

    onMounted(() => {
        nextTick(() => {
            fetchProducts()
        })
    })
</script>
