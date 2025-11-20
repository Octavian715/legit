<template>
    <div class="flex flex-col gap-3">
        <Breadcrumbs :items="breadcrumbs" />

        <div class="bg-white rounded-sm">
            <div class="p-4 space-y-3">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-gray-950 font-bold text-title2">
                            {{ t('navigation.prices') }}
                        </h1>
                        <p class="text-gray-800 text-subtitle3 mt-1">
                            {{
                                totalProducts
                                    ? t('productPrices.productsCount', { count: totalProducts })
                                    : t('productPrices.loadingProductsPrices')
                            }}
                        </p>
                    </div>
                    <div class="flex items-center gap-2">
                        <InputSearch
                            v-model.trim="searchQuery"
                            :placeholder="t('productPricesPage.searchPlaceholder')"
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
                                :aria-label="t('productPricesPage.activeFiltersIndicator')"
                            ></span>
                        </Button>
                    </div>
                </div>

                <ProductPricesTable
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
            </div>
        </div>

        <ClientOnly>
            <ProductPricesFilterDrawer
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
    import { useLocalePath, useRoute, useRouter } from '#imports'
    import { useDebounceFn } from '@vueuse/core'
    import { useToastNotification } from '~/composables/useToastNotification'
    import { useDashboardProduct } from '~/composables/useDashboardProduct'
    import { useDashboardProductStore } from '~/stores/dashboardProduct'
    import { usePriceValidation } from '~/composables/usePriceValidation'
    import { useStaticData } from '~/composables/useStaticData'
    import { useProduct } from '~/composables/useProduct'
    import type { ProductPricesFilters, ProductPricesSort } from '~/types/dashboardProduct'
    import type { SortDirection } from '~/types/ui/table'

    definePageMeta({
        middleware: ['supplier', 'price-config-required'],
        layout: 'app',
    })

    const { t } = useI18n()
    const localePath = useLocalePath()
    const route = useRoute()
    const router = useRouter()
    const toast = useToastNotification()
    const dashboardProductStore = useDashboardProductStore()
    const { getProductsWithPricesFiltered } = useDashboardProduct()
    const { validateAndNotify, userCurrencies } = usePriceValidation()
    const { initialize } = useStaticData()
    const { updatePropery } = useProduct()

    const isFilterDrawerOpen = ref(false)
    const searchQuery = ref('')
    const isHandlingAction = ref(false)
    const isFetching = ref(false)

    const activeFilters = ref<ProductPricesFilters>({
        search: '',
        brand_names: [],
        local_price_from: undefined,
        local_price_to: undefined,
        export_price_from: undefined,
        export_price_to: undefined,
        local_discount_price_from: undefined,
        local_discount_price_to: undefined,
        export_discount_price_from: undefined,
        export_discount_price_to: undefined,
    })

    // Initialize from query params
    const currentPage = ref(parseInt(route.query.page as string) || 1)
    const itemsPerPage = ref(parseInt(route.query.per_page as string) || 15)
    const sortBy = ref<ProductPricesSort | undefined>(
        (route.query.sort_by as ProductPricesSort) || undefined
    )
    const sortDirection = ref<SortDirection | undefined>(
        (route.query.sort_direction as SortDirection) || undefined
    )

    let currentRequestId = 0

    const products = computed(() => dashboardProductStore.productsWithPrices)
    const productsMeta = computed(() => dashboardProductStore.productPricesMeta)
    const isLoading = computed(() => dashboardProductStore.isLoading)
    const totalProducts = computed(() => productsMeta.value?.total || 0)
    const totalItems = computed(() => productsMeta.value?.total || 0)

    const totalPages = computed(() => {
        if (totalItems.value === 0 || itemsPerPage.value === 0) return 1
        return Math.ceil(totalItems.value / itemsPerPage.value)
    })

    const activeFiltersCount = computed(() => {
        let count = 0
        if (
            Array.isArray(activeFilters.value.brand_names) &&
            activeFilters.value.brand_names.length > 0
        )
            count++
        if (activeFilters.value.local_price_from !== undefined) count++
        if (activeFilters.value.local_price_to !== undefined) count++
        if (activeFilters.value.export_price_from !== undefined) count++
        if (activeFilters.value.export_price_to !== undefined) count++
        if (activeFilters.value.local_discount_price_from !== undefined) count++
        if (activeFilters.value.local_discount_price_to !== undefined) count++
        if (activeFilters.value.export_discount_price_from !== undefined) count++
        if (activeFilters.value.export_discount_price_to !== undefined) count++
        return count
    })

    const hasActiveFilters = computed(() => {
        return activeFiltersCount.value > 0 || searchQuery.value?.trim()?.length > 0
    })

    const breadcrumbs = computed(() => [
        { label: t('home'), to: localePath('/supplier/dashboard') },
        { label: t('navigation.products'), to: localePath('/supplier/products/overview') },
        { label: t('navigation.prices'), to: localePath('/supplier/products/prices') },
    ])

    // Update URL query
    const updateQueryParams = (params: Record<string, any>) => {
        const query: Record<string, string> = {}

        if (params.page && params.page !== 1) {
            query.page = params.page.toString()
        }

        if (params.per_page && params.per_page !== 15) {
            query.per_page = params.per_page.toString()
        }

        if (params.sort_by) {
            query.sort_by = params.sort_by
        }

        if (params.sort_direction) {
            query.sort_direction = params.sort_direction
        }

        router.replace({ query })
    }

    const transformFiltersForAPI = (filters: ProductPricesFilters): ProductPricesFilters => {
        const apiFilters: ProductPricesFilters = { ...filters }

        if (Array.isArray(filters.brand_names) && filters.brand_names.length > 0) {
            apiFilters.brand_names = filters.brand_names
        } else {
            delete apiFilters.brand_names
        }

        if (!apiFilters.search?.trim()) {
            delete apiFilters.search
        }

        const priceFields = [
            'local_price_from',
            'local_price_to',
            'export_price_from',
            'export_price_to',
            'local_discount_price_from',
            'local_discount_price_to',
            'export_discount_price_from',
            'export_discount_price_to',
        ] as const

        priceFields.forEach((field) => {
            if (apiFilters[field] === undefined || apiFilters[field] === null) {
                delete apiFilters[field]
            }
        })

        return apiFilters
    }

    const fetchProducts = async () => {
        if (isFetching.value) return false

        const requestId = ++currentRequestId

        try {
            isFetching.value = true

            if (requestId !== currentRequestId) return false

            if (currentPage.value > totalPages.value && totalPages.value > 0) {
                currentPage.value = totalPages.value
            }

            const apiFilters = transformFiltersForAPI(activeFilters.value)

            const filters: ProductPricesFilters = {
                ...apiFilters,
                page: currentPage.value,
                per_page: itemsPerPage.value,
                sort_by: sortBy.value,
                sort_direction: sortDirection.value,
            }

            // Update URL with current params
            updateQueryParams({
                page: currentPage.value,
                per_page: itemsPerPage.value,
                sort_by: sortBy.value,
                sort_direction: sortDirection.value,
            })

            const { success } = await getProductsWithPricesFiltered(filters)

            if (requestId !== currentRequestId) return false

            if (success && productsMeta.value) {
                const newTotalPages = Math.ceil(productsMeta.value.total / itemsPerPage.value)

                if (currentPage.value > newTotalPages && newTotalPages > 0) {
                    currentPage.value = newTotalPages
                    return fetchProducts()
                }
            }

            return !!success
        } catch (error: any) {
            if (requestId !== currentRequestId) return false
            console.error('Failed to fetch products with prices:', error)
            toast.error(error.message || t('productPricesPage.errors.fetchFailed'))
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
        if (currentPage.value === page || isFetching.value) return

        const maxPage = Math.max(1, totalPages.value)
        const validPage = Math.max(1, Math.min(page, maxPage))

        currentPage.value = validPage
        nextTick(() => {
            fetchProducts()
        })
    }

    const handleItemsPerPageChange = (newItemsPerPage: number) => {
        if (itemsPerPage.value === newItemsPerPage || isFetching.value) return

        itemsPerPage.value = newItemsPerPage
        currentPage.value = 1
        nextTick(() => {
            fetchProducts()
        })
    }

    const handleSortChange = (
        field: ProductPricesSort | undefined,
        direction: 'asc' | 'desc' | undefined
    ) => {
        if (isFetching.value) return

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
                toast.error(t('productPricesPage.errors.productNotFound'))
                return
            }

            switch (action.type) {
                case 'update-prices': {
                    const priceLocal = action?.value?.local || {}
                    const priceExport = action?.value?.export || {}

                    const localCurrency = userCurrencies.value.local
                    const exportCurrency = userCurrencies.value.export

                    if (localCurrency && priceLocal?.currency?.code !== localCurrency.code) {
                        toast.error(
                            t('productPricesPage.errors.localCurrencyMismatch', {
                                expected: localCurrency.code,
                                provided: priceLocal?.currency?.code,
                            })
                        )
                        return
                    }

                    if (exportCurrency && priceExport?.currency?.code !== exportCurrency.code) {
                        toast.error(
                            t('productPricesPage.errors.exportCurrencyMismatch', {
                                expected: exportCurrency.code,
                                provided: priceExport?.currency?.code,
                            })
                        )
                        return
                    }

                    const prices = [
                        {
                            currency_id: localCurrency?.id,
                            price: priceLocal?.price,
                            price_type: 'local',
                        },
                    ]

                    if (exportCurrency && priceExport?.price) {
                        prices.push({
                            currency_id: exportCurrency?.id,
                            price: priceExport?.price,
                            price_type: 'export',
                        })
                    }

                    const success = await updatePropery(product.product_id, {
                        prices: [...prices],
                    })

                    if (success) {
                        toast.success(t('productPricesPage.pricesUpdated'))
                        await fetchProducts()
                    }
                    break
                }

                default:
                    console.warn('Unknown product action type:', action.type)
            }
        } catch (error: any) {
            console.error('Product action error:', error)
            toast.error(error.message || t('productPricesPage.errors.actionFailed'))
        } finally {
            isHandlingAction.value = false
        }
    }

    const openFilters = () => {
        isFilterDrawerOpen.value = true
    }

    const handleApplyFilters = (filters: ProductPricesFilters) => {
        searchQuery.value = filters.search || ''

        activeFilters.value = {
            search: filters.search || '',
            brand_names: Array.isArray(filters.brand_names) ? filters.brand_names : [],
            local_price_from: filters.local_price_from,
            local_price_to: filters.local_price_to,
            export_price_from: filters.export_price_from,
            export_price_to: filters.export_price_to,
            local_discount_price_from: filters.local_discount_price_from,
            local_discount_price_to: filters.local_discount_price_to,
            export_discount_price_from: filters.export_discount_price_from,
            export_discount_price_to: filters.export_discount_price_to,
        }

        isFilterDrawerOpen.value = false
        currentPage.value = 1
        debouncedFetch()
    }

    const resetFilters = () => {
        searchQuery.value = ''
        activeFilters.value = {
            search: '',
            brand_names: [],
            local_price_from: undefined,
            local_price_to: undefined,
            export_price_from: undefined,
            export_price_to: undefined,
            local_discount_price_from: undefined,
            local_discount_price_to: undefined,
            export_discount_price_from: undefined,
            export_discount_price_to: undefined,
        }

        currentPage.value = 1

        if (isFilterDrawerOpen.value) {
            isFilterDrawerOpen.value = false
        }

        debouncedFetch()
    }

    onMounted(() => {
        nextTick(async () => {
            if (!validateAndNotify()) return
            await initialize()
            await fetchProducts()
        })
    })
</script>
