<template>
    <div class="flex flex-col gap-3">
        <Breadcrumbs :items="breadcrumbs" />

        <div class="bg-white rounded-sm">
            <div class="p-4 space-y-3">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-gray-950 font-bold text-title2">
                            {{ t('navigation.features') }}
                        </h1>
                        <p class="text-gray-800 text-subtitle3 mt-1">
                            {{
                                totalProducts
                                    ? t('productFeatures.productsCount', { count: totalProducts })
                                    : t('productFeatures.loadingProductsFeatures')
                            }}
                        </p>
                    </div>
                    <div class="flex items-center gap-2">
                        <InputSearch
                            v-model.trim="searchQuery"
                            :placeholder="t('productFeaturesPage.searchPlaceholder')"
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
                                :aria-label="t('productFeaturesPage.activeFiltersIndicator')"
                            ></span>
                        </Button>
                    </div>
                </div>

                <ClientOnly>
                    <ProductFeaturesTable
                        :products="products"
                        :meta="productsMeta"
                        :loading="isLoading"
                        show-pagination
                        :current-page="currentPage"
                        :items-per-page="itemsPerPage"
                        :sort-by="sortBy"
                        :sort-direction="sortDirection"
                        @page-change="handlePageChange"
                        @items-per-page-change="handleItemsPerPageChange"
                        @sort-change="handleSortChange"
                        @action="handleTableAction"
                    />
                </ClientOnly>
            </div>
        </div>

        <ClientOnly>
            <ProductFeaturesFilterDrawer
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
    import { useDashboardProduct } from '~/composables/useDashboardProduct'
    import { useDashboardProductStore } from '~/stores/dashboardProduct'
    import type { ProductFeaturesFilters, ProductFeaturesSort } from '~/types/dashboardProduct'
    import type { SortDirection } from '~/types/ui/table'
    import { useStaticData } from '~/composables/useStaticData'
    import { useProduct } from '~/composables/useProduct'

    definePageMeta({ middleware: ['supplier', 'price-config-required'], layout: 'app' })

    const { t } = useI18n()
    const localePath = useLocalePath()
    const toast = useToastNotification()
    const dashboardProductStore = useDashboardProductStore()
    const { getProductsWithFeaturesFiltered } = useDashboardProduct()
    const { initialize } = useStaticData()
    const { updatePropery } = useProduct()

    const isFilterDrawerOpen = ref(false)
    const refreshKey = ref(0)
    const searchQuery = ref('')

    const activeFilters = ref<ProductFeaturesFilters>({
        search: '',
        brand_names: [],
        category_ids: [],
        feature_ids: [],
        has_features: undefined,
        start_date: undefined,
        end_date: undefined,
    })

    const totalProducts = computed(() => dashboardProductStore.productFeaturesMeta?.total || 0)
    const totalItems = computed(() => dashboardProductStore.productFeaturesMeta?.total || 0)
    const totalPages = computed(() => {
        if (totalItems.value === 0 || itemsPerPage.value === 0) return 1
        return Math.ceil(totalItems.value / itemsPerPage.value)
    })

    const currentPage = ref(1)
    const itemsPerPage = ref(15)
    const sortBy = ref<ProductFeaturesSort | undefined>(undefined)
    const sortDirection = ref<SortDirection | undefined>(undefined)
    const isHandlingAction = ref(false)
    const isFetching = ref(false)

    let currentRequestId = 0

    const products = computed(() => dashboardProductStore.productsWithFeatures)
    const productsMeta = computed(() => dashboardProductStore.productFeaturesMeta)
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
            Array.isArray(activeFilters.value.feature_ids) &&
            activeFilters.value.feature_ids.length > 0
        )
            count++
        if (activeFilters.value.has_features !== undefined) count++
        if (activeFilters.value.start_date !== undefined) count++
        if (activeFilters.value.end_date !== undefined) count++

        return count
    })

    const hasActiveFilters = computed(() => {
        return activeFiltersCount.value > 0 || searchQuery.value?.trim()?.length > 0
    })

    const breadcrumbs = computed(() => [
        { label: t('home'), to: localePath('/supplier/dashboard') },
        { label: t('navigation.products'), to: localePath('/supplier/products/overview') },
        { label: t('navigation.features'), to: localePath('/supplier/products/features') },
    ])

    const transformFiltersForAPI = (filters: ProductFeaturesFilters): ProductFeaturesFilters => {
        const apiFilters: ProductFeaturesFilters = { ...filters }

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

        if (Array.isArray(filters.feature_ids) && filters.feature_ids.length > 0) {
            apiFilters.feature_ids = filters.feature_ids
        } else {
            delete apiFilters.feature_ids
        }

        if (!apiFilters.search?.trim()) {
            delete apiFilters.search
        }

        if (filters.has_features === true) {
            apiFilters.has_features = 1
        } else if (filters.has_features === false) {
            apiFilters.has_features = 0
        } else {
            delete apiFilters.has_features
        }

        if (!apiFilters.start_date) {
            delete apiFilters.start_date
        }

        if (!apiFilters.end_date) {
            delete apiFilters.end_date
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

            const filters: ProductFeaturesFilters = {
                ...apiFilters,
                page: currentPage.value,
                per_page: itemsPerPage.value,
                sort_by: sortBy.value,
                sort_direction: sortDirection.value,
            }

            const success = await getProductsWithFeaturesFiltered(filters)

            if (requestId !== currentRequestId) {
                return false
            }

            if (success && productsMeta.value?.total !== undefined) {
                const newTotalPages = Math.ceil(productsMeta.value.total / itemsPerPage.value) || 1
                if (currentPage.value > newTotalPages && newTotalPages > 0) {
                    currentPage.value = newTotalPages
                    return fetchProducts()
                }
            }

            return !!success
        } catch (error: any) {
            if (requestId !== currentRequestId) {
                return false
            }

            console.error('Failed to fetch products with features:', error)
            toast.error(error.message || t('productFeaturesPage.errors.fetchFailed'))
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

    const handleSortChange = (
        field: ProductFeaturesSort | undefined,
        direction: 'asc' | 'desc' | undefined
    ) => {
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

    const handleTableAction = async (action: { type: string; row: any; value?: any }) => {
        if (isHandlingAction.value) return

        try {
            isHandlingAction.value = true
            const product = products.value.find(
                (item: any) => item.product_id === Number(action?.row?.product_id)
            )

            if (!product) {
                toast.error(t('productFeaturesPage.errors.productNotFound'))
                return
            }

            switch (action.type) {
                case 'update-discounts':
                    const discounts = []

                    if (action?.value?.local) {
                        discounts.push({
                            price_type: 'local',
                            percentage: action.value.local.percentage,
                            start_date: action.value.local.start_date,
                            end_date: action.value.local.end_date,
                        })
                    }

                    if (action?.value?.export) {
                        discounts.push({
                            price_type: 'export',
                            percentage: action.value.export.percentage,
                            start_date: action.value.export.start_date,
                            end_date: action.value.export.end_date,
                        })
                    }

                    const success = await updatePropery(product.product_id, {
                        discounts: discounts,
                    })

                    if (success) {
                        toast.success(t('productFeaturesPage.discountsUpdated'))
                        await fetchProducts()
                    }
                    break

                default:
                    console.warn('Unknown product action type:', action.type)
            }
        } catch (error: any) {
            console.error('Product action error:', error)
            toast.error(error.message || t('productFeaturesPage.errors.actionFailed'))
        } finally {
            isHandlingAction.value = false
        }
    }

    const openFilters = () => {
        isFilterDrawerOpen.value = true
    }

    const handleApplyFilters = (filters: ProductFeaturesFilters) => {
        searchQuery.value = filters.search || ''

        activeFilters.value = {
            search: filters.search || '',
            brand_names: Array.isArray(filters.brand_names) ? filters.brand_names : [],
            category_ids: Array.isArray(filters.category_ids) ? filters.category_ids : [],
            feature_ids: Array.isArray(filters.feature_ids) ? filters.feature_ids : [],
            has_features: filters.has_features,
            start_date: filters.start_date,
            end_date: filters.end_date,
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
            feature_ids: [],
            has_features: undefined,
            start_date: undefined,
            end_date: undefined,
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
            initialize()
            fetchProducts()
        })
    })
</script>
